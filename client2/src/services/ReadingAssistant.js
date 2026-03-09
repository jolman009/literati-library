// src/services/ReadingAssistant.js - AI-Powered Notes Assistant
// Server-proxied: all AI calls route through /ai/* endpoints
import API from '../config/api';

class ReadingAssistant {
  /**
   * Summarize a set of notes (strings) using server AI
   */
  async summarizeNotes({ notes = [], title = undefined, mode = 'book', tags = [] } = {}) {
    try {
      const response = await API.post('/ai/summarize-notes', { notes, title, mode, tags });
      return {
        title: response.data.title,
        summary: response.data.summary,
        bullets: response.data.bullets,
        themes: response.data.themes,
        questions: response.data.questions,
        nextSteps: response.data.nextSteps,
        confidence: response.data.confidence,
        noteCount: response.data.noteCount,
        aiGenerated: response.data.aiGenerated
      };
    } catch (error) {
      console.warn('Summarize notes failed:', error);
      return null;
    }
  }

  /**
   * Enhance a note with AI — improves clarity and suggests connections
   */
  async enhanceNote(noteContent, bookContext = {}) {
    try {
      const response = await API.post('/ai/enhance-note', {
        originalNote: noteContent,
        bookContext,
      });
      return {
        enhanced: response.data.enhanced,
        connections: response.data.connections || [],
        suggestions: response.data.suggestions || [],
        readability: response.data.readability,
      };
    } catch (error) {
      console.warn('Note enhancement failed:', error);
      return null;
    }
  }
  /**
   * Get AI book recommendations based on user's library
   */
  async getBookRecommendations(books = [], limit = 6) {
    try {
      const compactBooks = books.map(b => ({
        title: b.title,
        author: b.author,
        genre: b.genre,
      }));
      const response = await API.post('/ai/book-recommendations', {
        books: compactBooks,
        limit,
      });
      return {
        recommendations: response.data.recommendations || [],
        aiGenerated: response.data.aiGenerated,
        librarySize: response.data.librarySize,
        topGenres: response.data.topGenres || [],
      };
    } catch (error) {
      console.warn('Book recommendations failed:', error);
      return null;
    }
  }
}

export default new ReadingAssistant();
