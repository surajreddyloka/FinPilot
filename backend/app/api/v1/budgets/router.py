"""Budgets API Router."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.models import Budget, BudgetItem, BudgetPeriod, User

router = APIRouter()

class BudgetItemCreate(BaseModel):
    category_id: int
    limit_amount: float
    alert_threshold: float = 0.8

class BudgetCreate(BaseModel):
    name: str
    total_limit: float
    period: BudgetPeriod = BudgetPeriod.monthly
    start_date: datetime
    end_date: Optional[datetime] = None
    items: List[BudgetItemCreate] = []

class BudgetResponse(BaseModel):
    id: str
    name: str
    total_limit: float
    period: str
    start_date: datetime
    is_ai_generated: bool
    is_active: bool
    items: List[dict]

@router.get("", response_model=List[BudgetResponse])
async def list_budgets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Budget).where(Budget.user_id == current_user.id, Budget.is_active == True))
    budgets = result.scalars().all()
    return [BudgetResponse(id=str(b.id), name=b.name, total_limit=float(b.total_limit), period=b.period.value, start_date=b.start_date, is_ai_generated=b.is_ai_generated, is_active=b.is_active, items=[]) for b in budgets]

@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    data: BudgetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = Budget(user_id=current_user.id, name=data.name, total_limit=data.total_limit, period=data.period, start_date=data.start_date, end_date=data.end_date)
    db.add(budget)
    await db.flush()
    for item_data in data.items:
        item = BudgetItem(budget_id=budget.id, **item_data.model_dump())
        db.add(item)
    await db.flush()
    return BudgetResponse(id=str(budget.id), name=budget.name, total_limit=float(budget.total_limit), period=budget.period.value, start_date=budget.start_date, is_ai_generated=budget.is_ai_generated, is_active=budget.is_active, items=[])
