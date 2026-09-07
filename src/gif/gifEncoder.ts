type RGB = [number, number, number];

function buildPalette(): RGB[] {
  const palette: RGB[] = [];
  for (let r = 0; r < 8; r += 1) {
    for (let g = 0; g < 8; g += 1) {
      for (let b = 0; b < 4; b += 1) {
        palette.push([Math.round(r * 255 / 7), Math.round(g * 255 / 7), Math.round(b * 255 / 3)]);
      }
    }
  }
  return palette;
}

const PALETTE = buildPalette();

function nearestColorIndex(r: number, g: number, b: number): number {
  const ri = Math.min(7, Math.max(0, Math.round(r / 255 * 7)));
  const gi = Math.min(7, Math.max(0, Math.round(g / 255 * 7)));
  const bi = Math.min(3, Math.max(0, Math.round(b / 255 * 3)));
  return (ri * 8 + gi) * 4 + bi;
}

function lzwEncode(indices: Uint8Array): Uint8Array {
  const minCodeSize = 8;
  const clear = 1 << minCodeSize;
  const end = clear + 1;
  let nextCode = end + 1;
  let codeSize = minCodeSize + 1;
  const dict = new Map<string, number>();
  const codes: number[] = [clear];
  let phrase = '';

  const reset = () => {
    dict.clear();
    nextCode = end + 1;
    codeSize = minCodeSize + 1;
  };

  reset();
  for (let i = 0; i < indices.length; i += 1) {
    const k = String(indices[i]);
    const candidate = phrase ? `${phrase},${k}` : k;
    if (dict.has(candidate)) {
      phrase = candidate;
      continue;
    }

    if (phrase) codes.push(Number(phrase.split(',')[0]));
    if (nextCode < 4096) {
      dict.set(candidate, nextCode);
      nextCode += 1;
      if (nextCode === (1 << codeSize) && codeSize < 12) codeSize += 1;
    } else {
      codes.push(clear);
      reset();
    }
    phrase = k;
  }
  if (phrase) codes.push(Number(phrase.split(',')[0]));
  codes.push(end);

  // Re-emit using the same dictionary-growth schedule.
  const bytes: number[] = [];
  let bitBuffer = 0;
  let bitCount = 0;
  reset();
  let previous = -1;
  let codeIndex = 0;
  const emit = (value: number, bits: number) => {
    bitBuffer |= value << bitCount;
    bitCount += bits;
    while (bitCount >= 8) {
      bytes.push(bitBuffer & 255);
      bitBuffer >>>= 8;
      bitCount -= 8;
    }
  };

  emit(clear, codeSize);
  for (let i = 0; i < indices.length; i += 1) {
    const current = indices[i];
    if (previous === -1) {
      emit(current, codeSize);
      previous = current;
      continue;
    }
    const key = `${previous},${current}`;
    if (dict.has(key)) {
      previous = dict.get(key)!;
      continue;
    }
    emit(previous, codeSize);
    if (nextCode < 4096) {
      dict.set(key, nextCode);
      nextCode += 1;
      if (nextCode === (1 << codeSize) && codeSize < 12) codeSize += 1;
    } else {
      emit(clear, codeSize);
      reset();
    }
    previous = current;
    codeIndex += 1;
  }
  if (previous !== -1) emit(previous, codeSize);
  emit(end, codeSize);
  if (bitCount) bytes.push(bitBuffer & 255);

  void codeIndex;
  const out = new Uint8Array(bytes.length + 1);
  out[0] = minCodeSize;
  out.set(bytes, 1);
  return out;
}

function subBlocks(data: Uint8Array): Uint8Array {
  const result: number[] = [];
  let offset = 0;
  while (offset < data.length) {
    const size = Math.min(255, data.length - offset);
    result.push(size);
    for (let i = 0; i < size; i += 1) result.push(data[offset + i]);
    offset += size;
  }
  result.push(0);
  return Uint8Array.from(result);
}

function u16(n: number): [number, number] {
  return [n & 255, (n >>> 8) & 255];
}

export function encodeGif(frames: ImageData[], durations: number[], loop = true): Blob {
  if (!frames.length) throw new Error('At least one GIF frame is required');
  const width = frames[0].width;
  const height = frames[0].height;
  if (width > 800 || height > 800) throw new Error('GIF dimensions are limited to 800×800');

  const bytes: number[] = [];
  const push = (...values: number[]) => bytes.push(...values);
  const paletteBytes: number[] = [];
  for (const [r, g, b] of PALETTE) paletteBytes.push(r, g, b);

  for (const c of new TextEncoder().encode('GIF89a')) push(c);
  const [w0, w1] = u16(width); const [h0, h1] = u16(height);
  push(w0, w1, h0, h1, 0xF7, 0x00, 0x00);
  push(...paletteBytes);

  if (loop) {
    push(0x21, 0xFF, 0x0B);
    push(...Array.from(new TextEncoder().encode('NETSCAPE2.0')));
    push(0x03, 0x01, 0x00, 0x00, 0x00);
  }

  frames.forEach((frame, index) => {
    const indices = new Uint8Array(width * height);
    for (let i = 0; i < indices.length; i += 1) {
      const p = i * 4;
      const alpha = frame.data[p + 3];
      indices[i] = alpha < 16 ? 0 : nearestColorIndex(frame.data[p], frame.data[p + 1], frame.data[p + 2]);
    }
    const delayCs = Math.max(1, Math.round((durations[index] ?? 120) / 10));
    const [d0, d1] = u16(delayCs);
    push(0x21, 0xF9, 0x04, 0x00, d0, d1, 0x00, 0x00, 0x2C);
    push(0x00, 0x00, 0x00, 0x00, w0, w1, h0, h1, 0x00);
    const compressed = lzwEncode(indices);
    push(...subBlocks(compressed));
    void index;
  });

  push(0x3B);
  return new Blob([Uint8Array.from(bytes)], { type: 'image/gif' });
}
