// Ported from AlgoView CandlestickChart
/**
 * Trade marker annotation builder.
 * Creates high-contrast, readable markers for trade entry/exit points.
 * All labels use SVG-based pills with dark backgrounds for guaranteed
 * readability against any chart content (candles, zones, grid lines).
 */

import {
  CustomAnnotation,
  ECoordinateMode,
  EHorizontalAnchorPoint,
  EVerticalAnchorPoint,
} from 'scichart';
import type { IAnnotation } from 'scichart';
import type { TradeMarker } from '@/types/chart';
import type { AnnotationContext } from './types';

// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

const ENTRY_SIZE = 30;
const EXIT_SIZE = 26;
const LABEL_FONT_SIZE = 11;
const LABEL_CHAR_WIDTH = 6.8; // monospace approximate
const LABEL_H = 20;
const LABEL_PAD_X = 8;
const LABEL_RADIUS = 4;

// ---------------------------------------------------------------------------
// SVG label pill — dark background with colored text
// ---------------------------------------------------------------------------

function createLabelSvg(
  text: string,
  textColor: string,
  bgOpacity = 0.88,
): string {
  const textW = text.length * LABEL_CHAR_WIDTH;
  const pillW = textW + LABEL_PAD_X * 2;
  const pillH = LABEL_H;
  const svgW = pillW + 2; // 1px padding each side for shadow
  const svgH = pillH + 2;

  return `<svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="lb-s" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
      </filter>
    </defs>
    <rect x="1" y="1" width="${pillW}" height="${pillH}" rx="${LABEL_RADIUS}"
      fill="rgba(10,10,10,${bgOpacity})" stroke="${textColor}" stroke-width="0.6" stroke-opacity="0.4"
      filter="url(#lb-s)"/>
    <text x="${1 + LABEL_PAD_X}" y="${1 + pillH / 2 + 1}" dominant-baseline="middle"
      font-size="${LABEL_FONT_SIZE}" font-family="'SF Mono','Cascadia Code','Fira Code',monospace"
      font-weight="600" fill="${textColor}" letter-spacing="0.3">
      ${text}
    </text>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Entry marker — bold arrow pointing into the trade
// ---------------------------------------------------------------------------

function createEntryMarkerSvg(
  shape: 'triangleUp' | 'triangleDown',
  color: string,
): string {
  const s = ENTRY_SIZE;
  const half = s / 2;

  // Triangle arrow pointing in trade direction
  const isUp = shape === 'triangleUp';
  const triPoints = isUp
    ? `${half},4 ${s - 4},${s - 6} 4,${s - 6}` // pointing up
    : `${half},${s - 4} ${s - 4},6 4,6`;         // pointing down

  // Small directional chevron inside
  const chevronY = isUp ? half + 2 : half - 2;
  const chevronD = isUp
    ? `M${half - 4},${chevronY + 2} L${half},${chevronY - 3} L${half + 4},${chevronY + 2}`
    : `M${half - 4},${chevronY - 2} L${half},${chevronY + 3} L${half + 4},${chevronY - 2}`;

  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="me" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="${color}" flood-opacity="0.6"/>
      </filter>
    </defs>
    <g filter="url(#me)">
      <polygon points="${triPoints}" fill="${color}" stroke="rgba(0,0,0,0.4)" stroke-width="0.8" stroke-linejoin="round"/>
      <path d="${chevronD}" fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${chevronD}" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Exit marker — circle with profit/loss icon
// ---------------------------------------------------------------------------

function createExitMarkerSvg(isProfitable: boolean, profitColor: string, lossColor: string): string {
  const s = EXIT_SIZE;
  const half = s / 2;
  const r = half - 3;

  const fillColor = isProfitable ? profitColor : lossColor;

  const symbol = isProfitable
    ? `<path d="M${half - 4},${half} L${half - 1},${half + 3.5} L${half + 5},${half - 3.5}" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
       <path d="M${half - 4},${half} L${half - 1},${half + 3.5} L${half + 5},${half - 3.5}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<line x1="${half - 3}" y1="${half - 3}" x2="${half + 3}" y2="${half + 3}" stroke="rgba(0,0,0,0.4)" stroke-width="2.8" stroke-linecap="round"/>
       <line x1="${half + 3}" y1="${half - 3}" x2="${half - 3}" y2="${half + 3}" stroke="rgba(0,0,0,0.4)" stroke-width="2.8" stroke-linecap="round"/>
       <line x1="${half - 3}" y1="${half - 3}" x2="${half + 3}" y2="${half + 3}" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
       <line x1="${half + 3}" y1="${half - 3}" x2="${half - 3}" y2="${half + 3}" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;

  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="mx" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="${fillColor}" flood-opacity="0.5"/>
      </filter>
    </defs>
    <g filter="url(#mx)">
      <circle cx="${half}" cy="${half}" r="${r}" fill="${fillColor}" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>
      ${symbol}
    </g>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isExitProfitable(marker: TradeMarker, allMarkers: TradeMarker[]): boolean {
  const entryMarker = allMarkers.find(
    (m) => m.tradeId === marker.tradeId && m.type === 'entry'
  );
  if (!entryMarker) return false;
  return marker.side === 'long'
    ? marker.price > entryMarker.price
    : marker.price < entryMarker.price;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Creates high-contrast marker + label annotations for trade entry/exit.
 *
 * Entry: Orange triangle arrow + dark-pill label "BUY 24706.00"
 * Exit:  Green/red circle + dark-pill label "EXIT 24690.50"
 *
 * All labels use SVG pills with dark backgrounds so they are always
 * readable regardless of candles, zones, or grid lines behind them.
 */
export function createTradeMarkers(
  markers: TradeMarker[],
  ctx: AnnotationContext
): IAnnotation[] {
  const annotations: IAnnotation[] = [];

  for (const marker of markers) {
    const candleIndex = ctx.findCandleIndex(marker.time);
    if (candleIndex === -1) continue;

    if (marker.type === 'entry') {
      // --- Entry marker icon — directional color (green=long, red=short) ---
      const entryColor = marker.side === 'long'
        ? ctx.chartSettings.longEntryColor
        : ctx.chartSettings.shortEntryColor;
      const svgString = createEntryMarkerSvg(marker.shape, entryColor);

      const verticalAnchor = marker.shape === 'triangleUp'
        ? EVerticalAnchorPoint.Top
        : EVerticalAnchorPoint.Bottom;

      annotations.push(
        new CustomAnnotation({
          x1: candleIndex,
          y1: marker.price,
          xCoordinateMode: ECoordinateMode.DataValue,
          yCoordinateMode: ECoordinateMode.DataValue,
          horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
          verticalAnchorPoint: verticalAnchor,
          svgString,
        })
      );

      // --- Entry label pill ---
      const sideLabel = marker.side === 'long' ? 'BUY' : 'SELL';
      const labelText = `${sideLabel}  ${formatPrice(marker.price)}`;
      const labelSvg = createLabelSvg(labelText, entryColor);

      annotations.push(
        new CustomAnnotation({
          x1: candleIndex + 1.2,
          y1: marker.price,
          xCoordinateMode: ECoordinateMode.DataValue,
          yCoordinateMode: ECoordinateMode.DataValue,
          horizontalAnchorPoint: EHorizontalAnchorPoint.Left,
          verticalAnchorPoint: EVerticalAnchorPoint.Center,
          svgString: labelSvg,
        })
      );

    } else {
      // --- Exit marker icon — green circle+check for profit, red circle+X for loss ---
      const profitable = isExitProfitable(marker, markers);
      const svgString = createExitMarkerSvg(
        profitable,
        ctx.chartSettings.profitZoneColor,
        ctx.chartSettings.lossZoneColor,
      );

      const verticalAnchor = marker.shape === 'triangleUp'
        ? EVerticalAnchorPoint.Bottom
        : EVerticalAnchorPoint.Top;

      annotations.push(
        new CustomAnnotation({
          x1: candleIndex,
          y1: marker.price,
          xCoordinateMode: ECoordinateMode.DataValue,
          yCoordinateMode: ECoordinateMode.DataValue,
          horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
          verticalAnchorPoint: verticalAnchor,
          svgString,
        })
      );

      // --- Exit label pill — colored by profitability (matches exit icon) ---
      const exitLabelColor = profitable
        ? ctx.chartSettings.profitZoneColor
        : ctx.chartSettings.lossZoneColor;
      const labelText = `EXIT  ${formatPrice(marker.price)}`;
      const labelSvg = createLabelSvg(labelText, exitLabelColor);

      annotations.push(
        new CustomAnnotation({
          x1: candleIndex + 1.2,
          y1: marker.price,
          xCoordinateMode: ECoordinateMode.DataValue,
          yCoordinateMode: ECoordinateMode.DataValue,
          horizontalAnchorPoint: EHorizontalAnchorPoint.Left,
          verticalAnchorPoint: EVerticalAnchorPoint.Center,
          svgString: labelSvg,
        })
      );
    }
  }

  return annotations;
}
