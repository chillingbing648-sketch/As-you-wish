import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { useCamera } from './useCamera';
import { useObjectGesture } from './useObjectGesture';
import { CanvasObjectNode } from './CanvasObjectNode';
import type { CanvasObject } from '../types';

interface MarqueeState {
  startX: number; // screen coords
  startY: number;
  x: number;
  y: number;
  w: number;
  h: number;
  additive: boolean;
}

function pointsToPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

export function Canvas() {
  const doc = useCanvasStore((s) => s.doc);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const setSelection = useCanvasStore((s) => s.setSelection);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const addObject = useCanvasStore((s) => s.addObject);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setTool = useCanvasStore((s) => s.setTool);
  const drawSettings = useCanvasStore((s) => s.drawSettings);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const { camera, init, panBy, zoomAt, setZoom, screenToWorld, fitToObjects, subscribeZoom } = useCamera(worldRef);
  const gesture = useObjectGesture();

  const [marquee, setMarquee] = useState<MarqueeState | null>(null);
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const spacePressed = useRef(false);
  const pinchState = useRef<{ dist: number; centerX: number; centerY: number } | null>(null);
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());

  // Freehand drawing state lives entirely in refs. Points accumulate as the
  // stylus/finger/mouse moves, but the SVG <path> element is only touched
  // via a rAF-batched setAttribute — never React state — so a fast stylus
  // stream never triggers a React render mid-stroke. The stroke becomes a
  // single CanvasObject (one store write, one persistence write) on lift.
  const drawingPathRef = useRef<SVGPathElement | null>(null);
  const drawingPoints = useRef<{ x: number; y: number }[]>([]);
  const drawingBounds = useRef({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  const drawingPointerId = useRef<number | null>(null);
  const drawingRaf = useRef<number | null>(null);

  const flushDrawingPath = useCallback(() => {
    drawingRaf.current = null;
    if (drawingPathRef.current) {
      drawingPathRef.current.setAttribute('d', pointsToPath(drawingPoints.current));
    }
  }, []);

  const scheduleDrawingFlush = useCallback(() => {
    if (drawingRaf.current == null) {
      drawingRaf.current = requestAnimationFrame(flushDrawingPath);
    }
  }, [flushDrawingPath]);

  // Initialize camera from doc once on load
  const initializedFor = useRef<string | null>(null);
  useEffect(() => {
    if (doc && initializedFor.current !== doc.id) {
      init(doc.camera);
      initializedFor.current = doc.id;
    }
  }, [doc, init]);

  // Keyboard: space to pan, delete to remove, escape to deselect
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isEditingText = active && active.getAttribute('contenteditable') === 'true';
      if (isEditingText) return;

      if (e.code === 'Space') spacePressed.current = true;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        e.preventDefault();
        useCanvasStore.getState().deleteObjects(selectedIds);
      }
      if (e.key === 'Escape') {
        clearSelection();
        if (activeTool === 'draw') setTool('select');
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedIds.length > 0) {
        e.preventDefault();
        const currentDoc = useCanvasStore.getState().doc;
        if (!currentDoc) return;
        selectedIds.forEach((id) => {
          const src = currentDoc.objects[id];
          if (!src) return;
          const copy: CanvasObject = {
            ...src,
            id: crypto.randomUUID(),
            x: src.x + 24,
            y: src.y + 24,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          addObject(copy);
        });
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') spacePressed.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [selectedIds, clearSelection, addObject, activeTool, setTool]);

  // Wheel: zoom (ctrl/cmd + wheel or pinch trackpad) / pan (plain wheel)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const rect = viewportRef.current?.getBoundingClientRect();
      const px = e.clientX - (rect?.left ?? 0);
      const py = e.clientY - (rect?.top ?? 0);
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(-e.deltaY * 0.01);
        zoomAt(px, py, factor);
      } else {
        panBy(-e.deltaX, -e.deltaY);
      }
    },
    [zoomAt, panBy],
  );

  const handleViewportPointerDown = useCallback(
    (e: React.PointerEvent) => {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Drawing tool takes priority over pan/select while active, and only
      // tracks a single contact point (a second finger while drawing pans
      // instead, handled by the two-pointer branch below on the next move).
      if (activeTool === 'draw' && e.button === 0 && activePointers.current.size === 1) {
        const rect = viewportRef.current?.getBoundingClientRect();
        const p = screenToWorld(e.clientX - (rect?.left ?? 0), e.clientY - (rect?.top ?? 0));
        drawingPoints.current = [p];
        drawingBounds.current = { minX: p.x, minY: p.y, maxX: p.x, maxY: p.y };
        drawingPointerId.current = e.pointerId;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      if (activePointers.current.size === 2) {
        const pts = Array.from(activePointers.current.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchState.current = {
          dist,
          centerX: (pts[0].x + pts[1].x) / 2,
          centerY: (pts[0].y + pts[1].y) / 2,
        };
        isPanning.current = false;
        setMarquee(null);
        return;
      }

      const target = e.target as HTMLElement;
      const isBackground =
        target === viewportRef.current || target === worldRef.current || target.dataset.canvasBg === 'true';
      if (!isBackground) return;

      if (spacePressed.current || e.button === 1 || e.pointerType === 'touch') {
        isPanning.current = true;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
        return;
      }

      // Start marquee selection
      const rect = viewportRef.current?.getBoundingClientRect();
      const x = e.clientX - (rect?.left ?? 0);
      const y = e.clientY - (rect?.top ?? 0);
      setMarquee({ startX: x, startY: y, x, y, w: 0, h: 0, additive: e.shiftKey });
    },
    [activeTool, screenToWorld],
  );

  const handleViewportPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (activePointers.current.has(e.pointerId)) {
        activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      if (activeTool === 'draw' && drawingPointerId.current === e.pointerId) {
        const rect = viewportRef.current?.getBoundingClientRect();
        const p = screenToWorld(e.clientX - (rect?.left ?? 0), e.clientY - (rect?.top ?? 0));
        const last = drawingPoints.current[drawingPoints.current.length - 1];
        // Skip near-duplicate points (sub-pixel jitter) to keep the path
        // string small without any visible loss of stroke fidelity.
        if (!last || Math.hypot(p.x - last.x, p.y - last.y) >= 1.2) {
          drawingPoints.current.push(p);
          drawingBounds.current.minX = Math.min(drawingBounds.current.minX, p.x);
          drawingBounds.current.minY = Math.min(drawingBounds.current.minY, p.y);
          drawingBounds.current.maxX = Math.max(drawingBounds.current.maxX, p.x);
          drawingBounds.current.maxY = Math.max(drawingBounds.current.maxY, p.y);
          scheduleDrawingFlush();
        }
        return;
      }

      if (activePointers.current.size === 2 && pinchState.current) {
        const pts = Array.from(activePointers.current.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const centerX = (pts[0].x + pts[1].x) / 2;
        const centerY = (pts[0].y + pts[1].y) / 2;
        const rect = viewportRef.current?.getBoundingClientRect();
        const factor = dist / pinchState.current.dist;
        zoomAt(centerX - (rect?.left ?? 0), centerY - (rect?.top ?? 0), factor);
        panBy(centerX - pinchState.current.centerX, centerY - pinchState.current.centerY);
        pinchState.current = { dist, centerX, centerY };
        return;
      }

      if (isPanning.current) {
        const dx = e.clientX - lastPanPos.current.x;
        const dy = e.clientY - lastPanPos.current.y;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
        panBy(dx, dy);
        return;
      }

      if (marquee) {
        const rect = viewportRef.current?.getBoundingClientRect();
        const x = e.clientX - (rect?.left ?? 0);
        const y = e.clientY - (rect?.top ?? 0);
        setMarquee((m) =>
          m
            ? {
                ...m,
                x: Math.min(m.startX, x),
                y: Math.min(m.startY, y),
                w: Math.abs(x - m.startX),
                h: Math.abs(y - m.startY),
              }
            : m,
        );
        return;
      }

      // Object gesture handles its own move via bubbling from object nodes,
      // but we forward here too in case pointer moved off the node.
      gesture.onPointerMove(e, screenToWorld(e.clientX, e.clientY));
    },
    [marquee, gesture, panBy, zoomAt, screenToWorld, activeTool, scheduleDrawingFlush],
  );

  const finishMarquee = useCallback(() => {
    if (!marquee || !doc) return;
    // Convert screen-space marquee rect to world space using camera
    const topLeft = screenToWorld(marquee.x, marquee.y);
    const bottomRight = screenToWorld(marquee.x + marquee.w, marquee.y + marquee.h);

    const hits = Object.values(doc.objects).filter((o) => {
      if (o.hidden) return false;
      return o.x < bottomRight.x && o.x + o.width > topLeft.x && o.y < bottomRight.y && o.y + o.height > topLeft.y;
    });

    if (marquee.w > 4 || marquee.h > 4) {
      const ids = hits.map((o) => o.id);
      if (marquee.additive) {
        setSelection(Array.from(new Set([...selectedIds, ...ids])));
      } else {
        setSelection(ids);
      }
    } else if (!marquee.additive) {
      clearSelection();
    }
    setMarquee(null);
  }, [marquee, doc, screenToWorld, selectedIds, setSelection, clearSelection]);

  const finishDrawing = useCallback(
    (pointerId: number) => {
      if (drawingRaf.current != null) {
        cancelAnimationFrame(drawingRaf.current);
        drawingRaf.current = null;
      }
      const points = drawingPoints.current;
      if (points.length > 1) {
        const b = drawingBounds.current;
        const pad = Math.max(8, drawSettings.strokeWidth);
        // Store the path in the object's own local coordinate space (offset
        // by its bounding box origin) so it resizes/rotates correctly through
        // the same handles every other object uses, with no special-casing.
        const localPoints = points.map((p) => ({ x: p.x - (b.minX - pad), y: p.y - (b.minY - pad) }));
        const path = pointsToPath(localPoints);
        addObject({
          id: crypto.randomUUID(),
          type: 'drawing',
          x: b.minX - pad,
          y: b.minY - pad,
          width: Math.max(2, b.maxX - b.minX + pad * 2),
          height: Math.max(2, b.maxY - b.minY + pad * 2),
          rotation: 0,
          zIndex: 0,
          locked: false,
          hidden: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          data: {
            path,
            stroke: drawSettings.stroke,
            strokeWidth: drawSettings.strokeWidth,
            opacity: drawSettings.opacity,
            lineCap: 'round',
          },
        });
      }
      drawingPoints.current = [];
      drawingPointerId.current = null;
      if (drawingPathRef.current) drawingPathRef.current.setAttribute('d', '');
      activePointers.current.delete(pointerId);
      isPanning.current = false;
    },
    [addObject, drawSettings],
  );

  const handleViewportPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (activeTool === 'draw' && drawingPointerId.current === e.pointerId) {
        finishDrawing(e.pointerId);
        return;
      }
      activePointers.current.delete(e.pointerId);
      if (activePointers.current.size < 2) pinchState.current = null;
      isPanning.current = false;
      if (marquee) finishMarquee();
      gesture.onPointerUp();
    },
    [marquee, finishMarquee, gesture, activeTool, finishDrawing],
  );

  const handleSelect = useCallback(
    (id: string, additive: boolean) => {
      if (additive) {
        const set = new Set(selectedIds);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        setSelection(Array.from(set));
      } else {
        setSelection([id]);
      }
    },
    [selectedIds, setSelection],
  );

  const handleFitAll = useCallback(() => {
    if (!doc || !viewportRef.current) return;
    const objs = Object.values(doc.objects).filter((o) => !o.hidden);
    if (objs.length === 0) {
      fitToObjects(null, viewportRef.current.clientWidth, viewportRef.current.clientHeight);
      return;
    }
    const bounds = objs.reduce(
      (acc, o) => ({
        minX: Math.min(acc.minX, o.x),
        minY: Math.min(acc.minY, o.y),
        maxX: Math.max(acc.maxX, o.x + o.width),
        maxY: Math.max(acc.maxY, o.y + o.height),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    );
    fitToObjects(bounds, viewportRef.current.clientWidth, viewportRef.current.clientHeight);
  }, [doc, fitToObjects]);

  // Expose imperative controls for the toolbar via window-scoped ref pattern
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__canvasControls = {
      zoomIn: () => {
        if (!viewportRef.current) return;
        const r = viewportRef.current.getBoundingClientRect();
        setZoom(camera.current.zoom * 1.2, r.width / 2, r.height / 2);
      },
      zoomOut: () => {
        if (!viewportRef.current) return;
        const r = viewportRef.current.getBoundingClientRect();
        setZoom(camera.current.zoom / 1.2, r.width / 2, r.height / 2);
      },
      resetZoom: () => {
        if (!viewportRef.current) return;
        const r = viewportRef.current.getBoundingClientRect();
        setZoom(1, r.width / 2, r.height / 2);
      },
      fitAll: handleFitAll,
      getZoom: () => camera.current.zoom,
      getViewportCenterWorld: () => {
        if (!viewportRef.current) return { x: 0, y: 0 };
        const r = viewportRef.current.getBoundingClientRect();
        return screenToWorld(r.width / 2, r.height / 2);
      },
      subscribeZoom,
    };
  }, [setZoom, handleFitAll, camera, screenToWorld, subscribeZoom]);

  if (!doc) return null;

  const sortedObjects = doc.objectOrder.map((id) => doc.objects[id]).filter(Boolean);
  const bgClass = `canvas-bg canvas-bg--${doc.background}`;

  return (
    <div
      ref={viewportRef}
      className={`canvas-viewport${activeTool === 'draw' ? ' is-drawing' : ''}`}
      onWheel={handleWheel}
      onPointerDown={handleViewportPointerDown}
      onPointerMove={handleViewportPointerMove}
      onPointerUp={handleViewportPointerUp}
      onPointerCancel={handleViewportPointerUp}
    >
      <div ref={worldRef} className="canvas-world" data-canvas-bg="true">
        <div className={bgClass} data-canvas-bg="true" />
        {sortedObjects.map((obj) => (
          <CanvasObjectNode
            key={obj.id}
            obj={obj}
            isSelected={selectedIds.includes(obj.id)}
            zoom={camera.current.zoom}
            onSelect={handleSelect}
            gesture={gesture}
            screenToWorld={screenToWorld}
          />
        ))}
        {activeTool === 'draw' && (
          <svg className="drawing-layer" width="12000" height="12000" style={{ left: -6000, top: -6000 }} aria-hidden="true">
            <path
              ref={drawingPathRef}
              d=""
              fill="none"
              stroke={drawSettings.stroke}
              strokeWidth={drawSettings.strokeWidth}
              strokeOpacity={drawSettings.opacity}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </div>

      {marquee && (
        <div className="marquee" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />
      )}
    </div>
  );
}
