import { useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import type { CanvasObject, ObjectType } from '../types';
import { Icon, type IconName } from '../components/Icon';

interface LayerPanelProps {
  onClose: () => void;
}

const TYPE_ICONS: Record<ObjectType, IconName> = {
  text: 'type',
  note: 'book',
  image: 'image',
  drawing: 'pen',
  sticker: 'sparkles',
  shape: 'shapes',
};

function getObjectLabel(obj: CanvasObject): string {
  if (obj.label) return obj.label;
  if (obj.type === 'text') return obj.data.text.slice(0, 18) || 'Text';
  if (obj.type === 'note') return obj.data.text.slice(0, 18) || 'Sticky Note';
  if (obj.type === 'image') return obj.data.caption || 'Photo';
  if (obj.type === 'shape') return `Shape (${obj.data.shapeType})`;
  if (obj.type === 'drawing') return 'Drawing Ink';
  if (obj.type === 'sticker') return `Sticker ${obj.data.symbol}`;
  return 'Object';
}

export function LayerPanel({ onClose }: LayerPanelProps) {
  const doc = useCanvasStore((s) => s.doc);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const setSelection = useCanvasStore((s) => s.setSelection);
  const toggleLock = useCanvasStore((s) => s.toggleLock);
  const toggleHidden = useCanvasStore((s) => s.toggleHidden);
  const renameObject = useCanvasStore((s) => s.renameObject);
  const reorderObjects = useCanvasStore((s) => s.reorderObjects);
  const bringForward = useCanvasStore((s) => s.bringForward);
  const sendBackward = useCanvasStore((s) => s.sendBackward);
  const bringToFront = useCanvasStore((s) => s.bringToFront);
  const sendToBack = useCanvasStore((s) => s.sendToBack);
  const groupObjects = useCanvasStore((s) => s.groupObjects);
  const ungroupObjects = useCanvasStore((s) => s.ungroupObjects);
  const deleteObjects = useCanvasStore((s) => s.deleteObjects);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabelDraft, setEditLabelDraft] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  if (!doc) return null;

  // Object order is bottom to top. For layers panel, we want top to bottom (reverse).
  const layers = [...doc.objectOrder].reverse().map((id) => doc.objects[id]).filter(Boolean);

  const handleRowClick = (id: string, e: React.MouseEvent) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      const set = new Set(selectedIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      setSelection(Array.from(set));
    } else {
      setSelection([id]);
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const currentOrder = [...doc.objectOrder];
    const fromIdx = currentOrder.indexOf(draggedId);
    const toIdx = currentOrder.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    currentOrder.splice(fromIdx, 1);
    currentOrder.splice(toIdx, 0, draggedId);
    reorderObjects(currentOrder);
    setDraggedId(null);
  };

  const startRename = (obj: CanvasObject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(obj.id);
    setEditLabelDraft(obj.label || getObjectLabel(obj));
  };

  const commitRename = (id: string) => {
    if (editLabelDraft.trim()) {
      renameObject(id, editLabelDraft.trim());
    }
    setEditingId(null);
  };

  const selectedGroup = selectedIds.length > 0
    ? doc.objects[selectedIds[0]]?.groupId
    : undefined;
  const isAllSameGroup = selectedGroup && selectedIds.every((id) => doc.objects[id]?.groupId === selectedGroup);

  return (
    <aside className="layer-panel" role="complementary" aria-label="Layers & Objects">
      <div className="layer-panel-header">
        <div className="layer-panel-title">
          <Icon name="layers" size={16} />
          <span>Layers ({layers.length})</span>
        </div>
        <div className="layer-header-actions">
          {selectedIds.length > 1 && (
            <>
              {isAllSameGroup ? (
                <button
                  className="icon-btn-sm"
                  onClick={() => ungroupObjects(selectedGroup!)}
                  title="Ungroup selection"
                >
                  <Icon name="ungroup" size={15} />
                </button>
              ) : (
                <button
                  className="icon-btn-sm"
                  onClick={() => groupObjects(selectedIds)}
                  title="Group selection"
                >
                  <Icon name="group" size={15} />
                </button>
              )}
            </>
          )}
          <button className="icon-btn-sm" onClick={onClose} aria-label="Close Layer Panel">
            <Icon name="x" size={15} />
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="layer-quick-reorder-bar">
          <button
            className="layer-order-btn"
            onClick={() => bringToFront(selectedIds)}
            title="Bring to Front"
          >
            <Icon name="layers" size={13} />
            <span>Top</span>
          </button>
          <button
            className="layer-order-btn"
            onClick={() => bringForward(selectedIds)}
            title="Bring Forward"
          >
            <span>Up</span>
          </button>
          <button
            className="layer-order-btn"
            onClick={() => sendBackward(selectedIds)}
            title="Send Backward"
          >
            <span>Down</span>
          </button>
          <button
            className="layer-order-btn"
            onClick={() => sendToBack(selectedIds)}
            title="Send to Back"
          >
            <Icon name="layers-back" size={13} />
            <span>Bottom</span>
          </button>
          <button
            className="layer-order-btn layer-danger"
            onClick={() => deleteObjects(selectedIds)}
            title="Delete Selected"
          >
            <Icon name="trash" size={13} />
          </button>
        </div>
      )}

      <div className="layer-list">
        {layers.length === 0 ? (
          <div className="layer-empty">
            <Icon name="sparkles" size={24} />
            <span>No objects yet</span>
            <small>Add notes, text, shapes, or photos to see them here.</small>
          </div>
        ) : (
          layers.map((obj) => {
            const isSelected = selectedIds.includes(obj.id);
            const isEditing = editingId === obj.id;
            const icon = TYPE_ICONS[obj.type] || 'shapes';

            return (
              <div
                key={obj.id}
                className={`layer-item ${isSelected ? 'is-selected' : ''} ${obj.hidden ? 'is-hidden' : ''} ${obj.locked ? 'is-locked' : ''}`}
                onClick={(e) => handleRowClick(obj.id, e)}
                draggable
                onDragStart={() => handleDragStart(obj.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(obj.id)}
              >
                <span className="layer-drag-grip" title="Drag to reorder">
                  ⠿
                </span>

                <span className="layer-item-icon">
                  <Icon name={icon} size={15} />
                </span>

                {isEditing ? (
                  <input
                    className="layer-rename-input"
                    value={editLabelDraft}
                    onChange={(e) => setEditLabelDraft(e.target.value)}
                    onBlur={() => commitRename(obj.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(obj.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="layer-item-name"
                    onDoubleClick={(e) => startRename(obj, e)}
                    title="Double click to rename"
                  >
                    {getObjectLabel(obj)}
                    {obj.groupId && <span className="layer-group-badge">Group</span>}
                  </span>
                )}

                <div className="layer-item-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className={`layer-action-btn ${obj.hidden ? 'is-active' : ''}`}
                    onClick={() => toggleHidden(obj.id)}
                    title={obj.hidden ? 'Show object' : 'Hide object'}
                  >
                    <Icon name={obj.hidden ? 'eye-off' : 'eye'} size={14} />
                  </button>

                  <button
                    className={`layer-action-btn ${obj.locked ? 'is-active' : ''}`}
                    onClick={() => toggleLock(obj.id)}
                    title={obj.locked ? 'Unlock object' : 'Lock object'}
                  >
                    <Icon name={obj.locked ? 'lock' : 'unlock'} size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
