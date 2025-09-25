// src/services/covers.js
import fetch from 'node-fetch';
import Sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = 'covers'; // create if not exists


export async function uploadCover(userId, fileBuffer, fileName, mimeType) {
  const uniquePath = `${userId}/covers/${Date.now()}-${fileName}`;
  const { data, error } = await supabase.storage
    .from('covers')
    .upload(uniquePath, fileBuffer, {
      contentType: mimeType,
      cacheControl: '31536000', // 1 year cache
      upsert: false
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('covers')
    .getPublicUrl(data.path);

  return { publicUrl, path: data.path };
}

// Try local (already in storage), then Open Library, then Google Books
async function findCoverUrl({ isbn13, isbn10, title, author }) {
  // 1) Open Library (free, fast)
  const candidates = [];
  if (isbn13) candidates.push(`https://covers.openlibrary.org/b/isbn/${isbn13}-L.jpg`);
  if (isbn10) candidates.push(`https://covers.openlibrary.org/b/isbn/${isbn10}-L.jpg`);
  // 2) Title/Author fallback via Open Library search
  if (title) candidates.push(`https://covers.openlibrary.org/b/title/${encodeURIComponent(title)}-L.jpg`);
  // 3) (Optional) Google Books volumes lookup (requires API key)
  // ... add your Google Books logic if desired

  for (const url of candidates) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const res = await fetch(url, { 
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (res.ok && res.headers.get('content-type')?.includes('image')) {
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length > 1024) return { buffer, source: url };
      }
    } catch (error) {
      // Log but continue to next candidate
      if (error.name === 'AbortError') {
        console.log(`Cover fetch timeout for: ${url}`);
      } else {
        console.log(`Cover fetch error for ${url}:`, error.message);
      }
      continue;
    }
  }
  return null;
}

async function storeCoverVariants(bookId, imageBuffer) {
  // Produce AVIF/WebP/JPEG and multiple sizes for responsive loading (2:3 aspect)
  const sizes = [192, 256, 384, 512]; // width
  const formats = [
    { ext: 'avif', fn: (i) => i.avif({ quality: 60 }) },
    { ext: 'webp', fn: (i) => i.webp({ quality: 75 }) },
    { ext: 'jpg',  fn: (i) => i.jpeg({ quality: 80 }) },
  ];

  // Save original too (optional)
  const originalPath = `original/${bookId}.jpg`;
  await supabase.storage.from(BUCKET).upload(originalPath, imageBuffer, {
    cacheControl: '31536000', upsert: true, contentType: 'image/jpeg'
  });

  const uploaded = [];
  for (const w of sizes) {
    for (const { ext, fn } of formats) {
      const out = await fn(Sharp(imageBuffer).resize({ width: w, height: Math.round(w * 1.5), fit: 'cover' })).toBuffer();
      const path = `${bookId}/${w}.${ext}`;
      await supabase.storage.from(BUCKET).upload(path, out, {
        cacheControl: '31536000', upsert: true, contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`
      });
      uploaded.push(path);
    }
  }

  // Return a canonical “default” path + the variant base for srcset
  const canonical = `${bookId}/384.webp`; // good mid-size default
  return { canonical, baseDir: `${bookId}/` };
}

export async function ensureCoverForBook(book) {
  // If already present, return it
  if (book.cover_url) return { cover_url: book.cover_url, cover_base: book.cover_base };

  // Find a cover
  const found = await findCoverUrl({
    isbn13: book.isbn13, isbn10: book.isbn10, title: book.title, author: book.author
  });
  if (!found) return { cover_url: null, cover_base: null };

  // Store responsive variants
  const { canonical, baseDir } = await storeCoverVariants(book.id, found.buffer);

  // Get public (or signed) URL(s)
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(canonical);
  // If the bucket is private, generate a signed URL instead:
  // const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(canonical, 60 * 60 * 24 * 365);

  const coverResult = { cover_url: pub.publicUrl, cover_base: baseDir };

  // IMPORTANT: Update the book record in the database with the new cover
  try {
    const { error: updateError } = await supabase
      .from('books')
      .update({
        cover_url: coverResult.cover_url,
        cover_base: coverResult.cover_base,
        updated_at: new Date().toISOString()
      })
      .eq('id', book.id);

    if (updateError) {
      console.error(`Failed to update book ${book.id} with cover:`, updateError);
      // Don't throw - we still want to return the cover URL even if DB update fails
    } else {
      console.log(`✅ Updated book "${book.title}" with cover in database`);
    }
  } catch (dbError) {
    console.error(`Database error updating book ${book.id} with cover:`, dbError);
  }

  return coverResult;
}
