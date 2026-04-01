"""Checkout / subscription route — SEPA & credit card subscription handling."""

import logging
import secrets
import string
import time
import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/checkout", tags=["checkout"])


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class CheckoutRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    plan: str  # "monthly" or "annual"
    payment_method: str  # "sepa" or "credit_card"
    # SEPA fields (optional)
    iban: str = ""
    account_holder: str = ""
    sepa_consent: bool = False
    # Credit card fields (optional)
    card_number: str = ""
    card_expiry: str = ""
    card_cvv: str = ""
    card_holder: str = ""


class CheckoutResponse(BaseModel):
    success: bool
    subscription_id: str
    message: str
    login_email: str
    login_password: str  # generated
    next_billing_date: str
    plan_price: str


# ---------------------------------------------------------------------------
# In-memory store (replace with DB later)
# ---------------------------------------------------------------------------

_subscriptions: dict[str, dict] = {}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def generate_password(length: int = 12) -> str:
    chars = string.ascii_letters + string.digits + "!@#$%"
    return "".join(secrets.choice(chars) for _ in range(length))


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/subscribe", response_model=CheckoutResponse)
async def subscribe(req: CheckoutRequest):
    """Create a new subscription with SEPA or credit card payment details."""

    # --- Common validation ---
    if req.plan not in ("monthly", "annual"):
        raise HTTPException(400, "Ungueltiger Plan. Erlaubt: 'monthly' oder 'annual'")

    if req.payment_method not in ("sepa", "credit_card"):
        raise HTTPException(400, "Ungueltige Zahlungsmethode. Erlaubt: 'sepa' oder 'credit_card'")

    if not req.first_name.strip() or not req.last_name.strip():
        raise HTTPException(400, "Vor- und Nachname erforderlich")

    if not req.email.strip() or "@" not in req.email:
        raise HTTPException(400, "Gueltige E-Mail-Adresse erforderlich")

    # --- Payment-method-specific validation ---
    if req.payment_method == "sepa":
        if not req.sepa_consent:
            raise HTTPException(400, "SEPA-Einzugsermaechtigung erforderlich")
        if len(req.iban.replace(" ", "")) < 15:
            raise HTTPException(400, "IBAN ist zu kurz")
        if not req.account_holder.strip():
            raise HTTPException(400, "Kontoinhaber ist erforderlich")

    elif req.payment_method == "credit_card":
        card_num_clean = req.card_number.replace(" ", "")
        if len(card_num_clean) < 13 or len(card_num_clean) > 19:
            raise HTTPException(400, "Ungueltige Kartennummer")
        if not req.card_expiry or len(req.card_expiry) < 4:
            raise HTTPException(400, "Ablaufdatum ist erforderlich (MM/YY)")
        if not req.card_cvv or len(req.card_cvv) < 3:
            raise HTTPException(400, "CVV ist erforderlich (3 Ziffern)")
        if not req.card_holder.strip():
            raise HTTPException(400, "Karteninhaber ist erforderlich")

    # --- Create subscription ---
    sub_id = str(uuid.uuid4())[:8].upper()
    now = datetime.now(timezone.utc)

    if req.plan == "annual":
        next_billing = now + timedelta(days=365)
        price = "468\u20ac/Jahr"
        monthly_rate = 39
    else:
        next_billing = now + timedelta(days=30)
        price = "49\u20ac/Monat"
        monthly_rate = 49

    next_billing_str = next_billing.strftime("%d.%m.%Y")

    _subscriptions[sub_id] = {
        "id": sub_id,
        "name": f"{req.first_name} {req.last_name}",
        "email": req.email.strip().lower(),
        "plan": req.plan,
        "price": monthly_rate,
        "payment_method": req.payment_method,
        "status": "active",
        "created_at": now.isoformat(),
        "last_payment_at": now.isoformat(),
        "next_billing_date": next_billing.isoformat(),
    }

    # --- Auto-create user account ---
    generated_password = generate_password()
    email_lower = req.email.strip().lower()
    display_name = f"{req.first_name} {req.last_name}"

    try:
        from arctis.routes.auth import _USERS, _hash_password
        if email_lower not in _USERS:
            user_id = str(uuid.uuid4())
            _USERS[email_lower] = {
                "user_id": user_id,
                "email": email_lower,
                "display_name": display_name,
                "password_hash": _hash_password(generated_password),
                "created_at": time.time(),
            }
            logger.info("Auto-created user account for %s", email_lower)
        else:
            logger.info("User %s already exists, skipping account creation", email_lower)
    except Exception as e:
        logger.warning("Failed to auto-create user: %s", e)

    return CheckoutResponse(
        success=True,
        subscription_id=sub_id,
        message=f"Willkommen bei Arctis, {req.first_name}!",
        login_email=email_lower,
        login_password=generated_password,
        next_billing_date=next_billing_str,
        plan_price=price,
    )


@router.get("/subscription/{sub_id}")
async def get_subscription(sub_id: str):
    """Check subscription status."""
    sub = _subscriptions.get(sub_id.upper())
    if not sub:
        raise HTTPException(404, "Abo nicht gefunden")

    return {
        "id": sub["id"],
        "status": sub["status"],
        "plan": sub["plan"],
        "price": sub["price"],
        "payment_method": sub["payment_method"],
        "next_billing_date": sub["next_billing_date"],
        "created_at": sub["created_at"],
        "last_payment_at": sub["last_payment_at"],
    }
