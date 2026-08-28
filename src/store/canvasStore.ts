import { create } from 'zustand';
import type { CanvasDoc, CanvasObject } from '../types';
import { getCanvas, putCanvas } from '../lib/db';

export type SaveStatus = 'idle' | 'saving' | 'saved';
export type CanvasTool = 'select' | 'draw';

export interface DrawSettings {
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

interface CanvasState {
  doc: CanvasDoc | null;
  selectedIds: string[];
  saveStatus: SaveStatus;
  activeTool: CanvasTool;
  drawSettings: DrawSettings;

  loadCanvas: (notebookId: string, seedDoc: CanvasDoc) => Promise<void>;

  // Mutations — all go through here so we can centralize persistence scheduling.
  addObject: (obj: CanvasObject) => void;
  updateObject: (id: string, patch: Partial<CanvasObject>) => void;
  updateObjectData: (id: string, dataPatch: Record<string, unknown>) => void;
  deleteObjects: (ids: string[]) => void;
  bringToFront: (ids: string[]) => void;
  sendToBack: (ids: string[]) => void;
  toggleLock: (id: string) => void;
  toggleHidden: (id: string) => void;

  setSelection: (ids: string[]) => void;
  clearSelection: () => void;

  setCamera: (camera: { x: number; y: number; zoom: number }) => void;
  setBackground: (background: CanvasDoc['background']) => void;

  setTool: (tool: CanvasTool) => void;
  setDrawSettings: (patch: Partial<DrawSettings>) => void;

  scheduleSave: () => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 600;

const DEFAULT_DRAW_SETTINGS: DrawSettings = {
  stroke: '#4A4046',
  strokeWidth: 4,
  opacity: 0.92,
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
  doc: null,
  selectedIds: [],
  saveStatus: 'idle',
  activeTool: 'select',
  drawSettings: DEFAULT_DRAW_SETTINGS,

  loadCanvas: async (_notebookId, seedDoc) => {
    let doc = await getCanvas(seedDoc.id);
    if (!doc) {
      doc = seedDoc;
      await putCanvas(doc);
    }
    set({ doc, selectedIds: [], saveStatus: 'idle', activeTool: 'select' });
  },

  addObject: (obj) => {
    const { doc } = get();
    if (!doc) return;
    const nextDoc: CanvasDoc = {
      ...doc,
      objects: { ...doc.objects, [obj.id]: obj },
      objectOrder: [...doc.objectOrder, obj.id],
    };
    set({ doc: nextDoc, selectedIds: [obj.id], activeTool: 'select' });
    get().scheduleSave();
  },

  updateObject: (id, patch) => {
    const { doc } = get();
    if (!doc || !doc.objects[id]) return;
    const existing = doc.objects[id];
    const updated = { ...existing, ...patch, updatedAt: Date.now() } as CanvasObject;
    set({ doc: { ...doc, objects: { ...doc.objects, [id]: updated } } });
    get().scheduleSave();
  },

  updateObjectData: (id, dataPatch) => {
    const { doc } = get();
    if (!doc || !doc.objects[id]) return;
    const existing = doc.objects[id];
    const updated = {
      ...existing,
      data: { ...existing.data, ...dataPatch },
      updatedAt: Date.now(),
    } as CanvasObject;
    set({ doc: { ...doc, objects: { ...doc.objects, [id]: updated } } });
    get().scheduleSave();
  },

  deleteObjects: (ids) => {
    const { doc } = get();
    if (!doc) return;
    const idSet = new Set(ids);
    const objects = { ...doc.objects };
    for (const id of ids) delete objects[id];
    const objectOrder = doc.objectOrder.filter((id) => !idSet.has(id));
    set({
      doc: { ...doc, objects, objectOrder },
      selectedIds: get().selectedIds.filter((id) => !idSet.has(id)),
    });
    get().scheduleSave();
  },

  bringToFront: (ids) => {
    const { doc } = get();
    if (!doc) return;
    const idSet = new Set(ids);
    const rest = doc.objectOrder.filter((id) => !idSet.has(id));
    const objectOrder = [...rest, ...doc.objectOrder.filter((id) => idSet.has(id))];
    set({ doc: { ...doc, objectOrder } });
    get().scheduleSave();
  },

  sendToBack: (ids) => {
    const { doc } = get();
    if (!doc) return;
    const idSet = new Set(ids);
    const rest = doc.objectOrder.filter((id) => !idSet.has(id));
    const objectOrder = [...doc.objectOrder.filter((id) => idSet.has(id)), ...rest];
    set({ doc: { ...doc, objectOrder } });
    get().scheduleSave();
  },

  toggleLock: (id) => {
    const { doc } = get();
    if (!doc || !doc.objects[id]) return;
    const obj = doc.objects[id];
    get().updateObject(id, { locked: !obj.locked } as Partial<CanvasObject>);
  },

  toggleHidden: (id) => {
    const { doc } = get();
    if (!doc || !doc.objects[id]) return;
    const obj = doc.objects[id];
    get().updateObject(id, { hidden: !obj.hidden } as Partial<CanvasObject>);
  },

  setSelection: (ids) => set({ selectedIds: ids, activeTool: 'select' }),
  clearSelection: () => set({ selectedIds: [] }),

  setCamera: (camera) => {
    const { doc } = get();
    if (!doc) return;
    set({ doc: { ...doc, camera } });
    get().scheduleSave();
  },

  setBackground: (background) => {
    const { doc } = get();
    if (!doc) return;
    set({ doc: { ...doc, background } });
    get().scheduleSave();
  },

  setTool: (tool) =>
    set((state) => ({
      activeTool: tool,
      selectedIds: tool === 'draw' ? [] : state.selectedIds,
    })),

  setDrawSettings: (patch) =>
    set((state) => ({ drawSettings: { ...state.drawSettings, ...patch } })),

  scheduleSave: () => {
    set({ saveStatus: 'saving' });
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const { doc } = get();
      if (!doc) return;
      try {
        await putCanvas(doc);
        set({ saveStatus: 'saved' });
      } catch (err) {
        // Keep the UI honest: if persistence failed, don't claim it saved.
        console.error('Failed to save canvas', err);
        set({ saveStatus: 'idle' });
      }
    }, SAVE_DEBOUNCE_MS);
  },
}));
