import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { CanvasDoc, Notebook, UserPrefs } from '../types';

interface AsYouWishDB extends DBSchema {
  notebooks: {
    key: string;
    value: Notebook;
    indexes: { 'by-updatedAt': number };
  };
  canvases: {
    key: string;
    value: CanvasDoc;
    indexes: { 'by-notebookId': string };
  };
  userPrefs: {
    key: string;
    value: UserPrefs;
  };
}

const DB_NAME = 'as-you-wish';
const DB_VERSION = 2; // v2 adds userPrefs store

let dbPromise: Promise<IDBPDatabase<AsYouWishDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<AsYouWishDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains('notebooks')) {
          const store = db.createObjectStore('notebooks', { keyPath: 'id' });
          store.createIndex('by-updatedAt', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('canvases')) {
          const store = db.createObjectStore('canvases', { keyPath: 'id' });
          store.createIndex('by-notebookId', 'notebookId');
        }
        if (oldVersion < 2 && !db.objectStoreNames.contains('userPrefs')) {
          db.createObjectStore('userPrefs', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// ---- Notebooks ----

export async function listNotebooks(): Promise<Notebook[]> {
  const db = await getDB();
  const all = await db.getAll('notebooks');
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getNotebook(id: string): Promise<Notebook | undefined> {
  const db = await getDB();
  return db.get('notebooks', id);
}

export async function putNotebook(notebook: Notebook): Promise<void> {
  const db = await getDB();
  await db.put('notebooks', notebook);
}

export async function deleteNotebook(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('notebooks', id);
  const tx = db.transaction('canvases', 'readwrite');
  const idx = tx.store.index('by-notebookId');
  for await (const cursor of idx.iterate(id)) {
    await cursor.delete();
  }
  await tx.done;
}

// ---- Canvases ----

export async function getCanvas(id: string): Promise<CanvasDoc | undefined> {
  const db = await getDB();
  return db.get('canvases', id);
}

export async function getCanvasByNotebook(notebookId: string): Promise<CanvasDoc | undefined> {
  const db = await getDB();
  const idx = db.transaction('canvases').store.index('by-notebookId');
  return idx.get(notebookId);
}

export async function putCanvas(doc: CanvasDoc): Promise<void> {
  const db = await getDB();
  await db.put('canvases', doc);
}

// ---- UserPrefs ----

const DEFAULT_PREFS: UserPrefs = {
  id: 'singleton',
  recentColors: [],
  favoriteColors: [],
  fontFavorites: [],
  fontRecents: [],
  savedPalettes: [],
  savedElements: [],
};

export async function getUserPrefs(): Promise<UserPrefs> {
  const db = await getDB();
  const prefs = await db.get('userPrefs', 'singleton');
  return prefs ?? { ...DEFAULT_PREFS };
}

export async function putUserPrefs(prefs: UserPrefs): Promise<void> {
  const db = await getDB();
  await db.put('userPrefs', prefs);
}
