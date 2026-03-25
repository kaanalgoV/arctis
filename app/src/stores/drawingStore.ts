// Ported from AlgoView - Arctic Frost theme
/**
 * Drawing Zustand Store.
 *
 * Manages all chart drawing state:
 * - Active drawing tool selection
 * - Work-in-progress (WIP) drawing being placed
 * - Persisted drawings per chart (keyed by "symbol:timeframe")
 * - Undo/redo history per chart
 * - Per-tool default style settings (color, lineWidth, opacity)
 *
 * Server sync strategy:
 * - localStorage is a fast read cache; server is the source of truth.
 * - On loadDrawingsFromServer(chartKey): fetch server data and merge
 *   (server wins on conflict — drawings with matching IDs are overwritten).
 * - On addDrawing / updateDrawing / removeDrawing: optimistic local update
 *   followed by a fire-and-forget server call. Errors are logged but do
 *   not roll back the local state to keep the UI responsive.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DrawingToolType, ChartDrawing, WipDrawing } from '@/types/drawing';
import type { LineStyle } from '@/types/api';
import {
  fetchDrawings,
  saveDrawing,
  updateDrawingApi,
  deleteDrawingApi,
} from '@/api';

// ============ Constants ============

const MAX_UNDO_STACK_SIZE = 20;

/** Maximum number of chart keys persisted in localStorage to prevent unbounded growth. */
const MAX_DRAWING_KEYS = 50;

/** Default style applied to every tool unless overridden per-tool.
 *  Ice Blue (#5CB8F0) as primary color for Arctic Frost theme. */
export const GLOBAL_DEFAULTS: ToolStyleDefaults = {
  color: '#5CB8F0', // Arctic Frost Ice Blue
  lineWidth: 2,
  opacity: 1,
  lineStyle: 'solid' as LineStyle,
};

// ============ Per-tool defaults ============

export interface ToolStyleDefaults {
  color: string;
  lineWidth: number;
  opacity: number;
  lineStyle: LineStyle;
}

// ============ Helpers ============

/** Resolve per-tool defaults, falling back to global defaults for missing fields. */
function resolveDefaults(
  toolDefaults: Partial<Record<DrawingToolType, Partial<ToolStyleDefaults>>>,
  tool: DrawingToolType,
): ToolStyleDefaults {
  const overrides = toolDefaults[tool] ?? {};
  return {
    color: overrides.color ?? GLOBAL_DEFAULTS.color,
    lineWidth: overrides.lineWidth ?? GLOBAL_DEFAULTS.lineWidth,
    opacity: overrides.opacity ?? GLOBAL_DEFAULTS.opacity,
    lineStyle: overrides.lineStyle ?? GLOBAL_DEFAULTS.lineStyle,
  };
}

// ============ Store State ============

interface DrawingState {
  /** Currently active drawing tool */
  activeTool: DrawingToolType;

  /** Drawing currently being placed (before finalization) */
  wipDrawing: WipDrawing | null;

  /** Finalized drawings keyed by "symbol:timeframe" */
  drawings: Record<string, ChartDrawing[]>;

  /** ID of the currently selected drawing (for editing/deletion) */
  selectedDrawingId: string | null;

  /** Per-tool style defaults (persisted). Missing keys fall back to GLOBAL_DEFAULTS. */
  toolDefaults: Partial<Record<DrawingToolType, Partial<ToolStyleDefaults>>>;

  /**
   * Active tool's resolved color (kept in sync for reactive consumers).
   * Updated when activeTool changes or when setDefaultColor is called.
   */
  defaultColor: string;

  /**
   * Active tool's resolved line width (kept in sync for reactive consumers).
   * Updated when activeTool changes or when setDefaultLineWidth is called.
   */
  defaultLineWidth: number;

  /** Default line style for new drawings (shared across all tools) */
  defaultLineStyle: LineStyle;

  /** Favorite drawing tools for quick access (persisted) */
  favoriteTools: DrawingToolType[];

  /** Timestamp of last placed drawing (used for confirmation toast) */
  lastPlacedAt: number;

  /** Tool type of the last placed drawing (for toast label) */
  lastPlacedToolType: DrawingToolType | null;

  /** Sticky mode: tool stays active after placement (TradingView default). Persisted. */
  stickyMode: boolean;

  /** Magnet mode: snap to nearest OHLC price level. Persisted. */
  magnetMode: boolean;

  /** Whether the object tree panel is open */
  objectTreeOpen: boolean;

  /** Clipboard for copy/paste (not persisted) */
  clipboardDrawing: ChartDrawing | null;

  /** Undo history per chart key (max 20 entries each) */
  undoStack: Record<string, ChartDrawing[][]>;

  /** Redo history per chart key */
  redoStack: Record<string, ChartDrawing[][]>;
}

// ============ Store Actions ============

interface DrawingActions {
  // Tool selection
  setActiveTool: (tool: DrawingToolType) => void;

  // WIP drawing
  setWipDrawing: (wip: WipDrawing | null) => void;

  // Drawing CRUD
  addDrawing: (chartKey: string, drawing: ChartDrawing) => void;
  updateDrawing: (chartKey: string, id: string, updates: Partial<ChartDrawing>) => void;
  removeDrawing: (chartKey: string, id: string) => void;
  clearDrawings: (chartKey: string) => void;
  setDrawings: (chartKey: string, drawings: ChartDrawing[]) => void;

  // Duplication
  duplicateDrawing: (chartKey: string, id: string) => void;

  // Selection
  setSelectedDrawingId: (id: string | null) => void;

  // Per-tool default style
  /** Get resolved defaults for a specific tool (merges with global fallback). */
  getToolDefaults: (tool: DrawingToolType) => ToolStyleDefaults;
  /** Update defaults for a specific tool (partial merge). */
  setToolDefault: (tool: DrawingToolType, updates: Partial<ToolStyleDefaults>) => void;

  // Default style setters — update the active tool's per-tool defaults
  setDefaultColor: (color: string) => void;
  setDefaultLineWidth: (width: number) => void;
  setDefaultLineStyle: (style: LineStyle) => void;

  // Favorites
  toggleFavorite: (tool: DrawingToolType) => void;
  isFavorite: (tool: DrawingToolType) => boolean;

  // Mode toggles
  toggleStickyMode: () => void;
  toggleMagnetMode: () => void;
  toggleObjectTree: () => void;

  // Copy/paste
  copySelectedDrawing: (chartKey: string) => void;
  pasteDrawing: (chartKey: string) => void;

  // Undo/redo
  undo: (chartKey: string) => void;
  redo: (chartKey: string) => void;
  pushUndoState: (chartKey: string) => void;

  // Server sync
  /**
   * Fetch drawings from the server for a chart key ("symbol:timeframe") and
   * merge them into the local state. Server wins on id conflict.
   * Silently no-ops if the chartKey cannot be parsed or the request fails.
   */
  loadDrawingsFromServer: (chartKey: string) => Promise<void>;
}

// ============ Initial State ============

const initialState: DrawingState = {
  activeTool: 'crosshair',
  wipDrawing: null,
  drawings: {},
  selectedDrawingId: null,
  toolDefaults: {},
  defaultColor: GLOBAL_DEFAULTS.color,
  defaultLineWidth: GLOBAL_DEFAULTS.lineWidth,
  defaultLineStyle: 'solid',
  favoriteTools: ['trendline', 'hline', 'fibRetracement'],
  lastPlacedAt: 0,
  lastPlacedToolType: null,
  stickyMode: false,
  magnetMode: true,
  objectTreeOpen: false,
  clipboardDrawing: null,
  undoStack: {},
  redoStack: {},
};

// ============ Store ============

export const useDrawingStore = create<DrawingState & DrawingActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ---- Tool selection ----

      setActiveTool: (tool) => {
        const { toolDefaults } = get();
        const resolved = resolveDefaults(toolDefaults, tool);
        set({
          activeTool: tool,
          wipDrawing: null,
          defaultColor: resolved.color,
          defaultLineWidth: resolved.lineWidth,
          defaultLineStyle: resolved.lineStyle,
        });
      },

      // ---- WIP drawing ----

      setWipDrawing: (wip) =>
        set({ wipDrawing: wip }),

      // ---- Drawing CRUD ----

      addDrawing: (chartKey, drawing) => {
        const state = get();
        state.pushUndoState(chartKey);

        set((s) => {
          const existing = s.drawings[chartKey] ?? [];
          return {
            drawings: { ...s.drawings, [chartKey]: [...existing, drawing] },
            // Clear redo stack on new mutation
            redoStack: { ...s.redoStack, [chartKey]: [] },
            // Timestamp + tool type for confirmation toast
            lastPlacedAt: Date.now(),
            lastPlacedToolType: drawing.type,
          };
        });

        // Fire-and-forget server sync — optimistic local update is already done above
        const [symbol, timeframe] = chartKey.split(':');
        if (symbol && timeframe) {
          saveDrawing(symbol, timeframe, drawing).catch((err) => {
            console.error('[drawingStore] Failed to sync addDrawing to server:', err);
          });
        }
      },

      updateDrawing: (chartKey, id, updates) => {
        const state = get();
        state.pushUndoState(chartKey);

        set((s) => {
          const existing = s.drawings[chartKey] ?? [];
          const updated = existing.map((d) =>
            d.id === id ? { ...d, ...updates } : d,
          );
          return {
            drawings: { ...s.drawings, [chartKey]: updated },
            redoStack: { ...s.redoStack, [chartKey]: [] },
          };
        });

        const [symbol, timeframe] = chartKey.split(':');
        if (symbol && timeframe) {
          updateDrawingApi(id, symbol, timeframe, updates).catch((err) => {
            console.error('[drawingStore] Failed to sync updateDrawing to server:', err);
          });
        }
      },

      removeDrawing: (chartKey, id) => {
        const state = get();
        state.pushUndoState(chartKey);

        set((s) => {
          const existing = s.drawings[chartKey] ?? [];
          const filtered = existing.filter((d) => d.id !== id);
          return {
            drawings: { ...s.drawings, [chartKey]: filtered },
            selectedDrawingId: s.selectedDrawingId === id ? null : s.selectedDrawingId,
            redoStack: { ...s.redoStack, [chartKey]: [] },
          };
        });

        const [symbol, timeframe] = chartKey.split(':');
        if (symbol && timeframe) {
          deleteDrawingApi(id, symbol, timeframe).catch((err) => {
            console.error('[drawingStore] Failed to sync removeDrawing to server:', err);
          });
        }
      },

      clearDrawings: (chartKey) => {
        const state = get();
        const existing = state.drawings[chartKey];
        if (!existing || existing.length === 0) return;

        state.pushUndoState(chartKey);

        set((s) => ({
          drawings: { ...s.drawings, [chartKey]: [] },
          selectedDrawingId: null,
          redoStack: { ...s.redoStack, [chartKey]: [] },
        }));
      },

      setDrawings: (chartKey, drawings) =>
        set((s) => ({
          drawings: { ...s.drawings, [chartKey]: drawings },
        })),

      // ---- Duplication ----

      duplicateDrawing: (chartKey, id) => {
        const state = get();
        const existing = state.drawings[chartKey] ?? [];
        const source = existing.find((d) => d.id === id);
        if (!source) return;

        const duplicate: ChartDrawing = {
          ...source,
          id: crypto.randomUUID(),
          x1: source.x1 + 5,
          x2: source.x2 != null ? source.x2 + 5 : undefined,
          x3: source.x3 != null ? source.x3 + 5 : undefined,
          locked: false,
          createdAt: new Date().toISOString(),
        };

        state.addDrawing(chartKey, duplicate);
        set({ selectedDrawingId: duplicate.id });
      },

      // ---- Copy/Paste ----

      copySelectedDrawing: (chartKey) => {
        const state = get();
        if (!state.selectedDrawingId) return;
        const existing = state.drawings[chartKey] ?? [];
        const source = existing.find((d) => d.id === state.selectedDrawingId);
        if (source) {
          set({ clipboardDrawing: source });
        }
      },

      pasteDrawing: (chartKey) => {
        const state = get();
        if (!state.clipboardDrawing) return;
        const pasted: ChartDrawing = {
          ...state.clipboardDrawing,
          id: crypto.randomUUID(),
          x1: state.clipboardDrawing.x1 + 5,
          x2: state.clipboardDrawing.x2 != null ? state.clipboardDrawing.x2 + 5 : undefined,
          x3: state.clipboardDrawing.x3 != null ? state.clipboardDrawing.x3 + 5 : undefined,
          locked: false,
          createdAt: new Date().toISOString(),
        };
        state.addDrawing(chartKey, pasted);
        set({ selectedDrawingId: pasted.id });
      },

      // ---- Selection ----

      setSelectedDrawingId: (id) =>
        set({ selectedDrawingId: id }),

      // ---- Per-tool default style ----

      getToolDefaults: (tool) => {
        const state = get();
        return resolveDefaults(state.toolDefaults, tool);
      },

      setToolDefault: (tool, updates) => {
        set((s) => {
          const newToolDefaults = {
            ...s.toolDefaults,
            [tool]: { ...(s.toolDefaults[tool] ?? {}), ...updates },
          };
          // If updating the active tool, sync the top-level fields
          const extra: Partial<DrawingState> = {};
          if (tool === s.activeTool) {
            const resolved = resolveDefaults(newToolDefaults, tool);
            extra.defaultColor = resolved.color;
            extra.defaultLineWidth = resolved.lineWidth;
            extra.defaultLineStyle = resolved.lineStyle;
          }
          return { toolDefaults: newToolDefaults, ...extra };
        });
      },

      // Default style setters — update the active tool's per-tool defaults
      setDefaultColor: (color) => {
        const { activeTool } = get();
        get().setToolDefault(activeTool, { color });
      },

      setDefaultLineWidth: (width) => {
        const { activeTool } = get();
        get().setToolDefault(activeTool, { lineWidth: width });
      },

      setDefaultLineStyle: (style) => {
        const { activeTool } = get();
        get().setToolDefault(activeTool, { lineStyle: style });
        set({ defaultLineStyle: style });
      },

      // ---- Favorites ----

      toggleFavorite: (tool) => {
        set((s) => {
          const current = s.favoriteTools;
          const exists = current.includes(tool);
          return {
            favoriteTools: exists
              ? current.filter((t) => t !== tool)
              : [...current, tool],
          };
        });
      },

      isFavorite: (tool) => {
        return get().favoriteTools.includes(tool);
      },

      // ---- Mode toggles ----

      toggleStickyMode: () =>
        set((s) => ({ stickyMode: !s.stickyMode })),

      toggleMagnetMode: () =>
        set((s) => ({ magnetMode: !s.magnetMode })),

      toggleObjectTree: () =>
        set((s) => ({ objectTreeOpen: !s.objectTreeOpen })),

      // ---- Undo/redo ----

      pushUndoState: (chartKey) => {
        set((s) => {
          const currentDrawings = s.drawings[chartKey] ?? [];
          const stack = s.undoStack[chartKey] ?? [];

          // Cap at MAX_UNDO_STACK_SIZE
          const newStack =
            stack.length >= MAX_UNDO_STACK_SIZE
              ? [...stack.slice(1), currentDrawings]
              : [...stack, currentDrawings];

          return {
            undoStack: { ...s.undoStack, [chartKey]: newStack },
          };
        });
      },

      undo: (chartKey) => {
        set((s) => {
          const stack = s.undoStack[chartKey] ?? [];
          if (stack.length === 0) return s;

          const previousState = stack[stack.length - 1];
          const newUndoStack = stack.slice(0, -1);

          // Push current state to redo
          const currentDrawings = s.drawings[chartKey] ?? [];
          const redoStack = s.redoStack[chartKey] ?? [];

          return {
            drawings: { ...s.drawings, [chartKey]: previousState },
            undoStack: { ...s.undoStack, [chartKey]: newUndoStack },
            redoStack: { ...s.redoStack, [chartKey]: [...redoStack, currentDrawings] },
            selectedDrawingId: null,
          };
        });
      },

      redo: (chartKey) => {
        set((s) => {
          const stack = s.redoStack[chartKey] ?? [];
          if (stack.length === 0) return s;

          const nextState = stack[stack.length - 1];
          const newRedoStack = stack.slice(0, -1);

          // Push current state to undo
          const currentDrawings = s.drawings[chartKey] ?? [];
          const undoStack = s.undoStack[chartKey] ?? [];

          return {
            drawings: { ...s.drawings, [chartKey]: nextState },
            redoStack: { ...s.redoStack, [chartKey]: newRedoStack },
            undoStack: { ...s.undoStack, [chartKey]: [...undoStack, currentDrawings] },
            selectedDrawingId: null,
          };
        });
      },

      // ---- Server sync ----

      loadDrawingsFromServer: async (chartKey) => {
        const [symbol, timeframe] = chartKey.split(':');
        if (!symbol || !timeframe) return;

        let serverDrawings: ChartDrawing[];
        try {
          const response = await fetchDrawings(symbol, timeframe);
          serverDrawings = response.drawings ?? [];
        } catch (err) {
          console.error('[drawingStore] Failed to load drawings from server:', err);
          return;
        }

        if (serverDrawings.length === 0) return;

        set((s) => {
          const localDrawings = s.drawings[chartKey] ?? [];

          // Build a map of local drawings by id for O(1) lookup
          const localById = new Map<string, ChartDrawing>(
            localDrawings.map((d) => [d.id, d]),
          );

          // Server wins on conflict: merge server drawings into local map
          for (const serverDrawing of serverDrawings) {
            localById.set(serverDrawing.id, serverDrawing);
          }

          // Preserve original local order, append server-only drawings at the end
          const serverIds = new Set(serverDrawings.map((d) => d.id));
          const merged: ChartDrawing[] = [
            // Existing local drawings (updated with server version if present)
            ...localDrawings.map((d) => localById.get(d.id)!),
            // Server drawings not present locally
            ...serverDrawings.filter((d) => !localDrawings.some((l) => l.id === d.id)),
          ];

          return {
            drawings: { ...s.drawings, [chartKey]: merged },
          };

          // Suppress unused variable warning from the intermediate set
          void serverIds;
        });
      },
    }),
    {
      name: 'arctis-drawings',
      version: 1,
      migrate: (persisted, version) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = persisted as any;
        if (version === 0) {
          // Force stickyMode to false on migration from v0
          state.stickyMode = false;
        }
        return state;
      },
      partialize: (state) => {
        // Evict old drawing keys if exceeding cap to prevent unbounded localStorage growth.
        let drawings = state.drawings;
        const keys = Object.keys(drawings);
        if (keys.length > MAX_DRAWING_KEYS) {
          const toKeep = keys.slice(-MAX_DRAWING_KEYS);
          drawings = Object.fromEntries(toKeep.map((k) => [k, drawings[k]]));
        }
        return {
          drawings,
          toolDefaults: state.toolDefaults,
          defaultLineStyle: state.defaultLineStyle,
          favoriteTools: state.favoriteTools,
          stickyMode: state.stickyMode,
          magnetMode: state.magnetMode,
        };
      },
    },
  ),
);
