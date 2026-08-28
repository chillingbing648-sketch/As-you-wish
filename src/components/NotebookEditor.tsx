import { useEffect, useState } from 'react';
import { Canvas } from '../canvas/Canvas';
import { AddMenu, ContextToolbar } from '../canvas/ContextToolbar';
import { EditorTopBar } from './EditorTopBar';
import { useCanvasStore } from '../store/canvasStore';
import { useNotebookStore } from '../store/notebookStore';
import { getCanvasByNotebook } from '../lib/db';
import type { Notebook } from '../types';

interface Props {
  notebook: Notebook;
  onBack: () => void;
}

export function NotebookEditor({ notebook, onBack }: Props) {
  const [ready, setReady] = useState(false);
  const loadCanvas = useCanvasStore((s) => s.loadCanvas);
  const renameNotebook = useNotebookStore((s) => s.renameNotebook);

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
        // Center the world origin in the viewport so new notebooks don't
        // open with the canvas origin pinned to the top-left corner.
        camera: { x: window.innerWidth / 2, y: (window.innerHeight - 62) / 2, zoom: 1 },
      };
      await loadCanvas(notebook.id, seed);
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [notebook.id, loadCanvas]);

  const worldCenter = () => {
    const controls = (window as unknown as Record<string, unknown>).__canvasControls as
      | { getViewportCenterWorld: () => { x: number; y: number } }
      | undefined;
    if (controls) return controls.getViewportCenterWorld();
    // Fallback before Canvas has mounted its controls
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
      />
      <div className="editor-body">
        {ready ? (
          <>
            <Canvas />
            <ContextToolbar />
            <AddMenu worldCenter={worldCenter} />
          </>
        ) : (
          <div className="editor-loading">Opening notebook…</div>
        )}
      </div>
    </div>
  );
}
