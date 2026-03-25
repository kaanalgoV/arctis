// Ported from AlgoView CandlestickChart
/**
 * Shared drawing tool definitions — single source of truth for all UI components.
 *
 * Previously duplicated across DrawingFavoritesBar, DrawingObjectTree,
 * DrawingListPanel, and DrawingToolsSidebar.
 */

import {
  Crosshair,
  TrendingUp,
  Minus,
  GripVertical,
  Square,
  RectangleHorizontal,
  Type,
  Ruler,
  Percent,
  ArrowUpFromLine,
  AlignJustify,
  GitFork,
} from 'lucide-react';
import type { DrawingToolType, ChartDrawing } from '@/types/drawing';

/** Canonical icon mapping for all drawing tool types. */
export const TOOL_ICONS: Record<DrawingToolType, React.ComponentType<{ className?: string }>> = {
  crosshair: Crosshair,
  trendline: TrendingUp,
  hline: Minus,
  vline: GripVertical,
  rectangle: Square,
  location: RectangleHorizontal,
  text: Type,
  measure: Ruler,
  fibRetracement: Percent,
  fibExtension: ArrowUpFromLine,
  trendChannel: AlignJustify,
  pitchfork: GitFork,
};

/** Canonical label mapping for all drawing tool types. */
export const TOOL_LABELS: Record<DrawingToolType, string> = {
  crosshair: 'Crosshair',
  trendline: 'Trendline',
  hline: 'H-Line',
  vline: 'V-Line',
  rectangle: 'Rectangle',
  location: 'Price Band',
  text: 'Text',
  measure: 'Measure',
  fibRetracement: 'Fib Retracement',
  fibExtension: 'Fib Extension',
  trendChannel: 'Trend Channel',
  pitchfork: 'Pitchfork',
};

/** Keyboard shortcuts per tool. */
export const TOOL_SHORTCUTS: Partial<Record<DrawingToolType, string>> = {
  crosshair: 'Esc',
  trendline: 'T',
  hline: 'H',
  vline: 'V',
  rectangle: 'R',
  location: 'L',
  text: 'X',
  measure: 'M',
  fibRetracement: 'F',
  fibExtension: 'E',
  trendChannel: 'C',
  pitchfork: 'P',
};

/** Human-readable label for a specific drawing instance. */
export function getDrawingLabel(drawing: ChartDrawing, index?: number, pricePrecision = 2): string {
  const typeName = TOOL_LABELS[drawing.type] ?? drawing.type;
  const ord = (index ?? 0) + 1;
  switch (drawing.type) {
    case 'hline':
      return `${typeName} @ ${drawing.y1.toFixed(pricePrecision)}`;
    case 'vline':
      return `${typeName} #${ord}`;
    case 'location':
      if (drawing.y2 !== undefined) {
        const lo = Math.min(drawing.y1, drawing.y2).toFixed(pricePrecision);
        const hi = Math.max(drawing.y1, drawing.y2).toFixed(pricePrecision);
        return `${typeName} ${lo}-${hi}`;
      }
      return `${typeName} ${ord}`;
    case 'text':
      return drawing.text
        ? `"${drawing.text.length > 20 ? drawing.text.slice(0, 20) + '...' : drawing.text}"`
        : `${typeName} ${ord}`;
    case 'measure':
      if (drawing.y2 !== undefined) {
        const diff = drawing.y2 - drawing.y1;
        const sign = diff >= 0 ? '+' : '';
        return `${typeName} ${sign}${diff.toFixed(pricePrecision)}`;
      }
      return `${typeName} ${ord}`;
    case 'fibRetracement':
    case 'fibExtension':
      if (drawing.y2 !== undefined) {
        return `${typeName} ${drawing.y1.toFixed(pricePrecision)}-${drawing.y2.toFixed(pricePrecision)}`;
      }
      return `${typeName} ${ord}`;
    default:
      return index !== undefined ? `${typeName} ${index + 1}` : typeName;
  }
}
