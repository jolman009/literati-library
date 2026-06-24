import React from 'react';
import { BookOpen, MoreVertical } from 'lucide-react';
import './BookCard.css';

/*
 * BookCard — shared grid card for a book, recreated from the ShelfQuest
 * "Core App" design handoff (LibraryScreen / DashboardScreen BookCard).
 *
 * Mapped to the app's MD3 tokens (no window.SQ kit). Shows the real cover
 * image when present (gradient placeholder fallback), a status pill, title,
 * author, an optional progress bar, and an optional kebab actions affordance.
 *
 * Designed to be reused by the Dashboard "Currently Reading" carousel.
 */

const STATUS = {
  reading: { label: 'Reading', cls: 'reading' },
  completed: { label: 'Completed', cls: 'completed' },
  'to-read': { label: 'To Read', cls: 'unread' },
};

const BookCard = ({ book, status = 'to-read', notesCount = 0, active = false, onOpen, onMenu, testId, titleTestId, authorTestId }) => {
  const st = STATUS[status] || STATUS['to-read'];
  const progress = typeof book.progress === 'number' ? Math.max(0, Math.min(100, book.progress)) : null;

  return (
    <div
      className={`sq-bookcard ${active ? 'is-active' : ''}`}
      data-testid={testId}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen?.(); } }}
    >
      <div className="sq-bookcard__cover">
        {book.cover_url ? (
          <img src={book.cover_url} alt="" loading="lazy" />
        ) : (
          <span className="sq-bookcard__placeholder" aria-hidden="true"><BookOpen size={30} /></span>
        )}
        <span className={`sq-bookcard__status sq-bookcard__status--${st.cls}`}>{st.label}</span>
        {onMenu && (
          <button
            type="button"
            className="sq-bookcard__menu"
            aria-label="Book actions"
            onClick={(e) => { e.stopPropagation(); onMenu(e); }}
          >
            <MoreVertical size={18} />
          </button>
        )}
      </div>

      <div className="sq-bookcard__body">
        <div className="sq-bookcard__title" data-testid={titleTestId || (testId ? `${testId}-title` : undefined)}>{book.title}</div>
        <div className="sq-bookcard__author" data-testid={authorTestId || (testId ? `${testId}-author` : undefined)}>{book.author || '—'}</div>
        {progress != null && progress > 0 && (
          <div className="sq-bookcard__progress" aria-label={`${progress}% read`}>
            <div className="sq-bookcard__progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
        {notesCount > 0 && (
          <div className="sq-bookcard__notes">{notesCount} note{notesCount === 1 ? '' : 's'}</div>
        )}
      </div>
    </div>
  );
};

export default BookCard;
