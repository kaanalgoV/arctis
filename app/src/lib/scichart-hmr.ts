/**
 * HMR-safe SciChart surface registry.
 *
 * Tracks all live SciChartSurface instances so Vite HMR can clean them up
 * before re-executing a module. Without this, old WASM render loops become
 * zombies that spam "dataSeries has been deleted" errors and exhaust WebGL
 * contexts.
 *
 * Usage in each chart component:
 *   import { registerSurface, unregisterSurface, initHmrCleanup } from '@/lib/scichart-hmr';
 *   initHmrCleanup(import.meta.hot);
 */
import type { SciChartSurface } from 'scichart';

const _surfaceRegistry: Set<SciChartSurface> = (
  (globalThis as unknown as Record<string, unknown>).__sciChartSurfaceRegistry ??=
    new Set<SciChartSurface>()
) as Set<SciChartSurface>;

export function registerSurface(surface: SciChartSurface): void {
  _surfaceRegistry.add(surface);
}

export function unregisterSurface(surface: SciChartSurface): void {
  _surfaceRegistry.delete(surface);
}

/**
 * Call once at module scope so Vite HMR disposes all tracked surfaces
 * when the importing module is hot-replaced.
 */
export function initHmrCleanup(hot: ImportMeta['hot']): void {
  if (!hot) return;
  hot.dispose(() => {
    for (const surface of _surfaceRegistry) {
      try {
        if (!surface.isDeleted) {
          surface.renderableSeries.clear();
          surface.annotations.clear();
          surface.chartModifiers.clear();
          surface.delete();
        }
      } catch {
        /* already deleted */
      }
    }
    _surfaceRegistry.clear();
  });
}
