"""Prediction model adapter interface and registry."""

from typing import Protocol, runtime_checkable

from arctis.models import OHLCVBar


@runtime_checkable
class PredictionModel(Protocol):
    """Protocol that every registered prediction model must satisfy."""

    name: str

    def predict(self, bars: list[OHLCVBar]) -> dict:
        """Return a forecast dict for the given bar series."""
        ...

    def evaluate(self, bars: list[OHLCVBar]) -> dict:
        """Return evaluation metrics for the given bar series."""
        ...


class ModelRegistry:
    """Central registry for prediction model adapters."""

    def __init__(self) -> None:
        self._models: dict[str, PredictionModel] = {}

    def register(self, model: PredictionModel) -> None:
        """Register a model under its ``name`` attribute."""
        self._models[model.name] = model

    def get(self, name: str) -> PredictionModel | None:
        """Return the model registered under *name*, or None."""
        return self._models.get(name)

    def list_models(self) -> list[str]:
        """Return a sorted list of registered model names."""
        return sorted(self._models.keys())


# Module-level singleton — import and use directly.
registry = ModelRegistry()
