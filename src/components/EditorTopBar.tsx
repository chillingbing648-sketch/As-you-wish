import { useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import type { CanvasBackground, Notebook } from '../types';
import { Icon } from './Icon';

interface Props {
  notebook: Notebook;
  onBack: () => void;
  onRename: (title: string) => void;
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

export function EditorTopBar({ notebook, onBack, onRename }: Props) {
  const saveStatus = useCanvasStore((s) => s.saveStatus);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setTool = useCanvasStore((s) => s.setTool);
  const background = useCanvasStore((s) => s.doc?.background);
  const setBackground = useCanvasStore((s) => s.setBackground);
  const [titleDraft, setTitleDraft] = useState(notebook.title);
  const [zoomPct, setZoomPct] = useState(100);
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const bgPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setTitleDraft(notebook.title), [notebook.title]);

  useEffect(() => {
    // Canvas mounts and populates window.__canvasControls in its own effect;
    // poll briefly just until the subscription is available, then switch to
    // event-driven updates (no interval needed once subscribed).
    let unsubscribe: (() => void) | undefined;
    const tryId = setInterval(() => {
      const controls = (window as unknown as Record<string, unknown>).__canvasControls as
        | { subscribeZoom: (fn: (z: number) => void) => () => void }
        | undefined;
      if (controls?.subscribeZoom) {
        clearInterval(tryId);
        unsubscribe = controls.subscribeZoom((z) => setZoomPct(Math.round(z * 100)));
      }
    }, 50);
    return () => {
      clearInterval(tryId);
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!bgPickerOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (bgPickerRef.current && !bgPickerRef.current.contains(e.target as Node)) {
        setBgPickerOpen(false);
      }
    };
    document.addEventListener('pointerdown', onClickOutside);
    return () => document.removeEventListener('pointerdown', onClickOutside);
  }, [bgPickerOpen]);

  const controls = () =>
    (window as unknown as Record<string, unknown>).__canvasControls as
      | { zoomIn: () => void; zoomOut: () => void; resetZoom: () => void; fitAll: () => void }
      | undefined;

  return (
    <header className="editor-topbar">
      <button className="topbar-back" onClick={onBack} aria-label="Back to library">
        <Icon name="arrow-left" size={18} />
        <span>Library</span>
      </button>

      <div className="topbar-bookmark" aria-hidden="true">
        <Icon name="book" size={16} />
      </div>

      <input
        className="topbar-title"
        value={titleDraft}
        aria-label="Notebook title"
        onChange={(e) => setTitleDraft(e.target.value)}
        onBlur={() => onRename(titleDraft.trim() || 'Untitled')}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
      />

      <div className="topbar-spacer" />

      <div className="topbar-tool-switch" role="toolbar" aria-label="Canvas mode">
        <button className={activeTool === 'select' ? 'is-active' : ''} onClick={() => setTool('select')} title="Select">
          <Icon name="cursor" size={16} />
        </button>
        <button className={activeTool === 'draw' ? 'is-active' : ''} onClick={() => setTool('draw')} title="Draw">
          <Icon name="pen" size={16} />
        </button>
      </div>

      <div className="topbar-save">
        {saveStatus === 'saving' && <span className="save-status is-saving">Saving…</span>}
        {saveStatus === 'saved' && (
          <span className="save-status is-saved">
            <Icon name="check" size={13} /> Saved
          </span>
        )}
      </div>

      <div className="topbar-zoom">
        <button onClick={() => controls()?.zoomOut()} aria-label="Zoom out">
          <Icon name="zoom-out" size={16} />
        </button>
        <button className="zoom-pct" onClick={() => controls()?.resetZoom()}>
          {zoomPct}%
        </button>
        <button onClick={() => controls()?.zoomIn()} aria-label="Zoom in">
          <Icon name="zoom-in" size={16} />
        </button>
        <button className="fit-btn" onClick={() => controls()?.fitAll()}>
          <Icon name="maximize" size={14} /> Fit
        </button>
      </div>

      <div className="topbar-bg-picker" ref={bgPickerRef}>
        <button
          className={`topbar-more${bgPickerOpen ? ' is-active' : ''}`}
          aria-label="Change background"
          title="Background"
          onClick={() => setBgPickerOpen((v) => !v)}
        >
          <Icon name="swatch" size={18} />
        </button>
        {bgPickerOpen && (
          <div className="bg-picker-menu" role="menu" aria-label="Canvas background">
            {BACKGROUND_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`bg-picker-item${background === opt.value ? ' is-active' : ''}`}
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
    </header>
  );
}
