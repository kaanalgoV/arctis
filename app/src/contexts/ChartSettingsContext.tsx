// Ported from AlgoView - Arctic Frost theme
import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { type ChartSettings, DEFAULT_CHART_SETTINGS } from '@/types/settings';

const STORAGE_KEY = 'arctis-chart-settings';
const VERSION_KEY = 'arctis-chart-settings-version';
const CURRENT_VERSION = 1;

/**
 * Load saved chart settings from localStorage.
 * Clears stored settings when a new version is deployed so users get updated defaults.
 */
function loadStoredSettings(): ChartSettings {
  try {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion && Number(storedVersion) < CURRENT_VERSION) {
      // New version — clear old settings so user gets new defaults
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
      return DEFAULT_CHART_SETTINGS;
    }
    localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<ChartSettings>;
      // Merge with defaults to handle new properties added in future versions
      return { ...DEFAULT_CHART_SETTINGS, ...parsed };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_CHART_SETTINGS;
}

/**
 * Save chart settings to localStorage.
 */
function saveSettings(settings: ChartSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

interface ChartSettingsContextValue {
  /** Current chart settings */
  settings: ChartSettings;
  /** Update one or more settings */
  updateSettings: (update: Partial<ChartSettings>) => void;
  /** Reset all settings to defaults */
  resetSettings: () => void;
}

const ChartSettingsContext = createContext<ChartSettingsContextValue | null>(null);

interface ChartSettingsProviderProps {
  children: ReactNode;
}

export function ChartSettingsProvider({ children }: ChartSettingsProviderProps) {
  const [settings, setSettings] = useState<ChartSettings>(() => loadStoredSettings());

  // Persist to localStorage whenever settings change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSettings = useCallback((update: Partial<ChartSettings>) => {
    setSettings((prev) => ({ ...prev, ...update }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_CHART_SETTINGS);
  }, []);

  const contextValue = useMemo(
    () => ({ settings, updateSettings, resetSettings }),
    [settings, updateSettings, resetSettings]
  );

  return (
    <ChartSettingsContext.Provider value={contextValue}>
      {children}
    </ChartSettingsContext.Provider>
  );
}

/**
 * Hook to access chart settings.
 * Must be used within a ChartSettingsProvider.
 */
export function useChartSettings(): ChartSettingsContextValue {
  const context = useContext(ChartSettingsContext);
  if (!context) {
    throw new Error('useChartSettings must be used within a ChartSettingsProvider');
  }
  return context;
}
