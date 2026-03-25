"""Feature flags for Arctis.

Gates control which capabilities are active at runtime.
Flags set to False are not yet implemented or not yet ready for production.

Usage:
    from arctis.feature_flags import is_enabled

    if is_enabled("volume_profile"):
        ...
"""

FEATURE_FLAGS: dict[str, bool] = {
    "setup_lifecycle": True,
    "travis_mcp": True,
    "volume_profile": True,
    "drawing_sync": True,
    "replay_mode": True,
    "advanced_orderflow": False,   # Not implemented yet
    "shared_workspaces": False,    # Not implemented yet
    "billing": False,              # Not implemented yet
}


def is_enabled(flag: str) -> bool:
    """Return True if the given feature flag is enabled.

    Unknown flags default to False — fail-safe behaviour.
    """
    return FEATURE_FLAGS.get(flag, False)
