"""
FinPilot AI — User Repository
Data access layer for User model.
"""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import User, UserRole


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email, User.deleted_at.is_(None)))
        return result.scalar_one_or_none()

    async def get_by_google_id(self, google_id: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.google_id == google_id))
        return result.scalar_one_or_none()

    async def get_by_github_id(self, github_id: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.github_id == github_id))
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> User:
        user = User(**kwargs)
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def update(self, user_id: UUID, **kwargs) -> Optional[User]:
        await self.db.execute(update(User).where(User.id == user_id).values(**kwargs))
        return await self.get_by_id(user_id)

    async def list_users(self, skip: int = 0, limit: int = 50, role: Optional[UserRole] = None) -> List[User]:
        query = select(User).where(User.deleted_at.is_(None))
        if role:
            query = query.where(User.role == role)
        query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count(self) -> int:
        from sqlalchemy import func
        result = await self.db.execute(select(func.count()).select_from(User).where(User.deleted_at.is_(None)))
        return result.scalar_one()

    async def soft_delete(self, user_id: UUID) -> None:
        from datetime import datetime, timezone
        await self.db.execute(
            update(User).where(User.id == user_id).values(deleted_at=datetime.now(timezone.utc), is_active=False)
        )
