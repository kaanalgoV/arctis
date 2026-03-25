// Ported from AlgoView CandlestickChart
/**
 * Contract label annotation builder.
 * Renders the active contract symbol (e.g. "GCZ5") as a subtle watermark
 * at the start of each contract segment in the chart.
 */

import { NativeTextAnnotation, ECoordinateMode, EHorizontalAnchorPoint, EVerticalAnchorPoint } from 'scichart';
import type { AnnotationContext } from './types';

interface ContractSegment {
  contract: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Extracts contract segments from the candle data.
 * Groups consecutive candles with the same contract symbol.
 */
function extractContractSegments(candles: { contract?: string }[]): ContractSegment[] {
  const segments: ContractSegment[] = [];
  let currentContract: string | null = null;
  let segmentStart = 0;

  for (let i = 0; i < candles.length; i++) {
    const contract = candles[i].contract;
    if (!contract) continue;

    if (contract !== currentContract) {
      if (currentContract !== null) {
        segments.push({ contract: currentContract, startIndex: segmentStart, endIndex: i - 1 });
      }
      currentContract = contract;
      segmentStart = i;
    }
  }

  // Close final segment
  if (currentContract !== null) {
    segments.push({ contract: currentContract, startIndex: segmentStart, endIndex: candles.length - 1 });
  }

  return segments;
}

/**
 * Creates text annotations showing the active contract symbol at rollover boundaries.
 *
 * Only renders labels when there is actual contract data (root symbol queries
 * with rollover enabled). Labels appear at the top of the chart, centered on
 * each contract segment with low opacity so they don't obscure price data.
 */
export function createContractLabels(ctx: AnnotationContext): NativeTextAnnotation[] {
  const segments = extractContractSegments(ctx.candles);

  // No contract data available (e.g., direct contract query without rollover)
  if (segments.length === 0) return [];

  return segments.map((segment) => {
    // Place label at the center of each segment, near the top
    const x = (segment.startIndex + segment.endIndex) / 2;

    return new NativeTextAnnotation({
      x1: x,
      y1: 0.04, // 4% from top
      text: segment.contract,
      xCoordinateMode: ECoordinateMode.DataValue,
      yCoordinateMode: ECoordinateMode.Relative,
      horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
      verticalAnchorPoint: EVerticalAnchorPoint.Top,
      fontSize: 11,
      fontFamily: 'monospace',
      textColor: '#ffffff30', // Very subtle watermark
    });
  });
}
