import { usePrefsStore } from '../store/prefsStore';
import { useCanvasStore } from '../store/canvasStore';
import type { SavedElement, CanvasObject } from '../types';
import { Icon } from '../components/Icon';

interface SavedElementsProps {
  onClose: () => void;
  worldCenter: () => { x: number; y: number };
}

export function SavedElements({ onClose, worldCenter }: SavedElementsProps) {
  const prefs = usePrefsStore((s) => s.prefs);
  const deleteElement = usePrefsStore((s) => s.deleteElement);
  const addObject = useCanvasStore((s) => s.addObject);

  const savedElements = prefs.savedElements || [];

  const handleInsert = (el: SavedElement) => {
    if (!el.objects || el.objects.length === 0) return;
    const c = worldCenter();

    // Calculate center of saved object cluster
    const minX = Math.min(...el.objects.map((o) => o.x));
    const maxX = Math.max(...el.objects.map((o) => o.x + o.width));
    const minY = Math.min(...el.objects.map((o) => o.y));
    const maxY = Math.max(...el.objects.map((o) => o.y + o.height));
    const origCenterX = (minX + maxX) / 2;
    const origCenterY = (minY + maxY) / 2;

    const dx = c.x - origCenterX;
    const dy = c.y - origCenterY;

    // Generate new unique IDs and preserve relative spatial alignment
    const newGroupId = el.objects.length > 1 ? crypto.randomUUID() : undefined;

    el.objects.forEach((src) => {
      const copy: CanvasObject = {
        ...src,
        id: crypto.randomUUID(),
        x: src.x + dx,
        y: src.y + dy,
        groupId: newGroupId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addObject(copy);
    });

    onClose();
  };

  return (
    <div className="saved-elements-modal" role="dialog" aria-label="My Saved Elements">
      <div className="saved-elements-header">
        <div className="saved-elements-title">
          <Icon name="element" size={17} />
          <span>My Reusable Elements ({savedElements.length})</span>
        </div>
        <button className="icon-btn-sm" onClick={onClose} aria-label="Close">
          <Icon name="x" size={15} />
        </button>
      </div>

      <p className="saved-elements-subtitle">
        Select any objects on your canvas and click <strong>“Save Element”</strong> in the toolbar to save custom compositions here.
      </p>

      <div className="saved-elements-list">
        {savedElements.length === 0 ? (
          <div className="saved-elements-empty">
            <Icon name="element" size={28} />
            <span>No saved elements yet</span>
            <small>Multi-select any stickers, shapes, or notes on canvas to save them as reusable templates.</small>
          </div>
        ) : (
          savedElements.map((el) => (
            <div key={el.id} className="saved-element-card" onClick={() => handleInsert(el)}>
              <div className="saved-element-card-header">
                <span className="saved-element-name">{el.label}</span>
                <button
                  className="icon-btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteElement(el.id);
                  }}
                  title="Delete element"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
              <div className="saved-element-meta">
                <span>{el.objects.length} object{el.objects.length !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{new Date(el.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
              <button className="saved-element-insert-btn">
                <span>Insert on Canvas</span>
                <Icon name="arrow-right" size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
