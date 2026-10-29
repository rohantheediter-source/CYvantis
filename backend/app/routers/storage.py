import os
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BackupRecord, User, AuditLog
from app.schemas import BackupRecordResponse
from app.security import get_current_user, require_roles
from app.config import settings
from app import backup_service

router = APIRouter(prefix="/storage", tags=["Storage & Backups"])

@router.get("/status")
def get_storage_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    if not os.path.exists(db_path):
        db_path = "./cyvantis.db"

    db_size_bytes = os.path.getsize(db_path) if os.path.exists(db_path) else 0

    backup_dir = settings.BACKUP_DIR
    backup_count = 0
    total_backup_size = 0
    if os.path.exists(backup_dir):
        files = os.listdir(backup_dir)
        backup_count = len(files)
        total_backup_size = sum(os.path.getsize(os.path.join(backup_dir, f)) for f in files if os.path.isfile(os.path.join(backup_dir, f)))

    last_backup = db.query(BackupRecord).filter(BackupRecord.status == "success").order_by(BackupRecord.timestamp.desc()).first()

    return {
        "db_filename": os.path.basename(db_path),
        "db_size_mb": round(db_size_bytes / (1024 * 1024), 2),
        "db_size_bytes": db_size_bytes,
        "backup_count": backup_count,
        "backup_size_mb": round(total_backup_size / (1024 * 1024), 2),
        "last_successful_backup": last_backup.timestamp.isoformat() if last_backup else None,
        "last_backup_file": last_backup.filename if last_backup else None,
        "retention_days": settings.RETENTION_DAYS,
        "storage_health": "Healthy",
        "warnings": []
    }

@router.get("/backups", response_model=List[BackupRecordResponse])
def get_backup_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(BackupRecord).order_by(BackupRecord.timestamp.desc()).all()

@router.post("/backups", response_model=BackupRecordResponse)
def trigger_manual_backup(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    record = backup_service.create_sqlite_backup(db, created_by=current_user.username, is_automated=False)
    return record

@router.get("/backups/{filename}/download")
def download_backup_file(
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    file_path = os.path.join(settings.BACKUP_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Backup file not found")

    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=current_user.id,
        username=current_user.username,
        action="BACKUP_DOWNLOADED",
        resource="Storage",
        details=f"Downloaded backup snapshot: {filename}"
    )
    db.add(audit)
    db.commit()

    return FileResponse(file_path, media_type="application/octet-stream", filename=filename)

@router.post("/backups/{filename}/restore")
def restore_backup(
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    try:
        backup_service.restore_sqlite_backup(db, filename, current_user.username)
        return {"message": f"Successfully restored SQLite database from {filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database restore failed: {str(e)}")

@router.post("/purge")
def purge_old_data(
    retention_days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    purged_backups = backup_service.purge_old_backups(db, retention_days)
    return {"message": f"Purged backup records older than {retention_days} days. Deleted {purged_backups} file(s)."}
