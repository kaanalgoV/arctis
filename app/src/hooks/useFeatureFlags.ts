/**
 * useFeatureFlags — fetches enabled feature flags from /api/features on mount.
 *
 * Returns a stable object mapping flag names to booleans.
 * Unknown flags default to false on the frontend.
 *
 * Usage:
 *   const flags = useFeatureFlags()
 *   if (flags.volume_profile) { ... }
 */

import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/store/settings'

type FeatureFlags = Record<string, boolean>

const DEFAULT_FLAGS: FeatureFlags = {
  setup_lifecycle: true,
  travis_mcp: true,
  volume_profile: true,
  drawing_sync: true,
  replay_mode: true,
  advanced_orderflow: false,
  shared_workspaces: false,
  billing: false,
}

export function useFeatureFlags(): FeatureFlags {
  const engineUrl = useSettingsStore((s) => s.engineUrl)
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS)

  useEffect(() => {
    let cancelled = false

    fetch(`${engineUrl}/api/features`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        if (cancelled || !data) return
        const payload = data as { features?: FeatureFlags }
        if (payload.features && typeof payload.features === 'object') {
          setFlags((prev) => ({ ...prev, ...payload.features }))
        }
      })
      .catch(() => {
        // Engine offline — use local defaults, no crash
      })

    return () => {
      cancelled = true
    }
  }, [engineUrl])

  return flags
}
