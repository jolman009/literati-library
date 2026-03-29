// src/components/TextSelectionPopup.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Copy, StickyNote, Volume2, Languages, Sparkles, Loader2, X } from 'lucide-react';
import { translatePassage, simplifyPassage } from '../api/translatorApi';
import '../styles/text-selection-popup.css';

const TARGET_LANGUAGES = [
  'Spanish', 'French', 'German', 'Portuguese', 'Chinese',
  'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian',
  'Italian', 'Dutch', 'Turkish', 'Vietnamese', 'Polish'
];

const SIMPLIFY_LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'advanced', label: 'Plain' },
];

const LANG_STORAGE_KEY = 'shelfquest_translate_lang';
const LEVEL_STORAGE_KEY = 'shelfquest_simplify_level';

export default function TextSelectionPopup({ containerRef, onAddToNotes, onReadAloud, bookContext }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [copied, setCopied] = useState(false);
  const popupRef = useRef(null);
  const dismissTimer = useRef(null);

  // AI panel state
  const [aiMode, setAiMode] = useState(null); // null | 'translate' | 'simplify'
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState(
    () => localStorage.getItem(LANG_STORAGE_KEY) || 'Spanish'
  );
  const [simplifyLevel, setSimplifyLevel] = useState(
    () => localStorage.getItem(LEVEL_STORAGE_KEY) || 'easy'
  );

  const resetAiPanel = useCallback(() => {
    setAiMode(null);
    setAiResult(null);
    setAiLoading(false);
    setAiError(null);
  }, []);

  const updatePopup = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      dismissTimer.current = setTimeout(() => {
        setVisible(false);
        resetAiPanel();
      }, 150);
      return;
    }

    if (containerRef?.current) {
      const anchorNode = selection.anchorNode;
      if (!containerRef.current.contains(anchorNode)) {
        setVisible(false);
        resetAiPanel();
        return;
      }
    }

    const text = selection.toString().trim();
    if (!text) return;

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      const popupHeight = 44;
      const gap = 8;
      let top = rect.top - popupHeight - gap + window.scrollY;
      let left = rect.left + rect.width / 2 + window.scrollX;

      if (rect.top < popupHeight + gap + 10) {
        top = rect.bottom + gap + window.scrollY;
      }

      const popupWidth = 280;
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
  }, [containerRef, resetAiPanel]);

  useEffect(() => {
    const onMouseUp = () => setTimeout(updatePopup, 10);
    const onTouchEnd = () => setTimeout(updatePopup, 200);
    const onSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        dismissTimer.current = setTimeout(() => {
          setVisible(false);
          resetAiPanel();
        }, 150);
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
  }, [updatePopup, resetAiPanel]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      setCopied(true);
      setTimeout(() => {
        setVisible(false);
        resetAiPanel();
        window.getSelection()?.removeAllRanges();
      }, 800);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = selectedText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => {
        setVisible(false);
        resetAiPanel();
      }, 800);
    }
  }, [selectedText, resetAiPanel]);

  const handleAddToNotes = useCallback(() => {
    if (onAddToNotes) onAddToNotes(selectedText);
    setVisible(false);
    resetAiPanel();
    window.getSelection()?.removeAllRanges();
  }, [selectedText, onAddToNotes, resetAiPanel]);

  const handleReadAloud = useCallback(() => {
    if (onReadAloud) onReadAloud(selectedText);
    setVisible(false);
    resetAiPanel();
    window.getSelection()?.removeAllRanges();
  }, [selectedText, onReadAloud, resetAiPanel]);

  // --- AI actions ---

  const doTranslate = useCallback(async (lang) => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const result = await translatePassage({
        text: selectedText,
        targetLanguage: lang,
        bookTitle: bookContext?.title,
        bookId: bookContext?.id,
      });
      setAiResult(result);
    } catch (err) {
      setAiError(err?.response?.data?.error || 'Translation failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }, [selectedText, bookContext]);

  const doSimplify = useCallback(async (level) => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const result = await simplifyPassage({
        text: selectedText,
        level,
        bookTitle: bookContext?.title,
        bookId: bookContext?.id,
      });
      setAiResult(result);
    } catch (err) {
      setAiError(err?.response?.data?.error || 'Simplification failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }, [selectedText, bookContext]);

  const handleTranslateClick = useCallback(() => {
    if (aiMode === 'translate') {
      resetAiPanel();
      return;
    }
    setAiMode('translate');
    setAiResult(null);
    setAiError(null);
    doTranslate(targetLanguage);
  }, [aiMode, targetLanguage, doTranslate, resetAiPanel]);

  const handleSimplifyClick = useCallback(() => {
    if (aiMode === 'simplify') {
      resetAiPanel();
      return;
    }
    setAiMode('simplify');
    setAiResult(null);
    setAiError(null);
    doSimplify(simplifyLevel);
  }, [aiMode, simplifyLevel, doSimplify, resetAiPanel]);

  const handleLanguageChange = useCallback((lang) => {
    setTargetLanguage(lang);
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    doTranslate(lang);
  }, [doTranslate]);

  const handleLevelChange = useCallback((level) => {
    setSimplifyLevel(level);
    localStorage.setItem(LEVEL_STORAGE_KEY, level);
    doSimplify(level);
  }, [doSimplify]);

  const handleCopyResult = useCallback(async () => {
    const text = aiResult?.translatedText || aiResult?.simplifiedText || '';
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback
    }
  }, [aiResult]);

  const handleSaveResultToNotes = useCallback(() => {
    if (!onAddToNotes || !aiResult) return;
    const original = `> ${selectedText.replace(/\n/g, '\n> ')}`;
    let formatted;
    if (aiMode === 'translate') {
      formatted = `${original}\n\n**Translation (${targetLanguage}):**\n${aiResult.translatedText}`;
    } else {
      formatted = `${original}\n\n**Simplified (${simplifyLevel}):**\n${aiResult.simplifiedText}`;
    }
    onAddToNotes(formatted);
    setVisible(false);
    resetAiPanel();
    window.getSelection()?.removeAllRanges();
  }, [aiResult, aiMode, selectedText, targetLanguage, simplifyLevel, onAddToNotes, resetAiPanel]);

  if (!visible) return null;

  const isExpanded = aiMode !== null;

  return createPortal(
    <div
      ref={popupRef}
      className={`text-selection-popup ${isExpanded ? 'text-selection-expanded' : ''}`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Toolbar row */}
      <div className="text-selection-toolbar">
        <button className="text-selection-btn" onClick={handleCopy} title="Copy">
          <Copy size={16} />
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>

        <div className="text-selection-divider" />

        <button className="text-selection-btn" onClick={handleAddToNotes} title="Add to Notes">
          <StickyNote size={16} />
          <span>Note</span>
        </button>

        <div className="text-selection-divider" />

        <button className="text-selection-btn" onClick={handleReadAloud} title="Read Aloud">
          <Volume2 size={16} />
          <span>Read</span>
        </button>

        <div className="text-selection-divider" />

        <button
          className={`text-selection-btn ${aiMode === 'translate' ? 'text-selection-btn-active' : ''}`}
          onClick={handleTranslateClick}
          title="Translate"
        >
          <Languages size={16} />
          <span>Translate</span>
        </button>

        <div className="text-selection-divider" />

        <button
          className={`text-selection-btn ${aiMode === 'simplify' ? 'text-selection-btn-active' : ''}`}
          onClick={handleSimplifyClick}
          title="Simplify"
        >
          <Sparkles size={16} />
          <span>Simplify</span>
        </button>
      </div>

      {/* Expanded AI panel */}
      {isExpanded && (
        <div className="text-selection-ai-panel">
          {/* Controls row */}
          <div className="text-selection-ai-controls">
            {aiMode === 'translate' && (
              <select
                className="text-selection-lang-picker"
                value={targetLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                {TARGET_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            )}
            {aiMode === 'simplify' && (
              <div className="text-selection-level-toggle">
                {SIMPLIFY_LEVELS.map(({ value, label }) => (
                  <button
                    key={value}
                    className={`text-selection-level-btn ${simplifyLevel === value ? 'active' : ''}`}
                    onClick={() => handleLevelChange(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            <button className="text-selection-close-btn" onClick={resetAiPanel} title="Close">
              <X size={14} />
            </button>
          </div>

          {/* Result area */}
          <div className="text-selection-result-area">
            {aiLoading && (
              <div className="text-selection-loading">
                <Loader2 size={18} className="text-selection-spinner" />
                <span>{aiMode === 'translate' ? 'Translating…' : 'Simplifying…'}</span>
              </div>
            )}
            {aiError && (
              <div className="text-selection-error">{aiError}</div>
            )}
            {!aiLoading && !aiError && aiResult && (
              <>
                <div className="text-selection-result-text">
                  {aiResult.translatedText || aiResult.simplifiedText}
                </div>
                {aiResult.keyTerms?.length > 0 && (
                  <div className="text-selection-key-terms">
                    {aiResult.keyTerms.map((t, i) => (
                      <span key={i} className="text-selection-term">
                        <strong>{t.original}</strong> → {t.simplified}
                      </span>
                    ))}
                  </div>
                )}
                {aiResult.sourceLanguage && aiMode === 'translate' && (
                  <div className="text-selection-meta">
                    Detected: {aiResult.sourceLanguage}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions row */}
          {!aiLoading && aiResult && !aiError && (
            <div className="text-selection-ai-actions">
              <button className="text-selection-ai-action-btn" onClick={handleCopyResult}>
                <Copy size={14} />
                Copy
              </button>
              <button className="text-selection-ai-action-btn primary" onClick={handleSaveResultToNotes}>
                <StickyNote size={14} />
                Save to Notes
              </button>
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}
