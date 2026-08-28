import { useCallback, useRef } from 'react';
import { useCanvasStore } from '../store/canvasStore';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

/**
 * Camera is applied imperatively to a ref'd DOM node during gestures
 * (wheel/pinch/pan) for 60fps interaction, and only synced to the
 * Zustand store (and thus persisted) once the gesture settles.
 * This avoids a React re-render on every wheel/touch event.
 */
type ZoomListener = (zoom: number) => void;

export function useCamera(worldRef: React.RefObject<HTMLDivElement | null>) {
  const camera = useRef({ x: 0, y: 0, zoom: 1 });
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zoomListeners = useRef<Set<ZoomListener>>(new Set());

  const applyTransform = useCallback(() => {
    const el = worldRef.current;
    if (!el) return;
    const { x, y, zoom } = camera.current;
    el.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
    zoomListeners.current.forEach((fn) => fn(zoom));
  }, [worldRef]);

  const subscribeZoom = useCallback((fn: ZoomListener) => {
    zoomListeners.current.add(fn);
    fn(camera.current.zoom);
    return () => {
      zoomListeners.current.delete(fn);
    };
  }, []);

  const commitToStore = useCallback(() => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => {
      useCanvasStore.getState().setCamera({ ...camera.current });
    }, 300);
  }, []);

  const init = useCallback(
    (initial: { x: number; y: number; zoom: number }) => {
      camera.current = { ...initial };
      applyTransform();
    },
    [applyTransform],
  );

  const panBy = useCallback(
    (dx: number, dy: number) => {
      camera.current.x += dx;
      camera.current.y += dy;
      applyTransform();
      commitToStore();
    },
    [applyTransform, commitToStore],
  );

  const zoomAt = useCallback(
    (screenX: number, screenY: number, factor: number) => {
      const { x, y, zoom } = camera.current;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor));
      const worldX = (screenX - x) / zoom;
      const worldY = (screenY - y) / zoom;
      camera.current = {
        x: screenX - worldX * newZoom,
        y: screenY - worldY * newZoom,
        zoom: newZoom,
      };
      applyTransform();
      commitToStore();
    },
    [applyTransform, commitToStore],
  );

  const setZoom = useCallback(
    (newZoom: number, centerX: number, centerY: number) => {
      const { x, y, zoom } = camera.current;
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
      const worldX = (centerX - x) / zoom;
      const worldY = (centerY - y) / zoom;
      camera.current = {
        x: centerX - worldX * clamped,
        y: centerY - worldY * clamped,
        zoom: clamped,
      };
      applyTransform();
      commitToStore();
    },
    [applyTransform, commitToStore],
  );

  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const { x, y, zoom } = camera.current;
    return { x: (screenX - x) / zoom, y: (screenY - y) / zoom };
  }, []);

  const fitToObjects = useCallback(
    (
      bounds: { minX: number; minY: number; maxX: number; maxY: number } | null,
      viewportW: number,
      viewportH: number,
    ) => {
      if (!bounds) {
        camera.current = { x: viewportW / 2, y: viewportH / 2, zoom: 1 };
        applyTransform();
        commitToStore();
        return;
      }
      const padding = 80;
      const w = bounds.maxX - bounds.minX + padding * 2;
      const h = bounds.maxY - bounds.minY + padding * 2;
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(viewportW / w, viewportH / h)));
      const cx = (bounds.minX + bounds.maxX) / 2;
      const cy = (bounds.minY + bounds.maxY) / 2;
      camera.current = {
        x: viewportW / 2 - cx * zoom,
        y: viewportH / 2 - cy * zoom,
        zoom,
      };
      applyTransform();
      commitToStore();
    },
    [applyTransform, commitToStore],
  );

  return { camera, init, panBy, zoomAt, setZoom, screenToWorld, fitToObjects, subscribeZoom };
}
