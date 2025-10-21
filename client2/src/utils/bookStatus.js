// Unified book status model and helpers

export const BOOK_STATUS = Object.freeze({
  UNREAD: 'unread',
  READING: 'reading',
  PAUSED: 'paused',
  COMPLETED: 'completed',
});

// Compute canonical status from a book record and optional reading session context
export function getStatus(book, readingSession) {
  if (!book || typeof book !== 'object') return BOOK_STATUS.UNREAD;

  // Direct status field wins if valid
  const raw = (book.status || '').toString().toLowerCase();
  if (Object.values(BOOK_STATUS).includes(raw)) return raw;

  // Normalize booleans and legacy flags
  if (book.completed === true) return BOOK_STATUS.COMPLETED;

  // Active session overrides
  const isActive = !!(readingSession && readingSession.activeSession && readingSession.activeSession.book && readingSession.activeSession.book.id === book.id);
  const isPaused = !!(readingSession && readingSession.isPaused && isActive);
  if (isActive && !isPaused) return BOOK_STATUS.READING;

  // Legacy reading flags
  if (book.is_reading === true || book.isReading === true) return BOOK_STATUS.READING;

  // Progress-based pause (has started but not completed)
  const progress = Number(book.progress || 0);
  if (progress > 0 && progress < 100) return BOOK_STATUS.PAUSED;

  return BOOK_STATUS.UNREAD;
}

// Return a new book object with fields updated to reflect a given status
export function applyStatus(book, status) {
  const s = normalizeStatus(status);
  const updated = { ...book, status: s };

  switch (s) {
    case BOOK_STATUS.READING:
      updated.is_reading = true;
      updated.isReading = true;
      updated.completed = false;
      // keep existing progress if present; otherwise set to >0 to indicate started
      if (!(Number(updated.progress) > 0)) updated.progress = 1;
      updated.last_opened = new Date().toISOString();
      break;
    case BOOK_STATUS.COMPLETED:
      updated.is_reading = false;
      updated.isReading = false;
      updated.completed = true;
      updated.progress = 100;
      updated.completed_at = updated.completed_at || new Date().toISOString();
      break;
    case BOOK_STATUS.PAUSED:
      updated.is_reading = false;
      updated.isReading = false;
      updated.completed = false;
      // ensure progress remains between 1 and 99
      if (!(Number(updated.progress) > 0 && Number(updated.progress) < 100)) {
        updated.progress = Number(updated.progress) === 100 ? 99 : Number(updated.progress) || 1;
      }
      break;
    case BOOK_STATUS.UNREAD:
    default:
      updated.is_reading = false;
      updated.isReading = false;
      updated.completed = false;
      updated.progress = 0;
      break;
  }

  return updated;
}

export function normalizeStatus(value) {
  const v = (value || '').toString().toLowerCase();
  if (Object.values(BOOK_STATUS).includes(v)) return v;
  // map legacy or variant strings
  if (v === 'in_progress' || v === 'started reading' || v === 'started_reading') return BOOK_STATUS.READING;
  return BOOK_STATUS.UNREAD;
}

export function isStatus(book, status, readingSession) {
  return getStatus(book, readingSession) === normalizeStatus(status);
}

// Status ordering helpers (for consistent sort menus)
export const STATUS_ORDER_DEFAULT = [
  BOOK_STATUS.READING,
  BOOK_STATUS.PAUSED,
  BOOK_STATUS.UNREAD,
  BOOK_STATUS.COMPLETED,
];

export function statusRank(status, order = STATUS_ORDER_DEFAULT) {
  const s = normalizeStatus(status);
  const idx = order.indexOf(s);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

export function compareByStatus(a, b, { readingSession = null, order = STATUS_ORDER_DEFAULT } = {}) {
  const sa = getStatus(a, readingSession);
  const sb = getStatus(b, readingSession);
  const ra = statusRank(sa, order);
  const rb = statusRank(sb, order);
  if (ra !== rb) return ra - rb;
  // Tie-breaker: progress desc, then title asc
  const pa = Number(a.progress || 0);
  const pb = Number(b.progress || 0);
  if (pb !== pa) return pb - pa;
  return (a.title || '').localeCompare(b.title || '');
}
