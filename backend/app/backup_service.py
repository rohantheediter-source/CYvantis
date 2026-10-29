import os
import shutil
import sqlite3
import datetime
from sqlalchemy.orm import Session

from app.config import settings
from app.models import BackupRecord, AuditLog

def ensure_backup_dir():
    os.makedirs(settings.BACKUP_DIR, exist_ok=True)

def create_sqlite_backup(db: Session, created_by: str = "system", is_automated: bool = False) -> BackupRecord:
    """Perform atomic, consistent SQLite database backup using sqlite3 backup API"""
    ensure_backup_dir()
    
    timestamp_str = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"cyvantis_backup_{timestamp_str}.db"
    dest_path = os.path.join(settings.BACKUP_DIR, filename)

    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    if not os.path.exists(db_path):
        # Fallback if in memory or relative path issues
        db_path = "./cyvantis.db"

    try:
        # Use sqlite3 online backup API to guarantee consistency even during writes
        src_conn = sqlite3.connect(db_path)
        dest_conn = sqlite3.connect(dest_path)
        with dest_conn:
            src_conn.backup(dest_conn)
        dest_conn.close()
        src_conn.close()

        file_size = os.path.getsize(dest_path)
        status_str = "success"
    except Exception as e:
        filename = f"FAILED_{filename}"
        file_size = 0
        status_str = f"failed: {str(e)}"

    record = BackupRecord(
        timestamp=datetime.datetime.utcnow(),
        filename=filename,
        file_size_bytes=file_size,
        status=status_str,
        is_automated=is_automated,
        created_by=created_by
    )
    db.add(record)
    
    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        username=created_by,
        action="BACKUP_CREATED",
        resource="Storage",
        details=f"Backup file created: {filename} ({file_size} bytes)"
    )
    db.add(audit)
    db.commit()
    db.refresh(record)
    return record

def restore_sqlite_backup(db: Session, filename: str, username: str) -> bool:
    """Restore SQLite database from backup file"""
    backup_path = os.path.join(settings.BACKUP_DIR, filename)
    if not os.path.exists(backup_path):
        raise FileNotFoundError(f"Backup file {filename} not found in {settings.BACKUP_DIR}")

    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    if not os.path.exists(db_path):
        db_path = "./cyvantis.db"

    # Close current connections before replacing file
    src_conn = sqlite3.connect(backup_path)
    dest_conn = sqlite3.connect(db_path)
    with dest_conn:
        src_conn.backup(dest_conn)
    dest_conn.close()
    src_conn.close()

    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        username=username,
        action="DATABASE_RESTORED",
        resource="Storage",
        details=f"Database restored from backup: {filename}"
    )
    db.add(audit)
    db.commit()
    return True

def purge_old_backups(db: Session, retention_days: int = 90) -> int:
    """Purge backups older than retention_days"""
    ensure_backup_dir()
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=retention_days)
    old_records = db.query(BackupRecord).filter(BackupRecord.timestamp < cutoff).all()

    deleted_count = 0
    for rec in old_records:
        file_path = os.path.join(settings.BACKUP_DIR, rec.filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        db.delete(rec)
        deleted_count += 1

    db.commit()
    return deleted_count
