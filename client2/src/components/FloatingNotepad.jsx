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
  const [pos, setPos] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });


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

    // Prevent page scroll on touch while dragging
    if (e.cancelable) e.preventDefault();

    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;

    // Constrain within viewport
    const node = noteRef.current;
    const w = node?.offsetWidth ?? 280;
    const h = node?.offsetHeight ?? 220;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const nextX = clamp(startPos.current.x + dx, 0, vw - w);
    const nextY = clamp(startPos.current.y + dy, 0, vh - h);

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
    console.log('💾 Save button clicked');

    if (!content.trim()) {
      console.warn('⚠️ Cannot save empty note');
      return;
    }

    // Prevent double-clicking
    if (isSaving) {
      console.log('⏳ Already saving, ignoring duplicate click');
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

    const noteData = {
      title: title || content.substring(0, 30),
      content: `${locationPrefix}${content.trim()}`,
      book_id: bookId,
      ...locationMetadata,
      tags
    };

    console.log('📝 Attempting to save note:', {
      ...noteData,
      bookId,
      hasBookId: !!bookId,
      hasEpubLocation: !!locationMetadata.epub_location,
      hasPageNumber: !!locationMetadata.page_number
    });

    try {
      const response = await API.post("/notes", noteData, {
        timeout: 10000 // 10 second timeout
      });
      console.log('✅ Note saved successfully:', response.data);

      // Track gamification action for note creation (+15 points)
      if (trackAction) {
        try {
          await trackAction('note_created', {
            book_id: bookId,
            note_id: response.data.id,
            page: currentPage,
            timestamp: new Date().toISOString()
          });
          console.log('🎮 Gamification: note_created action tracked (+15 points)');
        } catch (trackError) {
          console.warn('⚠️ Failed to track note creation for gamification:', trackError);
          // Don't fail the note save if tracking fails
        }
      }

      showSnackbar({ message: "Note saved successfully! ✓", variant: "success" });
      setContent("");
      setIsSaving(false);
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
        width: '320px',
        minHeight: '280px',
        background: isDark ? '#1e293b' : '#ffffff',
        border: `2px solid ${isDark ? '#8b5cf6' : '#7c3aed'}`,
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        cursor: dragging ? 'grabbing' : 'default',
        opacity: dragging ? 0.95 : 1,
        transition: dragging ? 'none' : 'box-shadow 0.2s ease'
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
            ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
            : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: dragging ? 'grabbing' : 'grab',
          borderRadius: '14px 14px 0 0',
          userSelect: 'none'
        }}
      >
        <div>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600'
          }}>
            {title}
          </h3>
          <span style={{
            fontSize: '10px',
            opacity: 0.85
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
          padding: '16px',
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '1.5',
          color: isDark ? '#f1f5f9' : '#1a1d20',
          background: isDark ? '#1e293b' : '#ffffff',
          userSelect: 'text'
        }}
      />

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 16px',
        background: isDark ? '#0f172a' : '#f8f9fa',
        borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`
      }}>
        <button
          onClick={handleSave}
          disabled={!content.trim() || isSaving}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            borderRadius: '20px',
            background: (!content.trim() || isSaving)
              ? (isDark ? '#334155' : '#e9ecef')
              : (isDark ? '#7c3aed' : '#8b5cf6'),
            color: (!content.trim() || isSaving)
              ? (isDark ? '#64748b' : '#6c757d')
              : 'white',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isSaving ? 'wait' : ((!content.trim() || isSaving) ? 'not-allowed' : 'pointer'),
            transition: 'all 0.2s ease',
            opacity: isSaving ? 0.7 : 1
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
          {isSaving ? '⏳ Saving...' : '💾 Save'}
        </button>
        <button
          onClick={() => setContent('')}
          disabled={!content.trim() || isSaving}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            borderRadius: '20px',
            background: (!content.trim() || isSaving)
              ? (isDark ? '#334155' : '#e9ecef')
              : (isDark ? '#dc2626' : '#ef4444'),
            color: (!content.trim() || isSaving)
              ? (isDark ? '#64748b' : '#6c757d')
              : 'white',
            fontSize: '14px',
            fontWeight: '500',
            cursor: (!content.trim() || isSaving) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
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
