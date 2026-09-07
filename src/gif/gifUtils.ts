import type { CanvasObject } from '../types';

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function shapeSvg(obj: Extract<CanvasObject, { type: 'shape' }>): string {
  const { shapeType, fill, strokeColor, strokeWidth, opacity, rounded, starPoints = 5 } = obj.data;
  const x = obj.x;
  const y = obj.y;
  const w = obj.width;
  const h = obj.height;
  const common = `fill="${fill}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}"`;
  if (shapeType === 'circle') return `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" ${common}/>`;
  if (shapeType === 'triangle') return `<polygon points="${x + w / 2},${y} ${x + w},${y + h} ${x},${y + h}" ${common}/>`;
  if (shapeType === 'line' || shapeType === 'divider') return `<line x1="${x}" y1="${y + h / 2}" x2="${x + w}" y2="${y + h / 2}" ${common}/>`;
  if (shapeType === 'arrow') return `<line x1="${x}" y1="${y + h / 2}" x2="${x + w}" y2="${y + h / 2}" stroke="${strokeColor}" stroke-width="${Math.max(2, strokeWidth)}" opacity="${opacity}" marker-end="url(#arrow)"/>`;
  if (shapeType === 'star') {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const outer = Math.min(w, h) / 2;
    const inner = outer * 0.45;
    const points: string[] = [];
    for (let i = 0; i < starPoints * 2; i += 1) {
      const r = i % 2 === 0 ? outer : inner;
      const angle = -Math.PI / 2 + (i * Math.PI) / starPoints;
      points.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`);
    }
    return `<polygon points="${points.join(' ')}" ${common}/>`;
  }
  const radius = shapeType === 'rounded-rect' ? rounded ?? 12 : 0;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" ${common}/>`;
}

export function canvasObjectsToSvg(objects: CanvasObject[], width: number, height: number, background = '#FFFDFB'): string {
  const sorted = [...objects].filter((object) => !object.hidden).sort((a, b) => a.zIndex - b.zIndex);
  const body = sorted.map((obj) => {
    if (obj.type === 'text') {
      const d = obj.data;
      return `<text x="${obj.x}" y="${obj.y + d.fontSize}" font-family="${esc(d.fontFamily)}" font-size="${d.fontSize}" font-weight="${d.fontWeight ?? (d.bold ? 700 : 400)}" font-style="${d.italic ? 'italic' : 'normal'}" fill="${d.color}" text-anchor="${d.align === 'center' ? 'middle' : d.align === 'right' ? 'end' : 'start'}" transform="rotate(${obj.rotation} ${obj.x + obj.width / 2} ${obj.y + obj.height / 2})">${esc(d.text)}</text>`;
    }
    if (obj.type === 'note') {
      return `<g transform="rotate(${obj.rotation} ${obj.x + obj.width / 2} ${obj.y + obj.height / 2})"><rect x="${obj.x}" y="${obj.y}" width="${obj.width}" height="${obj.height}" rx="10" fill="${obj.data.color}"/><text x="${obj.x + 14}" y="${obj.y + 28}" font-family="sans-serif" font-size="18" fill="#392F34">${esc(obj.data.text)}</text></g>`;
    }
    if (obj.type === 'sticker') {
      return `<text x="${obj.x + obj.width / 2}" y="${obj.y + obj.height * 0.72}" text-anchor="middle" font-size="${Math.max(22, obj.height * 0.68)}">${esc(obj.data.symbol)}</text>`;
    }
    if (obj.type === 'drawing') {
      return `<path d="${esc(obj.data.path)}" transform="translate(${obj.x} ${obj.y})" fill="none" stroke="${obj.data.stroke}" stroke-width="${obj.data.strokeWidth}" stroke-linecap="${obj.data.lineCap}" stroke-linejoin="${obj.data.linejoin || 'round'}" opacity="${obj.data.opacity}"/>`;
    }
    if (obj.type === 'image') {
      const filter = obj.data.filter === 'grayscale' ? 'filter="grayscale(1)"' : '';
      return `<image href="${esc(obj.data.src)}" x="${obj.x}" y="${obj.y}" width="${obj.width}" height="${obj.height}" preserveAspectRatio="xMidYMid slice" opacity="${obj.data.opacity ?? 1}" ${filter}/>`;
    }
    if (obj.type === 'shape') return shapeSvg(obj);
    return '';
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#D78C9F"/></marker></defs><rect width="100%" height="100%" fill="${background}"/>${body}</svg>`;
}

export async function svgToImageData(svg: string, width: number, height: number): Promise<ImageData> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = 'async';
    const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Could not render GIF frame'));
    });
    image.src = url;
    await loaded;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D context is unavailable');
    ctx.drawImage(image, 0, 0, width, height);
    return ctx.getImageData(0, 0, width, height);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}
