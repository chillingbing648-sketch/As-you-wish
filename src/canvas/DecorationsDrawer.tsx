import { useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import type { CanvasObject } from '../types';
import { Icon } from '../components/Icon';

interface Props {
  onClose: () => void;
  worldCenter: () => { x: number; y: number };
}

type DecCategory = 'Cute' | 'Doodles' | 'Flowers' | 'Stars' | 'Hearts' | 'Study' | 'Scrapbook' | 'Vintage';

const CATEGORIES: DecCategory[] = [
  'Cute',
  'Doodles',
  'Flowers',
  'Stars',
  'Hearts',
  'Study',
  'Scrapbook',
  'Vintage',
];

interface DecItem {
  symbol: string;
  name: string;
  category: DecCategory;
  defaultSize?: number;
  rotation?: number;
}

const DECORATIONS: DecItem[] = [
  // Cute
  { symbol: '🎀', name: 'Ribbon Bow', category: 'Cute', defaultSize: 72 },
  { symbol: '🧸', name: 'Teddy Bear', category: 'Cute', defaultSize: 72 },
  { symbol: '🍓', name: 'Strawberry', category: 'Cute', defaultSize: 64 },
  { symbol: '🫧', name: 'Bubbles', category: 'Cute', defaultSize: 68 },
  { symbol: '🍰', name: 'Sweet Cake', category: 'Cute', defaultSize: 70 },
  { symbol: '🧃', name: 'Juice Box', category: 'Cute', defaultSize: 64 },
  { symbol: '🧁', name: 'Cupcake', category: 'Cute', defaultSize: 66 },
  { symbol: '🐈', name: 'Kitty Cat', category: 'Cute', defaultSize: 70 },
  { symbol: '🐰', name: 'Bunny', category: 'Cute', defaultSize: 70 },
  { symbol: '🪞', name: 'Mirror', category: 'Cute', defaultSize: 68 },

  // Doodles
  { symbol: '✎', name: 'Pencil Sketch', category: 'Doodles', defaultSize: 64, rotation: -12 },
  { symbol: '〰️', name: 'Squiggle', category: 'Doodles', defaultSize: 64 },
  { symbol: '➰', name: 'Loop Doodle', category: 'Doodles', defaultSize: 60 },
  { symbol: '〽️', name: 'Zigzag Wave', category: 'Doodles', defaultSize: 64 },
  { symbol: '➿', name: 'Double Loop', category: 'Doodles', defaultSize: 64 },
  { symbol: '✂️', name: 'Paper Scissors', category: 'Doodles', defaultSize: 64, rotation: 15 },
  { symbol: '🎨', name: 'Art Palette', category: 'Doodles', defaultSize: 70 },
  { symbol: '✒️', name: 'Dip Nib', category: 'Doodles', defaultSize: 64 },

  // Flowers
  { symbol: '🌸', name: 'Cherry Blossom', category: 'Flowers', defaultSize: 72 },
  { symbol: '🌷', name: 'Tulip', category: 'Flowers', defaultSize: 72 },
  { symbol: '🌻', name: 'Sunflower', category: 'Flowers', defaultSize: 72 },
  { symbol: '🌼', name: 'Daisy', category: 'Flowers', defaultSize: 68 },
  { symbol: '✿', name: 'Flora Stamp', category: 'Flowers', defaultSize: 64 },
  { symbol: '❀', name: 'Floral Petals', category: 'Flowers', defaultSize: 64 },
  { symbol: '🌿', name: 'Botanical Sprig', category: 'Flowers', defaultSize: 70, rotation: -8 },
  { symbol: '💐', name: 'Bouquet', category: 'Flowers', defaultSize: 76 },
  { symbol: '🪻', name: 'Hyacinth', category: 'Flowers', defaultSize: 70 },
  { symbol: '🌱', name: 'Seedling', category: 'Flowers', defaultSize: 64 },

  // Stars
  { symbol: '✦', name: 'Sparkle Star', category: 'Stars', defaultSize: 64 },
  { symbol: '✧', name: 'Four-Point Star', category: 'Stars', defaultSize: 64 },
  { symbol: '★', name: 'Solid Star', category: 'Stars', defaultSize: 64 },
  { symbol: '☆', name: 'Outline Star', category: 'Stars', defaultSize: 64 },
  { symbol: '✨', name: 'Magic Sparkles', category: 'Stars', defaultSize: 72 },
  { symbol: '🌟', name: 'Glow Star', category: 'Stars', defaultSize: 70 },
  { symbol: '💫', name: 'Shooting Streak', category: 'Stars', defaultSize: 68 },
  { symbol: '🌙', name: 'Crescent Moon', category: 'Stars', defaultSize: 68, rotation: -10 },
  { symbol: '☁️', name: 'Fluffy Cloud', category: 'Stars', defaultSize: 74 },
  { symbol: '🪄', name: 'Magic Wand', category: 'Stars', defaultSize: 68, rotation: 12 },

  // Hearts
  { symbol: '♡', name: 'Hollow Heart', category: 'Hearts', defaultSize: 64 },
  { symbol: '♥', name: 'Solid Heart', category: 'Hearts', defaultSize: 64 },
  { symbol: '💖', name: 'Sparkling Heart', category: 'Hearts', defaultSize: 70 },
  { symbol: '💕', name: 'Two Hearts', category: 'Hearts', defaultSize: 70 },
  { symbol: '💌', name: 'Love Letter', category: 'Hearts', defaultSize: 70, rotation: -6 },
  { symbol: '💘', name: 'Heart Arrow', category: 'Hearts', defaultSize: 70 },
  { symbol: '💓', name: 'Pulsing Heart', category: 'Hearts', defaultSize: 70 },
  { symbol: '🤍', name: 'White Heart', category: 'Hearts', defaultSize: 64 },

  // Study
  { symbol: '📚', name: 'Book Stack', category: 'Study', defaultSize: 74 },
  { symbol: '☕', name: 'Coffee Cup', category: 'Study', defaultSize: 68 },
  { symbol: '📖', name: 'Open Notebook', category: 'Study', defaultSize: 74 },
  { symbol: '💡', name: 'Idea Bulb', category: 'Study', defaultSize: 68 },
  { symbol: '🏷️', name: 'Sticky Tag', category: 'Study', defaultSize: 64, rotation: -8 },
  { symbol: '🔖', name: 'Bookmark', category: 'Study', defaultSize: 64 },
  { symbol: '📐', name: 'Ruler', category: 'Study', defaultSize: 68 },
  { symbol: '🗓️', name: 'Calendar Stamp', category: 'Study', defaultSize: 70 },

  // Scrapbook
  { symbol: '📎', name: 'Paper Clip', category: 'Scrapbook', defaultSize: 60, rotation: 25 },
  { symbol: '📌', name: 'Push Pin', category: 'Scrapbook', defaultSize: 64, rotation: -15 },
  { symbol: '📍', name: 'Location Pin', category: 'Scrapbook', defaultSize: 64 },
  { symbol: '🧷', name: 'Safety Pin', category: 'Scrapbook', defaultSize: 60, rotation: -20 },
  { symbol: '🎞️', name: 'Film Strip', category: 'Scrapbook', defaultSize: 72 },
  { symbol: '📷', name: 'Vintage Camera', category: 'Scrapbook', defaultSize: 70 },
  { symbol: '🖼️', name: 'Scrap Frame', category: 'Scrapbook', defaultSize: 72 },
  { symbol: '🎫', name: 'Ticket Stub', category: 'Scrapbook', defaultSize: 68, rotation: 8 },

  // Vintage
  { symbol: '📜', name: 'Antique Scroll', category: 'Vintage', defaultSize: 72 },
  { symbol: '⏳', name: 'Hourglass', category: 'Vintage', defaultSize: 68 },
  { symbol: '🗝️', name: 'Old Key', category: 'Vintage', defaultSize: 66, rotation: -30 },
  { symbol: '🕰️', name: 'Mantel Clock', category: 'Vintage', defaultSize: 70 },
  { symbol: '🕯️', name: 'Candlelight', category: 'Vintage', defaultSize: 68 },
  { symbol: '📮', name: 'Postbox', category: 'Vintage', defaultSize: 70 },
  { symbol: '✉️', name: 'Wax Seal Mail', category: 'Vintage', defaultSize: 68 },
  { symbol: '❦', name: 'Floral Heart Leaf', category: 'Vintage', defaultSize: 64 },
];

export function DecorationsDrawer({ onClose, worldCenter }: Props) {
  const [activeCategory, setActiveCategory] = useState<DecCategory>('Cute');
  const [search, setSearch] = useState('');
  const addObject = useCanvasStore((s) => s.addObject);

  const handleAdd = (item: DecItem) => {
    const c = worldCenter();
    const size = item.defaultSize || 64;
    const now = Date.now();
    const obj: CanvasObject = {
      id: crypto.randomUUID(),
      type: 'sticker',
      x: c.x - size / 2,
      y: c.y - size / 2,
      width: size,
      height: size,
      rotation: item.rotation || 0,
      zIndex: 0,
      locked: false,
      hidden: false,
      createdAt: now,
      updatedAt: now,
      data: { symbol: item.symbol },
    };
    addObject(obj);
  };

  const filtered = DECORATIONS.filter((d) => {
    const matchesCat = activeCategory === d.category;
    const matchesSearch = search ? d.name.toLowerCase().includes(search.toLowerCase()) || d.symbol.includes(search) : true;
    return search ? matchesSearch : matchesCat;
  });

  return (
    <div className="decorations-drawer" role="dialog" aria-label="Decorations & Stickers">
      <div className="decorations-header">
        <div className="decorations-title">
          <Icon name="sparkles" size={16} />
          <span>Decorations & Stickers</span>
        </div>
        <button className="icon-btn-sm" onClick={onClose} aria-label="Close">
          <Icon name="x" size={15} />
        </button>
      </div>

      <div className="decorations-search">
        <Icon name="search" size={14} />
        <input
          type="text"
          placeholder="Search stickers & doodles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear-btn" onClick={() => setSearch('')}>
            <Icon name="x" size={12} />
          </button>
        )}
      </div>

      {!search && (
        <div className="decorations-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`dec-cat-btn ${activeCategory === cat ? 'is-active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="decorations-grid">
        {filtered.map((item, idx) => (
          <button
            key={idx}
            className="dec-grid-item"
            onClick={() => handleAdd(item)}
            title={`Add ${item.name}`}
          >
            <span className="dec-symbol">{item.symbol}</span>
            <span className="dec-name">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
