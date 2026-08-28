import { memo, useRef, useState, useCallback, useEffect } from 'react';
import type { CanvasObject } from '../types';
import { useCanvasStore } from '../store/canvasStore';
import { useObjectGesture } from './useObjectGesture';
import { Icon } from '../components/Icon';

interface Props {
  obj: CanvasObject;
  isSelected: boolean;
  zoom: number;
  onSelect: (id: string, additive: boolean) => void;
  gesture: ReturnType<typeof useObjectGesture>;
  screenToWorld: (x: number, y: number) => { x: number; y: number };
}

const RESIZE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;

function CanvasObjectNodeImpl({ obj, isSelected, zoom, onSelect, gesture, screenToWorld }: Props) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [editing, setEditing] = useState(false);
  const updateObjectData = useCanvasStore((s) => s.updateObjectData);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (editing) return;
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      onSelect(obj.id, e.shiftKey);
      if (obj.locked || !nodeRef.current) return;
      gesture.startMove(e, obj, nodeRef.current, zoom);
    },
    [obj, editing, gesture, zoom, onSelect],
  );

  const handleMove = useCallback(
    (e: React.PointerEvent) => {
      gesture.onPointerMove(e, screenToWorld(e.clientX, e.clientY));
    },
    [gesture, screenToWorld],
  );

  if (obj.hidden) return null;

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: obj.x,
    top: obj.y,
    width: obj.width,
    height: obj.height,
    transform: `rotate(${obj.rotation}deg)`,
    zIndex: isSelected ? 1000 : undefined,
    touchAction: 'none',
  };

  return (
    <div
      ref={nodeRef}
      className={`canvas-object canvas-object--${obj.type}${isSelected ? ' is-selected' : ''}${obj.locked ? ' is-locked' : ''}`}
      style={baseStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handleMove}
      onPointerUp={gesture.onPointerUp}
      onPointerCancel={gesture.onPointerUp}
      data-object-id={obj.id}
    >
      <ObjectContent obj={obj} editing={editing} setEditing={setEditing} updateObjectData={updateObjectData} />

      {isSelected && !obj.locked && (
        <>
          {/* Pointer capture is set on the outer object node (nodeRef) in start*(),
              so move/up are handled by the outer div's listeners above once the
              gesture begins — these handles only need pointerdown. */}
          {RESIZE_HANDLES.map((h) => (
            <div
              key={h}
              className={`resize-handle handle-${h}`}
              onPointerDown={(e) => nodeRef.current && gesture.startResize(e, obj, nodeRef.current, zoom, h)}
            />
          ))}
          <div
            className="rotate-handle"
            title="Rotate"
            onPointerDown={(e) => nodeRef.current && gesture.startRotate(e, obj, nodeRef.current)}
          >
            <Icon name="rotate" size={12} />
            <div className="rotate-handle-stick" />
          </div>
        </>
      )}
      {obj.locked && isSelected && (
        <div className="lock-badge">
          <Icon name="lock" size={12} />
        </div>
      )}
    </div>
  );
}

function ObjectContent({
  obj,
  editing,
  setEditing,
  updateObjectData,
}: {
  obj: CanvasObject;
  editing: boolean;
  setEditing: (v: boolean) => void;
  updateObjectData: (id: string, patch: Record<string, unknown>) => void;
}) {
  const textRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editing && textRef.current) {
      textRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editing]);

  if (obj.type === 'note') {
    return (
      <div className="note-object" style={{ background: obj.data.color }}>
        <div
          ref={textRef}
          className="note-text"
          contentEditable={editing}
          suppressContentEditableWarning
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          onBlur={(e) => {
            setEditing(false);
            updateObjectData(obj.id, { text: e.currentTarget.innerText });
          }}
          onPointerDown={(e) => {
            if (editing) e.stopPropagation();
          }}
        >
          {obj.data.text}
        </div>
      </div>
    );
  }

  if (obj.type === 'text') {
    const highlight = obj.data.highlight;
    return (
      <div
        ref={textRef}
        className={`text-object${highlight ? ' has-highlight' : ''}`}
        contentEditable={editing}
        suppressContentEditableWarning
        style={
          {
            fontFamily: obj.data.fontFamily,
            fontSize: obj.data.fontSize,
            color: obj.data.color,
            fontWeight: obj.data.bold ? 700 : 400,
            fontStyle: obj.data.italic ? 'italic' : 'normal',
            textDecoration: obj.data.underline ? 'underline' : 'none',
            textAlign: obj.data.align,
            '--text-highlight': highlight || 'transparent',
          } as React.CSSProperties
        }
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        onBlur={(e) => {
          setEditing(false);
          updateObjectData(obj.id, { text: e.currentTarget.innerText });
        }}
        onPointerDown={(e) => {
          if (editing) e.stopPropagation();
        }}
      >
        {obj.data.text}
      </div>
    );
  }

  if (obj.type === 'image') {
    const frame = obj.data.frame ?? 'none';
    return (
      <div className={`image-object image-frame--${frame}`}>
        <div className="image-frame-inner">
          <img src={obj.data.src} alt={obj.data.caption || ''} draggable={false} />
        </div>
        {frame === 'polaroid' && <span className="image-caption">{obj.data.caption || 'a little memory'}</span>}
      </div>
    );
  }

  if (obj.type === 'drawing') {
    return (
      <svg
        className="drawing-object"
        viewBox={`0 0 ${obj.width} ${obj.height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={obj.data.path}
          fill="none"
          stroke={obj.data.stroke}
          strokeWidth={obj.data.strokeWidth}
          strokeOpacity={obj.data.opacity}
          strokeLinecap={obj.data.lineCap}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  if (obj.type === 'sticker') {
    return (
      <div className="sticker-object" style={{ background: obj.data.background }} aria-hidden="true">
        {obj.data.symbol}
      </div>
    );
  }

  return null;
}

export const CanvasObjectNode = memo(CanvasObjectNodeImpl);
