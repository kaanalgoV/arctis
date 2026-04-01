// Re-export canonical types from contracts.ts to avoid duplication.
// All new code should import directly from '@/types/contracts'.
export type { Bar as OHLCVBar } from './contracts'
export type { Timeframe } from './contracts'
export type Market = 'ES' | 'NQ' | 'CL' | 'GC' | '6E' | '6J'
