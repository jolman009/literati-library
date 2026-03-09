// MentorPreviewCard.jsx - Dashboard preview for Literary Mentor AI
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles, MessageCircle, Award, ArrowRight, BarChart3, Stars } from 'lucide-react';
import Icon from './ui/Icon';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import LiteraryMentor from '../services/LiteraryMentor';
import API from '../config/api';
import './MentorPreviewCard.css';

const MentorPreviewCard = () => {
  const navigate = useNavigate();
  const { actualTheme } = useMaterial3Theme();
  const [insight, setInsight] = useState(null);
  const [currentBook, setCurrentBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializePreview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializePreview = async () => {
    try {
      // Load current reading book
      const booksResponse = await API.get('/books', { params: { limit: 200, offset: 0 } });
      const { items: books = [] } = booksResponse.data || {};

      const readingBook = books.find(b => b.is_reading);
      setCurrentBook(readingBook);

      // Get AI-powered smart insights
      if (readingBook) {
        try {
          const smartInsights = await LiteraryMentor.generateSmartInsights(null, readingBook);

          if (smartInsights && smartInsights.length > 0) {
            const aiInsight = smartInsights.find(i => i.type === 'ai-summary' || i.type === 'theme');
            setInsight(aiInsight || smartInsights[0]);
          } else {
            setInsight(generateFallbackInsight());
          }
        } catch (error) {
          console.warn('Using fallback insight:', error);
          setInsight(generateFallbackInsight());
        }
      } else {
        setInsight({
          type: 'start',
          iconName: 'books',
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

  const generateFallbackInsight = () => {
    const tips = [
      { iconName: 'book', message: 'Reading regularly improves comprehension by up to 50%!' },
      { iconName: 'rocket', message: 'Set a daily reading goal to build momentum!' },
      { iconName: 'star', message: 'Try taking notes while reading to boost retention!' },
      { iconName: 'fire', message: 'Keep your reading streak alive - consistency is key!' },
      { iconName: 'tips', message: 'Reflect on what you read to deepen understanding!' },
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

  const handleQuickAction = () => {
    navigate('/mentor');
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
          <span className="insight-icon">{insight?.iconName ? <Icon name={insight.iconName} size={16} /> : <Icon name="tips" size={16} />}</span>
          <span className="insight-label">
            {insight?.type === 'welcome' ? 'Welcome' :
             insight?.type === 'start' ? 'Get Started' :
             "Today's Insight"}
          </span>
        </div>

        <p className="insight-message">
          {insight?.message || 'Your personalized reading insights will appear here!'}
        </p>

        {currentBook && (
          <div className="current-book-info">
            <span className="book-icon"><Icon name="book" size={16} /></span>
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
              onClick={handleQuickAction}
            >
              {insight.action}
            </button>
          ) : currentBook ? (
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
