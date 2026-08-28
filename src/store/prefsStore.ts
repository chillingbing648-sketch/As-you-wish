import { create } from 'zustand';
import type { UserPrefs, SavedElement } from '../types';
import { getUserPrefs, putUserPrefs } from '../lib/db';

interface PrefsState {
  prefs: UserPrefs;
  loaded: boolean;
  load: () => Promise<void>;
  addRecentColor: (color: string) => void;
  toggleFavoriteColor: (color: string) => void;
  addFontRecent: (fontName: string) => void;
  toggleFontFavorite: (fontName: string) => void;
  saveElement: (el: SavedElement) => void;
  deleteElement: (id: string) => void;
}

const DEFAULT_PREFS: UserPrefs = {
  id: 'singleton',
  recentColors: [],
  favoriteColors: [],
  fontFavorites: [],
  fontRecents: [],
  savedPalettes: [],
  savedElements: [],
};

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(prefs: UserPrefs) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => putUserPrefs(prefs), 400);
}

export const usePrefsStore = create<PrefsState>((set, get) => ({
  prefs: { ...DEFAULT_PREFS },
  loaded: false,

  load: async () => {
    const prefs = await getUserPrefs();
    set({ prefs, loaded: true });
  },

  addRecentColor: (color) => {
    const p = get().prefs;
    const filtered = p.recentColors.filter((c) => c !== color);
    const recentColors = [color, ...filtered].slice(0, 16);
    const next = { ...p, recentColors };
    set({ prefs: next });
    scheduleSave(next);
  },

  toggleFavoriteColor: (color) => {
    const p = get().prefs;
    const has = p.favoriteColors.includes(color);
    const favoriteColors = has
      ? p.favoriteColors.filter((c) => c !== color)
      : [...p.favoriteColors, color].slice(0, 24);
    const next = { ...p, favoriteColors };
    set({ prefs: next });
    scheduleSave(next);
  },

  addFontRecent: (fontName) => {
    const p = get().prefs;
    const filtered = p.fontRecents.filter((f) => f !== fontName);
    const fontRecents = [fontName, ...filtered].slice(0, 8);
    const next = { ...p, fontRecents };
    set({ prefs: next });
    scheduleSave(next);
  },

  toggleFontFavorite: (fontName) => {
    const p = get().prefs;
    const has = p.fontFavorites.includes(fontName);
    const fontFavorites = has
      ? p.fontFavorites.filter((f) => f !== fontName)
      : [...p.fontFavorites, fontName];
    const next = { ...p, fontFavorites };
    set({ prefs: next });
    scheduleSave(next);
  },

  saveElement: (el) => {
    const p = get().prefs;
    const savedElements = [el, ...p.savedElements].slice(0, 50);
    const next = { ...p, savedElements };
    set({ prefs: next });
    scheduleSave(next);
  },

  deleteElement: (id) => {
    const p = get().prefs;
    const savedElements = p.savedElements.filter((e) => e.id !== id);
    const next = { ...p, savedElements };
    set({ prefs: next });
    scheduleSave(next);
  },
}));
