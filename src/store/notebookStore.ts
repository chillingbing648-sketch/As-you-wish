import { create } from 'zustand';
import type { Notebook } from '../types';
import { listNotebooks, putNotebook, deleteNotebook, putCanvas } from '../lib/db';

interface NotebookState {
  notebooks: Notebook[];
  loaded: boolean;
  refresh: () => Promise<void>;
  createNotebook: (title: string, coverColor: string) => Promise<Notebook>;
  renameNotebook: (id: string, title: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  archiveNotebook: (id: string) => Promise<void>;
  removeNotebook: (id: string) => Promise<void>;
}

const COVER_COLORS = ['#EADFC8', '#D9C3B4', '#C9D3C0', '#E3CFCB', '#CFD6DE', '#E7D6A9'];

export function randomCoverColor() {
  return COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)];
}

export const useNotebookStore = create<NotebookState>((set, get) => ({
  notebooks: [],
  loaded: false,

  refresh: async () => {
    const notebooks = await listNotebooks();
    set({ notebooks, loaded: true });
  },

  createNotebook: async (title, coverColor) => {
    const now = Date.now();
    const notebook: Notebook = {
      id: crypto.randomUUID(),
      title,
      coverColor,
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
      isArchived: false,
    };
    await putNotebook(notebook);
    await putCanvas({
      id: crypto.randomUUID(),
      notebookId: notebook.id,
      objects: {},
      objectOrder: [],
      background: 'paper',
      camera: { x: window.innerWidth / 2, y: (window.innerHeight - 62) / 2, zoom: 1 },
    });
    await get().refresh();
    return notebook;
  },

  renameNotebook: async (id, title) => {
    const nb = get().notebooks.find((n) => n.id === id);
    if (!nb) return;
    await putNotebook({ ...nb, title, updatedAt: Date.now() });
    await get().refresh();
  },

  toggleFavorite: async (id) => {
    const nb = get().notebooks.find((n) => n.id === id);
    if (!nb) return;
    await putNotebook({ ...nb, isFavorite: !nb.isFavorite, updatedAt: Date.now() });
    await get().refresh();
  },

  archiveNotebook: async (id) => {
    const nb = get().notebooks.find((n) => n.id === id);
    if (!nb) return;
    await putNotebook({ ...nb, isArchived: !nb.isArchived, updatedAt: Date.now() });
    await get().refresh();
  },

  removeNotebook: async (id) => {
    await deleteNotebook(id);
    await get().refresh();
  },
}));
