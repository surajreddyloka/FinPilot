import uuid
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Notification, NotificationType, NotificationStatus
from app.websockets.manager import manager

class NotificationEngine:
    """
    Handles the creation and distribution of in-app notifications and real-time alerts.
    """
    
    @staticmethod
    async def create_notification(
        db: AsyncSession,
        user_id: uuid.UUID,
        title: str,
        body: str,
        type: NotificationType,
        action_url: Optional[str] = None
    ) -> Notification:
        """
        Creates a notification in the database and broadcasts it via WebSocket if the user is online.
        """
        # Save to DB
        notification = Notification(
            user_id=user_id,
            title=title,
            body=body,
            notification_type=type,
            action_url=action_url,
            status=NotificationStatus.unread
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)

        # Broadcast via WebSocket
        message = {
            "type": "NEW_NOTIFICATION",
            "data": {
                "id": str(notification.id),
                "title": notification.title,
                "body": notification.body,
                "notification_type": notification.notification_type.value,
                "action_url": notification.action_url,
                "created_at": notification.created_at.isoformat()
            }
        }
        await manager.send_personal_message(message, str(user_id))

        return notification

    @staticmethod
    async def notify_anomaly_detected(db: AsyncSession, user_id: uuid.UUID, transaction_name: str, amount: float):
        """Sends an alert for an anomalous transaction."""
        await NotificationEngine.create_notification(
            db=db,
            user_id=user_id,
            title="Suspicious Activity Detected",
            body=f"We noticed an unusually large transaction: {transaction_name} for ${amount:.2f}. Please review.",
            type=NotificationType.alert,
            action_url="/transactions?filter=anomaly"
        )

    @staticmethod
    async def notify_budget_exceeded(db: AsyncSession, user_id: uuid.UUID, category: str):
        """Sends an alert when a budget limit is reached."""
        await NotificationEngine.create_notification(
            db=db,
            user_id=user_id,
            title="Budget Limit Reached",
            body=f"You have reached 100% of your budget for {category}.",
            type=NotificationType.budget,
            action_url="/budgets"
        )

    @staticmethod
    async def notify_goal_milestone(db: AsyncSession, user_id: uuid.UUID, goal_name: str, percent: int):
        """Sends an alert when a goal reaches a milestone."""
        await NotificationEngine.create_notification(
            db=db,
            user_id=user_id,
            title="Goal Milestone!",
            body=f"Congratulations! You've reached {percent}% of your {goal_name} goal.",
            type=NotificationType.goal,
            action_url="/goals"
        )
