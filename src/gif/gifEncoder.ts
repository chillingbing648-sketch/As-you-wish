type RGB = [number, number, number];

function buildPalette(): RGB[] {
  const palette: RGB[] = [];
  for (let r = 0; r < 8; r += 1) {
    for (let g = 0; g < 8; g += 1) {
      for (let b = 0; b < 4; b += 1) palette.push([Math.round(r * 255 / 7), Math.round(g * 255 / 7), Math.round(b * 255 / 3)]);
    }
  }
  return palette;
}

const PALETTE = buildPalette();

function nearestColorIndex(r: number, g: number, b: number): number {
  const ri = Math.min(7, Math.max(0, Math.round((r / 255) * 7)));
  const gi = Math.min(7, Math.max(0, Math.round((g / 255) * 7)));
  const bi = Math.min(3, Math.max(0, Math.round((b / 255) * 3)));
  return (ri * 8 + gi) * 4 + bi;
}

function lzwEncode(indices: Uint8Array): Uint8Array {
  const minCodeSize = 8;
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;
  let nextCode = endCode + 1;
  let codeSize = minCodeSize + 1;
  const dictionary = new Map<string, number>();
  const bytes: number[] = [];
  let bitBuffer = 0;
  let bitCount = 0;

  const emit = (code: number) => {
    bitBuffer |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      bytes.push(bitBuffer & 0xff);
      bitBuffer >>>= 8;
      bitCount -= 8;
    }
  };

  const reset = () => {
    dictionary.clear();
    nextCode = endCode + 1;
    codeSize = minCodeSize + 1;
  };

  emit(clearCode);
  reset();

  if (indices.length === 0) {
    emit(endCode);
    if (bitCount) bytes.push(bitBuffer & 0xff);
    return Uint8Array.from([minCodeSize, ...bytes]);
  }

  let phrase = indices[0];
  for (let i = 1; i < indices.length; i += 1) {
    const current = indices[i];
    const key = `${phrase},${current}`;
    const existing = dictionary.get(key);
    if (existing !== undefined) {
      phrase = existing;
      continue;
    }

    emit(phrase);

    if (nextCode < 4096) {
      dictionary.set(key, nextCode);
      nextCode += 1;
      if (nextCode === (1 << codeSize) && codeSize < 12) codeSize += 1;
    } else {
      emit(clearCode);
      reset();
    }
    phrase = current;
  }

  emit(phrase);
  emit(endCode);
  if (bitCount) bytes.push(bitBuffer & 0xff);
  return Uint8Array.from([minCodeSize, ...bytes]);
}

function subBlocks(data: Uint8Array): Uint8Array {
  const result: number[] = [];
  for (let offset = 0; offset < data.length;) {
    const size = Math.min(255, data.length - offset);
    result.push(size, ...data.slice(offset, offset + size));
    offset += size;
  }
  result.push(0);
  return Uint8Array.from(result);
}

function u16(value: number): [number, number] {
  return [value & 0xff, (value >>> 8) & 0xff];
}

export function encodeGif(frames: ImageData[], durations: number[], loop = true): Blob {
  if (!frames.length) throw new Error('At least one GIF frame is required');
  const width = frames[0].width;
  const height = frames[0].height;
  if (width < 1 || height < 1 || width > 800 || height > 800) throw new Error('GIF dimensions are limited to 800×800');

  const bytes: number[] = [];
  const push = (...values: number[]) => bytes.push(...values);
  push(...Array.from(new TextEncoder().encode('GIF89a')));

  const [w0, w1] = u16(width);
  const [h0, h1] = u16(height);
  // Global color table: 256 entries, 8-bit color resolution, unsorted.
  push(w0, w1, h0, h1, 0xF7, 0x00, 0x00);
  for (const [r, g, b] of PALETTE) push(r, g, b);

  if (loop) {
    push(0x21, 0xFF, 0x0B);
    push(...Array.from(new TextEncoder().encode('NETSCAPE2.0')));
    push(0x03, 0x01, 0x00, 0x00, 0x00);
  }

  frames.forEach((frame, index) => {
    if (frame.width !== width || frame.height !== height) throw new Error('All GIF frames must have identical dimensions');
    const indices = new Uint8Array(width * height);
    for (let i = 0; i < indices.length; i += 1) {
      const p = i * 4;
      indices[i] = frame.data[p + 3] < 16 ? 0 : nearestColorIndex(frame.data[p], frame.data[p + 1], frame.data[p + 2]);
    }

    const delay = Math.max(1, Math.min(65535, Math.round((durations[index] ?? 120) / 10)));
    const [d0, d1] = u16(delay);

    // Graphics Control Extension.
    push(0x21, 0xF9, 0x04, 0x00, d0, d1, 0x00, 0x00);
    // Image Descriptor: full-canvas, no local color table, non-interlaced.
    push(0x2C, 0x00, 0x00, 0x00, 0x00, w0, w1, h0, h1, 0x00);
    push(...subBlocks(lzwEncode(indices)));
  });

  push(0x3B);
  return new Blob([Uint8Array.from(bytes)], { type: 'image/gif' });
}
