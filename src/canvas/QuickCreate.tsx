import { useState, useRef } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import type { CanvasObject, ShapeType } from '../types';
import { Icon, type IconName } from '../components/Icon';


interface QuickCreateProps {
  onClose: () => void;
  worldCenter: () => { x: number; y: number };
  onOpenTemplates: () => void;
  onOpenEmoji?: () => void;
  onOpenDecorations?: () => void;
}

interface QuickItem {
  id: string;
  title: string;
  command: string;
  category: 'Text & Notes' | 'Shapes' | 'Media & Ink' | 'Decorations & Mood' | 'Templates';
  icon: IconName;
  action: () => void;
}

export function QuickCreate({
  onClose,
  worldCenter,
  onOpenTemplates,
  onOpenEmoji,
  onOpenDecorations,
}: QuickCreateProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const addObject = useCanvasStore((s) => s.addObject);
  const setTool = useCanvasStore((s) => s.setTool);
  const inputRef = useRef<HTMLInputElement>(null);

  const makeBase = (overrides: Partial<CanvasObject>): CanvasObject => {
    const now = Date.now();
    return {
      id: crypto.randomUUID(),
      x: 0,
      y: 0,
      width: 220,
      height: 140,
      rotation: 0,
      zIndex: 0,
      locked: false,
      hidden: false,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    } as CanvasObject;
  };

  const addTextWithStyle = (
    fontSize: number,
    bold: boolean,
    headingStyle?: 'h1' | 'h2' | 'h3' | 'quote',
    isHighlight = false
  ) => {
    const c = worldCenter();
    addObject(
      makeBase({
        type: 'text',
        x: c.x - 140,
        y: c.y - 30,
        width: 280,
        height: fontSize > 28 ? 60 : 40,
        data: {
          text: headingStyle === 'quote' ? '“Write a meaningful quote…”' : isHighlight ? 'Highlighted key insight…' : 'Heading…',
          fontFamily: "'Fraunces', serif",
          fontSize,
          color: '#29272A',
          bold,
          italic: headingStyle === 'quote',
          align: 'left',
          headingStyle,
          highlight: isHighlight ? '#FFE68A' : '',
          highlightStyle: isHighlight ? 'soft' : undefined,
        },
      })
    );
    onClose();
  };

  const addNote = (color = '#FFF0B8') => {
    const c = worldCenter();
    addObject(
      makeBase({
        type: 'note',
        x: c.x - 120,
        y: c.y - 80,
        width: 240,
        height: 170,
        rotation: Math.round(Math.random() * 4 - 2),
        data: { text: 'New idea…', color },
      })
    );
    onClose();
  };

  const addShape = (shapeType: ShapeType, w = 180, h = 140, fill = '#F1D6DE') => {
    const c = worldCenter();
    addObject(
      makeBase({
        type: 'shape',
        x: c.x - w / 2,
        y: c.y - h / 2,
        width: w,
        height: h,
        data: {
          shapeType,
          fill,
          strokeColor: '#D78C9F',
          strokeWidth: 2,
          opacity: 0.95,
          rounded: 12,
        },
      })
    );
    onClose();
  };

  const items: QuickItem[] = [

    {
      id: 'text',
      title: 'Text Block',
      command: '/text',
      category: 'Text & Notes',
      icon: 'type',
      action: () => addTextWithStyle(18, false),
    },
    {
      id: 'h1',
      title: 'Heading 1 (Display Title)',
      command: '/heading',
      category: 'Text & Notes',
      icon: 'type',
      action: () => addTextWithStyle(36, true, 'h1'),
    },
    {
      id: 'h2',
      title: 'Heading 2 (Section Subtitle)',
      command: '/h2',
      category: 'Text & Notes',
      icon: 'type',
      action: () => addTextWithStyle(26, true, 'h2'),
    },
    {
      id: 'quote',
      title: 'Pull Quote',
      command: '/quote',
      category: 'Text & Notes',
      icon: 'type',
      action: () => addTextWithStyle(22, false, 'quote'),
    },
    {
      id: 'highlight',
      title: 'Highlighted Text Block',
      command: '/highlight',
      category: 'Text & Notes',
      icon: 'highlighter',
      action: () => addTextWithStyle(18, false, undefined, true),
    },
    {
      id: 'note',
      title: 'Sticky Note',
      command: '/note',
      category: 'Text & Notes',
      icon: 'book',
      action: () => addNote(),
    },
    {
      id: 'rect',
      title: 'Rectangle / Card Box',
      command: '/shape',
      category: 'Shapes',
      icon: 'square',
      action: () => addShape('rounded-rect', 200, 140),
    },
    {
      id: 'circle',
      title: 'Circle / Badge Shape',
      command: '/circle',
      category: 'Shapes',
      icon: 'circle',
      action: () => addShape('circle', 160, 160, '#EEDFC8'),
    },
    {
      id: 'arrow',
      title: 'Directional Arrow',
      command: '/arrow',
      category: 'Shapes',
      icon: 'arrow-right',
      action: () => addShape('arrow', 220, 36, '#D78C9F'),
    },
    {
      id: 'star',
      title: 'Star Element',
      command: '/star',
      category: 'Shapes',
      icon: 'star-shape',
      action: () => addShape('star', 150, 150, '#F2DF9B'),
    },
    {
      id: 'bubble',
      title: 'Speech Bubble',
      command: '/bubble',
      category: 'Shapes',
      icon: 'speech-bubble',
      action: () => addShape('speech-bubble', 210, 140, '#DCE7DC'),
    },
    {
      id: 'divider',
      title: 'Divider Rule',
      command: '/divider',
      category: 'Shapes',
      icon: 'minus',
      action: () => addShape('divider', 320, 20, '#A9BEA9'),
    },
    {
      id: 'draw',
      title: 'Freehand Drawing Ink',
      command: '/drawing',
      category: 'Media & Ink',
      icon: 'pen',
      action: () => {
        setTool('draw');
        onClose();
      },
    },
    {
      id: 'decorations',
      title: 'Stickers & Doodles Drawer',
      command: '/sticker',
      category: 'Decorations & Mood',
      icon: 'sparkles',
      action: () => {
        onClose();
        onOpenDecorations?.();
      },
    },
    {
      id: 'emoji',
      title: 'Emoji & Mood Studio',
      command: '/emoji',
      category: 'Decorations & Mood',
      icon: 'sparkles',
      action: () => {
        onClose();
        onOpenEmoji?.();
      },
    },
    {
      id: 'washi',
      title: 'Washi Tape Accent',
      command: '/washi',
      category: 'Decorations & Mood',
      icon: 'minus',
      action: () => addShape('rounded-rect', 120, 24, '#FDF7DC'),
    },
    {
      id: 'template',
      title: 'Starter Canvas Templates',
      command: '/template',
      category: 'Templates',
      icon: 'template',
      action: () => {
        onClose();
        onOpenTemplates();
      },
    },
  ];

  const cleanSearch = search.trim().toLowerCase().replace(/^\//, '');

  const filtered = items.filter(
    (i) =>
      i.title.toLowerCase().includes(cleanSearch) ||
      i.command.toLowerCase().includes(cleanSearch) ||
      i.category.toLowerCase().includes(cleanSearch)
  );

  const safeSelectedIndex = selectedIndex < filtered.length ? selectedIndex : 0;


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="quick-create-backdrop" onClick={onClose}>
      <div className="quick-create-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Quick Create">
        <div className="quick-create-search">
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or element (/text, /heading, /emoji, /sticker, /shape, /template...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <kbd className="quick-create-esc">ESC</kbd>
        </div>

        <div className="quick-create-list">
          {filtered.length === 0 ? (
            <div className="quick-create-empty">No matching commands found</div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={item.id}
                className={`quick-create-item ${safeSelectedIndex === idx ? 'is-selected' : ''}`}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(idx)}
              >

                <span className="quick-item-icon">
                  <Icon name={item.icon} size={16} />
                </span>
                <span className="quick-item-title">{item.title}</span>
                <span className="quick-item-category">{item.category}</span>
                <kbd className="quick-item-kbd">{item.command}</kbd>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
