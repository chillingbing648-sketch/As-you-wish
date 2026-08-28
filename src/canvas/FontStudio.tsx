import { useState, useMemo, useEffect } from 'react';
import { FONT_CATALOG, FONT_CATEGORIES, type FontCategory, type FontEntry } from '../lib/fontCatalog';
import { loadFont } from '../lib/fontLoader';
import { usePrefsStore } from '../store/prefsStore';
import { Icon } from '../components/Icon';

import type { HeadingStyle } from '../types';

interface FontStudioProps {
  currentFont: string;
  onSelectFont: (fontCss: string, fontName: string) => void;
  onApplyHeadingStyle?: (heading: HeadingStyle) => void;
  onClose: () => void;
}

const HEADING_PRESETS: { id: HeadingStyle; label: string; preview: string }[] = [
  { id: 'h1', label: 'H1 Display', preview: 'Header One' },
  { id: 'h2', label: 'H2 Title', preview: 'Section Title' },
  { id: 'h3', label: 'H3 Subtitle', preview: 'Subtitle Header' },
  { id: 'body', label: 'Body Text', preview: 'Clean body paragraph' },
  { id: 'quote', label: 'Pull Quote', preview: '“Notable thought”' },
  { id: 'handwritten', label: 'Handwritten', preview: 'little note ✦' },
  { id: 'caption', label: 'Caption', preview: 'CAPTION / TAG' },
];

export function FontStudio({ currentFont, onSelectFont, onApplyHeadingStyle, onClose }: FontStudioProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<FontCategory | 'All' | 'Favorites' | 'Recents'>('All');

  const fontFavorites = usePrefsStore((s) => s.prefs.fontFavorites);
  const fontRecents = usePrefsStore((s) => s.prefs.fontRecents);
  const toggleFontFavorite = usePrefsStore((s) => s.toggleFontFavorite);
  const addFontRecent = usePrefsStore((s) => s.addFontRecent);


  // Filter fonts
  const filteredFonts = useMemo(() => {
    let list = FONT_CATALOG;
    if (activeCategory === 'Favorites') {
      list = list.filter((f) => fontFavorites.includes(f.name));
    } else if (activeCategory === 'Recents') {
      list = list.filter((f) => fontRecents.includes(f.name));
    } else if (activeCategory !== 'All') {
      list = list.filter((f) => f.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
    }
    return list;
  }, [search, activeCategory, fontFavorites, fontRecents]);

  // Pre-load visible fonts on list change
  useEffect(() => {
    filteredFonts.slice(0, 15).forEach((f) => {
      if (f.slug) loadFont(f.slug);
    });
  }, [filteredFonts]);

  const handleSelect = (font: FontEntry) => {
    if (font.slug) {
      loadFont(font.slug);
    }
    addFontRecent(font.name);
    onSelectFont(font.cssFamily, font.name);
  };

  return (
    <div className="font-studio-modal" role="dialog" aria-label="Font Studio">
      <div className="font-studio-header">
        <div className="font-studio-title">
          <Icon name="font" size={16} />
          <span>Font Studio</span>
        </div>
        <button className="icon-btn-sm" onClick={onClose} aria-label="Close">
          <Icon name="x" size={15} />
        </button>
      </div>

      <div className="font-studio-search-bar">
        <Icon name="search" size={15} />
        <input
          type="text"
          placeholder="Search 60+ fonts by name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        {search && (
          <button className="search-clear-btn" onClick={() => setSearch('')}>
            <Icon name="x" size={13} />
          </button>
        )}
      </div>

      {onApplyHeadingStyle && (
        <div className="font-studio-heading-row">
          <span className="font-heading-row-label">Presets:</span>
          {HEADING_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className="font-heading-chip"
              onClick={() => onApplyHeadingStyle(preset.id)}
              title={preset.preview}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      <div className="font-studio-categories">

        <button
          className={`font-cat-chip ${activeCategory === 'All' ? 'is-active' : ''}`}
          onClick={() => setActiveCategory('All')}
        >
          All
        </button>
        {fontFavorites.length > 0 && (
          <button
            className={`font-cat-chip ${activeCategory === 'Favorites' ? 'is-active' : ''}`}
            onClick={() => setActiveCategory('Favorites')}
          >
            ★ Favorites
          </button>
        )}
        {fontRecents.length > 0 && (
          <button
            className={`font-cat-chip ${activeCategory === 'Recents' ? 'is-active' : ''}`}
            onClick={() => setActiveCategory('Recents')}
          >
            🕒 Recents
          </button>
        )}
        {FONT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`font-cat-chip ${activeCategory === cat ? 'is-active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="font-studio-list">
        {filteredFonts.length === 0 ? (
          <div className="font-studio-empty">
            <span>No fonts found</span>
            <small>Try another search or category</small>
          </div>
        ) : (
          filteredFonts.map((font) => {
            const isFav = fontFavorites.includes(font.name);
            const isSelected = currentFont.includes(font.name);

            return (
              <div
                key={font.name}
                className={`font-studio-item ${isSelected ? 'is-selected' : ''}`}
                onClick={() => handleSelect(font)}
                onMouseEnter={() => {
                  if (font.slug) loadFont(font.slug);
                }}
              >
                <div className="font-item-meta">
                  <span className="font-item-name">{font.name}</span>
                  <span className="font-item-cat">{font.category}</span>
                </div>
                <div className="font-item-preview" style={{ fontFamily: font.cssFamily }}>
                  The quick brown fox jumps ✦
                </div>
                <button
                  className={`font-fav-btn ${isFav ? 'is-active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFontFavorite(font.name);
                  }}
                  title={isFav ? 'Remove favorite' : 'Add to favorites'}
                >
                  <Icon name="star" size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
