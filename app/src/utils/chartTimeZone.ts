// Ported from AlgoView CandlestickChart
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export const CHART_TIME_ZONE_BROWSER = 'browser';

export function resolveChartTimeZone(timeZoneSetting: string): string {
  if (!timeZoneSetting || timeZoneSetting === CHART_TIME_ZONE_BROWSER) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timeZoneSetting }).format(new Date());
    return timeZoneSetting;
  } catch {
    return 'UTC';
  }
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDateParts(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTimeParts(date: Date, withSeconds: boolean): string {
  const base = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return withSeconds ? `${base}:${pad(date.getSeconds())}` : base;
}

export function formatChartAxisTime(
  unixSeconds: number,
  timeZoneSetting: string
): string {
  const timeZone = resolveChartTimeZone(timeZoneSetting);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(unixSeconds * 1000));
}

export function formatChartDateTime(
  ms: number,
  timeZoneSetting: string
): string {
  const timeZone = resolveChartTimeZone(timeZoneSetting);
  return new Intl.DateTimeFormat('de-DE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(ms));
}

export function formatDateTimeInputInTimeZone(
  ms: number,
  timeZoneSetting: string
): string {
  const timeZone = resolveChartTimeZone(timeZoneSetting);
  const zoned = toZonedTime(new Date(ms), timeZone);
  return `${formatDateParts(zoned)}T${formatTimeParts(zoned, true)}`;
}

export function parseDateTimeInputInTimeZone(
  value: string,
  timeZoneSetting: string
): number | null {
  if (!value) {
    return null;
  }

  const timeZone = resolveChartTimeZone(timeZoneSetting);
  const parsed = fromZonedTime(value, timeZone);
  const time = parsed.getTime();
  return Number.isFinite(time) ? time : null;
}

export function getSessionDayKey(
  unixSeconds: number,
  timeZoneSetting: string
): string {
  const timeZone = resolveChartTimeZone(timeZoneSetting);
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(unixSeconds * 1000));
}

export function formatSessionBoundaryLabel(
  unixSeconds: number,
  timeZoneSetting: string
): string {
  const [, month, day] = getSessionDayKey(unixSeconds, timeZoneSetting).split('-');
  return `${month}/${day}`;
}

export function getSessionBoundaryIndices<T extends { time: number }>(
  candles: T[],
  timeZoneSetting: string
): number[] {
  if (candles.length < 2) {
    return [];
  }

  const boundaryIndices: number[] = [];
  let previousDay = getSessionDayKey(candles[0].time, timeZoneSetting);

  for (let index = 1; index < candles.length; index += 1) {
    const currentDay = getSessionDayKey(candles[index].time, timeZoneSetting);
    if (currentDay !== previousDay) {
      boundaryIndices.push(index);
      previousDay = currentDay;
    }
  }

  return boundaryIndices;
}

export function formatChartTimeZoneLabel(timeZoneSetting: string): string {
  const resolved = resolveChartTimeZone(timeZoneSetting);
  return timeZoneSetting === CHART_TIME_ZONE_BROWSER ? `${resolved} (Browser)` : resolved;
}
