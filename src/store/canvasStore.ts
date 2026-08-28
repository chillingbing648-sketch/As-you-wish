import { create } from 'zustand';
import type { CanvasDoc, CanvasObject, DrawTool } from '../types';
import { getCanvas, putCanvas } from '../lib/db';

export type SaveStatus = 'idle' | 'saving' | 'saved';
export type CanvasTool = 'select' | 'draw';

export interface DrawSettings {
  stroke: string;
  strokeWidth: number;
  opacity: number;
  tool: DrawTool;
  smoothing: boolean;
}

interface CanvasState {
  doc: CanvasDoc | null;
  selectedIds: string[];
  saveStatus: SaveStatus;
  activeTool: CanvasTool;
  drawSettings: DrawSettings;

  // Undo/redo history
  history: CanvasDoc[];
  historyIndex: number;
  clipboard: CanvasObject[];

  loadCanvas: (notebookId: string, seedDoc: CanvasDoc) => Promise<void>;

  // Mutations — all go through here so we can centralize persistence scheduling.
  addObject: (obj: CanvasObject) => void;
  updateObject: (id: string, patch: Partial<CanvasObject>) => void;
  updateObjectData: (id: string, dataPatch: Record<string, unknown>) => void;
  deleteObjects: (ids: string[]) => void;
  duplicateObjects: (ids: string[]) => void;
  bringToFront: (ids: string[]) => void;
  sendToBack: (ids: string[]) => void;
  bringForward: (ids: string[]) => void;
  sendBackward: (ids: string[]) => void;
  toggleLock: (id: string) => void;
  toggleHidden: (id: string) => void;
  renameObject: (id: string, label: string) => void;
  reorderObjects: (newOrder: string[]) => void;
  groupObjects: (ids: string[]) => void;
  ungroupObjects: (groupId: string) => void;
  alignObjects: (
    ids: string[],
    axis: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom'
  ) => void;
  distributeObjects: (ids: string[], axis: 'h' | 'v') => void;

  // Undo / Redo / Clipboard
  undo: () => void;
  redo: () => void;
  copyObjects: (ids: string[]) => void;
  pasteObjects: () => void;
  cutObjects: (ids: string[]) => void;
  pushHistory: (doc: CanvasDoc) => void;

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
  tool: 'pencil',
  smoothing: true,
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
  doc: null,
  selectedIds: [],
  saveStatus: 'idle',
  activeTool: 'select',
  drawSettings: DEFAULT_DRAW_SETTINGS,
  history: [],
  historyIndex: -1,
  clipboard: [],

  loadCanvas: async (_notebookId, seedDoc) => {
    let doc = await getCanvas(seedDoc.id);
    if (!doc) {
      doc = seedDoc;
      await putCanvas(doc);
    }
    set({ doc, selectedIds: [], saveStatus: 'idle', activeTool: 'select', history: [doc], historyIndex: 0 });
  },

  addObject: (obj) => {
    const { doc } = get();
    if (!doc) return;
    const nextDoc: CanvasDoc = {
      ...doc,
      objects: { ...doc.objects, [obj.id]: obj },
      objectOrder: [...doc.objectOrder, obj.id],
    };
    get().pushHistory(nextDoc);
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
    const nextDoc = { ...doc, objects, objectOrder };
    get().pushHistory(nextDoc);
    set({
      doc: nextDoc,
      selectedIds: get().selectedIds.filter((id) => !idSet.has(id)),
    });
    get().scheduleSave();
  },


  duplicateObjects: (ids) => {
    const { doc } = get();
    if (!doc) return;
    const newIds: string[] = [];
    let objects = { ...doc.objects };
    let objectOrder = [...doc.objectOrder];
    for (const id of ids) {
      const src = doc.objects[id];
      if (!src) continue;
      const copy: CanvasObject = {
        ...src,
        id: crypto.randomUUID(),
        x: src.x + 20,
        y: src.y + 20,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      objects = { ...objects, [copy.id]: copy };
      objectOrder = [...objectOrder, copy.id];
      newIds.push(copy.id);
    }
    set({ doc: { ...doc, objects, objectOrder }, selectedIds: newIds });
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

  bringForward: (ids) => {
    const { doc } = get();
    if (!doc) return;
    const order = [...doc.objectOrder];
    for (const id of ids) {
      const idx = order.indexOf(id);
      if (idx < order.length - 1) {
        [order[idx], order[idx + 1]] = [order[idx + 1], order[idx]];
      }
    }
    set({ doc: { ...doc, objectOrder: order } });
    get().scheduleSave();
  },

  sendBackward: (ids) => {
    const { doc } = get();
    if (!doc) return;
    const order = [...doc.objectOrder];
    for (const id of [...ids].reverse()) {
      const idx = order.indexOf(id);
      if (idx > 0) {
        [order[idx], order[idx - 1]] = [order[idx - 1], order[idx]];
      }
    }
    set({ doc: { ...doc, objectOrder: order } });
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

  renameObject: (id, label) => {
    get().updateObject(id, { label } as Partial<CanvasObject>);
  },

  reorderObjects: (newOrder) => {
    const { doc } = get();
    if (!doc) return;
    set({ doc: { ...doc, objectOrder: newOrder } });
    get().scheduleSave();
  },

  groupObjects: (ids) => {
    const { doc } = get();
    if (!doc || ids.length < 2) return;
    const groupId = crypto.randomUUID();
    const objects = { ...doc.objects };
    for (const id of ids) {
      if (objects[id]) {
        objects[id] = { ...objects[id], groupId, updatedAt: Date.now() } as CanvasObject;
      }
    }
    set({ doc: { ...doc, objects } });
    get().scheduleSave();
  },

  ungroupObjects: (groupId) => {
    const { doc } = get();
    if (!doc) return;
    const objects = { ...doc.objects };
    for (const obj of Object.values(objects)) {
      if (obj.groupId === groupId) {
        objects[obj.id] = { ...obj, groupId: undefined, updatedAt: Date.now() } as CanvasObject;
      }
    }
    set({ doc: { ...doc, objects } });
    get().scheduleSave();
  },

  alignObjects: (ids, axis) => {
    const { doc } = get();
    if (!doc || ids.length < 2) return;
    const objs = ids.map((id) => doc.objects[id]).filter(Boolean);
    if (!objs.length) return;

    const minX = Math.min(...objs.map((o) => o.x));
    const maxX = Math.max(...objs.map((o) => o.x + o.width));
    const minY = Math.min(...objs.map((o) => o.y));
    const maxY = Math.max(...objs.map((o) => o.y + o.height));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const objects = { ...doc.objects };
    for (const obj of objs) {
      let patch: Partial<CanvasObject> = {};
      if (axis === 'left') patch = { x: minX };
      else if (axis === 'right') patch = { x: maxX - obj.width };
      else if (axis === 'center-h') patch = { x: cx - obj.width / 2 };
      else if (axis === 'top') patch = { y: minY };
      else if (axis === 'bottom') patch = { y: maxY - obj.height };
      else if (axis === 'center-v') patch = { y: cy - obj.height / 2 };
      objects[obj.id] = { ...obj, ...patch, updatedAt: Date.now() } as CanvasObject;
    }
    set({ doc: { ...doc, objects } });
    get().scheduleSave();
  },

  distributeObjects: (ids, axis) => {
    const { doc } = get();
    if (!doc || ids.length < 3) return;
    const objs = ids.map((id) => doc.objects[id]).filter(Boolean);
    if (objs.length < 3) return;

    const sorted = [...objs].sort((a, b) =>
      axis === 'h' ? a.x - b.x : a.y - b.y
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSize = axis === 'h'
      ? sorted.slice(1, -1).reduce((s, o) => s + o.width, 0)
      : sorted.slice(1, -1).reduce((s, o) => s + o.height, 0);
    const gap = axis === 'h'
      ? (last.x - first.x - first.width - totalSize) / (sorted.length - 1)
      : (last.y - first.y - first.height - totalSize) / (sorted.length - 1);

    const objects = { ...doc.objects };
    let cursor = axis === 'h' ? first.x + first.width + gap : first.y + first.height + gap;
    for (let i = 1; i < sorted.length - 1; i++) {
      const obj = sorted[i];
      const patch: Partial<CanvasObject> = axis === 'h'
        ? { x: cursor }
        : { y: cursor };
      objects[obj.id] = { ...obj, ...patch, updatedAt: Date.now() } as CanvasObject;
      cursor += (axis === 'h' ? obj.width : obj.height) + gap;
    }
    set({ doc: { ...doc, objects } });
    get().scheduleSave();
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

  // ── History ──
  pushHistory: (doc) => {
    const { history, historyIndex } = get();
    const trimmed = history.slice(0, historyIndex + 1);
    const next = [...trimmed, doc].slice(-50); // max 50 steps
    set({ history: next, historyIndex: next.length - 1 });
  },

  undo: () => {
    const { history, historyIndex, doc } = get();
    if (historyIndex <= 0) return;
    // If at tip, push current state so redo works
    if (doc && historyIndex === history.length - 1) {
      // already pushed by mutations
    }
    const prevIndex = historyIndex - 1;
    const prevDoc = history[prevIndex];
    if (!prevDoc) return;
    set({ doc: prevDoc, historyIndex: prevIndex, selectedIds: [] });
    get().scheduleSave();
  },

  redo: () => {
    const { history, historyIndex } = get();
    const nextIndex = historyIndex + 1;
    const nextDoc = history[nextIndex];
    if (!nextDoc) return;
    set({ doc: nextDoc, historyIndex: nextIndex, selectedIds: [] });
    get().scheduleSave();
  },

  // ── Clipboard ──
  copyObjects: (ids) => {
    const { doc } = get();
    if (!doc) return;
    const copies = ids.map((id) => doc.objects[id]).filter(Boolean) as CanvasObject[];
    set({ clipboard: copies });
  },

  pasteObjects: () => {
    const { doc, clipboard } = get();
    if (!doc || clipboard.length === 0) return;
    let objects = { ...doc.objects };
    let objectOrder = [...doc.objectOrder];
    const newIds: string[] = [];
    for (const src of clipboard) {
      const copy: CanvasObject = {
        ...src,
        id: crypto.randomUUID(),
        x: src.x + 28,
        y: src.y + 28,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      objects = { ...objects, [copy.id]: copy };
      objectOrder = [...objectOrder, copy.id];
      newIds.push(copy.id);
    }
    const nextDoc = { ...doc, objects, objectOrder };
    get().pushHistory(nextDoc);
    set({ doc: nextDoc, selectedIds: newIds });
    get().scheduleSave();
  },

  cutObjects: (ids) => {
    get().copyObjects(ids);
    get().deleteObjects(ids);
  },

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
        console.error('Failed to save canvas', err);
        set({ saveStatus: 'idle' });
      }
    }, SAVE_DEBOUNCE_MS);
  },
}));

