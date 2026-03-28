// src/components/SummaryPanel.jsx
// AI-powered content summary panel (renders inside NotesSidebar or BottomSheetNotes)
import { useState, useEffect, useCallback } from 'react';
import { Sparkles, BookOpen, Save, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchSummary } from '../api/summaryApi';
import { useGamification } from '../contexts/GamificationContext';
import '../styles/summary-panel.css';

export default function SummaryPanel({
  book,
  currentPage,
  currentLocator,
  onSaveAsNote,
  extractText,
}) {
  const { trackAction } = useGamification();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('brief'); // 'brief' | 'detailed'
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [expandedSections, setExpandedSections] = useState({
    keyPoints: true,
    themes: false,
    questions: false,
  });

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleGenerate = useCallback(async (skipCache = false) => {
    if (!extractText) return;

    setLoading(true);
    setError(null);

    try {
      const text = await extractText();
      if (!text || text.trim().length < 50) {
        setError('Not enough text on this page to generate a summary. Try a page with more content.');
        setLoading(false);
        return;
      }

      const pageRange = currentPage ? String(currentPage) : undefined;
      const chapterTitle = currentLocator?.chapter || undefined;

      const result = await fetchSummary({
        text,
        bookId: book?.id,
        bookTitle: book?.title,
        chapterTitle,
        pageRange,
        mode,
        skipCache,
      });

      setSummary(result);

      // Track gamification (only for fresh generations, not cached)
      if (!result.cached) {
        trackAction('ai_summary_generated', {
          bookId: book?.id,
          mode,
          page: currentPage,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Summary generation failed:', err);
      if (err?.response?.status === 403) {
        setError('AI summaries require a premium subscription.');
      } else if (!navigator.onLine) {
        setError('You are offline. Connect to the internet to generate summaries.');
      } else {
        setError('Failed to generate summary. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [extractText, book, currentPage, currentLocator, mode]);

  const handleSaveAsNote = useCallback(() => {
    if (!summary || !onSaveAsNote) return;

    let content = `## AI Summary\n\n${summary.summary}\n`;

    if (summary.keyPoints?.length > 0) {
      content += `\n### Key Points\n${summary.keyPoints.map(p => `- ${p}`).join('\n')}\n`;
    }
    if (summary.themes?.length > 0) {
      content += `\n### Themes\n${summary.themes.map(t => `- ${t}`).join('\n')}\n`;
    }
    if (summary.questions?.length > 0) {
      content += `\n### Discussion Questions\n${summary.questions.map(q => `- ${q}`).join('\n')}\n`;
    }

    const tags = ['ai-summary'];
    if (currentPage) tags.push(`page:${currentPage}`);

    onSaveAsNote(content, tags);

    trackAction('summary_saved_as_note', {
      bookId: book?.id,
      page: currentPage,
      timestamp: new Date().toISOString(),
    });
  }, [summary, onSaveAsNote, currentPage, trackAction, book?.id]);

  return (
    <div className="summary-panel">
      {/* Controls */}
      <div className="summary-controls">
        <div className="summary-mode-toggle">
          <button
            className={`summary-mode-btn ${mode === 'brief' ? 'active' : ''}`}
            onClick={() => setMode('brief')}
          >
            Brief
          </button>
          <button
            className={`summary-mode-btn ${mode === 'detailed' ? 'active' : ''}`}
            onClick={() => setMode('detailed')}
          >
            Detailed
          </button>
        </div>

        <button
          className="summary-generate-btn"
          onClick={() => handleGenerate(false)}
          disabled={loading || !extractText || !isOnline}
          title={!isOnline ? 'Requires internet connection' : undefined}
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="summary-spin" />
              Generating...
            </>
          ) : !isOnline ? (
            <>
              <Sparkles size={16} />
              Offline
            </>
          ) : (
            <>
              <Sparkles size={16} />
              {summary ? 'Regenerate' : 'Generate Summary'}
            </>
          )}
        </button>
      </div>

      {/* Page context */}
      <div className="summary-context">
        <BookOpen size={14} />
        <span>
          {currentPage ? `Page ${currentPage}` : currentLocator?.chapter || 'Current view'}
          {book?.title ? ` — ${book.title}` : ''}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="summary-error">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !summary && (
        <div className="summary-skeleton">
          <div className="skeleton-line skeleton-long" />
          <div className="skeleton-line skeleton-long" />
          <div className="skeleton-line skeleton-medium" />
          <div className="skeleton-line skeleton-short" />
          <div className="skeleton-line skeleton-long" />
          <div className="skeleton-line skeleton-medium" />
        </div>
      )}

      {/* Summary content */}
      {summary && (
        <div className="summary-content">
          {summary.cached && (
            <div className="summary-cached-badge">
              Cached
              <button
                className="summary-refresh-btn"
                onClick={() => handleGenerate(true)}
                title="Generate fresh summary"
              >
                <RefreshCw size={12} />
              </button>
            </div>
          )}

          {/* Main summary */}
          <div className="summary-section">
            <p className="summary-text">{summary.summary}</p>
          </div>

          {/* Key Points */}
          {summary.keyPoints?.length > 0 && (
            <div className="summary-section">
              <button className="summary-section-header" onClick={() => toggleSection('keyPoints')}>
                <span>Key Points ({summary.keyPoints.length})</span>
                {expandedSections.keyPoints ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {expandedSections.keyPoints && (
                <ul className="summary-list">
                  {summary.keyPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Themes */}
          {summary.themes?.length > 0 && (
            <div className="summary-section">
              <button className="summary-section-header" onClick={() => toggleSection('themes')}>
                <span>Themes ({summary.themes.length})</span>
                {expandedSections.themes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {expandedSections.themes && (
                <div className="summary-tags">
                  {summary.themes.map((theme, i) => (
                    <span key={i} className="summary-tag">{theme}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Discussion Questions */}
          {summary.questions?.length > 0 && (
            <div className="summary-section">
              <button className="summary-section-header" onClick={() => toggleSection('questions')}>
                <span>Discussion Questions ({summary.questions.length})</span>
                {expandedSections.questions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {expandedSections.questions && (
                <ul className="summary-list summary-questions">
                  {summary.questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Save as Note */}
          {onSaveAsNote && (
            <button className="summary-save-btn" onClick={handleSaveAsNote}>
              <Save size={14} />
              Save as Note
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {!summary && !loading && !error && (
        <div className="summary-empty">
          <Sparkles size={24} />
          {isOnline ? (
            <>
              <p>Generate an AI-powered summary of the current page or chapter.</p>
              <p className="summary-empty-hint">
                Summaries include key points, themes, and discussion questions.
              </p>
            </>
          ) : (
            <>
              <p>You are currently offline.</p>
              <p className="summary-empty-hint">
                Connect to the internet to generate AI summaries. Previously cached summaries will appear automatically.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
