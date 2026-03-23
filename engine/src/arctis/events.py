"""Feed event engine — tracks analysis state changes and generates structured events."""

from __future__ import annotations

import statistics
import time as _time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal

# ── Types ─────────────────────────────────────────────────────────────────────

EventType = Literal["session_change", "confluence_shift", "volume_spike", "pattern_trigger"]


@dataclass(frozen=True)
class FeedEvent:
    """A single feed event.  Immutable so it can be hashed for deduplication."""

    type: EventType
    timestamp: int  # Unix seconds
    message: str
    severity: str = "info"  # info | warning | signal | critical
    source: str = "engine"
    # Extra payload (serialised to dict on output)
    detail: dict = field(default_factory=dict, compare=False, hash=False)

    @property
    def dedup_key(self) -> tuple:
        """Deduplication key: (type, timestamp rounded to 30-second buckets)."""
        return (self.type, self.timestamp // 30)

    def to_dict(self) -> dict:
        dt = datetime.fromtimestamp(self.timestamp, tz=timezone.utc)
        return {
            "type": self.type,
            "timestamp": self.timestamp,
            "time": dt.strftime("%H:%M"),
            "message": self.message,
            "severity": self.severity,
            "source": self.source,
            **self.detail,
        }


# ── State snapshot ─────────────────────────────────────────────────────────────

@dataclass
class AnalysisSnapshot:
    """Lightweight snapshot of analysis state captured at each poll."""

    timestamp: int
    session: str
    confluence_score: int
    confluence_direction: str
    volume_ratios: list[float]  # recent RVOL values
    patterns: list[str]  # names of active patterns


class FeedEventEngine:
    """Compares successive AnalysisSnapshots and emits events for state changes.

    Usage::

        engine = FeedEventEngine()
        # On each poll:
        snapshot = build_snapshot(...)
        new_events = engine.update(snapshot)
        # Persist / return new_events

    The engine deduplicates by (type, timestamp // 30) so identical events
    within the same 30-second window are suppressed.
    """

    # Maximum number of events to keep in the internal ring buffer.
    MAX_STORED = 500

    def __init__(self) -> None:
        self._previous: AnalysisSnapshot | None = None
        self._emitted_keys: set[tuple] = set()
        self._events: list[FeedEvent] = []

    # ── Public API ─────────────────────────────────────────────────────────────

    def update(self, snapshot: AnalysisSnapshot) -> list[FeedEvent]:
        """Diff *snapshot* against the last known state and return newly emitted events.

        Returns only events that passed deduplication and were actually stored.
        """
        candidates: list[FeedEvent] = []

        if self._previous is not None:
            candidates.extend(self._check_session_change(self._previous, snapshot))
            candidates.extend(self._check_confluence_shift(self._previous, snapshot))
            candidates.extend(self._check_volume_spike(snapshot))
            candidates.extend(self._check_pattern_trigger(self._previous, snapshot))

        # Deduplicate and store; only return the events that were actually kept.
        accepted: list[FeedEvent] = []
        for evt in candidates:
            if evt.dedup_key not in self._emitted_keys:
                self._emitted_keys.add(evt.dedup_key)
                self._events.append(evt)
                accepted.append(evt)

        # Trim ring buffer
        if len(self._events) > self.MAX_STORED:
            removed = self._events[: len(self._events) - self.MAX_STORED]
            self._events = self._events[len(self._events) - self.MAX_STORED :]
            # Purge stale dedup keys for removed events
            removed_keys = {e.dedup_key for e in removed}
            self._emitted_keys -= removed_keys

        self._previous = snapshot
        return accepted

    def get_events_since(self, since: int) -> list[FeedEvent]:
        """Return all stored events with timestamp >= *since*, newest first."""
        filtered = [e for e in self._events if e.timestamp >= since]
        filtered.sort(key=lambda e: e.timestamp, reverse=True)
        return filtered

    def reset(self) -> None:
        """Clear all state (useful for testing)."""
        self._previous = None
        self._emitted_keys.clear()
        self._events.clear()

    # ── Event generators ───────────────────────────────────────────────────────

    @staticmethod
    def _check_session_change(
        prev: AnalysisSnapshot, curr: AnalysisSnapshot
    ) -> list[FeedEvent]:
        if prev.session != curr.session:
            return [
                FeedEvent(
                    type="session_change",
                    timestamp=curr.timestamp,
                    message=f"Session changed: {prev.session} → {curr.session}",
                    severity="info",
                    source="sessions",
                    detail={"from_session": prev.session, "to_session": curr.session},
                )
            ]
        return []

    @staticmethod
    def _check_confluence_shift(
        prev: AnalysisSnapshot, curr: AnalysisSnapshot
    ) -> list[FeedEvent]:
        delta = curr.confluence_score - prev.confluence_score
        if abs(delta) >= 10:
            direction = "increased" if delta > 0 else "decreased"
            severity = "signal" if delta > 0 else "warning"
            return [
                FeedEvent(
                    type="confluence_shift",
                    timestamp=curr.timestamp,
                    message=(
                        f"Confluence {direction} by {abs(delta)} pts "
                        f"({prev.confluence_score} → {curr.confluence_score}, "
                        f"{curr.confluence_direction})"
                    ),
                    severity=severity,
                    source="confluence",
                    detail={
                        "prev_score": prev.confluence_score,
                        "curr_score": curr.confluence_score,
                        "delta": delta,
                        "direction": curr.confluence_direction,
                    },
                )
            ]
        return []

    @staticmethod
    def _check_volume_spike(snapshot: AnalysisSnapshot) -> list[FeedEvent]:
        """Emit an event when the latest RVOL is > 2 standard deviations above mean.

        When stdev of the baseline is zero (all bars identical) any candidate
        that is >= 2x the baseline mean is treated as a spike.
        """
        ratios = snapshot.volume_ratios
        if len(ratios) < 5:
            return []
        # Use all-but-last as the baseline, last as the candidate
        baseline = ratios[:-1]
        candidate = ratios[-1]
        mean = statistics.mean(baseline)
        try:
            stdev = statistics.stdev(baseline)
        except statistics.StatisticsError:
            stdev = 0.0

        if stdev == 0.0:
            # Degenerate case: treat candidate >= 2x mean as a spike
            if mean > 0 and candidate >= 2.0 * mean:
                # Use a synthetic large z_score for severity calculation
                z_score = (candidate / mean) * 2.0 if mean > 0 else 0.0
                severity = "critical" if z_score > 4.0 else "warning"
                return [
                    FeedEvent(
                        type="volume_spike",
                        timestamp=snapshot.timestamp,
                        message=f"Volume spike detected: RVOL {candidate:.1f}x ({candidate/mean:.1f}x baseline)",
                        severity=severity,
                        source="volume",
                        detail={"rvol": candidate, "z_score": round(z_score, 2)},
                    )
                ]
            return []

        z_score = (candidate - mean) / stdev
        if z_score > 2.0:
            severity = "critical" if z_score > 4.0 else "warning"
            return [
                FeedEvent(
                    type="volume_spike",
                    timestamp=snapshot.timestamp,
                    message=f"Volume spike detected: RVOL {candidate:.1f}x ({z_score:.1f}σ)",
                    severity=severity,
                    source="volume",
                    detail={"rvol": candidate, "z_score": round(z_score, 2)},
                )
            ]
        return []

    @staticmethod
    def _check_pattern_trigger(
        prev: AnalysisSnapshot, curr: AnalysisSnapshot
    ) -> list[FeedEvent]:
        """Emit an event for each new pattern that wasn't present in the last snapshot."""
        new_patterns = set(curr.patterns) - set(prev.patterns)
        events = []
        for pattern in sorted(new_patterns):
            events.append(
                FeedEvent(
                    type="pattern_trigger",
                    timestamp=curr.timestamp,
                    message=f"Pattern triggered: {pattern}",
                    severity="signal",
                    source="patterns",
                    detail={"pattern": pattern},
                )
            )
        return events


# ── Module-level singleton (used by routes) ────────────────────────────────────

_engine = FeedEventEngine()


def get_engine() -> FeedEventEngine:
    """Return the module-level FeedEventEngine singleton."""
    return _engine
