import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NewLandingPage.css';

const NewLandingPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: 'local_library',
      title: 'Digital Library',
      description: 'Upload and organize your books with beautiful covers, metadata, and smart collections'
    },
    {
      icon: 'auto_stories',
      title: 'Reading Sessions',
      description: 'Track your reading time, progress, and pick up right where you left off'
    },
    {
      icon: 'emoji_events',
      title: 'Gamification',
      description: 'Earn points, unlock achievements, maintain streaks, and level up as you read'
    },
    {
      icon: 'edit_note',
      title: 'Notes & Highlights',
      description: 'Capture your thoughts and highlight important passages while reading'
    },
    {
      icon: 'bar_chart',
      title: 'Reading Analytics',
      description: 'Visualize your reading habits with detailed statistics and insights'
    },
    {
      icon: 'palette',
      title: 'Material Design 3',
      description: 'Beautiful adaptive UI with dark mode and dynamic color theming'
    }
  ];

  return (
    <div className="new-landing-container">
      {/* Hero Section - Compact & Creative */}
      <section className={`hero-compact ${isVisible ? 'fade-in' : ''}`}>
        <div className="hero-content">
          {/* Logo with Animation */}
          <div className="logo-display">
            <div className="logo-circle">
              <span className="material-symbols-outlined logo-icon">
                auto_stories
              </span>
            </div>
            <div className="brand-identity">
              <h1 className="brand-title">ShelfQuest</h1>
              <p className="brand-tagline">Your Digital Bookshelf</p>
            </div>
          </div>

          {/* Main Value Proposition */}
          <h2 className="hero-headline">
            Your Personal Reading Companion
          </h2>
          <p className="hero-subtext">
            Build your digital library, track reading sessions, earn achievements, and gain insights into your reading habits—all in one beautiful app.
          </p>

          {/* CTA Buttons */}
          <div className="cta-group">
            <button
              className="md3-button md3-button-filled"
              onClick={() => navigate('/signup')}
            >
              <span className="material-symbols-outlined">rocket_launch</span>
              Get Started Free
            </button>
            <button
              className="md3-button md3-button-outlined"
              onClick={() => navigate('/login')}
            >
              <span className="material-symbols-outlined">login</span>
              Sign In
            </button>
          </div>

          {/* Key Features Highlights */}
          <div className="stats-strip">
            <div className="stat-item">
              <span className="stat-icon">📚</span>
              <span className="stat-label">Upload Books</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-icon">⏱️</span>
              <span className="stat-label">Track Sessions</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-icon">🏆</span>
              <span className="stat-label">Earn Rewards</span>
            </div>
          </div>
        </div>

        {/* Decorative Book Illustration */}
        <div className="hero-visual">
          <div className="floating-book book-1">
            <span className="material-symbols-outlined">menu_book</span>
          </div>
          <div className="floating-book book-2">
            <span className="material-symbols-outlined">book_5</span>
          </div>
          <div className="floating-book book-3">
            <span className="material-symbols-outlined">import_contacts</span>
          </div>
        </div>
      </section>

      {/* Features Grid - Compact */}
      <section className="features-compact">
        <h3 className="section-title">Everything You Need to Read Smarter</h3>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon">
                <span className="material-symbols-outlined">{feature.icon}</span>
              </div>
              <h4 className="feature-title">{feature.title}</h4>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA - Minimalist */}
      <section className="cta-final">
        <div className="cta-final-content">
          <h3 className="cta-final-title">Start Your Reading Journey Today</h3>
          <p className="cta-final-text">Free to use. Build your library, track your progress, and level up your reading habits.</p>
          <button
            className="md3-button md3-button-filled md3-button-large"
            onClick={() => navigate('/signup')}
          >
            Create Free Account
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="landing-footer">
        <p className="footer-text">© 2024 ShelfQuest. Made with care for book lovers.</p>
      </footer>
    </div>
  );
};

export default NewLandingPage;