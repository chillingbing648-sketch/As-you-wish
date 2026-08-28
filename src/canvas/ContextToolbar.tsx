import { useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import type { CanvasObject, ImageFrame } from '../types';
import { Icon, type IconName } from '../components/Icon';

const NOTE_COLORS = ['#FFF0B8', '#FFD9CF', '#DDEBD5', '#DDE7F4', '#EBDDF2'];
const HIGHLIGHTS = ['#FFE68A', '#FFC6D9', '#CDEBFF', '#D9F0C8', '#E4D1FF'];
const DRAW_COLORS = ['#4A4046', '#D78C9F', '#B8A9D3', '#A9BEA9', '#E3A857', '#7C93B0'];
const STICKER_SYMBOLS = ['✦', '♡', '✿', '☁', '✧', '❀', '✎', '☺', '★', '❦', '☾', '✂'];
const FRAME_OPTIONS: { value: ImageFrame; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'polaroid', label: 'Polaroid' },
  { value: 'paper', label: 'Paper' },
  { value: 'tape', label: 'Tape' },
  { value: 'film', label: 'Film' },
  { value: 'torn', label: 'Torn' },
];
const FONT_OPTIONS = [
  { label: 'Clean · Inter', value: 'Inter, sans-serif' },
  { label: 'Editorial · Fraunces', value: 'Fraunces, serif' },
  { label: 'Handwritten · Caveat', value: 'Caveat, cursive' },
  { label: 'Classic · Georgia', value: 'Georgia, serif' },
];

function makeBaseObject(overrides: Partial<CanvasObject>): CanvasObject {
  const now = Date.now();
  const base = {
    id: crypto.randomUUID(),
    x: 0,
    y: 0,
    width: 220,
    height: 140,
    rotation: 0,
    zIndex: 0,
    locked: false,
    hidden: false,
    createdAt: now,
    updatedAt: now,
  };
  return { ...base, ...overrides } as CanvasObject;
}

function ToolButton({
  icon,
  label,
  active,
  onClick,
  danger,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      className={`ctx-icon-btn${active ? ' is-active' : ''}${danger ? ' ctx-danger' : ''}`}
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      <Icon name={icon} size={17} />
    </button>
  );
}

export function AddMenu({ worldCenter }: { worldCenter: () => { x: number; y: number } }) {
  const addObject = useCanvasStore((s) => s.addObject);
  const setTool = useCanvasStore((s) => s.setTool);
  const fileRef = useRef<HTMLInputElement>(null);
  const [stickerPickerOpen, setStickerPickerOpen] = useState(false);
  const stickerPickerWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!stickerPickerOpen) return;
    const onClickOutside = (e: PointerEvent) => {
      if (stickerPickerWrapRef.current && !stickerPickerWrapRef.current.contains(e.target as Node)) {
        setStickerPickerOpen(false);
      }
    };
    document.addEventListener('pointerdown', onClickOutside);
    return () => document.removeEventListener('pointerdown', onClickOutside);
  }, [stickerPickerOpen]);

  const addNote = () => {
    const c = worldCenter();
    addObject(
      makeBaseObject({
        type: 'note',
        x: c.x - 120,
        y: c.y - 80,
        width: 240,
        height: 170,
        rotation: Math.round(Math.random() * 5 - 2.5),
        data: { text: 'New note', color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)] },
      }) as CanvasObject,
    );
  };

  const addText = () => {
    const c = worldCenter();
    addObject(
      makeBaseObject({
        type: 'text',
        x: c.x - 120,
        y: c.y - 25,
        width: 260,
        height: 70,
        data: {
          text: 'Write your idea…',
          fontFamily: 'Fraunces, serif',
          fontSize: 24,
          color: '#292727',
          bold: false,
          italic: false,
          underline: false,
          highlight: '',
          align: 'left',
        },
      }) as CanvasObject,
    );
  };

  const addImage = () => fileRef.current?.click();

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      const img = new Image();
      img.onload = () => {
        const c = worldCenter();
        const maxDim = 340;
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        const width = img.naturalWidth * scale;
        // Reserve extra height for the polaroid caption strip so the photo
        // itself keeps its natural aspect ratio instead of being squeezed.
        const captionSpace = 44;
        const height = img.naturalHeight * scale + captionSpace;
        addObject(
          makeBaseObject({
            type: 'image',
            x: c.x - width / 2,
            y: c.y - height / 2,
            width,
            height,
            data: { src, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, frame: 'polaroid' },
          }) as CanvasObject,
        );
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const addSticker = (symbol: string) => {
    const c = worldCenter();
    addObject(
      makeBaseObject({
        type: 'sticker',
        x: c.x - 32,
        y: c.y - 32,
        width: 64,
        height: 64,
        rotation: Math.round(Math.random() * 10 - 5),
        data: { symbol },
      }) as CanvasObject,
    );
    setStickerPickerOpen(false);
  };

  return (
    <>
      <input ref={fileRef} hidden type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />

      <div className="add-menu-wrap" ref={stickerPickerWrapRef}>
        {stickerPickerOpen && (
          <div className="sticker-picker" role="menu" aria-label="Choose a sticker">
            {STICKER_SYMBOLS.map((s) => (
              <button key={s} className="sticker-picker-item" onClick={() => addSticker(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="add-menu" role="toolbar" aria-label="Create on canvas">
          <button className="add-menu-btn add-menu-btn--primary" onClick={addNote}>
            <Icon name="plus" size={17} />
            <span>Note</span>
          </button>
          <button className="add-menu-btn" onClick={addText}>
            <Icon name="type" size={17} />
            <span>Text</span>
          </button>
          <button className="add-menu-btn" onClick={addImage}>
            <Icon name="image" size={17} />
            <span>Photo</span>
          </button>
          <button className="add-menu-btn" onClick={() => setTool('draw')}>
            <Icon name="pen" size={17} />
            <span>Draw</span>
          </button>
          <button
            className={`add-menu-btn${stickerPickerOpen ? ' is-active' : ''}`}
            onClick={() => setStickerPickerOpen((v) => !v)}
          >
            <Icon name="sparkles" size={17} />
            <span>Sticker</span>
          </button>
        </div>
      </div>
    </>
  );
}

export function ContextToolbar() {
  const doc = useCanvasStore((s) => s.doc);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setTool = useCanvasStore((s) => s.setTool);
  const drawSettings = useCanvasStore((s) => s.drawSettings);
  const setDrawSettings = useCanvasStore((s) => s.setDrawSettings);
  const updateObjectData = useCanvasStore((s) => s.updateObjectData);
  const deleteObjects = useCanvasStore((s) => s.deleteObjects);
  const bringToFront = useCanvasStore((s) => s.bringToFront);
  const sendToBack = useCanvasStore((s) => s.sendToBack);
  const toggleLock = useCanvasStore((s) => s.toggleLock);

  if (!doc || (selectedIds.length === 0 && activeTool !== 'draw')) return null;
  const objs = selectedIds.map((id) => doc.objects[id]).filter(Boolean);
  const single = objs.length === 1 ? objs[0] : null;

  return (
    <div className="context-toolbar" role="toolbar" aria-label="Editing tools">
      {activeTool === 'draw' && (
        <>
          <span className="ctx-mode">
            <Icon name="pen" size={16} /> Drawing
          </span>
          <div className="ctx-divider" />
          {DRAW_COLORS.map((c) => (
            <button
              key={c}
              className={`ctx-swatch${drawSettings.stroke === c ? ' is-active' : ''}`}
              style={{ background: c }}
              aria-label={`Ink colour ${c}`}
              onClick={() => setDrawSettings({ stroke: c })}
            />
          ))}
          <input
            type="color"
            className="ctx-color"
            title="Custom ink colour"
            value={drawSettings.stroke}
            onChange={(e) => setDrawSettings({ stroke: e.target.value })}
          />
          <div className="ctx-divider" />
          <label className="ctx-slider-label" title="Stroke width">
            <Icon name="pen" size={14} />
            <input
              type="range"
              min={1}
              max={20}
              value={drawSettings.strokeWidth}
              onChange={(e) => setDrawSettings({ strokeWidth: Number(e.target.value) })}
            />
          </label>
          <label className="ctx-slider-label" title="Opacity">
            <Icon name="droplet" size={14} />
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={drawSettings.opacity}
              onChange={(e) => setDrawSettings({ opacity: Number(e.target.value) })}
            />
          </label>
          <div className="ctx-divider" />
          <button className="ctx-done" onClick={() => setTool('select')}>
            <Icon name="check" size={15} /> Done
          </button>
        </>
      )}

      {single?.type === 'text' && (
        <>
          <select
            className="ctx-select"
            value={single.data.fontFamily}
            onChange={(e) => updateObjectData(single.id, { fontFamily: e.target.value })}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <input
            className="ctx-number"
            type="number"
            min={10}
            max={120}
            value={single.data.fontSize}
            onChange={(e) => updateObjectData(single.id, { fontSize: Math.max(10, Number(e.target.value)) })}
          />
          <div className="ctx-divider" />
          <ToolButton
            icon="bold"
            label="Bold"
            active={single.data.bold}
            onClick={() => updateObjectData(single.id, { bold: !single.data.bold })}
          />
          <ToolButton
            icon="italic"
            label="Italic"
            active={single.data.italic}
            onClick={() => updateObjectData(single.id, { italic: !single.data.italic })}
          />
          <ToolButton
            icon="underline"
            label="Underline"
            active={single.data.underline}
            onClick={() => updateObjectData(single.id, { underline: !single.data.underline })}
          />
          <input
            className="ctx-color"
            type="color"
            title="Text colour"
            value={single.data.color}
            onChange={(e) => updateObjectData(single.id, { color: e.target.value })}
          />
          <div className="ctx-highlight-wrap" title="Highlight">
            <Icon name="highlighter" size={16} />
            <div className="ctx-swatches">
              {HIGHLIGHTS.map((c) => (
                <button
                  key={c}
                  className={`ctx-swatch${single.data.highlight === c ? ' is-active' : ''}`}
                  style={{ background: c }}
                  aria-label={`Highlight ${c}`}
                  onClick={() => updateObjectData(single.id, { highlight: single.data.highlight === c ? '' : c })}
                />
              ))}
            </div>
          </div>
          <div className="ctx-divider" />
          <ToolButton
            icon="align-left"
            label="Align left"
            active={single.data.align === 'left'}
            onClick={() => updateObjectData(single.id, { align: 'left' })}
          />
          <ToolButton
            icon="align-center"
            label="Align center"
            active={single.data.align === 'center'}
            onClick={() => updateObjectData(single.id, { align: 'center' })}
          />
          <ToolButton
            icon="align-right"
            label="Align right"
            active={single.data.align === 'right'}
            onClick={() => updateObjectData(single.id, { align: 'right' })}
          />
        </>
      )}

      {single?.type === 'note' && (
        <>
          <span className="ctx-label">Paper</span>
          {NOTE_COLORS.map((c) => (
            <button
              key={c}
              className={`ctx-swatch${single.data.color === c ? ' is-active' : ''}`}
              style={{ background: c }}
              aria-label={`Note colour ${c}`}
              onClick={() => updateObjectData(single.id, { color: c })}
            />
          ))}
        </>
      )}

      {single?.type === 'image' && (
        <>
          <span className="ctx-mode">
            <Icon name="image" size={16} /> Photo
          </span>
          <div className="ctx-divider" />
          <span className="ctx-label">Frame</span>
          {FRAME_OPTIONS.map((f) => (
            <button
              key={f.value}
              className={`ctx-chip${(single.data.frame ?? 'none') === f.value ? ' is-active' : ''}`}
              onClick={() => updateObjectData(single.id, { frame: f.value })}
            >
              {f.label}
            </button>
          ))}
        </>
      )}

      {single?.type === 'drawing' && (
        <>
          <span className="ctx-mode">
            <Icon name="pen" size={16} /> Ink
          </span>
          <input
            className="ctx-color"
            type="color"
            title="Stroke colour"
            value={single.data.stroke}
            onChange={(e) => updateObjectData(single.id, { stroke: e.target.value })}
          />
          <label className="ctx-slider-label" title="Stroke width">
            <Icon name="pen" size={14} />
            <input
              type="range"
              min={1}
              max={32}
              value={single.data.strokeWidth}
              onChange={(e) => updateObjectData(single.id, { strokeWidth: Number(e.target.value) })}
            />
          </label>
        </>
      )}

      {single?.type === 'sticker' && (
        <span className="ctx-mode">
          <Icon name="sparkles" size={16} /> Sticker
        </span>
      )}

      {objs.length > 1 && <span className="ctx-label">{objs.length} selected</span>}

      {objs.length > 0 && (
        <>
          <div className="ctx-divider" />
          <ToolButton icon="layers" label="Bring to front" onClick={() => bringToFront(selectedIds)} />
          <ToolButton icon="layers-back" label="Send to back" onClick={() => sendToBack(selectedIds)} />
          {single && (
            <ToolButton
              icon={single.locked ? 'unlock' : 'lock'}
              label={single.locked ? 'Unlock' : 'Lock'}
              active={single.locked}
              onClick={() => toggleLock(single.id)}
            />
          )}
          <ToolButton icon="trash" label="Delete" danger onClick={() => deleteObjects(selectedIds)} />
        </>
      )}
    </div>
  );
}
