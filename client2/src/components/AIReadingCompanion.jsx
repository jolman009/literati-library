// src/components/AIReadingCompanion.jsx - Intelligent Reading Companion UI
import React, { useState, useCallback, useEffect } from 'react';
import { MD3Card, MD3Button, MD3Chip, useSnackbar } from './Material3';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useEntitlements } from '../contexts/EntitlementsContext';
import ReadingAssistant from '../services/ReadingAssistant';
import {
  Brain,
  Lightbulb,
  BookOpen,
  MessageCircle,
  TrendingUp,
  Eye,
  Target,
  Sparkles
} from 'lucide-react';
import './AIReadingCompanion.css';

const AIReadingCompanion = ({ 
  bookId, 
  bookTitle, 
  bookAuthor, 
  bookGenre,
  readingSessionId,
  onNoteCreate,
  className = ''
}) => {
  const { actualTheme: _actualTheme } = useMaterial3Theme();
  const { showSnackbar } = useSnackbar();
  const { isPremium, openPremiumModal } = useEntitlements();
  
  const [selectedText, setSelectedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [contextualHelp, setContextualHelp] = useState(null);
  const [showInsights, setShowInsights] = useState(false);
  const [readingInsights, setReadingInsights] = useState(null);

  // Handle text selection from reading content
  const handleTextSelection = useCallback(async () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text.length < 10) {
      return; // Too short for meaningful analysis
    }

    if (!isPremium) {
      showSnackbar({ message: 'AI analysis is a Premium feature', variant: 'info' });
      openPremiumModal();
      return;
    }

    setSelectedText(text);
    setIsAnalyzing(true);

    try {
      const context = {
        bookId,
        bookTitle,
        bookAuthor,
        bookGenre,
        readingSessionId
      };

      // Parallel AI analysis
      const [analysisResult, suggestionsResult, helpResult] = await Promise.all([
        ReadingAssistant.analyzeText(text, context),
        ReadingAssistant.suggestAnnotations({
          text,
          bookContext: context,
          userStyle: 'analytical'
        }),
        ReadingAssistant.getContextualHelp(text, context)
      ]);

      setAnalysis(analysisResult);
      setSuggestions(suggestionsResult);
      setContextualHelp(helpResult);

    } catch (error) {
      console.error('AI analysis failed:', error);
      showSnackbar({
        message: 'AI analysis temporarily unavailable',
        variant: 'warning'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [bookId, bookTitle, bookAuthor, bookGenre, readingSessionId, showSnackbar]);

  // Generate reading insights
  const generateReadingInsights = useCallback(async () => {
    if (!isPremium) {
      showSnackbar({ message: 'Reading insights are a Premium feature', variant: 'info' });
      openPremiumModal();
      return;
    }
    setShowInsights(true);
    
    try {
      const sessionData = {
        bookId,
        startTime: new Date().toISOString(),
        // Add other session data as available
      };
      
      const insights = await ReadingAssistant.generateReadingInsights(bookId, sessionData);
      setReadingInsights(insights);

    } catch (error) {
      console.error('Reading insights failed:', error);
      showSnackbar({
        message: 'Reading insights temporarily unavailable',
        variant: 'warning'
      });
    }
  }, [bookId, showSnackbar]);

  // Create note from AI suggestion
  const createNoteFromSuggestion = useCallback(async (suggestion) => {
    if (onNoteCreate) {
      const noteData = {
        title: `AI Insight: ${suggestion.type}`,
        content: suggestion.content,
        book_id: bookId,
        tags: ['ai-generated', suggestion.type],
        source_text: selectedText
      };
      
      await onNoteCreate(noteData);
      showSnackbar({
        message: 'Note created from AI suggestion',
        variant: 'success'
      });
    }
  }, [bookId, selectedText, onNoteCreate, showSnackbar]);

  // Setup text selection listener
  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, [handleTextSelection]);

  if (!selectedText && !showInsights) {
    return (
      <MD3Card className={`ai-reading-companion ${className}`} variant="outlined">
        <div className="ai-companion-prompt">
          <Brain className="ai-icon" />
          <h3>AI Reading Companion</h3>
          <p>Select text to get AI-powered insights, explanations, and smart annotations</p>
          {!isPremium && (
            <div className="md-body-small text-on-surface-variant" style={{ marginBottom: 8 }}>
              Premium required for AI features
            </div>
          )}
          <MD3Button
            variant="filled"
            icon={<TrendingUp className="button-icon" />}
            onClick={generateReadingInsights}
          >
            Generate Reading Insights
          </MD3Button>
        </div>
      </MD3Card>
    );
  }

  return (
    <div className={`ai-reading-companion ${className}`}>
      {/* Selected Text Analysis */}
      {selectedText && (
        <MD3Card className="ai-analysis-card" variant="elevated">
          <div className="ai-card-header">
            <Sparkles className="ai-icon" />
            <h3>AI Analysis</h3>
            {isAnalyzing && <div className="ai-spinner" />}
          </div>
          
          <div className="selected-text">
            <blockquote>"{selectedText}"</blockquote>
          </div>

          {analysis && (
            <div className="analysis-results">
              {/* Complexity & Difficulty */}
              <div className="analysis-section">
                <h4>
                  <Eye className="section-icon" />
                  Reading Analysis
                </h4>
                <div className="analysis-chips">
                  <MD3Chip
                    label={`Complexity: ${analysis.complexity}`}
                    variant="filled"
                    size="small"
                  />
                  <MD3Chip
                    label={`Difficulty: ${Math.round(analysis.difficulty * 100)}%`}
                    variant="outlined"
                    size="small"
                  />
                  <MD3Chip
                    label={`Reading Time: ${analysis.readingTime}min`}
                    variant="assist"
                    size="small"
                  />
                </div>
              </div>

              {/* Key Concepts */}
              {analysis.concepts && analysis.concepts.length > 0 && (
                <div className="analysis-section">
                  <h4>
                    <Target className="section-icon" />
                    Key Concepts
                  </h4>
                  <div className="concept-chips">
                    {analysis.concepts.map((concept, index) => (
                      <MD3Chip
                        key={index}
                        label={concept}
                        variant="assist"
                        size="small"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Contextual Help */}
              {contextualHelp && (
                <div className="analysis-section">
                  <h4>
                    <MessageCircle className="section-icon" />
                    Understanding Help
                  </h4>
                  {contextualHelp.simplification && (
                    <div className="help-item">
                      <strong>Simplified:</strong>
                      <p>{contextualHelp.simplification}</p>
                    </div>
                  )}
                  {contextualHelp.definitions && contextualHelp.definitions.length > 0 && (
                    <div className="help-item">
                      <strong>Key Terms:</strong>
                      <ul>
                        {contextualHelp.definitions.map((def, index) => (
                          <li key={index}>
                            <strong>{def.term}:</strong> {def.definition}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI Suggestions */}
          {suggestions && suggestions.suggestions && suggestions.suggestions.length > 0 && (
            <div className="ai-suggestions">
              <h4>
                <Lightbulb className="section-icon" />
                Smart Annotations
              </h4>
              <div className="suggestions-list">
                {suggestions.suggestions.map((suggestion, index) => (
                  <div key={index} className="suggestion-item">
                    <div className="suggestion-content">
                      <MD3Chip
                        label={suggestion.type}
                        variant="outlined"
                        size="small"
                        className="suggestion-type"
                      />
                      <p>{suggestion.content}</p>
                    </div>
                    <MD3Button
                      variant="text"
                      size="small"
                      onClick={() => createNoteFromSuggestion(suggestion)}
                    >
                      Create Note
                    </MD3Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Book Connections */}
          {analysis && analysis.connections && analysis.connections.length > 0 && (
            <div className="analysis-section">
              <h4>
                <BookOpen className="section-icon" />
                Library Connections
              </h4>
              <div className="connections-list">
                {analysis.connections.map((connection, index) => (
                  <div key={index} className="connection-item">
                    <strong>{connection.book}</strong>
                    <p>{connection.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </MD3Card>
      )}

      {/* Reading Insights Panel */}
      {showInsights && readingInsights && (
        <MD3Card className="ai-insights-card" variant="filled">
          <div className="ai-card-header">
            <TrendingUp className="ai-icon" />
            <h3>Reading Insights</h3>
          </div>
          
          <div className="insights-grid">
            <div className="insight-item">
              <h4>Comprehension Score</h4>
              <div className="score-circle">
                {Math.round(readingInsights.comprehensionScore * 100)}%
              </div>
            </div>
            
            <div className="insight-item">
              <h4>Reading Speed</h4>
              <p>{readingInsights.readingSpeed} WPM</p>
            </div>
            
            <div className="insight-item">
              <h4>Engagement Level</h4>
              <MD3Chip
                label={readingInsights.engagementLevel}
                variant="filled"
              />
            </div>
            
            {readingInsights.focusAreas && readingInsights.focusAreas.length > 0 && (
              <div className="insight-item">
                <h4>Focus Areas</h4>
                <ul>
                  {readingInsights.focusAreas.map((area, index) => (
                    <li key={index}>{area}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {readingInsights.nextSteps && readingInsights.nextSteps.length > 0 && (
            <div className="next-steps">
              <h4>Recommended Next Steps</h4>
              <ul>
                {readingInsights.nextSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          )}
        </MD3Card>
      )}
    </div>
  );
};

export default AIReadingCompanion;
