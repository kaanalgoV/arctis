import pytest
import numpy as np
from arctis.models import OHLCVBar
from arctis.analysis.volume import (
    relative_volume,
    detect_volume_spikes,
    VolumeSpike,
)


def make_bars_with_volume(volumes: list[int], base_ts: int = 1000000) -> list[OHLCVBar]:
    return [
        OHLCVBar(
            timestamp=base_ts + i * 60,
            open=100.0, high=101.0, low=99.0, close=100.0,
            volume=v,
        )
        for i, v in enumerate(volumes)
    ]


class TestRelativeVolume:
    def test_basic(self):
        bars = make_bars_with_volume([100, 100, 100, 100, 200])
        rvol = relative_volume(bars, period=4)
        assert rvol[-1] == pytest.approx(2.0)

    def test_returns_none_for_insufficient_data(self):
        bars = make_bars_with_volume([100, 200])
        rvol = relative_volume(bars, period=4)
        assert rvol[0] is None


class TestVolumeSpikes:
    def test_detects_spike(self):
        volumes = [1000] * 19 + [5000]
        bars = make_bars_with_volume(volumes)
        spikes = detect_volume_spikes(bars, period=10, threshold_sigma=2.0)
        assert len(spikes) >= 1
        assert spikes[-1].index == 19
        assert spikes[-1].ratio > 2.0

    def test_no_spike_in_flat(self):
        volumes = [1000] * 20
        bars = make_bars_with_volume(volumes)
        spikes = detect_volume_spikes(bars, period=10, threshold_sigma=2.0)
        assert len(spikes) == 0
