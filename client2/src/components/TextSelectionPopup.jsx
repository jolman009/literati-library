// src/components/TextSelectionPopup.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Copy, StickyNote, Volume2 } from 'lucide-react';
import '../styles/text-selection-popup.css';

export default function TextSelectionPopup({ containerRef, onAddToNotes, onReadAloud }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [copied, setCopied] = useState(false);
  const popupRef = useRef(null);
  const dismissTimer = useRef(null);

  const updatePopup = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      // Small delay before hiding to allow button clicks to register
      dismissTimer.current = setTimeout(() => setVisible(false), 150);
      return;
    }

    // Only show popup for selections within our container
    if (containerRef?.current) {
      const anchorNode = selection.anchorNode;
      if (!containerRef.current.contains(anchorNode)) {
        setVisible(false);
        return;
      }
    }

    const text = selection.toString().trim();
    if (!text) return;

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Position above the selection
      const popupHeight = 44;
      const gap = 8;
      let top = rect.top - popupHeight - gap + window.scrollY;
      let left = rect.left + rect.width / 2 + window.scrollX;

      // If too close to top of viewport, show below
      if (rect.top < popupHeight + gap + 10) {
        top = rect.bottom + gap + window.scrollY;
      }

      // Clamp horizontal position
      const popupWidth = 160;
      left = Math.max(popupWidth / 2 + 8, Math.min(left, window.innerWidth - popupWidth / 2 - 8));

      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
        dismissTimer.current = null;
      }

      setSelectedText(text);
      setPosition({ top, left });
      setVisible(true);
      setCopied(false);
    } catch {
      // getRangeAt can throw if selection is in an unusual state
    }
  }, [containerRef]);

  useEffect(() => {
    const onMouseUp = () => {
      // Delay to let browser finalize selection
      setTimeout(updatePopup, 10);
    };

    const onTouchEnd = () => {
      // Longer delay on mobile for selection handles to settle
      setTimeout(updatePopup, 200);
    };

    const onSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        dismissTimer.current = setTimeout(() => setVisible(false), 150);
      }
    };

    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('selectionchange', onSelectionChange);

    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('selectionchange', onSelectionChange);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [updatePopup]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      setCopied(true);
      setTimeout(() => {
        setVisible(false);
        window.getSelection()?.removeAllRanges();
      }, 800);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = selectedText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setVisible(false), 800);
    }
  }, [selectedText]);

  const handleAddToNotes = useCallback(() => {
    if (onAddToNotes) {
      onAddToNotes(selectedText);
    }
    setVisible(false);
    window.getSelection()?.removeAllRanges();
  }, [selectedText, onAddToNotes]);

  const handleReadAloud = useCallback(() => {
    if (onReadAloud) {
      onReadAloud(selectedText);
    }
    setVisible(false);
    window.getSelection()?.removeAllRanges();
  }, [selectedText, onReadAloud]);

  if (!visible) return null;

  return createPortal(
    <div
      ref={popupRef}
      className="text-selection-popup"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseDown={(e) => e.preventDefault()} // Prevent selection from clearing on popup click
    >
      <button
        className="text-selection-btn"
        onClick={handleCopy}
        title="Copy"
      >
        <Copy size={16} />
        <span>{copied ? 'Copied!' : 'Copy'}</span>
      </button>

      <div className="text-selection-divider" />

      <button
        className="text-selection-btn"
        onClick={handleAddToNotes}
        title="Add to Notes"
      >
        <StickyNote size={16} />
        <span>Note</span>
      </button>

      <div className="text-selection-divider" />

      <button
        className="text-selection-btn"
        onClick={handleReadAloud}
        title="Read Aloud"
      >
        <Volume2 size={16} />
        <span>Read</span>
      </button>
    </div>,
    document.body
  );
}
