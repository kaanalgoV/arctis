// Ported from AlgoView CandlestickChart - Arctic Frost theme

/**
 * Chart Theme Tokens — Arctic Frost
 *
 * Centralizes all chart color tokens so that candlestick rendering,
 * indicators, grid lines, and axes are consistent with the Arctis
 * design system (Arctic Frost: ice blue #5CB8F0 instead of green).
 *
 * Usage:
 *   import { CHART_TOKENS, getChartTokens } from '@/lib/chart-tokens';
 *   const bullColor = CHART_TOKENS.candle.bull;
 */

// ---------------------------------------------------------------------------
// Token definitions (dark theme — default)
// ---------------------------------------------------------------------------

export const CHART_TOKENS = {
  /** Candle body + wick colors */
  candle: {
    /** Bullish / up candle — Arctic Frost ice blue */
    bull: '#5CB8F0',
    bullWick: '#5CB8F0',
    /** Bearish / down candle */
    bear: '#EF4136',
    bearWick: '#EF4136',
    /** Neutral / doji (same open/close) */
    neutral: '#949DA8',
  },

  /** Grid lines */
  grid: {
    major: 'rgba(255,255,255,0.04)',
    minor: 'rgba(255,255,255,0.02)',
  },

  /** Axis labels, ticks */
  axis: {
    label: '#6E7681',
    tick: '#353D48',
    border: '#353D48',
  },

  /** Overlay series (volume, indicators) */
  overlay: {
    volume: {
      bull: 'rgba(92,184,240,0.25)',   // ice blue tint for bull volume
      bear: 'rgba(239,65,54,0.25)',
    },
    /** Moving average line colors — first one is ice blue (Arctic Frost brand) */
    ma: ['#5CB8F0', '#F7941D', '#A855F7', '#33c990', '#EF4136'],
    /** Bollinger band fill — ice blue tint */
    bollingerFill: 'rgba(92,184,240,0.06)',
    bollingerBand: 'rgba(92,184,240,0.4)',
    /** VWAP line */
    vwap: '#FBBF24',
    vwapBand: 'rgba(251,191,36,0.08)',
    /** Volume Profile */
    volumeProfile: {
      poc: '#FBBF24',                      // amber/gold — fits arctic theme
      valueArea: 'rgba(92,184,240,0.12)',
      volumeBar: 'rgba(92,184,240,0.2)',
    },
  },

  /** Trade markers rendered on chart */
  trade: {
    long: '#5CB8F0',     // ice blue for long entries
    short: '#EF4136',
    neutral: '#F7941D',
  },

  /** Crosshair / cursor line */
  crosshair: {
    line: 'rgba(255,255,255,0.3)',
    label: '#1A1F26',
    labelBackground: '#222830',
  },

  /** Chart background (matches --color-surface-primary) */
  background: '#0F1318',
  /** Chart paper (inner drawing area) */
  paper: '#0A0D12',
} as const;

// ---------------------------------------------------------------------------
// Light theme overrides
// ---------------------------------------------------------------------------

export const CHART_TOKENS_LIGHT = {
  ...CHART_TOKENS,
  grid: {
    major: 'rgba(0,0,0,0.06)',
    minor: 'rgba(0,0,0,0.03)',
  },
  axis: {
    label: '#9CA3AF',
    tick: '#D8DCE2',
    border: '#D8DCE2',
  },
  background: '#FAFBFC',
  paper: '#F5F6F8',
} as const;

// ---------------------------------------------------------------------------
// Helper: resolve token for current theme
// ---------------------------------------------------------------------------

/**
 * Returns the chart tokens for the given theme.
 * @param theme - 'dark' (default) or 'light'
 */
export function getChartTokens(theme: 'dark' | 'light' = 'dark') {
  return theme === 'light' ? CHART_TOKENS_LIGHT : CHART_TOKENS;
}

/**
 * Read the current document theme and return matching chart tokens.
 * Falls back to dark if DOM is unavailable (SSR).
 */
export function getActiveChartTokens() {
  if (typeof document === 'undefined') return CHART_TOKENS;
  const theme = document.documentElement.getAttribute('data-theme');
  return theme === 'light' ? CHART_TOKENS_LIGHT : CHART_TOKENS;
}
