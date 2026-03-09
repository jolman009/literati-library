// LiteraryMentor.js - AI Reading Companion Service
// Server-proxied: all AI calls route through /ai/mentor-discuss endpoint
import API from '../config/api';

class LiteraryMentor {
  // ===== AI-POWERED INSIGHTS (server-proxied) =====

  async generateSmartInsights(userId, currentBook) {
    try {
      if (!currentBook) {
        return [{
          type: 'start',
          icon: '📚',
          message: 'Start reading a book to unlock personalized AI insights!',
        }];
      }

      const insights = [];

      const bookSummary = await this.generateBookSummary(currentBook.id, currentBook.progress || 0);
      if (bookSummary.type === 'ai-generated') {
        insights.push({
          type: 'ai-summary',
          icon: '🧠',
          message: bookSummary.summary,
          metadata: {
            progress: bookSummary.progress,
            highlights: bookSummary.highlightCount
          }
        });
      }

      const highlightAnalysis = await this.analyzeHighlights(currentBook.id);
      if (highlightAnalysis && highlightAnalysis.type === 'theme-analysis') {
        insights.push({
          type: 'theme',
          icon: '💡',
          message: highlightAnalysis.insight,
        });
      }

      if (insights.length === 0) {
        insights.push({
          type: 'progress',
          icon: '📖',
          message: `You're ${currentBook.progress || 0}% through "${currentBook.title}". Keep going!`,
        });
      }

      return insights;
    } catch (error) {
      console.error('Smart insights generation failed:', error);
      return [{
        type: 'progress',
        icon: '📖',
        message: `Keep reading "${currentBook.title}" — your AI insights will appear here!`,
      }];
    }
  }

  async generateBookSummary(bookId, currentProgress) {
    try {
      const bookResponse = await API.get(`/books/${bookId}`);
      const book = bookResponse.data;

      let highlights = [];
      try {
        const notesResponse = await API.get(`/notes?bookId=${bookId}`);
        highlights = Array.isArray(notesResponse.data) ? notesResponse.data : notesResponse.data.notes || [];
      } catch {
        // No highlights found
      }

      const highlightSample = highlights.slice(0, 5).map(h =>
        (h.content || h.text || '').substring(0, 100)
      ).filter(Boolean);

      const userMessage = highlights.length > 0
        ? `I'm ${currentProgress}% through "${book.title}". I've highlighted ${highlights.length} passages including: ${highlightSample.map(t => `"${t}"`).join(', ')}. Give me a brief insight about my reading progress and highlight themes.`
        : `I'm ${currentProgress}% through "${book.title}". Give me a brief, encouraging insight about my reading progress.`;

      const response = await API.post('/ai/mentor-discuss', {
        bookContext: {
          title: book.title,
          author: book.author,
          genre: book.genre,
          description: book.description,
        },
        userMessage,
        history: [],
      });

      return {
        summary: response.data.message,
        type: 'ai-generated',
        bookTitle: book.title,
        progress: currentProgress,
        highlightCount: highlights.length
      };
    } catch (error) {
      console.error('AI summary generation failed:', error);
      return {
        summary: `You're making progress on your current book! ${currentProgress}% complete.`,
        type: 'fallback'
      };
    }
  }

  async analyzeHighlights(bookId) {
    try {
      const notesResponse = await API.get(`/notes?bookId=${bookId}`);
      const highlights = Array.isArray(notesResponse.data) ? notesResponse.data : notesResponse.data.notes || [];

      if (highlights.length === 0) {
        return {
          insight: "Start highlighting key passages to unlock AI-powered theme analysis!",
          type: 'prompt'
        };
      }

      const bookResponse = await API.get(`/books/${bookId}`);
      const book = bookResponse.data;

      const highlightTexts = highlights.map(h => h.content || h.text).filter(Boolean).slice(0, 10);

      const response = await API.post('/ai/mentor-discuss', {
        bookContext: {
          title: book.title,
          author: book.author,
          genre: book.genre,
          description: book.description,
        },
        userMessage: `Analyze the themes in my highlights from this book. Here are my highlighted passages: ${highlightTexts.map((t, i) => `${i + 1}. "${t.substring(0, 150)}"`).join(' ')}. In 1-2 sentences, what themes or patterns do these reveal about my reading focus?`,
        history: [],
      });

      return {
        insight: response.data.message,
        type: 'theme-analysis',
        highlightCount: highlights.length
      };
    } catch (error) {
      console.error('Highlight analysis failed:', error);
      return null;
    }
  }
}

export default new LiteraryMentor();
