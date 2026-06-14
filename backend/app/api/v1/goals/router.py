"""Savings Goals API Router."""
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.models import SavingsGoal, GoalStatus, User

router = APIRouter()

class GoalCreate(BaseModel):
    name: str
    description: Optional[str] = None
    target_amount: float
    current_amount: float = 0.0
    monthly_contribution: Optional[float] = None
    target_date: Optional[datetime] = None
    icon: Optional[str] = None

class GoalUpdate(BaseModel):
    current_amount: Optional[float] = None
    monthly_contribution: Optional[float] = None
    status: Optional[GoalStatus] = None

class GoalResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    target_amount: float
    current_amount: float
    monthly_contribution: Optional[float]
    target_date: Optional[datetime]
    status: str
    icon: Optional[str]
    progress_percentage: float
    months_to_goal: Optional[int]

@router.get("", response_model=List[GoalResponse])
async def list_goals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(SavingsGoal).where(SavingsGoal.user_id == current_user.id))
    goals = result.scalars().all()
    return [_to_response(g) for g in goals]

@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    data: GoalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = SavingsGoal(user_id=current_user.id, **data.model_dump())
    db.add(goal)
    await db.flush()
    await db.refresh(goal)
    return _to_response(goal)

@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: UUID,
    data: GoalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import update
    updates = data.model_dump(exclude_none=True)
    await db.execute(update(SavingsGoal).where(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).values(**updates))
    result = await db.execute(select(SavingsGoal).where(SavingsGoal.id == goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Goal not found")
    return _to_response(goal)

def _to_response(g: SavingsGoal) -> GoalResponse:
    progress = (float(g.current_amount) / float(g.target_amount) * 100) if g.target_amount > 0 else 0
    remaining = float(g.target_amount) - float(g.current_amount)
    months_to_goal = None
    if g.monthly_contribution and float(g.monthly_contribution) > 0:
        months_to_goal = int(remaining / float(g.monthly_contribution))
    return GoalResponse(
        id=str(g.id), name=g.name, description=g.description,
        target_amount=float(g.target_amount), current_amount=float(g.current_amount),
        monthly_contribution=float(g.monthly_contribution) if g.monthly_contribution else None,
        target_date=g.target_date, status=g.status.value, icon=g.icon,
        progress_percentage=round(progress, 1), months_to_goal=months_to_goal,
    )
