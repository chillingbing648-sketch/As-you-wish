import { useCanvasStore } from '../store/canvasStore';
import type { DrawTool } from '../types';
import { Icon, type IconName } from '../components/Icon';

const DRAW_TOOLS: { id: DrawTool; label: string; icon: IconName; defaultWidth: number; defaultOpacity: number }[] = [
  { id: 'pencil', label: 'Pencil', icon: 'pencil', defaultWidth: 2, defaultOpacity: 0.85 },
  { id: 'ballpoint', label: 'Ballpoint', icon: 'pen', defaultWidth: 3, defaultOpacity: 0.95 },
  { id: 'fountain', label: 'Fountain Pen', icon: 'fountain-pen', defaultWidth: 5, defaultOpacity: 1 },
  { id: 'marker', label: 'Marker', icon: 'marker', defaultWidth: 8, defaultOpacity: 0.9 },
  { id: 'highlighter', label: 'Highlighter', icon: 'highlighter', defaultWidth: 20, defaultOpacity: 0.35 },
  { id: 'brush', label: 'Brush', icon: 'brush', defaultWidth: 12, defaultOpacity: 0.8 },
  { id: 'eraser', label: 'Eraser', icon: 'eraser', defaultWidth: 24, defaultOpacity: 1 },
];

const QUICK_INKS = [
  '#4A4046', '#29272A', '#D78C9F', '#B8A9D3', '#A9BEA9',
  '#F2DF9B', '#BCD7E8', '#E3A857', '#C46D5E', '#7C93B0',
];

interface DrawingPanelProps {
  onOpenColorStudio?: () => void;
}

export function DrawingPanel({ onOpenColorStudio }: DrawingPanelProps) {
  const setTool = useCanvasStore((s) => s.setTool);
  const drawSettings = useCanvasStore((s) => s.drawSettings);
  const setDrawSettings = useCanvasStore((s) => s.setDrawSettings);

  const handleToolSelect = (toolId: DrawTool) => {
    const preset = DRAW_TOOLS.find((t) => t.id === toolId);
    if (preset) {
      setDrawSettings({
        tool: toolId,
        strokeWidth: preset.defaultWidth,
        opacity: preset.defaultOpacity,
      });
    } else {
      setDrawSettings({ tool: toolId });
    }
  };

  return (
    <div className="drawing-panel" role="toolbar" aria-label="Drawing Tools">
      <div className="drawing-tools-row">
        {DRAW_TOOLS.map((t) => {
          const isActive = (drawSettings.tool || 'pencil') === t.id;
          return (
            <button
              key={t.id}
              className={`draw-tool-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => handleToolSelect(t.id)}
              title={t.label}
            >
              <Icon name={t.icon} size={16} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="ctx-divider" />

      {drawSettings.tool !== 'eraser' && (
        <>
          <div className="ctx-swatches">
            {QUICK_INKS.map((c) => (
              <button
                key={c}
                className={`ctx-swatch ${drawSettings.stroke === c ? 'is-active' : ''}`}
                style={{ background: c }}
                aria-label={`Ink color ${c}`}
                onClick={() => setDrawSettings({ stroke: c })}
              />
            ))}
          </div>

          <input
            type="color"
            className="ctx-color"
            title="Custom ink colour"
            value={drawSettings.stroke}
            onChange={(e) => setDrawSettings({ stroke: e.target.value })}
          />

          {onOpenColorStudio && (
            <button
              className="ctx-icon-btn"
              onClick={onOpenColorStudio}
              title="Open Color Studio"
            >
              <Icon name="palette" size={15} />
            </button>
          )}

          <div className="ctx-divider" />
        </>
      )}

      <label className="ctx-slider-label" title="Stroke width">
        <span className="ctx-slider-text">Size: {drawSettings.strokeWidth}px</span>
        <input
          type="range"
          min={1}
          max={drawSettings.tool === 'highlighter' || drawSettings.tool === 'eraser' ? 48 : 32}
          value={drawSettings.strokeWidth}
          onChange={(e) => setDrawSettings({ strokeWidth: Number(e.target.value) })}
        />
      </label>

      {drawSettings.tool !== 'eraser' && (
        <label className="ctx-slider-label" title="Opacity">
          <span className="ctx-slider-text">Opacity: {Math.round(drawSettings.opacity * 100)}%</span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={drawSettings.opacity}
            onChange={(e) => setDrawSettings({ opacity: Number(e.target.value) })}
          />
        </label>
      )}

      <button
        className={`ctx-chip ${drawSettings.smoothing ? 'is-active' : ''}`}
        onClick={() => setDrawSettings({ smoothing: !drawSettings.smoothing })}
        title="Smooth stroke curves automatically"
      >
        <span>Smooth: {drawSettings.smoothing ? 'On' : 'Off'}</span>
      </button>

      <div className="ctx-divider" />

      {/* Quick geometric shapes when in drawing mode */}
      <div className="drawing-quick-shapes">
        <button
          className="ctx-icon-btn"
          onClick={() => {
            const doc = useCanvasStore.getState().doc;
            const cx = doc ? -doc.camera.x / doc.camera.zoom : 0;
            const cy = doc ? -doc.camera.y / doc.camera.zoom : 0;
            useCanvasStore.getState().addObject({
              id: crypto.randomUUID(),
              type: 'shape',
              x: cx - 110,
              y: cy - 12,
              width: 220,
              height: 24,
              rotation: 0,
              zIndex: 0,
              locked: false,
              hidden: false,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              data: {
                shapeType: 'line',
                fill: drawSettings.stroke,
                strokeColor: drawSettings.stroke,
                strokeWidth: drawSettings.strokeWidth,
                opacity: drawSettings.opacity,
              },
            });
          }}
          title="Insert Straight Line"
        >
          <Icon name="minus" size={15} />
        </button>
        <button
          className="ctx-icon-btn"
          onClick={() => {
            const doc = useCanvasStore.getState().doc;
            const cx = doc ? -doc.camera.x / doc.camera.zoom : 0;
            const cy = doc ? -doc.camera.y / doc.camera.zoom : 0;
            useCanvasStore.getState().addObject({
              id: crypto.randomUUID(),
              type: 'shape',
              x: cx - 110,
              y: cy - 18,
              width: 220,
              height: 36,
              rotation: 0,
              zIndex: 0,
              locked: false,
              hidden: false,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              data: {
                shapeType: 'arrow',
                fill: drawSettings.stroke,
                strokeColor: drawSettings.stroke,
                strokeWidth: drawSettings.strokeWidth,
                opacity: drawSettings.opacity,
              },
            });
          }}
          title="Insert Arrow"
        >
          <Icon name="arrow-right" size={15} />
        </button>
      </div>

      <div className="ctx-divider" />

      <button className="ctx-done" onClick={() => setTool('select')}>
        <Icon name="check" size={15} /> Done
      </button>

    </div>
  );
}
