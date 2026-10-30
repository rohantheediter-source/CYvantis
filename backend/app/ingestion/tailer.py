"""
Incremental, restart-safe reader for append-only JSON-lines log files.

* The byte offset of the last fully-read line is persisted in `ingestion_checkpoints`,
  so a restart resumes where it stopped (no re-ingestion).
* Rotation / truncation is detected when the file identity (device+inode) changes or the
  file becomes smaller than the stored offset; reading then restarts at offset 0.
  Limitation: lines appended to the old file after our last poll but before rotation are
  not read (the rotated file is not followed).
* An incomplete trailing line (writer mid-flush) is left for the next poll.
* Over-long lines are skipped and counted as rejected.
"""
import datetime
import logging
import os
from dataclasses import dataclass, field
from typing import List, Tuple

from sqlalchemy.orm import Session

from app.models import IngestionCheckpoint

logger = logging.getLogger("cyvantis.ingestion")


@dataclass
class TailResult:
    lines: List[Tuple[int, str]] = field(default_factory=list)  # (byte offset, text)
    oversized: int = 0
    rotated: bool = False
    status: str = "active"
    error: str = ""


def _file_identity(st: os.stat_result) -> str:
    return f"{st.st_dev}:{st.st_ino}"


def get_checkpoint(db: Session, source_name: str, path: str) -> IngestionCheckpoint:
    cp = db.query(IngestionCheckpoint).filter(IngestionCheckpoint.source_name == source_name).first()
    if cp is None:
        cp = IngestionCheckpoint(source_name=source_name, path=path, offset=0, status="unknown")
        db.add(cp)
        db.flush()
    return cp


def read_new_lines(cp: IngestionCheckpoint, path: str, max_lines: int, max_line_bytes: int) -> TailResult:
    """Reads complete new lines from `path` starting at cp.offset and advances cp.offset in-memory."""
    result = TailResult()
    cp.last_read_at = datetime.datetime.utcnow()
    try:
        st = os.stat(path)
    except FileNotFoundError:
        result.status = "waiting_for_file"
        return result
    except OSError as exc:
        result.status, result.error = "error", f"stat failed: {exc.strerror or type(exc).__name__}"
        return result

    identity = _file_identity(st)
    offset = cp.offset or 0
    if cp.file_id and cp.file_id != identity:
        result.rotated, offset = True, 0
    elif st.st_size < offset:
        result.rotated, offset = True, 0  # truncated in place
    cp.file_id = identity
    cp.path = path

    try:
        with open(path, "rb") as fh:
            fh.seek(offset)
            while len(result.lines) < max_lines:
                start = fh.tell()
                raw = fh.readline(max_line_bytes + 1)
                if not raw:
                    break
                if not raw.endswith(b"\n"):
                    if len(raw) > max_line_bytes:
                        # Skip the remainder of the oversized line
                        result.oversized += 1
                        while raw and not raw.endswith(b"\n"):
                            raw = fh.readline(max_line_bytes + 1)
                        offset = fh.tell()
                        continue
                    break  # incomplete trailing line; wait for the writer
                offset = fh.tell()
                text = raw.decode("utf-8", errors="replace").strip()
                if text:
                    result.lines.append((start, text))
    except PermissionError:
        result.status, result.error = "error", "permission denied reading log file"
        return result
    except OSError as exc:
        result.status, result.error = "error", f"read failed: {exc.strerror or type(exc).__name__}"
        return result

    cp.offset = offset
    return result
