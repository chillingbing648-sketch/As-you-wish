import { create } from 'zustand';
import type { GifDocument, GifFrame, StoredGif } from './types';
import { deleteGif, listGifs, putGif } from '../lib/db';
import type { CanvasObject } from '../types';

interface GifState {
  gifs: StoredGif[];
  current: GifDocument | null;
  selectedFrame: number;
  loading: boolean;
  load: () => Promise<void>;
  newDocument: (seedObjects?: CanvasObject[]) => void;
  addFrame: (objects?: CanvasObject[]) => void;
  duplicateFrame: (index: number) => void;
  deleteFrame: (index: number) => void;
  moveFrame: (from: number, to: number) => void;
  setFrameDuration: (index: number, duration: number) => void;
  replaceFrameObjects: (index: number, objects: CanvasObject[]) => void;
  setSelectedFrame: (index: number) => void;
  setLoop: (loop: boolean) => void;
  persist: (record: StoredGif) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearCurrent: () => void;
}

const blankFrame = (objects: CanvasObject[] = []): GifFrame => ({
  id: crypto.randomUUID(),
  duration: 120,
  objects: structuredClone(objects),
});

export const useGifStore = create<GifState>((set, get) => ({
  gifs: [],
  current: null,
  selectedFrame: 0,
  loading: false,

  load: async () => {
    set({ loading: true });
    const gifs = await listGifs();
    set({ gifs, loading: false });
  },

  newDocument: (seedObjects = []) => {
    const now = Date.now();
    set({
      selectedFrame: 0,
      current: {
        id: crypto.randomUUID(),
        name: `My GIF ${new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        width: 480,
        height: 320,
        frames: [blankFrame(seedObjects)],
        loop: true,
      },
    });
  },

  addFrame: (objects = []) => {
    const current = get().current;
    if (!current) return;
    if (current.frames.length >= 60) return;
    const next = [...current.frames, blankFrame(objects)];
    set({ current: { ...current, frames: next }, selectedFrame: next.length - 1 });
  },

  duplicateFrame: (index) => {
    const current = get().current;
    if (!current || current.frames.length >= 60 || !current.frames[index]) return;
    const copy = blankFrame(current.frames[index].objects);
    copy.duration = current.frames[index].duration;
    const next = [...current.frames];
    next.splice(index + 1, 0, copy);
    set({ current: { ...current, frames: next }, selectedFrame: index + 1 });
  },

  deleteFrame: (index) => {
    const current = get().current;
    if (!current || current.frames.length <= 1) return;
    const next = current.frames.filter((_, i) => i !== index);
    set({
      current: { ...current, frames: next },
      selectedFrame: Math.min(get().selectedFrame, next.length - 1),
    });
  },

  moveFrame: (from, to) => {
    const current = get().current;
    if (!current || from === to || !current.frames[from] || to < 0 || to >= current.frames.length) return;
    const frames = [...current.frames];
    const [moved] = frames.splice(from, 1);
    frames.splice(to, 0, moved);
    set({ current: { ...current, frames }, selectedFrame: to });
  },

  setFrameDuration: (index, duration) => {
    const current = get().current;
    if (!current || !current.frames[index]) return;
    const frames = current.frames.map((frame, i) =>
      i === index ? { ...frame, duration: Math.min(2000, Math.max(20, Math.round(duration))) } : frame,
    );
    set({ current: { ...current, frames } });
  },

  replaceFrameObjects: (index, objects) => {
    const current = get().current;
    if (!current || !current.frames[index]) return;
    const frames = current.frames.map((frame, i) =>
      i === index ? { ...frame, objects: structuredClone(objects) } : frame,
    );
    set({ current: { ...current, frames } });
  },

  setSelectedFrame: (index) => {
    const current = get().current;
    if (!current) return;
    set({ selectedFrame: Math.min(Math.max(0, index), current.frames.length - 1) });
  },

  setLoop: (loop) => {
    const current = get().current;
    if (current) set({ current: { ...current, loop } });
  },

  persist: async (record) => {
    await putGif(record);
    set((state) => ({
      gifs: [record, ...state.gifs.filter((item) => item.id !== record.id)].sort((a, b) => b.updatedAt - a.updatedAt),
    }));
  },

  remove: async (id) => {
    await deleteGif(id);
    set((state) => ({ gifs: state.gifs.filter((item) => item.id !== id) }));
  },

  clearCurrent: () => set({ current: null, selectedFrame: 0 }),
}));
