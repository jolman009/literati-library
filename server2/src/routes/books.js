// src/routes/books.js
import express from 'express';
import multer from 'multer';
import { ensureCoverForBook } from '../services/covers.js';
import { supabase } from "../config/supabaseClient.js";
import { dbOptimizer } from '../services/database-optimization.js';
import { optimizedQuery, optimizedSearch, optimizedBatch } from '../services/query-optimizer.js';
import { advancedCache } from '../services/advanced-caching.js';

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
      const {
        limit = 50,
        offset = 0,
        status = null,
        genre = null,
        orderBy = 'created_at',
        orderDirection = 'desc'
      } = req.query;

      // Use optimized query with caching
      const { data: books, error } = await dbOptimizer.getOptimizedBookList(req.user.id, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        status,
        genre,
        orderBy,
        orderDirection
      });

      if (error) {
        console.error("Optimized books fetch error:", error);
        return res.status(500).json({ error: "Failed to fetch books", details: error.message });
      }

      // Return books immediately with performance metrics (development only)
      if (process.env.NODE_ENV === 'development') {
        const metrics = dbOptimizer.getPerformanceMetrics();
        res.json({ 
          books: books || [], 
          _performance: metrics.getBookList,
          _total: books?.length || 0
        });
      } else {
        res.json(books || []);
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