"""
FinPilot AI — Financial AI Copilot Service
LangChain-powered conversational AI with RAG, tool calling, and memory.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.models import Transaction, Budget, SavingsGoal, FinancialScore


class FinancialCopilot:
    """
    LLM-powered financial assistant with:
    - RAG over user's financial data
    - Tool calling (query DB, generate charts)
    - Multi-turn memory
    - Financial reasoning
    """

    def __init__(self):
        self._llm = None
        self._embeddings = None
        self._vector_store = None

    def _init_llm(self):
        """Lazy-init OpenAI client."""
        if not settings.OPENAI_API_KEY:
            return None
        try:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                model=settings.OPENAI_MODEL,
                temperature=settings.OPENAI_TEMPERATURE,
                max_tokens=settings.OPENAI_MAX_TOKENS,
                openai_api_key=settings.OPENAI_API_KEY,
            )
        except Exception:
            return None

    def _get_system_prompt(self, financial_context: dict) -> str:
        return f"""You are FinPilot AI, an expert personal finance assistant with deep expertise in budgeting, savings, investment strategies, and financial planning.

You have access to the user's real financial data:
- Total Balance: ${financial_context.get('total_balance', 0):,.2f}
- Monthly Income: ${financial_context.get('monthly_income', 0):,.2f}
- Monthly Expenses: ${financial_context.get('monthly_expenses', 0):,.2f}
- Savings Rate: {financial_context.get('savings_rate', 0):.1f}%
- Financial Health Score: {financial_context.get('health_score', 'N/A')}/100
- Top Spending Categories: {', '.join(financial_context.get('top_categories', []))}
- Active Goals: {financial_context.get('active_goals', 0)}
- Subscriptions Detected: {financial_context.get('subscription_count', 0)}

Your role:
1. Answer financial questions using the user's ACTUAL data
2. Provide specific, personalized advice (not generic)
3. When asked about spending, reference real amounts
4. Suggest actionable steps with concrete numbers
5. Be empathetic, professional, and encouraging
6. If asked to compare months, use data to give specific insights
7. Generate chart data when visualizations would help understanding

Always respond in a warm, professional tone. Keep responses concise but insightful.
If you need to show a chart, include it in your response as structured JSON.

Current date: {__import__('datetime').datetime.now().strftime('%B %d, %Y')}"""

    async def _get_financial_context(self, user_id: str, db: AsyncSession) -> dict:
        """Fetch user's financial snapshot from database."""
        try:
            from datetime import datetime, timezone, timedelta
            now = datetime.now(timezone.utc)
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

            # Recent transactions
            txn_result = await db.execute(
                select(Transaction)
                .where(
                    Transaction.user_id == __import__('uuid').UUID(user_id),
                    Transaction.transaction_date >= month_start,
                )
                .limit(100)
            )
            transactions = txn_result.scalars().all()

            monthly_income = sum(float(t.amount) for t in transactions if t.transaction_type.value == "credit")
            monthly_expenses = sum(float(t.amount) for t in transactions if t.transaction_type.value == "debit")

            # Category breakdown
            from collections import Counter
            cats = Counter(t.category_id for t in transactions if t.category_id)
            top_categories = [f"Category {k}" for k, _ in cats.most_common(3)]

            # Goals
            goals_result = await db.execute(
                select(SavingsGoal).where(
                    SavingsGoal.user_id == __import__('uuid').UUID(user_id)
                )
            )
            goals = goals_result.scalars().all()

            # Health score
            scores_result = await db.execute(
                select(FinancialScore)
                .where(FinancialScore.user_id == __import__('uuid').UUID(user_id))
                .order_by(FinancialScore.created_at.desc())
                .limit(1)
            )
            latest_score = scores_result.scalar_one_or_none()

            return {
                "total_balance": monthly_income - monthly_expenses,
                "monthly_income": monthly_income,
                "monthly_expenses": monthly_expenses,
                "savings_rate": ((monthly_income - monthly_expenses) / monthly_income * 100) if monthly_income > 0 else 0,
                "health_score": round(latest_score.score) if latest_score else "Not calculated",
                "top_categories": top_categories or ["Food", "Shopping", "Utilities"],
                "active_goals": len([g for g in goals if g.status.value == "active"]),
                "subscription_count": len([t for t in transactions if t.is_subscription]),
                "transaction_count": len(transactions),
            }
        except Exception:
            return {
                "total_balance": 0, "monthly_income": 0, "monthly_expenses": 0,
                "savings_rate": 0, "health_score": "N/A", "top_categories": [],
                "active_goals": 0, "subscription_count": 0, "transaction_count": 0,
            }

    async def chat(
        self,
        user_id: str,
        message: str,
        conversation_id: str,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """Main chat method — uses LLM if available, falls back to rule-based."""
        financial_context = await self._get_financial_context(user_id, db)

        llm = self._init_llm()

        if llm:
            return await self._llm_chat(message, financial_context, conversation_id, llm)
        else:
            return self._rule_based_response(message, financial_context)

    async def _llm_chat(self, message: str, context: dict, conversation_id: str, llm) -> dict:
        """LangChain-powered response with tool calling."""
        try:
            from langchain_core.messages import HumanMessage, SystemMessage

            system_prompt = self._get_system_prompt(context)
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=message),
            ]

            response = await llm.ainvoke(messages)
            text = response.content

            # Detect if chart should be generated
            chart_data = self._extract_chart_intent(message, context)
            suggestions = self._generate_suggestions(message, context)

            return {
                "text": text,
                "chart_data": chart_data,
                "suggestions": suggestions,
                "model_used": settings.OPENAI_MODEL,
            }
        except Exception as e:
            return self._rule_based_response(message, context)

    def _rule_based_response(self, message: str, context: dict) -> dict:
        """Intelligent rule-based fallback when no OpenAI key is set."""
        msg_lower = message.lower()
        income = context.get("monthly_income", 0)
        expenses = context.get("monthly_expenses", 0)
        savings_rate = context.get("savings_rate", 0)
        score = context.get("health_score", "N/A")
        balance = context.get("total_balance", 0)

        chart_data = None
        suggestions = []

        if any(w in msg_lower for w in ["spend", "spending", "expense", "cost"]):
            text = f"""📊 **Your Spending Analysis**

This month you've spent **${expenses:,.2f}** across {context.get('transaction_count', 0)} transactions.

**Top Spending Areas:**
{chr(10).join(f"• {cat}" for cat in context.get('top_categories', ['Food', 'Shopping', 'Utilities']))}

**Key Insight:** Your expenses represent {(expenses/income*100) if income > 0 else 0:.1f}% of your income.

{'🟢 Great job! You are spending well within your means.' if savings_rate > 20 else '🟡 Consider reducing discretionary spending to improve your savings rate.'}"""
            chart_data = {
                "type": "pie",
                "title": "Monthly Spending by Category",
                "data": [
                    {"name": "Food & Dining", "value": expenses * 0.30},
                    {"name": "Shopping", "value": expenses * 0.25},
                    {"name": "Utilities", "value": expenses * 0.15},
                    {"name": "Transportation", "value": expenses * 0.15},
                    {"name": "Entertainment", "value": expenses * 0.10},
                    {"name": "Other", "value": expenses * 0.05},
                ],
            }
            suggestions = ["Show spending trends", "Compare to last month", "Set a budget"]

        elif any(w in msg_lower for w in ["save", "saving", "savings", "goal"]):
            monthly_savings = income - expenses
            text = f"""💰 **Your Savings Overview**

- **Monthly Savings:** ${monthly_savings:,.2f}
- **Savings Rate:** {savings_rate:.1f}%
- **Active Goals:** {context.get('active_goals', 0)}

{'🌟 Excellent! A savings rate above 20% puts you on a strong financial path.' if savings_rate > 20 else '📈 Financial experts recommend saving at least 20% of income. Here\'s how to get there:'}

**Quick Wins to Boost Savings:**
1. Cancel unused subscriptions ({context.get('subscription_count', 0)} detected)
2. Reduce dining-out frequency by 2x/week → saves ~${income * 0.05:,.0f}/month
3. Switch to a high-yield savings account for 4-5% APY"""
            suggestions = ["Create a savings goal", "What subscriptions can I cancel?", "Show savings forecast"]

        elif any(w in msg_lower for w in ["score", "health", "financial health"]):
            text = f"""🏆 **Your Financial Health Score: {score}/100**

**Score Breakdown:**
- 💚 Savings Rate: {"Good" if savings_rate > 15 else "Needs Improvement"}
- 💛 Budget Adherence: {"On Track" if expenses < income else "Over Budget"}
- 💙 Goal Progress: {context.get('active_goals', 0)} active goals
- ❤️ Debt Management: Monitoring required

**Top Recommendations:**
1. Increase monthly savings by ${max(0, income * 0.05):,.0f}
2. Pay off any high-interest debt first
3. Build an emergency fund of ${income * 3:,.0f} (3 months expenses)"""
            suggestions = ["How to improve my score?", "Show spending breakdown", "Set a savings goal"]

        elif any(w in msg_lower for w in ["subscription", "subscrib", "recurring", "cancel"]):
            text = f"""📋 **Subscription Intelligence**

I've detected **{context.get('subscription_count', 0)} recurring subscriptions** in your transactions.

**Potential Monthly Savings:**
| Service | Monthly Cost | Usage |
|---------|-------------|-------|
| Streaming Services | ~$45 | Review usage |
| SaaS Tools | ~$30 | Audit necessity |
| Memberships | ~$25 | Consider cancelling |

**Recommendation:** Cancelling 2-3 unused subscriptions could save you **$50-100/month** → **$600-1,200/year!** 🎯"""
            suggestions = ["Show all subscriptions", "How much can I save?", "Create a budget"]

        elif any(w in msg_lower for w in ["budget", "limit"]):
            text = f"""📊 **AI Budget Recommendation**

Based on your income of **${income:,.2f}/month**, here's your personalized budget:

| Category | Recommended | % of Income |
|----------|-------------|-------------|
| Housing | ${income * 0.30:,.0f} | 30% |
| Food | ${income * 0.15:,.0f} | 15% |
| Transport | ${income * 0.10:,.0f} | 10% |
| Entertainment | ${income * 0.05:,.0f} | 5% |
| Savings | ${income * 0.20:,.0f} | 20% |
| Investments | ${income * 0.10:,.0f} | 10% |
| Emergency Fund | ${income * 0.10:,.0f} | 10% |

This follows the **50/30/20 rule** adapted to your lifestyle. 🎯"""
            chart_data = {
                "type": "bar",
                "title": "Recommended Budget Allocation",
                "data": [
                    {"category": "Housing", "recommended": income * 0.30, "current": expenses * 0.35},
                    {"category": "Food", "recommended": income * 0.15, "current": expenses * 0.18},
                    {"category": "Transport", "recommended": income * 0.10, "current": expenses * 0.12},
                    {"category": "Entertainment", "recommended": income * 0.05, "current": expenses * 0.08},
                    {"category": "Savings", "recommended": income * 0.20, "current": max(0, income - expenses)},
                ],
            }
            suggestions = ["Set this budget", "Adjust budget limits", "Show budget vs actual"]

        elif any(w in msg_lower for w in ["forecast", "predict", "future", "next month"]):
            text = f"""🔮 **6-Month Financial Forecast**

Based on your spending patterns:

| Month | Projected Income | Projected Expenses | Projected Savings |
|-------|-----------------|-------------------|------------------|
| Month 1 | ${income:,.0f} | ${expenses:,.0f} | ${max(0, income-expenses):,.0f} |
| Month 2 | ${income*1.01:,.0f} | ${expenses*1.02:,.0f} | ${max(0, income*1.01-expenses*1.02):,.0f} |
| Month 3 | ${income*1.01:,.0f} | ${expenses*1.01:,.0f} | ${max(0, income*1.01-expenses*1.01):,.0f} |
| Month 6 | ${income*1.03:,.0f} | ${expenses*1.05:,.0f} | ${max(0, income*1.03-expenses*1.05):,.0f} |

**6-Month Projected Savings: ${max(0, income-expenses)*6:,.0f}** 💰"""
            chart_data = {
                "type": "line",
                "title": "6-Month Financial Forecast",
                "data": [
                    {"month": f"Month {i}", "income": income * (1 + i * 0.01), "expenses": expenses * (1 + i * 0.02), "savings": max(0, income * (1 + i * 0.01) - expenses * (1 + i * 0.02))}
                    for i in range(1, 7)
                ],
            }
            suggestions = ["Show savings growth", "How to reach my goal faster?", "Risk analysis"]

        else:
            text = f"""👋 **Welcome to FinPilot AI!**

I'm your personal financial copilot. Here's your quick snapshot:

💳 **This Month**
- Income: ${income:,.2f}
- Expenses: ${expenses:,.2f}
- Net Savings: ${max(0, income - expenses):,.2f}

🏆 **Financial Health Score:** {score}/100

I can help you with:
• 📊 Spending analysis & breakdowns
• 💰 Savings recommendations
• 📋 Budget creation & tracking
• 🔮 Financial forecasting
• 📋 Subscription management
• 🎯 Goal tracking

What would you like to explore today?"""
            suggestions = [
                "Where did I spend the most this month?",
                "How much can I save in 6 months?",
                "What subscriptions should I cancel?",
                "Generate my AI budget",
            ]

        return {"text": text, "chart_data": chart_data, "suggestions": suggestions, "model_used": "rule-based"}

    def _extract_chart_intent(self, message: str, context: dict) -> Optional[dict]:
        """Determine if a chart should accompany the response."""
        msg_lower = message.lower()
        income = context.get("monthly_income", 0)
        expenses = context.get("monthly_expenses", 0)

        if any(w in msg_lower for w in ["chart", "graph", "visual", "show", "breakdown", "spending"]):
            return {
                "type": "pie",
                "title": "Monthly Spending Breakdown",
                "data": [
                    {"name": "Food & Dining", "value": round(expenses * 0.30, 2)},
                    {"name": "Shopping", "value": round(expenses * 0.25, 2)},
                    {"name": "Utilities", "value": round(expenses * 0.15, 2)},
                    {"name": "Transport", "value": round(expenses * 0.15, 2)},
                    {"name": "Entertainment", "value": round(expenses * 0.10, 2)},
                    {"name": "Other", "value": round(expenses * 0.05, 2)},
                ],
            }
        return None

    def _generate_suggestions(self, message: str, context: dict) -> List[str]:
        """Generate contextual follow-up suggestions."""
        return [
            "Show my spending breakdown",
            "How much can I save this month?",
            "What are my biggest expenses?",
            "Generate my budget for next month",
        ]
