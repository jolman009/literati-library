// MentorPage.jsx - Dedicated page for Literary Mentor AI
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import LiteraryMentorUI from '../components/LiteraryMentorUI';
import API from '../config/api';
import '../styles/mentor-page.css';

const MentorPage = () => {
  const { user: _user } = useAuth();
  const { actualTheme } = useMaterial3Theme();
  const [_books, setBooks] = useState([]);
  const [currentBook, setCurrentBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const response = await API.get('/books', { params: { limit: 200, offset: 0 } });
      const { items: booksArray = [] } = response.data || {};

      setBooks(booksArray);

      // Auto-select currently reading book if available
      const readingBook = booksArray.find(b => b.is_reading);
      if (readingBook) {
        setCurrentBook(readingBook);
      }
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mentor-page-loading">
        <div className="loading-spinner">
          <span className="spinner-icon">🤖</span>
          <p>Loading Literary Mentor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`mentor-page ${actualTheme === 'dark' ? 'dark' : ''}`}>
      <div className="mentor-header">
        <h1 className="mentor-title">
          <span className="mentor-icon">🤖</span>
          Literary Mentor AI
        </h1>
        <p className="mentor-subtitle">
          Your personalized reading companion powered by AI
        </p>
      </div>

      <div className="mentor-content">
        <LiteraryMentorUI currentBook={currentBook} />
      </div>
    </div>
  );
};

export default MentorPage;
