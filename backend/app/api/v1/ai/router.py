"""
FinPilot AI — AI Copilot API Router
Conversational AI, financial analysis, and chart generation.
"""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.models import AIConversation, AIMessage, User
from app.services.ai.copilot import FinancialCopilot

router = APIRouter()
copilot = FinancialCopilot()


# ── Schemas ──────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    message_id: str
    chart_data: Optional[Dict[str, Any]] = None
    suggestions: Optional[List[str]] = None
    latency_ms: int


class ConversationSummary(BaseModel):
    id: str
    title: Optional[str]
    summary: Optional[str]
    created_at: str
    message_count: int


# ── Routes ───────────────────────────────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message to the AI Financial Copilot."""
    start = time.perf_counter()

    # Get or create conversation
    if request.conversation_id:
        from sqlalchemy import select
        result = await db.execute(
            select(AIConversation).where(
                AIConversation.id == UUID(request.conversation_id),
                AIConversation.user_id == current_user.id,
            )
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = AIConversation(
            user_id=current_user.id,
            title=request.message[:60] + ("..." if len(request.message) > 60 else ""),
        )
        db.add(conversation)
        await db.flush()

    # Save user message
    user_msg = AIMessage(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    )
    db.add(user_msg)

    # AI response
    ai_response = await copilot.chat(
        user_id=str(current_user.id),
        message=request.message,
        conversation_id=str(conversation.id),
        db=db,
    )

    latency = int((time.perf_counter() - start) * 1000)

    # Save AI message
    ai_msg = AIMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=ai_response["text"],
        chart_data=ai_response.get("chart_data"),
        latency_ms=latency,
        model_used=ai_response.get("model_used", "gpt-4o"),
    )
    db.add(ai_msg)
    await db.flush()

    return ChatResponse(
        response=ai_response["text"],
        conversation_id=str(conversation.id),
        message_id=str(ai_msg.id),
        chart_data=ai_response.get("chart_data"),
        suggestions=ai_response.get("suggestions"),
        latency_ms=latency,
    )


@router.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all AI conversations for the current user."""
    from sqlalchemy import select, func
    result = await db.execute(
        select(AIConversation)
        .where(AIConversation.user_id == current_user.id, AIConversation.is_active == True)
        .order_by(AIConversation.updated_at.desc())
        .limit(20)
    )
    conversations = result.scalars().all()
    return [
        ConversationSummary(
            id=str(c.id),
            title=c.title,
            summary=c.summary,
            created_at=c.created_at.isoformat(),
            message_count=0,
        )
        for c in conversations
    ]


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve messages for a specific conversation."""
    from sqlalchemy import select
    result = await db.execute(
        select(AIMessage)
        .join(AIConversation)
        .where(
            AIConversation.id == conversation_id,
            AIConversation.user_id == current_user.id,
        )
        .order_by(AIMessage.created_at.asc())
    )
    messages = result.scalars().all()
    return [
        {
            "id": str(m.id),
            "role": m.role,
            "content": m.content,
            "chart_data": m.chart_data,
            "created_at": m.created_at.isoformat(),
        }
        for m in messages
    ]


@router.post("/analyze/health-score")
async def analyze_health_score(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a financial health score for the current user."""
    from app.services.ai.scoring import FinancialScoringEngine
    engine = FinancialScoringEngine()
    score = await engine.calculate_score(str(current_user.id), db)
    return score


@router.post("/analyze/budget")
async def generate_ai_budget(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate an AI-powered budget based on spending history."""
    from app.services.ai.budget_generator import BudgetGenerator
    gen = BudgetGenerator()
    budget = await gen.generate(str(current_user.id), db)
    return budget


@router.post("/analyze/subscriptions")
async def detect_subscriptions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Detect recurring subscriptions from transaction history."""
    from app.services.ai.subscription_detector import SubscriptionDetector
    detector = SubscriptionDetector()
    subscriptions = await detector.detect(str(current_user.id), db)
    return {"subscriptions": subscriptions}


@router.post("/analyze/anomalies")
async def detect_anomalies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run anomaly detection on recent transactions."""
    from app.services.ai.anomaly_detector import AnomalyDetector
    detector = AnomalyDetector()
    anomalies = await detector.detect(str(current_user.id), db)
    return {"anomalies": anomalies}


@router.post("/analyze/forecast")
async def forecast_finances(
    months: int = 6,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Forecast future income, expenses, and savings."""
    from app.services.ai.forecaster import FinancialForecaster
    forecaster = FinancialForecaster()
    forecast = await forecaster.forecast(str(current_user.id), db, months=months)
    return forecast
