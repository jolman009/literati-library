// src/components/NotesSidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import MDEditor from '@uiw/react-md-editor';
import { useMaterial3Theme } from "../contexts/Material3ThemeContext";
import { useNotesEditor } from "../hooks/useNotesEditor";
import styles from "./NotesSidebar.module.css";

/**
 * NotesSidebar - Material Design 3 Slide-Out Notes Panel
 *
 * A slide-out panel for note-taking during reading sessions.
 * Used on tablet/desktop viewports.
 *
 * Features:
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
  const { actualTheme } = useMaterial3Theme();

  // ===== SHARED HOOK =====
  const {
    content,
    setContent,
    tagInput,
    setTagInput,
    isSaving,
    isRecording,
    isRichTextMode,
    handleSave,
    handleClear,
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
    currentLocator,
    onSaveSuccess: null, // Keep sidebar open after save
  });

  // ===== LOCAL STATE =====
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef(null);

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
  }, [isOpen, handleSave, onClose]);

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
            onClick={toggleRichTextMode}
            aria-label={isRichTextMode ? "Switch to plain text" : "Switch to rich text"}
            type="button"
            title={isRichTextMode ? "Plain Text Mode" : "Rich Text Mode (Markdown)"}
          >
            {isRichTextMode ? '📝' : '✍️'}
          </button>

          {/* Template buttons - inline for consistency */}
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

          {/* Voice Input */}
          <button
            className={`${styles.toolbarButton} ${isRecording ? styles.recording : ''}`}
            onClick={toggleVoiceRecording}
            aria-label={isRecording ? "Stop voice input" : "Start voice input"}
            type="button"
            title={isRecording ? "Stop Recording" : "Voice Input"}
            disabled={isRichTextMode || !isVoiceSupported}
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
