"""
FinPilot AI — Financial Health Scoring Engine
Calculates a 0-100 score across 5 weighted dimensions.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Transaction, TransactionType, Budget, BudgetItem, SavingsGoal, GoalStatus, FinancialScore


class FinancialScoringEngine:
    """
    Scoring Dimensions:
    - Savings Rate (30%) — income saved percentage
    - Expense Ratio (20%) — expenses vs income
    - Budget Adherence (20%) — how well user follows budget
    - Goal Completion (15%) — savings goals progress
    - Financial Consistency (15%) — variance in spending
    """

    WEIGHTS = {
        "savings_rate": 0.30,
        "expense_ratio": 0.20,
        "budget_adherence": 0.20,
        "goal_completion": 0.15,
        "financial_consistency": 0.15,
    }

    async def calculate_score(self, user_id: str, db: AsyncSession) -> Dict[str, Any]:
        uid = UUID(user_id)
        now = datetime.now(timezone.utc)
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        period_end = now

        # ── Fetch Data ────────────────────────────────────────────
        txn_result = await db.execute(
            select(Transaction).where(
                Transaction.user_id == uid,
                Transaction.transaction_date >= period_start,
            )
        )
        transactions = txn_result.scalars().all()

        income = sum(float(t.amount) for t in transactions if t.transaction_type == TransactionType.credit)
        expenses = sum(float(t.amount) for t in transactions if t.transaction_type == TransactionType.debit)

        # ── Compute Sub-scores ────────────────────────────────────
        savings_rate_score = self._savings_rate_score(income, expenses)
        expense_ratio_score = self._expense_ratio_score(income, expenses)
        budget_adherence_score = await self._budget_adherence_score(uid, db)
        goal_completion_score = await self._goal_completion_score(uid, db)
        consistency_score = self._consistency_score(transactions)

        total_score = (
            savings_rate_score * self.WEIGHTS["savings_rate"]
            + expense_ratio_score * self.WEIGHTS["expense_ratio"]
            + budget_adherence_score * self.WEIGHTS["budget_adherence"]
            + goal_completion_score * self.WEIGHTS["goal_completion"]
            + consistency_score * self.WEIGHTS["financial_consistency"]
        )

        total_score = round(min(100, max(0, total_score)), 1)

        # ── Generate AI Explanation ───────────────────────────────
        explanation = self._generate_explanation(total_score, {
            "savings_rate": savings_rate_score,
            "expense_ratio": expense_ratio_score,
            "budget_adherence": budget_adherence_score,
            "goal_completion": goal_completion_score,
            "consistency": consistency_score,
            "income": income,
            "expenses": expenses,
        })

        # ── Persist Score ─────────────────────────────────────────
        score_record = FinancialScore(
            user_id=uid,
            score=total_score,
            savings_rate_score=savings_rate_score,
            expense_ratio_score=expense_ratio_score,
            budget_adherence_score=budget_adherence_score,
            goal_completion_score=goal_completion_score,
            financial_consistency_score=consistency_score,
            ai_explanation=explanation["summary"],
            improvement_suggestions=explanation["suggestions"],
            period_start=period_start,
            period_end=period_end,
        )
        db.add(score_record)
        await db.flush()

        return {
            "score": total_score,
            "grade": self._get_grade(total_score),
            "breakdown": {
                "savings_rate": {"score": round(savings_rate_score, 1), "weight": "30%"},
                "expense_ratio": {"score": round(expense_ratio_score, 1), "weight": "20%"},
                "budget_adherence": {"score": round(budget_adherence_score, 1), "weight": "20%"},
                "goal_completion": {"score": round(goal_completion_score, 1), "weight": "15%"},
                "financial_consistency": {"score": round(consistency_score, 1), "weight": "15%"},
            },
            "explanation": explanation["summary"],
            "suggestions": explanation["suggestions"],
            "period": f"{period_start.strftime('%B %Y')}",
        }

    def _savings_rate_score(self, income: float, expenses: float) -> float:
        if income == 0:
            return 50.0
        rate = (income - expenses) / income
        if rate >= 0.30:
            return 100.0
        elif rate >= 0.20:
            return 85.0
        elif rate >= 0.10:
            return 65.0
        elif rate >= 0.05:
            return 45.0
        elif rate >= 0:
            return 25.0
        else:
            return 0.0  # spending more than earning

    def _expense_ratio_score(self, income: float, expenses: float) -> float:
        if income == 0:
            return 50.0
        ratio = expenses / income
        if ratio <= 0.50:
            return 100.0
        elif ratio <= 0.65:
            return 85.0
        elif ratio <= 0.80:
            return 65.0
        elif ratio <= 0.95:
            return 40.0
        elif ratio <= 1.0:
            return 20.0
        else:
            return 0.0

    async def _budget_adherence_score(self, user_id: UUID, db: AsyncSession) -> float:
        result = await db.execute(
            select(Budget).where(Budget.user_id == user_id, Budget.is_active == True).limit(1)
        )
        budget = result.scalar_one_or_none()
        if not budget:
            return 60.0  # neutral if no budget set

        items_result = await db.execute(select(BudgetItem).where(BudgetItem.budget_id == budget.id))
        items = items_result.scalars().all()
        if not items:
            return 60.0

        adherent = sum(1 for i in items if float(i.spent_amount) <= float(i.limit_amount))
        return (adherent / len(items)) * 100

    async def _goal_completion_score(self, user_id: UUID, db: AsyncSession) -> float:
        result = await db.execute(select(SavingsGoal).where(SavingsGoal.user_id == user_id))
        goals = result.scalars().all()
        if not goals:
            return 50.0

        completed = sum(1 for g in goals if g.status == GoalStatus.completed)
        active = [g for g in goals if g.status == GoalStatus.active]
        avg_progress = sum(float(g.current_amount) / float(g.target_amount) for g in active if g.target_amount > 0) / max(len(active), 1)

        return min(100, (completed / len(goals) * 50) + (avg_progress * 50))

    def _consistency_score(self, transactions) -> float:
        """Lower spending variance = higher consistency score."""
        if len(transactions) < 3:
            return 60.0

        import statistics
        amounts = [float(t.amount) for t in transactions if t.transaction_type == TransactionType.debit]
        if len(amounts) < 2:
            return 60.0

        try:
            cv = statistics.stdev(amounts) / statistics.mean(amounts)
            if cv <= 0.3:
                return 95.0
            elif cv <= 0.5:
                return 80.0
            elif cv <= 0.8:
                return 60.0
            elif cv <= 1.2:
                return 40.0
            else:
                return 20.0
        except Exception:
            return 60.0

    def _get_grade(self, score: float) -> str:
        if score >= 90:
            return "A+"
        elif score >= 80:
            return "A"
        elif score >= 70:
            return "B"
        elif score >= 60:
            return "C"
        elif score >= 50:
            return "D"
        else:
            return "F"

    def _generate_explanation(self, score: float, metrics: dict) -> dict:
        income = metrics.get("income", 0)
        expenses = metrics.get("expenses", 0)
        savings = income - expenses

        if score >= 80:
            summary = f"Excellent financial health! Your score of {score}/100 reflects strong savings discipline and responsible spending habits."
        elif score >= 65:
            summary = f"Good financial health with room to improve. Score {score}/100 — focus on increasing your savings rate."
        elif score >= 50:
            summary = f"Fair financial health (Score: {score}/100). You're managing but need to reduce expenses and build savings."
        else:
            summary = f"Your financial health needs attention (Score: {score}/100). Focus on reducing overspending and starting an emergency fund."

        suggestions = []
        if metrics.get("savings_rate", 0) < 70:
            target = max(0.20 * income - savings, 0)
            suggestions.append(f"Increase monthly savings by ${target:,.0f} to hit 20% savings rate")
        if metrics.get("expense_ratio", 0) < 65:
            suggestions.append("Review and reduce discretionary spending in top 2 categories")
        if metrics.get("budget_adherence", 0) < 70:
            suggestions.append("Set category budgets and track spending weekly")
        if metrics.get("goal_completion", 0) < 60:
            suggestions.append("Define 1-2 savings goals and automate monthly contributions")
        if not suggestions:
            suggestions.append("Keep up the great work! Consider investing surplus savings in index funds")

        return {"summary": summary, "suggestions": suggestions}
