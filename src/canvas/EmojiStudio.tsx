import { useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import type { CanvasObject } from '../types';
import { Icon } from '../components/Icon';

interface Props {
  onClose: () => void;
  worldCenter: () => { x: number; y: number };
}

type EmojiCat = 'Mood' | 'Faces' | 'Hearts' | 'Nature' | 'Food' | 'Study' | 'Objects' | 'Travel' | 'Symbols';

const EMOJI_CATEGORIES: EmojiCat[] = [
  'Mood',
  'Faces',
  'Hearts',
  'Nature',
  'Food',
  'Study',
  'Objects',
  'Travel',
  'Symbols',
];

const MOOD_BAR = ['♡', '✦', '☆', '🎀', '🌸', '🫧', '☁️', '🧸', '📚', '✎', '💌', '🦋', '🍓', '☕', '✨', '🤍'];

const EMOJI_CATALOG: { symbol: string; name: string; category: EmojiCat }[] = [
  // Faces
  { symbol: '🥰', name: 'Loving Face', category: 'Faces' },
  { symbol: '🥹', name: 'Pookie Eyes', category: 'Faces' },
  { symbol: '☺️', name: 'Warm Smile', category: 'Faces' },
  { symbol: '🌸', name: 'Blossom Face', category: 'Faces' },
  { symbol: '😌', name: 'Peaceful', category: 'Faces' },
  { symbol: '🥳', name: 'Celebration', category: 'Faces' },
  { symbol: '😇', name: 'Angel', category: 'Faces' },
  { symbol: '🥺', name: 'Pleading', category: 'Faces' },
  { symbol: '😋', name: 'Yum', category: 'Faces' },
  { symbol: '😴', name: 'Sleepy', category: 'Faces' },
  { symbol: '🤗', name: 'Hug', category: 'Faces' },
  { symbol: '🤩', name: 'Star Eyes', category: 'Faces' },

  // Hearts
  { symbol: '♡', name: 'Heart Outline', category: 'Hearts' },
  { symbol: '💖', name: 'Sparkle Heart', category: 'Hearts' },
  { symbol: '💗', name: 'Growing Heart', category: 'Hearts' },
  { symbol: '💓', name: 'Beating Heart', category: 'Hearts' },
  { symbol: '💞', name: 'Revolving Hearts', category: 'Hearts' },
  { symbol: '💕', name: 'Two Hearts', category: 'Hearts' },
  { symbol: '🤍', name: 'Pure White Heart', category: 'Hearts' },
  { symbol: '🤎', name: 'Cozy Brown Heart', category: 'Hearts' },
  { symbol: '💜', name: 'Lavender Heart', category: 'Hearts' },
  { symbol: '💚', name: 'Sage Green Heart', category: 'Hearts' },
  { symbol: '🧡', name: 'Peach Heart', category: 'Hearts' },
  { symbol: '💘', name: 'Cupid Heart', category: 'Hearts' },

  // Nature
  { symbol: '🌸', name: 'Cherry Blossom', category: 'Nature' },
  { symbol: '🌷', name: 'Pink Tulip', category: 'Nature' },
  { symbol: '💐', name: 'Bouquet', category: 'Nature' },
  { symbol: '🌻', name: 'Sunflower', category: 'Nature' },
  { symbol: '🌿', name: 'Herb Leaf', category: 'Nature' },
  { symbol: '🍀', name: 'Lucky Clover', category: 'Nature' },
  { symbol: '🍄', name: 'Mushroom', category: 'Nature' },
  { symbol: '🦋', name: 'Blue Butterfly', category: 'Nature' },
  { symbol: '🐝', name: 'Honeybee', category: 'Nature' },
  { symbol: '☁️', name: 'Dream Cloud', category: 'Nature' },
  { symbol: '🌙', name: 'Moon Glow', category: 'Nature' },
  { symbol: '🫧', name: 'Soap Bubble', category: 'Nature' },

  // Food
  { symbol: '🍓', name: 'Strawberry', category: 'Food' },
  { symbol: '🍒', name: 'Cherries', category: 'Food' },
  { symbol: '🍑', name: 'Peach', category: 'Food' },
  { symbol: '🥐', name: 'Croissant', category: 'Food' },
  { symbol: '🥞', name: 'Pancakes', category: 'Food' },
  { symbol: '☕', name: 'Latte Mug', category: 'Food' },
  { symbol: '🍵', name: 'Matcha Tea', category: 'Food' },
  { symbol: '🧋', name: 'Boba Milk Tea', category: 'Food' },
  { symbol: '🍰', name: 'Shortcake', category: 'Food' },
  { symbol: '🧁', name: 'Cupcake', category: 'Food' },
  { symbol: '🍪', name: 'Cookie', category: 'Food' },
  { symbol: '🍡', name: 'Dango', category: 'Food' },

  // Study
  { symbol: '📚', name: 'Books', category: 'Study' },
  { symbol: '📖', name: 'Journal', category: 'Study' },
  { symbol: '📝', name: 'Memo Paper', category: 'Study' },
  { symbol: '✏️', name: 'Pencil', category: 'Study' },
  { symbol: '🖊️', name: 'Ballpoint', category: 'Study' },
  { symbol: '📌', name: 'Thumbtack', category: 'Study' },
  { symbol: '📎', name: 'Paperclip', category: 'Study' },
  { symbol: '💡', name: 'Lightbulb', category: 'Study' },
  { symbol: '📐', name: 'Triangle Ruler', category: 'Study' },
  { symbol: '🗓️', name: 'Calendar Pad', category: 'Study' },
  { symbol: '🔍', name: 'Magnifier', category: 'Study' },
  { symbol: '🏷️', name: 'Label Tag', category: 'Study' },

  // Objects
  { symbol: '🎀', name: 'Pink Ribbon Bow', category: 'Objects' },
  { symbol: '🧸', name: 'Plushie Bear', category: 'Objects' },
  { symbol: '💌', name: 'Wax Sealed Letter', category: 'Objects' },
  { symbol: '🕯️', name: 'Candle', category: 'Objects' },
  { symbol: '🪞', name: 'Vintage Mirror', category: 'Objects' },
  { symbol: '📷', name: 'Snapshot Camera', category: 'Objects' },
  { symbol: '🎧', name: 'Headphones', category: 'Objects' },
  { symbol: '🪄', name: 'Magic Wand', category: 'Objects' },
  { symbol: '🎁', name: 'Gift Box', category: 'Objects' },
  { symbol: '🎈', name: 'Party Balloon', category: 'Objects' },
  { symbol: '🗝️', name: 'Antique Key', category: 'Objects' },
  { symbol: '🧷', name: 'Safety Pin', category: 'Objects' },

  // Travel
  { symbol: '✈️', name: 'Airplane', category: 'Travel' },
  { symbol: '🧳', name: 'Luggage Case', category: 'Travel' },
  { symbol: '🏖️', name: 'Beach Umbrella', category: 'Travel' },
  { symbol: '🗺️', name: 'World Map', category: 'Travel' },
  { symbol: '🚂', name: 'Cozy Train', category: 'Travel' },
  { symbol: '🚲', name: 'Bicycle', category: 'Travel' },
  { symbol: '🏕️', name: 'Camp Tent', category: 'Travel' },
  { symbol: '🗼', name: 'Tokyo Tower', category: 'Travel' },

  // Symbols
  { symbol: '✦', name: 'Diamond Sparkle', category: 'Symbols' },
  { symbol: '✧', name: 'Little Star', category: 'Symbols' },
  { symbol: '✨', name: 'Glimmer', category: 'Symbols' },
  { symbol: '★', name: 'Black Star', category: 'Symbols' },
  { symbol: '☆', name: 'White Star', category: 'Symbols' },
  { symbol: '✿', name: 'Floral Bullet', category: 'Symbols' },
  { symbol: '❀', name: 'Cherry Stamp', category: 'Symbols' },
  { symbol: '❦', name: 'Floral Heart', category: 'Symbols' },
  { symbol: '☁', name: 'Cloud Glyph', category: 'Symbols' },
  { symbol: '☽', name: 'Moon Crescent', category: 'Symbols' },
  { symbol: '✓', name: 'Checkmark', category: 'Symbols' },
  { symbol: '☕', name: 'Coffee Glyph', category: 'Symbols' },
];

export function EmojiStudio({ onClose, worldCenter }: Props) {
  const [activeCategory, setActiveCategory] = useState<EmojiCat>('Mood');
  const [search, setSearch] = useState('');
  const [emojiSize, setEmojiSize] = useState(64);
  const addObject = useCanvasStore((s) => s.addObject);

  const handleInsert = (symbol: string) => {
    const c = worldCenter();
    const now = Date.now();
    const obj: CanvasObject = {
      id: crypto.randomUUID(),
      type: 'sticker',
      x: c.x - emojiSize / 2,
      y: c.y - emojiSize / 2,
      width: emojiSize,
      height: emojiSize,
      rotation: Math.round(Math.random() * 6 - 3),
      zIndex: 0,
      locked: false,
      hidden: false,
      createdAt: now,
      updatedAt: now,
      data: { symbol },
    };
    addObject(obj);
  };

  const filtered = EMOJI_CATALOG.filter((item) => {
    if (search) {
      return item.name.toLowerCase().includes(search.toLowerCase()) || item.symbol.includes(search);
    }
    if (activeCategory === 'Mood') return true;
    return item.category === activeCategory;
  });

  return (
    <div className="emoji-studio-drawer" role="dialog" aria-label="Emoji & Mood Studio">
      <div className="emoji-studio-header">
        <div className="emoji-studio-title">
          <Icon name="sparkles" size={16} />
          <span>Emoji & Mood Studio</span>
        </div>
        <button className="icon-btn-sm" onClick={onClose} aria-label="Close">
          <Icon name="x" size={15} />
        </button>
      </div>

      {/* Quick Mood Bar */}
      <div className="emoji-mood-section">
        <div className="emoji-mood-label">Instant Moods:</div>
        <div className="emoji-mood-grid">
          {MOOD_BAR.map((emoji, idx) => (
            <button
              key={idx}
              className="emoji-mood-btn"
              onClick={() => handleInsert(emoji)}
              title={`Insert ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="emoji-studio-search">
        <Icon name="search" size={14} />
        <input
          type="text"
          placeholder="Search emojis & aesthetic moods..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear-btn" onClick={() => setSearch('')}>
            <Icon name="x" size={12} />
          </button>
        )}
      </div>

      {/* Categories chips */}
      {!search && (
        <div className="emoji-categories-scroll">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`emoji-cat-chip ${activeCategory === cat ? 'is-active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Size slider */}
      <div className="emoji-size-control">
        <span>Insert Size: {emojiSize}px</span>
        <input
          type="range"
          min={36}
          max={128}
          step={4}
          value={emojiSize}
          onChange={(e) => setEmojiSize(Number(e.target.value))}
        />
      </div>

      {/* Emoji Catalog Grid */}
      <div className="emoji-catalog-grid">
        {filtered.map((item, idx) => (
          <button
            key={idx}
            className="emoji-grid-cell"
            onClick={() => handleInsert(item.symbol)}
            title={item.name}
          >
            <span className="emoji-cell-glyph">{item.symbol}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
