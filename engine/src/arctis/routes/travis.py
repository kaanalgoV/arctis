"""Travis MCP proxy route.

Provides contextual trading education content from the Traivend knowledge base.
When the real Travis MCP is available, this proxy can be extended to forward
requests. For now it returns static knowledge matched to the incoming question.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["travis"])

# ---------------------------------------------------------------------------
# Static knowledge base
# ---------------------------------------------------------------------------

_KNOWLEDGE: dict[str, dict[str, str]] = {
    "ORB": {
        "title": "Opening Range Breakout",
        "content": (
            "The ORB strategy uses the first 15-minute range as a reference zone. "
            "A breakout above the Opening Range High signals potential long momentum, "
            "while a break below the Opening Range Low signals short pressure. "
            "Volume confirmation is critical — avoid chasing low-volume breakouts."
        ),
    },
    "IB": {
        "title": "Initial Balance",
        "content": (
            "The Initial Balance (IB) represents the price range established during "
            "the first trading hour. Extensions beyond the IB in either direction "
            "often indicate directional conviction. A narrow IB suggests "
            "a potential trending day; a wide IB may signal a range-bound session."
        ),
    },
    "VWAP": {
        "title": "Volume Weighted Average Price",
        "content": (
            "VWAP serves as a dynamic support/resistance level representing the average "
            "price weighted by volume. Price above VWAP favors long bias; below VWAP "
            "favors short bias. VWAP reclaims and rejections are high-probability setups "
            "when accompanied by strong volume."
        ),
    },
    "velocity": {
        "title": "Auction Velocity",
        "content": (
            "Velocity measures how fast price is moving through levels. High velocity "
            "in one direction signals strong conviction and trend continuation probability. "
            "Low velocity near key levels indicates potential reversal zones. "
            "Monitor velocity changes at VWAP, session highs/lows, and prior day levels."
        ),
    },
    "bias": {
        "title": "Market Bias",
        "content": (
            "Bias represents the current market tendency derived from price structure, "
            "VWAP position, and session context. A RANGE_LONG bias means the balance of "
            "evidence favors longs from value. A RANGE_SHORT bias favors shorts from "
            "resistance. Trending biases indicate a directional day with less mean-reversion."
        ),
    },
    "long": {
        "title": "Long Bias Setup",
        "content": (
            "In a long-bias environment, look for pullbacks to VWAP or the Opening Range "
            "High as long entries. Avoid fading up-moves early in the session. "
            "Confirm with volume and EMA alignment before entry."
        ),
    },
    "short": {
        "title": "Short Bias Setup",
        "content": (
            "In a short-bias environment, look for rallies to VWAP or prior resistance "
            "as short entries. Confirm with high-velocity moves downward and volume "
            "rejection at overhead levels. Respect the trend until structural change."
        ),
    },
    "trending": {
        "title": "Trending Day",
        "content": (
            "Trending days are characterized by consistent directional movement with "
            "minimal pullbacks. Key signs include a narrow Initial Balance, early "
            "strong directional move, and price consistently above or below VWAP. "
            "On trending days, avoid counter-trend trades and favor continuation entries."
        ),
    },
    "range": {
        "title": "Range Day",
        "content": (
            "Range days oscillate between defined support and resistance levels. "
            "Entries near extremes with defined risk offer the best risk-reward. "
            "A wide Initial Balance with price returning to VWAP repeatedly is "
            "a strong range-day indicator."
        ),
    },
}

# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------


@router.post("/travis/ask")
async def ask_travis(body: dict) -> dict:
    """Proxy to Travis MCP.

    Matches the question against the static knowledge base and returns
    relevant educational entries. Multiple matches are returned if the
    question references several concepts.
    """
    question: str = body.get("question", "")
    question_lower = question.lower()

    results = []
    for key, entry in _KNOWLEDGE.items():
        if key.lower() in question_lower:
            results.append(entry)

    if not results:
        results = [
            {
                "title": "Trading Fundamentals",
                "content": (
                    "Explore the Traivend education platform for comprehensive "
                    "trading education covering price action, auction theory, "
                    "and systematic trade planning."
                ),
            }
        ]

    return {"question": question, "results": results}
