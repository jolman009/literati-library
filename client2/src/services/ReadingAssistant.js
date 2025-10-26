// src/services/ReadingAssistant.js - AI-Powered Reading Companion
import API from '../config/api';

class ReadingAssistant {
  constructor() {
    this.analysisCache = new Map();
    this.userReadingProfile = null;
  }

  /**
   * Analyze selected text for complexity, concepts, and connections
   */
  async analyzeText(selectedText, context = {}) {
    const cacheKey = `${selectedText.substring(0, 50)}_${context.bookId || ''}`;
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    try {
      const analysisData = {
        text: selectedText,
        context: {
          bookId: context.bookId,
          bookTitle: context.bookTitle,
          bookAuthor: context.bookAuthor,
          bookGenre: context.bookGenre,
          pageNumber: context.pageNumber,
          readingSessionId: context.readingSessionId,
          userReadingLevel: await this.getUserReadingLevel()
        }
      };

      const response = await API.post('/ai/analyze-text', analysisData);
      const analysis = {
        complexity: response.data.complexity,
        concepts: response.data.concepts,
        connections: response.data.connections,
        explanations: response.data.explanations,
        readingTime: response.data.estimatedReadingTime,
        difficulty: response.data.difficultyScore,
        themes: response.data.themes,
        relatedBooks: response.data.relatedBooks
      };

      // Cache the result
      this.analysisCache.set(cacheKey, analysis);
      return analysis;

    } catch (error) {
      console.error('Text analysis failed:', error);
      return this.getFallbackAnalysis(selectedText);
    }
  }

  /**
   * Generate intelligent annotation suggestions
   */
  async suggestAnnotations({
    text,
    userNoteHistory = [],
    previousNotes = [],
    readingLevel = 'intermediate',
    userStyle = 'analytical',
    comprehensionLevel = 0.8,
    bookContext = {}
  }) {
    try {
      const suggestionData = {
        text,
        userProfile: {
          noteHistory: userNoteHistory.slice(-10), // Last 10 notes for context
          previousNotes: previousNotes.slice(-5), // Recent notes from this book
          readingLevel,
          preferredStyle: userStyle,
          comprehensionLevel
        },
        bookContext,
        analysisContext: await this.analyzeText(text, bookContext)
      };

      const response = await API.post('/ai/suggest-annotations', suggestionData);
      
      return {
        suggestions: response.data.suggestions,
        noteTypes: response.data.noteTypes, // question, insight, connection, summary
        confidenceScore: response.data.confidence,
        personalizedTips: response.data.tips,
        relatedConcepts: response.data.relatedConcepts
      };

    } catch (error) {
      console.error('Annotation suggestion failed:', error);
      return this.getFallbackSuggestions(text);
    }
  }

  /**
   * Generate reading insights and progress analysis
   */
  async generateReadingInsights(bookId, readingSessionData) {
    try {
      const response = await API.post('/ai/reading-insights', {
        bookId,
        sessionData: readingSessionData,
        userProfile: await this.getUserReadingProfile()
      });

      return {
        comprehensionScore: response.data.comprehension,
        readingSpeed: response.data.readingSpeed,
        engagementLevel: response.data.engagement,
        recommendedBreaks: response.data.breaks,
        focusAreas: response.data.focusAreas,
        nextSteps: response.data.nextSteps,
        personalizedGoals: response.data.goals
      };

    } catch (error) {
      console.error('Reading insights failed:', error);
      return null;
    }
  }

  /**
   * Smart book recommendations based on reading patterns and mood analysis
   */
  async getBookRecommendations(userId, currentBook, readingHistory) {
    try {
      const userProfile = await this.buildReadingProfile(userId);
      const moodAnalysis = await this.analyzeMoodFromNotes(userId);
      
      const response = await API.post('/ai/book-recommendations', {
        currentBook,
        readingHistory: userProfile.genres,
        readingSpeed: userProfile.averageSpeed,
        noteComplexity: userProfile.annotationStyle,
        currentMood: moodAnalysis?.dominantTone || 'neutral',
        achievements: userProfile.gamificationData,
        timeAvailable: userProfile.readingSchedule,
        userProfile: await this.getUserReadingProfile()
      });

      return {
        recommendations: response.data.books,
        reasons: response.data.explanations,
        similarityScores: response.data.scores,
        readingOrder: response.data.suggestedOrder,
        moodBasedSuggestions: response.data.moodSuggestions
      };

    } catch (error) {
      console.error('Book recommendations failed:', error);
      return this.getFallbackRecommendations(userId);
    }
  }

  /**
   * Predict reading time based on user's reading patterns
   */
  async predictReadingTime(book, userId) {
    try {
      const userStats = await this.getUserReadingStats(userId);
      const response = await API.post('/ai/predict-time', {
        bookLength: book.page_count || book.pages || 250,
        complexity: book.reading_level || 'medium',
        userSpeed: userStats.averageWordsPerMinute || 200,
        genre: book.genre || 'general'
      });

      return {
        estimatedMinutes: response.data.minutes,
        estimatedSessions: response.data.sessions,
        difficultyAdjustment: response.data.adjustment,
        personalizedTips: response.data.tips
      };
    } catch (error) {
      console.warn('Time prediction failed, using fallback:', error);
      return this.fallbackTimePrediction(book, userId);
    }
  }

  /**
   * Generate AI-powered personalized challenges for gamification
   */
  async createPersonalizedChallenges(userStats) {
    try {
      const behaviorAnalysis = await this.analyzeReadingBehavior(userStats);
      
      const response = await API.post('/ai/personalized-challenges', {
        userStats,
        behaviorAnalysis
      });

      return {
        weeklyGoals: response.data.weeklyGoals,
        genreChallenges: response.data.genreChallenges,
        habitChallenges: response.data.habitChallenges,
        socialChallenges: response.data.socialChallenges
      };
    } catch (error) {
      console.warn('Personalized challenges failed, using fallback:', error);
      return this.getFallbackChallenges(userStats);
    }
  }

  /**
   * Generate comprehensive reading analytics and insights
   */
  async generateAnalyticsInsights(userId) {
    try {
      const readingData = await this.aggregateUserData(userId);
      
      const response = await API.post('/ai/analytics-insights', {
        userId,
        readingData
      });

      return {
        readingPatterns: response.data.readingPatterns,
        comprehensionTrends: response.data.comprehensionTrends,
        vocabularyGrowth: response.data.vocabularyGrowth,
        recommendedImprovements: response.data.improvements,
        futureGoals: response.data.futureGoals,
        detectedChallenges: response.data.challenges
      };
    } catch (error) {
      console.warn('Analytics insights failed:', error);
      return this.getFallbackAnalytics(userId);
    }
  }

  /**
   * Enhanced note improvement with AI suggestions
   */
  async enhanceUserNote(note, bookContext) {
    try {
      const response = await API.post('/ai/enhance-note', {
        originalNote: note,
        bookContext: bookContext,
        suggestedConnections: await this.findThematicConnections(note),
        vocabularyEnhancements: await this.suggestBetterPhrasing(note)
      });

      return {
        enhancedNote: response.data.enhanced,
        suggestedConnections: response.data.connections,
        vocabularyImprovements: response.data.vocabulary,
        readabilityScore: response.data.readability
      };
    } catch (error) {
      console.warn('Note enhancement failed:', error);
      return { enhancedNote: note };
    }
  }

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
   * Generate contextual help for difficult passages
   */
  async getContextualHelp(selectedText, bookContext) {
    try {
      const response = await API.post('/ai/contextual-help', {
        text: selectedText,
        context: bookContext,
        userLevel: await this.getUserReadingLevel()
      });

      return {
        simplification: response.data.simplified,
        definitions: response.data.definitions,
        culturalContext: response.data.culturalContext,
        historicalContext: response.data.historicalContext,
        examples: response.data.examples,
        mnemonics: response.data.mnemonics
      };

    } catch (error) {
      console.error('Contextual help failed:', error);
      return this.getFallbackHelp(selectedText);
    }
  }

  /**
   * Track and update user reading profile
   */
  async updateUserReadingProfile(sessionData) {
    try {
      const response = await API.post('/ai/update-profile', {
        sessionData,
        timestamp: new Date().toISOString()
      });

      this.userReadingProfile = response.data.profile;
      return this.userReadingProfile;

    } catch (error) {
      console.error('Profile update failed:', error);
      return null;
    }
  }

  /**
   * Get user's reading level and preferences
   */
  async getUserReadingProfile() {
    if (this.userReadingProfile) {
      return this.userReadingProfile;
    }

    try {
      const response = await API.get('/ai/user-profile');
      this.userReadingProfile = response.data;
      return this.userReadingProfile;

    } catch (error) {
      console.error('Failed to get user profile:', error);
      return this.getDefaultProfile();
    }
  }

  /**
   * Get user's current reading level
   */
  async getUserReadingLevel() {
    const profile = await this.getUserReadingProfile();
    return profile?.readingLevel || 'intermediate';
  }

  /**
   * Fallback analysis when AI service is unavailable
   */
  getFallbackAnalysis(text) {
    const wordCount = text.split(/\s+/).length;
    const avgWordLength = text.replace(/[^\w]/g, '').length / wordCount;
    
    return {
      complexity: avgWordLength > 5 ? 'high' : wordCount > 50 ? 'medium' : 'low',
      concepts: [],
      connections: [],
      explanations: [],
      readingTime: Math.ceil(wordCount / 200), // Avg reading speed
      difficulty: avgWordLength > 6 ? 0.8 : 0.5,
      themes: [],
      relatedBooks: []
    };
  }

  /**
   * Fallback suggestions when AI is unavailable
   */
  getFallbackSuggestions(text) {
    return {
      suggestions: [
        {
          type: 'question',
          content: 'What is the main idea of this passage?',
          confidence: 0.6
        },
        {
          type: 'insight',
          content: 'Consider how this relates to your previous reading.',
          confidence: 0.5
        }
      ],
      noteTypes: ['question', 'insight'],
      confidenceScore: 0.5,
      personalizedTips: ['Take notes on key concepts as you read.'],
      relatedConcepts: []
    };
  }

  /**
   * Fallback contextual help
   */
  getFallbackHelp(text) {
    return {
      simplification: text,
      definitions: [],
      culturalContext: null,
      historicalContext: null,
      examples: [],
      mnemonics: []
    };
  }

  /**
   * Build comprehensive user reading profile
   */
  async buildReadingProfile(userId) {
    try {
      const response = await API.get(`/ai/reading-profile/${userId}`);
      return response.data;
    } catch (error) {
      return this.getDefaultProfile();
    }
  }

  /**
   * Analyze mood from user notes and reading patterns
   */
  async analyzeMoodFromNotes(userId) {
    try {
      const response = await API.post('/ai/mood-analysis', { userId });
      return response.data;
    } catch (error) {
      return { dominantTone: 'neutral', confidence: 0.5 };
    }
  }

  /**
   * Get user reading statistics
   */
  async getUserReadingStats(userId) {
    try {
      const response = await API.get(`/ai/user-stats/${userId}`);
      return response.data;
    } catch (error) {
      return { averageWordsPerMinute: 200, sessionLength: 30 };
    }
  }

  /**
   * Analyze user reading behavior patterns
   */
  async analyzeReadingBehavior(userStats) {
    try {
      const response = await API.post('/ai/behavior-analysis', { userStats });
      return response.data;
    } catch (error) {
      return { patterns: [], preferences: [] };
    }
  }

  /**
   * Aggregate user data for analytics
   */
  async aggregateUserData(userId) {
    try {
      const response = await API.get(`/ai/aggregated-data/${userId}`);
      return response.data;
    } catch (error) {
      return { sessions: [], notes: [], books: [] };
    }
  }

  /**
   * Find thematic connections in notes
   */
  async findThematicConnections(note) {
    try {
      const response = await API.post('/ai/thematic-connections', { note });
      return response.data.connections || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Suggest better phrasing for notes
   */
  async suggestBetterPhrasing(note) {
    try {
      const response = await API.post('/ai/improve-phrasing', { note });
      return response.data.suggestions || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Fallback methods for when AI services are unavailable
   */
  getFallbackRecommendations(userId) {
    return {
      recommendations: [],
      reasons: ['AI service temporarily unavailable'],
      similarityScores: [],
      readingOrder: [],
      moodBasedSuggestions: []
    };
  }

  fallbackTimePrediction(book, userId) {
    const pages = book.page_count || book.pages || 250;
    const estimatedMinutes = Math.ceil(pages * 2); // 2 minutes per page average
    
    return {
      estimatedMinutes,
      estimatedSessions: Math.ceil(estimatedMinutes / 30),
      difficultyAdjustment: 1.0,
      personalizedTips: ['Take breaks every 30 minutes for better retention']
    };
  }

  getFallbackChallenges(userStats) {
    return {
      weeklyGoals: [{ type: 'pages', target: 50, description: 'Read 50 pages this week' }],
      genreChallenges: [{ genre: 'mystery', description: 'Try a mystery novel' }],
      habitChallenges: [{ habit: 'daily reading', description: 'Read for 15 minutes daily' }],
      socialChallenges: []
    };
  }

  getFallbackAnalytics(userId) {
    return {
      readingPatterns: { optimal: 'evening', sessions: [] },
      comprehensionTrends: { trend: 'stable', score: 0.7 },
      vocabularyGrowth: { growth: 'steady', newWords: 0 },
      recommendedImprovements: ['Consistent daily reading'],
      futureGoals: ['Increase reading speed'],
      detectedChallenges: []
    };
  }

  /**
   * Default user profile
   */
  getDefaultProfile() {
    return {
      readingLevel: 'intermediate',
      preferredStyle: 'balanced',
      comprehensionLevel: 0.7,
      readingSpeed: 200, // words per minute
      interests: [],
      strengths: [],
      improvementAreas: [],
      genres: [],
      averageSpeed: 200,
      annotationStyle: 'balanced',
      gamificationData: {},
      readingSchedule: 'flexible'
    };
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.analysisCache.clear();
  }
}

export default new ReadingAssistant();
