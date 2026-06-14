"""
FinPilot AI — SQLAlchemy Database Models
All 14 core tables with relationships, constraints, and indexes.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ── Enums ───────────────────────────────────────────────────────────────────
class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"
    readonly = "readonly"


class AccountType(str, enum.Enum):
    checking = "checking"
    savings = "savings"
    credit_card = "credit_card"
    investment = "investment"
    loan = "loan"
    cash = "cash"


class TransactionType(str, enum.Enum):
    debit = "debit"
    credit = "credit"


class BudgetPeriod(str, enum.Enum):
    weekly = "weekly"
    monthly = "monthly"
    quarterly = "quarterly"
    yearly = "yearly"


class GoalStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    paused = "paused"
    cancelled = "cancelled"


class NotificationChannel(str, enum.Enum):
    email = "email"
    push = "push"
    in_app = "in_app"


class NotificationStatus(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"
    read = "read"


class ReportType(str, enum.Enum):
    weekly = "weekly"
    monthly = "monthly"
    custom = "custom"


class ReportFormat(str, enum.Enum):
    pdf = "pdf"
    excel = "excel"
    csv = "csv"


# ── 1. Users ────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.user, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # OAuth
    google_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True)
    github_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True)

    # MFA
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    mfa_secret: Mapped[Optional[str]] = mapped_column(String(255))  # encrypted

    # Preferences
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    timezone: Mapped[str] = mapped_column(String(50), default="Asia/Kolkata")
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    theme: Mapped[str] = mapped_column(String(20), default="dark")

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    sessions: Mapped[List["UserSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    accounts: Mapped[List["Account"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    transactions: Mapped[List["Transaction"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    budgets: Mapped[List["Budget"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    savings_goals: Mapped[List["SavingsGoal"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    financial_scores: Mapped[List["FinancialScore"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    ai_conversations: Mapped[List["AIConversation"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    reports: Mapped[List["Report"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[List["Notification"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    audit_logs: Mapped[List["AuditLog"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_users_email_active", "email", "is_active"),)


# ── 2. User Sessions ─────────────────────────────────────────────────────────
class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    refresh_token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    user_agent: Mapped[Optional[str]] = mapped_column(String(500))
    device_info: Mapped[Optional[dict]] = mapped_column(JSON)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_used_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="sessions")

    __table_args__ = (Index("ix_sessions_user_active", "user_id", "is_active"),)


# ── 3. Accounts ──────────────────────────────────────────────────────────────
class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    institution_name: Mapped[Optional[str]] = mapped_column(String(255))
    account_type: Mapped[AccountType] = mapped_column(Enum(AccountType), nullable=False)
    balance: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0)
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    mask: Mapped[Optional[str]] = mapped_column(String(10))  # last 4 digits
    plaid_account_id: Mapped[Optional[str]] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_synced_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="accounts")
    transactions: Mapped[List["Transaction"]] = relationship(back_populates="account", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_accounts_user_active", "user_id", "is_active"),)


# ── 4. Transaction Categories ────────────────────────────────────────────────
class TransactionCategory(Base):
    __tablename__ = "transaction_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    icon: Mapped[Optional[str]] = mapped_column(String(50))
    color: Mapped[Optional[str]] = mapped_column(String(7))  # hex color
    is_system: Mapped[bool] = mapped_column(Boolean, default=True)

    transactions: Mapped[List["Transaction"]] = relationship(back_populates="category")
    budget_items: Mapped[List["BudgetItem"]] = relationship(back_populates="category")


# ── 5. Transactions ──────────────────────────────────────────────────────────
class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("accounts.id", ondelete="SET NULL"))
    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("transaction_categories.id"))

    name: Mapped[str] = mapped_column(String(500), nullable=False)
    merchant_name: Mapped[Optional[str]] = mapped_column(String(255))
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    transaction_type: Mapped[TransactionType] = mapped_column(Enum(TransactionType), nullable=False)
    transaction_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    # AI Classification
    ai_category_confidence: Mapped[Optional[float]] = mapped_column(Float)
    ai_category_explanation: Mapped[Optional[str]] = mapped_column(Text)
    user_verified_category: Mapped[bool] = mapped_column(Boolean, default=False)

    # Flags
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    is_anomalous: Mapped[bool] = mapped_column(Boolean, default=False)
    anomaly_reason: Mapped[Optional[str]] = mapped_column(Text)
    is_subscription: Mapped[bool] = mapped_column(Boolean, default=False)
    plaid_transaction_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True)

    notes: Mapped[Optional[str]] = mapped_column(Text)
    tags: Mapped[Optional[dict]] = mapped_column(JSON)
    transaction_metadata: Mapped[Optional[dict]] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="transactions")
    account: Mapped[Optional["Account"]] = relationship(back_populates="transactions")
    category: Mapped[Optional["TransactionCategory"]] = relationship(back_populates="transactions")

    __table_args__ = (
        Index("ix_transactions_user_date", "user_id", "transaction_date"),
        Index("ix_transactions_user_category", "user_id", "category_id"),
    )


# ── 6. Budgets ───────────────────────────────────────────────────────────────
class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    total_limit: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    period: Mapped[BudgetPeriod] = mapped_column(Enum(BudgetPeriod), default=BudgetPeriod.monthly)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_rationale: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="budgets")
    items: Mapped[List["BudgetItem"]] = relationship(back_populates="budget", cascade="all, delete-orphan")


# ── 7. Budget Items ──────────────────────────────────────────────────────────
class BudgetItem(Base):
    __tablename__ = "budget_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    budget_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("budgets.id", ondelete="CASCADE"), nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("transaction_categories.id"), nullable=False)
    limit_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    spent_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0)
    alert_threshold: Mapped[float] = mapped_column(Float, default=0.8)  # alert at 80%

    budget: Mapped["Budget"] = relationship(back_populates="items")
    category: Mapped["TransactionCategory"] = relationship(back_populates="budget_items")


# ── 8. Savings Goals ─────────────────────────────────────────────────────────
class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    target_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    current_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0)
    monthly_contribution: Mapped[Optional[float]] = mapped_column(Numeric(15, 2))
    target_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    status: Mapped[GoalStatus] = mapped_column(Enum(GoalStatus), default=GoalStatus.active)
    icon: Mapped[Optional[str]] = mapped_column(String(50))
    ai_recommendation: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="savings_goals")


# ── 9. Financial Scores ──────────────────────────────────────────────────────
class FinancialScore(Base):
    __tablename__ = "financial_scores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    savings_rate_score: Mapped[float] = mapped_column(Float, default=0.0)
    expense_ratio_score: Mapped[float] = mapped_column(Float, default=0.0)
    budget_adherence_score: Mapped[float] = mapped_column(Float, default=0.0)
    goal_completion_score: Mapped[float] = mapped_column(Float, default=0.0)
    financial_consistency_score: Mapped[float] = mapped_column(Float, default=0.0)
    ai_explanation: Mapped[Optional[str]] = mapped_column(Text)
    improvement_suggestions: Mapped[Optional[dict]] = mapped_column(JSON)
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="financial_scores")

    __table_args__ = (Index("ix_scores_user_period", "user_id", "period_start"),)


# ── 10. AI Conversations ─────────────────────────────────────────────────────
class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255))
    summary: Mapped[Optional[str]] = mapped_column(Text)
    context: Mapped[Optional[dict]] = mapped_column(JSON)  # financial context snapshot
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="ai_conversations")
    messages: Mapped[List["AIMessage"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")


# ── 11. AI Messages ──────────────────────────────────────────────────────────
class AIMessage(Base):
    __tablename__ = "ai_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # user | assistant | system
    content: Mapped[str] = mapped_column(Text, nullable=False)
    chart_data: Mapped[Optional[dict]] = mapped_column(JSON)
    tool_calls: Mapped[Optional[dict]] = mapped_column(JSON)
    tokens_used: Mapped[Optional[int]] = mapped_column(Integer)
    model_used: Mapped[Optional[str]] = mapped_column(String(100))
    latency_ms: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation: Mapped["AIConversation"] = relationship(back_populates="messages")


# ── 12. Reports ──────────────────────────────────────────────────────────────
class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    report_type: Mapped[ReportType] = mapped_column(Enum(ReportType), nullable=False)
    report_format: Mapped[ReportFormat] = mapped_column(Enum(ReportFormat), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    file_url: Mapped[Optional[str]] = mapped_column(String(500))
    file_size: Mapped[Optional[int]] = mapped_column(Integer)
    summary: Mapped[Optional[dict]] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|processing|ready|failed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="reports")


# ── 13. Notifications ────────────────────────────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    channel: Mapped[NotificationChannel] = mapped_column(Enum(NotificationChannel), nullable=False)
    status: Mapped[NotificationStatus] = mapped_column(Enum(NotificationStatus), default=NotificationStatus.pending)
    notification_type: Mapped[str] = mapped_column(String(50))  # overspend|goal|security|ai_insight
    data: Mapped[Optional[dict]] = mapped_column(JSON)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="notifications")

    __table_args__ = (Index("ix_notifications_user_status", "user_id", "status"),)


# ── 14. Audit Logs ───────────────────────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    resource_type: Mapped[Optional[str]] = mapped_column(String(50))
    resource_id: Mapped[Optional[str]] = mapped_column(String(255))
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    user_agent: Mapped[Optional[str]] = mapped_column(String(500))
    request_data: Mapped[Optional[dict]] = mapped_column(JSON)
    response_status: Mapped[Optional[int]] = mapped_column(Integer)
    severity: Mapped[str] = mapped_column(String(20), default="info")  # info|warning|critical
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    user: Mapped[Optional["User"]] = relationship(back_populates="audit_logs")

    __table_args__ = (Index("ix_audit_logs_user_action", "user_id", "action", "created_at"),)
