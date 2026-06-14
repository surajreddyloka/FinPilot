"""
FinPilot AI — FastAPI Application Entry Point
Configures middleware, routers, lifespan, and error handlers.
"""

from __future__ import annotations

import time
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.core.database import close_db, init_db
from app.api.v1.router import api_router

logger = structlog.get_logger()


# ── Lifespan ────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle events."""
    logger.info("🚀 FinPilot AI starting up...", env=settings.APP_ENV)
    await init_db()
    logger.info("✅ Database initialized")
    yield
    logger.info("🛑 FinPilot AI shutting down...")
    await close_db()


# ── App Factory ─────────────────────────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title="FinPilot AI",
        description="Enterprise AI-Powered Personal Finance Assistant API",
        version=settings.APP_VERSION,
        docs_url="/api/docs" if settings.DEBUG else None,
        redoc_url="/api/redoc" if settings.DEBUG else None,
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS ────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── GZip compression ─────────────────────────────────────────
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # ── Request timing middleware ─────────────────────────────────
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        start_time = time.perf_counter()
        response: Response = await call_next(request)
        process_time = (time.perf_counter() - start_time) * 1000
        response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
        response.headers["X-App-Version"] = settings.APP_VERSION
        return response

    # ── Security headers ──────────────────────────────────────────
    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response

    # ── Prometheus Metrics ────────────────────────────────────────
    if settings.PROMETHEUS_ENABLED:
        Instrumentator().instrument(app).expose(app, endpoint="/metrics")

    # ── Routes ───────────────────────────────────────────────────
    app.include_router(api_router, prefix=settings.API_V1_STR)

    # ── Global Error Handlers ─────────────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error("Unhandled exception", exc_info=exc, path=request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred", "type": "internal_error"},
        )

    # ── Health Check ──────────────────────────────────────────────
    @app.get("/health", tags=["health"])
    async def health_check():
        return {
            "status": "healthy",
            "version": settings.APP_VERSION,
            "env": settings.APP_ENV,
        }

    return app


app = create_app()
