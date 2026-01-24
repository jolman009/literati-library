// src/services/covers.js
// Unified Cover Service - combines multiple sources, fallback generation, and batch processing
import fetch from 'node-fetch';
import Sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = 'covers';

// =====================================================
// Cover Source Configuration
// =====================================================

const COVER_SOURCES = {
  OPEN_LIBRARY: {
    priority: 1,
    timeout: 3000,
    buildUrls: (book) => {
      const urls = [];
      if (book.isbn13) urls.push(`https://covers.openlibrary.org/b/isbn/${book.isbn13}-L.jpg`);
      if (book.isbn10) urls.push(`https://covers.openlibrary.org/b/isbn/${book.isbn10}-L.jpg`);
      if (book.isbn) urls.push(`https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`);
      if (book.title) urls.push(`https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-L.jpg`);
      return urls;
    }
  },
  GOOGLE_BOOKS: {
    priority: 2,
    timeout: 4000,
    buildUrls: (book) => {
      const urls = [];
      if (book.isbn13 || book.isbn10 || book.isbn) {
        const isbn = book.isbn13 || book.isbn10 || book.isbn;
        urls.push(`https://books.google.com/books/content?vid=ISBN${isbn}&printsec=frontcover&img=1&zoom=1&source=gbs_api`);
      }
      if (book.title) {
        const query = encodeURIComponent(`${book.title} ${book.author || ''}`);
        urls.push(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`);
      }
      return urls;
    },
    processResponse: async (response, url) => {
      if (url.includes('googleapis.com')) {
        const data = await response.json();
        if (data.items && data.items[0]?.volumeInfo?.imageLinks?.thumbnail) {
          const coverUrl = data.items[0].volumeInfo.imageLinks.thumbnail.replace('&zoom=1', '&zoom=3');
          const coverResponse = await fetch(coverUrl);
          if (coverResponse.ok) {
            return Buffer.from(await coverResponse.arrayBuffer());
          }
        }
        return null;
      }
      return Buffer.from(await response.arrayBuffer());
    }
  },
  LIBRARY_THING: {
    priority: 3,
    timeout: 3000,
    buildUrls: (book) => {
      const urls = [];
      if (book.isbn13 || book.isbn10 || book.isbn) {
        const isbn = book.isbn13 || book.isbn10 || book.isbn;
        urls.push(`https://covers.librarything.com/devkey/KEY/large/isbn/${isbn}`);
      }
      return urls;
    }
  }
};

// =====================================================
// Utility Functions
// =====================================================

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ShelfQuest Book Library/1.0' }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

// =====================================================
// Fallback Cover Generation
// =====================================================

async function generateFallbackCover(book) {
  const width = 400;
  const height = 600;

  // Generate color based on book title hash
  const hash = crypto.createHash('md5').update(book.title || 'book').digest('hex');
  const hue = parseInt(hash.substring(0, 3), 16) % 360;
  const saturation = 60 + (parseInt(hash.substring(3, 5), 16) % 30);
  const lightness = 40 + (parseInt(hash.substring(5, 7), 16) % 20);

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue}, ${saturation}%, ${lightness}%);stop-opacity:1" />
          <stop offset="100%" style="stop-color:hsl(${hue + 30}, ${saturation - 10}%, ${lightness + 10}%);stop-opacity:1" />
        </linearGradient>
        <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="1.5" fill="white" opacity="0.1"/>
        </pattern>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)"/>
      <rect width="${width}" height="${height}" fill="url(#pattern)"/>

      <!-- Book spine effect -->
      <rect x="30" y="0" width="3" height="${height}" fill="black" opacity="0.1"/>
      <rect x="33" y="0" width="1" height="${height}" fill="white" opacity="0.1"/>

      <!-- Title background -->
      <rect x="0" y="${height * 0.3}" width="${width}" height="${height * 0.4}" fill="black" opacity="0.2"/>

      <!-- Title text -->
      <text x="${width / 2}" y="${height * 0.45}" font-family="Georgia, serif" font-size="32" fill="white" text-anchor="middle" font-weight="bold">
        ${escapeXml(truncateText(book.title || 'Untitled', 20))}
      </text>

      <!-- Author text -->
      <text x="${width / 2}" y="${height * 0.55}" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle" opacity="0.9">
        ${escapeXml(truncateText(book.author || 'Unknown Author', 25))}
      </text>

      <!-- Decorative elements -->
      <rect x="${width * 0.2}" y="${height * 0.65}" width="${width * 0.6}" height="2" fill="white" opacity="0.3"/>
      <rect x="${width * 0.3}" y="${height * 0.68}" width="${width * 0.4}" height="1" fill="white" opacity="0.2"/>

      ${book.genre ? `
        <rect x="${width - 100}" y="20" width="80" height="25" rx="12" fill="white" opacity="0.2"/>
        <text x="${width - 60}" y="37" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle">
          ${escapeXml(book.genre.substring(0, 10))}
        </text>
      ` : ''}
    </svg>
  `;

  return Sharp(Buffer.from(svg))
    .resize(width, height)
    .jpeg({ quality: 90 })
    .toBuffer();
}

// =====================================================
// Cover Source Lookup
// =====================================================

async function findCoverFromSources(book) {
  const allPromises = [];

  for (const [sourceName, config] of Object.entries(COVER_SOURCES)) {
    const urls = config.buildUrls(book);

    for (const url of urls) {
      if (!url || url.includes('KEY')) continue; // Skip if API key needed but not provided

      const promise = (async () => {
        try {
          console.log(`🔍 Trying ${sourceName}: ${url.substring(0, 50)}...`);
          const response = await fetchWithTimeout(url, config.timeout);

          if (response.ok) {
            let buffer;

            if (config.processResponse) {
              buffer = await config.processResponse(response, url);
            } else if (response.headers.get('content-type')?.includes('image')) {
              buffer = Buffer.from(await response.arrayBuffer());
            } else {
              return null;
            }

            // Validate it's a real image (not placeholder)
            if (buffer && buffer.length > 1024) {
              console.log(`✅ Found cover from ${sourceName}`);
              return { buffer, source: sourceName };
            }
          }
        } catch (error) {
          console.log(`⚠️ ${sourceName} failed: ${error.message}`);
        }
        return null;
      })();

      allPromises.push(promise);
    }
  }

  const results = await Promise.allSettled(allPromises);

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
  }

  return null;
}

// =====================================================
// Cover Storage (with AVIF, WebP, JPG variants)
// =====================================================

async function storeCoverVariants(bookId, imageBuffer) {
  const sizes = [192, 256, 384, 512];
  const formats = [
    { ext: 'avif', fn: (i) => i.avif({ quality: 60 }) },
    { ext: 'webp', fn: (i) => i.webp({ quality: 75 }) },
    { ext: 'jpg',  fn: (i) => i.jpeg({ quality: 80 }) },
  ];

  // Store original
  const originalPath = `books/${bookId}/original.jpg`;
  await supabase.storage.from(BUCKET).upload(originalPath, imageBuffer, {
    cacheControl: '31536000',
    upsert: true,
    contentType: 'image/jpeg'
  });

  const uploaded = [];

  for (const width of sizes) {
    const height = Math.round(width * 1.5); // 2:3 aspect ratio

    for (const { ext, fn } of formats) {
      const processed = await fn(
        Sharp(imageBuffer)
          .resize({ width, height, fit: 'cover', position: 'center' })
      ).toBuffer();

      const path = `books/${bookId}/${width}x${height}.${ext}`;

      await supabase.storage.from(BUCKET).upload(path, processed, {
        cacheControl: '31536000',
        upsert: true,
        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`
      });

      uploaded.push(path);
    }
  }

  const canonical = `books/${bookId}/384x576.webp`;
  return { canonical, baseDir: `books/${bookId}/` };
}

// =====================================================
// Public API
// =====================================================

/**
 * Upload a cover image manually
 */
export async function uploadCover(userId, fileBuffer, fileName, mimeType) {
  const uniquePath = `${userId}/covers/${Date.now()}-${fileName}`;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(uniquePath, fileBuffer, {
      contentType: mimeType,
      cacheControl: '31536000',
      upsert: false
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  return { publicUrl, path: data.path };
}

/**
 * Ensure a book has a cover - finds from external sources or generates fallback
 */
export async function ensureCoverForBook(book) {
  try {
    // Check if cover already exists
    if (book.cover_url && !book.cover_url.includes('placeholder')) {
      console.log(`📚 Book "${book.title}" already has cover`);
      return {
        cover_url: book.cover_url,
        cover_base: book.cover_base,
        source: 'existing'
      };
    }

    console.log(`🔍 Finding cover for: "${book.title}" by ${book.author}`);

    // Try to find cover from external sources
    let coverData = await findCoverFromSources(book);

    // Generate fallback if no cover found
    if (!coverData) {
      console.log(`🎨 Generating fallback cover for "${book.title}"`);
      const fallbackBuffer = await generateFallbackCover(book);
      coverData = { buffer: fallbackBuffer, source: 'generated' };
    }

    // Store cover variants
    const { canonical, baseDir } = await storeCoverVariants(book.id, coverData.buffer);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(canonical);

    const result = {
      cover_url: publicUrl,
      cover_base: baseDir,
      source: coverData.source
    };

    // Update database
    const { error: updateError } = await supabase
      .from('books')
      .update({
        cover_url: result.cover_url,
        cover_base: result.cover_base,
        cover_source: result.source,
        cover_updated_at: new Date().toISOString()
      })
      .eq('id', book.id);

    if (updateError) {
      console.error(`Failed to update book ${book.id}:`, updateError);
    } else {
      console.log(`✅ Updated "${book.title}" with ${result.source} cover`);
    }

    return result;

  } catch (error) {
    console.error(`❌ Cover service error for "${book.title}":`, error);

    // Generate fallback on any error
    try {
      const fallbackBuffer = await generateFallbackCover(book);
      const { canonical, baseDir } = await storeCoverVariants(book.id, fallbackBuffer);
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(canonical);

      return {
        cover_url: publicUrl,
        cover_base: baseDir,
        source: 'generated-error-fallback'
      };
    } catch (fallbackError) {
      console.error('Failed to generate fallback:', fallbackError);
      return { cover_url: null, cover_base: null, source: 'error' };
    }
  }
}

/**
 * Batch process covers for multiple books
 */
export async function ensureCoversForBooks(books, options = {}) {
  const {
    batchSize = 5,
    delay = 500
  } = options;

  const results = [];

  for (let i = 0; i < books.length; i += batchSize) {
    const batch = books.slice(i, i + batchSize);

    console.log(`📚 Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(books.length/batchSize)}`);

    const batchPromises = batch.map(book => ensureCoverForBook(book));
    const batchResults = await Promise.allSettled(batchPromises);

    results.push(...batchResults.map((result, index) => ({
      book: batch[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    })));

    // Delay between batches to avoid rate limiting
    if (i + batchSize < books.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Cover processing complete: ${successCount}/${books.length} successful`);

  return results;
}
