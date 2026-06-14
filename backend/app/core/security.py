"""
FinPilot AI — Security Layer
JWT, password hashing, MFA (TOTP), encryption utilities.
"""

from __future__ import annotations

import base64
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union

import pyotp
import qrcode
import qrcode.image.svg
from cryptography.fernet import Fernet
from io import BytesIO
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# ── Password Hashing ────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# ── JWT Tokens ──────────────────────────────────────────────────────────────
def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[dict] = None,
) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode: dict = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
        "jti": secrets.token_urlsafe(16),
    }
    if extra_claims:
        to_encode.update(extra_claims)
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: Union[str, Any]) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
        "jti": secrets.token_urlsafe(32),
    }
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])


def verify_token(token: str, token_type: str = "access") -> Optional[str]:
    try:
        payload = decode_token(token)
        if payload.get("type") != token_type:
            return None
        return payload.get("sub")
    except JWTError:
        return None


# ── MFA (TOTP) ──────────────────────────────────────────────────────────────
def generate_mfa_secret() -> str:
    return pyotp.random_base32()


def get_mfa_uri(secret: str, user_email: str) -> str:
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(
        name=user_email,
        issuer_name=settings.MFA_ISSUER,
    )


def generate_mfa_qr_code(secret: str, user_email: str) -> str:
    """Returns base64-encoded PNG QR code."""
    uri = get_mfa_uri(secret, user_email)
    img = qrcode.make(uri)
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


def verify_mfa_token(secret: str, token: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=1)


# ── Field-Level Encryption (AES-256 via Fernet) ─────────────────────────────
def _get_fernet() -> Fernet:
    key = base64.urlsafe_b64encode(settings.ENCRYPTION_KEY.encode()[:32])
    return Fernet(key)


def encrypt_field(value: str) -> str:
    f = _get_fernet()
    return f.encrypt(value.encode()).decode()


def decrypt_field(encrypted_value: str) -> str:
    f = _get_fernet()
    return f.decrypt(encrypted_value.encode()).decode()


# ── Secure Token Generation ──────────────────────────────────────────────────
def generate_secure_token(length: int = 32) -> str:
    return secrets.token_urlsafe(length)


def generate_numeric_otp(length: int = 6) -> str:
    return "".join([str(secrets.randbelow(10)) for _ in range(length)])
