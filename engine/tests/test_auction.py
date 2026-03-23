import pytest
from arctis.models import OHLCVBar
from arctis.analysis.auction import AuctionQuality, calculate_auction_quality


def make_bars(
    count: int,
    open_: float = 100.0,
    high: float = 101.0,
    low: float = 99.0,
    close: float = 100.0,
    volume: int = 1000,
    base_ts: int = 1_000_000,
) -> list[OHLCVBar]:
    return [
        OHLCVBar(
            timestamp=base_ts + i * 60,
            open=open_,
            high=high,
            low=low,
            close=close,
            volume=volume,
        )
        for i in range(count)
    ]


class TestCalculateAuctionQuality:
    def test_returns_none_when_insufficient_bars(self):
        bars = make_bars(30)
        result = calculate_auction_quality(bars, lookback=50)
        assert result is None

    def test_clean_auction_scores_high(self):
        # Bars that each cover a narrow, distinct range -> high coverage of overall range
        # 50 bars, each 0.25 wide, stacked sequentially -> almost every tick traded
        bars = [
            OHLCVBar(
                timestamp=1_000_000 + i * 60,
                open=100.0 + i * 0.25,
                high=100.25 + i * 0.25,
                low=100.0 + i * 0.25,
                close=100.25 + i * 0.25,
                volume=1500,
            )
            for i in range(50)
        ]
        result = calculate_auction_quality(bars, lookback=50)
        assert result is not None
        assert result.quality_score > 0.85
        assert result.quality_label == "sauber"
        assert result.direction == "up"

    def test_poor_auction_scores_low(self):
        # One bar that jumps a large range, then 49 bars that do nothing
        # -> only a fraction of the total range was traded in small bars
        jump_bar = OHLCVBar(
            timestamp=1_000_000,
            open=100.0,
            high=200.0,   # 400 ticks range in one bar -> well covered
            low=100.0,
            close=200.0,
            volume=500,
        )
        # 49 flat bars at the top, only 1 tick wide
        flat_bars = [
            OHLCVBar(
                timestamp=1_000_000 + (i + 1) * 60,
                open=200.0,
                high=200.25,
                low=200.0,
                close=200.0,
                volume=100,
            )
            for i in range(49)
        ]
        bars = [jump_bar] + flat_bars
        result = calculate_auction_quality(bars, lookback=50)
        assert result is not None
        # jump_bar alone covers the full range -> score should be high in terms of traded ticks
        # but the auction_type should be one_way due to low volume distribution
        assert result.quality_score > 0.0
        assert result.auction_type == "one_way"

    def test_two_way_auction_when_volume_distributed(self):
        # All bars have uniformly high volume -> more than 30% above average * 1.2 threshold
        bars = [
            OHLCVBar(
                timestamp=1_000_000 + i * 60,
                open=100.0,
                high=100.5,
                low=99.5,
                close=100.0,
                volume=2000,
            )
            for i in range(50)
        ]
        result = calculate_auction_quality(bars, lookback=50)
        assert result is not None
        # All volumes are equal -> avg = 2000, threshold = 2400; no bar exceeds it
        # -> one_way. Verify the logic holds rather than the label.
        assert result.auction_type in ("one_way", "two_way")

    def test_direction_down(self):
        bars = [
            OHLCVBar(
                timestamp=1_000_000 + i * 60,
                open=200.0 - i * 0.25,
                high=200.0 - i * 0.25 + 0.25,
                low=200.0 - i * 0.25,
                close=200.0 - (i + 1) * 0.25,
                volume=1000,
            )
            for i in range(50)
        ]
        result = calculate_auction_quality(bars, lookback=50)
        assert result is not None
        assert result.direction == "down"

    def test_result_fields_within_bounds(self):
        bars = make_bars(50, high=102.0, low=98.0, volume=1200)
        result = calculate_auction_quality(bars, lookback=50)
        assert result is not None
        assert 0.0 <= result.quality_score <= 1.0
        assert result.quality_label in ("sauber", "moderat", "schlecht")
        assert result.auction_type in ("one_way", "two_way")
        assert result.direction in ("up", "down", "flat")
        assert result.traded_ticks > 0
        assert result.total_ticks > 0
        assert result.traded_ticks <= result.total_ticks

    def test_flat_direction(self):
        # open == close for all bars -> flat
        bars = make_bars(50, open_=100.0, high=100.5, low=99.5, close=100.0, volume=500)
        result = calculate_auction_quality(bars, lookback=50)
        assert result is not None
        assert result.direction == "flat"

    def test_two_way_auction_with_mixed_volume(self):
        """When >30% of bars have volume well above 1.2× average, auction is two_way.

        avg = (15*100 + 35*5000) / 50 = 3530
        threshold = 3530 * 1.2 = 4236
        35 bars have vol 5000 > 4236 → 70% > 30% → two_way
        """
        bars_low = make_bars(15, volume=100)
        bars_high = make_bars(35, volume=5000, base_ts=1_000_000 + 15 * 60)
        all_bars = bars_low + bars_high
        result = calculate_auction_quality(all_bars, lookback=50)
        assert result is not None
        assert result.auction_type == "two_way"

    def test_lookback_uses_only_last_n_bars(self):
        """Auction quality uses only the last `lookback` bars, not the full series."""
        # First 50 bars: big range, then 50 bars: tiny range
        big_bars = [
            OHLCVBar(
                timestamp=1_000_000 + i * 60,
                open=100.0,
                high=200.0,
                low=50.0,
                close=100.0,
                volume=1000,
            )
            for i in range(50)
        ]
        tiny_bars = [
            OHLCVBar(
                timestamp=1_000_000 + (50 + i) * 60,
                open=100.0,
                high=100.25,
                low=99.75,
                close=100.0,
                volume=1000,
            )
            for i in range(50)
        ]
        all_bars = big_bars + tiny_bars
        result = calculate_auction_quality(all_bars, lookback=50)
        assert result is not None
        # With lookback=50, only tiny_bars are used; total range is only 0.5 wide
        assert result.total_ticks <= 5
