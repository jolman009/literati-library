// src/components/BottomSheetNotes.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import MDEditor from '@uiw/react-md-editor';
import API from "../config/api";
import { useSnackbar } from "./Material3";
import { useReadingSession } from "../contexts/ReadingSessionContext";
import { useMaterial3Theme } from "../contexts/Material3ThemeContext";
import { useGamification } from "../contexts/GamificationContext";
import styles from "./BottomSheetNotes.module.css";

// ===== SNAP POINTS (in vh units) =====
const SNAP_POINTS = {
  PEEK: 10,      // Just visible - shows voice & type buttons
  HALF: 48,      // Half screen - quick notes while seeing book
  FULL: 88,      // Almost full screen - full editing mode
  CLOSED: 0      // Completely hidden
};

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
 * BottomSheetNotes - Mobile-optimized bottom sheet for note-taking
 *
 * Features:
 * - Draggable with snap points (peek, half, full)
 * - Voice-first design in peek mode
 * - Smooth animations via framer-motion
 * - Overlay dimming based on sheet height
 * - Adaptive UI for each state
 */
const BottomSheetNotes = ({
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
  const [sheetState, setSheetState] = useState('closed'); // 'closed', 'peek', 'half', 'full'
  const [content, setContent] = useState(initialContent);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRichTextMode, setIsRichTextMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const controls = useAnimation();
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const sheetRef = useRef(null);

  // Get book_id from either the passed book prop or activeSession
  const bookId = book?.id || activeSession?.book?.id || null;

  // ===== OPEN/CLOSE LOGIC =====
  useEffect(() => {
    if (isOpen && sheetState === 'closed') {
      // Open to peek state
      console.log('🟢 Opening to PEEK state');
      setSheetState('peek');
      controls.start({ y: `${100 - SNAP_POINTS.PEEK}%` });
    } else if (!isOpen && sheetState !== 'closed') {
      // Close completely
      console.log('🔴 Closing bottom sheet');
      setSheetState('closed');
      controls.start({ y: '100%' });
    }
  }, [isOpen, sheetState, controls]);

  // ===== DEBUG: LOG STATE CHANGES =====
  useEffect(() => {
    console.log('📊 Sheet state changed to:', sheetState);
  }, [sheetState]);

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
      // Auto-expand to half state when starting voice recording
      if (sheetState === 'peek') {
        setSheetState('half');
        controls.start({ y: `${100 - SNAP_POINTS.HALF}%` });
      }
      recognitionRef.current.start();
      setIsRecording(true);
      showSnackbar({
        message: '🎤 Listening... Speak now',
        variant: 'info'
      });
    }
  };

  // ===== DRAG HANDLING =====
  const handleDragEnd = (event, info) => {
    const { offset, velocity } = info;
    const currentY = parseFloat(getComputedStyle(sheetRef.current).transform.split(',')[5] || 0);
    const viewportHeight = window.innerHeight;
    const currentHeight = ((viewportHeight - currentY) / viewportHeight) * 100;

    // Determine next snap point based on drag direction and velocity
    let nextState = sheetState;

    if (velocity.y > 500) {
      // Fast swipe down - go to next lower state
      if (sheetState === 'full') nextState = 'half';
      else if (sheetState === 'half') nextState = 'peek';
      else if (sheetState === 'peek') {
        nextState = 'closed';
        onClose();
      }
    } else if (velocity.y < -500) {
      // Fast swipe up - go to next higher state
      if (sheetState === 'peek') nextState = 'half';
      else if (sheetState === 'half') nextState = 'full';
    } else {
      // Slow drag - snap to nearest point
      const distances = {
        peek: Math.abs(currentHeight - SNAP_POINTS.PEEK),
        half: Math.abs(currentHeight - SNAP_POINTS.HALF),
        full: Math.abs(currentHeight - SNAP_POINTS.FULL),
      };

      if (currentHeight < SNAP_POINTS.PEEK / 2) {
        nextState = 'closed';
        onClose();
      } else {
        nextState = Object.keys(distances).reduce((a, b) =>
          distances[a] < distances[b] ? a : b
        );
      }
    }

    // Animate to next state
    if (nextState !== 'closed') {
      setSheetState(nextState);
      controls.start({
        y: `${100 - SNAP_POINTS[nextState.toUpperCase()]}%`,
        transition: { type: 'spring', damping: 30, stiffness: 300 }
      });
    }
  };

  // ===== TEMPLATE INSERTION =====
  const insertTemplate = (template) => {
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
  };

  // ===== SAVE LOGIC =====
  const handleSave = async () => {
    try {
      if (!content.trim()) {
        showSnackbar({ message: 'Cannot save empty note', variant: 'warning' });
        return;
      }

      if (isSaving) return;

      setIsSaving(true);

      let locationPrefix = "";
      let locationMetadata = {};
      let tags = [];

      if (currentPage) {
        locationPrefix = `[p.${currentPage}] `;
        locationMetadata.page_number = currentPage;
        tags.push(`page:${currentPage}`);
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

      try {
        const response = await API.post("/notes", noteData, {
          timeout: 10000
        });

        const serverGamification = response.data?.gamification;

        if (trackAction) {
          try {
            await trackAction('note_created', {
              book_id: bookId,
              note_id: response.data.id,
              page: currentPage,
              timestamp: new Date().toISOString()
            }, { serverSnapshot: serverGamification });
          } catch (trackError) {
            console.warn('⚠️ Failed to track gamification:', trackError);
          }
        }

        const snackbarMessage = serverGamification?.totalPoints != null
          ? `Note saved! ⭐ Total points: ${serverGamification.totalPoints}`
          : "Note saved successfully! ✓";

        showSnackbar({ message: snackbarMessage, variant: "success" });

        // Clear and minimize to peek state
        setContent("");
        setTagInput("");
        setIsSaving(false);
        setSheetState('peek');
        controls.start({ y: `${100 - SNAP_POINTS.PEEK}%` });

      } catch (error) {
        console.error('❌ Failed to save note:', error);

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
                ? "⚠️ Session expired. Note saved locally - will sync after login ✓"
                : "⚠️ Network error. Note saved locally - will sync when online ✓",
              variant: "warning"
            });

            setContent("");
          } catch (localError) {
            showSnackbar({
              message: "⚠️ Failed to save. Please copy your note before closing",
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

  // ===== EXPAND TO FULL =====
  const expandToFull = () => {
    console.log('🔵 expandToFull called - current state:', sheetState);
    setSheetState('full');
    controls.start({
      y: `${100 - SNAP_POINTS.FULL}%`,
      transition: { type: 'spring', damping: 30, stiffness: 300 }
    });
    console.log('🔵 Animation started to FULL state (88% height)');
  };

  // ===== CALCULATE OVERLAY OPACITY =====
  const getOverlayOpacity = () => {
    const opacityMap = {
      closed: 0,
      peek: 0,
      half: 0.2,
      full: 0.4
    };
    return opacityMap[sheetState] || 0;
  };

  const isDark = actualTheme === 'dark';

  // Don't render if closed
  if (!isOpen && sheetState === 'closed') {
    return null;
  }

  return (
    <>
      {/* Backdrop with dynamic dimming */}
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: getOverlayOpacity() }}
        transition={{ duration: 0.3 }}
        onClick={() => {
          if (sheetState !== 'peek') {
            setSheetState('peek');
            controls.start({ y: `${100 - SNAP_POINTS.PEEK}%` });
          } else {
            onClose();
          }
        }}
        style={{ pointerEvents: sheetState === 'closed' ? 'none' : 'auto' }}
      />

      {/* Bottom Sheet */}
      <motion.div
        ref={sheetRef}
        className={`${styles.sheet} ${isDark ? styles.dark : styles.light} ${styles[sheetState]}`}
        initial={{ y: '100%' }}
        animate={controls}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{
          touchAction: 'none'
        }}
        onAnimationComplete={() => console.log('✅ Animation completed to:', sheetState)}
      >
        {/* Drag Handle */}
        <div className={styles.dragHandle}>
          <div className={styles.dragIndicator} />
        </div>

        {/* PEEK STATE: Voice & Type buttons */}
        {sheetState === 'peek' && (
          <div className={styles.peekContent}>
            <button
              className={`${styles.peekButton} ${styles.voiceButton} ${isRecording ? styles.recording : ''}`}
              onClick={toggleVoiceRecording}
              type="button"
            >
              <span className={styles.peekIcon}>{isRecording ? '🔴' : '🎤'}</span>
              <span className={styles.peekLabel}>
                {isRecording ? 'Recording...' : 'Voice Note'}
              </span>
            </button>

            <button
              className={`${styles.peekButton} ${styles.typeButton}`}
              onClick={expandToFull}
              type="button"
            >
              <span className={styles.peekIcon}>✍️</span>
              <span className={styles.peekLabel}>Type Note</span>
            </button>

            <button
              className={`${styles.peekButton} ${styles.closeButton}`}
              onClick={onClose}
              type="button"
              aria-label="Close notes"
            >
              <span className={styles.peekIcon}>✕</span>
            </button>
          </div>
        )}

        {/* HALF & FULL STATE: Full editor */}
        {(sheetState === 'half' || sheetState === 'full') && (
          <>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerContent}>
                <h2 className={styles.title}>{title}</h2>
                <span className={styles.subtitle}>
                  {currentPage ? `Page ${currentPage}` : "Take notes while reading"}
                </span>
              </div>
              <button
                className={styles.minimizeButton}
                onClick={() => {
                  setSheetState('peek');
                  controls.start({ y: `${100 - SNAP_POINTS.PEEK}%` });
                }}
                aria-label="Minimize"
                type="button"
              >
                ↓
              </button>
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
              <button
                className={`${styles.toolbarButton} ${isRichTextMode ? styles.active : ''}`}
                onClick={() => setIsRichTextMode(!isRichTextMode)}
                aria-label={isRichTextMode ? "Switch to plain text" : "Switch to rich text"}
                type="button"
                title={isRichTextMode ? "Plain Text Mode" : "Rich Text Mode (Markdown)"}
              >
                {isRichTextMode ? '📝' : '✍️'}
              </button>

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

              {sheetState === 'half' && (
                <button
                  className={styles.toolbarButton}
                  onClick={expandToFull}
                  aria-label="Expand to full screen"
                  type="button"
                  title="Expand"
                >
                  ↑
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className={styles.content}>
              {isRichTextMode ? (
                <div data-color-mode={isDark ? 'dark' : 'light'}>
                  <MDEditor
                    value={content}
                    onChange={(val) => setContent(val || '')}
                    preview="edit"
                    height={sheetState === 'full' ? 400 : 200}
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
                      ? `Note for page ${currentPage}…\n\nTip: Use templates for structured notes!`
                      : "Write your notes here…\n\nTip: Use templates for structured notes!"
                  }
                  className={styles.textarea}
                  aria-label="Note content"
                />
              )}
            </div>

            {/* Footer Actions */}
            <div className={styles.footer}>
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
              </div>
            </div>
          </>
        )}
      </motion.div>
    </>
  );
};

export default BottomSheetNotes;
