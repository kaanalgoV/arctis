// @ts-nocheck -- SciChart is not used in the current production build
import { SciChartSurface } from 'scichart'

let initialized = false

export async function initSciChart() {
  if (initialized) return

  // Use local WASM files from public/scichart/
  SciChartSurface.configure({
    wasmUrl: '/scichart/scichart2d.wasm',
    dataUrl: '/scichart/scichart2d.js',
  })

  initialized = true
}
