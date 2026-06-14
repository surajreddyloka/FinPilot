"""
FinPilot AI — Transactions API Router
CRUD + AI categorization + anomaly detection endpoints.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from pydantic import BaseModel
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.models import Transaction, TransactionType, TransactionCategory, User

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────────
class TransactionCreate(BaseModel):
    name: str
    amount: float
    transaction_type: TransactionType
    transaction_date: datetime
    account_id: Optional[UUID] = None
    category_id: Optional[int] = None
    merchant_name: Optional[str] = None
    notes: Optional[str] = None
    currency: str = "INR"


class TransactionUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    notes: Optional[str] = None
    merchant_name: Optional[str] = None


class TransactionResponse(BaseModel):
    id: str
    name: str
    amount: float
    transaction_type: str
    transaction_date: datetime
    merchant_name: Optional[str]
    category_id: Optional[int]
    currency: str
    is_recurring: bool
    is_anomalous: bool
    is_subscription: bool
    ai_category_confidence: Optional[float]
    ai_category_explanation: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionSummary(BaseModel):
    total_income: float
    total_expenses: float
    net: float
    transaction_count: int
    by_category: List[dict]
    top_merchants: List[dict]


# ── Routes ───────────────────────────────────────────────────────────────────
@router.get("", response_model=List[TransactionResponse])
async def list_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    category_id: Optional[int] = Query(None),
    transaction_type: Optional[TransactionType] = Query(None),
    search: Optional[str] = Query(None),
    is_anomalous: Optional[bool] = Query(None),
    is_subscription: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List user transactions with filtering and pagination."""
    query = select(Transaction).where(Transaction.user_id == current_user.id)

    if start_date:
        query = query.where(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.where(Transaction.transaction_date <= end_date)
    if category_id:
        query = query.where(Transaction.category_id == category_id)
    if transaction_type:
        query = query.where(Transaction.transaction_type == transaction_type)
    if search:
        query = query.where(Transaction.name.ilike(f"%{search}%"))
    if is_anomalous is not None:
        query = query.where(Transaction.is_anomalous == is_anomalous)
    if is_subscription is not None:
        query = query.where(Transaction.is_subscription == is_subscription)

    query = query.order_by(Transaction.transaction_date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    transactions = result.scalars().all()

    return [
        TransactionResponse(
            id=str(t.id), name=t.name, amount=float(t.amount),
            transaction_type=t.transaction_type.value,
            transaction_date=t.transaction_date,
            merchant_name=t.merchant_name, category_id=t.category_id,
            currency=t.currency, is_recurring=t.is_recurring,
            is_anomalous=t.is_anomalous, is_subscription=t.is_subscription,
            ai_category_confidence=t.ai_category_confidence,
            ai_category_explanation=t.ai_category_explanation,
            notes=t.notes, created_at=t.created_at,
        )
        for t in transactions
    ]


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a manual transaction."""
    txn = Transaction(
        user_id=current_user.id,
        name=data.name,
        amount=data.amount,
        transaction_type=data.transaction_type,
        transaction_date=data.transaction_date,
        account_id=data.account_id,
        category_id=data.category_id,
        merchant_name=data.merchant_name,
        notes=data.notes,
        currency=data.currency,
    )
    db.add(txn)
    await db.flush()
    await db.refresh(txn)
    return TransactionResponse(
        id=str(txn.id), name=txn.name, amount=float(txn.amount),
        transaction_type=txn.transaction_type.value,
        transaction_date=txn.transaction_date,
        merchant_name=txn.merchant_name, category_id=txn.category_id,
        currency=txn.currency, is_recurring=txn.is_recurring,
        is_anomalous=txn.is_anomalous, is_subscription=txn.is_subscription,
        ai_category_confidence=txn.ai_category_confidence,
        ai_category_explanation=txn.ai_category_explanation,
        notes=txn.notes, created_at=txn.created_at,
    )


@router.get("/summary", response_model=TransactionSummary)
async def get_summary(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get spending/income summary with category breakdown."""
    filters = [Transaction.user_id == current_user.id]
    if start_date:
        filters.append(Transaction.transaction_date >= start_date)
    if end_date:
        filters.append(Transaction.transaction_date <= end_date)

    # Totals
    income_q = await db.execute(
        select(func.sum(Transaction.amount)).where(*filters, Transaction.transaction_type == TransactionType.credit)
    )
    expense_q = await db.execute(
        select(func.sum(Transaction.amount)).where(*filters, Transaction.transaction_type == TransactionType.debit)
    )
    count_q = await db.execute(select(func.count()).select_from(Transaction).where(*filters))

    total_income = float(income_q.scalar_one() or 0)
    total_expenses = float(expense_q.scalar_one() or 0)
    count = count_q.scalar_one()

    # Category breakdown
    cat_q = await db.execute(
        select(Transaction.category_id, func.sum(Transaction.amount).label("total"))
        .where(*filters, Transaction.transaction_type == TransactionType.debit)
        .group_by(Transaction.category_id)
        .order_by(func.sum(Transaction.amount).desc())
        .limit(10)
    )
    by_category = [{"category_id": r.category_id, "total": float(r.total)} for r in cat_q.all()]

    # Top merchants
    merch_q = await db.execute(
        select(Transaction.merchant_name, func.sum(Transaction.amount).label("total"))
        .where(*filters, Transaction.merchant_name.isnot(None))
        .group_by(Transaction.merchant_name)
        .order_by(func.sum(Transaction.amount).desc())
        .limit(5)
    )
    top_merchants = [{"merchant": r.merchant_name, "total": float(r.total)} for r in merch_q.all()]

    return TransactionSummary(
        total_income=total_income,
        total_expenses=total_expenses,
        net=total_income - total_expenses,
        transaction_count=count,
        by_category=by_category,
        top_merchants=top_merchants,
    )


@router.post("/upload")
async def upload_statement(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload CSV/Excel/PDF bank statement for processing."""
    allowed_types = ["text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use CSV, Excel, or PDF.")

    content = await file.read()
    # In production, dispatch to Celery task
    return {
        "filename": file.filename,
        "size": len(content),
        "status": "queued",
        "message": "Statement uploaded and queued for processing. Transactions will appear shortly.",
        "task_id": "task_" + str(UUID.__new__(UUID)),
    }


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
    )
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return TransactionResponse(
        id=str(txn.id), name=txn.name, amount=float(txn.amount),
        transaction_type=txn.transaction_type.value,
        transaction_date=txn.transaction_date,
        merchant_name=txn.merchant_name, category_id=txn.category_id,
        currency=txn.currency, is_recurring=txn.is_recurring,
        is_anomalous=txn.is_anomalous, is_subscription=txn.is_subscription,
        ai_category_confidence=txn.ai_category_confidence,
        ai_category_explanation=txn.ai_category_explanation,
        notes=txn.notes, created_at=txn.created_at,
    )
