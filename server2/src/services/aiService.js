// src/services/aiService.js - AI Service (OpenAI GPT-3.5-turbo)
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
        timeout: 30000,
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

  // ===== NOTES SUMMARIZATION =====

  async summarizeNotes(notes, options = {}) {
    const cleanNotes = (Array.isArray(notes) ? notes : []).map(n => String(n || '').trim()).filter(Boolean);
    if (cleanNotes.length === 0) return this.summarizeNotesFallback([], { ...options });

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

      // Second pass: combine partials
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

  async summarizeNotesFallback(notes, options = {}) {
    const all = (Array.isArray(notes) ? notes : []).join(' \n ');
    const sentences = all.split(/[.!?]\s+/).filter(s => s && s.length > 0);
    const top = sentences.slice(0, 4).join('. ') + (sentences.length > 0 ? '.' : '');

    const words = all.toLowerCase().match(/[a-zA-Z][a-zA-Z\-']+/g) || [];
    const stop = new Set(['the', 'and', 'to', 'of', 'in', 'a', 'for', 'is', 'on', 'that', 'with', 'as', 'by', 'it', 'this', 'be', 'or', 'an', 'are', 'from', 'at', 'not', 'your', 'you']);
    const freq = new Map();
    for (const w of words) {
      if (w.length < 4 || stop.has(w)) continue;
      freq.set(w, (freq.get(w) || 0) + 1);
    }
    const themes = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
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

  // ===== NOTE ENHANCEMENT =====

  async enhanceNote(originalNote, bookContext) {
    if (this.fallbackMode || !this.isInitialized) {
      return this.enhanceNoteFallback(originalNote, bookContext);
    }

    try {
      const prompt = this.buildNoteEnhancementPrompt(originalNote, bookContext);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a writing coach that helps improve reading notes. Enhance clarity, add connections, and suggest vocabulary improvements while preserving the original meaning.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 400,
        response_format: { type: 'json_object' }
      });

      const enhancement = JSON.parse(completion.choices[0].message.content);
      return {
        ...enhancement,
        originalLength: originalNote?.length || 0,
        aiGenerated: true,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('AI note enhancement failed:', error);
      serverCrashReporting.reportAIError?.(error, 'note_enhancement', {
        note_length: originalNote?.length || 0
      });
      return this.enhanceNoteFallback(originalNote, bookContext);
    }
  }

  async enhanceNoteFallback(originalNote) {
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

  // ===== MENTOR AI =====

  async mentorDiscuss(bookContext, userMessage, history = []) {
    if (this.fallbackMode || !this.isInitialized) {
      return this.mentorDiscussFallback(bookContext, userMessage);
    }

    try {
      const messages = [
        {
          role: 'system',
          content: `You are a warm, insightful literary mentor discussing "${bookContext.title}" by ${bookContext.author || 'Unknown'}. You guide readers to deeper understanding through Socratic questioning. Keep responses to 2-3 sentences. Always end with a thought-provoking follow-up question.`
        }
      ];

      for (const entry of history.slice(-6)) {
        messages.push({
          role: entry.type === 'user' ? 'user' : 'assistant',
          content: entry.content
        });
      }

      messages.push({ role: 'user', content: userMessage });

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.8,
        max_tokens: 250,
      });

      const text = completion.choices[0].message.content;

      const parts = text.split(/\?\s*(?=[A-Z])/);
      let message = text;
      let nextQuestion = null;

      if (parts.length >= 2) {
        message = parts.slice(0, -1).join('? ') + '?';
        nextQuestion = parts[parts.length - 1].trim();
        if (!nextQuestion.endsWith('?')) nextQuestion += '?';
      }

      return { message, nextQuestion, aiGenerated: true };
    } catch (error) {
      console.error('Mentor discuss failed:', error);
      return this.mentorDiscussFallback(bookContext, userMessage);
    }
  }

  mentorDiscussFallback() {
    const responses = [
      { message: "That's a thoughtful observation about the text. The way you're connecting ideas shows strong analytical thinking.", nextQuestion: "How do you think the author's background influenced this particular aspect of the book?" },
      { message: "Interesting perspective! Literature often works on multiple levels, and you're tapping into something important here.", nextQuestion: "Can you think of another work that explores a similar theme in a different way?" },
      { message: "I appreciate your insight. The best readers are those who engage with the text this deeply.", nextQuestion: "What do you think the author wanted the reader to take away from this section?" },
      { message: "You're raising an important point. This kind of critical engagement is what transforms reading from passive to active.", nextQuestion: "How has your understanding of this book changed since you started reading it?" },
      { message: "Great observation! The connections you're making between ideas are exactly what literary analysis is about.", nextQuestion: "If you could ask the author one question about their intent, what would it be?" },
    ];
    const pick = responses[Math.floor(Math.random() * responses.length)];
    return { ...pick, aiGenerated: false };
  }

  async mentorQuiz(bookContext, userLevel = 'intermediate') {
    if (this.fallbackMode || !this.isInitialized) {
      return this.mentorQuizFallback(bookContext);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator creating reading comprehension quizzes. Generate questions that test understanding at multiple levels. Return strict JSON only.'
          },
          {
            role: 'user',
            content: `Create a comprehension quiz for "${bookContext.title}" by ${bookContext.author || 'Unknown'}.\nGenre: ${bookContext.genre || 'Unknown'}\nDescription: ${(bookContext.description || '').slice(0, 300)}\nReader level: ${userLevel}\n\nReturn JSON:\n{"questions":[{"type":"multiple_choice","level":"remember|understand|apply|analyze","question":"...","options":["a","b","c","d"],"correctAnswer":0,"explanation":"...","hint":"..."}]}\n\nGenerate exactly 5 questions progressing from recall to analysis.`
          }
        ],
        temperature: 0.6,
        max_tokens: 1200,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content);
      return { questions: result.questions || [], aiGenerated: true };
    } catch (error) {
      console.error('Mentor quiz failed:', error);
      return this.mentorQuizFallback(bookContext);
    }
  }

  mentorQuizFallback(bookContext) {
    const title = bookContext.title || 'this book';
    return {
      questions: [
        {
          type: 'multiple_choice', level: 'remember',
          question: `What is the primary genre of "${title}"?`,
          options: [bookContext.genre || 'Fiction', 'Poetry', 'Drama', 'Reference'],
          correctAnswer: 0,
          explanation: `"${title}" is categorized as ${bookContext.genre || 'fiction'}.`,
          hint: 'Think about the overall style and content of the book.'
        },
        {
          type: 'multiple_choice', level: 'understand',
          question: `Which best describes the main focus of "${title}"?`,
          options: ['Character development', 'Plot-driven narrative', 'Philosophical themes', 'Historical events'],
          correctAnswer: 0,
          explanation: 'Consider what the book spends the most time exploring.',
          hint: 'Think about what aspects stayed with you the most.'
        },
        {
          type: 'multiple_choice', level: 'apply',
          question: `How might the themes in "${title}" relate to modern life?`,
          options: ['They reflect universal human experiences', 'They are purely historical', 'They only apply to the setting', 'They have no modern relevance'],
          correctAnswer: 0,
          explanation: 'Great literature often explores timeless themes that transcend their original context.',
          hint: 'Consider the broader messages beyond the specific plot.'
        },
        {
          type: 'multiple_choice', level: 'analyze',
          question: `What literary technique is most prominent in "${title}"?`,
          options: ['Symbolism and metaphor', 'Stream of consciousness', 'Unreliable narrator', 'Epistolary format'],
          correctAnswer: 0,
          explanation: 'Authors use various techniques to convey deeper meaning.',
          hint: 'Think about how the author communicates ideas beyond the literal text.'
        },
        {
          type: 'short_answer', level: 'evaluate',
          question: `In your opinion, what is the most important message in "${title}" and why?`,
          options: [],
          correctAnswer: null,
          explanation: 'This is a subjective question — your personal interpretation is valid as long as it is supported by the text.',
          hint: 'Consider what the author seemed most passionate about conveying.'
        }
      ],
      aiGenerated: false
    };
  }

  // ===== EXTENSION AI (topic extraction + task tagging) =====

  async extractPageTopics(pageContext = {}) {
    const { url, title, description, tags, site_name } = pageContext;
    const contextStr = [title, description, (tags || []).join(', ')].filter(Boolean).join(' | ');

    if (!contextStr || contextStr.length < 5) {
      return this.extractPageTopicsFallback(pageContext);
    }

    const cacheKey = `topics_${this.hashText(contextStr)}`;
    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey);
    }

    if (this.fallbackMode || !this.isInitialized) {
      const fb = this.extractPageTopicsFallback(pageContext);
      this.requestCache.set(cacheKey, fb);
      return fb;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a topic extraction assistant. Analyze the web page context and extract reading-relevant topics. Return strict JSON only.'
          },
          {
            role: 'user',
            content: `Extract reading-relevant topics from this web page:\n\nTitle: ${title || 'Unknown'}\nURL: ${url || ''}\nSite: ${site_name || ''}\nDescription: ${(description || '').slice(0, 500)}\nKeywords: ${(tags || []).join(', ')}\n\nReturn JSON with:\n- topics: array of 3-5 specific topic keywords\n- themes: array of 2-3 broad thematic categories\n- suggestedGenres: array of 1-3 book genres that relate\n- readingIntent: one of "learn", "research", "entertainment", "reference"`
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content);
      const enriched = {
        topics: result.topics || [],
        themes: result.themes || [],
        suggestedGenres: result.suggestedGenres || [],
        readingIntent: result.readingIntent || 'learn',
        aiGenerated: true,
        timestamp: Date.now()
      };

      this.requestCache.set(cacheKey, enriched);
      return enriched;
    } catch (error) {
      console.error('AI topic extraction failed:', error);
      serverCrashReporting.reportAIError?.('topic_extraction', error, { url });
      return this.extractPageTopicsFallback(pageContext);
    }
  }

  extractPageTopicsFallback(pageContext = {}) {
    const { url = '', title = '', description = '', tags = [] } = pageContext;
    const text = `${title} ${description} ${tags.join(' ')}`.toLowerCase();

    const domainGenres = {
      'github.com': ['technology', 'programming'],
      'medium.com': ['non-fiction', 'technology'],
      'arxiv.org': ['science', 'research'],
      'wikipedia.org': ['reference', 'non-fiction'],
      'nytimes.com': ['non-fiction', 'journalism'],
      'amazon.com': ['shopping', 'books'],
    };

    let suggestedGenres = [];
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      for (const [domain, genres] of Object.entries(domainGenres)) {
        if (hostname.includes(domain)) {
          suggestedGenres = genres;
          break;
        }
      }
    } catch { /* invalid URL */ }

    const topicKeywords = {
      technology: ['software', 'code', 'programming', 'developer', 'api', 'tech', 'digital', 'computer', 'data'],
      science: ['research', 'study', 'experiment', 'theory', 'biology', 'physics', 'chemistry', 'climate'],
      business: ['company', 'startup', 'market', 'finance', 'invest', 'revenue', 'strategy', 'management'],
      philosophy: ['ethics', 'moral', 'philosophy', 'meaning', 'consciousness', 'existence', 'truth'],
      health: ['health', 'fitness', 'nutrition', 'mental', 'wellness', 'exercise', 'diet', 'medical'],
      history: ['history', 'ancient', 'war', 'civilization', 'century', 'empire', 'revolution'],
      literature: ['novel', 'fiction', 'story', 'author', 'book', 'literary', 'writing', 'poetry'],
      psychology: ['psychology', 'behavior', 'cognitive', 'emotion', 'brain', 'mind', 'therapy'],
    };

    const topics = [];
    const themes = [];
    for (const [theme, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        themes.push(theme);
        const matched = keywords.filter(kw => text.includes(kw));
        topics.push(...matched.slice(0, 2));
      }
    }

    if (tags.length > 0) {
      topics.push(...tags.slice(0, 3));
    }

    return {
      topics: [...new Set(topics)].slice(0, 5),
      themes: themes.slice(0, 3),
      suggestedGenres: suggestedGenres.length > 0 ? suggestedGenres : (themes.length > 0 ? [themes[0]] : ['general']),
      readingIntent: 'learn',
      aiGenerated: false,
      timestamp: Date.now()
    };
  }

  async autoTagTask(text, sourceContext = {}) {
    const cacheKey = `task_${this.hashText(text)}`;

    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey);
    }

    if (this.fallbackMode || !this.isInitialized) {
      return this.autoTagTaskFallback(text, sourceContext);
    }

    try {
      const userPrompt = `Selected text: "${text.substring(0, 1000)}"
Source URL: ${sourceContext.url || 'Unknown'}
Source Title: ${sourceContext.title || 'Unknown'}

Categorize this into a reading task and return JSON.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a task categorization assistant. Analyze the selected text and page context to categorize this into a reading task. Return JSON with: category (one of: reading, research, review, meeting, documentation, learning), suggested_title (short actionable title), suggested_tags (array of 1-3 tags), goal_type (one of: pages, time, books, streak), suggested_target (integer target value), priority (low/medium/high).'
          },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 400,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content);
      this.requestCache.set(cacheKey, result);

      return {
        ...result,
        aiGenerated: true,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('AI auto-tag task failed:', error);
      serverCrashReporting.reportAIError?.(error, 'auto_tag_task', { text_length: text.length });
      return this.autoTagTaskFallback(text, sourceContext);
    }
  }

  async autoTagTaskFallback(text) {
    const lower = text.toLowerCase();

    let category = 'reading';
    if (/\breview\b/.test(lower)) category = 'review';
    else if (/\bmeet(ing)?\b/.test(lower)) category = 'meeting';
    else if (/\bresearch\b/.test(lower)) category = 'research';
    else if (/\bdoc(ument)?\b/.test(lower)) category = 'documentation';
    else if (/\blearn(ing)?\b|\bstudy\b|\bcourse\b/.test(lower)) category = 'learning';

    const firstSentence = text.split(/[.!?\n]/).filter(s => s.trim().length > 0)[0] || text;
    const suggested_title = firstSentence.trim().substring(0, 80);

    const tagCandidates = ['book', 'article', 'chapter', 'paper', 'report', 'notes', 'summary', 'project'];
    const suggested_tags = tagCandidates.filter(tag => lower.includes(tag)).slice(0, 3);
    if (suggested_tags.length === 0) suggested_tags.push(category);

    const goalTypeMap = {
      reading: 'pages', research: 'time', review: 'books',
      meeting: 'time', documentation: 'pages', learning: 'time'
    };

    return {
      category,
      suggested_title,
      suggested_tags,
      goal_type: goalTypeMap[category] || 'pages',
      suggested_target: category === 'time' ? 30 : 10,
      priority: 'medium',
      aiGenerated: false,
      fallbackUsed: true,
      timestamp: Date.now()
    };
  }

  // ===== BOOK RECOMMENDATIONS =====

  async generateBookRecommendations(userBooks = [], options = {}) {
    const { limit = 6, refresh = false } = options;

    if (!userBooks || userBooks.length === 0) {
      return this.bookRecommendationsFallback([], options);
    }

    if (this.fallbackMode || !this.isInitialized) {
      return this.bookRecommendationsFallback(userBooks, options);
    }

    // Build a compact library summary to stay within token limits
    const genreCounts = {};
    const authors = new Set();
    const titles = [];
    for (const book of userBooks.slice(0, 30)) {
      if (book.genre) genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
      if (book.author) authors.add(book.author);
      if (book.title) titles.push(book.title);
    }

    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([g, c]) => `${g} (${c})`);

    const cacheKey = `recs_${this.hashText(titles.sort().join(','))}_${limit}`;
    if (!refresh && this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable librarian who recommends books. Suggest real, published books that exist. Return strict JSON only.'
          },
          {
            role: 'user',
            content: `Based on this reader's library, recommend ${limit} books they would enjoy.

Their library has ${userBooks.length} books.
Top genres: ${topGenres.join(', ') || 'varied'}
Authors they read: ${Array.from(authors).slice(0, 10).join(', ') || 'various'}
Recent titles: ${titles.slice(0, 8).map(t => `"${t}"`).join(', ')}

Rules:
- Do NOT recommend books already in their library
- Mix familiar genres with one or two stretch picks
- Include a brief reason why each book fits this reader

Return JSON:
{
  "recommendations": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "genre": "Genre",
      "reason": "Why this reader would enjoy it (1-2 sentences)",
      "matchType": "similar_genre" | "same_author" | "thematic_match" | "stretch_pick"
    }
  ]
}`
          }
        ],
        temperature: 0.8,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content);

      // Deduplicate by title (GPT sometimes repeats recommendations)
      const seen = new Set();
      const uniqueRecs = (result.recommendations || []).filter(r => {
        const key = (r.title || '').toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const enriched = {
        recommendations: uniqueRecs.slice(0, limit),
        aiGenerated: true,
        librarySize: userBooks.length,
        topGenres: topGenres.map(g => g.replace(/ \(\d+\)/, '')),
        timestamp: Date.now()
      };

      this.requestCache.set(cacheKey, enriched);
      return enriched;
    } catch (error) {
      console.error('AI book recommendations failed:', error);
      serverCrashReporting.reportAIError?.(error, 'book_recommendations', {
        library_size: userBooks.length
      });
      return this.bookRecommendationsFallback(userBooks, options);
    }
  }

  bookRecommendationsFallback(userBooks = [], options = {}) {
    const { limit = 6 } = options;

    // Analyze user's genres to suggest thematically appropriate classics
    const genreCounts = {};
    for (const book of userBooks) {
      if (book.genre) {
        const g = book.genre.toLowerCase();
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      }
    }

    const topGenre = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'fiction';

    const genreRecommendations = {
      fiction: [
        { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Fiction', reason: 'A timeless classic of American literature with rich prose.', matchType: 'similar_genre' },
        { title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction', reason: 'Explores themes of justice and empathy through compelling storytelling.', matchType: 'similar_genre' },
        { title: 'One Hundred Years of Solitude', author: 'Gabriel García Márquez', genre: 'Fiction', reason: 'Magical realism at its finest — a multi-generational epic.', matchType: 'stretch_pick' },
      ],
      'science fiction': [
        { title: 'Dune', author: 'Frank Herbert', genre: 'Science Fiction', reason: 'Epic world-building with deep political and ecological themes.', matchType: 'similar_genre' },
        { title: 'Neuromancer', author: 'William Gibson', genre: 'Science Fiction', reason: 'The foundational cyberpunk novel that predicted our digital age.', matchType: 'similar_genre' },
        { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', genre: 'Science Fiction', reason: 'Thought-provoking exploration of gender and society on an alien world.', matchType: 'thematic_match' },
      ],
      'non-fiction': [
        { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'Non-Fiction', reason: 'A sweeping history of humankind that changes how you see the world.', matchType: 'similar_genre' },
        { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', genre: 'Non-Fiction', reason: 'Fascinating insights into how our minds actually work.', matchType: 'thematic_match' },
        { title: 'The Body', author: 'Bill Bryson', genre: 'Non-Fiction', reason: 'Witty and informative guide to the human body.', matchType: 'stretch_pick' },
      ],
      fantasy: [
        { title: 'The Name of the Wind', author: 'Patrick Rothfuss', genre: 'Fantasy', reason: 'Beautifully written fantasy with a unique narrative structure.', matchType: 'similar_genre' },
        { title: 'Piranesi', author: 'Susanna Clarke', genre: 'Fantasy', reason: 'A haunting, puzzle-like story set in an infinite house.', matchType: 'thematic_match' },
        { title: 'The Fifth Season', author: 'N.K. Jemisin', genre: 'Fantasy', reason: 'Award-winning fantasy that pushes genre boundaries.', matchType: 'stretch_pick' },
      ],
      christian: [
        { title: 'Mere Christianity', author: 'C.S. Lewis', genre: 'Christian', reason: 'Lewis makes a compelling, logical case for the Christian faith.', matchType: 'similar_genre' },
        { title: 'The Screwtape Letters', author: 'C.S. Lewis', genre: 'Christian', reason: 'A clever inversion — a senior demon advises a junior tempter.', matchType: 'similar_genre' },
        { title: 'Celebration of Discipline', author: 'Richard J. Foster', genre: 'Christian', reason: 'A practical guide to the classical spiritual disciplines.', matchType: 'thematic_match' },
      ],
      science: [
        { title: 'A Short History of Nearly Everything', author: 'Bill Bryson', genre: 'Science', reason: 'Makes the history of science accessible and entertaining.', matchType: 'similar_genre' },
        { title: 'The Selfish Gene', author: 'Richard Dawkins', genre: 'Science', reason: 'A foundational work on evolutionary biology and gene-centered theory.', matchType: 'similar_genre' },
        { title: 'Cosmos', author: 'Carl Sagan', genre: 'Science', reason: 'A poetic exploration of the universe and our place in it.', matchType: 'thematic_match' },
      ],
      psychology: [
        { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', genre: 'Psychology', reason: 'Fascinating insights into the two systems that drive how we think.', matchType: 'similar_genre' },
        { title: "Man's Search for Meaning", author: 'Viktor E. Frankl', genre: 'Psychology', reason: 'Profound reflections on purpose from a Holocaust survivor and psychiatrist.', matchType: 'thematic_match' },
        { title: 'The Body Keeps the Score', author: 'Bessel van der Kolk', genre: 'Psychology', reason: 'Groundbreaking work on how trauma reshapes the body and mind.', matchType: 'similar_genre' },
      ],
      'self-help': [
        { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', reason: 'Practical strategies for building better habits and breaking bad ones.', matchType: 'similar_genre' },
        { title: 'Deep Work', author: 'Cal Newport', genre: 'Self-Help', reason: 'A case for focused work in an age of distraction.', matchType: 'thematic_match' },
        { title: 'The 7 Habits of Highly Effective People', author: 'Stephen R. Covey', genre: 'Self-Help', reason: 'Timeless principles for personal and professional effectiveness.', matchType: 'stretch_pick' },
      ],
    };

    const defaults = [
      { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'Non-Fiction', reason: 'A sweeping history of humankind that changes how you see the world.', matchType: 'thematic_match' },
      { title: "Man's Search for Meaning", author: 'Viktor E. Frankl', genre: 'Psychology', reason: 'Profound reflections on purpose from a Holocaust survivor and psychiatrist.', matchType: 'stretch_pick' },
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Fiction', reason: 'A timeless classic of American literature with rich prose.', matchType: 'similar_genre' },
    ];

    // Collect genre-matched recommendations, then fill with defaults (no duplicates)
    const existingTitles = new Set(userBooks.map(b => (b.title || '').toLowerCase()));
    const seen = new Set();
    const pool = [];

    // Add genre-matched books first
    const genrePool = genreRecommendations[topGenre] || [];
    for (const rec of genrePool) {
      const key = rec.title.toLowerCase();
      if (!existingTitles.has(key) && !seen.has(key)) {
        pool.push(rec);
        seen.add(key);
      }
    }

    // Fill remaining slots from other top genres and defaults
    const otherGenres = Object.keys(genreCounts).filter(g => g !== topGenre);
    for (const genre of otherGenres) {
      for (const rec of (genreRecommendations[genre] || [])) {
        const key = rec.title.toLowerCase();
        if (!existingTitles.has(key) && !seen.has(key)) {
          pool.push(rec);
          seen.add(key);
        }
      }
    }

    // Fill any remaining slots with defaults
    for (const rec of defaults) {
      const key = rec.title.toLowerCase();
      if (!existingTitles.has(key) && !seen.has(key)) {
        pool.push(rec);
        seen.add(key);
      }
    }

    const filtered = pool.slice(0, limit);

    return {
      recommendations: filtered,
      aiGenerated: false,
      librarySize: userBooks.length,
      topGenres: Object.keys(genreCounts).slice(0, 3),
      timestamp: Date.now()
    };
  }

  // ===== UTILITIES =====

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

  getStatus() {
    return {
      initialized: this.isInitialized,
      fallbackMode: this.fallbackMode,
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      cacheSize: this.requestCache.size,
      rateLimitStatus: Object.fromEntries(this.rateLimitTracker)
    };
  }

  clearCache() {
    this.requestCache.clear();
    console.log('AI service cache cleared');
  }
}

export default new AIService();
