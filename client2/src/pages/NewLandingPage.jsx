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

  const testimonials = [
    {
      icon: 'school',
      name: 'Mrs. Sarah Chen',
      role: '5th Grade Teacher',
      quote: "ShelfQuest transformed my classroom reading program. I use the gamification levels to reward students individually—when they level up, they earn classroom privileges. My reluctant readers are now racing to finish books!",
      highlight: 'Classroom Integration'
    },
    {
      icon: 'face',
      name: 'Marcus T.',
      role: 'Student, Age 14',
      quote: "I never thought I'd say this, but tracking my reading is actually fun. Watching my stats grow and collecting points feels like a game. I've read more books this semester than all of last year!",
      highlight: 'Student Motivation'
    },
    {
      icon: 'family_restroom',
      name: 'Jennifer M.',
      role: 'Parent & Reader',
      quote: "I started using ShelfQuest for myself and loved it so much I set up my daughter's account. Now we compare reading streaks at dinner! It's become a bonding activity that gets us both excited about books.",
      highlight: 'Family Reading'
    }
  ];

  return (
    <div className="new-landing-container">
      {/* Hero Section - Compact & Creative */}
      <section className={`hero-compact ${isVisible ? 'fade-in' : ''}`} data-testid="landing-hero">
        <div className="hero-content">
          {/* Logo with Animation */}
          <div className="logo-display">
            <div className="logo-circle">
              <img
                src="/ShelfQuest_logo_favicon.png"
                alt="ShelfQuest"
                className="logo-image"
              />
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
              data-testid="register-link"
            >
              <span className="material-symbols-outlined">rocket_launch</span>
              Sign Up
            </button>
            <button
              className="md3-button md3-button-outlined"
              onClick={() => navigate('/login')}
              data-testid="login-link"
            >
              <span className="material-symbols-outlined">login</span>
              Sign In
            </button>
          </div>

          {/* Download Buttons */}
          <div className="download-section">
            <p className="download-label">Or download the app:</p>
            <div className="download-buttons">
              <a
                href="https://apps.microsoft.com/detail/9P23Z6MBNGSH"
                target="_blank"
                rel="noopener noreferrer"
                className="store-button microsoft-button"
                aria-label="Download from Microsoft Store"
              >
                <svg className="store-icon" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0h11v11H0z" fill="#F25022"/>
                  <path d="M12 0h11v11H12z" fill="#7FBA00"/>
                  <path d="M0 12h11v11H0z" fill="#00A4EF"/>
                  <path d="M12 12h11v11H12z" fill="#FFB900"/>
                </svg>
                <div className="store-text">
                  <span className="store-label">Download on the</span>
                  <span className="store-name">Microsoft Store</span>
                </div>
              </a>
              <div className="store-button google-button coming-soon">
                <svg className="store-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" fill="#3DDC84"/>
                </svg>
                <div className="store-text">
                  <span className="store-label">Coming Dec 1</span>
                  <span className="store-name">Google Play</span>
                </div>
              </div>
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

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h3 className="section-title">What Readers Are Saying</h3>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="testimonial-card"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="testimonial-highlight">{testimonial.highlight}</div>
              <div className="testimonial-quote">
                <span className="quote-mark">"</span>
                {testimonial.quote}
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">
                  <span className="material-symbols-outlined">{testimonial.icon}</span>
                </div>
                <div className="author-info">
                  <span className="author-name">{testimonial.name}</span>
                  <span className="author-role">{testimonial.role}</span>
                </div>
              </div>
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
            data-testid="get-started-button"
          >
            Create Free Account
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Footer - Minimal with quick links */}
      <footer className="landing-footer">
        <p className="footer-text">
          © 2024 ShelfQuest. Made with care for book lovers.
          {' '}•{' '}
          <a href="/contact" className="footer-link">Contact Us</a>
          {' '}•{' '}
          <a href="/jolman-press" className="footer-link">About Jolman Press</a>
          {' '}•{' '}
          <a href="/legal/privacy-policy" className="footer-link">Privacy Policy</a>
          {' '}•{' '}
          <a href="/legal/terms-of-service" className="footer-link">Terms</a>
        </p>
      </footer>
    </div>
  );
};

export default NewLandingPage;
