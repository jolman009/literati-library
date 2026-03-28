const request = require('supertest');
const express = require('express');

// Mock aiService
const mockAiService = {
  summarizeNotes: jest.fn(),
  enhanceNote: jest.fn(),
  mentorDiscuss: jest.fn(),
  mentorQuiz: jest.fn(),
  extractPageTopics: jest.fn(),
  autoTagTask: jest.fn(),
  summarizeContent: jest.fn(),
  generateBookRecommendations: jest.fn(),
  getStatus: jest.fn(),
};

jest.mock('../../src/services/aiService.js', () => ({
  __esModule: true,
  default: mockAiService,
}));

// Mock subscriptionGate — pass through
jest.mock('../../src/middlewares/subscriptionGate.js', () => ({
  subscriptionGate: () => (req, res, next) => {
    req.subscriptionTier = 'pro';
    next();
  },
}));

describe('AI Routes API', () => {
  let app;

  const mockAuth = (req, res, next) => {
    req.user = { id: 'user-123', email: 'test@example.com' };
    next();
  };

  beforeAll(async () => {
    const { aiRouter } = await import('../../src/routes/ai.js');
    app = express();
    app.use(express.json());
    app.use('/ai', aiRouter(mockAuth));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /ai/summarize-notes', () => {
    it('should return 400 if notes is not an array', async () => {
      const res = await request(app)
        .post('/ai/summarize-notes')
        .send({ notes: 'not-array' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('notes');
    });

    it('should return 400 if notes is empty', async () => {
      const res = await request(app)
        .post('/ai/summarize-notes')
        .send({ notes: [] });

      expect(res.status).toBe(400);
    });

    it('should summarize notes successfully', async () => {
      mockAiService.summarizeNotes.mockResolvedValueOnce({ summary: 'Test summary' });

      const res = await request(app)
        .post('/ai/summarize-notes')
        .send({ notes: ['note1', 'note2'], title: 'My Book' });

      expect(res.status).toBe(200);
      expect(res.body.summary).toBe('Test summary');
      expect(mockAiService.summarizeNotes).toHaveBeenCalledWith(
        ['note1', 'note2'],
        expect.objectContaining({ title: 'My Book' })
      );
    });

    it('should return 500 on service error', async () => {
      mockAiService.summarizeNotes.mockRejectedValueOnce(new Error('AI error'));

      const res = await request(app)
        .post('/ai/summarize-notes')
        .send({ notes: ['note1'] });

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('failed');
    });
  });

  describe('POST /ai/enhance-note', () => {
    it('should enhance a note', async () => {
      mockAiService.enhanceNote.mockResolvedValueOnce({ enhanced: 'Better note' });

      const res = await request(app)
        .post('/ai/enhance-note')
        .send({ originalNote: 'My note', bookContext: { title: 'Book' } });

      expect(res.status).toBe(200);
      expect(res.body.enhanced).toBe('Better note');
    });
  });

  describe('POST /ai/mentor-discuss', () => {
    it('should return 400 without required fields', async () => {
      const res = await request(app)
        .post('/ai/mentor-discuss')
        .send({ bookContext: {}, userMessage: '' });

      expect(res.status).toBe(400);
    });

    it('should return discussion response', async () => {
      mockAiService.mentorDiscuss.mockResolvedValueOnce({ reply: 'Great question!' });

      const res = await request(app)
        .post('/ai/mentor-discuss')
        .send({ bookContext: { title: '1984' }, userMessage: 'What about surveillance?' });

      expect(res.status).toBe(200);
      expect(res.body.reply).toBe('Great question!');
    });
  });

  describe('POST /ai/mentor-quiz', () => {
    it('should return 400 without book context', async () => {
      const res = await request(app)
        .post('/ai/mentor-quiz')
        .send({ bookContext: {} });

      expect(res.status).toBe(400);
    });

    it('should generate quiz', async () => {
      mockAiService.mentorQuiz.mockResolvedValueOnce({ questions: [{ q: 'Q1', a: 'A1' }] });

      const res = await request(app)
        .post('/ai/mentor-quiz')
        .send({ bookContext: { title: '1984' } });

      expect(res.status).toBe(200);
      expect(res.body.questions).toHaveLength(1);
    });
  });

  describe('POST /ai/extract-topics', () => {
    it('should return 400 without title or url', async () => {
      const res = await request(app)
        .post('/ai/extract-topics')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should extract topics', async () => {
      mockAiService.extractPageTopics.mockResolvedValueOnce({ topics: ['AI', 'ML'] });

      const res = await request(app)
        .post('/ai/extract-topics')
        .send({ title: 'AI article' });

      expect(res.status).toBe(200);
      expect(res.body.topics).toContain('AI');
    });
  });

  describe('POST /ai/auto-tag-task', () => {
    it('should return 400 for text too short', async () => {
      const res = await request(app)
        .post('/ai/auto-tag-task')
        .send({ text: 'hi' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('too short');
    });

    it('should auto-tag task', async () => {
      mockAiService.autoTagTask.mockResolvedValueOnce({ tags: ['reading', 'review'] });

      const res = await request(app)
        .post('/ai/auto-tag-task')
        .send({ text: 'Read chapter 5 and write a review of the key themes' });

      expect(res.status).toBe(200);
      expect(res.body.tags).toContain('reading');
    });
  });

  describe('POST /ai/summarize-content', () => {
    it('should return 400 for text too short', async () => {
      const res = await request(app)
        .post('/ai/summarize-content')
        .send({ text: 'Short' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('minimum 50 characters');
    });

    it('should summarize content', async () => {
      const longText = 'A'.repeat(100);
      mockAiService.summarizeContent.mockResolvedValueOnce({
        summary: 'Summary here',
        keyPoints: ['Point 1'],
        themes: ['Theme 1'],
        questions: ['Question 1'],
      });

      const res = await request(app)
        .post('/ai/summarize-content')
        .send({ text: longText, bookTitle: 'Test Book', mode: 'brief' });

      expect(res.status).toBe(200);
      expect(res.body.summary).toBe('Summary here');
      expect(res.body.keyPoints).toHaveLength(1);
    });
  });

  describe('POST /ai/book-recommendations', () => {
    it('should return 400 without books array', async () => {
      const res = await request(app)
        .post('/ai/book-recommendations')
        .send({ books: [] });

      expect(res.status).toBe(400);
    });

    it('should generate recommendations', async () => {
      mockAiService.generateBookRecommendations.mockResolvedValueOnce({
        recommendations: [{ title: 'New Book', reason: 'Similar themes' }],
      });

      const res = await request(app)
        .post('/ai/book-recommendations')
        .send({ books: [{ title: '1984', author: 'Orwell' }] });

      expect(res.status).toBe(200);
      expect(res.body.recommendations).toHaveLength(1);
    });
  });

  describe('GET /ai/status', () => {
    it('should return AI service status', async () => {
      mockAiService.getStatus.mockReturnValueOnce({ healthy: true, model: 'gpt-4o-mini' });

      const res = await request(app).get('/ai/status');

      expect(res.status).toBe(200);
      expect(res.body.healthy).toBe(true);
      expect(res.body).toHaveProperty('timestamp');
    });
  });
});
