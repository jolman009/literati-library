// src/services/guideService.js - In-app Guide Assistant (LLM with safe fallbacks)
import OpenAI from 'openai';
import { supabase } from '../config/supabaseClient.js';

class GuideService {
  constructor() {
    this.openai = null;
    this.useFallback = false;
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
    this.init();
  }

  init() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY not set. GuideService running in fallback mode.');
      this.useFallback = true;
      return;
    }
    try {
      this.openai = new OpenAI({ apiKey });
    } catch (e) {
      console.error('Failed to initialize OpenAI client for GuideService:', e);
      this.useFallback = true;
    }
  }

  buildSystemPrompt(context = {}) {
    const { route = '/', userRole = 'user' } = context || {};
    return [
      {
        role: 'system',
        content:
          'You are ShelfQuest\'s in-app guide assistant. '
          + 'Help users learn how to use the app, step-by-step, with short, actionable answers. '
          + 'If the user asks to perform app navigation or tours, propose an action using the allowed tool schema. '
          + 'Never request or display secrets or PII. Never execute destructive actions. '
          + `Current route: ${route}. User role: ${userRole}. Allowed tools: open_page, start_tour, highlight.`
      }
    ];
  }

  async chat(messages = [], context = {}) {
    // If LLM not available, use fallback
    if (this.useFallback || !this.openai) {
      return this.fallback(messages, context);
    }

    // Clamp history size
    const lastMessages = messages.slice(-10);
    const system = this.buildSystemPrompt(context);

    try {
      // Retrieve relevant context via RAG
      const userMsg = [...lastMessages].reverse().find(m => m.role === 'user');
      const query = userMsg?.content || '';
      const retrieved = await this.retrieve(query, context);

      const messagesForLLM = [
        ...system,
        {
          role: 'system',
          content: [
            'Answer user questions using ONLY the provided CONTEXT.',
            'If information is missing, reply that you do not know and suggest where to look.',
            'Keep answers concise and step-wise. Include a short how-to when relevant.',
            'Return strictly JSON with the shape: {"answer": string, "citations": [{"title": string, "sourcePath": string}] }.'
          ].join('\n')
        },
        {
          role: 'system',
          content: this.buildContextBlock(retrieved)
        },
        ...lastMessages
      ];

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: messagesForLLM,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(completion.choices?.[0]?.message?.content || '{}');
      const content = parsed.answer || 'I\'m here to help with the app.';
      const citations = Array.isArray(parsed.citations) ? parsed.citations : [];
      const actions = this.extractActions(content, context);
      return { role: 'assistant', content, actions, citations };
    } catch (e) {
      console.error('GuideService chat failed, using fallback:', e);
      return this.fallback(messages, context);
    }
  }

  async retrieve(query, context = {}) {
    // If no query or no OpenAI, return empty
    if (!query || this.useFallback || !this.openai) return [];
    try {
      const emb = await this.openai.embeddings.create({ model: this.embeddingModel, input: query });
      const vector = emb.data?.[0]?.embedding;
      const { data, error } = await supabase.rpc('rag_search', {
        p_query_embedding: vector,
        p_match_count: 6,
        p_route: context?.route || null,
        p_tags: null
      });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('RAG retrieve failed:', e?.message || e);
      return [];
    }
  }

  buildContextBlock(chunks) {
    if (!chunks || chunks.length === 0) return 'CONTEXT: (none)';
    const lines = ['CONTEXT:'];
    chunks.forEach((c, idx) => {
      const md = c.metadata || {};
      lines.push(
        `#${idx + 1} | ${md.title || 'untitled'} | ${md.sourcePath || 'unknown'} | score=${c.score?.toFixed?.(3)}`
      );
      lines.push(String(c.content).slice(0, 1200));
      lines.push('---');
    });
    return lines.join('\n');
  }

  fallback(messages = [], context = {}) {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const text = (lastUser?.content || '').toLowerCase();
    const actions = [];

    // Heuristic intents → actions
    if (/upload/.test(text)) {
      actions.push({ type: 'open_page', payload: { route: '/upload' } });
      actions.push({ type: 'start_tour', payload: { tourId: 'uploadFlow' } });
    } else if (/library|books?/.test(text)) {
      actions.push({ type: 'open_page', payload: { route: '/library' } });
    } else if (/note|annotation/.test(text)) {
      actions.push({ type: 'open_page', payload: { route: '/notes' } });
      actions.push({ type: 'start_tour', payload: { tourId: 'notesBasics' } });
    } else if (/dashboard|home/.test(text)) {
      actions.push({ type: 'open_page', payload: { route: '/dashboard' } });
    }

    const content = this.fallbackText(text, context, actions);
    return { role: 'assistant', content, actions };
  }

  fallbackText(text, context, actions) {
    const tips = [
      '- Use the Upload page to add PDFs/EPUBs.',
      '- Visit Library to open a book and start reading.',
      '- Notes lets you capture highlights and annotations.',
      '- The Dashboard shows progress and quick actions.'
    ];

    const actionSummary = actions.map(a => {
      if (a.type === 'open_page') return `I can open ${a.payload.route}.`;
      if (a.type === 'start_tour') return `I can start the ${a.payload.tourId} tour.`;
      if (a.type === 'highlight') return 'I can highlight the control you need.';
      return '';
    }).filter(Boolean).join(' ');

    if (text.includes('upload')) {
      return [
        'To upload a book:',
        '1) Go to Upload.',
        '2) Drag a PDF/EPUB or click Select.',
        '3) Fill title/author and submit.',
        actionSummary
      ].join('\n');
    }
    if (text.includes('notes')) {
      return [
        'To take notes:',
        '1) Open a book from Library.',
        '2) Select text and choose Add Note.',
        '3) Review your notes on the Notes page.',
        actionSummary
      ].join('\n');
    }
    return ['How can I help you use ShelfQuest?', ...tips, actionSummary].filter(Boolean).join('\n');
  }

  extractActions(content, context) {
    // Placeholder for future LLM tool-call parsing
    // For now, no actions inferred from content.
    return [];
  }
}

const guideService = new GuideService();
export default guideService;
