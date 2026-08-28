import { useCallback, useRef } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import type { CanvasObject } from '../types';

type DragMode = 'move' | 'resize' | 'rotate';

interface GestureState {
  mode: DragMode;
  objectId: string;
  startPointerX: number;
  startPointerY: number;
  startObj: { x: number; y: number; width: number; height: number; rotation: number };
  zoom: number;
  handle?: string; // for resize: 'se' | 'sw' | 'ne' | 'nw' | 'e' | 'w' | 'n' | 's'
  centerX?: number;
  centerY?: number;
}

/**
 * Handles pointer-driven move/resize/rotate of a single canvas object node.
 * Applies transform directly to the DOM node during the gesture (no React
 * re-render per pointermove), then commits the final value to the store
 * once on pointerup — matching the perf requirement to avoid re-rendering
 * on every stroke/drag frame.
 */
export function useObjectGesture() {
  const gesture = useRef<GestureState | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const rafId = useRef<number | null>(null);
  const pending = useRef<{ x: number; y: number; width: number; height: number; rotation: number } | null>(null);

  const flush = useCallback(() => {
    rafId.current = null;
    const node = nodeRef.current;
    const val = pending.current;
    if (!node || !val) return;
    node.style.left = `${val.x}px`;
    node.style.top = `${val.y}px`;
    node.style.width = `${val.width}px`;
    node.style.height = `${val.height}px`;
    node.style.transform = `rotate(${val.rotation}deg)`;
  }, []);

  const scheduleApply = useCallback(
    (val: { x: number; y: number; width: number; height: number; rotation: number }) => {
      pending.current = val;
      if (rafId.current == null) {
        rafId.current = requestAnimationFrame(flush);
      }
    },
    [flush],
  );

  const startMove = useCallback(
    (e: React.PointerEvent, obj: CanvasObject, node: HTMLDivElement, zoom: number) => {
      if (obj.locked) return;
      nodeRef.current = node;
      gesture.current = {
        mode: 'move',
        objectId: obj.id,
        startPointerX: e.clientX,
        startPointerY: e.clientY,
        startObj: { x: obj.x, y: obj.y, width: obj.width, height: obj.height, rotation: obj.rotation },
        zoom,
      };
      node.setPointerCapture(e.pointerId);
    },
    [],
  );

  const startResize = useCallback(
    (e: React.PointerEvent, obj: CanvasObject, node: HTMLDivElement, zoom: number, handle: string) => {
      if (obj.locked) return;
      e.stopPropagation();
      nodeRef.current = node;
      gesture.current = {
        mode: 'resize',
        objectId: obj.id,
        startPointerX: e.clientX,
        startPointerY: e.clientY,
        startObj: { x: obj.x, y: obj.y, width: obj.width, height: obj.height, rotation: obj.rotation },
        zoom,
        handle,
      };
      node.setPointerCapture(e.pointerId);
    },
    [],
  );

  const startRotate = useCallback(
    (e: React.PointerEvent, obj: CanvasObject, node: HTMLDivElement) => {
      if (obj.locked) return;
      e.stopPropagation();
      nodeRef.current = node;
      const centerX = obj.x + obj.width / 2;
      const centerY = obj.y + obj.height / 2;
      gesture.current = {
        mode: 'rotate',
        objectId: obj.id,
        startPointerX: e.clientX,
        startPointerY: e.clientY,
        startObj: { x: obj.x, y: obj.y, width: obj.width, height: obj.height, rotation: obj.rotation },
        zoom: 1,
        centerX,
        centerY,
      };
      node.setPointerCapture(e.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent, worldPointerPos?: { x: number; y: number }) => {
      const g = gesture.current;
      if (!g) return;

      if (g.mode === 'move') {
        const rawDx = (e.clientX - g.startPointerX) / g.zoom;
        const rawDy = (e.clientY - g.startPointerY) / g.zoom;
        let targetX = g.startObj.x + rawDx;
        let targetY = g.startObj.y + rawDy;

        // Smart snapping against other canvas objects (tolerance: 6px)
        const doc = useCanvasStore.getState().doc;
        if (doc) {
          const SNAP_THRESHOLD = 6;
          const currentW = g.startObj.width;
          const currentH = g.startObj.height;
          const currentCenterX = targetX + currentW / 2;
          const currentCenterY = targetY + currentH / 2;
          const currentRight = targetX + currentW;
          const currentBottom = targetY + currentH;

          for (const otherId of doc.objectOrder) {
            if (otherId === g.objectId) continue;
            const other = doc.objects[otherId];
            if (!other || other.hidden) continue;

            const otherCenterX = other.x + other.width / 2;
            const otherCenterY = other.y + other.height / 2;
            const otherRight = other.x + other.width;
            const otherBottom = other.y + other.height;

            // X-axis snapping
            if (Math.abs(targetX - other.x) < SNAP_THRESHOLD) {
              targetX = other.x;
            } else if (Math.abs(currentCenterX - otherCenterX) < SNAP_THRESHOLD) {
              targetX = otherCenterX - currentW / 2;
            } else if (Math.abs(currentRight - otherRight) < SNAP_THRESHOLD) {
              targetX = otherRight - currentW;
            }

            // Y-axis snapping
            if (Math.abs(targetY - other.y) < SNAP_THRESHOLD) {
              targetY = other.y;
            } else if (Math.abs(currentCenterY - otherCenterY) < SNAP_THRESHOLD) {
              targetY = otherCenterY - currentH / 2;
            } else if (Math.abs(currentBottom - otherBottom) < SNAP_THRESHOLD) {
              targetY = otherBottom - currentH;
            }
          }
        }

        scheduleApply({
          x: targetX,
          y: targetY,
          width: g.startObj.width,
          height: g.startObj.height,
          rotation: g.startObj.rotation,
        });
      } else if (g.mode === 'resize') {

        const dx = (e.clientX - g.startPointerX) / g.zoom;
        const dy = (e.clientY - g.startPointerY) / g.zoom;
        let { x, y, width, height } = g.startObj;
        const h = g.handle ?? 'se';
        if (h.includes('e')) width = Math.max(40, g.startObj.width + dx);
        if (h.includes('s')) height = Math.max(40, g.startObj.height + dy);
        if (h.includes('w')) {
          width = Math.max(40, g.startObj.width - dx);
          x = g.startObj.x + (g.startObj.width - width);
        }
        if (h.includes('n')) {
          height = Math.max(40, g.startObj.height - dy);
          y = g.startObj.y + (g.startObj.height - height);
        }
        scheduleApply({ x, y, width, height, rotation: g.startObj.rotation });
      } else if (g.mode === 'rotate' && worldPointerPos && g.centerX != null && g.centerY != null) {
        const angle =
          (Math.atan2(worldPointerPos.y - g.centerY, worldPointerPos.x - g.centerX) * 180) / Math.PI + 90;
        scheduleApply({
          x: g.startObj.x,
          y: g.startObj.y,
          width: g.startObj.width,
          height: g.startObj.height,
          rotation: Math.round(angle),
        });
      }
    },
    [scheduleApply],
  );

  const onPointerUp = useCallback(() => {
    const g = gesture.current;
    if (!g) return;
    if (rafId.current != null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    if (pending.current) {
      useCanvasStore.getState().updateObject(g.objectId, {
        x: pending.current.x,
        y: pending.current.y,
        width: pending.current.width,
        height: pending.current.height,
        rotation: pending.current.rotation,
      });
    }
    gesture.current = null;
    nodeRef.current = null;
    pending.current = null;
  }, []);

  const isDragging = useCallback(() => gesture.current != null, []);

  return { startMove, startResize, startRotate, onPointerMove, onPointerUp, isDragging };
}
