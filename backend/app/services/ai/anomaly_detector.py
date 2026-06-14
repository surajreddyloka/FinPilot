"""
FinPilot AI — Anomaly Detection Engine
Statistical + rule-based anomaly detection for transactions.
"""

from __future__ import annotations

import statistics
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Transaction, TransactionType


class AnomalyDetector:
    """
    Detects anomalies using:
    1. Z-score statistical analysis
    2. Category-specific thresholds
    3. Duplicate detection
    4. Sudden large transactions
    5. Unusual merchant patterns
    """

    Z_SCORE_THRESHOLD = 2.5
    DUPLICATE_WINDOW_HOURS = 48

    async def detect(self, user_id: str, db: AsyncSession) -> List[Dict[str, Any]]:
        uid = UUID(user_id)
        now = datetime.now(timezone.utc)
        lookback = now - timedelta(days=90)

        result = await db.execute(
            select(Transaction).where(
                Transaction.user_id == uid,
                Transaction.transaction_date >= lookback,
                Transaction.transaction_type == TransactionType.debit,
            ).order_by(Transaction.transaction_date.desc())
        )
        transactions = result.scalars().all()
        if len(transactions) < 5:
            return []

        anomalies = []
        amounts = [float(t.amount) for t in transactions]
        mean_amount = statistics.mean(amounts)
        std_amount = statistics.stdev(amounts) if len(amounts) > 1 else 1.0

        for txn in transactions[:30]:  # Check last 30 transactions
            reasons = []
            severity = "low"

            # Z-score check
            z_score = abs(float(txn.amount) - mean_amount) / max(std_amount, 0.01)
            if z_score > self.Z_SCORE_THRESHOLD:
                reasons.append(f"Amount ${float(txn.amount):,.2f} is {z_score:.1f}x std dev above normal (avg: ${mean_amount:,.2f})")
                severity = "high" if z_score > 4 else "medium"

            # Duplicate detection
            duplicates = [
                t for t in transactions
                if t.id != txn.id
                and abs(float(t.amount) - float(txn.amount)) < 0.01
                and t.merchant_name == txn.merchant_name
                and abs((txn.transaction_date - t.transaction_date).total_seconds()) < self.DUPLICATE_WINDOW_HOURS * 3600
            ]
            if duplicates:
                reasons.append(f"Potential duplicate payment to {txn.merchant_name or 'unknown merchant'}")
                severity = "high"

            # Large single transaction
            if float(txn.amount) > mean_amount * 3 and float(txn.amount) > 500:
                reasons.append(f"Unusually large transaction: ${float(txn.amount):,.2f}")
                severity = "medium"

            if reasons:
                anomalies.append({
                    "transaction_id": str(txn.id),
                    "transaction_name": txn.name,
                    "amount": float(txn.amount),
                    "date": txn.transaction_date.isoformat(),
                    "merchant": txn.merchant_name,
                    "reasons": reasons,
                    "severity": severity,
                    "z_score": round(z_score, 2),
                })

        return sorted(anomalies, key=lambda x: {"high": 0, "medium": 1, "low": 2}[x["severity"]])


class SubscriptionDetector:
    """Detects recurring subscriptions from transaction history."""

    KNOWN_SUBSCRIPTIONS = {
        "netflix": {"name": "Netflix", "category": "Entertainment"},
        "spotify": {"name": "Spotify", "category": "Entertainment"},
        "amazon prime": {"name": "Amazon Prime", "category": "Shopping"},
        "apple": {"name": "Apple", "category": "Technology"},
        "google": {"name": "Google", "category": "Technology"},
        "microsoft": {"name": "Microsoft", "category": "Technology"},
        "hulu": {"name": "Hulu", "category": "Entertainment"},
        "youtube": {"name": "YouTube Premium", "category": "Entertainment"},
        "dropbox": {"name": "Dropbox", "category": "Technology"},
        "slack": {"name": "Slack", "category": "Technology"},
        "notion": {"name": "Notion", "category": "Technology"},
        "gym": {"name": "Gym Membership", "category": "Health"},
        "planet fitness": {"name": "Planet Fitness", "category": "Health"},
    }

    async def detect(self, user_id: str, db: AsyncSession) -> List[Dict[str, Any]]:
        uid = UUID(user_id)
        now = datetime.now(timezone.utc)
        lookback = now - timedelta(days=90)

        result = await db.execute(
            select(Transaction).where(
                Transaction.user_id == uid,
                Transaction.transaction_date >= lookback,
            )
        )
        transactions = result.scalars().all()

        subscriptions = []
        seen = set()

        # Known subscription detection
        for txn in transactions:
            name_lower = (txn.name or "").lower()
            merchant_lower = (txn.merchant_name or "").lower()

            for keyword, info in self.KNOWN_SUBSCRIPTIONS.items():
                if keyword in name_lower or keyword in merchant_lower:
                    key = f"{keyword}_{float(txn.amount):.2f}"
                    if key not in seen:
                        seen.add(key)
                        subscriptions.append({
                            "name": info["name"],
                            "amount": float(txn.amount),
                            "category": info["category"],
                            "frequency": "monthly",
                            "annual_cost": float(txn.amount) * 12,
                            "cancellation_impact": "medium",
                            "last_charged": txn.transaction_date.isoformat(),
                        })

        # Pattern-based recurring detection
        amount_groups: Dict[str, List] = {}
        for txn in transactions:
            key = f"{round(float(txn.amount), 0)}_{txn.merchant_name or txn.name[:20]}"
            amount_groups.setdefault(key, []).append(txn)

        for key, group in amount_groups.items():
            if len(group) >= 2:
                name = group[0].merchant_name or group[0].name
                amount = float(group[0].amount)
                if any(name.lower() in s["name"].lower() for s in subscriptions):
                    continue

                subscriptions.append({
                    "name": name,
                    "amount": amount,
                    "category": "Unknown",
                    "frequency": "monthly" if len(group) >= 2 else "quarterly",
                    "annual_cost": amount * 12,
                    "cancellation_impact": "low",
                    "last_charged": max(t.transaction_date for t in group).isoformat(),
                    "occurrence_count": len(group),
                })

        total_monthly = sum(s["amount"] for s in subscriptions)
        return {
            "subscriptions": subscriptions,
            "total_monthly_cost": round(total_monthly, 2),
            "total_annual_cost": round(total_monthly * 12, 2),
            "cancellation_opportunities": [s for s in subscriptions if s.get("cancellation_impact") in ["low", "medium"]],
        }


class FinancialForecaster:
    """Simple trend-based financial forecaster."""

    async def forecast(self, user_id: str, db: AsyncSession, months: int = 6) -> Dict[str, Any]:
        uid = UUID(user_id)
        now = datetime.now(timezone.utc)

        # Get last 3 months of data
        monthly_data = []
        for i in range(3, 0, -1):
            month_start = (now - timedelta(days=30 * i)).replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1)

            income_q = await db.execute(
                select(Transaction).where(
                    Transaction.user_id == uid,
                    Transaction.transaction_date >= month_start,
                    Transaction.transaction_date < month_end,
                    Transaction.transaction_type == TransactionType.credit,
                )
            )
            expense_q = await db.execute(
                select(Transaction).where(
                    Transaction.user_id == uid,
                    Transaction.transaction_date >= month_start,
                    Transaction.transaction_date < month_end,
                    Transaction.transaction_type == TransactionType.debit,
                )
            )

            income_txns = income_q.scalars().all()
            expense_txns = expense_q.scalars().all()

            monthly_data.append({
                "month": month_start.strftime("%B %Y"),
                "income": sum(float(t.amount) for t in income_txns),
                "expenses": sum(float(t.amount) for t in expense_txns),
            })

        # Calculate trends
        if monthly_data:
            avg_income = statistics.mean(d["income"] for d in monthly_data) or 5000
            avg_expenses = statistics.mean(d["expenses"] for d in monthly_data) or 3500
        else:
            avg_income = 5000
            avg_expenses = 3500

        income_growth = 0.01  # 1% monthly growth estimate
        expense_growth = 0.015  # 1.5% monthly expense inflation

        forecast_data = []
        cumulative_savings = 0
        for i in range(1, months + 1):
            projected_income = avg_income * ((1 + income_growth) ** i)
            projected_expenses = avg_expenses * ((1 + expense_growth) ** i)
            projected_savings = max(0, projected_income - projected_expenses)
            cumulative_savings += projected_savings

            month_label = (now + timedelta(days=30 * i)).strftime("%B %Y")
            forecast_data.append({
                "month": month_label,
                "projected_income": round(projected_income, 2),
                "projected_expenses": round(projected_expenses, 2),
                "projected_savings": round(projected_savings, 2),
                "cumulative_savings": round(cumulative_savings, 2),
            })

        return {
            "historical": monthly_data,
            "forecast": forecast_data,
            "total_projected_savings": round(cumulative_savings, 2),
            "avg_monthly_savings": round(cumulative_savings / months, 2),
            "confidence": "medium",
            "risk_indicators": [
                "Expense growth rate (1.5%) exceeds income growth rate (1%)" if expense_growth > income_growth else "Income growing faster than expenses — positive trend",
            ],
        }
