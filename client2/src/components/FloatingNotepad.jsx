// src/components/FloatingNotepad.jsx
import React, { useEffect, useRef, useState } from "react";
import API from "../config/api";
import { useSnackbar } from "./Material3";
import { useReadingSession } from "../contexts/ReadingSessionContext";
import "./FloatingNotepad.css";

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const FloatingNotepad = ({ title, initialContent = "", currentPage = null }) => {
  const { activeSession } = useReadingSession();
  const { showSnackbar } = useSnackbar();

  const noteRef = useRef(null);
  const [content, setContent] = useState(initialContent);
  const [pos, setPos] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });

  // Start dragging when user presses on header
  const onPointerDown = (e) => {
    // Only start drag if the header itself is clicked
    if (!e.currentTarget.matches(".notepad-header")) return;

    setDragging(true);
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    dragStart.current = { x: clientX, y: clientY };
    startPos.current = { ...pos };
    e.currentTarget.setPointerCapture?.(e.pointerId);
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
    if (!content.trim()) return;

    const noteData = {
      title: title || content.substring(0, 30),
      content: currentPage ? `[p.${currentPage}] ${content.trim()}` : content.trim(),
      book_id: activeSession?.book?.id || null,
      page_number: currentPage ?? null,              // harmless if backend ignores it
      tags: currentPage ? [`page:${currentPage}`] : []
    };

    try {
      await API.post("/notes", noteData);
      showSnackbar({ message: "Note saved!", variant: "success" });
      setContent("");
    } catch (error) {
      showSnackbar({ message: "Failed to save note", variant: "error" });
      console.error(error);
    }
  };

  return (
    <div
      ref={noteRef}
      className={`floating-notepad ${dragging ? "dragging" : ""}`}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      aria-label="Floating Notepad"
    >
      <div
        className="notepad-header"
        role="button"
        onPointerDown={onPointerDown}
        aria-grabbed={dragging}
      >
        <h3>{title}</h3>
        <span className="hint">{currentPage ? `Page ${currentPage}` : "Drag me"}</span>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={currentPage ? `Note for page ${currentPage}…` : "Write your notes here…"}
        aria-label="Notepad content"
      />

      <div className="notepad-actions">
        <button onClick={handleSave} disabled={!content.trim()}>
          💾 Save Note
        </button>
        <button 
          onClick={() => setContent('')}
          disabled={!content.trim()}
          style={{ 
            background: 'var(--md3-secondary)', 
            color: 'var(--md3-on-secondary)' 
          }}
        >
          🗑️ Clear
        </button>
      </div>
    </div>
  );
};

export default FloatingNotepad;
