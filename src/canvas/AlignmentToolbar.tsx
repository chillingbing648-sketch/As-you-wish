import { useCanvasStore } from '../store/canvasStore';
import { Icon } from '../components/Icon';

interface AlignmentToolbarProps {
  onSaveAsElement?: () => void;
}

export function AlignmentToolbar({ onSaveAsElement }: AlignmentToolbarProps) {
  const doc = useCanvasStore((s) => s.doc);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const alignObjects = useCanvasStore((s) => s.alignObjects);
  const distributeObjects = useCanvasStore((s) => s.distributeObjects);
  const groupObjects = useCanvasStore((s) => s.groupObjects);
  const ungroupObjects = useCanvasStore((s) => s.ungroupObjects);
  const duplicateObjects = useCanvasStore((s) => s.duplicateObjects);

  if (!doc || selectedIds.length < 2) return null;

  const firstObj = doc.objects[selectedIds[0]];
  const selectedGroup = firstObj?.groupId;
  const isAllSameGroup = selectedGroup && selectedIds.every((id) => doc.objects[id]?.groupId === selectedGroup);

  return (
    <div className="alignment-toolbar-group">
      <div className="ctx-divider" />
      <span className="ctx-label">Align</span>
      <button
        className="ctx-icon-btn"
        onClick={() => alignObjects(selectedIds, 'left')}
        title="Align Left"
      >
        <Icon name="align-left" size={15} />
      </button>
      <button
        className="ctx-icon-btn"
        onClick={() => alignObjects(selectedIds, 'center-h')}
        title="Align Center Horizontal"
      >
        <Icon name="align-center" size={15} />
      </button>
      <button
        className="ctx-icon-btn"
        onClick={() => alignObjects(selectedIds, 'right')}
        title="Align Right"
      >
        <Icon name="align-right" size={15} />
      </button>
      <button
        className="ctx-icon-btn"
        onClick={() => alignObjects(selectedIds, 'top')}
        title="Align Top"
      >
        <Icon name="align-top" size={15} />
      </button>
      <button
        className="ctx-icon-btn"
        onClick={() => alignObjects(selectedIds, 'center-v')}
        title="Align Middle Vertical"
      >
        <Icon name="align-middle" size={15} />
      </button>
      <button
        className="ctx-icon-btn"
        onClick={() => alignObjects(selectedIds, 'bottom')}
        title="Align Bottom"
      >
        <Icon name="align-bottom" size={15} />
      </button>

      {selectedIds.length >= 3 && (
        <>
          <div className="ctx-divider" />
          <span className="ctx-label">Distribute</span>
          <button
            className="ctx-icon-btn"
            onClick={() => distributeObjects(selectedIds, 'h')}
            title="Distribute Horizontally"
          >
            <Icon name="distribute-h" size={15} />
          </button>
          <button
            className="ctx-icon-btn"
            onClick={() => distributeObjects(selectedIds, 'v')}
            title="Distribute Vertically"
          >
            <Icon name="distribute-v" size={15} />
          </button>
        </>
      )}

      <div className="ctx-divider" />
      {isAllSameGroup ? (
        <button
          className="ctx-chip"
          onClick={() => ungroupObjects(selectedGroup!)}
          title="Ungroup selection"
        >
          <Icon name="ungroup" size={14} />
          <span>Ungroup</span>
        </button>
      ) : (
        <button
          className="ctx-chip"
          onClick={() => groupObjects(selectedIds)}
          title="Group selection"
        >
          <Icon name="group" size={14} />
          <span>Group</span>
        </button>
      )}

      <button
        className="ctx-chip"
        onClick={() => duplicateObjects(selectedIds)}
        title="Duplicate selected objects"
      >
        <Icon name="copy" size={14} />
        <span>Duplicate</span>
      </button>

      {onSaveAsElement && (
        <button
          className="ctx-chip ctx-chip--primary"
          onClick={onSaveAsElement}
          title="Save selection as reusable element"
        >
          <Icon name="element" size={14} />
          <span>Save Element</span>
        </button>
      )}
    </div>
  );
}
