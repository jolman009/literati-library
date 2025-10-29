// src/components/FloatingNotepad.jsx
import React, { useEffect, useRef, useState } from "react";
import API from "../config/api";
import { useSnackbar } from "./Material3";
import { useReadingSession } from "../contexts/ReadingSessionContext";
import { useMaterial3Theme } from "../contexts/Material3ThemeContext";
import { useGamification } from "../contexts/GamificationContext";
// No longer using FloatingNotepad.css - using inline Material3 styles

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const FloatingNotepad = ({ title, book = null, initialContent = "", currentPage = null, currentLocator = null }) => {
  const { activeSession } = useReadingSession();
  const { showSnackbar } = useSnackbar();
  const { actualTheme } = useMaterial3Theme();
  const { trackAction } = useGamification();

  // Get book_id from either the passed book prop or activeSession
  const bookId = book?.id || activeSession?.book?.id || null;

  const noteRef = useRef(null);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });

  // Mobile-responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [widgetSize, setWidgetSize] = useState({ width: 320, height: 280 });

  // Initialize position based on viewport size
  const getInitialPosition = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobileView = viewportWidth <= 640;

    if (isMobileView) {
      // Mobile: Position in bottom-right corner with padding
      const width = viewportWidth <= 480 ? 240 : 280;
      const height = viewportWidth <= 480 ? 200 : 220; // Smaller heights on mobile
      return {
        x: viewportWidth - width - 16,  // 16px from right edge
        y: viewportHeight - height - 16  // 16px from bottom edge
      };
    } else {
      // Desktop: Top-left as before
      return { x: 20, y: 20 };
    }
  };

  const [pos, setPos] = useState(getInitialPosition());

  // Update mobile state and widget size on mount and resize
  useEffect(() => {
    const updateResponsiveState = () => {
      const viewportWidth = window.innerWidth;
      const isMobileView = viewportWidth <= 640;

      setIsMobile(isMobileView);

      if (isMobileView) {
        // Mobile breakpoints: adjust widget size
        // Smaller heights on mobile due to compact header (42px vs 52px)
        if (viewportWidth <= 480) {
          setWidgetSize({ width: 240, height: 200 });
        } else {
          setWidgetSize({ width: 280, height: 220 });
        }
      } else {
        // Desktop size
        setWidgetSize({ width: 499, height: 280 });
      }
    };

    // Initial check
    updateResponsiveState();

    // Listen for viewport resize
    window.addEventListener('resize', updateResponsiveState);
    return () => window.removeEventListener('resize', updateResponsiveState);
  }, []);

  // Start dragging when user presses on header
  const onPointerDown = (e) => {
    // Start drag immediately - the handler is only attached to the header
    setDragging(true);
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    dragStart.current = { x: clientX, y: clientY };
    startPos.current = { ...pos };

    // Capture pointer events for smooth dragging
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX == null || clientY == null) return;

    // Prevent page scroll on touch while dragging (only when actually dragging)
    if (e.cancelable) e.preventDefault();

    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;

    // Constrain within viewport using actual or fallback dimensions
    const node = noteRef.current;
    const w = node?.offsetWidth ?? widgetSize.width;
    const h = node?.offsetHeight ?? widgetSize.height;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // On mobile, add extra padding to keep widget visible
    const padding = isMobile ? 8 : 0;
    const nextX = clamp(startPos.current.x + dx, padding, vw - w - padding);
    const nextY = clamp(startPos.current.y + dy, padding, vh - h - padding);

    setPos({ x: nextX, y: nextY });
  };

  const endDrag = () => setDragging(false);

  useEffect(() => {
    const handleMove = (e) => onPointerMove(e);
    const handleUp = () => endDrag();

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    // Pointer events cover touch; you can omit touch listeners
    // If you keep them, make them match add/remove pairs exactly
    // window.addEventListener("touchmove", handleMove, { passive: false });
    // window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      // window.removeEventListener("touchmove", handleMove);
      // window.removeEventListener("touchend", handleUp);
    };
  }, [dragging]);

  const handleSave = async () => {
    // ⚠️ CRITICAL: Wrap entire function to catch ALL errors (prevent error boundary navigation)
    try {
      console.log('💾 FloatingNotepad: Save button clicked');

      if (!content.trim()) {
        console.warn('⚠️ FloatingNotepad: Cannot save empty note');
        return;
      }

      // Prevent double-clicking
      if (isSaving) {
        console.log('⏳ FloatingNotepad: Already saving, ignoring duplicate click');
        return;
      }

      setIsSaving(true);

    // Determine location prefix and metadata based on file type
    let locationPrefix = "";
    let locationMetadata = {};
    let tags = [];

    if (currentPage) {
      // PDF: use page number
      console.log('📄 Saving PDF note with page:', currentPage);
      locationPrefix = `[p.${currentPage}] `;
      locationMetadata.page_number = currentPage;
      tags.push(`page:${currentPage}`);
    } else {
      // EPUB: location tracking disabled for now (will revisit in future)
      console.log('📖 Saving EPUB note (no location tracking)');
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

    console.log('📝 Attempting to save note:', {
      ...noteData,
      bookId,
      hasBookId: !!bookId,
      hasEpubLocation: !!locationMetadata.epub_location,
      hasPageNumber: !!locationMetadata.page_number
    });

    try {
      console.log('💾 FloatingNotepad: Starting note save...');
      const response = await API.post("/notes", noteData, {
        timeout: 10000 // 10 second timeout
      });
      console.log('✅ FloatingNotepad: Note saved successfully to server:', {
        noteId: response.data.id,
        hasGamification: !!response.data?.gamification
      });

      const serverGamification = response.data?.gamification;
      if (serverGamification) {
        console.log('🎯 FloatingNotepad: Server gamification snapshot received:', serverGamification);
      }

      // Track gamification action for note creation (+15 points)
      // ⚠️ CRITICAL: Wrap in try-catch to prevent errors from bubbling to error boundary
      if (trackAction) {
        try {
          console.log('🎮 FloatingNotepad: Tracking gamification action...');
          await trackAction('note_created', {
            book_id: bookId,
            note_id: response.data.id,
            page: currentPage,
            timestamp: new Date().toISOString()
          }, { serverSnapshot: serverGamification });
          console.log('✅ FloatingNotepad: Gamification action tracked successfully (+15 points)');
        } catch (trackError) {
          // ⚠️ CRITICAL: Log but don't throw - note is already saved
          console.warn('⚠️ FloatingNotepad: Failed to track gamification (note still saved):', trackError);
          // Don't fail the note save if tracking fails
        }
      }

      const snackbarMessage = serverGamification?.totalPoints != null
        ? `Note saved successfully! ⭐ Total points: ${serverGamification.totalPoints}`
        : "Note saved successfully! ✓";

      showSnackbar({ message: snackbarMessage, variant: "success" });
      setContent("");
      setIsSaving(false);
      setTagInput("");
      setTagInput("");
      console.log('✅ FloatingNotepad: Save workflow completed successfully');
    } catch (error) {
      console.error('❌ Failed to save note:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Graceful degradation: Save locally if backend fails
      const isAuthError = error.response?.status === 401 || error.response?.status === 403;
      const isNetworkError = !error.response || error.code === 'ECONNABORTED';

      if (isAuthError) {
        // Auth token expired - save locally and notify user
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

          console.log('📦 Note saved to localStorage (auth expired)');
          setContent(""); // Clear content since it's saved locally
        } catch (localError) {
          console.error('Failed to save locally:', localError);
          showSnackbar({
            message: "⚠️ Session expired. Please copy your note and log in again",
            variant: "error"
          });
        }
      } else if (isNetworkError) {
        // Network issue - save locally
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

          console.log('📦 Note saved to localStorage (network error)');
          setContent(""); // Clear content since it's saved locally
        } catch (localError) {
          console.error('Failed to save locally:', localError);
          showSnackbar({
            message: "⚠️ Network error. Please copy your note before closing",
            variant: "error"
          });
        }
      } else {
        // Other error - show error message but don't clear content
        showSnackbar({
          message: `Failed to save note: ${error.response?.data?.error || error.message}`,
          variant: "error"
        });
      }

      setIsSaving(false);
    }
    } catch (outerError) {
      // ⚠️ FINAL SAFETY NET: Catch any errors that escaped inner try-catch
      console.error('❌ FloatingNotepad: Critical error in handleSave (outer catch):', outerError);
      showSnackbar({
        message: '❌ An unexpected error occurred. Please try again.',
        variant: 'error'
      });
      setIsSaving(false);
    }
  };

  const isDark = actualTheme === 'dark';

  return (
    <div
      ref={noteRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        zIndex: 9999,
        width: `${widgetSize.width}px`,
        minHeight: `${widgetSize.height}px`,
        background: isDark ? '#1e293b' : '#ffffff',
        border: `2px solid ${isDark ? '#24A8E0' : '#24A8E0'}`,
        borderRadius: isMobile ? '12px' : '16px',
        boxShadow: isMobile
          ? '0 4px 16px rgba(0,0,0,0.15)'
          : '0 8px 32px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        cursor: dragging ? 'grabbing' : 'default',
        opacity: dragging ? 0.95 : 1,
        transition: dragging ? 'none' : 'box-shadow 0.2s ease, width 0.3s ease, min-height 0.3s ease',
        // On mobile, add touch-action to improve scrolling elsewhere
        touchAction: 'none'
      }}
      aria-label="Floating Notepad"
    >
      {/* Header - Draggable */}
      <div
        className="notepad-header"
        role="button"
        onPointerDown={onPointerDown}
        onPointerUp={endDrag}
        aria-grabbed={dragging}
        tabIndex={0}
        style={{
          background: isDark
            ? '#4B9CD3'
            : '#3B82F6',
          color: 'black',
          padding: isMobile ? '8px 10px' : '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: dragging ? 'grabbing' : 'grab',
          borderRadius: isMobile ? '10px 10px 0 0' : '14px 14px 0 0',
          userSelect: 'none',
          minHeight: isMobile ? '42px' : '52px',
          maxHeight: isMobile ? '42px' : '52px'
        }}
      >
        <div style={{
          overflow: 'hidden',
          flex: 1,
          minWidth: 0
        }}>
          <h3 style={{
            margin: 0,
            fontSize: isMobile ? '11px' : '16px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: isMobile ? '1.2' : '1.4'
          }}>
            {title}
          </h3>
          <span style={{
            fontSize: isMobile ? '8px' : '10px',
            opacity: 0.85,
            lineHeight: '1.2',
            display: 'block',
            marginTop: isMobile ? '2px' : '4px'
          }}>
            {currentPage ? `Page ${currentPage}` : "Drag to move"}
          </span>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          currentPage
            ? `Note for page ${currentPage}…`
            : "Write your notes here…"
        }
        aria-label="Notepad content"
        style={{
          flex: 1,
          padding: isMobile ? '12px' : '16px',
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: isMobile ? '13px' : '14px',
          lineHeight: '1.5',
          color: isDark ? '#f1f5f9' : '#1a1d20',
          background: isDark ? '#1e293b' : '#ffffff',
          userSelect: 'text',
          // Allow normal touch scrolling in textarea
          touchAction: 'pan-y'
        }}
      />

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '6px' : '8px',
        padding: isMobile ? '10px 12px' : '12px 16px',
        background: isDark ? '#0f172a' : '#f8f9fa',
        borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`
      }}>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="Tags (comma-separated)"
          aria-label="Note tags"
          style={{
            flex: 2,
            minWidth: '120px',
            padding: isMobile ? '8px' : '10px',
            borderRadius: isMobile ? '12px' : '14px',
            border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
            background: isDark ? '#0b1220' : '#ffffff',
            color: isDark ? '#e2e8f0' : '#0f172a',
            fontSize: isMobile ? '12px' : '13px'
          }}
        />
        <button
          onClick={handleSave}
          disabled={!content.trim() || isSaving}
          style={{
            flex: 1,
            padding: isMobile ? '8px 12px' : '10px 16px',
            border: 'none',
            borderRadius: isMobile ? '16px' : '20px',
            background: (!content.trim() || isSaving)
              ? (isDark ? '#334155' : '#e9ecef')
              : (isDark ? '#24A8E0' : '#24A8E0'),
            color: (!content.trim() || isSaving)
              ? (isDark ? '#64748b' : '#6c757d')
              : 'white',
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: '500',
            cursor: isSaving ? 'wait' : ((!content.trim() || isSaving) ? 'not-allowed' : 'pointer'),
            transition: 'all 0.2s ease',
            opacity: isSaving ? 0.7 : 1,
            minHeight: '44px' // Ensure touch target size on mobile
          }}
          onMouseEnter={(e) => {
            if (!(!content.trim() || isSaving)) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          {isSaving ? (isMobile ? '⏳ Saving...' : '⏳ Saving...') : (isMobile ? '💾 Save' : '💾 Save')}
        </button>
        <button
          onClick={() => setContent('')}
          disabled={!content.trim() || isSaving}
          style={{
            flex: 1,
            padding: isMobile ? '8px 12px' : '10px 16px',
            border: 'none',
            borderRadius: isMobile ? '16px' : '20px',
            background: (!content.trim() || isSaving)
              ? (isDark ? '#334155' : '#e9ecef')
              : (isDark ? '#dc2626' : '#ef4444'),
            color: (!content.trim() || isSaving)
              ? (isDark ? '#64748b' : '#6c757d')
              : 'white',
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: '500',
            cursor: (!content.trim() || isSaving) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            minHeight: '44px' // Ensure touch target size on mobile
          }}
          onMouseEnter={(e) => {
            if (!(!content.trim() || isSaving)) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          🗑️ Clear
        </button>
      </div>
    </div>
  );
};

export default FloatingNotepad;

