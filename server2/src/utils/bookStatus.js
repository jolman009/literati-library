// Server-side book status normalization (canonical: status)

export const BOOK_STATUS = Object.freeze({
  UNREAD: 'unread',
  READING: 'reading',
  PAUSED: 'paused',
  COMPLETED: 'completed',
});

export function normalizeStatus(value) {
  const v = (value || '').toString().toLowerCase();
  if (Object.values(BOOK_STATUS).includes(v)) return v;
  if (v === 'in_progress' || v === 'started reading' || v === 'started_reading') return BOOK_STATUS.READING;
  return BOOK_STATUS.UNREAD;
}

// Merge incoming update fields into a consistent, canonical structure
// Returns a patch with canonical status and legacy flags set consistently
export function normalizeBookUpdate(data = {}) {
  const patch = { ...data };

  // Determine target status
  let status = null;
  if (patch.status) {
    status = normalizeStatus(patch.status);
  } else if (patch.completed === true) {
    status = BOOK_STATUS.COMPLETED;
  } else if (patch.is_reading === true || patch.isReading === true) {
    status = BOOK_STATUS.READING;
  } else if (Number(patch.progress || 0) >= 100) {
    status = BOOK_STATUS.COMPLETED;
  } else if (Number(patch.progress || 0) > 0) {
    status = BOOK_STATUS.PAUSED;
  }

  if (status) {
    patch.status = status;
    switch (status) {
      case BOOK_STATUS.READING:
        patch.is_reading = true;
        patch.isReading = true;
        patch.completed = false;
        if (!(Number(patch.progress) > 0)) patch.progress = 1;
        patch.last_opened = new Date().toISOString();
        break;
      case BOOK_STATUS.COMPLETED:
        patch.is_reading = false;
        patch.isReading = false;
        patch.completed = true;
        patch.progress = 100;
        patch.completed_at = patch.completed_at || new Date().toISOString();
        break;
      case BOOK_STATUS.PAUSED:
        patch.is_reading = false;
        patch.isReading = false;
        patch.completed = false;
        if (!(Number(patch.progress) > 0 && Number(patch.progress) < 100)) {
          patch.progress = Number(patch.progress) === 100 ? 99 : Number(patch.progress) || 1;
        }
        break;
      case BOOK_STATUS.UNREAD:
      default:
        patch.is_reading = false;
        patch.isReading = false;
        patch.completed = false;
        patch.progress = 0;
        break;
    }
  }

  return patch;
}

