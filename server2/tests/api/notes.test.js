const request = require('supertest');
const express = require('express');

const tableMocks = {};

jest.mock('../../src/config/supabaseClient.js', () => ({
  supabase: {
    from: jest.fn((table) => {
      if (tableMocks[table]) return tableMocks[table]();

      const chain = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      return chain;
    }),
    rpc: jest.fn().mockResolvedValue({ data: 0, error: null }),
  },
}));

describe('Notes API', () => {
  let app;

  const mockAuth = (req, res, next) => {
    req.user = { id: 'user-123', email: 'test@example.com' };
    next();
  };

  beforeAll(async () => {
    const { notesRouter } = await import('../../src/routes/notes.js');
    app = express();
    app.use(express.json());
    app.use('/notes', notesRouter(mockAuth));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(tableMocks).forEach(k => delete tableMocks[k]);
  });

  describe('GET /notes', () => {
    it('should return all user notes', async () => {
      const mockNotes = [
        { id: 'n1', content: 'Note 1', user_id: 'user-123', book_id: null },
        { id: 'n2', content: 'Note 2', user_id: 'user-123', book_id: 'book-1' },
      ];

      tableMocks.notes = () => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: mockNotes, error: null }),
        };
        return chain;
      };
      tableMocks.books = () => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [{ id: 'book-1', title: 'Test Book', author: 'Author' }], error: null }),
        };
        return chain;
      };

      const res = await request(app).get('/notes');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[1].book).toEqual({ id: 'book-1', title: 'Test Book', author: 'Author' });
    });

    it('should return empty array when no notes', async () => {
      tableMocks.notes = () => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const res = await request(app).get('/notes');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('POST /notes', () => {
    it('should create a note', async () => {
      const createdNote = { id: 'n1', content: 'My note', user_id: 'user-123', type: 'note' };

      tableMocks.notes = () => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: createdNote, error: null }),
      });
      tableMocks.user_stats = () => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      });

      const res = await request(app)
        .post('/notes')
        .send({ content: 'My note' });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('My note');
      expect(res.body).toHaveProperty('gamification');
    });

    it('should return 400 for empty content', async () => {
      const res = await request(app)
        .post('/notes')
        .send({ content: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('content is required');
    });

    it('should accept source fields for web-captured notes', async () => {
      tableMocks.notes = () => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'n1', content: 'Web note', source_url: 'https://example.com' },
          error: null,
        }),
      });
      tableMocks.user_stats = () => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      });

      const res = await request(app)
        .post('/notes')
        .send({
          content: 'Web note',
          source_url: 'https://example.com',
          source_title: 'Example',
          source_favicon: 'https://example.com/favicon.ico',
        });

      expect(res.status).toBe(201);
    });
  });

  describe('GET /notes/book/:bookId', () => {
    it('should return notes for a specific book', async () => {
      let callCount = 0;
      tableMocks.books = () => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'book-1' }, error: null }),
      });
      tableMocks.notes = () => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [{ id: 'n1', content: 'Book note' }], error: null }),
      });

      const res = await request(app).get('/notes/book/book-1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('should return 404 if book not found', async () => {
      tableMocks.books = () => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      });

      const res = await request(app).get('/notes/book/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /notes/:id', () => {
    it('should update a note', async () => {
      tableMocks.notes = () => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'n1', content: 'Updated content' },
          error: null,
        }),
      });

      const res = await request(app)
        .put('/notes/n1')
        .send({ content: 'Updated content' });

      expect(res.status).toBe(200);
      expect(res.body.content).toBe('Updated content');
    });

    it('should return 400 for empty content', async () => {
      const res = await request(app)
        .put('/notes/n1')
        .send({ content: '   ' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /notes/:id', () => {
    it('should delete a note', async () => {
      tableMocks.notes = () => ({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      });
      // Make the last eq() resolve (the chain ends at eq)
      tableMocks.notes = () => {
        const chain = {
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn(function () { return this; }),
        };
        // Override to resolve as a promise when awaited
        chain[Symbol.for('nodejs.util.promisify.custom')] = () => ({ error: null });
        // Actually we need it to resolve. The route does: const { error } = await supabase.from('notes').delete().eq(...).eq(...)
        // The second eq needs to return a thenable
        let eqCount = 0;
        chain.eq = jest.fn(() => {
          eqCount++;
          if (eqCount >= 2) return Promise.resolve({ error: null });
          return chain;
        });
        return chain;
      };

      const res = await request(app).delete('/notes/n1');

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
    });
  });
});
