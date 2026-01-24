// src/routes/books.js
import express from 'express';
import multer from 'multer';
import axios from 'axios';
import { ensureCoverForBook } from '../services/covers.js';
import { supabase } from "../config/supabaseClient.js";
import { dbOptimizer } from '../services/database-optimization.js';
import { optimizedQuery, optimizedSearch, optimizedBatch } from '../services/query-optimizer.js';
import { advancedCache } from '../services/advanced-caching.js';

// Allowed CORS origins for book file streaming
const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',
  'https://shelfquest.app',
  'https://www.shelfquest.app',
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean));

// Validate and return allowed origin or null
function getAllowedOrigin(requestOrigin) {
  if (!requestOrigin) return null;
  // Also handle referer-style URLs by extracting origin
  const origin = requestOrigin.replace(/\/$/, '').split('/').slice(0, 3).join('/');
  return ALLOWED_ORIGINS.has(origin) ? origin : null;
}

// Multer configuration for book upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/epub+zip', 'application/epub'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and EPUB files are allowed'), false);
    }
  },
});

export function booksRouter(authenticateToken) {
  const router = express.Router();

  // Handle OPTIONS preflight for CORS
  router.options("/:id/file", (req, res) => {
    const allowedOrigin = getAllowedOrigin(req.headers.origin || req.headers.referer);
    if (allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Cookie, Authorization');
    res.status(204).end();
  });

  // Proxy endpoint to stream book files (needed for EPUB.js to work with private storage)
  router.get("/:id/file", (req, res, next) => {
    console.log('🔐 Book file proxy - checking authentication:', {
      hasCookies: !!req.cookies,
      cookies: Object.keys(req.cookies || {}),
      hasAuthHeader: !!req.headers.authorization,
      origin: req.headers.origin
    });
    next();
  }, authenticateToken, async (req, res) => {
    try {
      const bookId = req.params.id;
      const userId = req.user.id;

      console.log(`📖 Proxying file for book ${bookId}, user ${userId}`);

      // Get book record to verify ownership and get file_path
      const { data: book, error: bookError } = await supabase
        .from("books")
        .select("*")
        .eq("id", bookId)
        .eq("user_id", userId)
        .single();

      if (bookError || !book) {
        console.error("Book not found or access denied:", bookError);
        return res.status(404).json({ error: "Book not found" });
      }

      if (!book.file_path) {
        console.error("Book has no file_path:", book);
        return res.status(404).json({ error: "Book file not found" });
      }

      // Download file from Supabase storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('book-files')
        .download(book.file_path);

      if (downloadError || !fileData) {
        console.error("Failed to download file from storage:", downloadError);
        return res.status(500).json({ error: "Failed to retrieve book file" });
      }

      console.log(`✅ Successfully downloaded file: ${book.file_path}, size: ${fileData.size} bytes`);

      // Set appropriate headers
      const contentType = book.file_type || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', fileData.size);
      res.setHeader('Content-Disposition', `inline; filename="${book.filename || 'book'}"`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      // Enable CORS with credentials - validate against allowed origins
      const allowedOrigin = getAllowedOrigin(req.headers.origin || req.headers.referer);
      if (allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Cookie');

      // Convert blob to buffer and send
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.send(buffer);
    } catch (error) {
      console.error("Error proxying book file:", error);
      res.status(500).json({ error: "Failed to retrieve book file" });
    }
  });

  // Get a specific book by ID
  router.get("/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      const { data: book, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", id)
        .eq("user_id", req.user.id)
        .single();

      if (error || !book) {
        console.error("Book fetch error:", error);
        return res.status(404).json({ error: "Book not found" });
      }

      // Derive format from file_type or filename for reader compatibility
      if (!book.format) {
        if (book.file_type?.includes('pdf')) {
          book.format = 'pdf';
        } else if (book.file_type?.includes('epub') || book.filename?.toLowerCase().endsWith('.epub')) {
          book.format = 'epub';
        } else if (book.filename) {
          // Fallback: derive from filename extension
          const ext = book.filename.split('.').pop()?.toLowerCase();
          book.format = ext === 'pdf' ? 'pdf' : ext === 'epub' ? 'epub' : 'pdf';
        } else {
          book.format = 'pdf'; // Default fallback
        }
      }

      // Return book immediately without waiting for cover
      res.json(book);
      
      // Fetch cover in background if missing (non-blocking)
      if (!book.cover_url) {
        setTimeout(async () => {
          try {
            await ensureCoverForBook(book);
          } catch (coverError) {
            console.error(`Background cover fetch failed for ${book.title}:`, coverError.message);
          }
        }, 100);
      }
    } catch (error) {
      console.error("Book endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // List user's books - optimized with caching and intelligent querying
  router.get("/", authenticateToken, async (req, res) => {
    try {
      // Parse query parameters for filtering and pagination
      const MAX_PAGE_SIZE = parseInt(process.env.BOOKS_MAX_PAGE_SIZE || '200', 10);
      const {
        limit = 50,
        offset = 0,
        status = null,
        genre = null,
        orderBy = 'created_at',
        orderDirection = 'desc'
      } = req.query;

      // Clamp and sanitize pagination
      const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), MAX_PAGE_SIZE);
      const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

      // Use optimized query with caching
      const { data: books, count, error } = await dbOptimizer.getOptimizedBookList(req.user.id, {
        limit: parsedLimit,
        offset: parsedOffset,
        status,
        genre,
        orderBy,
        orderDirection
      });

      if (error) {
        console.error("Optimized books fetch error:", error);
        return res.status(500).json({ error: "Failed to fetch books", details: error.message });
      }

      // Derive format for each book to ensure reader compatibility
      if (books && books.length > 0) {
        books.forEach(book => {
          if (!book.format) {
            if (book.file_type?.includes('pdf')) {
              book.format = 'pdf';
            } else if (book.file_type?.includes('epub') || book.filename?.toLowerCase().endsWith('.epub')) {
              book.format = 'epub';
            } else if (book.filename) {
              const ext = book.filename.split('.').pop()?.toLowerCase();
              book.format = ext === 'pdf' ? 'pdf' : ext === 'epub' ? 'epub' : 'pdf';
            } else {
              book.format = 'pdf';
            }
          }
        });
      }

      // Build consistent response shape with total for pagination
      const total = typeof count === 'number' ? count : (books?.length || 0);

      // Return books immediately with performance metrics (development only)
      if (process.env.NODE_ENV === 'development') {
        const metrics = dbOptimizer.getPerformanceMetrics();
        res.json({
          items: books || [],
          total,
          limit: parsedLimit,
          offset: parsedOffset,
          orderBy,
          orderDirection,
          // Backward compatibility field (to be removed after client migration)
          books: books || [],
          _performance: metrics.getBookList
        });
      } else {
        res.json({
          items: books || [],
          total,
          limit: parsedLimit,
          offset: parsedOffset,
          orderBy,
          orderDirection,
          // Backward compatibility field (to be removed after client migration)
          books: books || []
        });
      }
      
      // Optionally fetch covers in background (non-blocking)
      // This won't affect the response but will cache covers for future use
      if (books && books.length > 0) {
        setTimeout(() => {
          books.forEach(async (book) => {
            if (!book.cover_url) {
              try {
                await ensureCoverForBook(book);
              } catch (err) {
                console.error(`Background cover fetch failed for ${book.title}:`, err.message);
              }
            }
          });
        }, 100);
      }
    } catch (error) {
      console.error("Books endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Upload a new book
  router.post("/upload", authenticateToken, upload.single('book'), async (req, res) => {
    try {
      const { title, author, genre, description } = req.body;
      const file = req.file;

      // Validate required fields
      if (!file) {
        return res.status(400).json({ error: "No book file uploaded" });
      }
      if (!title || !author) {
        return res.status(400).json({ error: "Title and author are required" });
      }

      // Upload file to Supabase Storage - sanitize filename
      const sanitizedFilename = file.originalname
        .normalize('NFD')  // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, '')  // Remove accent marks
        .replace(/[^a-zA-Z0-9._-]/g, '_')  // Replace invalid characters with underscore
        .replace(/_{2,}/g, '_');  // Replace multiple underscores with single
      
      const fileName = `${Date.now()}-${sanitizedFilename}`;
      const filePath = `books/${req.user.id}/${fileName}`;

      const { data: fileData, error: uploadError } = await supabase.storage
        .from('book-files')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error("File upload error:", uploadError);
        return res.status(500).json({ error: "Failed to upload file" });
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('book-files')
        .getPublicUrl(filePath);

      // Create book record in database
      // Include all fields, but Supabase will ignore any that don't exist in the table
      const bookData = {
        user_id: req.user.id,
        title: title.trim(),
        author: author.trim(),
        genre: genre?.trim() || null,
        description: description?.trim() || null,
        file_url: urlData.publicUrl,
        file_path: filePath,
        file_size: file.size,
        file_type: file.mimetype,
        filename: file.originalname,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("📚 Attempting to insert book with data:", {
        title: bookData.title,
        author: bookData.author,
        user_id: bookData.user_id
      });

      const { data: book, error: dbError } = await supabase
        .from("books")
        .insert(bookData)
        .select()
        .single();

      if (dbError) {
        console.error("Database insert error details:", {
          error: dbError,
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          code: dbError.code,
          bookData: bookData
        });
        // Try to clean up uploaded file
        await supabase.storage.from('book-files').remove([filePath]);
        return res.status(500).json({ 
          error: "Failed to save book to database",
          details: dbError.message || dbError.details || "Unknown database error"
        });
      }

      // Try to generate a cover (non-blocking)
      try {
        const coverResult = await ensureCoverForBook(book);
        if (coverResult.cover_url) {
          book.cover_url = coverResult.cover_url;
        }
      } catch (coverError) {
        console.error("Cover generation failed (non-critical):", coverError);
        // Continue without cover
      }

      res.status(201).json(book);

    } catch (error) {
      console.error("Book upload error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Import book from Google Drive
  router.post("/import/googledrive", authenticateToken, async (req, res) => {
    try {
      const { fileId, fileName, mimeType, sizeBytes, accessToken } = req.body;

      // Validate required fields
      if (!fileId || !fileName || !accessToken) {
        return res.status(400).json({ error: "Missing required fields: fileId, fileName, accessToken" });
      }

      // Validate file type
      const allowedMimeTypes = [
        'application/pdf',
        'application/epub+zip',
        'application/epub'
      ];
      if (!allowedMimeTypes.includes(mimeType)) {
        return res.status(400).json({ error: "Only PDF and EPUB files are allowed" });
      }

      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024;
      if (sizeBytes && sizeBytes > maxSize) {
        return res.status(400).json({ error: "File size exceeds 50MB limit" });
      }

      console.log(`📥 Downloading file from Google Drive: ${fileName} (${fileId})`);

      // Download file from Google Drive using the access token
      // Security: OAuth token is only used server-side, never exposed to client
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const driveResponse = await axios.get(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        responseType: 'arraybuffer',
        maxContentLength: maxSize,
        timeout: 60000, // 60 second timeout
      });

      const fileBuffer = Buffer.from(driveResponse.data);

      console.log(`✅ Downloaded file from Google Drive: ${fileBuffer.length} bytes`);

      // Upload file to Supabase Storage - sanitize filename
      const sanitizedFilename = fileName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_{2,}/g, '_');

      const storagePath = `books/${req.user.id}/${Date.now()}-${sanitizedFilename}`;

      const { data: fileData, error: uploadError } = await supabase.storage
        .from('book-files')
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return res.status(500).json({ error: "Failed to upload file to storage" });
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('book-files')
        .getPublicUrl(storagePath);

      // Extract metadata from filename (title and author if possible)
      const fileNameWithoutExt = fileName.replace(/\.(pdf|epub)$/i, '');
      const titleGuess = fileNameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      // Create book record in database
      const bookData = {
        user_id: req.user.id,
        title: titleGuess, // Auto-extracted from filename
        author: 'Unknown', // User can edit later
        genre: null,
        description: `Imported from Google Drive`,
        file_url: urlData.publicUrl,
        file_path: storagePath,
        file_size: fileBuffer.length,
        file_type: mimeType,
        filename: fileName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("📚 Creating book record from Google Drive import:", {
        title: bookData.title,
        user_id: bookData.user_id
      });

      const { data: book, error: dbError } = await supabase
        .from("books")
        .insert(bookData)
        .select()
        .single();

      if (dbError) {
        console.error("Database insert error:", dbError);
        // Clean up uploaded file
        await supabase.storage.from('book-files').remove([storagePath]);
        return res.status(500).json({
          error: "Failed to save book to database",
          details: dbError.message || "Unknown database error"
        });
      }

      // Try to generate a cover (non-blocking)
      try {
        const coverResult = await ensureCoverForBook(book);
        if (coverResult.cover_url) {
          book.cover_url = coverResult.cover_url;
        }
      } catch (coverError) {
        console.error("Cover generation failed (non-critical):", coverError);
      }

      console.log(`✅ Successfully imported book from Google Drive: ${book.title}`);
      res.status(201).json(book);

    } catch (error) {
      console.error("Google Drive import error:", error);

      // Handle specific error types
      if (error.response?.status === 401) {
        return res.status(401).json({ error: "Invalid or expired Google Drive access token" });
      } else if (error.response?.status === 404) {
        return res.status(404).json({ error: "File not found in Google Drive" });
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return res.status(504).json({ error: "Google Drive download timeout - file may be too large" });
      }

      res.status(500).json({ error: "Failed to import from Google Drive" });
    }
  });

  // Update book properties (PATCH)
  router.patch("/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Map client field names to database column names and filter valid columns
      const fieldMapping = {
        'isReading': 'is_reading', // Map camelCase to snake_case if needed
        // Add more mappings as needed
      };
      
      // Valid columns that exist in the database (add/remove as needed)
      const validColumns = ['title', 'author', 'genre', 'description', 'is_reading', 'progress', 'last_opened', 'completed', 'completed_date'];
      
      const cleanUpdates = Object.keys(updates).reduce((acc, key) => {
        if (updates[key] !== undefined && updates[key] !== null) {
          // Map field name if needed
          const dbColumnName = fieldMapping[key] || key;
          
          // Only include if it's a valid column
          if (validColumns.includes(dbColumnName)) {
            acc[dbColumnName] = updates[key];
          } else {
            console.warn(`Ignoring unknown column: ${key} (mapped to ${dbColumnName})`);
          }
        }
        return acc;
      }, {});

      if (Object.keys(cleanUpdates).length === 0) {
        return res.status(400).json({ error: "No valid updates provided" });
      }

      // Add updated timestamp
      cleanUpdates.updated_at = new Date().toISOString();

      const { data: book, error } = await supabase
        .from("books")
        .update(cleanUpdates)
        .eq("id", id)
        .eq("user_id", req.user.id)
        .select("*")
        .single();

      if (error || !book) {
        console.error("Book update error:", error);
        return res.status(404).json({ error: "Book not found or update failed" });
      }

      res.json(book);
    } catch (error) {
      console.error("Book patch error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Database performance monitoring endpoint (development only)
  if (process.env.NODE_ENV === 'development') {
    router.get('/debug/performance', authenticateToken, async (req, res) => {
      try {
        const metrics = dbOptimizer.getPerformanceMetrics();
        const health = await dbOptimizer.healthCheck();
        
        res.json({
          performanceMetrics: metrics,
          healthCheck: health,
          cacheStats: {
            size: dbOptimizer.queryCache.size,
            timeout: dbOptimizer.cacheTimeout
          }
        });
      } catch (error) {
        res.status(500).json({ error: 'Performance monitoring failed', details: error.message });
      }
    });

    // Clear cache endpoint for testing
    router.post('/debug/clear-cache', authenticateToken, async (req, res) => {
      try {
        const { userId = req.user.id, prefix = '' } = req.body;
        dbOptimizer.clearUserCache(userId, prefix);
        res.json({ success: true, message: 'Cache cleared successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Cache clear failed', details: error.message });
      }
    });
  }

  return router;
}
