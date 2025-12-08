// src/hooks/useNotesEditor.js
// Shared hook for notes editing functionality
// Used by NotesSidebar and BottomSheetNotes

import { useState, useEffect, useRef, useCallback } from 'react';
import API from '../config/api';
import { useSnackbar } from '../components/Material3';
import { useReadingSession } from '../contexts/ReadingSessionContext';
import { useGamification } from '../contexts/GamificationContext';

// ===== NOTE TEMPLATES =====
export const NOTE_TEMPLATES = [
  {
    id: 'quote',
    label: 'Quote',
    icon: '💬',
    description: 'Save a memorable quote or passage from the book',
    template: '> "[Your quote here]"\n\n— Author/Character',
  },
  {
    id: 'question',
    label: 'Question',
    icon: '❓',
    description: 'Record a question that arose while reading',
    template: '**Question:** \n\n**Answer:** ',
  },
  {
    id: 'summary',
    label: 'Summary',
    icon: '📌',
    description: 'Summarize key points from a chapter or section',
    template: '### Summary\n\n**Key Points:**\n- Point 1\n- Point 2\n- Point 3',
  },
  {
    id: 'insight',
    label: 'Insight',
    icon: '💡',
    description: 'Capture a personal insight or realization',
    template: '**Insight:** \n\n**Why it matters:** ',
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: '🔍',
    description: 'Analyze themes, evidence, and interpretations',
    template: '**Analysis:**\n\n**Theme:** \n\n**Evidence:** \n\n**Interpretation:** ',
  },
];

/**
 * useNotesEditor - Shared hook for note-taking functionality
 *
 * Provides:
 * - Content and tag state management
 * - Voice-to-text recording
 * - Template insertion
 * - Save logic with offline fallback
 * - Gamification tracking
 *
 * @param {Object} options
 * @param {Object} options.book - Book object (optional)
 * @param {string} options.title - Note title
 * @param {string} options.initialContent - Initial content
 * @param {number} options.currentPage - Current page number (PDF)
 * @param {Object} options.currentLocator - Current locator (EPUB)
 * @param {Function} options.onSaveSuccess - Callback after successful save
 */
export const useNotesEditor = ({
  book = null,
  title = '',
  initialContent = '',
  currentPage = null,
  currentLocator = null,
  onSaveSuccess = null,
} = {}) => {
  // ===== CONTEXTS =====
  const { activeSession } = useReadingSession();
  const { showSnackbar } = useSnackbar();
  const { trackAction } = useGamification();

  // ===== STATE =====
  const [content, setContent] = useState(initialContent);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isRichTextMode, setIsRichTextMode] = useState(false);

  // Get book_id from either the passed book prop or activeSession
  const bookId = book?.id || activeSession?.book?.id || null;

  const recognitionRef = useRef(null);

  // ===== VOICE RECOGNITION SETUP =====
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }

        if (finalTranscript) {
          setContent((prev) => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        showSnackbar({
          message: `Voice input error: ${event.error}`,
          variant: 'error'
        });
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [showSnackbar]);

  // ===== VOICE RECORDING TOGGLE =====
  const toggleVoiceRecording = useCallback(() => {
    if (!recognitionRef.current) {
      showSnackbar({
        message: 'Voice input not supported in this browser',
        variant: 'error'
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      showSnackbar({
        message: '🎤 Listening... Speak now',
        variant: 'info'
      });
    }
  }, [isRecording, showSnackbar]);

  // ===== TEMPLATE INSERTION =====
  const insertTemplate = useCallback((template) => {
    setContent((prev) => {
      if (!prev.trim()) {
        return template.template;
      }
      return prev + '\n\n---\n\n' + template.template;
    });
    setShowTemplates(false);
    showSnackbar({
      message: `📝 ${template.label} template inserted`,
      variant: 'success'
    });
  }, [showSnackbar]);

  // ===== SAVE LOGIC =====
  const handleSave = useCallback(async () => {
    try {
      if (!content.trim()) {
        showSnackbar({ message: 'Cannot save empty note', variant: 'warning' });
        return false;
      }

      if (isSaving) {
        return false;
      }

      setIsSaving(true);

      // Determine location prefix and metadata based on file type
      let locationPrefix = '';
      let locationMetadata = {};
      let tags = [];

      if (currentPage) {
        locationPrefix = `[p.${currentPage}] `;
        locationMetadata.page_number = currentPage;
        tags.push(`page:${currentPage}`);
      } else if (currentLocator) {
        // Future: Add EPUB location tracking here
      }

      const userTags = tagInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      const allTags = Array.from(new Set([...tags, ...userTags]));

      const noteData = {
        title: title || content.substring(0, 30),
        content: `${locationPrefix}${content.trim()}`,
        book_id: bookId,
        ...locationMetadata,
        tags: allTags
      };

      try {
        const response = await API.post('/notes', noteData, {
          timeout: 10000
        });

        const serverGamification = response.data?.gamification;

        // Track gamification action (+15 points)
        if (trackAction) {
          try {
            await trackAction('note_created', {
              book_id: bookId,
              note_id: response.data.id,
              page: currentPage,
              timestamp: new Date().toISOString()
            }, { serverSnapshot: serverGamification });
          } catch (trackError) {
            console.warn('Failed to track gamification:', trackError);
          }
        }

        const snackbarMessage = serverGamification?.totalPoints != null
          ? `Note saved successfully! ⭐ Total points: ${serverGamification.totalPoints}`
          : 'Note saved successfully! ✓';

        showSnackbar({ message: snackbarMessage, variant: 'success' });

        // Clear fields on success
        setContent('');
        setTagInput('');
        setIsSaving(false);

        // Call success callback if provided
        if (onSaveSuccess) {
          onSaveSuccess(response.data);
        }

        return true;
      } catch (error) {
        console.error('Failed to save note:', error);

        // Graceful degradation: Save locally if backend fails
        const isAuthError = error.response?.status === 401 || error.response?.status === 403;
        const isNetworkError = !error.response || error.code === 'ECONNABORTED';

        if (isAuthError || isNetworkError) {
          try {
            const localNotes = JSON.parse(localStorage.getItem('pendingNotes') || '[]');
            localNotes.push({
              ...noteData,
              timestamp: new Date().toISOString(),
              status: isAuthError ? 'pending_auth' : 'pending_network'
            });
            localStorage.setItem('pendingNotes', JSON.stringify(localNotes));

            showSnackbar({
              message: isAuthError
                ? '⚠️ Session expired. Note saved locally - will sync after login ✓'
                : '⚠️ Network error. Note saved locally - will sync when online ✓',
              variant: 'warning'
            });

            setContent('');
            setTagInput('');
          } catch {
            showSnackbar({
              message: '⚠️ Failed to save. Please copy your note before closing',
              variant: 'error'
            });
          }
        } else {
          showSnackbar({
            message: `Failed to save note: ${error.response?.data?.error || error.message}`,
            variant: 'error'
          });
        }

        setIsSaving(false);
        return false;
      }
    } catch (outerError) {
      console.error('Critical error in handleSave:', outerError);
      showSnackbar({
        message: '❌ An unexpected error occurred. Please try again.',
        variant: 'error'
      });
      setIsSaving(false);
      return false;
    }
  }, [content, tagInput, title, bookId, currentPage, currentLocator, isSaving, showSnackbar, trackAction, onSaveSuccess]);

  // ===== CLEAR LOGIC =====
  const handleClear = useCallback(() => {
    if (window.confirm('Are you sure you want to clear this note?')) {
      setContent('');
      setTagInput('');
    }
  }, []);

  // ===== TOGGLE TEMPLATES =====
  const toggleTemplates = useCallback(() => {
    setShowTemplates(prev => !prev);
  }, []);

  // ===== TOGGLE RICH TEXT MODE =====
  const toggleRichTextMode = useCallback(() => {
    setIsRichTextMode(prev => !prev);
  }, []);

  // ===== CHECK IF VOICE SUPPORTED =====
  const isVoiceSupported = Boolean(recognitionRef.current);

  return {
    // State
    content,
    setContent,
    tagInput,
    setTagInput,
    isSaving,
    isRecording,
    showTemplates,
    isRichTextMode,
    bookId,

    // Actions
    handleSave,
    handleClear,
    toggleVoiceRecording,
    insertTemplate,
    toggleTemplates,
    toggleRichTextMode,

    // Utils
    isVoiceSupported,
    templates: NOTE_TEMPLATES,
  };
};

export default useNotesEditor;
