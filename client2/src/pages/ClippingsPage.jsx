// ClippingsPage — grid view of web clippings captured by the browser extension.
// Follows the same layout conventions as EnhancedNotesPage.

import React, { useState, useMemo } from 'react';
import { useClippings } from '../hooks/useClippings';
import { Scissors, Search, ExternalLink, Trash2, CheckCircle2, BookOpen } from 'lucide-react';
import './ClippingsPage.css';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return '';
  }
}

function ClippingCard({ clipping, onMarkRead, onDelete }) {
  return (
    <article className={`clipping-card${clipping.is_read ? '' : ' clipping-card--unread'}`}>
      {/* Source row */}
      <div className="clipping-card-source">
        {clipping.favicon_url && (
          <img
            src={clipping.favicon_url}
            alt=""
            className="clipping-card-favicon"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <span>{clipping.site_name || new URL(clipping.url).hostname}</span>
      </div>

      {/* Title */}
      <h3 className="clipping-card-title">
        <a href={clipping.url} target="_blank" rel="noopener noreferrer">
          {clipping.title}
        </a>
      </h3>

      {/* Selected text blockquote */}
      {clipping.selected_text && (
        <blockquote className="clipping-card-quote">
          {clipping.selected_text}
        </blockquote>
      )}

      {/* Tags */}
      {clipping.tags?.length > 0 && (
        <div className="clipping-card-tags">
          {clipping.tags.map(tag => (
            <span key={tag} className="clipping-tag">{tag}</span>
          ))}
        </div>
      )}

      {/* Book link */}
      {clipping.book && (
        <div className="clipping-book-link">
          <BookOpen size={12} />
          <span>{clipping.book.title}</span>
        </div>
      )}

      {/* Actions */}
      <div className="clipping-card-actions">
        {!clipping.is_read && (
          <button
            className="clipping-action-btn"
            onClick={() => onMarkRead(clipping.id)}
            title="Mark as read"
            aria-label="Mark as read"
          >
            <CheckCircle2 size={18} />
          </button>
        )}
        <a
          href={clipping.url}
          target="_blank"
          rel="noopener noreferrer"
          className="clipping-action-btn"
          title="Open original"
          aria-label="Open original page"
        >
          <ExternalLink size={18} />
        </a>
        <button
          className="clipping-action-btn clipping-action-btn--danger"
          onClick={() => onDelete(clipping.id)}
          title="Delete"
          aria-label="Delete clipping"
        >
          <Trash2 size={18} />
        </button>
        <span className="clipping-card-date">{formatDate(clipping.created_at)}</span>
      </div>
    </article>
  );
}

export default function ClippingsPage() {
  const { clippings, loading, error, stats, markRead, deleteClipping } = useClippings();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return clippings;
    const q = search.toLowerCase();
    return clippings.filter(c =>
      c.title?.toLowerCase().includes(q) ||
      c.site_name?.toLowerCase().includes(q) ||
      c.selected_text?.toLowerCase().includes(q) ||
      c.tags?.some(t => t.toLowerCase().includes(q))
    );
  }, [clippings, search]);

  if (loading) {
    return <div className="clippings-loading">Loading clippings...</div>;
  }

  return (
    <div className="clippings-page">
      {/* Header */}
      <div className="clippings-header">
        <h1>
          <Scissors size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Clippings
        </h1>
        <div className="clippings-stats">
          <span className="clippings-stat"><strong>{stats.total}</strong> total</span>
          <span className="clippings-stat"><strong>{stats.unread}</strong> unread</span>
          <span className="clippings-stat"><strong>{stats.withBook}</strong> linked to books</span>
        </div>
        <div className="clippings-search">
          <Search size={16} className="clippings-search-icon" />
          <input
            type="text"
            placeholder="Search clippings..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search clippings"
          />
        </div>
      </div>

      {error && (
        <div role="alert" style={{ color: 'var(--md-sys-color-error)', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Grid or empty state */}
      {filtered.length > 0 ? (
        <div className="clippings-grid">
          {filtered.map(c => (
            <ClippingCard
              key={c.id}
              clipping={c}
              onMarkRead={markRead}
              onDelete={deleteClipping}
            />
          ))}
        </div>
      ) : (
        <div className="clippings-empty">
          <Scissors size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h2>No clippings yet</h2>
          <p>
            Install the ShelfQuest browser extension, then right-click any web page
            and select &quot;Save to ShelfQuest&quot; to start collecting clippings.
          </p>
        </div>
      )}
    </div>
  );
}
