import { useEffect, useState } from 'react';
import { Canvas } from '../canvas/Canvas';
import { UnifiedTopToolbar } from '../canvas/ContextToolbar';
import { LayerPanel } from '../canvas/LayerPanel';
import { QuickCreate } from '../canvas/QuickCreate';
import { TemplateGallery } from '../canvas/TemplateGallery';
import { DecorationsDrawer } from '../canvas/DecorationsDrawer';
import { EmojiStudio } from '../canvas/EmojiStudio';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { EditorTopBar } from './EditorTopBar';
import { useCanvasStore } from '../store/canvasStore';
import { useNotebookStore } from '../store/notebookStore';
import { usePrefsStore } from '../store/prefsStore';
import { getCanvasByNotebook } from '../lib/db';
import type { Notebook } from '../types';

interface Props {
  notebook: Notebook;
  onBack: () => void;
}

export function NotebookEditor({ notebook, onBack }: Props) {
  const [ready, setReady] = useState(false);
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [decorationsOpen, setDecorationsOpen] = useState(false);
  const [emojiStudioOpen, setEmojiStudioOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const loadCanvas = useCanvasStore((s) => s.loadCanvas);
  const renameNotebook = useNotebookStore((s) => s.renameNotebook);
  const loadPrefs = usePrefsStore((s) => s.load);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    (async () => {
      const existing = await getCanvasByNotebook(notebook.id);
      const seed = existing ?? {
        id: crypto.randomUUID(),
        notebookId: notebook.id,
        objects: {},
        objectOrder: [],
        background: 'paper' as const,
        camera: { x: window.innerWidth / 2, y: (window.innerHeight - 62) / 2, zoom: 1 },
      };
      await loadCanvas(notebook.id, seed);
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [notebook.id, loadCanvas]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isInput) return;

      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;

      // Quick Create (`/` or `Ctrl/Cmd + K`)
      if (e.key === '/' || (mod && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setQuickCreateOpen((v) => !v);
        return;
      }

      // Help modal (`?` or `Shift + /`)
      if (e.key === '?' && !mod) {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
        return;
      }

      // Undo (`Ctrl/Cmd + Z`)
      if (mod && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        useCanvasStore.getState().undo();
        return;
      }

      // Redo (`Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y`)
      if ((mod && e.shiftKey && e.key.toLowerCase() === 'z') || (mod && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        useCanvasStore.getState().redo();
        return;
      }

      const selectedIds = useCanvasStore.getState().selectedIds;

      // Copy (`Ctrl/Cmd + C`)
      if (mod && e.key.toLowerCase() === 'c') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          useCanvasStore.getState().copyObjects(selectedIds);
        }
        return;
      }

      // Paste (`Ctrl/Cmd + V`)
      if (mod && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        useCanvasStore.getState().pasteObjects();
        return;
      }

      // Cut (`Ctrl/Cmd + X`)
      if (mod && e.key.toLowerCase() === 'x') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          useCanvasStore.getState().cutObjects(selectedIds);
        }
        return;
      }

      // Duplicate (`Ctrl/Cmd + D`)
      if (mod && e.key.toLowerCase() === 'd') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          useCanvasStore.getState().duplicateObjects(selectedIds);
        }
        return;
      }

      // Group (`Ctrl/Cmd + G`)
      if (mod && !e.shiftKey && e.key.toLowerCase() === 'g') {
        if (selectedIds.length > 1) {
          e.preventDefault();
          useCanvasStore.getState().groupObjects(selectedIds);
        }
        return;
      }

      // Ungroup (`Ctrl/Cmd + Shift + G`)
      if (mod && e.shiftKey && e.key.toLowerCase() === 'g') {
        const doc = useCanvasStore.getState().doc;
        if (doc && selectedIds.length > 0) {
          const first = doc.objects[selectedIds[0]];
          if (first?.groupId) {
            e.preventDefault();
            useCanvasStore.getState().ungroupObjects(first.groupId);
          }
        }
        return;
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          useCanvasStore.getState().deleteObjects(selectedIds);
        }
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        useCanvasStore.getState().clearSelection();
        setQuickCreateOpen(false);
        setShortcutsOpen(false);
        setDecorationsOpen(false);
        setEmojiStudioOpen(false);
        setTemplateGalleryOpen(false);
        return;
      }

      // Tool switches
      if (e.key.toLowerCase() === 's' && !mod) {
        useCanvasStore.getState().setTool('select');
        return;
      }
      if (e.key.toLowerCase() === 'd' && !mod) {
        useCanvasStore.getState().setTool('draw');
        return;
      }

      // Zoom
      const controls = (window as unknown as Record<string, unknown>).__canvasControls as
        | { zoomIn: () => void; zoomOut: () => void; resetZoom: () => void }
        | undefined;
      if (e.key === '+' || e.key === '=') {
        controls?.zoomIn();
        return;
      }
      if (e.key === '-') {
        controls?.zoomOut();
        return;
      }
      if (e.key === '0' && !mod) {
        controls?.resetZoom();
        return;
      }

      // Arrow keys to nudge selected objects
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && selectedIds.length > 0) {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 5;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;

        const doc = useCanvasStore.getState().doc;
        if (!doc) return;
        selectedIds.forEach((id) => {
          const obj = doc.objects[id];
          if (obj && !obj.locked) {
            useCanvasStore.getState().updateObject(id, { x: obj.x + dx, y: obj.y + dy });
          }
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const worldCenter = () => {
    const controls = (window as unknown as Record<string, unknown>).__canvasControls as
      | { getViewportCenterWorld: () => { x: number; y: number } }
      | undefined;
    if (controls) return controls.getViewportCenterWorld();
    const doc = useCanvasStore.getState().doc;
    if (!doc) return { x: 0, y: 0 };
    return { x: -doc.camera.x / doc.camera.zoom, y: -doc.camera.y / doc.camera.zoom };
  };

  return (
    <div className="editor-page">
      <EditorTopBar
        notebook={notebook}
        onBack={onBack}
        onRename={(title) => renameNotebook(notebook.id, title)}
        layerPanelOpen={layerPanelOpen}
        onToggleLayerPanel={() => setLayerPanelOpen((v) => !v)}
        onOpenQuickCreate={() => setQuickCreateOpen(true)}
        onShowShortcuts={() => setShortcutsOpen(true)}
      />
      {ready && (
        <UnifiedTopToolbar
          worldCenter={worldCenter}
          layerPanelOpen={layerPanelOpen}
          onToggleLayerPanel={() => setLayerPanelOpen((v) => !v)}
          onOpenQuickCreate={() => setQuickCreateOpen(true)}
          onShowShortcuts={() => setShortcutsOpen(true)}
        />
      )}
      <div className="editor-body">
        {ready ? (
          <>
            <Canvas />
            {layerPanelOpen && <LayerPanel onClose={() => setLayerPanelOpen(false)} />}

            {quickCreateOpen && (
              <QuickCreate
                onClose={() => setQuickCreateOpen(false)}
                worldCenter={worldCenter}
                onOpenTemplates={() => setTemplateGalleryOpen(true)}
                onOpenEmoji={() => setEmojiStudioOpen(true)}
                onOpenDecorations={() => setDecorationsOpen(true)}
              />
            )}
            {templateGalleryOpen && (
              <TemplateGallery
                onClose={() => setTemplateGalleryOpen(false)}
                worldCenter={worldCenter}
              />
            )}
            {decorationsOpen && (
              <DecorationsDrawer
                onClose={() => setDecorationsOpen(false)}
                worldCenter={worldCenter}
              />
            )}
            {emojiStudioOpen && (
              <EmojiStudio
                onClose={() => setEmojiStudioOpen(false)}
                worldCenter={worldCenter}
              />
            )}
            {shortcutsOpen && (
              <KeyboardShortcutsModal
                onClose={() => setShortcutsOpen(false)}
              />
            )}
          </>
        ) : (
          <div className="editor-loading">Opening notebook…</div>
        )}
      </div>
    </div>
  );
}
