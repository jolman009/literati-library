// src/components/NotesSidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import MDEditor from '@uiw/react-md-editor';
import API from "../config/api";
import { useSnackbar } from "./Material3";
import { useReadingSession } from "../contexts/ReadingSessionContext";
import { useMaterial3Theme } from "../contexts/Material3ThemeContext";
import { useGamification } from "../contexts/GamificationContext";
import styles from "./NotesSidebar.module.css";

// ===== NOTE TEMPLATES =====
const NOTE_TEMPLATES = [
  {
    id: 'quote',
    label: 'Quote',
    icon: '💬',
    template: '> "[Your quote here]"\n\n— Author/Character',
  },
  {
    id: 'question',
    label: 'Question',
    icon: '❓',
    template: '**Question:** \n\n**Answer:** ',
  },
  {
    id: 'summary',
    label: 'Summary',
    icon: '📌',
    template: '### Summary\n\n**Key Points:**\n- Point 1\n- Point 2\n- Point 3',
  },
  {
    id: 'insight',
    label: 'Insight',
    icon: '💡',
    template: '**Insight:** \n\n**Why it matters:** ',
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: '🔍',
    template: '**Analysis:**\n\n**Theme:** \n\n**Evidence:** \n\n**Interpretation:** ',
  },
];

/**
 * NotesSidebar - Material Design 3 Slide-Out Notes Panel
 *
 * Replaces FloatingNotepad with improved UX:
 * - Slides in from right side
 * - Rich text editing (Markdown)
 * - Note templates
 * - Voice-to-text input
 * - Keyboard shortcuts (ESC to close, Ctrl+S to save)
 */
const NotesSidebar = ({
  isOpen,
  onClose,
  title,
  book = null,
  initialContent = "",
  currentPage = null,
  currentLocator = null
}) => {
  // ===== CONTEXTS =====
  const { activeSession } = useReadingSession();
  const { showSnackbar } = useSnackbar();
  const { actualTheme } = useMaterial3Theme();
  const { trackAction } = useGamification();

  // ===== STATE =====
  const [content, setContent] = useState(initialContent);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isRichTextMode, setIsRichTextMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Get book_id from either the passed book prop or activeSession
  const bookId = book?.id || activeSession?.book?.id || null;

  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // ===== RESPONSIVE DETECTION =====
  useEffect(() => {
    const updateMobileState = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    updateMobileState();
    window.addEventListener('resize', updateMobileState);
    return () => window.removeEventListener('resize', updateMobileState);
  }, []);

  // ===== FOCUS MANAGEMENT =====
  useEffect(() => {
    if (isOpen && !isRichTextMode && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [isOpen, isRichTextMode]);

  // ===== VOICE RECOGNITION SETUP =====
  useEffect(() => {
    // Check if browser supports Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
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
  const toggleVoiceRecording = () => {
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
  };

  // ===== TEMPLATE INSERTION =====
  const insertTemplate = (template) => {
    setContent((prev) => {
      // If content is empty, insert template directly
      if (!prev.trim()) {
        return template.template;
      }
      // Otherwise, append with spacing
      return prev + '\n\n---\n\n' + template.template;
    });
    setShowTemplates(false);
    showSnackbar({
      message: `📝 ${template.label} template inserted`,
      variant: 'success'
    });
  };

  // ===== SAVE LOGIC (Ported from FloatingNotepad) =====
  const handleSave = async () => {
    try {
      console.warn('💾 NotesSidebar: Save button clicked');

      if (!content.trim()) {
        console.warn('⚠️ NotesSidebar: Cannot save empty note');
        showSnackbar({ message: 'Cannot save empty note', variant: 'warning' });
        return;
      }

      if (isSaving) {
        console.warn('⏳ NotesSidebar: Already saving, ignoring duplicate click');
        return;
      }

      setIsSaving(true);

      // Determine location prefix and metadata based on file type
      let locationPrefix = "";
      let locationMetadata = {};
      let tags = [];

      if (currentPage) {
        console.warn('📄 Saving PDF note with page:', currentPage);
        locationPrefix = `[p.${currentPage}] `;
        locationMetadata.page_number = currentPage;
        tags.push(`page:${currentPage}`);
      } else if (currentLocator) {
        console.warn('📖 Saving EPUB note with locator:', currentLocator);
        // Future: Add EPUB location tracking here
      }

      const userTags = tagInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      const allTags = Array.from(new Set([...(tags || []), ...userTags]));

      const noteData = {
        title: title || content.substring(0, 30),
        content: `${locationPrefix}${content.trim()}`,
        book_id: bookId,
        ...locationMetadata,
        tags: allTags
      };

      console.warn('📝 Attempting to save note:', noteData);

      try {
        const response = await API.post("/notes", noteData, {
          timeout: 10000
        });
        console.warn('✅ Note saved successfully:', response.data.id);

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
            console.warn('✅ Gamification action tracked (+15 points)');
          } catch (trackError) {
            console.warn('⚠️ Failed to track gamification:', trackError);
          }
        }

        const snackbarMessage = serverGamification?.totalPoints != null
          ? `Note saved successfully! ⭐ Total points: ${serverGamification.totalPoints}`
          : "Note saved successfully! ✓";

        showSnackbar({ message: snackbarMessage, variant: "success" });

        // Clear fields on success
        setContent("");
        setTagInput("");
        setIsSaving(false);

        console.warn('✅ Save workflow completed');
      } catch (error) {
        console.error('❌ Failed to save note:', error);

        // Graceful degradation: Save locally if backend fails
        const isAuthError = error.response?.status === 401 || error.response?.status === 403;
        const isNetworkError = !error.response || error.code === 'ECONNABORTED';

        if (isAuthError) {
          try {
            const localNotes = JSON.parse(localStorage.getItem('pendingNotes') || '[]');
            localNotes.push({
              ...noteData,
              timestamp: new Date().toISOString(),
              status: 'pending_auth'
            });
            localStorage.setItem('pendingNotes', JSON.stringify(localNotes));

            showSnackbar({
              message: "⚠️ Session expired. Note saved locally - will sync after login ✓",
              variant: "warning"
            });

            setContent("");
          } catch (localError) {
            showSnackbar({
              message: "⚠️ Session expired. Please copy your note and log in again",
              variant: "error"
            });
          }
        } else if (isNetworkError) {
          try {
            const localNotes = JSON.parse(localStorage.getItem('pendingNotes') || '[]');
            localNotes.push({
              ...noteData,
              timestamp: new Date().toISOString(),
              status: 'pending_network'
            });
            localStorage.setItem('pendingNotes', JSON.stringify(localNotes));

            showSnackbar({
              message: "⚠️ Network error. Note saved locally - will sync when online ✓",
              variant: "warning"
            });

            setContent("");
          } catch (localError) {
            showSnackbar({
              message: "⚠️ Network error. Please copy your note before closing",
              variant: "error"
            });
          }
        } else {
          showSnackbar({
            message: `Failed to save note: ${error.response?.data?.error || error.message}`,
            variant: "error"
          });
        }

        setIsSaving(false);
      }
    } catch (outerError) {
      console.error('❌ Critical error in handleSave:', outerError);
      showSnackbar({
        message: '❌ An unexpected error occurred. Please try again.',
        variant: 'error'
      });
      setIsSaving(false);
    }
  };

  // ===== CLEAR LOGIC =====
  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear this note?')) {
      setContent("");
      setTagInput("");
    }
  };

  // ===== KEYBOARD SHORTCUTS =====
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape key to close sidebar
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }

      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && isOpen) {
        e.preventDefault();
        handleSave();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, content, handleSave, onClose]);

  const isDark = actualTheme === 'dark';

  return (
    <>
      {/* Backdrop (click to close on mobile) */}
      {isOpen && isMobile && (
        <div
          className={styles.backdrop}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : ''} ${isDark ? styles.dark : styles.light}`}
        aria-label="Notes Sidebar"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>{title}</h2>
            <span className={styles.subtitle}>
              {currentPage ? `Page ${currentPage}` : "Take notes while reading"}
            </span>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close sidebar"
            type="button"
          >
            ✕
          </button>
        </header>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          {/* Text Mode Toggle */}
          <button
            className={`${styles.toolbarButton} ${isRichTextMode ? styles.active : ''}`}
            onClick={() => setIsRichTextMode(!isRichTextMode)}
            aria-label={isRichTextMode ? "Switch to plain text" : "Switch to rich text"}
            type="button"
            title={isRichTextMode ? "Plain Text Mode" : "Rich Text Mode (Markdown)"}
          >
            {isRichTextMode ? '📝' : '✍️'}
          </button>

          {/* Templates Dropdown */}
          <div className={styles.templateWrapper}>
            <button
              className={`${styles.toolbarButton} ${showTemplates ? styles.active : ''}`}
              onClick={() => setShowTemplates(!showTemplates)}
              aria-label="Insert template"
              type="button"
              title="Insert Template"
            >
              📋
            </button>
            {showTemplates && (
              <div className={styles.templateDropdown}>
                {NOTE_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    className={styles.templateItem}
                    onClick={() => insertTemplate(template)}
                    type="button"
                  >
                    <span className={styles.templateIcon}>{template.icon}</span>
                    <span className={styles.templateLabel}>{template.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voice Input */}
          <button
            className={`${styles.toolbarButton} ${isRecording ? styles.recording : ''}`}
            onClick={toggleVoiceRecording}
            aria-label={isRecording ? "Stop voice input" : "Start voice input"}
            type="button"
            title={isRecording ? "Stop Recording" : "Voice Input"}
            disabled={isRichTextMode}
          >
            {isRecording ? '🔴' : '🎤'}
          </button>

          <div className={styles.toolbarSpacer} />

          {/* Keyboard Shortcuts Info */}
          <span className={styles.shortcutHint}>
            ESC to close • ⌘S to save
          </span>
        </div>

        {/* Content Area */}
        <div className={styles.content}>
          {isRichTextMode ? (
            <div data-color-mode={isDark ? 'dark' : 'light'}>
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || '')}
                preview="edit"
                height={400}
                visibleDragbar={false}
                className={styles.mdEditor}
              />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                currentPage
                  ? `Note for page ${currentPage}…\n\nTip: Use the templates button above for structured notes!`
                  : "Write your notes here…\n\nTip: Use the templates button above for structured notes!"
              }
              className={styles.textarea}
              aria-label="Note content"
            />
          )}
        </div>

        {/* Footer Actions */}
        <footer className={styles.footer}>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Tags (comma-separated)"
            className={styles.tagInput}
            aria-label="Note tags"
          />

          <div className={styles.actions}>
            <button
              onClick={handleSave}
              disabled={!content.trim() || isSaving}
              className={`${styles.button} ${styles.saveButton}`}
              type="button"
            >
              {isSaving ? '⏳ Saving...' : '💾 Save'}
            </button>

            <button
              onClick={handleClear}
              disabled={!content.trim() || isSaving}
              className={`${styles.button} ${styles.clearButton}`}
              type="button"
            >
              🗑️ Clear
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
};

export default NotesSidebar;
