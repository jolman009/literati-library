// src/components/BottomSheetNotes.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
import MDEditor from '@uiw/react-md-editor';
import { useMaterial3Theme } from "../contexts/Material3ThemeContext";
import { useNotesEditor } from "../hooks/useNotesEditor";
import styles from "./BottomSheetNotes.module.css";

// ===== SNAP POINTS (in vh units) =====
const SNAP_POINTS = {
  PEEK: 25,      // Peek state - shows voice & type buttons clearly
  HALF: 48,      // Half screen - quick notes while seeing book
  FULL: 88,      // Almost full screen - full editing mode
  CLOSED: 0      // Completely hidden
};

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
  currentPage = null
}) => {
  // ===== CONTEXTS =====
  const { actualTheme } = useMaterial3Theme();

  // ===== SHEET STATE =====
  const [sheetState, setSheetState] = useState('closed'); // 'closed', 'peek', 'half', 'full'
  const controls = useAnimation();
  const sheetRef = useRef(null);

  // ===== SHARED HOOK =====
  // Use callback to minimize sheet after successful save
  const handleSaveSuccess = useCallback(() => {
    setSheetState('peek');
    controls.start({ y: `${100 - SNAP_POINTS.PEEK}%` });
  }, [controls]);

  const {
    content,
    setContent,
    tagInput,
    setTagInput,
    isSaving,
    isRecording,
    isRichTextMode,
    handleSave,
    toggleVoiceRecording,
    insertTemplate,
    toggleRichTextMode,
    isVoiceSupported,
    templates,
  } = useNotesEditor({
    book,
    title,
    initialContent,
    currentPage,
    onSaveSuccess: handleSaveSuccess,
  });

  const textareaRef = useRef(null);

  // ===== OPEN/CLOSE LOGIC =====
  useEffect(() => {
    if (isOpen && sheetState === 'closed') {
      // Open to peek state
      setSheetState('peek');
      controls.start({ y: `${100 - SNAP_POINTS.PEEK}%` });
    } else if (!isOpen && sheetState !== 'closed') {
      // Close completely
      setSheetState('closed');
      controls.start({ y: '100%' });
    }
  }, [isOpen, sheetState, controls]);

  // ===== VOICE RECORDING WITH AUTO-EXPAND =====
  const handleVoiceToggle = useCallback(() => {
    // Auto-expand to half state when starting voice recording
    if (!isRecording && sheetState === 'peek') {
      setSheetState('half');
      controls.start({ y: `${100 - SNAP_POINTS.HALF}%` });
    }
    toggleVoiceRecording();
  }, [isRecording, sheetState, controls, toggleVoiceRecording]);

  // ===== DRAG HANDLING =====
  const handleDragEnd = useCallback((event, info) => {
    const { velocity } = info;
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
  }, [sheetState, controls, onClose]);

  // ===== EXPAND TO FULL =====
  const expandToFull = useCallback(() => {
    setSheetState('full');
    controls.start({
      y: `${100 - SNAP_POINTS.FULL}%`,
      transition: { type: 'spring', damping: 30, stiffness: 300 }
    });
  }, [controls]);

  // ===== MINIMIZE TO PEEK =====
  const minimizeToPeek = useCallback(() => {
    setSheetState('peek');
    controls.start({ y: `${100 - SNAP_POINTS.PEEK}%` });
  }, [controls]);

  // ===== CALCULATE OVERLAY OPACITY =====
  const getOverlayOpacity = useCallback(() => {
    const opacityMap = {
      closed: 0,
      peek: 0,
      half: 0.2,
      full: 0.4
    };
    return opacityMap[sheetState] || 0;
  }, [sheetState]);

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
            minimizeToPeek();
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
        dragConstraints={{ top: -window.innerHeight * 0.1, bottom: window.innerHeight * 0.2 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
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
              onClick={handleVoiceToggle}
              type="button"
              disabled={!isVoiceSupported}
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
                onClick={minimizeToPeek}
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
                onClick={toggleRichTextMode}
                aria-label={isRichTextMode ? "Switch to plain text" : "Switch to rich text"}
                type="button"
                title={isRichTextMode ? "Plain Text Mode" : "Rich Text Mode (Markdown)"}
              >
                {isRichTextMode ? '📝' : '✍️'}
              </button>

              {/* Template buttons - inline for simplicity */}
              {templates.map((template) => (
                <button
                  key={template.id}
                  className={styles.toolbarButton}
                  onClick={() => insertTemplate(template)}
                  type="button"
                  title={template.description}
                  aria-label={`Insert ${template.label} template`}
                >
                  {template.icon}
                </button>
              ))}

              <button
                className={`${styles.toolbarButton} ${isRecording ? styles.recording : ''}`}
                onClick={handleVoiceToggle}
                aria-label={isRecording ? "Stop voice input" : "Start voice input"}
                type="button"
                title={isRecording ? "Stop Recording" : "Voice Input"}
                disabled={isRichTextMode || !isVoiceSupported}
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
