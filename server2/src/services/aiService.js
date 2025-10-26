// src/services/aiService.js - Real AI Service Implementation
import OpenAI from 'openai';
import serverCrashReporting from './crashReporting.js';

class AIService {
  constructor() {
    this.openai = null;
    this.isInitialized = false;
    this.fallbackMode = false;
    this.requestCache = new Map();
    this.rateLimitTracker = new Map();

    this.initialize();
  }

  /**
   * Initialize OpenAI service
   */
  initialize() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ OpenAI API key not configured, using fallback mode');
      this.fallbackMode = true;
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey,
        timeout: 30000, // 30 second timeout
        maxRetries: 2
      });

      this.isInitialized = true;
      console.log('🤖 AI Service initialized with OpenAI');
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI:', error);
      this.fallbackMode = true;
      serverCrashReporting.captureException?.(error, {
        service: 'ai_service',
        operation: 'initialization'
      });
    }
  }

  /**
   * Analyze text for complexity, concepts, and connections
   */
  async analyzeText(text, context = {}) {
    const cacheKey = `analyze_${this.hashText(text)}`;

    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey);
    }

    if (this.fallbackMode || !this.isInitialized) {
      return this.analyzeTextFallback(text, context);
    }

    try {
      const prompt = this.buildTextAnalysisPrompt(text, context);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a reading comprehension assistant that analyzes text passages for educational purposes. Provide detailed analysis in JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(completion.choices[0].message.content);

      // Cache the result
      this.requestCache.set(cacheKey, analysis);

      return this.enrichAnalysis(analysis, text, context);

    } catch (error) {
      console.error('AI text analysis failed:', error);
      serverCrashReporting.reportAIError?.(error, 'text_analysis', { text_length: text.length });

      // Fall back to local analysis
      return this.analyzeTextFallback(text, context);
    }
  }

  /**
   * Generate smart annotation suggestions
   */
  async suggestAnnotations(text, userProfile, bookContext) {
    if (this.fallbackMode || !this.isInitialized) {
      return this.generateAnnotationsFallback(text, userProfile, bookContext);
    }

    try {
      const prompt = this.buildAnnotationPrompt(text, userProfile, bookContext);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an educational reading assistant that helps users create meaningful annotations. Generate personalized annotation suggestions based on the user's reading level and preferences."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: "json_object" }
      });

      const suggestions = JSON.parse(completion.choices[0].message.content);
      return this.enrichAnnotationSuggestions(suggestions, text, userProfile);

    } catch (error) {
      console.error('AI annotation suggestions failed:', error);
      serverCrashReporting.reportAIError?.(error, 'annotation_suggestions', {
        text_length: text.length,
        user_level: userProfile?.readingLevel
      });

      return this.generateAnnotationsFallback(text, userProfile, bookContext);
    }
  }

  /**
   * Generate reading insights
   */
  async generateReadingInsights(sessionData, userProfile) {
    if (this.fallbackMode || !this.isInitialized) {
      return this.generateReadingInsightsFallback(sessionData, userProfile);
    }

    try {
      const prompt = this.buildInsightsPrompt(sessionData, userProfile);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a reading coach that provides personalized insights based on reading sessions. Analyze patterns and provide actionable recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const insights = JSON.parse(completion.choices[0].message.content);
      return this.enrichReadingInsights(insights, sessionData, userProfile);

    } catch (error) {
      console.error('AI reading insights failed:', error);
      serverCrashReporting.reportAIError?.(error, 'reading_insights', sessionData);

      return this.generateReadingInsightsFallback(sessionData, userProfile);
    }
  }

  /**
   * Summarize a collection of notes (map-reduce style for long inputs)
   */
  async summarizeNotes(notes, options = {}) {
    const cleanNotes = (Array.isArray(notes) ? notes : []).map(n => String(n || '').trim()).filter(Boolean);
    if (cleanNotes.length === 0) return this.summarizeNotesFallback([],{...options});

    const cacheKey = `sum_${this.hashText(cleanNotes.join('\n\n'))}_${options?.mode || 'default'}`;
    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey);
    }

    if (this.fallbackMode || !this.isInitialized) {
      const fb = await this.summarizeNotesFallback(cleanNotes, options);
      this.requestCache.set(cacheKey, fb);
      return fb;
    }

    try {
      // Chunk notes conservatively to control token usage
      const chunks = this.chunkNotesForSummarization(cleanNotes, 1200);

      // First pass: summarize each chunk
      const partials = [];
      for (const chunk of chunks) {
        const prompt = this.buildNotesSummarizationPrompt(chunk, options);
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful synthesis assistant. Return strict JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.4,
          max_tokens: 500,
          response_format: { type: 'json_object' }
        });
        const parsed = JSON.parse(completion.choices[0].message.content);
        partials.push(parsed);
      }

      // Second pass: combine partials into a single synthesis
      const combinePrompt = this.buildCombineSummariesPrompt(partials, options);
      const finalCompletion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You synthesize multiple summaries into one. Return strict JSON only.' },
          { role: 'user', content: combinePrompt }
        ],
        temperature: 0.4,
        max_tokens: 600,
        response_format: { type: 'json_object' }
      });

      const final = JSON.parse(finalCompletion.choices[0].message.content);
      const enriched = {
        ...final,
        aiGenerated: true,
        title: final.title || options.title || 'Notes Summary',
        noteCount: cleanNotes.length,
        timestamp: Date.now()
      };

      this.requestCache.set(cacheKey, enriched);
      return enriched;
    } catch (error) {
      console.error('AI notes summarization failed:', error);
      serverCrashReporting.reportAIError?.(error, 'summarize_notes', { note_count: cleanNotes.length });
      const fb = await this.summarizeNotesFallback(cleanNotes, options);
      this.requestCache.set(cacheKey, fb);
      return fb;
    }
  }

  /**
   * Generate contextual help for difficult passages
   */
  async generateContextualHelp(text, context, userLevel) {
    if (this.fallbackMode || !this.isInitialized) {
      return this.generateContextualHelpFallback(text, context, userLevel);
    }

    try {
      const prompt = this.buildContextualHelpPrompt(text, context, userLevel);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a helpful reading tutor. Explain difficult passages in simple terms appropriate for a ${userLevel} reader. Provide definitions, examples, and context.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 600,
        response_format: { type: "json_object" }
      });

      const help = JSON.parse(completion.choices[0].message.content);
      return this.enrichContextualHelp(help, text, userLevel);

    } catch (error) {
      console.error('AI contextual help failed:', error);
      serverCrashReporting.reportAIError?.(error, 'contextual_help', {
        text_length: text.length,
        user_level: userLevel
      });

      return this.generateContextualHelpFallback(text, context, userLevel);
    }
  }

  /**
   * Generate personalized book recommendations
   */
  async generateBookRecommendations(userData) {
    if (this.fallbackMode || !this.isInitialized) {
      return this.generateBookRecommendationsFallback(userData);
    }

    try {
      const prompt = this.buildRecommendationPrompt(userData);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a knowledgeable librarian and reading advisor. Recommend books based on user's reading history, preferences, mood, and current goals."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      const recommendations = JSON.parse(completion.choices[0].message.content);
      return this.enrichBookRecommendations(recommendations, userData);

    } catch (error) {
      console.error('AI book recommendations failed:', error);
      serverCrashReporting.reportAIError?.(error, 'book_recommendations', userData);

      return this.generateBookRecommendationsFallback(userData);
    }
  }

  /**
   * Enhance user notes with AI suggestions
   */
  async enhanceNote(originalNote, bookContext) {
    if (this.fallbackMode || !this.isInitialized) {
      return this.enhanceNoteFallback(originalNote, bookContext);
    }

    try {
      const prompt = this.buildNoteEnhancementPrompt(originalNote, bookContext);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a writing coach that helps improve reading notes. Enhance clarity, add connections, and suggest vocabulary improvements while preserving the original meaning."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 400,
        response_format: { type: "json_object" }
      });

      const enhancement = JSON.parse(completion.choices[0].message.content);
      return this.enrichNoteEnhancement(enhancement, originalNote);

    } catch (error) {
      console.error('AI note enhancement failed:', error);
      serverCrashReporting.reportAIError?.(error, 'note_enhancement', {
        note_length: originalNote?.length || 0
      });

      return this.enhanceNoteFallback(originalNote, bookContext);
    }
  }

  /**
   * Build prompts for different AI operations
   */
  buildTextAnalysisPrompt(text, context) {
    return `
Please analyze the following text passage and provide a detailed analysis in JSON format:

Text: "${text.substring(0, 1000)}"

Book Context: ${context.bookTitle || 'Unknown'} by ${context.bookAuthor || 'Unknown'}
Genre: ${context.bookGenre || 'General'}
User Reading Level: ${context.userReadingLevel || 'intermediate'}

Provide analysis in this JSON structure:
{
  "complexity": "low|medium|high",
  "concepts": ["concept1", "concept2", ...],
  "connections": ["connection1", "connection2", ...],
  "explanations": ["explanation1", "explanation2", ...],
  "readingTime": estimated_minutes,
  "difficulty": 0.0_to_1.0_score,
  "themes": ["theme1", "theme2", ...],
  "relatedBooks": ["book1", "book2", ...]
}

Focus on educational value and comprehension assistance.
`;
  }

  buildAnnotationPrompt(text, userProfile, bookContext) {
    return `
Generate personalized annotation suggestions for this text passage:

Text: "${text.substring(0, 800)}"

User Profile:
- Reading Level: ${userProfile?.readingLevel || 'intermediate'}
- Preferred Style: ${userProfile?.preferredStyle || 'balanced'}
- Interests: ${JSON.stringify(userProfile?.interests || [])}

Book Context: ${bookContext?.title || 'Unknown'}

Provide suggestions in this JSON structure:
{
  "suggestions": [
    {
      "type": "question|insight|connection|summary",
      "content": "suggestion text",
      "confidence": 0.0_to_1.0
    }
  ],
  "noteTypes": ["question", "insight", "connection", "summary"],
  "confidence": overall_confidence,
  "personalizedTips": ["tip1", "tip2", ...],
  "relatedConcepts": ["concept1", "concept2", ...]
}
`;
  }

  buildInsightsPrompt(sessionData, userProfile) {
    return `
Analyze this reading session and provide personalized insights:

Session Data: ${JSON.stringify(sessionData)}
User Profile: ${JSON.stringify(userProfile)}

Provide insights in this JSON structure:
{
  "comprehensionScore": 0.0_to_1.0,
  "readingSpeed": words_per_minute,
  "engagementLevel": "low|medium|high",
  "recommendedBreaks": number_of_breaks,
  "focusAreas": ["area1", "area2", ...],
  "nextSteps": ["step1", "step2", ...],
  "personalizedGoals": ["goal1", "goal2", ...]
}
`;
  }

  buildContextualHelpPrompt(text, context, userLevel) {
    return `
Provide contextual help for this difficult passage, adapted for a ${userLevel} reader:

Text: "${text.substring(0, 600)}"
Context: ${JSON.stringify(context)}

Provide help in this JSON structure:
{
  "simplification": "simplified explanation",
  "definitions": [{"term": "word", "definition": "simple definition"}],
  "culturalContext": "cultural background if relevant",
  "historicalContext": "historical background if relevant",
  "examples": ["example1", "example2", ...],
  "mnemonics": ["memory aid1", "memory aid2", ...]
}
`;
  }

  buildRecommendationPrompt(userData) {
    return `
Recommend books based on this user data:

${JSON.stringify(userData)}

Provide recommendations in this JSON structure:
{
  "books": [],
  "explanations": ["reason1", "reason2", ...],
  "scores": [],
  "suggestedOrder": [],
  "moodSuggestions": [
    {
      "genre": "genre_name",
      "reason": "why this matches user's mood",
      "confidence": 0.0_to_1.0
    }
  ]
}

Note: Since I don't have access to a specific book database, focus on genre and type recommendations with detailed explanations.
`;
  }

  buildNoteEnhancementPrompt(originalNote, bookContext) {
    return `
Enhance this reading note while preserving the original meaning:

Original Note: "${originalNote}"
Book Context: ${JSON.stringify(bookContext)}

Provide enhancement in this JSON structure:
{
  "enhanced": "improved version of the note",
  "connections": ["connection1", "connection2", ...],
  "vocabulary": ["vocabulary improvement1", "improvement2", ...],
  "readability": 0.0_to_1.0_score,
  "suggestions": ["suggestion1", "suggestion2", ...]
}
`;
  }

  buildNotesSummarizationPrompt(notes, options) {
    const joined = notes.map((n, i) => `${i + 1}. ${n.substring(0, 800)}`).join('\n');
    const tagLine = options?.tags?.length ? `\nRelevant tags: ${options.tags.join(', ')}` : '';
    return `Summarize the following user notes into a concise synthesis. Focus only on what is written in the notes. Avoid adding facts not present.

Notes:\n${joined}${tagLine}

Return JSON with shape:
{
  "title": "short synthesis title",
  "summary": "3-5 sentence executive summary",
  "bullets": ["key point", ...],
  "themes": [ { "name": "theme", "explanation": "short" } ],
  "questions": ["thoughtful question"],
  "nextSteps": ["actionable suggestion"],
  "confidence": 0.0_to_1.0
}`;
  }

  buildCombineSummariesPrompt(partials, options) {
    const payload = JSON.stringify(partials).substring(0, 8000);
    const title = options?.title || 'Notes Summary';
    return `Combine these partial summaries into a single synthesis for "${title}":

${payload}

Return the same JSON structure as before.`;
  }

  /**
   * Enrichment methods to enhance AI responses
   */
  enrichAnalysis(analysis, text, context) {
    return {
      ...analysis,
      wordCount: text.split(/\s+/).length,
      readingTime: Math.ceil(text.split(/\s+/).length / 200),
      aiGenerated: true,
      timestamp: Date.now()
    };
  }

  enrichAnnotationSuggestions(suggestions, text, userProfile) {
    return {
      ...suggestions,
      textLength: text.length,
      userLevel: userProfile?.readingLevel || 'intermediate',
      aiGenerated: true,
      timestamp: Date.now()
    };
  }

  enrichReadingInsights(insights, sessionData, userProfile) {
    return {
      ...insights,
      sessionDuration: sessionData?.duration || 0,
      userLevel: userProfile?.readingLevel || 'intermediate',
      aiGenerated: true,
      timestamp: Date.now()
    };
  }

  enrichContextualHelp(help, text, userLevel) {
    return {
      ...help,
      textLength: text.length,
      userLevel,
      aiGenerated: true,
      timestamp: Date.now()
    };
  }

  enrichBookRecommendations(recommendations, userData) {
    return {
      ...recommendations,
      userMood: userData.currentMood,
      aiGenerated: true,
      timestamp: Date.now()
    };
  }

  enrichNoteEnhancement(enhancement, originalNote) {
    return {
      ...enhancement,
      originalLength: originalNote?.length || 0,
      aiGenerated: true,
      timestamp: Date.now()
    };
  }

  /**
   * Fallback notes summarization using heuristics
   */
  async summarizeNotesFallback(notes, options = {}) {
    const all = (Array.isArray(notes) ? notes : []).join(' \n ');
    const sentences = all.split(/[.!?]\s+/).filter(s => s && s.length > 0);
    const top = sentences.slice(0, 4).join('. ') + (sentences.length > 0 ? '.' : '');

    // crude keyword extraction
    const words = all.toLowerCase().match(/[a-zA-Z][a-zA-Z\-']+/g) || [];
    const stop = new Set(['the','and','to','of','in','a','for','is','on','that','with','as','by','it','this','be','or','an','are','from','at','not','your','you']);
    const freq = new Map();
    for (const w of words) {
      if (w.length < 4 || stop.has(w)) continue;
      freq.set(w, (freq.get(w) || 0) + 1);
    }
    const themes = Array.from(freq.entries())
      .sort((a,b) => b[1]-a[1])
      .slice(0, 5)
      .map(([name]) => ({ name, explanation: 'Recurring concept in your notes' }));

    return {
      title: options.title || 'Notes Summary',
      summary: top || 'Your notes are ready for summarization once added.',
      bullets: sentences.slice(0, 6).map(s => s.trim()).filter(Boolean),
      themes,
      questions: [
        'What connections can you make between these points?',
        'Which ideas need further evidence or examples?'
      ],
      nextSteps: [
        'Review the top themes and add clarifying notes',
        'Create action items for the most important points'
      ],
      confidence: 0.4,
      aiGenerated: false,
      noteCount: Array.isArray(notes) ? notes.length : 0,
      timestamp: Date.now()
    };
  }

  /**
   * Utility: chunk notes by approximate character limit
   */
  chunkNotesForSummarization(notes, maxChars = 1200) {
    const chunks = [];
    let current = [];
    let length = 0;
    for (const n of notes) {
      if ((length + n.length) > maxChars && current.length) {
        chunks.push(current.slice());
        current = [];
        length = 0;
      }
      current.push(n);
      length += n.length + 1;
    }
    if (current.length) chunks.push(current);
    return chunks;
  }

  /**
   * Fallback methods (from original implementation)
   */
  async analyzeTextFallback(text, context) {
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.replace(/[^\w]/g, '').length, 0) / words.length;

    let complexity = 'low';
    if (avgWordLength > 5 && avgWordsPerSentence > 15) complexity = 'high';
    else if (avgWordLength > 4 || avgWordsPerSentence > 10) complexity = 'medium';

    const concepts = words
      .filter(word => word.length > 4 && /^[A-Z]/.test(word))
      .filter((word, index, arr) => arr.indexOf(word) === index)
      .slice(0, 5);

    const difficultyScore = Math.min((avgWordLength - 3) / 5 + (avgWordsPerSentence - 8) / 15, 1);

    return {
      complexity,
      concepts,
      connections: [],
      explanations: [],
      readingTime: Math.ceil(words.length / 200),
      difficulty: difficultyScore,
      themes: this.extractThemes(text),
      relatedBooks: [],
      aiGenerated: false,
      fallbackUsed: true
    };
  }

  async generateAnnotationsFallback(text, userProfile, bookContext) {
    const suggestions = [];

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

    return {
      suggestions,
      noteTypes: ['question', 'insight', 'connection', 'summary'],
      confidence: 0.7,
      personalizedTips: [
        'Try connecting this to your previous notes',
        'Consider the broader implications',
        'Look for patterns in the author\'s reasoning'
      ],
      relatedConcepts: [],
      aiGenerated: false,
      fallbackUsed: true
    };
  }

  async generateReadingInsightsFallback(sessionData, userProfile) {
    return {
      comprehensionScore: 0.75 + Math.random() * 0.2,
      readingSpeed: 200 + Math.random() * 100,
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
      ],
      aiGenerated: false,
      fallbackUsed: true
    };
  }

  async generateContextualHelpFallback(text, context, userLevel) {
    return {
      simplification: text.length > 100 ?
        'This passage discusses complex ideas that can be broken down into simpler concepts.' :
        text,
      definitions: [],
      culturalContext: null,
      historicalContext: null,
      examples: [],
      mnemonics: [],
      aiGenerated: false,
      fallbackUsed: true
    };
  }

  async generateBookRecommendationsFallback(data) {
    const { currentMood, readingSpeed, noteComplexity, achievements, timeAvailable } = data;

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
      })),
      aiGenerated: false,
      fallbackUsed: true
    };
  }

  async enhanceNoteFallback(originalNote, bookContext) {
    const noteLength = originalNote?.length || 0;
    const hasQuestions = /\?/.test(originalNote);
    const hasConnections = /(connect|relate|similar|like|reminds)/.test(originalNote.toLowerCase());

    return {
      enhanced: originalNote,
      connections: hasConnections ? ['This connects to themes in your previous readings'] : [],
      vocabulary: noteLength > 50 ? ['Consider using more specific terminology'] : [],
      readability: noteLength > 100 ? 0.8 : 0.6,
      suggestions: [
        !hasQuestions ? 'Consider adding questions to deepen your analysis' : null,
        noteLength < 30 ? 'Try expanding your thoughts with more detail' : null,
        !hasConnections ? 'Think about how this connects to other books or experiences' : null
      ].filter(Boolean),
      aiGenerated: false,
      fallbackUsed: true
    };
  }

  /**
   * Utility methods
   */
  extractThemes(text) {
    const commonThemes = [
      'leadership', 'innovation', 'change', 'growth', 'success',
      'challenge', 'opportunity', 'strategy', 'development', 'progress'
    ];

    return commonThemes.filter(theme =>
      new RegExp(`\\b${theme}\\b`, 'i').test(text)
    ).slice(0, 3);
  }

  hashText(text) {
    let hash = 0;
    if (text.length === 0) return hash;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * Service status and health check
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      fallbackMode: this.fallbackMode,
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      cacheSize: this.requestCache.size,
      rateLimitStatus: Object.fromEntries(this.rateLimitTracker)
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.requestCache.clear();
    console.log('AI service cache cleared');
  }
}

// Create singleton instance
const aiService = new AIService();
export default aiService;
