"""
FinPilot AI — Core Configuration
All settings are loaded from environment variables with sensible defaults.
"""

from __future__ import annotations

import secrets
from typing import List, Optional, Union

from pydantic import AnyHttpUrl, EmailStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────────────
    APP_NAME: str = "FinPilot AI"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(64)
    ALLOWED_HOSTS: List[str] = ["*"]
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://finpilot.ai",
    ]

    # ── Database ─────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/finpilot"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_POOL_TIMEOUT: int = 30

    # ── Redis ────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 3600  # 1 hour

    # ── JWT Authentication ────────────────────────────────────────
    JWT_ALGORITHM: str = "HS256"
    JWT_SECRET_KEY: str = secrets.token_urlsafe(64)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ── OAuth2 ───────────────────────────────────────────────────
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    OAUTH_REDIRECT_URL: str = "http://localhost:3000/auth/callback"

    # ── OpenAI / LLM ─────────────────────────────────────────────
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_MAX_TOKENS: int = 4096
    OPENAI_TEMPERATURE: float = 0.3

    # ── Vector DB (ChromaDB) ──────────────────────────────────────
    CHROMA_PERSIST_DIRECTORY: str = "./data/chromadb"
    CHROMA_COLLECTION_NAME: str = "finpilot_knowledge"

    # ── AWS S3 ───────────────────────────────────────────────────
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "finpilot-documents"
    USE_LOCAL_STORAGE: bool = True  # Fallback to local FS in dev
    LOCAL_STORAGE_PATH: str = "./data/uploads"

    # ── Email ────────────────────────────────────────────────────
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: EmailStr = "noreply@finpilot.ai"
    EMAILS_FROM_NAME: str = "FinPilot AI"
    EMAIL_ENABLED: bool = False

    # ── Celery ───────────────────────────────────────────────────
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # ── Rate Limiting ────────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000

    # ── Security ─────────────────────────────────────────────────
    ENCRYPTION_KEY: str = secrets.token_urlsafe(32)
    MFA_ISSUER: str = "FinPilot AI"
    AUDIT_LOG_ENABLED: bool = True

    # ── Plaid / Banking ───────────────────────────────────────────
    PLAID_CLIENT_ID: Optional[str] = None
    PLAID_SECRET: Optional[str] = None
    PLAID_ENV: str = "sandbox"
    USE_MOCK_BANKING: bool = True

    # ── Monitoring ───────────────────────────────────────────────
    PROMETHEUS_ENABLED: bool = True
    OTEL_EXPORTER_OTLP_ENDPOINT: Optional[str] = None

    # ── Superuser ────────────────────────────────────────────────
    FIRST_SUPERUSER_EMAIL: EmailStr = "admin@finpilot.ai"
    FIRST_SUPERUSER_PASSWORD: str = "ChangeMe@123!"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)


settings = Settings()
