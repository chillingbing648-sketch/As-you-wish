import type { CanvasObject } from '../types';

export interface GifFrame {
  id: string;
  duration: number;
  objects: CanvasObject[];
}

export interface GifDocument {
  id: string;
  name: string;
  width: number;
  height: number;
  frames: GifFrame[];
  loop: boolean;
}

export interface StoredGif {
  id: string;
  name: string;
  blob?: Blob;
  sourceUrl?: string;
  document?: GifDocument;
  createdAt: number;
  updatedAt: number;
}
