import type { ImageObjectData, ImageFrame, ImageFilter } from '../types';
import { Icon } from '../components/Icon';

interface ImageEditPanelProps {
  data: ImageObjectData;
  onChange: (patch: Partial<ImageObjectData>) => void;
  onClose: () => void;
}

const FRAMES: { value: ImageFrame; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'polaroid', label: 'Polaroid' },
  { value: 'paper', label: 'Paper' },
  { value: 'tape', label: 'Tape' },
  { value: 'film', label: 'Film' },
  { value: 'torn', label: 'Torn' },
];

const FILTERS: { value: ImageFilter; label: string }[] = [
  { value: 'none', label: 'Original' },
  { value: 'warm', label: 'Warm Glow' },
  { value: 'cool', label: 'Cool Mist' },
  { value: 'fade', label: 'Vintage Fade' },
  { value: 'vivid', label: 'Vivid' },
  { value: 'grayscale', label: 'Mono / B&W' },
];

export function ImageEditPanel({ data, onChange, onClose }: ImageEditPanelProps) {
  const frame = data.frame || 'none';
  const filter = data.filter || 'none';
  const brightness = data.brightness ?? 100;
  const contrast = data.contrast ?? 100;
  const saturation = data.saturation ?? 100;
  const opacity = data.opacity ?? 1;
  const shadow = data.shadow ?? false;
  const flipH = data.flipH ?? false;
  const flipV = data.flipV ?? false;
  const caption = data.caption || '';

  return (
    <div className="image-edit-panel" role="dialog" aria-label="Image Studio">
      <div className="image-edit-header">
        <div className="image-edit-title">
          <Icon name="sliders" size={16} />
          <span>Image Studio</span>
        </div>
        <button className="icon-btn-sm" onClick={onClose} aria-label="Close">
          <Icon name="x" size={15} />
        </button>
      </div>

      {/* Frame Selection */}
      <div className="image-edit-section">
        <label className="image-edit-label">Frame Style</label>
        <div className="image-chip-grid">
          {FRAMES.map((f) => (
            <button
              key={f.value}
              className={`image-style-chip ${frame === f.value ? 'is-active' : ''}`}
              onClick={() => onChange({ frame: f.value })}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {frame === 'polaroid' && (
        <div className="image-edit-section">
          <label className="image-edit-label">Polaroid Caption</label>
          <input
            className="image-caption-input"
            type="text"
            placeholder="Write a sweet memory..."
            value={caption}
            onChange={(e) => onChange({ caption: e.target.value })}
          />
        </div>
      )}

      {/* Preset Filters */}
      <div className="image-edit-section">
        <label className="image-edit-label">Artistic Filters</label>
        <div className="image-chip-grid">
          {FILTERS.map((flt) => (
            <button
              key={flt.value}
              className={`image-style-chip ${filter === flt.value ? 'is-active' : ''}`}
              onClick={() => onChange({ filter: flt.value })}
            >
              {flt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transform & Effects */}
      <div className="image-edit-section">
        <label className="image-edit-label">Orientation & Shadows</label>
        <div className="image-btn-row">
          <button
            className={`ctx-chip ${flipH ? 'is-active' : ''}`}
            onClick={() => onChange({ flipH: !flipH })}
            title="Flip Horizontally"
          >
            <Icon name="flip-h" size={14} />
            <span>Flip H</span>
          </button>
          <button
            className={`ctx-chip ${flipV ? 'is-active' : ''}`}
            onClick={() => onChange({ flipV: !flipV })}
            title="Flip Vertically"
          >
            <Icon name="flip-v" size={14} />
            <span>Flip V</span>
          </button>
          <button
            className={`ctx-chip ${shadow ? 'is-active' : ''}`}
            onClick={() => onChange({ shadow: !shadow })}
            title="Toggle Drop Shadow"
          >
            <span>Shadow: {shadow ? 'On' : 'Off'}</span>
          </button>
        </div>
      </div>

      {/* Sliders: Brightness, Contrast, Saturation, Opacity */}
      <div className="image-edit-section">
        <label className="image-edit-label">Fine Adjustments</label>

        <div className="image-slider-row">
          <span>Brightness</span>
          <input
            type="range"
            min={40}
            max={160}
            value={brightness}
            onChange={(e) => onChange({ brightness: Number(e.target.value) })}
          />
          <small>{brightness}%</small>
        </div>

        <div className="image-slider-row">
          <span>Contrast</span>
          <input
            type="range"
            min={40}
            max={160}
            value={contrast}
            onChange={(e) => onChange({ contrast: Number(e.target.value) })}
          />
          <small>{contrast}%</small>
        </div>

        <div className="image-slider-row">
          <span>Saturation</span>
          <input
            type="range"
            min={0}
            max={200}
            value={saturation}
            onChange={(e) => onChange({ saturation: Number(e.target.value) })}
          />
          <small>{saturation}%</small>
        </div>

        <div className="image-slider-row">
          <span>Opacity</span>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => onChange({ opacity: Number(e.target.value) })}
          />
          <small>{Math.round(opacity * 100)}%</small>
        </div>

        <button
          className="image-reset-btn"
          onClick={() => onChange({ brightness: 100, contrast: 100, saturation: 100, opacity: 1, filter: 'none' })}
        >
          Reset adjustments
        </button>
      </div>
    </div>
  );
}
