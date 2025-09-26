// src/routes/ai.js - AI Reading Companion API Routes
import express from 'express';
import aiService from '../services/aiService.js';
import serverCrashReporting from '../services/crashReporting.js';

export function aiRouter(authenticateToken) {
  const router = express.Router();

  // Analyze selected text for complexity, concepts, and connections
  router.post('/analyze-text', authenticateToken, async (req, res) => {
    try {
      const { text, context } = req.body;
      
      if (!text || text.length < 10) {
        return res.status(400).json({ error: 'Text too short for analysis' });
      }

      // Use real AI service for text analysis
      const analysis = await aiService.analyzeText(text, context);
      
      res.json(analysis);
    } catch (error) {
      console.error('Text analysis error:', error);
      res.status(500).json({ error: 'Analysis failed' });
    }
  });

  // Generate smart annotation suggestions
  router.post('/suggest-annotations', authenticateToken, async (req, res) => {
    try {
      const { text, userProfile, bookContext } = req.body;
      
      const suggestions = await aiService.suggestAnnotations(text, userProfile, bookContext);
      
      res.json(suggestions);
    } catch (error) {
      console.error('Annotation suggestions error:', error);
      res.status(500).json({ error: 'Suggestions failed' });
    }
  });

  // Generate reading insights
  router.post('/reading-insights', authenticateToken, async (req, res) => {
    try {
      const { bookId, sessionData, userProfile } = req.body;
      
      const insights = await aiService.generateReadingInsights(sessionData, userProfile);
      
      res.json(insights);
    } catch (error) {
      console.error('Reading insights error:', error);
      res.status(500).json({ error: 'Insights failed' });
    }
  });

  // Get contextual help for difficult passages
  router.post('/contextual-help', authenticateToken, async (req, res) => {
    try {
      const { text, context, userLevel } = req.body;
      
      const help = await aiService.generateContextualHelp(text, context, userLevel);
      
      res.json(help);
    } catch (error) {
      console.error('Contextual help error:', error);
      res.status(500).json({ error: 'Help failed' });
    }
  });

  // Advanced book recommendations with mood analysis
  router.post('/book-recommendations', authenticateToken, async (req, res) => {
    try {
      const { currentBook, readingHistory, readingSpeed, noteComplexity, currentMood, achievements, timeAvailable } = req.body;
      
      const recommendations = await aiService.generateBookRecommendations(req.body);
      res.json(recommendations);
    } catch (error) {
      console.error('Book recommendations error:', error);
      res.status(500).json({ error: 'Recommendations failed' });
    }
  });

  // Reading time prediction
  router.post('/predict-time', authenticateToken, async (req, res) => {
    try {
      const { bookLength, complexity, userSpeed, genre } = req.body;
      
      const prediction = await predictReadingTimeFallback(req.body);
      res.json(prediction);
    } catch (error) {
      console.error('Time prediction error:', error);
      res.status(500).json({ error: 'Time prediction failed' });
    }
  });

  // Personalized gamification challenges
  router.post('/personalized-challenges', authenticateToken, async (req, res) => {
    try {
      const { userStats, behaviorAnalysis } = req.body;
      
      const challenges = await generatePersonalizedChallengesFallback(userStats, behaviorAnalysis);
      res.json(challenges);
    } catch (error) {
      console.error('Personalized challenges error:', error);
      res.status(500).json({ error: 'Challenge generation failed' });
    }
  });

  // Reading analytics insights
  router.post('/analytics-insights', authenticateToken, async (req, res) => {
    try {
      const { userId, readingData } = req.body;
      
      const insights = await generateAnalyticsInsightsFallback(readingData);
      res.json(insights);
    } catch (error) {
      console.error('Analytics insights error:', error);
      res.status(500).json({ error: 'Analytics failed' });
    }
  });

  // Note enhancement
  router.post('/enhance-note', authenticateToken, async (req, res) => {
    try {
      const { originalNote, bookContext, suggestedConnections, vocabularyEnhancements } = req.body;
      
      const enhancement = await aiService.enhanceNote(originalNote, bookContext);
      res.json(enhancement);
    } catch (error) {
      console.error('Note enhancement error:', error);
      res.status(500).json({ error: 'Note enhancement failed' });
    }
  });

  // Mood analysis from notes
  router.post('/mood-analysis', authenticateToken, async (req, res) => {
    try {
      const { userId } = req.body;
      
      // Fallback mood analysis
      const moodData = {
        dominantTone: ['optimistic', 'analytical', 'curious', 'reflective'][Math.floor(Math.random() * 4)],
        confidence: 0.7 + Math.random() * 0.3,
        emotionalTrends: ['stable', 'improving', 'variable'][Math.floor(Math.random() * 3)],
        recommendedGenres: ['mystery', 'science fiction', 'philosophy', 'biography']
      };
      
      res.json(moodData);
    } catch (error) {
      console.error('Mood analysis error:', error);
      res.status(500).json({ error: 'Mood analysis failed' });
    }
  });

  // Get/update user reading profile
  router.get('/user-profile', authenticateToken, async (req, res) => {
    try {
      // Enhanced default profile with more comprehensive data
      const profile = {
        readingLevel: 'intermediate',
        preferredStyle: 'analytical',
        comprehensionLevel: 0.75,
        readingSpeed: 250, // words per minute
        interests: ['technology', 'business', 'philosophy'],
        strengths: ['analytical thinking', 'pattern recognition'],
        improvementAreas: ['speed reading', 'retention'],
        genres: ['non-fiction', 'business', 'technology'],
        averageSpeed: 250,
        annotationStyle: 'detailed',
        gamificationData: { level: 3, points: 1250 },
        readingSchedule: 'evening',
        preferredSessionLength: 30,
        comprehensionStrengths: ['concept mapping', 'critical analysis'],
        learningStyle: 'visual-analytical'
      };
      
      res.json(profile);
    } catch (error) {
      console.error('User profile error:', error);
      res.status(500).json({ error: 'Profile fetch failed' });
    }
  });

  router.post('/update-profile', authenticateToken, async (req, res) => {
    try {
      const { sessionData } = req.body;
      
      // Process session data and update profile
      // For now, just acknowledge the update
      const updatedProfile = {
        readingLevel: 'intermediate',
        preferredStyle: 'analytical',
        comprehensionLevel: 0.75,
        readingSpeed: 250,
        interests: ['technology', 'business', 'philosophy'],
        strengths: ['analytical thinking', 'pattern recognition'],
        improvementAreas: ['speed reading', 'retention'],
        lastUpdated: new Date().toISOString()
      };
      
      res.json({ profile: updatedProfile });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Profile update failed' });
    }
  });

  // AI service health check and status
  router.get('/status', authenticateToken, async (req, res) => {
    try {
      const status = aiService.getStatus();
      res.json({
        ...status,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      console.error('AI status error:', error);
      res.status(500).json({ error: 'Failed to get AI service status' });
    }
  });

  // Clear AI service cache (admin endpoint)
  router.post('/clear-cache', authenticateToken, async (req, res) => {
    try {
      aiService.clearCache();
      res.json({ success: true, message: 'AI cache cleared' });
    } catch (error) {
      console.error('Cache clear error:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  });

  return router;
}

// Fallback analysis functions (intelligent but not requiring external AI)
async function analyzeTextFallback(text, context) {
  const words = text.split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = words.length / sentences.length;
  const avgWordLength = words.reduce((sum, word) => sum + word.replace(/[^\w]/g, '').length, 0) / words.length;
  
  // Calculate complexity based on word length and sentence structure
  let complexity = 'low';
  if (avgWordLength > 5 && avgWordsPerSentence > 15) complexity = 'high';
  else if (avgWordLength > 4 || avgWordsPerSentence > 10) complexity = 'medium';
  
  // Extract potential concepts (capitalized words, technical terms)
  const concepts = words
    .filter(word => word.length > 4 && /^[A-Z]/.test(word))
    .filter((word, index, arr) => arr.indexOf(word) === index)
    .slice(0, 5);
  
  // Calculate difficulty score
  const difficultyScore = Math.min((avgWordLength - 3) / 5 + (avgWordsPerSentence - 8) / 15, 1);
  
  return {
    complexity,
    concepts,
    connections: [], // Would be populated with actual book connections
    explanations: [],
    readingTime: Math.ceil(words.length / 200), // Assuming 200 WPM
    difficulty: difficultyScore,
    themes: extractThemes(text),
    relatedBooks: []
  };
}

async function generateAnnotationsFallback(text, userProfile, bookContext) {
  const suggestions = [];
  
  // Generate different types of suggestions based on text content
  if (text.includes('?')) {
    suggestions.push({
      type: 'question',
      content: 'This passage raises important questions. Consider exploring the implications further.',
      confidence: 0.8
    });
  }
  
  if (text.length > 200) {
    suggestions.push({
      type: 'summary',
      content: 'This is a substantial passage. Consider creating a summary of the key points.',
      confidence: 0.7
    });
  }
  
  if (/\b(but|however|although|nevertheless)\b/i.test(text)) {
    suggestions.push({
      type: 'insight',
      content: 'Notice the contrast or contradiction presented here. How does this affect the argument?',
      confidence: 0.75
    });
  }
  
  if (/\b(example|instance|such as|for example)\b/i.test(text)) {
    suggestions.push({
      type: 'connection',
      content: 'This example could connect to your previous reading or personal experience.',
      confidence: 0.6
    });
  }
  
  return {
    suggestions,
    noteTypes: ['question', 'insight', 'connection', 'summary'],
    confidence: 0.7,
    personalizedTips: [
      'Try connecting this to your previous notes',
      'Consider the broader implications',
      'Look for patterns in the author\'s reasoning'
    ],
    relatedConcepts: []
  };
}

async function generateReadingInsightsFallback(sessionData, userProfile) {
  return {
    comprehensionScore: 0.75 + Math.random() * 0.2, // 75-95%
    readingSpeed: 200 + Math.random() * 100, // 200-300 WPM
    engagementLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    recommendedBreaks: Math.ceil(Math.random() * 3),
    focusAreas: [
      'Pay attention to connecting themes',
      'Consider the author\'s main arguments',
      'Look for supporting evidence'
    ],
    nextSteps: [
      'Review and organize your notes',
      'Connect ideas to your existing knowledge',
      'Consider discussing with others'
    ],
    personalizedGoals: [
      'Complete chapter within 30 minutes',
      'Create 3 meaningful annotations',
      'Identify 2 key concepts'
    ]
  };
}

async function generateContextualHelpFallback(text, context, userLevel) {
  return {
    simplification: text.length > 100 ? 
      'This passage discusses complex ideas that can be broken down into simpler concepts.' : 
      text,
    definitions: [],
    culturalContext: null,
    historicalContext: null,
    examples: [],
    mnemonics: []
  };
}

function extractThemes(text) {
  const commonThemes = [
    'leadership', 'innovation', 'change', 'growth', 'success', 
    'challenge', 'opportunity', 'strategy', 'development', 'progress'
  ];
  
  return commonThemes.filter(theme => 
    new RegExp(`\\b${theme}\\b`, 'i').test(text)
  ).slice(0, 3);
}

// Enhanced fallback functions integrating concepts from existing AI implementation
async function generateBookRecommendationsFallback(data) {
  const { currentMood, readingSpeed, noteComplexity, achievements, timeAvailable } = data;
  
  // Mood-based genre suggestions
  const moodGenres = {
    optimistic: ['motivational', 'adventure', 'biography'],
    analytical: ['science', 'philosophy', 'business'],
    curious: ['history', 'science fiction', 'exploration'],
    reflective: ['memoir', 'philosophy', 'poetry']
  };
  
  const suggestedGenres = moodGenres[currentMood] || ['general fiction', 'non-fiction'];
  
  return {
    books: [],
    explanations: [`Based on your ${currentMood} mood, these genres might interest you`],
    scores: [],
    suggestedOrder: [],
    moodSuggestions: suggestedGenres.map(genre => ({
      genre,
      reason: `Matches your current ${currentMood} state`,
      confidence: 0.7
    }))
  };
}

async function predictReadingTimeFallback({ bookLength, complexity, userSpeed, genre }) {
  const baseWPM = userSpeed || 200;
  const complexityMultiplier = {
    'easy': 1.2,
    'medium': 1.0,
    'hard': 0.7,
    'very_hard': 0.5
  };
  
  const genreMultiplier = {
    'technical': 0.8,
    'philosophy': 0.6,
    'fiction': 1.1,
    'biography': 1.0
  };
  
  const adjustedSpeed = baseWPM * (complexityMultiplier[complexity] || 1.0) * (genreMultiplier[genre] || 1.0);
  const wordsPerPage = 250; // Average words per page
  const totalWords = bookLength * wordsPerPage;
  const minutes = Math.ceil(totalWords / adjustedSpeed);
  
  return {
    minutes,
    sessions: Math.ceil(minutes / 30), // 30-minute sessions
    adjustment: (complexityMultiplier[complexity] || 1.0) * (genreMultiplier[genre] || 1.0),
    tips: [
      complexity === 'hard' ? 'Take extra time for complex passages' : 'Maintain steady reading pace',
      'Take breaks every 25-30 minutes for better retention',
      genre === 'technical' ? 'Consider note-taking for key concepts' : 'Focus on main themes'
    ]
  };
}

async function generatePersonalizedChallengesFallback(userStats, behaviorAnalysis) {
  const currentLevel = userStats?.level || 1;
  const avgSessionTime = userStats?.averageSessionTime || 20;
  
  return {
    weeklyGoals: [
      {
        type: 'reading_time',
        target: Math.max(avgSessionTime * 7 * 1.2, 180), // 20% increase or minimum 3 hours
        description: 'Increase weekly reading time',
        difficulty: 'moderate',
        points: 100
      },
      {
        type: 'book_completion',
        target: Math.max(Math.floor(currentLevel / 2), 1),
        description: 'Complete books this week',
        difficulty: 'challenging',
        points: 250
      }
    ],
    genreChallenges: [
      {
        genre: 'mystery',
        description: 'Try a mystery novel to expand your reading palette',
        difficulty: 'easy',
        points: 150
      }
    ],
    habitChallenges: [
      {
        habit: 'consistent_reading',
        description: 'Read for at least 15 minutes every day this week',
        difficulty: 'moderate',
        points: 200,
        trackingMetric: 'daily_streak'
      }
    ],
    socialChallenges: [
      {
        type: 'notes_sharing',
        description: 'Create detailed notes for 3 books',
        difficulty: 'moderate',
        points: 175
      }
    ]
  };
}

async function generateAnalyticsInsightsFallback(readingData) {
  const sessions = readingData?.sessions || [];
  const notes = readingData?.notes || [];
  const books = readingData?.books || [];
  
  return {
    readingPatterns: {
      optimal: sessions.length > 0 ? 'evening' : 'flexible',
      sessions: sessions.slice(-10), // Last 10 sessions
      consistency: sessions.length > 7 ? 'good' : 'needs_improvement'
    },
    comprehensionTrends: {
      trend: notes.length > books.length * 0.5 ? 'improving' : 'stable',
      score: Math.min(0.6 + (notes.length / Math.max(books.length, 1)) * 0.3, 1.0),
      noteQuality: notes.length > 10 ? 'detailed' : 'basic'
    },
    vocabularyGrowth: {
      growth: 'steady',
      newWords: Math.floor(Math.random() * 20) + 5,
      complexity: 'intermediate'
    },
    improvements: [
      sessions.length < 7 ? 'Try to maintain more consistent reading schedule' : 'Great reading consistency!',
      notes.length < books.length ? 'Consider taking more notes to improve retention' : 'Excellent note-taking habits',
      'Set specific reading goals to track progress'
    ],
    futureGoals: [
      'Increase reading speed while maintaining comprehension',
      'Explore new genres to broaden perspective',
      'Develop stronger analytical skills through detailed notes'
    ],
    challenges: sessions.length === 0 ? ['Getting started with regular reading'] : []
  };
}

async function enhanceNoteFallback(originalNote, bookContext) {
  const noteLength = originalNote?.length || 0;
  const hasQuestions = /\?/.test(originalNote);
  const hasConnections = /(connect|relate|similar|like|reminds)/.test(originalNote.toLowerCase());
  
  return {
    enhanced: originalNote, // For fallback, return original
    connections: hasConnections ? ['This connects to themes in your previous readings'] : [],
    vocabulary: noteLength > 50 ? ['Consider using more specific terminology'] : [],
    readability: noteLength > 100 ? 0.8 : 0.6,
    suggestions: [
      !hasQuestions ? 'Consider adding questions to deepen your analysis' : null,
      noteLength < 30 ? 'Try expanding your thoughts with more detail' : null,
      !hasConnections ? 'Think about how this connects to other books or experiences' : null
    ].filter(Boolean)
  };
}