// src/api/translatorApi.js
// Client-side API + cache for AI translation and simplification
import API from '../config/api';

const CACHE_PREFIX = 'shelfquest_translator_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashText(text) {
  let hash = 0;
  const str = text.substring(0, 200);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return hash.toString();
}

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

function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // localStorage may be full
  }
}

/**
 * Translate a passage to a target language.
 * @returns {Promise<{ translatedText, sourceLanguage, targetLanguage, fallback, cached }>}
 */
export async function translatePassage({ text, targetLanguage, bookTitle, bookId }) {
  const key = `${CACHE_PREFIX}translate_${bookId || 'none'}_${hashText(text)}_${targetLanguage}`;

  const cached = getCached(key);
  if (cached) return { ...cached, cached: true };

  const res = await API.post('/ai/translate-passage', { text, targetLanguage, bookTitle });
  const data = res.data;

  if (data && !data.error) {
    setCache(key, data);
  }

  return { ...data, cached: false };
}

/**
 * Simplify a passage to a target reading level.
 * @returns {Promise<{ simplifiedText, level, keyTerms[], fallback, cached }>}
 */
export async function simplifyPassage({ text, level = 'easy', bookTitle, bookId }) {
  const key = `${CACHE_PREFIX}simplify_${bookId || 'none'}_${hashText(text)}_${level}`;

  const cached = getCached(key);
  if (cached) return { ...cached, cached: true };

  const res = await API.post('/ai/simplify-passage', { text, level, bookTitle });
  const data = res.data;

  if (data && !data.error) {
    setCache(key, data);
  }

  return { ...data, cached: false };
}
