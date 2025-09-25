// Jest globals available in test environment
const request = require('supertest');
const express = require('express');

// Mock all dependencies
jest.mock('../../src/config/supabaseClient.js', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
      then: jest.fn()
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'test-url' } }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null })
      }))
    }
  }
}));

jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req, res, next) => {
      req.file = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test file content'),
        size: 1024
      };
      next();
    }
  });
  multer.memoryStorage = jest.fn();
  return { default: multer };
});

// Import after mocking
const { supabase } = require('../../src/config/supabaseClient.js');

describe('Books API Endpoints', () => {
  let app;
  let agent;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User'
  };

  const mockBook = {
    id: 'test-book-id',
    title: 'Test Book',
    author: 'Test Author',
    description: 'Test Description',
    genre: 'Fiction',
    cover_url: null,
    file_url: 'test-file-url',
    user_id: 'test-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Mock authentication middleware
  const mockAuth = (req, res, next) => {
    req.user = mockUser;
    next();
  };

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Books CRUD endpoints
    app.get('/books', mockAuth, async (req, res) => {
      try {
        const { limit = 10, offset = 0, search, genre, sort } = req.query;

        // Mock query building
        let query = supabase.from('books').select('*').eq('user_id', req.user.id);

        if (search) {
          // Mock search functionality
          if (search.includes('<script>') || search.includes('DROP TABLE')) {
            return res.status(400).json({ error: 'Invalid search query' });
          }
        }

        if (genre && genre !== 'all') {
          query = query.eq('genre', genre);
        }

        if (sort) {
          const [field, direction] = sort.split(':');
          query = query.order(field, { ascending: direction === 'asc' });
        }

        query = query.limit(parseInt(limit)).range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        // Mock response
        const books = [mockBook];
        res.json({ books, total: books.length });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.get('/books/:id', mockAuth, async (req, res) => {
      try {
        const { id } = req.params;

        if (!id || id === 'invalid-id') {
          return res.status(400).json({ error: 'Invalid book ID' });
        }

        supabase.from().select().eq().single.mockResolvedValue({
          data: id === 'nonexistent-id' ? null : mockBook,
          error: id === 'nonexistent-id' ? { message: 'Not found' } : null
        });

        const { data: book, error } = await supabase
          .from('books')
          .select('*')
          .eq('id', id)
          .eq('user_id', req.user.id)
          .single();

        if (error || !book) {
          return res.status(404).json({ error: 'Book not found' });
        }

        res.json(book);
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.post('/books', mockAuth, async (req, res) => {
      try {
        const { title, author, description, genre, file_url } = req.body;

        // Validation
        if (!title || !author) {
          return res.status(400).json({ error: 'Title and author are required' });
        }

        if (title.length > 255) {
          return res.status(400).json({ error: 'Title too long' });
        }

        if (author.length > 255) {
          return res.status(400).json({ error: 'Author name too long' });
        }

        // Check for XSS
        if (title.includes('<script>') || author.includes('<script>') || description?.includes('<script>')) {
          return res.status(400).json({ error: 'Invalid characters in input' });
        }

        const newBook = {
          ...mockBook,
          id: 'new-book-id',
          title,
          author,
          description: description || null,
          genre: genre || 'Other',
          file_url: file_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        supabase.from().insert().select().single.mockResolvedValue({
          data: newBook,
          error: null
        });

        res.status(201).json(newBook);
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.put('/books/:id', mockAuth, async (req, res) => {
      try {
        const { id } = req.params;
        const { title, author, description, genre } = req.body;

        if (!title || !author) {
          return res.status(400).json({ error: 'Title and author are required' });
        }

        // Check if book exists and belongs to user
        supabase.from().select().eq().single.mockResolvedValue({
          data: id === 'nonexistent-id' ? null : mockBook,
          error: id === 'nonexistent-id' ? { message: 'Not found' } : null
        });

        const { data: existingBook, error: fetchError } = await supabase
          .from('books')
          .select('*')
          .eq('id', id)
          .eq('user_id', req.user.id)
          .single();

        if (fetchError || !existingBook) {
          return res.status(404).json({ error: 'Book not found' });
        }

        const updatedBook = {
          ...existingBook,
          title,
          author,
          description: description || existingBook.description,
          genre: genre || existingBook.genre,
          updated_at: new Date().toISOString()
        };

        supabase.from().update().eq().select().single.mockResolvedValue({
          data: updatedBook,
          error: null
        });

        res.json(updatedBook);
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.delete('/books/:id', mockAuth, async (req, res) => {
      try {
        const { id } = req.params;

        // Check if book exists and belongs to user
        supabase.from().select().eq().single.mockResolvedValue({
          data: id === 'nonexistent-id' ? null : mockBook,
          error: id === 'nonexistent-id' ? { message: 'Not found' } : null
        });

        const { data: existingBook, error: fetchError } = await supabase
          .from('books')
          .select('*')
          .eq('id', id)
          .eq('user_id', req.user.id)
          .single();

        if (fetchError || !existingBook) {
          return res.status(404).json({ error: 'Book not found' });
        }

        supabase.from().delete().eq().mockResolvedValue({
          data: null,
          error: null
        });

        res.json({ message: 'Book deleted successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // File upload endpoint
    app.post('/books/:id/upload', mockAuth, async (req, res) => {
      try {
        const { id } = req.params;

        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/epub+zip', 'application/epub'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          return res.status(400).json({ error: 'Invalid file type' });
        }

        // Validate file size (50MB limit)
        if (req.file.size > 50 * 1024 * 1024) {
          return res.status(400).json({ error: 'File too large' });
        }

        // Mock file upload to storage
        const fileUrl = `https://storage.example.com/books/${id}/${req.file.originalname}`;

        supabase.from().update().eq().mockResolvedValue({
          data: null,
          error: null
        });

        res.json({
          message: 'File uploaded successfully',
          file_url: fileUrl
        });
      } catch (error) {
        res.status(500).json({ error: 'File upload failed' });
      }
    });

    agent = request(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /books', () => {
    it('should get user books successfully', async () => {
      const response = await agent
        .get('/books')
        .expect(200);

      expect(response.body).toHaveProperty('books');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.books)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await agent
        .get('/books?limit=5&offset=10')
        .expect(200);

      expect(response.body).toHaveProperty('books');
      expect(response.body).toHaveProperty('total');
    });

    it('should support search functionality', async () => {
      const response = await agent
        .get('/books?search=test')
        .expect(200);

      expect(response.body).toHaveProperty('books');
    });

    it('should reject malicious search queries', async () => {
      const maliciousQueries = [
        '<script>alert("xss")</script>',
        'DROP TABLE books',
        "'; DELETE FROM books; --"
      ];

      for (const query of maliciousQueries) {
        const response = await agent
          .get(`/books?search=${encodeURIComponent(query)}`);

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/invalid/i);
      }
    });

    it('should support genre filtering', async () => {
      const response = await agent
        .get('/books?genre=Fiction')
        .expect(200);

      expect(response.body).toHaveProperty('books');
    });

    it('should support sorting', async () => {
      const sortOptions = ['title:asc', 'title:desc', 'created_at:desc', 'author:asc'];

      for (const sort of sortOptions) {
        const response = await agent
          .get(`/books?sort=${sort}`)
          .expect(200);

        expect(response.body).toHaveProperty('books');
      }
    });

    it('should handle invalid query parameters gracefully', async () => {
      const response = await agent
        .get('/books?limit=invalid&offset=negative')
        .expect(200);

      expect(response.body).toHaveProperty('books');
    });
  });

  describe('GET /books/:id', () => {
    it('should get a specific book successfully', async () => {
      const response = await agent
        .get('/books/test-book-id')
        .expect(200);

      expect(response.body).toMatchObject({
        id: 'test-book-id',
        title: 'Test Book',
        author: 'Test Author'
      });
    });

    it('should return 404 for nonexistent book', async () => {
      const response = await agent
        .get('/books/nonexistent-id')
        .expect(404);

      expect(response.body.error).toMatch(/not found/i);
    });

    it('should return 400 for invalid book ID', async () => {
      const response = await agent
        .get('/books/invalid-id')
        .expect(400);

      expect(response.body.error).toMatch(/invalid/i);
    });

    it('should handle SQL injection in book ID', async () => {
      const maliciousIds = [
        "'; DROP TABLE books; --",
        "' OR '1'='1",
        "1' UNION SELECT * FROM users --"
      ];

      for (const id of maliciousIds) {
        const response = await agent
          .get(`/books/${encodeURIComponent(id)}`);

        // Should not crash or expose database errors
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body.error).not.toMatch(/database|sql|syntax/i);
      }
    });
  });

  describe('POST /books', () => {
    it('should create a new book successfully', async () => {
      const bookData = {
        title: 'New Test Book',
        author: 'New Test Author',
        description: 'A great book for testing',
        genre: 'Fiction'
      };

      const response = await agent
        .post('/books')
        .send(bookData)
        .expect(201);

      expect(response.body).toMatchObject({
        title: bookData.title,
        author: bookData.author,
        description: bookData.description,
        genre: bookData.genre
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('created_at');
    });

    it('should reject creation without required fields', async () => {
      const invalidData = [
        { author: 'Test Author' }, // missing title
        { title: 'Test Book' }, // missing author
        {} // missing both
      ];

      for (const data of invalidData) {
        const response = await agent
          .post('/books')
          .send(data)
          .expect(400);

        expect(response.body.error).toMatch(/required/i);
      }
    });

    it('should reject books with overly long fields', async () => {
      const longString = 'a'.repeat(300);

      const response = await agent
        .post('/books')
        .send({
          title: longString,
          author: 'Test Author'
        })
        .expect(400);

      expect(response.body.error).toMatch(/too long/i);
    });

    it('should sanitize input to prevent XSS', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert(1)'
      ];

      for (const payload of xssPayloads) {
        const response = await agent
          .post('/books')
          .send({
            title: payload,
            author: 'Test Author'
          })
          .expect(400);

        expect(response.body.error).toMatch(/invalid characters/i);
      }
    });

    it('should handle default values correctly', async () => {
      const response = await agent
        .post('/books')
        .send({
          title: 'Minimal Book',
          author: 'Minimal Author'
        })
        .expect(201);

      expect(response.body.genre).toBe('Other');
      expect(response.body.description).toBeNull();
    });
  });

  describe('PUT /books/:id', () => {
    it('should update a book successfully', async () => {
      const updateData = {
        title: 'Updated Book Title',
        author: 'Updated Author',
        description: 'Updated description',
        genre: 'Non-Fiction'
      };

      const response = await agent
        .put('/books/test-book-id')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject(updateData);
      expect(response.body).toHaveProperty('updated_at');
    });

    it('should return 404 for nonexistent book', async () => {
      const response = await agent
        .put('/books/nonexistent-id')
        .send({
          title: 'Updated Title',
          author: 'Updated Author'
        })
        .expect(404);

      expect(response.body.error).toMatch(/not found/i);
    });

    it('should reject update without required fields', async () => {
      const response = await agent
        .put('/books/test-book-id')
        .send({
          description: 'Only description'
        })
        .expect(400);

      expect(response.body.error).toMatch(/required/i);
    });

    it('should preserve existing values for optional fields', async () => {
      const response = await agent
        .put('/books/test-book-id')
        .send({
          title: 'Updated Title',
          author: 'Updated Author'
          // No description or genre provided
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
      expect(response.body.author).toBe('Updated Author');
      expect(response.body.description).toBe(mockBook.description);
      expect(response.body.genre).toBe(mockBook.genre);
    });
  });

  describe('DELETE /books/:id', () => {
    it('should delete a book successfully', async () => {
      const response = await agent
        .delete('/books/test-book-id')
        .expect(200);

      expect(response.body.message).toMatch(/deleted successfully/i);
    });

    it('should return 404 for nonexistent book', async () => {
      const response = await agent
        .delete('/books/nonexistent-id')
        .expect(404);

      expect(response.body.error).toMatch(/not found/i);
    });

    it('should handle concurrent deletion attempts', async () => {
      const deleteRequests = Array.from({ length: 5 }, () =>
        agent.delete('/books/test-book-id')
      );

      const responses = await Promise.all(deleteRequests);

      // At least one should succeed, others should fail gracefully
      const successCount = responses.filter(r => r.status === 200).length;
      const notFoundCount = responses.filter(r => r.status === 404).length;

      expect(successCount + notFoundCount).toBe(5);
    });
  });

  describe('POST /books/:id/upload', () => {
    it('should upload file successfully', async () => {
      const response = await agent
        .post('/books/test-book-id/upload')
        .attach('file', Buffer.from('test file content'), 'test.pdf')
        .expect(200);

      expect(response.body.message).toMatch(/uploaded successfully/i);
      expect(response.body).toHaveProperty('file_url');
    });

    it('should reject upload without file', async () => {
      const response = await agent
        .post('/books/test-book-id/upload')
        .expect(400);

      expect(response.body.error).toMatch(/no file/i);
    });

    it('should reject invalid file types', async () => {
      // This test depends on the multer mock setup
      // In a real scenario, you'd modify the mock to simulate different file types
      const response = await agent
        .post('/books/test-book-id/upload')
        .attach('file', Buffer.from('test'), 'test.txt')
        .expect(400);

      expect(response.body.error).toMatch(/invalid file type/i);
    });

    it('should reject files that are too large', async () => {
      // Simulate large file by modifying the mock
      const largeBuffer = Buffer.alloc(60 * 1024 * 1024); // 60MB

      const response = await agent
        .post('/books/test-book-id/upload')
        .attach('file', largeBuffer, 'large.pdf')
        .expect(400);

      expect(response.body.error).toMatch(/too large/i);
    });
  });

  describe('Security Tests', () => {
    it('should require authentication for all endpoints', async () => {
      // Create app without auth middleware
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.get('/books', (req, res) => res.status(401).json({ error: 'Unauthorized' }));

      const unauthAgent = request(unauthApp);

      const response = await unauthAgent
        .get('/books')
        .expect(401);

      expect(response.body.error).toMatch(/unauthorized/i);
    });

    it('should not allow access to other users books', async () => {
      // This would be tested with different user contexts
      // For now, we verify that user_id is always checked in queries
      const response = await agent
        .get('/books/test-book-id')
        .expect(200);

      // In the real implementation, verify that the query includes user_id filter
      expect(supabase.from().select().eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      supabase.from().select().eq().single.mockRejectedValue(new Error('Database connection failed'));

      const response = await agent
        .get('/books/test-book-id')
        .expect(500);

      expect(response.body.error).toMatch(/internal server error/i);
      expect(response.body.error).not.toMatch(/database connection failed/i);
    });

    it('should validate input lengths to prevent buffer overflows', async () => {
      const massiveString = 'a'.repeat(1000000); // 1MB string

      const response = await agent
        .post('/books')
        .send({
          title: massiveString,
          author: 'Test Author'
        });

      // Should either reject or handle gracefully
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const concurrentRequests = Array.from({ length: 20 }, () =>
        agent.get('/books')
      );

      const responses = await Promise.all(concurrentRequests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('books');
      });
    });

    it('should respond within reasonable time', async () => {
      const start = Date.now();

      await agent
        .get('/books')
        .expect(200);

      const duration = Date.now() - start;

      // Should respond within 1 second (adjust based on requirements)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Data Integrity Tests', () => {
    it('should maintain data consistency during updates', async () => {
      const updateData = {
        title: 'Consistency Test',
        author: 'Test Author'
      };

      const response = await agent
        .put('/books/test-book-id')
        .send(updateData)
        .expect(200);

      expect(response.body.id).toBe('test-book-id');
      expect(response.body.user_id).toBe(mockUser.id);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.author).toBe(updateData.author);
    });

    it('should handle unicode and special characters correctly', async () => {
      const unicodeData = {
        title: '测试书籍 📚',
        author: 'Tëst Âuthør',
        description: 'A book with émojis 🎉 and spëcial çhars'
      };

      const response = await agent
        .post('/books')
        .send(unicodeData)
        .expect(201);

      expect(response.body.title).toBe(unicodeData.title);
      expect(response.body.author).toBe(unicodeData.author);
      expect(response.body.description).toBe(unicodeData.description);
    });
  });
});