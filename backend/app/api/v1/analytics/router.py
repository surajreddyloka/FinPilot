"""Analytics API Router."""
from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.models import Transaction, TransactionType, Account, User

router = APIRouter()

@router.get("/overview")
async def get_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get dashboard overview metrics."""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)

    # This month
    income_q = await db.execute(select(func.sum(Transaction.amount)).where(Transaction.user_id == current_user.id, Transaction.transaction_date >= month_start, Transaction.transaction_type == TransactionType.credit))
    expense_q = await db.execute(select(func.sum(Transaction.amount)).where(Transaction.user_id == current_user.id, Transaction.transaction_date >= month_start, Transaction.transaction_type == TransactionType.debit))
    balance_q = await db.execute(select(func.sum(Account.balance)).where(Account.user_id == current_user.id, Account.is_active == True))

    monthly_income = float(income_q.scalar_one() or 0)
    monthly_expenses = float(expense_q.scalar_one() or 0)
    total_balance = float(balance_q.scalar_one() or 0)
    monthly_savings = monthly_income - monthly_expenses

    # Last month for comparison
    lm_income_q = await db.execute(select(func.sum(Transaction.amount)).where(Transaction.user_id == current_user.id, Transaction.transaction_date >= last_month_start, Transaction.transaction_date < month_start, Transaction.transaction_type == TransactionType.credit))
    lm_expense_q = await db.execute(select(func.sum(Transaction.amount)).where(Transaction.user_id == current_user.id, Transaction.transaction_date >= last_month_start, Transaction.transaction_date < month_start, Transaction.transaction_type == TransactionType.debit))

    lm_income = float(lm_income_q.scalar_one() or 0)
    lm_expenses = float(lm_expense_q.scalar_one() or 0)

    def pct_change(current, previous):
        if previous == 0: return 0
        return round((current - previous) / previous * 100, 1)

    return {
        "total_balance": total_balance,
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "monthly_savings": monthly_savings,
        "savings_rate": round(monthly_savings / monthly_income * 100, 1) if monthly_income > 0 else 0,
        "income_change_pct": pct_change(monthly_income, lm_income),
        "expense_change_pct": pct_change(monthly_expenses, lm_expenses),
    }

@router.get("/spending-trend")
async def get_spending_trend(
    months: int = Query(6, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get monthly income vs expense trend."""
    now = datetime.now(timezone.utc)
    trend_data = []
    for i in range(months - 1, -1, -1):
        month_start = (now - timedelta(days=30 * i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_end = (month_start + timedelta(days=32)).replace(day=1)
        income_q = await db.execute(select(func.sum(Transaction.amount)).where(Transaction.user_id == current_user.id, Transaction.transaction_date >= month_start, Transaction.transaction_date < month_end, Transaction.transaction_type == TransactionType.credit))
        expense_q = await db.execute(select(func.sum(Transaction.amount)).where(Transaction.user_id == current_user.id, Transaction.transaction_date >= month_start, Transaction.transaction_date < month_end, Transaction.transaction_type == TransactionType.debit))
        income = float(income_q.scalar_one() or 0)
        expenses = float(expense_q.scalar_one() or 0)
        trend_data.append({"month": month_start.strftime("%b %Y"), "income": income, "expenses": expenses, "savings": max(0, income - expenses)})
    return {"trend": trend_data}

@router.get("/category-breakdown")
async def get_category_breakdown(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get spending breakdown by category."""
    now = datetime.now(timezone.utc)
    start = start_date or now.replace(day=1)
    end = end_date or now

    result = await db.execute(
        select(Transaction.category_id, func.sum(Transaction.amount).label("total"), func.count().label("count"))
        .where(Transaction.user_id == current_user.id, Transaction.transaction_date >= start, Transaction.transaction_date <= end, Transaction.transaction_type == TransactionType.debit)
        .group_by(Transaction.category_id).order_by(func.sum(Transaction.amount).desc())
    )
    rows = result.all()
    CATEGORY_NAMES = {1: "Food", 2: "Shopping", 3: "Utilities", 4: "Healthcare", 5: "Transportation", 6: "Entertainment", 7: "Travel", 8: "Education", 9: "Investments", 10: "Miscellaneous"}
    return {"categories": [{"category_id": r.category_id, "name": CATEGORY_NAMES.get(r.category_id, f"Category {r.category_id}"), "total": float(r.total), "count": r.count} for r in rows]}
