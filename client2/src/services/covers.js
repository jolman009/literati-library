// src/services/covers.js
import API from '../config/api.js';

/**
 * Client-side cover service - Makes API calls to server for cover fetching
 * Server handles the actual image fetching and processing with timeouts
 */

export async function ensureCoverForBook(book) {
  try {
    // If already present, return it
    if (book.cover_url && !book.cover_url.includes('placeholder') && !book.cover_url.includes('default')) {
      return { cover_url: book.cover_url, cover_base: book.cover_base };
    }

    console.warn(`🔍 Fetching cover for: "${book.title}" by ${book.author}`);

    // Call server API to resolve cover
    const response = await API.post('/covers/resolve', { 
      bookId: book.id,
      title: book.title,
      author: book.author 
    });
    
    console.warn(`📝 Server response for "${book.title}":`, response.data);
    
    if (response.data && response.data.cover_url) {
      return response.data;
    }
    
    console.warn(`❌ No cover found for "${book.title}"`);
    return { cover_url: null, cover_base: null };
  } catch (error) {
    console.error(`❌ Cover fetch failed for book "${book.title}":`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    return { cover_url: null, cover_base: null };
  }
}

/**
 * Get cover ETag for cache validation
 */
export async function getCoverEtag(bookId) {
  try {
    const response = await API.get('/covers/etag', { params: { id: bookId } });
    return response.data?.etag || null;
  } catch (error) {
    console.warn(`Cover ETag fetch failed for book ${bookId}:`, error.message);
    return null;
  }
}
