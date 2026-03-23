# ADR-005: Prediction Architecture

**Date:** 2026-03-23
**Status:** Accepted
**Deciders:** Arctis core team
**Phase:** Phase 6 — Probability Research Layer

---

## Context

After completing the data pipeline (Phases 0-5), the next question is how to add
predictive capabilities. Options considered:

1. Binary signal generation (long/short at threshold crossings)
2. Probabilistic zones with confidence ranges
3. Direct ML model integration (LSTM, XGBoost, etc.)

Trading systems that emit binary signals encourage overconfidence. A signal that says
"go long" with no uncertainty estimate is misleading — markets are probabilistic by nature.
ML models trained without validated baselines often overfit and fail in production.

---

## Decision

**Use probabilistic zones, not binary signals, as the primary output of the prediction layer.**

Specifically:

1. **Probabilistic zones over binary signals.** Every prediction is expressed as a zone
   (price range) with an associated probability estimate (e.g., "68% probability price
   stays between 19,800 and 19,850 in next 15 bars"). This is displayed as a shaded region
   on the chart, not an arrow or signal dot.

2. **Baselines required before ML models.** Before any ML model is considered production-ready,
   a rule-based baseline must be implemented for the same prediction task. The ML model is
   only accepted if it materially outperforms the baseline on out-of-sample data.
   "Material" is defined as >5 percentage points improvement in the relevant metric
   (accuracy, log-likelihood, or calibration error depending on the task).

3. **Walk-forward validation is mandatory.** No model may be evaluated on data it was
   trained on. Walk-forward (expanding window) or time-series cross-validation must be used.
   Classic k-fold cross-validation is explicitly prohibited for time-series data due to
   look-ahead bias.

---

## Rationale

**Probabilistic zones:** Force the system to express uncertainty explicitly. A zone that is
wide communicates low confidence; a narrow zone communicates high confidence. This is more
honest than a binary signal and more actionable for risk sizing.

**Baselines first:** Rule-based baselines (e.g., "price will stay within N * ATR of VWAP")
are fast to implement, easy to reason about, and surprisingly competitive. Without a
baseline, there is no way to know if a complex ML model is actually adding value or just
fitting noise.

**Walk-forward validation:** Standard requirement for any financial ML system. The
`analysis/benchmark.py` harness enforces this. Results from non-walk-forward evaluation
are not accepted into the model registry.

---

## Consequences

**Positive:**
- Predictions are honest about uncertainty
- Baselines prevent wasted effort on non-predictive ML models
- Walk-forward validation produces realistic out-of-sample performance estimates
- `model_registry.py` provides a clean adapter interface for swapping models

**Negative:**
- Probabilistic zones are harder to display than binary arrows
- Baseline requirement adds implementation time before ML experimentation
- Walk-forward validation is slower than single-split evaluation

---

## Implementation

- `analysis/probability.py` — rule-based probabilistic zone computation (Phase 6)
- `analysis/benchmark.py` — walk-forward benchmark harness (Phase 6)
- `analysis/model_registry.py` — model adapter registry (Phase 6)
- Chart overlays for probability zones (Phase 4/5 chart update pipeline)

---

## Related ADRs

- ADR-001: Canonical app path
- ADR-002: Canonical data path
