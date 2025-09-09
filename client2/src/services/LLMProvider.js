// LLMProvider.js - Real LLM Integration with Multiple Providers
import AIKeyManager from './AIKeyManager';

class LLMProvider {
  constructor() {
    this.rateLimits = new Map();
    this.requestCounts = new Map();
  }

  // ===== PROVIDER ROUTING =====

  /**
   * Get the best available provider for a specific task
   */
  async getBestProvider(taskType = 'general') {
    const availableProviders = AIKeyManager.getConfiguredProviders();
    
    if (availableProviders.length === 0) {
      throw new Error('No AI providers configured. Please add an API key.');
    }

    // Provider preferences by task type
    const taskPreferences = {
      'analysis': ['anthropic', 'openai', 'gemini', 'cohere'],
      'creative': ['openai', 'anthropic', 'gemini', 'cohere'],
      'factual': ['gemini', 'openai', 'anthropic', 'cohere'],
      'general': ['gemini', 'openai', 'anthropic', 'cohere']
    };

    const preferred = taskPreferences[taskType] || taskPreferences['general'];
    
    // Find first available provider from preferences
    for (const provider of preferred) {
      if (availableProviders.includes(provider)) {
        // Check rate limits
        if (!this.isRateLimited(provider)) {
          return provider;
        }
      }
    }

    // Fallback to first available provider
    return availableProviders[0];
  }

  /**
   * Check if provider is rate limited
   */
  isRateLimited(provider) {
    const now = Date.now();
    const limit = this.rateLimits.get(provider);
    
    if (!limit) return false;
    
    return now < limit.resetTime;
  }

  /**
   * Set rate limit for provider
   */
  setRateLimit(provider, resetTimeMs) {
    this.rateLimits.set(provider, {
      resetTime: Date.now() + resetTimeMs
    });
  }

  // ===== UNIFIED LLM INTERFACE =====

  /**
   * Generate text completion using best available provider
   */
  async generateCompletion(prompt, options = {}) {
    const {
      taskType = 'general',
      maxTokens = 500,
      temperature = 0.7,
      systemPrompt = null
    } = options;

    try {
      const provider = await this.getBestProvider(taskType);
      await AIKeyManager.authenticateRequest(provider);

      switch (provider) {
        case AIKeyManager.PROVIDERS.GEMINI:
          return await this.callGemini(prompt, { maxTokens, temperature, systemPrompt });
        case AIKeyManager.PROVIDERS.OPENAI:
          return await this.callOpenAI(prompt, { maxTokens, temperature, systemPrompt });
        case AIKeyManager.PROVIDERS.ANTHROPIC:
          return await this.callAnthropic(prompt, { maxTokens, temperature, systemPrompt });
        case AIKeyManager.PROVIDERS.COHERE:
          return await this.callCohere(prompt, { maxTokens, temperature, systemPrompt });
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error('LLM generation failed:', error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  // ===== PROVIDER IMPLEMENTATIONS =====

  /**
   * Google Gemini API integration
   */
  async callGemini(prompt, options) {
    const apiKey = AIKeyManager.getKey(AIKeyManager.PROVIDERS.GEMINI);
    
    const requestBody = {
      contents: [{
        parts: [{
          text: options.systemPrompt ? `${options.systemPrompt}\n\n${prompt}` : prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: options.maxTokens,
        temperature: options.temperature,
        candidateCount: 1
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated from Gemini');
    }

    return {
      text: data.candidates[0].content.parts[0].text,
      provider: 'gemini',
      model: 'gemini-2.0-flash-exp',
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      }
    };
  }

  /**
   * OpenAI GPT API integration
   */
  async callOpenAI(prompt, options) {
    const apiKey = AIKeyManager.getKey(AIKeyManager.PROVIDERS.OPENAI);
    
    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const requestBody = {
      model: 'gpt-4o-mini',  // Cost-effective but capable model
      messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      stream: false
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      text: data.choices[0].message.content,
      provider: 'openai',
      model: 'gpt-4o-mini',
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      }
    };
  }

  /**
   * Anthropic Claude API integration
   */
  async callAnthropic(prompt, options) {
    const apiKey = AIKeyManager.getKey(AIKeyManager.PROVIDERS.ANTHROPIC);
    
    const requestBody = {
      model: 'claude-3-haiku-20240307',  // Fast and cost-effective
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      messages: [{
        role: 'user',
        content: prompt
      }]
    };

    if (options.systemPrompt) {
      requestBody.system = options.systemPrompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      text: data.content[0].text,
      provider: 'anthropic',
      model: 'claude-3-haiku-20240307',
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
      }
    };
  }

  /**
   * Cohere API integration
   */
  async callCohere(prompt, options) {
    const apiKey = AIKeyManager.getKey(AIKeyManager.PROVIDERS.COHERE);
    
    const requestBody = {
      model: 'command-light',  // Fast and cost-effective
      prompt: options.systemPrompt ? `${options.systemPrompt}\n\n${prompt}` : prompt,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      truncate: 'END'
    };

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cohere API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      text: data.generations[0].text.trim(),
      provider: 'cohere',
      model: 'command-light',
      usage: {
        promptTokens: 0,  // Cohere doesn't provide token counts in this format
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }

  // ===== SPECIALIZED LITERARY FUNCTIONS =====

  /**
   * Generate book recommendations with AI reasoning
   */
  async generateBookRecommendations(userProfile, preferences = {}) {
    const systemPrompt = `You are a world-class literary mentor. Generate personalized book recommendations based on the user's reading profile and preferences. Provide exactly 3 recommendations with detailed reasoning.

Format your response as a JSON array with this structure:
[{
  "title": "Book Title",
  "author": "Author Name",
  "genre": "Primary Genre",
  "difficulty": "beginner|intermediate|advanced",
  "reason": "Detailed explanation of why this book fits the user",
  "learningOutcomes": ["outcome1", "outcome2", "outcome3"],
  "estimatedReadingTime": "time in hours"
}]`;

    const prompt = `User Reading Profile:
${JSON.stringify(userProfile, null, 2)}

User Preferences:
${JSON.stringify(preferences, null, 2)}

Please recommend 3 books that would perfectly match this reader's journey.`;

    try {
      const result = await this.generateCompletion(prompt, {
        taskType: 'analysis',
        maxTokens: 800,
        temperature: 0.7,
        systemPrompt
      });

      // Parse JSON response
      const recommendations = JSON.parse(result.text);
      return { recommendations, metadata: result };
    } catch (error) {
      console.error('Book recommendation generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate personalized quiz questions
   */
  async generateQuizQuestions(bookContent, userLevel = 'intermediate') {
    const systemPrompt = `You are an expert educator creating personalized reading comprehension quizzes. Generate questions that test understanding at multiple levels of Bloom's Taxonomy.

Format your response as a JSON object:
{
  "questions": [{
    "type": "multiple_choice|short_answer|essay",
    "level": "remember|understand|apply|analyze|evaluate|create",
    "question": "The question text",
    "options": ["option1", "option2", "option3", "option4"],
    "correctAnswer": 0,
    "explanation": "Why this answer is correct",
    "hint": "Helpful hint for the student"
  }]
}`;

    const prompt = `Book/Content Information:
${JSON.stringify(bookContent, null, 2)}

User Level: ${userLevel}

Generate 5 varied quiz questions that progressively test comprehension from basic recall to higher-order thinking.`;

    try {
      const result = await this.generateCompletion(prompt, {
        taskType: 'creative',
        maxTokens: 1000,
        temperature: 0.6,
        systemPrompt
      });

      const quizData = JSON.parse(result.text);
      return { ...quizData, metadata: result };
    } catch (error) {
      console.error('Quiz generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate Socratic discussion questions
   */
  async generateSocraticQuestions(bookContext, discussionTopic) {
    const systemPrompt = `You are a Socratic dialogue facilitator. Generate thoughtful questions that promote deeper thinking and self-discovery about literature. Focus on open-ended questions that encourage reflection rather than simple recall.

Format as JSON:
{
  "questions": [
    {
      "category": "clarification|assumptions|evidence|implications|perspectives",
      "question": "The question text",
      "followUp": "Optional follow-up question"
    }
  ]
}`;

    const prompt = `Book Context:
${JSON.stringify(bookContext, null, 2)}

Discussion Topic: ${discussionTopic}

Generate 8 Socratic questions across different categories to facilitate deep literary discussion.`;

    try {
      const result = await this.generateCompletion(prompt, {
        taskType: 'analysis',
        maxTokens: 600,
        temperature: 0.8,
        systemPrompt
      });

      const questionData = JSON.parse(result.text);
      return { ...questionData, metadata: result };
    } catch (error) {
      console.error('Socratic question generation failed:', error);
      throw error;
    }
  }

  /**
   * Analyze annotation and provide feedback
   */
  async analyzeAnnotation(annotation, bookContext) {
    const systemPrompt = `You are a literary mentor providing constructive feedback on student annotations. Analyze the depth of thinking, identify strengths, and suggest improvements. Be encouraging while pushing for deeper analysis.

Format as JSON:
{
  "analysis": {
    "depth": "surface|developing|proficient|advanced",
    "strengths": ["strength1", "strength2"],
    "suggestions": ["suggestion1", "suggestion2"],
    "questions": ["question1", "question2"]
  },
  "encouragement": "Positive reinforcement message",
  "nextSteps": "Guidance for improvement"
}`;

    const prompt = `Annotation: "${annotation}"

Book Context:
${JSON.stringify(bookContext, null, 2)}

Analyze this annotation and provide constructive feedback.`;

    try {
      const result = await this.generateCompletion(prompt, {
        taskType: 'analysis',
        maxTokens: 400,
        temperature: 0.6,
        systemPrompt
      });

      const feedback = JSON.parse(result.text);
      return { ...feedback, metadata: result };
    } catch (error) {
      console.error('Annotation analysis failed:', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Get usage statistics across all providers
   */
  getUsageStats() {
    const stats = {};
    for (const provider of Object.values(AIKeyManager.PROVIDERS)) {
      if (AIKeyManager.hasValidKey(provider)) {
        stats[provider] = {
          requests: this.requestCounts.get(provider) || 0,
          rateLimited: this.isRateLimited(provider)
        };
      }
    }
    return stats;
  }

  /**
   * Test connection to all configured providers
   */
  async testAllProviders() {
    const results = {};
    const providers = AIKeyManager.getConfiguredProviders();

    for (const provider of providers) {
      try {
        const testResult = await this.generateCompletion('Hello, this is a connection test.', {
          maxTokens: 10,
          temperature: 0.1
        });
        results[provider] = { status: 'success', response: testResult };
      } catch (error) {
        results[provider] = { status: 'error', error: error.message };
      }
    }

    return results;
  }
}

export default new LLMProvider();