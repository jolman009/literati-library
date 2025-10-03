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
      icon: 'auto_stories',
      title: 'Smart Reading',
      description: 'Track your progress with intelligent insights'
    },
    {
      icon: 'emoji_events',
      title: 'Achievements',
      description: 'Unlock badges as you read and grow'
    },
    {
      icon: 'insights',
      title: 'Analytics',
      description: 'Understand your reading patterns'
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
              <h1 className="brand-title">Literati</h1>
              <p className="brand-tagline">Your Digital Bookshelf</p>
            </div>
          </div>

          {/* Main Value Proposition */}
          <h2 className="hero-headline">
            Transform Your Reading Journey
          </h2>
          <p className="hero-subtext">
            Track, organize, and enhance your reading experience with elegant simplicity.
          </p>

          {/* CTA Buttons */}
          <div className="cta-group">
            <button 
              className="md3-button md3-button-filled"
              onClick={() => navigate('/register')}
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

          {/* Quick Stats */}
          <div className="stats-strip">
            <div className="stat-item">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Readers</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">500K+</span>
              <span className="stat-label">Books Tracked</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">4.9★</span>
              <span className="stat-label">Rating</span>
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
        <h3 className="section-title">Why Readers Love Literati</h3>
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
          <h3 className="cta-final-title">Ready to begin?</h3>
          <p className="cta-final-text">Join thousands of readers tracking their journey.</p>
          <button 
            className="md3-button md3-button-filled md3-button-large"
            onClick={() => navigate('/register')}
          >
            Start Reading Smarter
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="landing-footer">
        <p className="footer-text">© 2024 Literati. Made with care for book lovers.</p>
      </footer>
    </div>
  );
};

export default NewLandingPage;