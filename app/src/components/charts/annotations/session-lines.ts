// Ported from AlgoView CandlestickChart
import { VerticalLineAnnotation, ECoordinateMode, ELabelPlacement } from 'scichart';
import type { AnnotationContext } from './types';
import { formatSessionBoundaryLabel } from '@/utils/chartTimeZone';

/**
 * Creates dashed vertical line annotations at trading-session boundaries.
 *
 * Each line marks the first candle of a new displayed session day.
 * Lines are positioned between candles (at index - 0.5) with date labels.
 *
 * @param sessionIndices - Array of candle indices where a new UTC day starts
 * @param ctx - Annotation context with chart data and settings
 * @returns Array of VerticalLineAnnotation objects
 */
export function createSessionSeparators(
  sessionIndices: number[],
  ctx: AnnotationContext
): VerticalLineAnnotation[] {
  return sessionIndices.map((index) => {
    const label = formatSessionBoundaryLabel(
      ctx.candles[index].time,
      ctx.chartSettings.chartTimeZone
    );

    return new VerticalLineAnnotation({
      x1: index - 0.5,
      xCoordinateMode: ECoordinateMode.DataValue,
      stroke: ctx.chartSettings.sessionLineColor,
      strokeThickness: 1,
      strokeDashArray: [4, 4],
      showLabel: true,
      labelPlacement: ELabelPlacement.Top,
      labelValue: label,
      axisLabelFill: ctx.chartSettings.cursorLabelBg,
      axisLabelStroke: ctx.chartSettings.sessionLineColor,
    });
  });
}
