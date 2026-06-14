"""Users API Router."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user, require_admin
from app.models.models import User
from app.repositories.user_repository import UserRepository

router = APIRouter()

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    theme: Optional[str] = None
    notifications_enabled: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    mfa_enabled: bool
    avatar_url: Optional[str]
    currency: str
    timezone: str
    theme: str
    notifications_enabled: bool

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return UserResponse(
        id=str(current_user.id), email=current_user.email,
        full_name=current_user.full_name, role=current_user.role.value,
        is_active=current_user.is_active, is_verified=current_user.is_verified,
        mfa_enabled=current_user.mfa_enabled, avatar_url=current_user.avatar_url,
        currency=current_user.currency, timezone=current_user.timezone,
        theme=current_user.theme, notifications_enabled=current_user.notifications_enabled,
    )

@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current user profile."""
    repo = UserRepository(db)
    updates = data.model_dump(exclude_none=True)
    updated = await repo.update(current_user.id, **updates)
    return UserResponse(
        id=str(updated.id), email=updated.email, full_name=updated.full_name,
        role=updated.role.value, is_active=updated.is_active, is_verified=updated.is_verified,
        mfa_enabled=updated.mfa_enabled, avatar_url=updated.avatar_url,
        currency=updated.currency, timezone=updated.timezone,
        theme=updated.theme, notifications_enabled=updated.notifications_enabled,
    )

@router.get("", dependencies=[Depends(require_admin)])
async def list_users(
    skip: int = 0, limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Admin: list all users."""
    repo = UserRepository(db)
    users = await repo.list_users(skip=skip, limit=limit)
    total = await repo.count()
    return {"users": [{"id": str(u.id), "email": u.email, "full_name": u.full_name, "role": u.role.value, "is_active": u.is_active} for u in users], "total": total}
