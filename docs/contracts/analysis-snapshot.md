# Analysis Snapshot Contract

## Endpoint

```
GET /api/snapshot
```

## Query Parameters

| Parameter   | Type   | Required | Default  | Description                         |
|-------------|--------|----------|----------|-------------------------------------|
| `market`    | string | yes      | —        | Market symbol, e.g. `NQ`, `ES`      |
| `timeframe` | string | no       | `15min`  | Bar timeframe: `1min`, `5min`, `15min`, `30min`, `1h` |
| `days`      | int    | no       | `5`      | Number of calendar days to load     |

## Purpose

Replaces 10 individual parallel frontend calls with a single atomic snapshot.
All sub-analyses share the same bar-load, which eliminates race conditions and
guarantees data consistency across panels.

Individual endpoints (`/api/analysis/*`, `/api/signals`, `/api/config`) remain
fully operational and are not affected.

---

## Response Shape

```jsonc
{
  // Top-level metadata
  "market": "NQ",
  "timeframe": "15min",
  "timestamp": 1742900000.0,   // Unix epoch (float) when snapshot was built

  // --- SESSIONS (/api/analysis/sessions) ---
  "sessions": {
    "market": "NQ",
    "timeframe": "15min",
    "current_session": "RTH",  // "PRE" | "RTH" | "LUNCH" | "POST" | "OVERNIGHT"
    "session_stats": {
      "RTH": {
        "bar_count": 120,
        "avg_volume": 18450.3,
        "avg_range": 12.5,
        "total_volume": 2214036
      }
      // ...other sessions
    },
    "bar_count": 480
  },

  // --- INDICATORS (/api/analysis/indicators) ---
  "indicators": {
    "market": "NQ",
    "timeframe": "15min",
    "vwap": [
      {
        "timestamp": 1742800000,
        "vwap": 18450.25,
        "upper_1": 18475.50,
        "lower_1": 18425.00,
        "upper_2": 18500.75,
        "lower_2": 18399.75
      }
      // ...
    ],
    "ema": [
      {
        "timestamp": 1742800000,
        "ema9": 18448.00,
        "ema21": 18440.50,
        "ema50": 18420.00,
        "alignment": "bullish"  // "bullish" | "bearish" | "mixed"
      }
      // ...
    ],
    "rsi": [
      {
        "timestamp": 1742800000,
        "rsi": 58.3,
        "divergence": null  // null | "bullish" | "bearish"
      }
      // ...
    ],
    "volume_profile": {
      "poc": 18450.0,
      "vah": 18490.0,
      "val": 18410.0,
      "total_volume": 5800000
    },
    "daily_volume_profiles": [
      { "date": "2026-03-24", "poc": 18430.0, "vah": 18470.0, "val": 18390.0, "total_volume": 1200000 }
      // ...
    ],
    "session_levels": {
      "prev_high": 18510.0,
      "prev_low": 18370.0,
      "prev_close": 18450.0,
      "prev_poc": 18430.0,
      "overnight_high": 18475.0,
      "overnight_low": 18410.0,
      "opening_range_high": 18465.0,
      "opening_range_low": 18435.0
    }
  },

  // --- CONFLUENCE (/api/analysis/confluence) ---
  "confluence": {
    "market": "NQ",
    "timeframe": "15min",
    "score": 7,
    "max_score": 10,
    "direction": "long",        // "long" | "short" | "neutral"
    "confidence": "high",       // "high" | "medium" | "low"
    "signals": [
      {
        "name": "EMA Alignment",
        "direction": "long",
        "strength": 2,
        "detail": "EMA9 > EMA21 > EMA50 bullish stack"
      }
      // ...
    ],
    "indicators": {
      "vwap": { "vwap": 18450.25, "upper_1": 18475.50, "lower_1": 18425.00, "upper_2": 18500.75, "lower_2": 18399.75 },
      "ema": { "ema9": 18448.0, "ema21": 18440.5, "ema50": 18420.0, "alignment": "bullish" },
      "rsi": { "rsi": 58.3, "divergence": null },
      "volume_profile": { "poc": 18450.0, "vah": 18490.0, "val": 18410.0 },
      "session_levels": {
        "prev_high": 18510.0, "prev_low": 18370.0, "prev_close": 18450.0,
        "opening_range_high": 18465.0, "opening_range_low": 18435.0
      }
    }
  },

  // --- PATTERNS (/api/analysis/patterns) ---
  "patterns": {
    "annotations": [
      {
        "timestamp": 1742800000,
        "pattern": "VWAP Reclaim",
        "direction": "long",
        "text": "VWAP Reclaim",
        "detail": "Price reclaimed VWAP after brief dip",
        "confidence": 0.75,
        "win_rate": 0.68,
        "profit_factor": 1.8,
        "sample_size": 120,
        "category": "momentum",
        "price": 18445.0,
        "target": 18490.0,
        "marker_type": "arrow_up",
        "color": "#5CB8F0",
        "expiry_days": 3
      }
      // ...
    ],
    "day_type": "trend",    // "trend" | "range" | "transition"
    "day_bias": "bullish"   // "bullish" | "bearish" | "neutral"
  },

  // --- VOLUME (/api/analysis/volume) ---
  "volume": {
    "market": "NQ",
    "timeframe": "15min",
    "relative_volume": [
      { "index": 0, "timestamp": 1742800000, "rvol": 1.25 }
      // ...
    ],
    "spikes": [
      { "index": 42, "timestamp": 1742820000, "volume": 45000, "ratio": 3.12 }
      // ...
    ],
    "bar_count": 480
  },

  // --- STRUCTURE (/api/analysis/structure) ---
  "structure": {
    "market": "NQ",
    "timeframe": "15min",
    "trend": "bullish",   // "bullish" | "bearish" | "ranging"
    "swings": [
      { "type": "high", "price": 18510.0, "index": 95, "timestamp": 1742850000 }
      // ... last 50 swings
    ],
    "structure_breaks": [
      {
        "type": "BOS",          // "BOS" (Break of Structure) | "CHoCH" (Change of Character)
        "direction": "bullish",
        "price": 18470.0,
        "index": 88,
        "timestamp": 1742845000
      }
      // ... last 30 breaks
    ],
    "bar_count": 480
  },

  // --- BIAS (/api/analysis/bias) ---
  "bias": {
    "market": "NQ",
    "timeframe": "15min",
    "bar_count": 480,
    "confidence": 0.6250,        // Normalized 0..1 from raw score -10..+10
    "bias_state": {
      "state": "BULLISH",        // "STRONG_BULLISH" | "BULLISH" | "RANGE" | "BEARISH" | "STRONG_BEARISH"
      "score": 2.5,
      "components": { "trend": 2, "velocity": 1, "ema": 1, "vwap": 0.5 }
    },
    "bias_switch_level": {
      "level": 18420.0,
      "type": "support",
      "confidence": 0.80,
      "description": "Prior POC acts as bias invalidation level"
    },
    "velocity": {
      "current": 12.5,
      "average": 9.8,
      "ratio": 1.28,
      "scale": 3,
      "signed_scale": 3
    },
    "auction_quality": {
      "score": 7,
      "label": "gut",
      "type": "trending"
    },
    "naked_pocs": [
      { "date": "2026-03-22", "price": 18390.0, "naked": true, "distance": 62.5 }
      // ... up to 5
    ],
    "opening_fake": {
      "detected": false,
      "direction": null,
      "confidence": 0.0
    },
    "double_fake": {
      "detected": false,
      "direction": null,
      "confidence": 0.0
    },
    "correction": {
      "impulse_size": 80.0,
      "correction_pct": 38.2,
      "is_threat": false,
      "direction": "bullish"
    },
    "key_levels": [
      { "level": 18500.0, "tests": 3, "type": "resistance" }
      // ... up to 10
    ]
  },

  // --- ZONES (/api/analysis/zones) ---
  "zones": {
    "zones": [
      {
        "name": "Previous Day High",
        "type": "line",          // "line" | "area"
        "high": 18510.0,
        "low": 18510.0,
        "color": "#F0A05C",
        "opacity": 0.15,
        "start_time": 1742700000,
        "end_time": null,        // null = extends to present
        "label": "PDH",
        "priority": 1
      }
      // ...
    ],
    "bar_count": 480,
    "zone_count": 12
  },

  // --- SIGNALS (/api/analysis/signals or /api/signals) ---
  "signals": {
    "signals": [
      {
        "direction": "long",
        "type": "VWAP_RECLAIM",
        "entry": 18450.0,
        "stop": 18430.0,
        "target": 18490.0,
        "rr": 2.0,
        "confidence": "high",
        "reason": "Price reclaimed VWAP with EMA alignment",
        "timestamp": 1742855000
      }
      // ...
    ],
    "bias": "BULLISH",
    "bias_score": 2.5
  },

  // --- ERROR MAP ---
  // If a sub-analysis fails, its key contains null and the error is recorded here.
  // All other sub-analyses are still returned normally.
  "errors": {
    // "sessions": "Keine Bars fuer NQ (15min) in der DB gefunden."
    // empty when all succeed
  }
}
```

---

## Error Handling

Each sub-analysis runs concurrently via `asyncio.gather(..., return_exceptions=True)`.
If one analysis raises an exception:
- Its key in the response is `null`
- The error message is stored under `errors.<key>`
- All other keys are unaffected

The endpoint only returns HTTP 500 if the bar-load itself fails (no data at all).

---

## Sub-Analysis to Route Mapping

| Response Key  | Source Route                        | Analysis Functions Called               |
|---------------|-------------------------------------|-----------------------------------------|
| `sessions`    | `GET /api/analysis/sessions`        | `get_session_stats`, `classify_session` |
| `indicators`  | `GET /api/analysis/indicators`      | `calculate_vwap`, `calculate_ema_ribbon`, `calculate_rsi`, `build_volume_profile`, `build_daily_volume_profiles`, `calculate_session_levels` |
| `confluence`  | `GET /api/analysis/confluence`      | `calculate_confluence` + all indicators  |
| `patterns`    | `GET /api/analysis/patterns`        | `detect_patterns`                        |
| `volume`      | `GET /api/analysis/volume`          | `relative_volume`, `detect_volume_spikes` |
| `structure`   | `GET /api/analysis/structure`       | `detect_swings`, `classify_trend`, `detect_structure_breaks` |
| `bias`        | `GET /api/analysis/bias`            | Full BIAS pipeline (velocity, auction, naked POCs, bias state, ...) |
| `zones`       | `GET /api/analysis/zones`           | `calculate_zones`                        |
| `signals`     | `GET /api/analysis/signals`         | `detect_signals` + bias state + zones    |

`/api/config` is intentionally excluded from the snapshot — config is static and
should be fetched once at app start, not on every market refresh.
