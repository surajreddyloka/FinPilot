"""
FinPilot AI — API v1 Router
Aggregates all sub-routers.
"""

from fastapi import APIRouter

from app.api.v1.auth.router import router as auth_router
from app.api.v1.users.router import router as users_router
from app.api.v1.accounts.router import router as accounts_router
from app.api.v1.transactions.router import router as transactions_router
from app.api.v1.budgets.router import router as budgets_router
from app.api.v1.goals.router import router as goals_router
from app.api.v1.ai.router import router as ai_router
from app.api.v1.analytics.router import router as analytics_router
from app.api.v1.reports.router import router as reports_router
from app.api.v1.notifications.router import router as notifications_router
from app.api.v1.admin.router import router as admin_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(accounts_router, prefix="/accounts", tags=["Accounts"])
api_router.include_router(transactions_router, prefix="/transactions", tags=["Transactions"])
api_router.include_router(budgets_router, prefix="/budgets", tags=["Budgets"])
api_router.include_router(goals_router, prefix="/goals", tags=["Savings Goals"])
api_router.include_router(ai_router, prefix="/ai", tags=["AI Copilot"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(reports_router, prefix="/reports", tags=["Reports"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin"])
