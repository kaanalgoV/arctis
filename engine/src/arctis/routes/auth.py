"""Authentication routes.

Simple JWT-based auth with in-memory user store.
Intended as a scaffold — swap to DB-backed storage later.
"""

import hashlib
import hmac
import time
import uuid
from typing import Optional

import bcrypt
import jwt
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

_JWT_SECRET = "arctis-dev-secret-change-in-prod"
_JWT_ALGORITHM = "HS256"
_TOKEN_EXPIRY_SECONDS = 86400 * 7  # 7 days

# ---------------------------------------------------------------------------
# In-memory stores (replace with DB later)
# ---------------------------------------------------------------------------

# email -> { user_id, email, display_name, password_hash, created_at }
_USERS: dict[str, dict] = {}

# Revoked tokens (jti set)
_REVOKED: set[str] = set()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    email: str
    password: str
    display_name: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


class UserResponse(BaseModel):
    user_id: str
    email: str
    display_name: str
    created_at: float


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def _create_token(user_id: str, email: str) -> str:
    now = time.time()
    payload = {
        "sub": user_id,
        "email": email,
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + _TOKEN_EXPIRY_SECONDS,
    }
    return jwt.encode(payload, _JWT_SECRET, algorithm=_JWT_ALGORITHM)


def _decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, _JWT_SECRET, algorithms=[_JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

    if payload.get("jti") in _REVOKED:
        raise HTTPException(401, "Token revoked")

    return payload


def _get_current_user(authorization: str = Header(default="")) -> dict:
    """Dependency — extracts user from Authorization header."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid Authorization header")

    token = authorization[7:]
    payload = _decode_token(token)

    email = payload.get("email", "")
    user = _USERS.get(email)
    if not user:
        raise HTTPException(401, "User not found")

    return user


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/register", response_model=AuthResponse)
async def register(body: RegisterRequest):
    email = body.email.strip().lower()

    if email in _USERS:
        raise HTTPException(409, "Email already registered")

    if len(body.password) < 6:
        raise HTTPException(422, "Password must be at least 6 characters")

    user_id = str(uuid.uuid4())
    now = time.time()

    _USERS[email] = {
        "user_id": user_id,
        "email": email,
        "display_name": body.display_name or email.split("@")[0],
        "password_hash": _hash_password(body.password),
        "created_at": now,
    }

    token = _create_token(user_id, email)
    return AuthResponse(
        token=token,
        user={
            "user_id": user_id,
            "email": email,
            "display_name": _USERS[email]["display_name"],
            "created_at": now,
        },
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    email = body.email.strip().lower()
    user = _USERS.get(email)

    if not user or not _verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")

    token = _create_token(user["user_id"], email)
    return AuthResponse(
        token=token,
        user={
            "user_id": user["user_id"],
            "email": user["email"],
            "display_name": user["display_name"],
            "created_at": user["created_at"],
        },
    )


@router.get("/me")
async def me(user: dict = Depends(_get_current_user)):
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "display_name": user["display_name"],
        "created_at": user["created_at"],
    }


@router.post("/logout")
async def logout(authorization: str = Header(default="")):
    if not authorization.startswith("Bearer "):
        return {"ok": True}

    token = authorization[7:]
    try:
        payload = jwt.decode(token, _JWT_SECRET, algorithms=[_JWT_ALGORITHM])
        jti = payload.get("jti")
        if jti:
            _REVOKED.add(jti)
    except jwt.InvalidTokenError:
        pass

    return {"ok": True}
