import { useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { usePrefsStore } from '../store/prefsStore';
import type { CanvasBackground, CanvasObject, ImageFrame, ShapeType } from '../types';
import { Icon, type IconName } from '../components/Icon';
import { FontStudio } from './FontStudio';
import { DrawingPanel } from './DrawingPanel';
import { ColourStudio } from './ColourStudio';
import { ImageEditPanel } from './ImageEditPanel';
import { AlignmentToolbar } from './AlignmentToolbar';
import { TemplateGallery } from './TemplateGallery';
import { SavedElements } from './SavedElements';
import { DecorationsDrawer } from './DecorationsDrawer';
import { EmojiStudio } from './EmojiStudio';

const NOTE_COLORS = ['#FFF0B8', '#FFD9CF', '#DDEBD5', '#DDE7F4', '#EBDDF2', '#F1D6DE'];
const HIGHLIGHTS = ['#FFE68A', '#FFC6D9', '#CDEBFF', '#D9F0C8', '#E4D1FF'];

const SHAPE_OPTIONS: { type: ShapeType; label: string; icon: IconName; defaultW: number; defaultH: number }[] = [

  { type: 'rect', label: 'Rectangle', icon: 'square', defaultW: 180, defaultH: 140 },
  { type: 'rounded-rect', label: 'Rounded Box', icon: 'square', defaultW: 180, defaultH: 140 },
  { type: 'circle', label: 'Circle', icon: 'circle', defaultW: 150, defaultH: 150 },
  { type: 'triangle', label: 'Triangle', icon: 'triangle', defaultW: 160, defaultH: 150 },
  { type: 'star', label: 'Star', icon: 'star-shape', defaultW: 150, defaultH: 150 },
  { type: 'speech-bubble', label: 'Speech Bubble', icon: 'speech-bubble', defaultW: 200, defaultH: 140 },
  { type: 'line', label: 'Line', icon: 'minus', defaultW: 220, defaultH: 24 },
  { type: 'arrow', label: 'Arrow', icon: 'arrow-right', defaultW: 220, defaultH: 36 },
  { type: 'divider', label: 'Divider', icon: 'minus', defaultW: 300, defaultH: 20 },
];

const FRAME_OPTIONS: { value: ImageFrame; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'polaroid', label: 'Polaroid' },
  { value: 'paper', label: 'Paper' },
  { value: 'tape', label: 'Tape' },
  { value: 'film', label: 'Film' },
  { value: 'torn', label: 'Torn' },
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

const BACKGROUND_OPTIONS: { value: CanvasBackground; label: string; swatch: string }[] = [
  { value: 'paper', label: 'Paper', swatch: '#F7F0E8' },
  { value: 'blank', label: 'Blank', swatch: '#FBF8F4' },
  { value: 'dotted', label: 'Dotted', swatch: '#F5EFE8' },
  { value: 'grid', label: 'Grid', swatch: '#F5EFE8' },
  { value: 'lined', label: 'Lined', swatch: '#F5EFE8' },
  { value: 'pink', label: 'Blush', swatch: '#F9E9ED' },
  { value: 'lavender', label: 'Lavender', swatch: '#EEE9F7' },
  { value: 'sage', label: 'Sage', swatch: '#E9F0E7' },
  { value: 'sky', label: 'Sky', swatch: '#E8F2F8' },
];

export interface UnifiedTopToolbarProps {
  worldCenter: () => { x: number; y: number };
  layerPanelOpen?: boolean;
  onToggleLayerPanel?: () => void;
  onOpenQuickCreate?: () => void;
  onShowShortcuts?: () => void;
}

export function UnifiedTopToolbar({
  worldCenter,
  layerPanelOpen,
  onToggleLayerPanel,
  onOpenQuickCreate,
  onShowShortcuts,
}: UnifiedTopToolbarProps) {
  const doc = useCanvasStore((s) => s.doc);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setTool = useCanvasStore((s) => s.setTool);
  const addObject = useCanvasStore((s) => s.addObject);
  const updateObjectData = useCanvasStore((s) => s.updateObjectData);
  const deleteObjects = useCanvasStore((s) => s.deleteObjects);
  const duplicateObjects = useCanvasStore((s) => s.duplicateObjects);
  const bringToFront = useCanvasStore((s) => s.bringToFront);
  const sendToBack = useCanvasStore((s) => s.sendToBack);
  const bringForward = useCanvasStore((s) => s.bringForward);
  const sendBackward = useCanvasStore((s) => s.sendBackward);
  const toggleLock = useCanvasStore((s) => s.toggleLock);
  const background = useCanvasStore((s) => s.doc?.background);
  const setBackground = useCanvasStore((s) => s.setBackground);
  const saveElement = usePrefsStore((s) => s.saveElement);

  const fileRef = useRef<HTMLInputElement>(null);
  const shapeWrapRef = useRef<HTMLDivElement | null>(null);
  const bgPickerRef = useRef<HTMLDivElement | null>(null);

  const [shapePickerOpen, setShapePickerOpen] = useState(false);
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const [fontStudioOpen, setFontStudioOpen] = useState(false);
  const [colorStudioOpen, setColorStudioOpen] = useState(false);
  const [colorStudioTarget, setColorStudioTarget] = useState<
    'textColor' | 'textBg' | 'noteBg' | 'shapeFill' | 'shapeStroke' | 'drawStroke' | null
  >(null);
  const [imageStudioOpen, setImageStudioOpen] = useState(false);
  const [textSpacingOpen, setTextSpacingOpen] = useState(false);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [savedElementsOpen, setSavedElementsOpen] = useState(false);
  const [decorationsOpen, setDecorationsOpen] = useState(false);
  const [emojiStudioOpen, setEmojiStudioOpen] = useState(false);

  useEffect(() => {
    const onClickOutside = (e: PointerEvent) => {
      if (shapePickerOpen && shapeWrapRef.current && !shapeWrapRef.current.contains(e.target as Node)) {
        setShapePickerOpen(false);
      }
      if (bgPickerOpen && bgPickerRef.current && !bgPickerRef.current.contains(e.target as Node)) {
        setBgPickerOpen(false);
      }
    };
    document.addEventListener('pointerdown', onClickOutside);
    return () => document.removeEventListener('pointerdown', onClickOutside);
  }, [shapePickerOpen, bgPickerOpen]);

  const objs = selectedIds.map((id) => doc?.objects[id]).filter(Boolean) as CanvasObject[];
  const single = objs.length === 1 ? objs[0] : null;
  const hasSelection = objs.length > 0;

  const openColorModal = (target: typeof colorStudioTarget) => {
    setColorStudioTarget(target);
    setColorStudioOpen(true);
  };

  const addNote = () => {
    const c = worldCenter();
    addObject(
      makeBaseObject({
        type: 'note',
        x: c.x - 120,
        y: c.y - 80,
        width: 240,
        height: 170,
        rotation: Math.round(Math.random() * 4 - 2),
        data: { text: 'New note', color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)] },
      })
    );
  };

  const addText = () => {
    const c = worldCenter();
    addObject(
      makeBaseObject({
        type: 'text',
        x: c.x - 130,
        y: c.y - 30,
        width: 260,
        height: 70,
        data: {
          text: 'Write your idea…',
          fontFamily: "'Fraunces', serif",
          fontSize: 24,
          color: '#29272A',
          bold: false,
          italic: false,
          underline: false,
          highlight: '',
          align: 'left',
          letterSpacing: 0,
          lineHeight: 1.4,
        },
      })
    );
  };

  const addShape = (shape: typeof SHAPE_OPTIONS[0]) => {
    const c = worldCenter();
    addObject(
      makeBaseObject({
        type: 'shape',
        x: c.x - shape.defaultW / 2,
        y: c.y - shape.defaultH / 2,
        width: shape.defaultW,
        height: shape.defaultH,
        data: {
          shapeType: shape.type,
          fill: '#F1D6DE',
          strokeColor: '#D78C9F',
          strokeWidth: 2,
          opacity: 0.95,
          rounded: 12,
          shadow: false,
          starPoints: 5,
        },
      })
    );
    setShapePickerOpen(false);
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
        const captionSpace = 44;
        const height = img.naturalHeight * scale + captionSpace;
        addObject(
          makeBaseObject({
            type: 'image',
            x: c.x - width / 2,
            y: c.y - height / 2,
            width,
            height,
            data: {
              src,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              frame: 'polaroid',
              filter: 'none',
              brightness: 100,
              contrast: 100,
              saturation: 100,
              opacity: 1,
              shadow: false,
            },
          })
        );
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAsElement = () => {
    if (objs.length === 0) return;
    const label = objs.length === 1 ? (objs[0].label || 'Custom Element') : `${objs.length} Objects Bundle`;
    saveElement({
      id: crypto.randomUUID(),
      label,
      objects: objs,
      createdAt: Date.now(),
    });
    alert('Saved to My Elements! ✦');
  };

  return (
    <>
      <input ref={fileRef} hidden type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />

      <nav className="unified-top-toolbar" role="toolbar" aria-label="Main editing control center">
        <div className="unified-toolbar-scroll">
          {/* GROUP 1: PRIMARY CREATION TOOLS */}
          <div className="toolbar-group toolbar-group--creation">
            <button
              className={`tool-btn ${activeTool === 'select' && !hasSelection ? 'is-active' : ''}`}
              onClick={() => setTool('select')}
              title="Select pointer (S)"
            >
              <Icon name="cursor" size={15} />
              <span className="tool-label">Select</span>
            </button>

            <button className="tool-btn" onClick={addNote} title="Add sticky note">
              <Icon name="plus" size={15} />
              <span className="tool-label">Note</span>
            </button>

            <button className="tool-btn" onClick={addText} title="Add text block">
              <Icon name="type" size={15} />
              <span className="tool-label">Text</span>
            </button>

            <div className="toolbar-dropdown-wrap" ref={shapeWrapRef}>
              <button
                className={`tool-btn ${shapePickerOpen ? 'is-active' : ''}`}
                onClick={() => setShapePickerOpen((v) => !v)}
                title="Add geometric shapes"
              >
                <Icon name="shapes" size={15} />
                <span className="tool-label">Shapes</span>
                <Icon name="chevron-down" size={11} />
              </button>

              {shapePickerOpen && (
                <div className="shape-picker" role="menu" aria-label="Choose a shape">
                  <div className="shape-picker-grid">
                    {SHAPE_OPTIONS.map((shape) => (
                      <button
                        key={shape.type}
                        className="shape-picker-item"
                        onClick={() => addShape(shape)}
                        title={shape.label}
                      >
                        <Icon name={shape.icon} size={18} />
                        <span>{shape.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="tool-btn" onClick={addImage} title="Upload photo image">
              <Icon name="image" size={15} />
              <span className="tool-label">Photo</span>
            </button>

            <button
              className={`tool-btn ${activeTool === 'draw' ? 'is-active' : ''}`}
              onClick={() => setTool(activeTool === 'draw' ? 'select' : 'draw')}
              title="Freehand ink drawing (D)"
            >
              <Icon name="pen" size={15} />
              <span className="tool-label">Draw</span>
            </button>

            <button
              className={`tool-btn ${decorationsOpen ? 'is-active' : ''}`}
              onClick={() => setDecorationsOpen(true)}
              title="Stickers, washi tape & doodles"
            >
              <Icon name="sparkles" size={15} />
              <span className="tool-label">Stickers</span>
            </button>

            <button
              className={`tool-btn ${emojiStudioOpen ? 'is-active' : ''}`}
              onClick={() => setEmojiStudioOpen(true)}
              title="Cute Emoji & Mood Studio"
            >
              <span className="tool-emoji-icon">🌸</span>
              <span className="tool-label">Moods</span>
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* GROUP 2: CONTEXTUAL EDITING (SURFACED WHEN OBJECT IS SELECTED OR INK DRAWING) */}
          {activeTool === 'draw' && (
            <div className="toolbar-group toolbar-group--contextual">
              <DrawingPanel onOpenColorStudio={() => openColorModal('drawStroke')} />
            </div>
          )}

          {single?.type === 'text' && (

          <>
            {/* Font Studio Button */}
            <button
              className="ctx-chip ctx-chip--font"
              onClick={() => setFontStudioOpen(true)}
              title="Open Font Studio catalog"
            >
              <Icon name="font" size={14} />
              <span className="ctx-font-name">
                {single.data.fontFamily.replace(/['",]/g, '').split(' ')[0] || 'Font'}
              </span>
            </button>

            <input
              className="ctx-number"
              type="number"
              min={10}
              max={160}
              value={single.data.fontSize}
              onChange={(e) => updateObjectData(single.id, { fontSize: Math.max(10, Number(e.target.value)) })}
              title="Font size (px)"
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
            <ToolButton
              icon="strikethrough"
              label="Strikethrough"
              active={single.data.strikethrough}
              onClick={() => updateObjectData(single.id, { strikethrough: !single.data.strikethrough })}
            />

            <div className="ctx-divider" />

            {/* Text Color */}
            <button
              className="ctx-color-trigger"
              style={{ background: single.data.color }}
              onClick={() => openColorModal('textColor')}
              title="Text Color Studio"
            />

            {/* Text Background Box Color */}
            <button
              className={`ctx-color-trigger ctx-color-trigger--bg ${single.data.textBackground ? 'is-set' : ''}`}
              style={{ background: single.data.textBackground || '#FFFDFB' }}
              onClick={() => openColorModal('textBg')}
              title="Text Box Background Color"
            >
              <span className="ctx-trigger-letter">BG</span>
            </button>

            {/* Highlight Wash */}
            <div className="ctx-highlight-wrap" title="Highlight Wash">
              <Icon name="highlighter" size={15} />
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

            {/* Spacing & Line Height Toggle */}
            <button
              className={`ctx-chip ${textSpacingOpen ? 'is-active' : ''}`}
              onClick={() => setTextSpacingOpen((v) => !v)}
              title="Letter spacing & line height"
            >
              <span>Spacing</span>
            </button>

            {textSpacingOpen && (
              <div className="ctx-popover">
                <label className="ctx-slider-label">
                  <span>Tracking: {(single.data.letterSpacing ?? 0) / 100}em</span>
                  <input
                    type="range"
                    min={-10}
                    max={40}
                    value={single.data.letterSpacing ?? 0}
                    onChange={(e) => updateObjectData(single.id, { letterSpacing: Number(e.target.value) })}
                  />
                </label>
                <label className="ctx-slider-label">
                  <span>Line Height: {single.data.lineHeight ?? 1.4}</span>
                  <input
                    type="range"
                    min={1}
                    max={2.5}
                    step={0.1}
                    value={single.data.lineHeight ?? 1.4}
                    onChange={(e) => updateObjectData(single.id, { lineHeight: Number(e.target.value) })}
                  />
                </label>
              </div>
            )}

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

        {/* Single SHAPE object selected */}
        {single?.type === 'shape' && (
          <>
            <span className="ctx-mode">
              <Icon name="shapes" size={16} /> {single.data.shapeType}
            </span>
            <div className="ctx-divider" />

            <span className="ctx-label">Fill</span>
            <button
              className="ctx-color-trigger"
              style={{ background: single.data.fill }}
              onClick={() => openColorModal('shapeFill')}
              title="Shape Fill Color"
            />

            <span className="ctx-label">Border</span>
            <button
              className="ctx-color-trigger"
              style={{ background: single.data.strokeColor === 'transparent' ? '#FFFFFF' : single.data.strokeColor }}
              onClick={() => openColorModal('shapeStroke')}
              title="Shape Border Color"
            />

            <label className="ctx-slider-label" title="Border width">
              <span className="ctx-slider-text">Border: {single.data.strokeWidth}px</span>
              <input
                type="range"
                min={0}
                max={16}
                value={single.data.strokeWidth}
                onChange={(e) => updateObjectData(single.id, { strokeWidth: Number(e.target.value) })}
              />
            </label>

            <label className="ctx-slider-label" title="Opacity">
              <span className="ctx-slider-text">Opacity: {Math.round(single.data.opacity * 100)}%</span>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={single.data.opacity}
                onChange={(e) => updateObjectData(single.id, { opacity: Number(e.target.value) })}
              />
            </label>

            <button
              className={`ctx-chip ${single.data.shadow ? 'is-active' : ''}`}
              onClick={() => updateObjectData(single.id, { shadow: !single.data.shadow })}
              title="Toggle soft drop shadow"
            >
              <span>Shadow: {single.data.shadow ? 'On' : 'Off'}</span>
            </button>
          </>
        )}

        {/* Single NOTE object selected */}
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
            <button
              className="ctx-color-trigger"
              style={{ background: single.data.color }}
              onClick={() => openColorModal('noteBg')}
              title="Custom Note Colour"
            />
          </>
        )}

        {/* Single IMAGE object selected */}
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
            <div className="ctx-divider" />
            <button
              className={`ctx-chip ctx-chip--primary ${imageStudioOpen ? 'is-active' : ''}`}
              onClick={() => setImageStudioOpen((v) => !v)}
              title="Open Image Editing Studio"
            >
              <Icon name="sliders" size={14} />
              <span>Edit Filters & Adjust</span>
            </button>
          </>
        )}

        {/* Single DRAWING object selected */}
        {single?.type === 'drawing' && (
          <>
            <span className="ctx-mode">
              <Icon name="pen" size={16} /> Ink Stroke
            </span>
            <input
              className="ctx-color"
              type="color"
              title="Stroke colour"
              value={single.data.stroke}
              onChange={(e) => updateObjectData(single.id, { stroke: e.target.value })}
            />
            <label className="ctx-slider-label" title="Stroke width">
              <span className="ctx-slider-text">{single.data.strokeWidth}px</span>
              <input
                type="range"
                min={1}
                max={48}
                value={single.data.strokeWidth}
                onChange={(e) => updateObjectData(single.id, { strokeWidth: Number(e.target.value) })}
              />
            </label>
            <label className="ctx-slider-label" title="Opacity">
              <span className="ctx-slider-text">{Math.round(single.data.opacity * 100)}%</span>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={single.data.opacity}
                onChange={(e) => updateObjectData(single.id, { opacity: Number(e.target.value) })}
              />
            </label>
          </>
        )}

        {/* Single STICKER object selected */}
        {single?.type === 'sticker' && (
          <div className="toolbar-group toolbar-group--contextual">
            <span className="ctx-mode">
              <Icon name="sparkles" size={14} /> Sticker Stamp
            </span>
          </div>
        )}

        {/* Multi-Selection Controls */}
        {objs.length > 1 && (
          <div className="toolbar-group toolbar-group--contextual">
            <span className="ctx-label">{objs.length} selected</span>
            <AlignmentToolbar onSaveAsElement={handleSaveAsElement} />
          </div>
        )}

        {/* General Actions (Front, Back, Duplicate, Lock, Delete) */}
        {hasSelection && (
          <div className="toolbar-group toolbar-group--actions">
            <button className="ctx-icon-btn" onClick={() => bringForward(selectedIds)} title="Bring forward">
              <Icon name="chevron-right" size={14} />
            </button>
            <button className="ctx-icon-btn" onClick={() => sendBackward(selectedIds)} title="Send backward">
              <Icon name="chevron-down" size={14} />
            </button>
            <button className="ctx-icon-btn" onClick={() => bringToFront(selectedIds)} title="Bring to front">
              <Icon name="layers" size={14} />
            </button>
            <button className="ctx-icon-btn" onClick={() => sendToBack(selectedIds)} title="Send to back">
              <Icon name="layers-back" size={14} />
            </button>
            <button className="ctx-icon-btn" onClick={() => duplicateObjects(selectedIds)} title="Duplicate (Ctrl+D)">
              <Icon name="copy" size={14} />
            </button>
            {single && (
              <button
                className={`ctx-icon-btn ${single.locked ? 'is-active' : ''}`}
                onClick={() => toggleLock(single.id)}
                title={single.locked ? 'Unlock' : 'Lock'}
              >
                <Icon name={single.locked ? 'unlock' : 'lock'} size={14} />
              </button>
            )}
            <button className="ctx-icon-btn ctx-danger" onClick={() => deleteObjects(selectedIds)} title="Delete (Del)">
              <Icon name="trash" size={14} />
            </button>
          </div>
        )}

        <div className="toolbar-spacer" />

        {/* GROUP 3: CANVAS & UTILITIES */}
        <div className="toolbar-group toolbar-group--canvas">
          <button className="tool-btn" onClick={() => setTemplateGalleryOpen(true)} title="Starter canvas templates">
            <Icon name="template" size={14} />
            <span className="tool-label">Templates</span>
          </button>

          <button className="tool-btn" onClick={() => setSavedElementsOpen(true)} title="Saved elements & bundles">
            <Icon name="element" size={14} />
            <span className="tool-label">Elements</span>
          </button>

          {onToggleLayerPanel && (
            <button
              className={`tool-btn ${layerPanelOpen ? 'is-active' : ''}`}
              onClick={onToggleLayerPanel}
              title="Layers & Stacking panel"
            >
              <Icon name="layers" size={14} />
              <span className="tool-label">Layers</span>
            </button>
          )}

          <div className="toolbar-dropdown-wrap" ref={bgPickerRef}>
            <button
              className={`tool-btn ${bgPickerOpen ? 'is-active' : ''}`}
              onClick={() => setBgPickerOpen((v) => !v)}
              title="Canvas background texture"
            >
              <Icon name="swatch" size={14} />
              <span className="tool-label">Canvas</span>
            </button>

            {bgPickerOpen && (
              <div className="bg-picker-menu" role="menu" aria-label="Canvas background">
                <div className="bg-picker-title">Canvas Background</div>
                {BACKGROUND_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`bg-picker-item ${background === opt.value ? 'is-active' : ''}`}
                    onClick={() => {
                      setBackground(opt.value);
                      setBgPickerOpen(false);
                    }}
                  >
                    <span className="bg-picker-swatch" style={{ background: opt.swatch }} />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {onOpenQuickCreate && (
            <button className="tool-btn" onClick={onOpenQuickCreate} title="Quick Create (/ or Ctrl+K)">
              <kbd className="toolbar-kbd">/</kbd>
            </button>
          )}

          {onShowShortcuts && (
            <button className="tool-btn" onClick={onShowShortcuts} title="Keyboard shortcuts (?)">
              <Icon name="keyboard" size={14} />
            </button>
          )}
        </div>
      </div>
    </nav>

      {/* Font Studio Modal */}
      {fontStudioOpen && single?.type === 'text' && (
        <FontStudio
          currentFont={single.data.fontFamily}
          onSelectFont={(fontCss) => {
            updateObjectData(single.id, { fontFamily: fontCss });
          }}
          onApplyHeadingStyle={(heading) => {
            if (heading === 'h1') updateObjectData(single.id, { fontSize: 36, bold: true, headingStyle: 'h1' });
            else if (heading === 'h2') updateObjectData(single.id, { fontSize: 26, bold: true, headingStyle: 'h2' });
            else if (heading === 'h3') updateObjectData(single.id, { fontSize: 20, bold: true, headingStyle: 'h3' });
            else if (heading === 'body') updateObjectData(single.id, { fontSize: 16, bold: false, headingStyle: 'body' });
            else if (heading === 'quote') updateObjectData(single.id, { fontSize: 22, italic: true, headingStyle: 'quote' });
            else if (heading === 'handwritten') updateObjectData(single.id, { fontFamily: "'Caveat', cursive", fontSize: 28, headingStyle: 'handwritten' });
            else if (heading === 'caption') updateObjectData(single.id, { fontSize: 12, bold: true, headingStyle: 'caption' });
          }}
          onClose={() => setFontStudioOpen(false)}
        />
      )}

      {/* Image Edit Modal */}
      {imageStudioOpen && single?.type === 'image' && (
        <ImageEditPanel
          data={single.data}
          onChange={(patch) => updateObjectData(single.id, patch)}
          onClose={() => setImageStudioOpen(false)}
        />
      )}

      {/* Colour Studio Modal */}
      {colorStudioOpen && (
        <ColourStudio
          currentColor={
            colorStudioTarget === 'textColor'
              ? (single?.type === 'text' ? single.data.color : '#29272A')
              : colorStudioTarget === 'textBg'
              ? (single?.type === 'text' ? single.data.textBackground || '#FFFDFB' : '#FFFDFB')
              : colorStudioTarget === 'noteBg'
              ? (single?.type === 'note' ? single.data.color : '#FFF0B8')
              : colorStudioTarget === 'shapeFill'
              ? (single?.type === 'shape' ? single.data.fill : '#F1D6DE')
              : colorStudioTarget === 'shapeStroke'
              ? (single?.type === 'shape' ? single.data.strokeColor : '#D78C9F')
              : '#4A4046'
          }
          opacity={single?.type === 'shape' ? single.data.opacity : undefined}
          onChangeOpacity={(op) => {
            if (single && single.type === 'shape') {
              updateObjectData(single.id, { opacity: op });
            }
          }}
          showHighlightStyles={single?.type === 'text'}
          currentHighlightStyle={single?.type === 'text' ? (single.data.highlightStyle || 'soft') : undefined}
          onChangeHighlightStyle={(style) => {
            if (single && single.type === 'text') {
              updateObjectData(single.id, { highlightStyle: style });
            }
          }}
          onChangeColor={(col) => {
            if (!single) return;
            if (colorStudioTarget === 'textColor') updateObjectData(single.id, { color: col });
            else if (colorStudioTarget === 'textBg') updateObjectData(single.id, { textBackground: col });
            else if (colorStudioTarget === 'noteBg') updateObjectData(single.id, { color: col });
            else if (colorStudioTarget === 'shapeFill') updateObjectData(single.id, { fill: col });
            else if (colorStudioTarget === 'shapeStroke') updateObjectData(single.id, { strokeColor: col });
            else if (colorStudioTarget === 'drawStroke') {
              useCanvasStore.getState().setDrawSettings({ stroke: col });
            }
          }}
          onClose={() => {
            setColorStudioOpen(false);
            setColorStudioTarget(null);
          }}
        />
      )}

      {/* Drawers & Galleries */}
      {decorationsOpen && (
        <DecorationsDrawer onClose={() => setDecorationsOpen(false)} worldCenter={worldCenter} />
      )}
      {emojiStudioOpen && (
        <EmojiStudio onClose={() => setEmojiStudioOpen(false)} worldCenter={worldCenter} />
      )}
      {templateGalleryOpen && (
        <TemplateGallery onClose={() => setTemplateGalleryOpen(false)} worldCenter={worldCenter} />
      )}
      {savedElementsOpen && (
        <SavedElements onClose={() => setSavedElementsOpen(false)} worldCenter={worldCenter} />
      )}
    </>
  );
}

// Backward-compatible alias
export const ContextToolbar = UnifiedTopToolbar;
export const AddMenu = () => null;

