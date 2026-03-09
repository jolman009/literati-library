// LiteraryMentor.js - AI Reading Companion Service
// Server-proxied: all AI calls route through /ai/mentor-discuss endpoint
import API from '../config/api';

class LiteraryMentor {
  constructor() {
    this.userProfile = null;
  }

  // ===== INITIALIZATION =====

  async initializeMentor(userId) {
    try {
      const [profile, habits, annotations, progress] = await Promise.all([
        this.loadUserProfile(userId),
        this.analyzeReadingHabits(),
        this.loadAnnotationHistory(),
        this.getGamificationProgress()
      ]);

      this.userProfile = {
        ...profile,
        habits,
        annotationStyle: this.analyzeAnnotationStyle(annotations),
        engagementLevel: this.calculateEngagement(progress),
        comprehensionProfile: { level: 'intermediate', score: 0.75 }
      };

      return {
        greeting: this.generatePersonalizedGreeting(),
        currentInsights: this.generateDailyInsights(),
        suggestedActions: await this.getSuggestedNextSteps(),
        userProfile: this.userProfile
      };
    } catch (error) {
      console.error('Mentor initialization failed:', error);
      return {
        greeting: 'Welcome to your literary journey!',
        currentInsights: [{
          type: 'welcome',
          icon: '📚',
          message: 'Start building your digital library by uploading books or exploring recommendations.'
        }],
        suggestedActions: ['Upload a book', 'Start a book discussion', 'Set a reading goal']
      };
    }
  }

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
      return this.generateDailyInsights();
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

  // ===== DAILY INSIGHTS (fallback, no AI) =====

  generateDailyInsights() {
    const insights = [];

    const streak = parseInt(localStorage.getItem('readingStreak')) || 0;
    if (streak > 0) {
      const encouragement = streak >= 30 ? "You're a reading legend!" :
        streak >= 14 ? "Two weeks strong!" :
        streak >= 7 ? "A full week - amazing!" : "Keep it up!";
      insights.push({
        type: 'streak',
        message: `${streak} day reading streak! ${encouragement}`,
        icon: '🔥'
      });
    }

    insights.push({
      type: 'progress',
      message: 'Track your reading sessions to see weekly progress insights here.',
      icon: '📈'
    });

    const tips = [
      'Try the Feynman Technique: Explain what you\'re reading in simple terms.',
      'Create mental images while reading to improve retention.',
      'Take a 5-minute break every 25 minutes for optimal focus.',
      'Ask yourself "why" questions to deepen understanding.',
      'Connect new ideas to what you already know.',
      'Summarize each chapter in one sentence.',
      'Read actively by predicting what comes next.',
      'Discuss your reading with others to gain new perspectives.'
    ];
    insights.push({
      type: 'tip',
      message: tips[Math.floor(Math.random() * tips.length)],
      icon: '💡'
    });

    return insights;
  }

  // ===== INITIALIZATION HELPERS =====

  async loadUserProfile(_userId) {
    return {
      readingLevel: 'intermediate',
      preferredGenres: ['fiction', 'non-fiction'],
      readingGoals: ['enjoyment', 'learning'],
      averageReadingSpeed: 250
    };
  }

  analyzeReadingHabits() {
    try {
      const readingHistory = localStorage.getItem('reading_history');
      const sessions = readingHistory ? JSON.parse(readingHistory) : [];

      return {
        preferredTime: this.identifyOptimalReadingTime(sessions),
        averageSessionLength: this.calculateAverageSession(sessions),
        consistencyScore: this.measureReadingConsistency(sessions),
        genrePreferences: ['fiction', 'non-fiction', 'mystery'],
        completionRate: 0.75,
      };
    } catch {
      return {
        preferredTime: 'flexible',
        averageSessionLength: 30,
        consistencyScore: 0.7,
        genrePreferences: ['fiction', 'non-fiction'],
        completionRate: 0.75,
      };
    }
  }

  async loadAnnotationHistory() {
    try {
      const response = await API.get('/notes');
      return response.data || [];
    } catch {
      return [];
    }
  }

  getGamificationProgress() {
    try {
      return {
        stats: JSON.parse(localStorage.getItem('gamificationStats') || '{}'),
        achievements: JSON.parse(localStorage.getItem('gamificationAchievements') || '[]')
      };
    } catch {
      return {};
    }
  }

  analyzeAnnotationStyle(annotations) {
    if (!annotations || annotations.length === 0) {
      return { style: 'beginner', characteristics: [] };
    }

    const patterns = {
      questioner: annotations.filter(a => a.content?.includes('?')).length,
      summarizer: annotations.filter(a => (a.content?.length || 0) > 200).length,
      connector: annotations.filter(a =>
        /(relates to|similar to|reminds me|connects)/i.test(a.content || '')
      ).length,
      critic: annotations.filter(a =>
        /(however|disagree|but|although)/i.test(a.content || '')
      ).length,
      highlighter: annotations.filter(a => (a.content?.length || 0) < 50).length
    };

    const dominantStyle = Object.entries(patterns)
      .sort(([,a], [,b]) => b - a)[0][0];

    return { style: dominantStyle, characteristics: this.getStyleCharacteristics(dominantStyle) };
  }

  calculateEngagement(progress) {
    if (!progress) return 0.5;

    const factors = {
      achievements: (progress.achievements?.length || 0) * 0.1,
      goals: (progress.completed_goals || 0) * 0.15,
      streak: Math.min((progress.current_streak || 0) * 0.05, 0.3),
      books: Math.min((progress.books_read || 0) * 0.05, 0.25)
    };

    return Math.min(Object.values(factors).reduce((a, b) => a + b, 0), 1);
  }

  generatePersonalizedGreeting() {
    const greetings = {
      morning: ['Good morning, reader!', 'Ready for today\'s literary journey?'],
      afternoon: ['Good afternoon!', 'Perfect time for a reading session!'],
      evening: ['Good evening!', 'Time to unwind with a good book?'],
      night: ['Burning the midnight oil?', 'Late night reading session?']
    };

    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
    return greetings[timeOfDay][Math.floor(Math.random() * greetings[timeOfDay].length)];
  }

  async getSuggestedNextSteps() {
    try {
      const books = await API.get('/books', { params: { limit: 200, offset: 0 } });
      const notes = await API.get('/notes');

      const { items: bookItems = [] } = books.data || {};
      const bookCount = bookItems.length;
      const noteCount = notes.data?.length || 0;

      const suggestions = [];

      if (bookCount === 0) {
        suggestions.push('Upload your first book');
        suggestions.push('Browse book recommendations');
      } else if (bookCount < 3) {
        suggestions.push('Add more books to your library');
        suggestions.push('Start a reading session');
        suggestions.push('Take a comprehension quiz');
      } else {
        suggestions.push('Start a book discussion');
        suggestions.push('Review your reading progress');
        suggestions.push('Set a monthly reading challenge');
      }

      if (noteCount === 0 && bookCount > 0) {
        suggestions.unshift('Create your first note on a book');
      } else if (noteCount > 0) {
        suggestions.push('Review and organize your notes');
      }

      return suggestions.slice(0, 4);
    } catch {
      return ['Start a reading session', 'Create your first note', 'Set a weekly reading goal'];
    }
  }

  // ===== SMALL HELPERS =====

  identifyOptimalReadingTime(sessions) {
    if (!sessions || sessions.length === 0) return 'flexible';

    const hourCounts = new Array(24).fill(0);
    sessions.forEach(session => {
      const hour = new Date(session.start_time).getHours();
      hourCounts[hour]++;
    });

    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    if (peakHour < 6) return 'early_morning';
    if (peakHour < 12) return 'morning';
    if (peakHour < 17) return 'afternoon';
    if (peakHour < 21) return 'evening';
    return 'night';
  }

  calculateAverageSession(sessions) {
    if (!sessions || sessions.length === 0) return 30;
    const total = sessions.reduce((sum, s) => sum + (s.duration || 30), 0);
    return Math.round(total / sessions.length);
  }

  measureReadingConsistency(sessions) {
    if (!sessions || sessions.length === 0) return 0;
    return Math.min(sessions.length / 30, 1);
  }

  getStyleCharacteristics(style) {
    const chars = {
      questioner: ['curious', 'analytical', 'seeks deeper understanding'],
      summarizer: ['comprehensive', 'organized', 'detail-oriented'],
      connector: ['holistic thinker', 'pattern recognizer', 'synthesizer'],
      critic: ['evaluative', 'discerning', 'thoughtful'],
      highlighter: ['focused', 'selective', 'efficient']
    };
    return chars[style] || ['developing'];
  }
}

export default new LiteraryMentor();
