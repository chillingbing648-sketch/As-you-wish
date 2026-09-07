import { useEffect, useState } from 'react';
import { getGif } from '../lib/db';
import type { GifObjectData } from '../types';

export function GifCanvasObject({ data }: { data: GifObjectData }) {
  const [src, setSrc] = useState(data.src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    const hydrate = async () => {
      if (!data.gifId) return;
      try {
        const stored = await getGif(data.gifId);
        if (!active || !stored) return;
        if (stored.blob) {
          objectUrl = URL.createObjectURL(stored.blob);
          setSrc(objectUrl);
          return;
        }
        if (stored.sourceUrl) setSrc(stored.sourceUrl);
      } catch {
        // Keep the persisted source as a fallback.
      }
    };

    hydrate();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [data.gifId, data.sourceUrl]);

  return (
    <div className="gif-canvas-object" aria-label={data.name || 'Animated GIF'}>
      {!failed ? (
        <img
          src={src || data.sourceUrl}
          alt={data.name || 'Animated GIF'}
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="gif-canvas-error">
          <span>🎞️</span>
          <small>GIF unavailable</small>
        </div>
      )}
      <span className="gif-canvas-badge">GIF</span>
    </div>
  );
}
