"""Accounts API Router."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.models import Account, AccountType, User

router = APIRouter()

class AccountCreate(BaseModel):
    name: str
    institution_name: Optional[str] = None
    account_type: AccountType
    balance: float = 0.0
    currency: str = "INR"
    mask: Optional[str] = None

class AccountResponse(BaseModel):
    id: str
    name: str
    institution_name: Optional[str]
    account_type: str
    balance: float
    currency: str
    mask: Optional[str]
    is_active: bool

@router.get("", response_model=List[AccountResponse])
async def list_accounts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Account).where(Account.user_id == current_user.id, Account.is_active == True))
    accounts = result.scalars().all()
    return [AccountResponse(id=str(a.id), name=a.name, institution_name=a.institution_name, account_type=a.account_type.value, balance=float(a.balance), currency=a.currency, mask=a.mask, is_active=a.is_active) for a in accounts]

@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    data: AccountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = Account(user_id=current_user.id, **data.model_dump())
    db.add(account)
    await db.flush()
    await db.refresh(account)
    return AccountResponse(id=str(account.id), name=account.name, institution_name=account.institution_name, account_type=account.account_type.value, balance=float(account.balance), currency=account.currency, mask=account.mask, is_active=account.is_active)

@router.get("/total-balance")
async def get_total_balance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import func
    result = await db.execute(select(func.sum(Account.balance)).where(Account.user_id == current_user.id, Account.is_active == True))
    total = float(result.scalar_one() or 0)
    return {"total_balance": total, "currency": current_user.currency}
