// Ported from AlgoView CandlestickChart
/**
 * Trade line annotation builder.
 * Creates lines connecting entry to exit points with tick count labels
 * and visual distinction between profitable and losing trades.
 */

import {
  LineAnnotation,
  TextAnnotation,
  ECoordinateMode,
  EHorizontalAnchorPoint,
  EVerticalAnchorPoint,
} from 'scichart';
import type { IAnnotation } from 'scichart';
import type { TradeZone } from '@/types/chart';
import type { AnnotationContext } from './types';

/**
 * Creates line annotations connecting trade entry to exit points.
 * Profitable trades: solid, thicker line with full color
 * Losing trades: dashed, thinner line with muted opacity
 *
 * Each line includes a tick count label at the midpoint with a subtle background.
 */
export function createTradeLines(
  zones: TradeZone[],
  ctx: AnnotationContext
): IAnnotation[] {
  const annotations: IAnnotation[] = [];

  for (const zone of zones) {
    const entryIndex = ctx.findCandleIndex(zone.entryTime);
    const exitIndex = ctx.findCandleIndex(zone.exitTime);
    if (entryIndex === -1 || exitIndex === -1) continue;

    // Determine line style based on profitability
    // Both profitable and losing trades are clearly visible (community feedback: losses were too faint)
    const lineColor = zone.isProfitable
      ? ctx.chartSettings.profitZoneColor
      : ctx.chartSettings.lossZoneColor;

    const thickness = zone.isProfitable ? 2.5 : 2.0;
    const dashArray = zone.isProfitable ? undefined : [5, 3];
    const opacity = zone.isProfitable ? 1.0 : 0.85;

    // Create the entry-exit connection line
    const line = new LineAnnotation({
      x1: entryIndex,
      x2: exitIndex,
      y1: zone.entryPrice,
      y2: zone.exitPrice,
      xCoordinateMode: ECoordinateMode.DataValue,
      yCoordinateMode: ECoordinateMode.DataValue,
      stroke: lineColor,
      strokeThickness: thickness,
      strokeDashArray: dashArray,
      opacity,
    });
    annotations.push(line);

    // Glow effect for profitable trades (a wider, semi-transparent line behind)
    if (zone.isProfitable) {
      const glowLine = new LineAnnotation({
        x1: entryIndex,
        x2: exitIndex,
        y1: zone.entryPrice,
        y2: zone.exitPrice,
        xCoordinateMode: ECoordinateMode.DataValue,
        yCoordinateMode: ECoordinateMode.DataValue,
        stroke: lineColor,
        strokeThickness: 6,
        opacity: 0.15,
      });
      // Insert glow behind the main line
      annotations.splice(annotations.length - 1, 0, glowLine);
    }

    // Calculate tick count if tickSize is available
    if (ctx.tickSize && ctx.tickSize > 0) {
      const tickCount = Math.round(
        Math.abs(zone.exitPrice - zone.entryPrice) / ctx.tickSize
      );

      // Position label at the midpoint of the line
      const midX = (entryIndex + exitIndex) / 2;
      const midY = (zone.entryPrice + zone.exitPrice) / 2;

      // Place label slightly offset from the line
      const isExitAbove = zone.exitPrice > zone.entryPrice;
      const horizontalAnchor = isExitAbove
        ? EHorizontalAnchorPoint.Left
        : EHorizontalAnchorPoint.Right;

      const prefix = zone.isProfitable ? '+' : '-';
      const tickLabel = new TextAnnotation({
        x1: midX,
        y1: midY,
        xCoordinateMode: ECoordinateMode.DataValue,
        yCoordinateMode: ECoordinateMode.DataValue,
        horizontalAnchorPoint: horizontalAnchor,
        verticalAnchorPoint: EVerticalAnchorPoint.Center,
        text: ` ${prefix}${tickCount}t `,
        textColor: lineColor,
        fontSize: 11,
        fontFamily: 'monospace',
        fontWeight: 'bold',
      });
      annotations.push(tickLabel);
    }
  }

  return annotations;
}
