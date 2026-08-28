import { useEffect, useMemo, useState } from 'react';
import { useNotebookStore, randomCoverColor } from '../store/notebookStore';
import type { Notebook } from '../types';
import { Icon } from './Icon';

interface Props {
  onOpen: (notebook: Notebook) => void;
}

// Small decorative marks for notebook covers — purely visual collage
// content, not interface chrome, so plain symbol glyphs are appropriate here.
const COVER_ART = ['✦', '♡', '✿', '☁', '✧', '❀'];

export function Library({ onOpen }: Props) {
  const { notebooks, loaded, refresh, createNotebook, toggleFavorite, archiveNotebook, removeNotebook } =
    useNotebookStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'archived'>('all');

  useEffect(() => {
    refresh();
  }, [refresh]);

  const visible = useMemo(() => {
    let list = notebooks;
    if (filter === 'favorites') list = list.filter((n) => n.isFavorite && !n.isArchived);
    else if (filter === 'archived') list = list.filter((n) => n.isArchived);
    else list = list.filter((n) => !n.isArchived);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((n) => n.title.toLowerCase().includes(q));
    }
    return list;
  }, [notebooks, filter, query]);

  const handleCreate = async () => {
    const nb = await createNotebook('Little notebook', randomCoverColor());
    onOpen(nb);
  };

  return (
    <main className="library">
      <header className="library-header">
        <div className="library-brand">
          <div className="brand-kicker">A little place for</div>
          <h1>
            As You Wish<span>✦</span>
          </h1>
          <p>collect little things. make them yours.</p>
        </div>
        <div className="library-controls">
          <label className="library-search">
            <Icon name="search" size={17} />
            <input
              aria-label="Search notebooks"
              placeholder="Search your little world…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button className="library-new-btn" onClick={handleCreate}>
            <Icon name="plus" size={17} /> New notebook
          </button>
        </div>
      </header>

      <nav className="library-filters" aria-label="Notebook filters">
        {([
          ['all', 'All'],
          ['favorites', 'Favorites'],
          ['archived', 'Archive'],
        ] as const).map(([key, label]) => (
          <button key={key} className={filter === key ? 'is-active' : ''} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </nav>

      {!loaded ? (
        <div className="library-empty">Setting up your desk…</div>
      ) : visible.length === 0 ? (
        <EmptyState filter={filter} query={query} onCreate={handleCreate} />
      ) : (
        <div className="library-masonry">
          {visible.map((nb, i) => (
            <NotebookCard
              key={nb.id}
              notebook={nb}
              index={i}
              onOpen={() => onOpen(nb)}
              onToggleFavorite={() => toggleFavorite(nb.id)}
              onArchive={() => archiveNotebook(nb.id)}
              onDelete={() => removeNotebook(nb.id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function EmptyState({ filter, query, onCreate }: { filter: string; query: string; onCreate: () => void }) {
  if (query) {
    return (
      <div className="library-empty">
        <span>Nothing found ✦</span>
        <small>No notebooks match "{query}".</small>
      </div>
    );
  }
  if (filter === 'favorites') {
    return (
      <div className="library-empty">
        <span>Keep your favourites close ♡</span>
        <small>Star a notebook to see it here.</small>
      </div>
    );
  }
  if (filter === 'archived') {
    return (
      <div className="library-empty">
        <span>A quiet little archive</span>
        <small>Nothing is tucked away yet.</small>
      </div>
    );
  }
  return (
    <div className="library-empty library-empty--first">
      <span>Your desk is waiting ✿</span>
      <small>Make your first little notebook.</small>
      <button className="library-new-btn" onClick={onCreate}>
        <Icon name="plus" size={17} /> Create one
      </button>
    </div>
  );
}

function NotebookCard({
  notebook,
  index,
  onOpen,
  onToggleFavorite,
  onArchive,
  onDelete,
}: {
  notebook: Notebook;
  index: number;
  onOpen: () => void;
  onToggleFavorite: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const art = COVER_ART[index % COVER_ART.length];
  // Deterministic-but-varied height for masonry rhythm — mixes the id and
  // index so cards don't repeat the exact same height pattern down a column.
  const heightVariant = (notebook.id.charCodeAt(0) + index) % 4;

  return (
    <article className={`notebook-card notebook-card--h${heightVariant}`}>
      <button
        className="notebook-card-cover"
        style={{ background: notebook.coverColor }}
        onClick={onOpen}
        aria-label={`Open ${notebook.title}`}
      >
        <span className="cover-paper cover-paper--one" />
        <span className="cover-paper cover-paper--two" />
        <span className="cover-tape" />
        <span className="cover-art" aria-hidden="true">
          {art}
        </span>
        <span className="notebook-card-title">{notebook.title}</span>
        <span className="cover-caption">as you wish</span>
      </button>
      <div className="notebook-card-meta">
        <span className="notebook-card-date">
          {new Date(notebook.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
        <div className="notebook-card-actions">
          <button
            className={`icon-btn-sm${notebook.isFavorite ? ' is-active' : ''}`}
            onClick={onToggleFavorite}
            title="Favorite"
          >
            <Icon name="heart" size={15} />
          </button>
          <button className="icon-btn-sm" onClick={onArchive} title={notebook.isArchived ? 'Unarchive' : 'Archive'}>
            <Icon name="archive" size={15} />
          </button>
          {confirmingDelete ? (
            <button className="delete-confirm" onClick={onDelete} onBlur={() => setConfirmingDelete(false)}>
              Delete?
            </button>
          ) : (
            <button className="icon-btn-sm" onClick={() => setConfirmingDelete(true)} title="Delete">
              <Icon name="trash" size={15} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
