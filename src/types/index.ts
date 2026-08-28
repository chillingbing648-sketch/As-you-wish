// Core domain types for AS YOU WISH.
// Extending object "data" shapes (drawing strokes, stickers, image frames)
// as new CanvasObjectBase variants, so old stored objects keep loading —
// every new field is optional and every reader supplies a sensible default.

export type ObjectType = 'text' | 'image' | 'note' | 'drawing' | 'sticker' | 'shape';

export type ShapeType =
  | 'rect'
  | 'circle'
  | 'rounded-rect'
  | 'triangle'
  | 'star'
  | 'line'
  | 'arrow'
  | 'speech-bubble'
  | 'divider';

export type DrawTool = 'pencil' | 'ballpoint' | 'fountain' | 'marker' | 'highlighter' | 'brush' | 'eraser';

export type ImageFilter = 'none' | 'grayscale' | 'warm' | 'cool' | 'fade' | 'vivid';

export type HeadingStyle = 'h1' | 'h2' | 'h3' | 'body' | 'quote' | 'handwritten' | 'caption';
export type HighlightStyle = 'soft' | 'marker' | 'transparent' | 'underline' | 'custom';

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
  // P3 — Groups & Layers
  groupId?: string;
  label?: string;
}

export interface TextObjectData {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  highlight?: string;
  highlightStyle?: HighlightStyle;
  textBackground?: string;
  align: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  headingStyle?: HeadingStyle;
  fontWeight?: number;
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
  frame?: ImageFrame;          // defaults to 'none' when absent
  caption?: string;
  // P6 — all optional for backward-compat
  opacity?: number;            // 0–1, default 1
  border?: string;             // CSS border string
  shadow?: boolean;
  filter?: ImageFilter;
  brightness?: number;         // 0–200, default 100
  contrast?: number;
  saturation?: number;
  flipH?: boolean;
  flipV?: boolean;
  cropX?: number;              // crop offset as fraction of naturalWidth (0–1)
  cropY?: number;
  cropW?: number;              // crop size as fraction (0–1)
  cropH?: number;
}

export interface DrawingObjectData {
  path: string; // SVG path `d` string, in object's own local coordinate space
  stroke: string;
  strokeWidth: number;
  opacity: number;
  lineCap: 'round' | 'square';
  // P4
  drawTool?: DrawTool;
  linejoin?: 'round' | 'miter' | 'bevel';
}

// Curated symbol stickers; `assetSrc` reserved for future user-uploaded stickers.
export interface StickerObjectData {
  symbol: string;
  background?: string;
  assetSrc?: string;
}

// P2 — Shape objects rendered as SVG
export interface ShapeObjectData {
  shapeType: ShapeType;
  fill: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;      // 0–1
  shadow?: boolean;
  rounded?: number;     // corner radius for rounded-rect
  starPoints?: number;  // number of star points (default 5)
  arrowStart?: boolean;
  arrowEnd?: boolean;
}

export type CanvasObject =
  | (CanvasObjectBase & { type: 'text'; data: TextObjectData })
  | (CanvasObjectBase & { type: 'note'; data: NoteObjectData })
  | (CanvasObjectBase & { type: 'image'; data: ImageObjectData })
  | (CanvasObjectBase & { type: 'drawing'; data: DrawingObjectData })
  | (CanvasObjectBase & { type: 'sticker'; data: StickerObjectData })
  | (CanvasObjectBase & { type: 'shape'; data: ShapeObjectData });

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

// P5/P8 — User preferences persisted in IDB
export interface UserPrefs {
  id: 'singleton';
  recentColors: string[];
  favoriteColors: string[];
  fontFavorites: string[];
  fontRecents: string[];
  savedPalettes: { name: string; colors: string[] }[];
  savedElements: SavedElement[];
}

export interface SavedElement {
  id: string;
  label: string;
  objects: CanvasObject[];
  createdAt: number;
}
