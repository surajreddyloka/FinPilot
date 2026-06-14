"""Notifications API Router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.models import Notification, NotificationStatus, User

router = APIRouter()

@router.get("")
async def list_notifications(
    unread_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.status != NotificationStatus.read)
    query = query.order_by(Notification.created_at.desc()).limit(50)
    result = await db.execute(query)
    notifications = result.scalars().all()
    return {"notifications": [{"id": str(n.id), "title": n.title, "body": n.body, "type": n.notification_type, "status": n.status.value, "created_at": n.created_at.isoformat()} for n in notifications], "unread_count": sum(1 for n in notifications if n.status != NotificationStatus.read)}

@router.patch("/{notification_id}/read")
async def mark_read(notification_id, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    from datetime import datetime, timezone
    from uuid import UUID
    await db.execute(update(Notification).where(Notification.id == UUID(notification_id), Notification.user_id == current_user.id).values(status=NotificationStatus.read, read_at=datetime.now(timezone.utc)))
    return {"success": True}

@router.patch("/mark-all-read")
async def mark_all_read(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    from datetime import datetime, timezone
    await db.execute(update(Notification).where(Notification.user_id == current_user.id, Notification.status != NotificationStatus.read).values(status=NotificationStatus.read, read_at=datetime.now(timezone.utc)))
    return {"success": True}
