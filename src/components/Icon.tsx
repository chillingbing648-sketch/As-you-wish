import type { ReactNode, SVGProps } from 'react';

// A small, hand-authored stroke-icon set so the interface never relies on
// emoji as UI chrome. (Emoji/symbol glyphs are still fine as *canvas
// content* — sticker objects, cover decoration — that's decoration, not UI.)
export type IconName =
  | 'arrow-left' | 'search' | 'plus' | 'star' | 'archive' | 'trash' | 'more'
  | 'zoom-in' | 'zoom-out' | 'maximize' | 'type' | 'image' | 'pen' | 'highlighter'
  | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'align-left' | 'align-center' | 'align-right'
  | 'layers' | 'layers-back' | 'lock' | 'unlock' | 'sparkles' | 'palette' | 'eraser' | 'rotate'
  | 'copy' | 'download' | 'grid' | 'book' | 'heart' | 'check' | 'droplet' | 'cursor'
  | 'swatch' | 'x' | 'shapes' | 'square' | 'circle' | 'triangle' | 'star-shape'
  | 'arrow-right' | 'speech-bubble' | 'minus' | 'group' | 'ungroup' | 'align-top'
  | 'align-middle' | 'align-bottom' | 'distribute-h' | 'distribute-v' | 'eye' | 'eye-off'
  | 'crop' | 'sliders' | 'flip-h' | 'flip-v' | 'template' | 'element' | 'pencil'
  | 'marker' | 'brush' | 'fountain-pen' | 'chevron-down' | 'chevron-right' | 'font'
  | 'undo' | 'redo' | 'more-horizontal' | 'keyboard';


export function Icon({
  name,
  size = 18,
  strokeWidth = 1.8,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName; size?: number; strokeWidth?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  };
  const paths: Record<IconName, ReactNode> = {
    'arrow-left': <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    archive: <><path d="M4 7h16" /><path d="M6 7v12h12V7" /><path d="M3 4h18v3H3z" /><path d="M9 11h6" /></>,
    trash: <><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    'zoom-in': <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M10.5 7.5v6M7.5 10.5h6M16 16l4 4" /></>,
    'zoom-out': <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M7.5 10.5h6M16 16l4 4" /></>,
    maximize: <><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" /></>,
    type: <><path d="M4 6V4h16v2M12 4v16M8 20h8" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m21 15-5-5L5 20" /></>,
    pen: <><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" /><path d="m14 7 3 3" /></>,
    highlighter: <><path d="m5 16 9-9 4 4-9 9H5v-4Z" /><path d="m13 8 3 3" /></>,
    bold: <path d="M7 5h5a4 4 0 0 1 0 8H7m0-8v14h6a4 4 0 0 0 0-8H7" />,
    italic: <><path d="M10 5h7M7 19h7M14 5 10 19" /></>,
    underline: <><path d="M6 4v6a6 6 0 0 0 12 0V4M5 21h14" /></>,
    strikethrough: <><path d="M16 4H9a3 3 0 0 0-2.8 4 3 3 0 0 0 2.8 4h8a3 3 0 0 1 2.8 4 3 3 0 0 1-2.8 4H7" /><path d="M4 12h16" /></>,
    'align-left': <><path d="M4 6h16M4 10h11M4 14h16M4 18h11" /></>,
    'align-center': <><path d="M4 6h16M7 10h10M4 14h16M7 18h10" /></>,
    'align-right': <><path d="M4 6h16M9 10h11M4 14h16M9 18h11" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    'layers-back': <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="M3 12v0M21 12v0" /><path d="m3 12 4 2.2M21 12l-4 2.2" strokeDasharray="1 4" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    unlock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 7-2" /></>,
    sparkles: <><path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" /></>,
    palette: <><path d="M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h2a7 7 0 0 0 0-10Z" /><circle cx="7.5" cy="10" r=".8" /><circle cx="9" cy="6.5" r=".8" /><circle cx="14" cy="6" r=".8" /></>,
    eraser: <path d="m7 20 10.5-10.5a2.8 2.8 0 0 0-4-4L3 16l4 4Z" />,
    rotate: <><path d="M4 10a8 8 0 0 1 13-5l2 2" /><path d="M19 4v5h-5" /><path d="M20 14a8 8 0 0 1-13 5l-2-2" /><path d="M5 20v-5h5" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></>,
    grid: <><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></>,
    book: <><path d="M4 5a2 2 0 0 1 2-2h13v17H6a2 2 0 0 0-2 2V5Z" /><path d="M4 20a2 2 0 0 1 2-2h13" /></>,
    heart: <path d="M20.8 8.7c0 5.4-8.8 10.3-8.8 10.3S3.2 14.1 3.2 8.7A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.8 2.3Z" />,
    check: <path d="m5 12 4 4L19 6" />,
    droplet: <path d="M12 2.5s6.5 7.4 6.5 12a6.5 6.5 0 0 1-13 0c0-4.6 6.5-12 6.5-12Z" />,
    cursor: <path d="M5 3l6.5 17 2.2-6.8L20.5 11 5 3Z" />,
    swatch: <><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.6" /><circle cx="15.5" cy="8.5" r="1.6" /><circle cx="8.5" cy="15.5" r="1.6" /><circle cx="15.5" cy="15.5" r="1.6" /></>,
    x: <><path d="M6 6l12 12M18 6 6 18" /></>,
    // P1 Typography
    font: <><path d="M4 7V4h16v3M12 4v16M8 20h8" /></>,
    // P2 Shapes
    shapes: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><circle cx="17" cy="7" r="4" /><path d="m14 21 4-7 4 7Z" /></>,
    square: <rect x="3" y="3" width="18" height="18" rx="2" />,
    circle: <circle cx="12" cy="12" r="9" />,
    triangle: <path d="m12 3 10 18H2Z" />,
    'star-shape': <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3 1.2-6.8-5-4.9 6.9-1Z" />,
    'arrow-right': <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    'speech-bubble': <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />,
    minus: <path d="M5 12h14" />,
    // P3 Layers & Group
    group: <><rect x="2" y="2" width="9" height="9" rx="1.5" /><rect x="13" y="13" width="9" height="9" rx="1.5" /><path d="M14 6h4a2 2 0 0 1 2 2v4M6 14v4a2 2 0 0 0 2 2h4" strokeDasharray="2 2" /></>,
    ungroup: <><rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="14" width="8" height="8" rx="1" /><path d="M14 2h8v8M2 14v8h8" /></>,
    'align-top': <><path d="M4 4h16M8 8v12M16 8v8" /></>,
    'align-middle': <><path d="M4 12h16M8 6v12M16 8v8" /></>,
    'align-bottom': <><path d="M4 20h16M8 4v12M16 8v8" /></>,
    'distribute-h': <><path d="M4 4v16M20 4v16M10 8v8M14 8v8" /></>,
    'distribute-v': <><path d="M4 4h16M4 20h16M8 10h8M8 14h8" /></>,
    eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    'eye-off': <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20" /></>,
    // P4 Drawing Tools
    pencil: <><path d="m18 2 4 4-14 14H4v-4L18 2Z" /><path d="m14 6 4 4" /></>,
    marker: <><path d="m15 2 7 7-4 4-7-7 4-4Z" /><path d="m8 9-5 5v4l2 2h4l5-5" /></>,
    brush: <><path d="m18 3 3 3-9 9-4 1 1-4 9-9Z" /><path d="M12 15c-3 1.5-6 6-6 6s4.5-3 6-6Z" /></>,
    'fountain-pen': <><path d="m12 2 6 6-6 14-6-14 6-6Z" /><circle cx="12" cy="12" r="1.5" /><path d="M12 13.5V22" /></>,
    // P6 Image Editing
    crop: <><path d="M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2" /></>,
    sliders: <><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></>,
    'flip-h': <><path d="m8 7-5 5 5 5V7ZM16 7l5 5-5 5V7ZM12 3v18" /></>,
    'flip-v': <><path d="m7 8 5-5 5 5H7ZM7 16l5 5 5-5H7ZM3 12h18" /></>,
    // P7 Templates & P8 Elements
    template: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>,
    element: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>,
    'chevron-down': <path d="m6 9 6 6 6-6" />,
    'chevron-right': <path d="m9 18 6-6-6-6" />,
    undo: <><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></>,
    redo: <><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" /></>,
    'more-horizontal': <><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /><circle cx="5" cy="12" r="1.5" /></>,
    keyboard: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" /></>,
  };

  return (
    <svg {...common} aria-hidden="true">
      {paths[name] ?? <circle cx="12" cy="12" r="6" />}
    </svg>
  );
}
