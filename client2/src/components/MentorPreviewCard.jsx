// MentorPreviewCard.jsx - Dashboard preview for Literary Mentor AI
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles, MessageCircle, Award, ArrowRight, BarChart3, Stars } from 'lucide-react';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import LiteraryMentor from '../services/LiteraryMentor';
import AIKeyManager from '../services/AIKeyManager';
import API from '../config/api';
import './MentorPreviewCard.css';

const MentorPreviewCard = () => {
  const navigate = useNavigate();
  const { actualTheme } = useMaterial3Theme();
  const [insight, setInsight] = useState(null);
  const [currentBook, setCurrentBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasApiKeys, setHasApiKeys] = useState(false);

  useEffect(() => {
    initializePreview();
  }, []);

  const initializePreview = async () => {
    try {
      // Check for API keys
      const hasKeys = AIKeyManager.hasAnyProvider();
      setHasApiKeys(hasKeys);

      // Load current reading book
      const booksResponse = await API.get('/books');
      const books = Array.isArray(booksResponse.data)
        ? booksResponse.data
        : booksResponse.data.books || [];

      const readingBook = books.find(b => b.is_reading);
      setCurrentBook(readingBook);

      // Get today's insight
      if (hasKeys && readingBook) {
        try {
          const mentorData = await LiteraryMentor.initializeMentor(readingBook.id);

          // Extract the most relevant insight
          if (mentorData.currentInsights && mentorData.currentInsights.length > 0) {
            setInsight(mentorData.currentInsights[0]);
          } else {
            setInsight({
              type: 'welcome',
              icon: '👋',
              message: 'Start reading to unlock personalized insights!',
            });
          }
        } catch (error) {
          console.log('Using fallback insight');
          setInsight(generateFallbackInsight(readingBook));
        }
      } else if (!hasKeys) {
        setInsight({
          type: 'setup',
          icon: '🔑',
          message: 'Configure AI keys to unlock personalized mentoring features.',
          action: 'Configure Keys'
        });
      } else {
        setInsight({
          type: 'start',
          icon: '📚',
          message: 'Start reading a book to get personalized insights!',
        });
      }
    } catch (error) {
      console.error('Failed to load mentor preview:', error);
      setInsight({
        type: 'error',
        icon: '💡',
        message: 'Your AI reading companion is ready to help you learn!',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackInsight = (book) => {
    const tips = [
      { icon: '📖', message: 'Reading regularly improves comprehension by up to 50%!' },
      { icon: '🎯', message: 'Set a daily reading goal to build momentum!' },
      { icon: '✨', message: 'Try taking notes while reading to boost retention!' },
      { icon: '🔥', message: 'Keep your reading streak alive - consistency is key!' },
      { icon: '💡', message: 'Reflect on what you read to deepen understanding!' },
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    return {
      type: 'tip',
      ...randomTip,
    };
  };

  const handleViewFullMentor = () => {
    navigate('/mentor');
  };

  const handleQuickAction = (action) => {
    if (action === 'Configure Keys') {
      navigate('/mentor'); // Navigate to mentor page which has key config
    } else {
      navigate('/mentor');
    }
  };

  if (loading) {
    return (
      <div className={`mentor-preview-card ${actualTheme === 'dark' ? 'dark' : ''}`}>
        <div className="mentor-preview-loading">
          <Brain className="loading-icon" size={20} />
          <span>Loading AI insights...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`mentor-preview-card ${actualTheme === 'dark' ? 'dark' : ''}`}>
      <div className="mentor-preview-header">
        <div className="mentor-preview-title">
          <Brain className="mentor-icon" size={20} />
          <span>Your AI Reading Companion</span>
        </div>
        <Sparkles className="sparkle-icon" size={16} />
      </div>

      <div className="mentor-preview-content">
        <div className="insight-badge">
          <span className="insight-icon">{insight?.icon || '💡'}</span>
          <span className="insight-label">
            {insight?.type === 'setup' ? 'Setup Required' :
             insight?.type === 'welcome' ? 'Welcome' :
             insight?.type === 'start' ? 'Get Started' :
             "Today's Insight"}
          </span>
        </div>

        <p className="insight-message">
          {insight?.message || 'Your personalized reading insights will appear here!'}
        </p>

        {currentBook && (
          <div className="current-book-info">
            <span className="book-icon">📖</span>
            <span className="book-title">
              Currently reading: <strong>{currentBook.title}</strong>
            </span>
            {currentBook.progress !== undefined && (
              <span className="book-progress">{currentBook.progress}% complete</span>
            )}
          </div>
        )}

        <div className="mentor-preview-actions">
          {/* Row 1: Primary Actions (conditional) */}
          {insight?.action ? (
            <button
              className="action-button primary"
              onClick={() => handleQuickAction(insight.action)}
            >
              {insight.action}
            </button>
          ) : hasApiKeys && currentBook ? (
            <>
              <button
                className="action-button secondary"
                onClick={handleViewFullMentor}
              >
                <MessageCircle size={16} />
                Start Discussion
              </button>
              <button
                className="action-button secondary"
                onClick={handleViewFullMentor}
              >
                <Award size={16} />
                Take Quiz
              </button>
            </>
          ) : null}

          {/* Row 2: Quick Access Features (always visible) */}
          <div className="quick-access-row">
            <button
              className="action-button quick-access"
              onClick={() => navigate('/dashboard#stats')}
              title="View your reading statistics and progress"
            >
              <BarChart3 size={16} />
              View Stats
            </button>
            <button
              className="action-button quick-access"
              onClick={handleViewFullMentor}
              title="Get AI-powered book recommendations"
            >
              <Stars size={16} />
              Get Recommendations
            </button>
          </div>

          {/* Full Mentor Link */}
          <button
            className="action-button view-full"
            onClick={handleViewFullMentor}
          >
            <span>View Full Mentor AI</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorPreviewCard;
