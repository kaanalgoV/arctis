/**
 * Lazy SciChart initialization for Arctis.
 *
 * Configures WASM binary and community license on demand —
 * the first time a chart component actually needs a surface.
 *
 * Call `ensureSciChartInitialized()` before creating any SciChartSurface.
 * The returned promise resolves immediately on subsequent calls.
 */

let initialized = false;
let initPromise: Promise<void> | null = null;

export function ensureSciChartInitialized(): Promise<void> {
  if (initialized) return Promise.resolve();
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { SciChartSurface, SciChartDefaults } = await import('scichart');
    SciChartSurface.UseCommunityLicense();
    // Serve WASM locally — avoids CDN roundtrip
    SciChartSurface.configure({ wasmUrl: '/scichart/scichart2d.wasm' });

    // Performance optimizations
    SciChartDefaults.performanceWarnings = false;
    SciChartDefaults.useNativeText = false;
    (SciChartDefaults as unknown as Record<string, unknown>).enableResampling = true;
    SciChartDefaults.useSharedCache = true;

    initialized = true;
  })();

  return initPromise;
}

// Re-export alias for backward compatibility
export const initSciChart = ensureSciChartInitialized;
