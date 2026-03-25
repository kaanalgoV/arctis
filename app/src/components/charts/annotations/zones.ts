// Ported from AlgoView CandlestickChart
/**
 * Trade zone annotation builder.
 * Creates box annotations for trade risk/reward zones (SL/TP areas).
 * Also renders trailing stop history as horizontal dashed lines
 * and exit-level indicators.
 */

import {
  BoxAnnotation,
  ECoordinateMode,
  TextAnnotation,
  LineAnnotation,
  EHorizontalAnchorPoint,
  EVerticalAnchorPoint,
} from 'scichart';
import type { IAnnotation } from 'scichart';
import type { TradeZone } from '@/types/chart';
import type { AnnotationContext } from './types';

// Color for trailing stop adjustment lines (orange/amber)
const TRAILING_STOP_COLOR = '#f59e0b';
// Color for exit level indicator
const EXIT_LEVEL_COLOR = '#a78bfa'; // Purple for exit price level

/**
 * Result from createTradeZones including annotations and tracking map.
 */
export interface ZoneAnnotationResult {
  /** All zone annotations created (boxes and text labels) */
  annotations: IAnnotation[];
  /** Map of tradeId -> zone annotations for selection highlighting */
  byTradeId: Map<number, BoxAnnotation[]>;
}

/**
 * Convert opacity percentage (0-100) to hex suffix for color strings.
 */
function opacityToHex(opacity: number): string {
  const clamped = Math.max(0, Math.min(100, opacity));
  const hex = Math.round(clamped * 2.55);
  return hex.toString(16).padStart(2, '0');
}

/**
 * Creates horizontal lines showing trailing stop adjustments.
 * Each line extends from the adjustment time to the next adjustment or trade exit.
 */
function createTrailingStopLines(
  zone: TradeZone,
  ctx: AnnotationContext
): IAnnotation[] {
  const lines: IAnnotation[] = [];

  // Filter for SL adjustments (exclude INITIAL, we're only interested in changes)
  const slAdjustments = zone.slTpHistory.filter(
    (entry) => entry.slPrice !== undefined && entry.reason !== 'INITIAL'
  );

  if (slAdjustments.length === 0) return lines;

  // Sort by time
  const sortedAdjustments = [...slAdjustments].sort((a, b) => a.time - b.time);

  for (let i = 0; i < sortedAdjustments.length; i++) {
    const entry = sortedAdjustments[i];
    if (entry.slPrice === undefined) continue;

    const startIndex = ctx.findCandleIndex(entry.time);
    if (startIndex === -1) continue;

    // End at next adjustment or trade exit
    const nextEntry = sortedAdjustments[i + 1];
    const endTime = nextEntry?.time ?? zone.exitTime;
    const endIndex = ctx.findCandleIndex(endTime);
    if (endIndex === -1) continue;

    // Draw horizontal line at the SL price
    const line = new LineAnnotation({
      x1: startIndex,
      x2: endIndex,
      y1: entry.slPrice,
      y2: entry.slPrice,
      xCoordinateMode: ECoordinateMode.DataValue,
      yCoordinateMode: ECoordinateMode.DataValue,
      stroke: TRAILING_STOP_COLOR,
      strokeThickness: 2,
      strokeDashArray: [4, 2],
    });
    lines.push(line);

    // Add small marker at the adjustment point
    const marker = new TextAnnotation({
      x1: startIndex,
      y1: entry.slPrice,
      xCoordinateMode: ECoordinateMode.DataValue,
      yCoordinateMode: ECoordinateMode.DataValue,
      horizontalAnchorPoint: EHorizontalAnchorPoint.Right,
      verticalAnchorPoint: EVerticalAnchorPoint.Center,
      text: entry.reason === 'BREAK_EVEN' ? 'BE' : '->',
      textColor: TRAILING_STOP_COLOR,
      fontSize: 16,
      fontFamily: 'monospace',
    });
    lines.push(marker);
  }

  return lines;
}

/**
 * Creates a horizontal dashed line at the actual exit price level.
 * This helps visualize where the trade actually exited relative to SL/TP zones.
 */
function createExitLevelLine(
  zone: TradeZone,
  entryIndex: number,
  exitIndex: number,
  ctx: AnnotationContext
): IAnnotation[] {
  const lines: IAnnotation[] = [];

  // Only show exit level if we have SL/TP zones (otherwise the fallback box shows it)
  if (zone.initialSl === null && zone.initialTp === null) return lines;

  const zoneEnd = Math.max(entryIndex + 3, exitIndex + 1);

  // Horizontal line at exit price
  const exitLine = new LineAnnotation({
    x1: entryIndex,
    x2: zoneEnd,
    y1: zone.exitPrice,
    y2: zone.exitPrice,
    xCoordinateMode: ECoordinateMode.DataValue,
    yCoordinateMode: ECoordinateMode.DataValue,
    stroke: EXIT_LEVEL_COLOR,
    strokeThickness: 1.5,
    strokeDashArray: [3, 3],
  });
  lines.push(exitLine);

  // Small label at the right edge
  const exitLabel = new TextAnnotation({
    x1: zoneEnd + 0.3,
    y1: zone.exitPrice,
    xCoordinateMode: ECoordinateMode.DataValue,
    yCoordinateMode: ECoordinateMode.DataValue,
    horizontalAnchorPoint: EHorizontalAnchorPoint.Left,
    verticalAnchorPoint: EVerticalAnchorPoint.Center,
    text: zone.isProfitable ? '+' : 'x',
    textColor: zone.isProfitable
      ? ctx.chartSettings.profitZoneColor
      : ctx.chartSettings.lossZoneColor,
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  });
  lines.push(exitLabel);

  return lines;
}

/**
 * Creates a horizontal line at the entry price to anchor the zone visually.
 */
function createEntryPriceLine(
  zone: TradeZone,
  entryIndex: number,
  zoneEnd: number,
): IAnnotation {
  return new LineAnnotation({
    x1: entryIndex,
    x2: zoneEnd,
    y1: zone.entryPrice,
    y2: zone.entryPrice,
    xCoordinateMode: ECoordinateMode.DataValue,
    yCoordinateMode: ECoordinateMode.DataValue,
    stroke: '#ffffff',
    strokeThickness: 1,
    opacity: 0.3,
  });
}

/**
 * Creates box annotations for trade risk/reward zones.
 *
 * Supports two modes:
 * 1. SL/TP zones: Separate boxes for stop-loss (red), take-profit (green), and saved risk (gray)
 *    with entry price line, exit level indicator, and trailing stop history
 * 2. Fallback: Single box colored by profitability
 */
export function createTradeZones(
  zones: TradeZone[],
  ctx: AnnotationContext
): ZoneAnnotationResult {
  const annotations: IAnnotation[] = [];
  const byTradeId = new Map<number, BoxAnnotation[]>();

  for (const zone of zones) {
    const entryIndex = ctx.findCandleIndex(zone.entryTime);
    const exitIndex = ctx.findCandleIndex(zone.exitTime);
    if (entryIndex === -1 || exitIndex === -1) continue;

    const tradeZones: BoxAnnotation[] = [];

    if (zone.initialSl !== null || zone.initialTp !== null) {
      // SL/TP mode: separate risk/reward zones
      const zoneEnd = Math.max(entryIndex + 3, exitIndex + 1);
      const fillOpacityHex = opacityToHex(ctx.chartSettings.zoneOpacity);
      const strokeOpacityHex = opacityToHex(Math.min(100, ctx.chartSettings.zoneOpacity * 2.5));

      // Entry price anchor line (subtle white line)
      annotations.push(createEntryPriceLine(zone, entryIndex, zoneEnd));

      // SL Zone (risk)
      if (zone.initialSl !== null) {
        const effectiveSl = zone.finalSl ?? zone.initialSl;

        const slZone = new BoxAnnotation({
          x1: entryIndex,
          x2: zoneEnd,
          y1: zone.entryPrice,
          y2: effectiveSl,
          xCoordinateMode: ECoordinateMode.DataValue,
          yCoordinateMode: ECoordinateMode.DataValue,
          fill: ctx.chartSettings.lossZoneColor + fillOpacityHex,
          stroke: ctx.chartSettings.lossZoneColor + strokeOpacityHex,
          strokeThickness: 0,
        });
        annotations.push(slZone);
        tradeZones.push(slZone);

        // Tick distance label for SL with improved styling
        if (zone.ticksToSl !== null) {
          const slLabel = new TextAnnotation({
            x1: zoneEnd + 0.5,
            y1: (zone.entryPrice + zone.initialSl) / 2,
            xCoordinateMode: ECoordinateMode.DataValue,
            yCoordinateMode: ECoordinateMode.DataValue,
            horizontalAnchorPoint: EHorizontalAnchorPoint.Left,
            verticalAnchorPoint: EVerticalAnchorPoint.Center,
            text: `SL ${zone.ticksToSl}t`,
            textColor: ctx.chartSettings.lossZoneColor,
            fontSize: 11,
            fontFamily: 'monospace',
            fontWeight: 'bold',
          });
          annotations.push(slLabel);
        }

        // Saved zone: area between initial and final SL (trailing stop benefit)
        if (zone.finalSl !== null && zone.finalSl !== zone.initialSl) {
          const savedZone = new BoxAnnotation({
            x1: entryIndex,
            x2: zoneEnd,
            y1: zone.finalSl,
            y2: zone.initialSl,
            xCoordinateMode: ECoordinateMode.DataValue,
            yCoordinateMode: ECoordinateMode.DataValue,
            fill: ctx.chartSettings.savedZoneColor + fillOpacityHex,
            stroke: ctx.chartSettings.savedZoneColor + strokeOpacityHex,
            strokeThickness: 0,
          });
          annotations.push(savedZone);
          tradeZones.push(savedZone);
        }

        // Trailing stop history lines
        const trailingLines = createTrailingStopLines(zone, ctx);
        annotations.push(...trailingLines);
      }

      // TP Zone (reward)
      if (zone.initialTp !== null) {
        const tpZone = new BoxAnnotation({
          x1: entryIndex,
          x2: zoneEnd,
          y1: zone.entryPrice,
          y2: zone.finalTp ?? zone.initialTp,
          xCoordinateMode: ECoordinateMode.DataValue,
          yCoordinateMode: ECoordinateMode.DataValue,
          fill: ctx.chartSettings.profitZoneColor + fillOpacityHex,
          stroke: ctx.chartSettings.profitZoneColor + strokeOpacityHex,
          strokeThickness: 0,
        });
        annotations.push(tpZone);
        tradeZones.push(tpZone);

        // Tick distance label for TP with improved styling
        if (zone.ticksToTp !== null) {
          const tpLabel = new TextAnnotation({
            x1: zoneEnd + 0.5,
            y1: (zone.entryPrice + zone.initialTp) / 2,
            xCoordinateMode: ECoordinateMode.DataValue,
            yCoordinateMode: ECoordinateMode.DataValue,
            horizontalAnchorPoint: EHorizontalAnchorPoint.Left,
            verticalAnchorPoint: EVerticalAnchorPoint.Center,
            text: `TP ${zone.ticksToTp}t`,
            textColor: ctx.chartSettings.profitZoneColor,
            fontSize: 11,
            fontFamily: 'monospace',
            fontWeight: 'bold',
          });
          annotations.push(tpLabel);
        }
      }

      // Exit level indicator (dashed purple line at actual exit price)
      const exitLines = createExitLevelLine(zone, entryIndex, exitIndex, ctx);
      annotations.push(...exitLines);

    } else {
      // Fallback: single box colored by profitability
      const fallbackFillHex = opacityToHex(ctx.chartSettings.zoneOpacity);
      const fallbackStrokeHex = opacityToHex(Math.min(100, ctx.chartSettings.zoneOpacity * 2.5));
      const fillColor = zone.isProfitable
        ? ctx.chartSettings.profitZoneColor + fallbackFillHex
        : ctx.chartSettings.lossZoneColor + fallbackFillHex;
      const strokeColor = zone.isProfitable
        ? ctx.chartSettings.profitZoneColor + fallbackStrokeHex
        : ctx.chartSettings.lossZoneColor + fallbackStrokeHex;

      const boxAnnotation = new BoxAnnotation({
        x1: entryIndex,
        x2: exitIndex + 1,
        y1: zone.entryPrice,
        y2: zone.exitPrice,
        xCoordinateMode: ECoordinateMode.DataValue,
        yCoordinateMode: ECoordinateMode.DataValue,
        fill: fillColor,
        stroke: strokeColor,
        strokeThickness: 0,
      });
      annotations.push(boxAnnotation);
      tradeZones.push(boxAnnotation);
    }

    if (zone.tradeId != null && tradeZones.length > 0) {
      byTradeId.set(zone.tradeId, tradeZones);
    }
  }

  return { annotations, byTradeId };
}
