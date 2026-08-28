// Core domain types for AS YOU WISH.
// Extending object "data" shapes (drawing strokes, stickers, image frames)
// as new CanvasObjectBase variants, so old stored objects keep loading —
// every new field is optional and every reader supplies a sensible default.

export type ObjectType = 'text' | 'image' | 'note' | 'drawing' | 'sticker';

export interface CanvasObjectBase {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  zIndex: number;
  locked: boolean;
  hidden: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TextObjectData {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline?: boolean;
  highlight?: string; // pastel highlight colour, '' or undefined = none
  align: 'left' | 'center' | 'right';
}

export interface NoteObjectData {
  text: string;
  color: string; // sticky note background
}

export type ImageFrame = 'none' | 'polaroid' | 'paper' | 'tape' | 'film' | 'torn';

export interface ImageObjectData {
  src: string; // object URL or data URL
  naturalWidth: number;
  naturalHeight: number;
  frame?: ImageFrame; // defaults to 'none' when absent (older saves)
  caption?: string;
}

export interface DrawingObjectData {
  path: string; // SVG path `d` string, in the object's own local coordinate space
  stroke: string;
  strokeWidth: number;
  opacity: number;
  lineCap: 'round' | 'square';
}

// Curated symbol stickers today; `assetSrc` reserved so a future pass can
// add user-uploaded sticker images without another type migration.
export interface StickerObjectData {
  symbol: string;
  background?: string;
  assetSrc?: string;
}

export type CanvasObject =
  | (CanvasObjectBase & { type: 'text'; data: TextObjectData })
  | (CanvasObjectBase & { type: 'note'; data: NoteObjectData })
  | (CanvasObjectBase & { type: 'image'; data: ImageObjectData })
  | (CanvasObjectBase & { type: 'drawing'; data: DrawingObjectData })
  | (CanvasObjectBase & { type: 'sticker'; data: StickerObjectData });

export type CanvasBackground =
  | 'blank' | 'dotted' | 'grid' | 'lined' | 'paper'
  | 'pink' | 'lavender' | 'sage' | 'sky';

export interface CanvasDoc {
  id: string;
  notebookId: string;
  objects: Record<string, CanvasObject>;
  objectOrder: string[]; // z-order, bottom to top
  background: CanvasBackground;
  camera: { x: number; y: number; zoom: number };
}

export interface Notebook {
  id: string;
  title: string;
  coverColor: string;
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  isArchived: boolean;
}
