// src/api/summaryApi.js
// Client-side API + cache for AI content summaries
import API from '../config/api';

const CACHE_PREFIX = 'shelfquest_summary_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Build a cache key for a summary request.
 */
function cacheKey(bookId, identifier) {
  return `${CACHE_PREFIX}${bookId}_${identifier}`;
}

/**
 * Get a cached summary if available and not expired.
 */
function getCached(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Cache a summary result.
 */
function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {
    // localStorage may be full; silently fail
  }
}

/**
 * Fetch an AI summary for book content.
 * Returns cached result if available, otherwise calls the backend.
 *
 * @param {Object} params
 * @param {string} params.text - The text content to summarize
 * @param {string} params.bookId - Book ID for caching
 * @param {string} params.bookTitle - Book title for context
 * @param {string} [params.chapterTitle] - Chapter title
 * @param {string} [params.pageRange] - e.g., "5" or "5-10"
 * @param {string} [params.mode] - 'brief' or 'detailed'
 * @param {boolean} [params.skipCache] - Force fresh generation
 * @returns {Promise<Object>} { summary, keyPoints[], themes[], questions[], fallback }
 */
export async function fetchSummary({ text, bookId, bookTitle, chapterTitle, pageRange, mode = 'brief', skipCache = false }) {
  const identifier = pageRange || chapterTitle || 'default';
  const key = cacheKey(bookId, `${identifier}_${mode}`);

  // Check cache first
  if (!skipCache) {
    const cached = getCached(key);
    if (cached) return { ...cached, cached: true };
  }

  const res = await API.post('/ai/summarize-content', {
    text,
    bookTitle,
    chapterTitle,
    pageRange,
    mode,
  });

  const data = res.data;

  // Cache the result
  if (data && !data.error) {
    setCache(key, data);
  }

  return { ...data, cached: false };
}

/**
 * Clear all cached summaries for a specific book.
 */
export function clearBookSummaryCache(bookId) {
  const prefix = `${CACHE_PREFIX}${bookId}_`;
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) keysToRemove.push(key);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}
