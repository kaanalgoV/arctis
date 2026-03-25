// Ported from AlgoView CandlestickChart - Arctic Frost theme

export const CHART_SETTINGS_VERSION = 1;

export const CHART_TIME_ZONE_OPTIONS = [
  {
    value: 'browser',
    label: 'Browser Local Time',
    description: 'Uses the timezone from the user browser or operating system',
  },
  {
    value: 'Europe/Berlin',
    label: 'Europe/Berlin',
    description: 'German local time (CET / CEST)',
  },
  {
    value: 'UTC',
    label: 'UTC',
    description: 'Coordinated Universal Time',
  },
  {
    value: 'Europe/London',
    label: 'Europe/London',
    description: 'London local time (GMT / BST)',
  },
  {
    value: 'America/New_York',
    label: 'America/New_York',
    description: 'US Eastern Time (ET)',
  },
  {
    value: 'America/Chicago',
    label: 'America/Chicago',
    description: 'US Central Time (CT)',
  },
] as const;

/**
 * User-configurable chart appearance settings
 */
export interface ChartSettings {
  // Candlestick colors
  candleUpColor: string;
  candleDownColor: string;

  // Chart Background
  chartBackground: string;

  // Grid & Axes
  gridLineColor: string;
  axisLabelColor: string;

  // Crosshair / Cursor
  crosshairColor: string;
  cursorLabelBg: string;
  cursorLabelBorder: string;

  // Session Separators (midnight lines)
  sessionLineColor: string;
  chartTimeZone: string;

  // Trade Zones (SL/TP areas)
  profitZoneColor: string;
  lossZoneColor: string;
  savedZoneColor: string;    // Area saved by trailing SL (between initial and final SL)
  zoneOpacity: number;       // 0-100, applies to both profit and loss zones

  // Trade Markers — directional entry colors (TradingView convention)
  longEntryColor: string;    // Ice blue arrow up for buy entries (Arctic Frost)
  shortEntryColor: string;   // Red arrow down for sell entries

  // Trade Navigation
  tradeZoomPadding: number;  // Number of bars to show around trade when zooming (10-100)

  // Live Order Lines
  pendingOrderColor: string;    // Limit orders waiting to be filled
  stopLossLineColor: string;    // Stop loss price level
  takeProfitLineColor: string;  // Take profit price level
  positionEntryColor: string;   // Position average entry price

  // Order Handle Labels (chart annotations)
  orderLabelRadius: number;     // Border radius for label tags (0 = sharp, 4 = rounded)
  orderLabelOpacity: number;    // 0-100, label background opacity
  orderCancelBtnColor: string;  // X cancel button background color

  // Trading Behavior
  confirmMarketOrders: boolean; // Show confirmation dialog before submitting market orders
}

/**
 * Default chart settings — Arctic Frost dark theme.
 *
 * Color rationale:
 * - Candles: Ice blue (#5CB8F0) for bull / red (#EF4136) for bear — Arctic Frost brand
 * - Entry markers: Ice blue for longs, red for shorts (directional convention)
 * - Zones: 22% opacity — visible without obscuring candles (community consensus: 15-30%)
 * - Order lines: Amber for pending, ice blue for TP, red for SL
 */
export const DEFAULT_CHART_SETTINGS: ChartSettings = {
  candleUpColor: '#5CB8F0',    // Arctic Frost ice blue (bull candles)
  candleDownColor: '#EF4136',  // Red (bear candles)
  chartBackground: '#0F1318',  // Dark surface (matches --color-surface-primary)
  gridLineColor: 'rgba(255,255,255,0.03)',
  axisLabelColor: '#6E7681',
  crosshairColor: 'rgba(255,255,255,0.2)',
  cursorLabelBg: '#222830',
  cursorLabelBorder: '#5CB8F0',   // Ice blue border (Arctic Frost brand)
  sessionLineColor: '#334155',
  chartTimeZone: 'America/New_York',
  profitZoneColor: '#5CB8F0',     // Ice blue for profit zones (Arctic Frost)
  lossZoneColor: '#EF4136',       // Red for loss zones
  savedZoneColor: '#6b7280',      // Gray-500 — neutral for saved risk area
  zoneOpacity: 22,                // 22% — visible zones without hiding candles
  longEntryColor: '#5CB8F0',      // Ice blue buy arrow (Arctic Frost brand)
  shortEntryColor: '#EF4136',     // Red sell arrow
  tradeZoomPadding: 20,

  // Live Order Lines
  pendingOrderColor: '#f59e0b',   // Amber for pending limit orders
  stopLossLineColor: '#EF4136',   // Red for stop loss
  takeProfitLineColor: '#5CB8F0', // Ice blue for take profit (Arctic Frost)
  positionEntryColor: '#3b82f6',  // Blue for position entry

  // Order Handle Labels
  orderLabelRadius: 0,            // Sharp corners by default (professional trading look)
  orderLabelOpacity: 90,          // 90% opacity
  orderCancelBtnColor: '#64748b', // Slate-500 — neutral X button

  // Trading Behavior
  confirmMarketOrders: false,     // Market orders skip confirmation by default (speed)
};
