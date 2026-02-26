"""Volume analysis: relative volume, spikes, session normalization."""

from dataclasses import dataclass

import numpy as np

from arctis.models import OHLCVBar


@dataclass
class VolumeSpike:
    index: int
    timestamp: int
    volume: int
    ratio: float


def relative_volume(bars: list[OHLCVBar], period: int = 20) -> list[float | None]:
    """Calculate relative volume (current / rolling mean)."""
    result: list[float | None] = []
    volumes = [b.volume for b in bars]

    for i in range(len(volumes)):
        if i < period:
            result.append(None)
        else:
            window = volumes[i - period : i]
            mean = np.mean(window)
            result.append(float(volumes[i] / mean) if mean > 0 else None)

    return result


def detect_volume_spikes(
    bars: list[OHLCVBar], period: int = 20, threshold_sigma: float = 2.0
) -> list[VolumeSpike]:
    """Detect volume spikes exceeding threshold standard deviations above rolling mean."""
    spikes: list[VolumeSpike] = []
    volumes = np.array([b.volume for b in bars], dtype=float)

    for i in range(period, len(volumes)):
        window = volumes[i - period : i]
        mean = np.mean(window)
        std = np.std(window)

        if mean > 0:
            ratio = float(volumes[i] / mean)
            is_spike = (
                (std > 0 and volumes[i] > mean + threshold_sigma * std)
                or (std == 0 and volumes[i] > mean)
            )
            if is_spike:
                spikes.append(
                    VolumeSpike(
                        index=i,
                        timestamp=bars[i].timestamp,
                        volume=int(volumes[i]),
                        ratio=ratio,
                    )
                )

    return spikes
