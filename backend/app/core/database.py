"""
FinPilot AI — Async Database Engine
SQLAlchemy 2.0 async setup with connection pooling.
"""

from __future__ import annotations

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


# ── Engine ─────────────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_timeout=settings.DATABASE_POOL_TIMEOUT,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

# ── Session factory ─────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# ── Declarative base ────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── Dependency ──────────────────────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables (used in development/testing) and seed default categories."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default transaction categories if they don't exist
    from app.models.models import TransactionCategory
    from sqlalchemy import select, text

    categories_to_seed = [
        {"id": 1, "name": "Food", "slug": "food", "icon": "🍕", "color": "#6366f1"},
        {"id": 2, "name": "Shopping", "slug": "shopping", "icon": "🛍️", "color": "#d946ef"},
        {"id": 3, "name": "Utilities", "slug": "utilities", "icon": "⚡", "color": "#3b82f6"},
        {"id": 4, "name": "Healthcare", "slug": "healthcare", "icon": "🏥", "color": "#10b981"},
        {"id": 5, "name": "Transportation", "slug": "transportation", "icon": "🚗", "color": "#f59e0b"},
        {"id": 6, "name": "Entertainment", "slug": "entertainment", "icon": "🎭", "color": "#ec4899"},
        {"id": 7, "name": "Travel", "slug": "travel", "icon": "✈️", "color": "#14b8a6"},
        {"id": 8, "name": "Education", "slug": "education", "icon": "📚", "color": "#8b5cf6"},
        {"id": 9, "name": "Investments", "slug": "investments", "icon": "📈", "color": "#22c55e"},
        {"id": 10, "name": "Miscellaneous", "slug": "miscellaneous", "icon": "📦", "color": "#64748b"},
    ]

    async with AsyncSessionLocal() as session:
        async with session.begin():
            for cat in categories_to_seed:
                result = await session.execute(
                    select(TransactionCategory).where(TransactionCategory.id == cat["id"])
                )
                if not result.scalar_one_or_none():
                    session.add(TransactionCategory(**cat))
            await session.flush()
            try:
                await session.execute(text("SELECT setval('transaction_categories_id_seq', 10)"))
            except Exception:
                # Ignore if the sequence doesn't exist (e.g. SQLite/test DB)
                pass


async def close_db() -> None:
    """Dispose the engine connection pool."""
    await engine.dispose()
