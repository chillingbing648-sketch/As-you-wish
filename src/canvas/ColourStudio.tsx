import { useState } from 'react';
import { usePrefsStore } from '../store/prefsStore';
import { Icon } from '../components/Icon';

import type { HighlightStyle } from '../types';

export interface ColourStudioProps {
  title?: string;
  currentColor: string;
  onChangeColor: (color: string) => void;
  showHighlightStyles?: boolean;
  currentHighlightStyle?: HighlightStyle;
  onChangeHighlightStyle?: (style: HighlightStyle) => void;
  opacity?: number;
  onChangeOpacity?: (opacity: number) => void;
  onClose: () => void;
}

const HIGHLIGHT_STYLE_OPTIONS: { id: HighlightStyle; label: string }[] = [
  { id: 'soft', label: 'Soft Wash' },
  { id: 'marker', label: 'Marker' },
  { id: 'transparent', label: 'Transparent' },
  { id: 'underline', label: 'Underline' },
  { id: 'custom', label: 'Custom' },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }
  return null;
}

const AS_YOU_WISH_PALETTES = [
  {
    name: 'Cream',
    colors: ['#FBF8F4', '#F7F0E8', '#EEDFC8', '#D8C7B5', '#8C7764', '#4A4046'],
  },
  {
    name: 'Blush',
    colors: ['#FFF0F3', '#FAD2E1', '#F1D6DE', '#D78C9F', '#B5657A', '#7A3546'],
  },
  {
    name: 'Lavender',
    colors: ['#F8F5FC', '#EEE9F7', '#E4DCF2', '#B8A9D3', '#8F7BB5', '#554273'],
  },
  {
    name: 'Sage',
    colors: ['#F4F7F3', '#E9F0E7', '#DCE7DC', '#A9BEA9', '#7D997D', '#466146'],
  },
  {
    name: 'Butter',
    colors: ['#FDFBF0', '#FDF7DC', '#F8EFC9', '#F2DF9B', '#D4BA5B', '#8C7326'],
  },
  {
    name: 'Sky',
    colors: ['#F2F8FC', '#E8F2F8', '#E1EDF4', '#BCD7E8', '#85B2D0', '#426E8E'],
  },
  {
    name: 'Peach',
    colors: ['#FFF5F0', '#FFE5D9', '#FDD6C6', '#F4A28C', '#CC6E56', '#873B28'],
  },
  {
    name: 'Neutral',
    colors: ['#FFFDFB', '#F5EFE8', '#D8CFC7', '#A59BA0', '#756D72', '#29272A'],
  },
  {
    name: 'Dark',
    colors: ['#5C5056', '#4A4046', '#3B3237', '#2F272C', '#201A1E', '#120F11'],
  },
];

export function ColourStudio({
  title = 'Colour Studio',
  currentColor,
  onChangeColor,
  showHighlightStyles,
  currentHighlightStyle = 'soft',
  onChangeHighlightStyle,
  opacity,
  onChangeOpacity,
  onClose,
}: ColourStudioProps) {
  const [hexInput, setHexInput] = useState(currentColor.startsWith('#') ? currentColor : '#D78C9F');
  const [activePalette, setActivePalette] = useState('Blush');

  const prefs = usePrefsStore((s) => s.prefs);
  const addRecentColor = usePrefsStore((s) => s.addRecentColor);
  const toggleFavoriteColor = usePrefsStore((s) => s.toggleFavoriteColor);

  const recentColors = prefs.recentColors || [];
  const favoriteColors = prefs.favoriteColors || [];

  const handlePick = (c: string) => {
    setHexInput(c);
    addRecentColor(c);
    onChangeColor(c);
  };

  const handleHexChange = (val: string) => {
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
      addRecentColor(val);
      onChangeColor(val);
    }
  };

  const isCurrentFavorite = favoriteColors.includes(hexInput);
  const rgb = hexToRgb(hexInput) || { r: 215, g: 140, b: 159 };

  return (
    <div className="colour-studio-modal" role="dialog" aria-label="Colour Studio">
      <div className="colour-studio-header">
        <div className="colour-studio-title">
          <Icon name="palette" size={16} />
          <span>{title}</span>
        </div>
        <button className="icon-btn-sm" onClick={onClose} aria-label="Close">
          <Icon name="x" size={15} />
        </button>
      </div>

      {/* Primary Pickers & Hex */}
      <div className="colour-primary-section">
        <div className="colour-preview-block" style={{ background: hexInput }} />
        <div className="colour-picker-inputs">
          <input
            type="color"
            className="colour-picker-native"
            value={hexInput.startsWith('#') && hexInput.length === 7 ? hexInput : '#D78C9F'}
            onChange={(e) => handlePick(e.target.value)}
          />
          <div className="colour-hex-field">
            <span>HEX</span>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="#D78C9F"
              maxLength={9}
            />
          </div>
          <button
            className={`colour-fav-toggle ${isCurrentFavorite ? 'is-active' : ''}`}
            onClick={() => toggleFavoriteColor(hexInput)}
            title={isCurrentFavorite ? 'Remove from favorites' : 'Save as favorite color'}
          >
            <Icon name="heart" size={15} />
          </button>
        </div>
      </div>

      <div className="colour-rgb-readout">
        <span>RGB: ({rgb.r}, {rgb.g}, {rgb.b})</span>
      </div>

      {/* Opacity Slider */}
      {opacity !== undefined && onChangeOpacity && (
        <div className="colour-section">
          <div className="colour-slider-row">
            <span className="colour-section-title">Opacity: {Math.round(opacity * 100)}%</span>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(e) => onChangeOpacity(Number(e.target.value))}
            />
          </div>
        </div>
      )}

      {/* Highlight Styles Section (when in highlight mode) */}
      {showHighlightStyles && onChangeHighlightStyle && (
        <div className="colour-section">
          <div className="colour-section-title">Highlight Style</div>
          <div className="colour-highlight-style-row">
            {HIGHLIGHT_STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`colour-style-btn ${currentHighlightStyle === opt.id ? 'is-active' : ''}`}
                onClick={() => onChangeHighlightStyle(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}


      {/* Favorites */}
      {favoriteColors.length > 0 && (
        <div className="colour-section">
          <div className="colour-section-title">Saved Swatches ♡</div>
          <div className="colour-swatch-grid">
            {favoriteColors.map((c) => (
              <button
                key={c}
                className={`colour-swatch-circle ${currentColor === c ? 'is-selected' : ''}`}
                style={{ background: c }}
                onClick={() => handlePick(c)}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recents */}
      {recentColors.length > 0 && (
        <div className="colour-section">
          <div className="colour-section-title">Recent Colours</div>
          <div className="colour-swatch-grid">
            {recentColors.slice(0, 14).map((c) => (
              <button
                key={c}
                className={`colour-swatch-circle ${currentColor === c ? 'is-selected' : ''}`}
                style={{ background: c }}
                onClick={() => handlePick(c)}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      {/* Curated AS YOU WISH Palettes */}
      <div className="colour-section">
        <div className="colour-section-title">AS YOU WISH Palettes</div>
        <div className="colour-palette-tabs">
          {AS_YOU_WISH_PALETTES.map((p) => (
            <button
              key={p.name}
              className={`palette-tab-btn ${activePalette === p.name ? 'is-active' : ''}`}
              onClick={() => setActivePalette(p.name)}
            >
              {p.name}
            </button>
          ))}
        </div>

        {AS_YOU_WISH_PALETTES.filter((p) => p.name === activePalette).map((p) => (
          <div key={p.name} className="colour-palette-row">
            {p.colors.map((c) => (
              <button
                key={c}
                className={`colour-palette-swatch ${currentColor === c ? 'is-selected' : ''}`}
                style={{ background: c }}
                onClick={() => handlePick(c)}
                title={`${p.name} · ${c}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
