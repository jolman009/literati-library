// LiteraryMentorUI.jsx - Interactive Literary Mentor Interface
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  BookOpen, 
  MessageCircle, 
  Trophy, 
  Brain, 
  Target,
  Sparkles,
  ChevronRight,
  Clock,
  TrendingUp,
  Users,
  Lightbulb,
  Award,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import LiteraryMentor from '../services/LiteraryMentor';
import AIKeyManager from '../services/AIKeyManager';
import APIKeyConfiguration from './APIKeyConfiguration';
import API from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import './LiteraryMentorUI.css';

const LiteraryMentorUI = ({ currentBook, onQuizStart, onDiscussionStart }) => {
  const { user } = useAuth();
  const { actualTheme } = useMaterial3Theme();
  
  // State management
  const [mentorData, setMentorData] = useState(null);
  const [activeTab, setActiveTab] = useState('insights');
  const [isLoading, setIsLoading] = useState(true);
  const [discussionMode, setDiscussionMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userResponse, setUserResponse] = useState('');
  const [discussionHistory, setDiscussionHistory] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [hasApiKeys, setHasApiKeys] = useState(false);
  const [userBooks, setUserBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [smartInsights, setSmartInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  // Ref to maintain focus on textarea
  const textareaRef = useRef(null);

  // Initialize mentor on component mount
  useEffect(() => {
    checkApiKeys();
    initializeMentor();
    loadUserBooks();
  }, [user]);

  // Load smart insights when books or API keys change
  useEffect(() => {
    if (userBooks.length > 0) {
      loadSmartInsights();
    }
  }, [userBooks, hasApiKeys]);

  const checkApiKeys = () => {
    // Direct check of localStorage for API keys
    const anthropicKey = localStorage.getItem('ai_key_anthropic');
    const openaiKey = localStorage.getItem('ai_key_openai');
    const geminiKey = localStorage.getItem('ai_key_gemini');
    const perplexityKey = localStorage.getItem('ai_key_perplexity');

    const hasKeys = !!(anthropicKey || openaiKey || geminiKey || perplexityKey);
    setHasApiKeys(hasKeys);

    console.warn('API Keys check:', {
      hasKeys,
      anthropic: !!anthropicKey,
      openai: !!openaiKey,
      gemini: !!geminiKey,
      perplexity: !!perplexityKey
    });
  };

  const loadUserBooks = async () => {
    try {
      // Check if user is authenticated
      if (!user) {
        console.warn('No user logged in, cannot load books');
        setUserBooks([]);
        return;
      }

      console.warn('Loading books from API for Literary Mentor...');
      
      // Fetch books from the API (same as library page) with pagination params
      const response = await API.get('/books', { params: { limit: 200, offset: 0 } });
      
      let booksData = [];
      const { items = [] } = response.data || {};
      booksData = items;
      
      console.warn(`Loaded ${booksData.length} books from API`);
      setUserBooks(booksData);
      
      // Set first book as selected if none selected
      if (!selectedBookId && booksData.length > 0) {
        setSelectedBookId(booksData[0].id);
      }
    } catch (error) {
      console.error('Failed to load books from API:', error);
      
      // Fallback: Try to get from IndexedDB cache
      try {
        const request = indexedDB.open('shelfquest-books', 2);
        
        request.onsuccess = function(event) {
          const db = event.target.result;
          
          if (db.objectStoreNames.contains('books')) {
            const transaction = db.transaction(['books'], 'readonly');
            const objectStore = transaction.objectStore('books');
            const getAllRequest = objectStore.getAll();
            
            getAllRequest.onsuccess = function(event) {
              const books = event.target.result;
              if (books && books.length > 0) {
                console.warn('Loaded cached books from IndexedDB:', books.length);
                setUserBooks(books);
                if (!selectedBookId && books.length > 0) {
                  setSelectedBookId(books[0].id);
                }
              } else {
                setUserBooks([]);
              }
            };
          }
        };
      } catch (dbError) {
        console.error('Failed to load from cache:', dbError);
        setUserBooks([]);
      }
    }
  };

  const initializeMentor = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const data = await LiteraryMentor.initializeMentor(user.id);
      setMentorData(data);

      // Set initial discussion question if in discussion mode
      if (currentBook && discussionMode) {
        const discussion = await LiteraryMentor.startBookClubDiscussion(currentBook.id);
        setCurrentQuestion(discussion.prompts.opening);
      }
    } catch (error) {
      console.error('Failed to initialize mentor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load enhanced AI insights for the current reading book
  const loadSmartInsights = async () => {
    if (!hasApiKeys) {
      // No API keys - show fallback insights
      setSmartInsights([
        {
          type: 'setup',
          icon: '🔑',
          message: 'Configure AI keys to unlock personalized content analysis and deep insights about your reading!',
        }
      ]);
      return;
    }

    setInsightsLoading(true);
    try {
      // Find the current reading book
      const readingBook = userBooks.find(b => b.is_reading);

      if (!readingBook) {
        setSmartInsights([
          {
            type: 'start',
            icon: '📚',
            message: 'Mark a book as "currently reading" to get AI-powered insights about themes, patterns, and your reading progress!',
          }
        ]);
        return;
      }

      // Use the enhanced AI insights
      const insights = await LiteraryMentor.generateSmartInsights(user.id, readingBook);
      setSmartInsights(insights || []);
    } catch (error) {
      console.error('Failed to load smart insights:', error);
      setSmartInsights([
        {
          type: 'error',
          icon: '💡',
          message: 'Your AI reading companion is ready to analyze your reading journey!',
        }
      ]);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleActionClick = (action) => {
    switch(action.toLowerCase()) {
      case 'start a reading session':
      case 'start a book discussion':
        setActiveTab('discussion');
        break;
      case 'upload your first book':
      case 'upload a book':
      case 'add your first book':
      case 'add more books to your library':
        window.location.href = '/upload';
        break;
      case 'create your first note':
      case 'create your first note on a book':
        window.location.href = '/notes';
        break;
      case 'review and organize your notes':
        window.location.href = '/notes';
        break;
      case 'set a reading goal':
      case 'set a weekly reading goal':
      case 'set a monthly reading challenge':
        setActiveTab('insights');
        break;
      case 'review your reading progress':
        window.location.href = '/stats';
        break;
      case 'take a comprehension quiz':
        setActiveTab('quiz');
        break;
      case 'configure api keys':
        setShowApiConfig(true);
        break;
      case 'browse book recommendations':
      case 'explore recommendations':
      case 'get ai reading recommendations':
        // Could integrate with a recommendations page or show in insights
        setActiveTab('insights');
        break;
      default:
        console.warn('Action clicked:', action);
    }
  };

  // ===== INSIGHTS TAB =====

  const InsightsPanel = () => (
    <div className="mentor-insights-panel">
      <div className="insights-header">
        <Sparkles className="insights-icon" />
        <h3>AI-Powered Reading Insights</h3>
        <button
          onClick={loadSmartInsights}
          className="refresh-insights-button"
          disabled={insightsLoading}
          style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            fontSize: '13px',
            borderRadius: '8px',
            border: '1px solid var(--md-sys-color-outline)',
            background: 'var(--md-sys-color-surface-container)',
            color: 'var(--md-sys-color-on-surface)',
            cursor: insightsLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {insightsLoading ? '⟳ Loading...' : '↻ Refresh'}
        </button>
      </div>

      {insightsLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)' }}>
          <Brain className="loading-icon" size={32} style={{ animation: 'spin 2s linear infinite' }} />
          <p style={{ marginTop: '12px' }}>Analyzing your reading patterns...</p>
        </div>
      ) : smartInsights.length > 0 ? (
        smartInsights.map((insight, index) => (
          <div key={index} className={`insight-card insight-${insight.type}`}>
            <span className="insight-icon" style={{ fontSize: '2rem' }}>{insight.icon}</span>
            <div className="insight-content">
              <p className="insight-message">{insight.message}</p>
              {insight.metadata && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '0.85rem',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  {insight.metadata.progress !== undefined && (
                    <span>📊 {insight.metadata.progress}% complete</span>
                  )}
                  {insight.metadata.highlights !== undefined && (
                    <span>✍️ {insight.metadata.highlights} highlights</span>
                  )}
                </div>
              )}
              {insight.action && (
                <button
                  className="insight-action"
                  onClick={() => handleActionClick(insight.action)}
                >
                  {insight.action}
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)' }}>
          <BookOpen size={48} opacity={0.5} />
          <p style={{ marginTop: '12px' }}>No insights available yet. Start reading to unlock AI-powered analysis!</p>
        </div>
      )}
      
      <div className="reading-stats">
        <h4>Your Reading Profile</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <Clock size={20} />
            <div>
              <span className="stat-label">Optimal Time</span>
              <span className="stat-value">
                {mentorData?.userProfile?.habits?.preferredTime || 'Evening'}
              </span>
            </div>
          </div>
          
          <div className="stat-item">
            <TrendingUp size={20} />
            <div>
              <span className="stat-label">Consistency</span>
              <span className="stat-value">
                {Math.round((mentorData?.userProfile?.habits?.consistencyScore || 0.7) * 100)}%
              </span>
            </div>
          </div>
          
          <div className="stat-item">
            <Brain size={20} />
            <div>
              <span className="stat-label">Comprehension</span>
              <span className="stat-value">
                {mentorData?.userProfile?.comprehensionProfile?.level || 'Good'}
              </span>
            </div>
          </div>
          
          <div className="stat-item">
            <Award size={20} />
            <div>
              <span className="stat-label">Engagement</span>
              <span className="stat-value">
                {Math.round((mentorData?.userProfile?.engagementLevel || 0.8) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="suggested-actions">
        <h4>Recommended Next Steps</h4>
        {mentorData?.suggestedActions?.map((action, index) => (
          <button 
            key={index} 
            className="action-button"
            onClick={() => handleActionClick(action)}
          >
            <Target size={16} />
            {action}
          </button>
        ))}
      </div>
    </div>
  );

  // ===== DISCUSSION TAB =====
  
  // Memoized handlers to prevent re-renders
  const startDiscussion = useCallback(async (promptText) => {
    if (!selectedBookId) return;
    
    const selectedBook = userBooks.find(b => b.id === selectedBookId);
    if (!selectedBook) return;

    // Clear previous discussion
    setDiscussionHistory([]);
    setUserResponse('');
    
    // Set initial welcome message
    const welcomeMessage = `Welcome to our book club discussion of "${selectedBook.title}"! ${promptText ? `Let's explore: ${promptText}` : 'I\'m excited to discuss this book with you.'}`;
    
    setDiscussionHistory([{
      type: 'mentor',
      content: welcomeMessage,
      timestamp: new Date()
    }]);

    // Generate an AI-powered opening question if we have API keys
    if (hasApiKeys) {
      try {
        const LLMProvider = (await import('../services/LLMProvider')).default;
        
        const prompt = `You are a literary mentor starting a book club discussion about "${selectedBook.title}" by ${selectedBook.author || 'Unknown Author'}.

The reader wants to discuss: "${promptText}"

Generate an engaging, open-ended question to start the discussion. Make it thought-provoking and specific to this topic. Keep it to one clear question.`;

        const aiResponse = await LLMProvider.generateCompletion(prompt, {
          taskType: 'creative',
          maxTokens: 100,
          temperature: 0.8
        });

        setCurrentQuestion(aiResponse.text);
      } catch (error) {
        console.error('Failed to generate AI discussion starter:', error);
        // Fallback to the prompt text
        setCurrentQuestion(promptText || `What are your initial thoughts on "${selectedBook.title}"?`);
      }
    } else {
      // No AI available, use the prompt or a default question
      setCurrentQuestion(promptText || `What are your initial thoughts on "${selectedBook.title}"?`);
    }
  }, [selectedBookId, userBooks, hasApiKeys]);

  const handleSubmitResponse = useCallback(async () => {
      if (!userResponse.trim()) return;
      
      // Add to discussion history
      const newEntry = {
        type: 'user',
        content: userResponse,
        timestamp: new Date()
      };
      setDiscussionHistory([...discussionHistory, newEntry]);
      
      // Get mentor's response
      const mentorResponse = await generateMentorResponse(userResponse);
      setDiscussionHistory(prev => [...prev, {
        type: 'mentor',
        content: mentorResponse.message,
        timestamp: new Date()
      }]);
      
      // Set next question
      if (mentorResponse.nextQuestion) {
        setCurrentQuestion(mentorResponse.nextQuestion);
      }
      
      setUserResponse('');
  }, [userResponse, discussionHistory]);
    
  const generateMentorResponse = useCallback(async (response) => {
      // Get the selected book
      const selectedBook = userBooks.find(b => b.id === selectedBookId);
      if (!selectedBook) {
        return {
          message: "That's an interesting perspective! Tell me more about your thoughts.",
          nextQuestion: "What other aspects of the book would you like to discuss?"
        };
      }

      // Check if we have API keys configured
      if (!hasApiKeys) {
        // Fallback responses when no AI is available
        const fallbackResponses = [
          "That's a thoughtful observation. Can you elaborate on that?",
          "Interesting perspective! How does this connect to other parts of the book?",
          "I appreciate your insight. What led you to that conclusion?",
          "That's a great point. How do you think the author intended this to be interpreted?"
        ];
        return {
          message: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
          nextQuestion: "What else stood out to you in this book?"
        };
      }

      try {
        // Use the real AI to generate a response
        const LLMProvider = (await import('../services/LLMProvider')).default;
        
        const bookContext = {
          title: selectedBook.title,
          author: selectedBook.author,
          userResponse: response,
          discussionHistory: discussionHistory.slice(-5) // Last 5 exchanges for context
        };

        const prompt = `You are a literary mentor discussing "${selectedBook.title}" with a reader.

Reader's comment: "${response}"

Provide a thoughtful, engaging response that:
1. Acknowledges their perspective
2. Asks a follow-up question to deepen the discussion
3. Optionally connects to literary themes or techniques

Keep your response concise (2-3 sentences) and conversational.`;

        const aiResponse = await LLMProvider.generateCompletion(prompt, {
          taskType: 'analysis',
          maxTokens: 150,
          temperature: 0.8
        });

        // Generate a follow-up question
        const questionPrompt = `Based on this discussion about "${selectedBook.title}", generate one thoughtful follow-up question to continue the conversation. Make it open-ended and thought-provoking.`;
        
        const aiQuestion = await LLMProvider.generateCompletion(questionPrompt, {
          taskType: 'analysis',
          maxTokens: 50,
          temperature: 0.7
        });

        return {
          message: aiResponse.text,
          nextQuestion: aiQuestion.text
        };
      } catch (error) {
        console.error('AI response generation failed:', error);
        // Fallback to basic response
        return {
          message: "That's an interesting point. Let me think about that. What other themes did you notice in the book?",
          nextQuestion: "How did this book compare to others you've read?"
        };
      }
      
      return {
        message: analysis.suggestions[0] || 'Interesting perspective!',
        nextQuestion: socraticQuestions[0],
        feedback: analysis
      };
  }, [selectedBookId, userBooks, hasApiKeys, discussionHistory]);

  // Stable onChange handler that maintains focus
  const handleResponseChange = useCallback((e) => {
    const target = e.target;
    const cursorPosition = target.selectionStart;
    const newValue = target.value;
    
    setUserResponse(newValue);
    
    // Immediately restore focus and cursor position
    requestAnimationFrame(() => {
      if (textareaRef.current && document.activeElement !== textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  }, []);

  const DiscussionPanel = () => {
    
    return (
      <div className="mentor-discussion-panel">
        <div className="discussion-header">
          <MessageCircle className="discussion-icon" />
          <h3>Book Club Discussion</h3>
          {selectedBookId && (
            <div className="selected-book-info" style={{ marginTop: '8px' }}>
              <span className="current-book" style={{ 
                fontSize: '14px', 
                color: 'var(--md-sys-color-primary)' 
              }}>
                📖 {userBooks.find(b => b.id === selectedBookId)?.title || 'Selected Book'}
              </span>
              <button 
                onClick={() => {
                  setSelectedBookId(null);
                  setDiscussionHistory([]);
                  setCurrentQuestion(null);
                }}
                style={{
                  marginLeft: '10px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  background: 'transparent',
                  border: '1px solid var(--md-sys-color-outline)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: 'var(--md-sys-color-on-surface)'
                }}
              >
                Change Book
              </button>
            </div>
          )}
        </div>
        
        {!selectedBookId ? (
          <div className="no-book-selected">
            <BookOpen size={48} />
            <p>Select a book to start a discussion</p>
            <div className="book-selector" style={{ marginTop: '20px' }}>
              <select 
                onChange={(e) => {
                  setSelectedBookId(e.target.value);
                  setDiscussionHistory([]);
                  setCurrentQuestion(null);
                }}
                value={selectedBookId || ''}
                className="book-dropdown"
                style={{
                  padding: '10px 15px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '2px solid var(--md-sys-color-outline)',
                  background: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  cursor: 'pointer',
                  minWidth: '250px'
                }}
              >
                <option value="">Choose a book...</option>
                {userBooks.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title} {book.author ? `by ${book.author}` : ''}
                  </option>
                ))}
              </select>
              {userBooks.length === 0 && (
                <p style={{ marginTop: '10px', fontSize: '12px', opacity: 0.7 }}>
                  No books found. Add books to your library first.
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            {currentQuestion && (
              <div className="current-question">
                <HelpCircle className="question-icon" />
                <p className="question-text">{currentQuestion}</p>
              </div>
            )}
            
            <div className="discussion-history">
              {discussionHistory.map((entry, index) => (
                <div key={index} className={`discussion-entry ${entry.type}`}>
                  <div className="entry-avatar">
                    {entry.type === 'user' ? '👤' : '🎓'}
                  </div>
                  <div className="entry-content">
                    <p>{entry.content}</p>
                    <span className="entry-time">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="response-input">
              <textarea
                key="discussion-textarea"
                ref={textareaRef}
                value={userResponse}
                onChange={handleResponseChange}
                placeholder="Share your thoughts..."
                className="response-textarea"
                rows={3}
                autoFocus={false}
              />
              <button 
                onClick={handleSubmitResponse}
                className="submit-response"
                disabled={!userResponse.trim()}
              >
                Send Response
              </button>
            </div>
            
            <div className="discussion-prompts">
              <h4>Discussion Starters</h4>
              <div className="prompts-grid">
                <button 
                  className="prompt-button"
                  onClick={() => startDiscussion('What surprised you most about this book?')}
                >
                  What surprised you most?
                </button>
                <button 
                  className="prompt-button"
                  onClick={() => startDiscussion('How does this book relate to your life experiences?')}
                >
                  How does this relate to your life?
                </button>
                <button 
                  className="prompt-button"
                  onClick={() => startDiscussion('What would you change about the story or characters?')}
                >
                  What would you change?
                </button>
                <button 
                  className="prompt-button"
                  onClick={() => startDiscussion('Who would enjoy this book and why?')}
                >
                  Who would enjoy this book?
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ===== QUIZ TAB =====
  
  const QuizPanel = () => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizScore, setQuizScore] = useState(null);
    
    const startQuiz = async () => {
      if (!currentBook) return;
      
      const generatedQuiz = await LiteraryMentor.createPersonalizedQuiz(
        currentBook.id,
        [] // chapters - could be specified
      );
      setQuiz(generatedQuiz);
      setCurrentQuestionIndex(0);
      setQuizAnswers({});
      setQuizScore(null);
    };
    
    const handleQuizAnswer = (answer) => {
      setQuizAnswers({
        ...quizAnswers,
        [currentQuestionIndex]: answer
      });
    };
    
    const nextQuestion = () => {
      if (currentQuestionIndex < quiz.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Calculate score
        calculateQuizScore();
      }
    };
    
    const calculateQuizScore = () => {
      let correct = 0;
      quiz.questions.forEach((q, index) => {
        if (quizAnswers[index] === q.correctAnswer) {
          correct++;
        }
      });
      
      const score = Math.round((correct / quiz.questions.length) * 100);
      setQuizScore({
        percentage: score,
        correct,
        total: quiz.questions.length,
        feedback: getScoreFeedback(score)
      });
    };
    
    const getScoreFeedback = (score) => {
      if (score >= 90) return 'Outstanding! You have excellent comprehension!';
      if (score >= 70) return 'Great job! You understand the material well.';
      if (score >= 50) return 'Good effort! Review the challenging sections.';
      return 'Keep practicing! Re-read and take notes for better retention.';
    };
    
    return (
      <div className="mentor-quiz-panel">
        <div className="quiz-header">
          <Brain className="quiz-icon" />
          <h3>Comprehension Quiz</h3>
        </div>
        
        {!currentBook ? (
          <div className="no-book-selected">
            <BookOpen size={48} />
            <p>Select a book to take a quiz</p>
          </div>
        ) : !quiz ? (
          <div className="quiz-intro">
            <h4>Test Your Understanding</h4>
            <p>Ready to challenge yourself with a personalized quiz about "{currentBook.title}"?</p>
            <ul className="quiz-benefits">
              <li>📊 Track your comprehension</li>
              <li>🎯 Identify knowledge gaps</li>
              <li>🏆 Earn achievement points</li>
              <li>💡 Get personalized feedback</li>
            </ul>
            <button onClick={startQuiz} className="start-quiz-button">
              Start Quiz
            </button>
          </div>
        ) : quizScore ? (
          <div className="quiz-results">
            <div className="score-display">
              <Trophy className={`trophy-icon ${quizScore.percentage >= 70 ? 'gold' : 'silver'}`} />
              <h2>{quizScore.percentage}%</h2>
              <p>{quizScore.correct} of {quizScore.total} correct</p>
            </div>
            <p className="score-feedback">{quizScore.feedback}</p>
            <div className="quiz-actions">
              <button onClick={startQuiz} className="retake-quiz">
                Retake Quiz
              </button>
              <button onClick={() => setQuiz(null)} className="new-quiz">
                Different Quiz
              </button>
            </div>
          </div>
        ) : (
          <div className="quiz-question">
            <div className="question-progress">
              <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`}}
                />
              </div>
            </div>
            
            <div className="question-content">
              <p className="question-text">
                {quiz.questions[currentQuestionIndex].question}
              </p>
              
              {quiz.questions[currentQuestionIndex].type === 'multiple_choice' && (
                <div className="answer-options">
                  {quiz.questions[currentQuestionIndex].options.map((option, index) => (
                    <button
                      key={index}
                      className={`answer-option ${quizAnswers[currentQuestionIndex] === index ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(index)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
              
              {quiz.questions[currentQuestionIndex].type === 'short_answer' && (
                <textarea
                  className="answer-textarea"
                  placeholder="Type your answer here..."
                  value={quizAnswers[currentQuestionIndex] || ''}
                  onChange={(e) => handleQuizAnswer(e.target.value)}
                  rows={4}
                />
              )}
              
              {quiz.questions[currentQuestionIndex].hint && (
                <div className="question-hint">
                  <Lightbulb size={16} />
                  <span>{quiz.questions[currentQuestionIndex].hint}</span>
                </div>
              )}
            </div>
            
            <button
              onClick={nextQuestion}
              className="next-question-button"
              disabled={quizAnswers[currentQuestionIndex] === undefined}
            >
              {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        )}
      </div>
    );
  };

  // ===== MAIN RENDER =====
  
  if (isLoading) {
    return (
      <div className="mentor-loading">
        <div className="loading-spinner" />
        <p>Your literary mentor is preparing insights...</p>
      </div>
    );
  }
  
  // Handle API configuration modal
  if (showApiConfig) {
    return (
      <div className={`api-config-modal theme-${actualTheme}`}>
        <div className="modal-overlay" onClick={() => setShowApiConfig(false)} />
        <div className="modal-content">
          <div className="modal-header">
            <h2>Configure AI Provider</h2>
            <button 
              className="close-button"
              onClick={() => setShowApiConfig(false)}
            >
              ×
            </button>
          </div>
          <APIKeyConfiguration
            onKeysUpdated={() => {
              checkApiKeys();
              if (onKeysUpdated) onKeysUpdated();
            }}
            showTitle={false}
          />
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <button
              onClick={() => setShowApiConfig(false)}
              className="close-modal-button"
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--md-sys-color-surface-container)',
                color: 'var(--md-sys-color-on-surface)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`literary-mentor-ui theme-${actualTheme}`}>
      <div className="mentor-header">
        <div className="mentor-greeting">
          <h2>{mentorData?.greeting || 'Welcome, Reader!'}</h2>
          <p className="mentor-subtitle">Your Personal Literary Mentor</p>
          {!hasApiKeys && (
            <div className="api-warning">
              <AlertTriangle size={16} />
              <span>Configure AI keys to unlock advanced features</span>
              <button 
                onClick={() => setShowApiConfig(true)}
                className="config-button"
              >
                Configure
              </button>
            </div>
          )}
        </div>
        
        <div className="mentor-tabs">
          <button
            className={`tab-button ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            <Sparkles size={18} />
            Insights
          </button>
          <button
            className={`tab-button ${activeTab === 'discussion' ? 'active' : ''}`}
            onClick={() => setActiveTab('discussion')}
          >
            <Users size={18} />
            Discussion
          </button>
          <button
            className={`tab-button ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            <Brain size={18} />
            Quiz
          </button>
        </div>
      </div>
      
      <div className="mentor-content">
        {activeTab === 'insights' && <InsightsPanel />}
        {activeTab === 'discussion' && <DiscussionPanel />}
        {activeTab === 'quiz' && <QuizPanel />}
      </div>
    </div>
  );
};

export default LiteraryMentorUI;
