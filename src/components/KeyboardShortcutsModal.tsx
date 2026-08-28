import { Icon } from './Icon';

interface Props {
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

export function KeyboardShortcutsModal({ onClose }: Props) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const mod = isMac ? '⌘' : 'Ctrl';

  const groups: ShortcutGroup[] = [
    {
      title: 'Canvas Navigation',
      shortcuts: [
        { keys: ['Space', 'Drag'], description: 'Pan around canvas' },
        { keys: ['+'], description: 'Zoom in' },
        { keys: ['-'], description: 'Zoom out' },
        { keys: ['0'], description: 'Reset zoom to 100%' },
        { keys: ['/'], description: 'Open Quick Create command palette' },
        { keys: [mod, 'K'], description: 'Command palette shortcut' },
      ],
    },
    {
      title: 'Object Actions',
      shortcuts: [
        { keys: [mod, 'C'], description: 'Copy selected objects' },
        { keys: [mod, 'V'], description: 'Paste copied objects' },
        { keys: [mod, 'X'], description: 'Cut selected objects' },
        { keys: [mod, 'D'], description: 'Duplicate selected objects' },
        { keys: ['Del', '⌫'], description: 'Delete selected objects' },
        { keys: ['Esc'], description: 'Clear selection' },
        { keys: [mod, 'G'], description: 'Group selected objects' },
        { keys: [mod, 'Shift', 'G'], description: 'Ungroup selected group' },
        { keys: ['Arrow Keys'], description: 'Nudge object position (4px)' },
        { keys: ['Shift', 'Arrows'], description: 'Fine nudge object position (1px)' },
      ],
    },
    {
      title: 'History & Modes',
      shortcuts: [
        { keys: [mod, 'Z'], description: 'Undo last change' },
        { keys: [mod, 'Shift', 'Z'], description: 'Redo last change' },
        { keys: ['S'], description: 'Select / pointer tool' },
        { keys: ['D'], description: 'Freehand drawing tool' },
      ],
    },
  ];

  return (
    <div className="shortcuts-modal-backdrop" onClick={onClose}>
      <div className="shortcuts-modal-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Keyboard Shortcuts">
        <div className="shortcuts-modal-header">
          <div className="shortcuts-modal-title">
            <Icon name="keyboard" size={18} />
            <span>Keyboard Shortcuts</span>
          </div>
          <button className="icon-btn-sm" onClick={onClose} aria-label="Close">
            <Icon name="x" size={15} />
          </button>
        </div>

        <div className="shortcuts-modal-body">
          {groups.map((group) => (
            <div key={group.title} className="shortcuts-group">
              <h4 className="shortcuts-group-title">{group.title}</h4>
              <div className="shortcuts-list">
                {group.shortcuts.map((item, idx) => (
                  <div key={idx} className="shortcuts-row">
                    <span className="shortcuts-desc">{item.description}</span>
                    <div className="shortcuts-keys">
                      {item.keys.map((k, i) => (
                        <kbd key={i} className="shortcut-kbd">{k}</kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
