"""Admin API Router."""
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.dependencies import require_admin
from app.models.models import User, Transaction, AuditLog

router = APIRouter()

@router.get("/dashboard", dependencies=[Depends(require_admin)])
async def admin_dashboard(db: AsyncSession = Depends(get_db)):
    user_count = await db.execute(select(func.count()).select_from(User).where(User.deleted_at.is_(None)))
    txn_count = await db.execute(select(func.count()).select_from(Transaction))
    audit_count = await db.execute(select(func.count()).select_from(AuditLog))
    return {
        "total_users": user_count.scalar_one(),
        "total_transactions": txn_count.scalar_one(),
        "total_audit_events": audit_count.scalar_one(),
        "system_status": "healthy",
        "api_version": "1.0.0",
    }

@router.get("/audit-logs", dependencies=[Depends(require_admin)])
async def get_audit_logs(skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit))
    logs = result.scalars().all()
    return {"logs": [{"id": str(l.id), "user_id": str(l.user_id) if l.user_id else None, "action": l.action, "resource_type": l.resource_type, "ip_address": l.ip_address, "severity": l.severity, "created_at": l.created_at.isoformat()} for l in logs]}
