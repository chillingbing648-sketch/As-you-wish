import { useEffect, useRef, useState } from "react";
import { useCanvasStore } from "../store/canvasStore";
import type { CanvasBackground, Notebook } from "../types";
import { Icon } from "./Icon";

interface Props {
  notebook: Notebook;
  onBack: () => void;
  onRename: (title: string) => void;
  layerPanelOpen?: boolean;
  onToggleLayerPanel?: () => void;
  onOpenQuickCreate?: () => void;
  onShowShortcuts?: () => void;
}

const BACKGROUND_OPTIONS: { value: CanvasBackground; label: string; swatch: string }[] = [
  { value: "paper", label: "Paper", swatch: "#F7F0E8" },
  { value: "blank", label: "Blank", swatch: "#FBF8F4" },
  { value: "dotted", label: "Dotted", swatch: "#F5EFE8" },
  { value: "grid", label: "Grid", swatch: "#F5EFE8" },
  { value: "lined", label: "Lined", swatch: "#F5EFE8" },
  { value: "pink", label: "Blush", swatch: "#F9E9ED" },
  { value: "lavender", label: "Lavender", swatch: "#EEE9F7" },
  { value: "sage", label: "Sage", swatch: "#E9F0E7" },
  { value: "sky", label: "Sky", swatch: "#E8F2F8" },
];

export function EditorTopBar({ notebook, onBack, onRename, layerPanelOpen, onToggleLayerPanel, onOpenQuickCreate, onShowShortcuts }: Props) {
  const saveStatus = useCanvasStore((s) => s.saveStatus);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setTool = useCanvasStore((s) => s.setTool);
  const background = useCanvasStore((s) => s.doc?.background);
  const setBackground = useCanvasStore((s) => s.setBackground);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const historyIndex = useCanvasStore((s) => s.historyIndex);
  const history = useCanvasStore((s) => s.history);

  const [titleDraft, setTitleDraft] = useState(notebook.title);
  const [zoomPct, setZoomPct] = useState(100);
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const bgPickerRef = useRef<HTMLDivElement | null>(null);
  const moreRef = useRef<HTMLDivElement | null>(null);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => setTitleDraft(notebook.title), [notebook.title]);

  useEffect(() => {
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
    if (!bgPickerOpen && !moreOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (bgPickerRef.current && !bgPickerRef.current.contains(e.target as Node)) setBgPickerOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("pointerdown", onClickOutside);
    return () => document.removeEventListener("pointerdown", onClickOutside);
  }, [bgPickerOpen, moreOpen]);

  const controls = () =>
    (window as unknown as Record<string, unknown>).__canvasControls as
      | { zoomIn: () => void; zoomOut: () => void; resetZoom: () => void; fitAll: () => void }
      | undefined;

  return (
    <header className="editor-topbar">
      <button className="topbar-back" onClick={onBack} aria-label="Back to library">
        <Icon name="arrow-left" size={16} />
        <span>Library</span>
      </button>

      <div className="topbar-sep" />

      <div className="topbar-bookmark" aria-hidden="true">
        <Icon name="book" size={13} />
      </div>

      <input
        className="topbar-title"
        value={titleDraft}
        aria-label="Notebook title"
        onChange={(e) => setTitleDraft(e.target.value)}
        onBlur={() => onRename(titleDraft.trim() || "Untitled")}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      />

      <div className="topbar-save">
        {saveStatus === "saving" && (
          <span className="save-status is-saving">
            <span className="save-dot-pulse" />
            Saving
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="save-status is-saved">
            <Icon name="check" size={11} /> Saved
          </span>
        )}
      </div>

      <div className="topbar-spacer" />

      <div className="topbar-tool-switch" role="toolbar" aria-label="Canvas mode">
        <button className={activeTool === "select" ? "is-active" : ""} onClick={() => setTool("select")} title="Select (S)">
          <Icon name="cursor" size={15} />
        </button>
        <button className={activeTool === "draw" ? "is-active" : ""} onClick={() => setTool("draw")} title="Draw (D)">
          <Icon name="pen" size={15} />
        </button>
      </div>

      <div className="topbar-sep" />

      <div className="topbar-history">
        <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo" className="topbar-hist-btn">
          <Icon name="undo" size={15} />
        </button>
        <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo" className="topbar-hist-btn">
          <Icon name="redo" size={15} />
        </button>
      </div>

      <div className="topbar-sep" />

      <div className="topbar-zoom">
        <button onClick={() => controls()?.zoomOut()} aria-label="Zoom out" title="Zoom out (-)">
          <Icon name="zoom-out" size={15} />
        </button>
        <button className="zoom-pct" onClick={() => controls()?.resetZoom()} title="Reset zoom (0)">
          {zoomPct}%
        </button>
        <button onClick={() => controls()?.zoomIn()} aria-label="Zoom in" title="Zoom in (+)">
          <Icon name="zoom-in" size={15} />
        </button>
      </div>

      <div className="topbar-sep" />

      {onOpenQuickCreate && (
        <button className="topbar-more" onClick={onOpenQuickCreate} title="Quick create (/ or Ctrl+K)">
          <Icon name="plus" size={15} />
          <span className="topbar-btn-label">Create</span>
        </button>
      )}

      {onToggleLayerPanel && (
        <button className={`topbar-more${layerPanelOpen ? " is-active" : ""}`} onClick={onToggleLayerPanel} title="Layers & Objects">
          <Icon name="layers" size={15} />
          <span className="topbar-btn-label">Layers</span>
        </button>
      )}

      <div className="topbar-bg-picker" ref={bgPickerRef}>
        <button className={`topbar-more${bgPickerOpen ? " is-active" : ""}`} onClick={() => setBgPickerOpen((v) => !v)} title="Canvas background">
          <Icon name="swatch" size={16} />
        </button>
        {bgPickerOpen && (
          <div className="bg-picker-menu" role="menu">
            <div className="bg-picker-title">Canvas</div>
            {BACKGROUND_OPTIONS.map((opt) => (
              <button key={opt.value} className={`bg-picker-item${background === opt.value ? " is-active" : ""}`}
                onClick={() => { setBackground(opt.value); setBgPickerOpen(false); }}>
                <span className="bg-picker-swatch" style={{ background: opt.swatch }} />
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="topbar-more-wrap" ref={moreRef}>
        <button className={`topbar-more${moreOpen ? " is-active" : ""}`} onClick={() => setMoreOpen((v) => !v)} title="More options">
          <Icon name="more-horizontal" size={16} />
        </button>
        {moreOpen && (
          <div className="more-menu" role="menu">
            <div className="more-menu-title">Options</div>
            {onShowShortcuts && (
              <button className="more-menu-item" onClick={() => { setMoreOpen(false); onShowShortcuts(); }}>
                <Icon name="keyboard" size={14} />
                Keyboard shortcuts
              </button>
            )}
            <button className="more-menu-item" onClick={() => { controls()?.fitAll(); setMoreOpen(false); }}>
              <Icon name="maximize" size={14} />
              Fit all objects
            </button>
            <div className="more-menu-sep" />
            <button className="more-menu-item" onClick={onBack}>
              <Icon name="arrow-left" size={14} />
              Back to Library
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
