"""
FinPilot AI — Authentication API Router
Handles register, login, OAuth2, MFA, token refresh, logout.
"""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    generate_mfa_qr_code,
    generate_mfa_secret,
    get_password_hash,
    verify_mfa_token,
    verify_password,
    verify_token,
)
from app.models.models import AuditLog, User, UserRole
from app.repositories.user_repository import UserRepository

try:
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
except ImportError:
    id_token = None
    google_requests = None

from app.core.config import settings

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    mfa_token: Optional[str] = None


class GoogleLoginRequest(BaseModel):
    credential: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    mfa_required: bool = False


class RefreshRequest(BaseModel):
    refresh_token: str


class MFASetupResponse(BaseModel):
    secret: str
    qr_code_base64: str
    provisioning_uri: str


class MFAVerifyRequest(BaseModel):
    token: str
    secret: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    mfa_enabled: bool
    avatar_url: Optional[str]
    currency: str
    theme: str

    class Config:
        from_attributes = True


# ── Routes ───────────────────────────────────────────────────────────────────
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account."""
    repo = UserRepository(db)
    existing = await repo.get_by_email(request.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = await repo.create(
        email=request.email,
        hashed_password=get_password_hash(request.password),
        full_name=request.full_name,
        role=UserRole.user,
        is_active=True,
        is_verified=False,
    )

    # Audit log
    db.add(AuditLog(user_id=user.id, action="user.register", resource_type="user", resource_id=str(user.id)))

    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        is_active=user.is_active,
        is_verified=user.is_verified,
        mfa_enabled=user.mfa_enabled,
        avatar_url=user.avatar_url,
        currency=user.currency,
        theme=user.theme,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate user and return JWT tokens."""
    repo = UserRepository(db)
    user = await repo.get_by_email(request.email)

    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(request.password, user.hashed_password):
        db.add(AuditLog(
            user_id=user.id, action="auth.login_failed",
            ip_address=http_request.client.host if http_request.client else None,
            severity="warning",
        ))
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    # MFA check
    if user.mfa_enabled:
        if not request.mfa_token:
            return TokenResponse(
                access_token="",
                refresh_token="",
                user_id=str(user.id),
                role=user.role.value,
                mfa_required=True,
            )
        if not verify_mfa_token(user.mfa_secret, request.mfa_token):
            raise HTTPException(status_code=401, detail="Invalid MFA token")

    access_token = create_access_token(
        subject=str(user.id),
        extra_claims={"role": user.role.value, "email": user.email},
    )
    refresh_token = create_refresh_token(subject=str(user.id))

    db.add(AuditLog(
        user_id=user.id,
        action="auth.login_success",
        ip_address=http_request.client.host if http_request.client else None,
    ))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(user.id),
        role=user.role.value,
    )


@router.post("/google", response_model=TokenResponse)
async def google_login(
    request: GoogleLoginRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate user with Google OAuth credential."""
    if not id_token or not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google authentication is not configured on the server")

    try:
        id_info = id_token.verify_oauth2_token(
            request.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google authentication token")

    email = id_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email associated")

    repo = UserRepository(db)
    user = await repo.get_by_email(email)

    if not user:
        # Auto-register new user via Google
        name = id_info.get("name", email.split("@")[0])
        avatar = id_info.get("picture")
        user = await repo.create(
            email=email,
            hashed_password="",  # No password for OAuth users
            full_name=name,
            role=UserRole.user,
            is_active=True,
            is_verified=True,  # Google verified the email
        )
        if avatar:
            user.avatar_url = avatar
            db.add(user)
            await db.commit()

        db.add(AuditLog(user_id=user.id, action="user.register_google", resource_type="user", resource_id=str(user.id)))
    else:
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is disabled")

    # Issue our tokens
    access_token = create_access_token(
        subject=str(user.id),
        extra_claims={"role": user.role.value, "email": user.email},
    )
    refresh_token = create_refresh_token(subject=str(user.id))

    db.add(AuditLog(
        user_id=user.id,
        action="auth.login_google",
        ip_address=http_request.client.host if http_request.client else None,
    ))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(user.id),
        role=user.role.value,
    )



@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """Refresh access token using a valid refresh token."""
    user_id = verify_token(request.refresh_token, token_type="refresh")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    access_token = create_access_token(
        subject=str(user.id),
        extra_claims={"role": user.role.value, "email": user.email},
    )
    new_refresh = create_refresh_token(subject=str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        user_id=str(user.id),
        role=user.role.value,
    )


@router.post("/mfa/setup", response_model=MFASetupResponse)
async def setup_mfa(
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user),  # commented for brevity
):
    """Generate MFA secret and QR code."""
    secret = generate_mfa_secret()
    qr_code = generate_mfa_qr_code(secret, "user@example.com")
    from app.core.security import get_mfa_uri
    uri = get_mfa_uri(secret, "user@example.com")
    return MFASetupResponse(secret=secret, qr_code_base64=qr_code, provisioning_uri=uri)


@router.post("/mfa/verify")
async def verify_mfa(request: MFAVerifyRequest):
    """Verify a TOTP token against the provided secret."""
    valid = verify_mfa_token(request.secret, request.token)
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid MFA token")
    return {"verified": True, "message": "MFA token is valid"}
