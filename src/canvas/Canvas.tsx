import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { useCamera } from './useCamera';
import { useObjectGesture } from './useObjectGesture';
import { CanvasObjectNode } from './CanvasObjectNode';
import type { CanvasObject } from '../types';

interface MarqueeState {
  startX: number;
  startY: number;
  x: number;
  y: number;
  w: number;
  h: number;
  additive: boolean;
}

type Point = {
  x: number;
  y: number;
};

function pointsToPath(points: Point[]) {
  if (points.length === 0) return '';

  return points
    .map((point, index) => {
      return `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    })
    .join(' ');
}

function pointsToSmoothedPath(points: Point[]) {
  if (points.length <= 2) {
    return pointsToPath(points);
  }

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 1; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];

    const controlX = current.x;
    const controlY = current.y;

    const endX = (current.x + next.x) / 2;
    const endY = (current.y + next.y) / 2;

    path += ` Q ${controlX.toFixed(1)} ${controlY.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;
  }

  const last = points[points.length - 1];

  path += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;

  return path;
}

export function Canvas() {
  const doc = useCanvasStore((state) => state.doc);
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const setSelection = useCanvasStore((state) => state.setSelection);
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  const addObject = useCanvasStore((state) => state.addObject);
  const activeTool = useCanvasStore((state) => state.activeTool);
  const drawSettings = useCanvasStore((state) => state.drawSettings);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);

  const {
    camera,
    init,
    panBy,
    zoomAt,
    setZoom,
    screenToWorld,
    fitToObjects,
    subscribeZoom,
  } = useCamera(worldRef);

  const gesture = useObjectGesture();

  const [marquee, setMarquee] = useState<MarqueeState | null>(null);

  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const spacePressed = useRef(false);

  const pinchState = useRef<{
    dist: number;
    centerX: number;
    centerY: number;
  } | null>(null);

  const activePointers = useRef<Map<number, Point>>(new Map());

  /*
   * Drawing state intentionally lives in refs.
   *
   * A pointer/stylus can generate a very large number of move events.
   * Keeping these points outside React state prevents a React render for
   * every single movement.
   *
   * The preview SVG path is updated through requestAnimationFrame and
   * the completed stroke is committed to Zustand only once on pointer up.
   */
  const drawingPathRef = useRef<SVGPathElement | null>(null);
  const drawingPoints = useRef<Point[]>([]);
  const drawingBounds = useRef({
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
  });
  const drawingPointerId = useRef<number | null>(null);
  const drawingRaf = useRef<number | null>(null);

  const flushDrawingPath = useCallback(() => {
    drawingRaf.current = null;

    const pathElement = drawingPathRef.current;

    if (!pathElement) return;

    pathElement.setAttribute('d', pointsToPath(drawingPoints.current));
  }, []);

  const scheduleDrawingFlush = useCallback(() => {
    if (drawingRaf.current !== null) return;

    drawingRaf.current = requestAnimationFrame(flushDrawingPath);
  }, [flushDrawingPath]);

  /*
   * Initialize the camera once for each loaded document.
   */
  const initializedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!doc || initializedFor.current === doc.id) return;

    init(doc.camera);
    initializedFor.current = doc.id;
  }, [doc, init]);

  /*
   * Keyboard controls:
   * - Space: temporary pan modifier
   * - Delete / Backspace: delete selected objects
   * - Escape: clear selection
   * - Ctrl/Cmd + D: duplicate selected objects
   *
   * Important:
   * This effect deliberately does NOT modify activeTool.
   * Doodle mode is controlled by the toolbar/tool system and remains
   * active until another tool explicitly changes it.
   */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      const isEditingText =
        target &&
        (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        );

      if (isEditingText) return;

      if (event.code === 'Space') {
        spacePressed.current = true;
      }

      if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        selectedIds.length > 0
      ) {
        event.preventDefault();

        useCanvasStore.getState().deleteObjects(selectedIds);
      }

      if (event.key === 'Escape') {
        clearSelection();
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === 'd' &&
        selectedIds.length > 0
      ) {
        event.preventDefault();

        const currentDoc = useCanvasStore.getState().doc;

        if (!currentDoc) return;

        selectedIds.forEach((id) => {
          const source = currentDoc.objects[id];

          if (!source) return;

          const now = Date.now();

          const copy: CanvasObject = {
            ...source,
            id: crypto.randomUUID(),
            x: source.x + 24,
            y: source.y + 24,
            createdAt: now,
            updatedAt: now,
          };

          addObject(copy);
        });
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        spacePressed.current = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [selectedIds, clearSelection, addObject]);

  /*
   * Wheel:
   * - Ctrl/Cmd + wheel = zoom around cursor
   * - Normal wheel = pan
   */
  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault();

      const rect = viewportRef.current?.getBoundingClientRect();

      const pointerX = event.clientX - (rect?.left ?? 0);
      const pointerY = event.clientY - (rect?.top ?? 0);

      if (event.ctrlKey || event.metaKey) {
        const factor = Math.exp(-event.deltaY * 0.01);

        zoomAt(pointerX, pointerY, factor);
        return;
      }

      panBy(-event.deltaX, -event.deltaY);
    },
    [zoomAt, panBy],
  );

  /*
   * Pointer down is deliberately ordered:
   *
   * 1. Doodle
   * 2. Pinch
   * 3. Pan
   * 4. Marquee selection
   */
  const handleViewportPointerDown = useCallback(
    (event: React.PointerEvent) => {
      activePointers.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      /*
       * Doodle mode has priority over normal canvas interactions.
       *
       * Most importantly, we do NOT change activeTool here.
       * Once Doodle mode is selected, every new stroke starts here until
       * another tool explicitly changes activeTool.
       */
      if (
        activeTool === 'draw' &&
        event.button === 0 &&
        activePointers.current.size === 1
      ) {
        const rect = viewportRef.current?.getBoundingClientRect();

        const point = screenToWorld(
          event.clientX - (rect?.left ?? 0),
          event.clientY - (rect?.top ?? 0),
        );

        drawingPoints.current = [point];

        drawingBounds.current = {
          minX: point.x,
          minY: point.y,
          maxX: point.x,
          maxY: point.y,
        };

        drawingPointerId.current = event.pointerId;

        (event.currentTarget as HTMLElement).setPointerCapture(
          event.pointerId,
        );

        return;
      }

      /*
       * Two pointers = pinch zoom.
       */
      if (activePointers.current.size === 2) {
        const points = Array.from(activePointers.current.values());

        const distance = Math.hypot(
          points[0].x - points[1].x,
          points[0].y - points[1].y,
        );

        pinchState.current = {
          dist: distance,
          centerX: (points[0].x + points[1].x) / 2,
          centerY: (points[0].y + points[1].y) / 2,
        };

        isPanning.current = false;
        setMarquee(null);

        return;
      }

      const target = event.target as HTMLElement;

      const isBackground =
        target === viewportRef.current ||
        target === worldRef.current ||
        target.dataset.canvasBg === 'true';

      if (!isBackground) return;

      /*
       * Pan:
       * - Space + left click
       * - Middle mouse
       * - Touch
       */
      if (
        spacePressed.current ||
        event.button === 1 ||
        event.pointerType === 'touch'
      ) {
        isPanning.current = true;

        lastPanPos.current = {
          x: event.clientX,
          y: event.clientY,
        };

        return;
      }

      /*
       * Otherwise begin marquee selection.
       */
      const rect = viewportRef.current?.getBoundingClientRect();

      const x = event.clientX - (rect?.left ?? 0);
      const y = event.clientY - (rect?.top ?? 0);

      setMarquee({
        startX: x,
        startY: y,
        x,
        y,
        w: 0,
        h: 0,
        additive: event.shiftKey,
      });
    },
    [activeTool, screenToWorld],
  );

  const handleViewportPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (activePointers.current.has(event.pointerId)) {
        activePointers.current.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
        });
      }

      /*
       * Active doodle stroke.
       */
      if (
        activeTool === 'draw' &&
        drawingPointerId.current === event.pointerId
      ) {
        const rect = viewportRef.current?.getBoundingClientRect();

        const point = screenToWorld(
          event.clientX - (rect?.left ?? 0),
          event.clientY - (rect?.top ?? 0),
        );

        const lastPoint =
          drawingPoints.current[drawingPoints.current.length - 1];

        /*
         * Ignore extremely small movements to prevent unnecessary path
         * growth from pointer/stylus jitter.
         */
        if (
          !lastPoint ||
          Math.hypot(
            point.x - lastPoint.x,
            point.y - lastPoint.y,
          ) >= 1.2
        ) {
          drawingPoints.current.push(point);

          drawingBounds.current.minX = Math.min(
            drawingBounds.current.minX,
            point.x,
          );

          drawingBounds.current.minY = Math.min(
            drawingBounds.current.minY,
            point.y,
          );

          drawingBounds.current.maxX = Math.max(
            drawingBounds.current.maxX,
            point.x,
          );

          drawingBounds.current.maxY = Math.max(
            drawingBounds.current.maxY,
            point.y,
          );

          scheduleDrawingFlush();
        }

        return;
      }

      /*
       * Pinch zoom + pan.
       */
      if (
        activePointers.current.size === 2 &&
        pinchState.current
      ) {
        const points = Array.from(activePointers.current.values());

        const distance = Math.hypot(
          points[0].x - points[1].x,
          points[0].y - points[1].y,
        );

        const centerX = (points[0].x + points[1].x) / 2;
        const centerY = (points[0].y + points[1].y) / 2;

        const rect = viewportRef.current?.getBoundingClientRect();

        const factor = distance / pinchState.current.dist;

        zoomAt(
          centerX - (rect?.left ?? 0),
          centerY - (rect?.top ?? 0),
          factor,
        );

        panBy(
          centerX - pinchState.current.centerX,
          centerY - pinchState.current.centerY,
        );

        pinchState.current = {
          dist: distance,
          centerX,
          centerY,
        };

        return;
      }

      /*
       * Canvas pan.
       */
      if (isPanning.current) {
        const deltaX = event.clientX - lastPanPos.current.x;
        const deltaY = event.clientY - lastPanPos.current.y;

        lastPanPos.current = {
          x: event.clientX,
          y: event.clientY,
        };

        panBy(deltaX, deltaY);

        return;
      }

      /*
       * Marquee selection.
       */
      if (marquee) {
        const rect = viewportRef.current?.getBoundingClientRect();

        const x = event.clientX - (rect?.left ?? 0);
        const y = event.clientY - (rect?.top ?? 0);

        setMarquee((current) => {
          if (!current) return current;

          return {
            ...current,
            x: Math.min(current.startX, x),
            y: Math.min(current.startY, y),
            w: Math.abs(x - current.startX),
            h: Math.abs(y - current.startY),
          };
        });

        return;
      }

      /*
       * Object gestures.
       */
      gesture.onPointerMove(
        event,
        screenToWorld(event.clientX, event.clientY),
      );
    },
    [
      marquee,
      gesture,
      panBy,
      zoomAt,
      screenToWorld,
      activeTool,
      scheduleDrawingFlush,
    ],
  );

  /*
   * Finish marquee selection.
   */
  const finishMarquee = useCallback(() => {
    if (!marquee || !doc) return;

    const topLeft = screenToWorld(
      marquee.x,
      marquee.y,
    );

    const bottomRight = screenToWorld(
      marquee.x + marquee.w,
      marquee.y + marquee.h,
    );

    const hits = Object.values(doc.objects).filter((object) => {
      if (object.hidden) return false;

      return (
        object.x < bottomRight.x &&
        object.x + object.width > topLeft.x &&
        object.y < bottomRight.y &&
        object.y + object.height > topLeft.y
      );
    });

    if (marquee.w > 4 || marquee.h > 4) {
      const ids = hits.map((object) => object.id);

      if (marquee.additive) {
        setSelection(
          Array.from(
            new Set([
              ...selectedIds,
              ...ids,
            ]),
          ),
        );
      } else {
        setSelection(ids);
      }
    } else if (!marquee.additive) {
      clearSelection();
    }

    setMarquee(null);
  }, [
    marquee,
    doc,
    screenToWorld,
    selectedIds,
    setSelection,
    clearSelection,
  ]);

  /*
   * Commit a completed drawing stroke.
   *
   * The important part:
   * We never change activeTool here.
   *
   * Therefore completing a stroke does NOT kick the user back into
   * Select/Text mode.
   */
  const finishDrawing = useCallback(
    (pointerId: number) => {
      if (drawingRaf.current !== null) {
        cancelAnimationFrame(drawingRaf.current);
        drawingRaf.current = null;
      }

      const points = drawingPoints.current;

      /*
       * Eraser mode.
       */
      if (
        drawSettings.tool === 'eraser' &&
        points.length > 0 &&
        doc
      ) {
        const hitDrawingIds: string[] = [];

        const padding = Math.max(
          12,
          drawSettings.strokeWidth,
        );

        Object.values(doc.objects).forEach((object) => {
          if (
            object.type !== 'drawing' ||
            object.locked ||
            object.hidden
          ) {
            return;
          }

          const isHit = points.some(
            (point) =>
              point.x >= object.x - padding &&
              point.x <= object.x + object.width + padding &&
              point.y >= object.y - padding &&
              point.y <= object.y + object.height + padding,
          );

          if (isHit) {
            hitDrawingIds.push(object.id);
          }
        });

        if (hitDrawingIds.length > 0) {
          useCanvasStore
            .getState()
            .deleteObjects(hitDrawingIds);
        }
      } else if (points.length > 1) {
        /*
         * Normal drawing.
         */
        const bounds = drawingBounds.current;

        const padding = Math.max(
          8,
          drawSettings.strokeWidth,
        );

        const localPoints = points.map((point) => ({
          x: point.x - (bounds.minX - padding),
          y: point.y - (bounds.minY - padding),
        }));

        const path = drawSettings.smoothing
          ? pointsToSmoothedPath(localPoints)
          : pointsToPath(localPoints);

        const lineCap =
          drawSettings.tool === 'fountain' ||
          drawSettings.tool === 'highlighter'
            ? 'square'
            : 'round';

        const linejoin =
          drawSettings.tool === 'highlighter'
            ? 'miter'
            : 'round';

        const now = Date.now();

        addObject({
          id: crypto.randomUUID(),
          type: 'drawing',

          x: bounds.minX - padding,
          y: bounds.minY - padding,

          width: Math.max(
            2,
            bounds.maxX - bounds.minX + padding * 2,
          ),

          height: Math.max(
            2,
            bounds.maxY - bounds.minY + padding * 2,
          ),

          rotation: 0,
          zIndex: 0,

          locked: false,
          hidden: false,

          createdAt: now,
          updatedAt: now,

          data: {
            path,
            stroke: drawSettings.stroke,
            strokeWidth: drawSettings.strokeWidth,
            opacity: drawSettings.opacity,
            lineCap,
            drawTool: drawSettings.tool,
            linejoin,
          },
        });
      }

      /*
       * Reset only the temporary stroke state.
       *
       * activeTool intentionally remains 'draw'.
       */
      drawingPoints.current = [];
      drawingPointerId.current = null;

      if (drawingPathRef.current) {
        drawingPathRef.current.setAttribute('d', '');
      }

      activePointers.current.delete(pointerId);

      isPanning.current = false;
    },
    [addObject, drawSettings, doc],
  );

  const handleViewportPointerUp = useCallback(
    (event: React.PointerEvent) => {
      /*
       * Finish the current doodle stroke.
       *
       * No setTool() call is made here.
       */
      if (
        activeTool === 'draw' &&
        drawingPointerId.current === event.pointerId
      ) {
        finishDrawing(event.pointerId);
        return;
      }

      activePointers.current.delete(event.pointerId);

      if (activePointers.current.size < 2) {
        pinchState.current = null;
      }

      isPanning.current = false;

      if (marquee) {
        finishMarquee();
      }

      gesture.onPointerUp();
    },
    [
      marquee,
      finishMarquee,
      gesture,
      activeTool,
      finishDrawing,
    ],
  );

  /*
   * Select/toggle an object.
   */
  const handleSelect = useCallback(
    (id: string, additive: boolean) => {
      if (additive) {
        const selection = new Set(selectedIds);

        if (selection.has(id)) {
          selection.delete(id);
        } else {
          selection.add(id);
        }

        setSelection(Array.from(selection));
        return;
      }

      setSelection([id]);
    },
    [selectedIds, setSelection],
  );

  /*
   * Fit all visible objects into the viewport.
   */
  const handleFitAll = useCallback(() => {
    if (!doc || !viewportRef.current) return;

    const objects = Object.values(doc.objects).filter(
      (object) => !object.hidden,
    );

    if (objects.length === 0) {
      fitToObjects(
        null,
        viewportRef.current.clientWidth,
        viewportRef.current.clientHeight,
      );

      return;
    }

    const bounds = objects.reduce(
      (result, object) => ({
        minX: Math.min(result.minX, object.x),
        minY: Math.min(result.minY, object.y),
        maxX: Math.max(
          result.maxX,
          object.x + object.width,
        ),
        maxY: Math.max(
          result.maxY,
          object.y + object.height,
        ),
      }),
      {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
      },
    );

    fitToObjects(
      bounds,
      viewportRef.current.clientWidth,
      viewportRef.current.clientHeight,
    );
  }, [doc, fitToObjects]);

  /*
   * Expose canvas controls to the existing toolbar.
   *
   * This preserves the current application's window-scoped integration
   * instead of introducing another state-management layer.
   */
  useEffect(() => {
    (
      window as unknown as Record<string, unknown>
    ).__canvasControls = {
      zoomIn: () => {
        if (!viewportRef.current) return;

        const rect =
          viewportRef.current.getBoundingClientRect();

        setZoom(
          camera.current.zoom * 1.2,
          rect.width / 2,
          rect.height / 2,
        );
      },

      zoomOut: () => {
        if (!viewportRef.current) return;

        const rect =
          viewportRef.current.getBoundingClientRect();

        setZoom(
          camera.current.zoom / 1.2,
          rect.width / 2,
          rect.height / 2,
        );
      },

      resetZoom: () => {
        if (!viewportRef.current) return;

        const rect =
          viewportRef.current.getBoundingClientRect();

        setZoom(
          1,
          rect.width / 2,
          rect.height / 2,
        );
      },

      fitAll: handleFitAll,

      getZoom: () => camera.current.zoom,

      getViewportCenterWorld: () => {
        if (!viewportRef.current) {
          return { x: 0, y: 0 };
        }

        const rect =
          viewportRef.current.getBoundingClientRect();

        return screenToWorld(
          rect.width / 2,
          rect.height / 2,
        );
      },

      subscribeZoom,
    };
  }, [
    setZoom,
    handleFitAll,
    camera,
    screenToWorld,
    subscribeZoom,
  ]);

  if (!doc) return null;

  const sortedObjects = doc.objectOrder
    .map((id) => doc.objects[id])
    .filter(Boolean);

  const backgroundClass =
    `canvas-bg canvas-bg--${doc.background}`;

  return (
    <div
      ref={viewportRef}
      className={`canvas-viewport${
        activeTool === 'draw'
          ? ' is-drawing'
          : ''
      }`}
      onWheel={handleWheel}
      onPointerDown={handleViewportPointerDown}
      onPointerMove={handleViewportPointerMove}
      onPointerUp={handleViewportPointerUp}
      onPointerCancel={handleViewportPointerUp}
    >
      <div
        ref={worldRef}
        className="canvas-world"
        data-canvas-bg="true"
      >
        <div
          className={backgroundClass}
          data-canvas-bg="true"
        />

        {sortedObjects.map((object) => (
          <CanvasObjectNode
            key={object.id}
            obj={object}
            isSelected={selectedIds.includes(object.id)}
            zoom={camera.current.zoom}
            onSelect={handleSelect}
            gesture={gesture}
            screenToWorld={screenToWorld}
          />
        ))}

        {activeTool === 'draw' && (
          <svg
            className="drawing-layer"
            width="12000"
            height="12000"
            style={{
              left: -6000,
              top: -6000,
            }}
            aria-hidden="true"
          >
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
        <div
          className="marquee"
          style={{
            left: marquee.x,
            top: marquee.y,
            width: marquee.w,
            height: marquee.h,
          }}
        />
      )}
    </div>
  );
}