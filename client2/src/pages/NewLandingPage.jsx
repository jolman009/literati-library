import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NewLandingPage.css';

const NewLandingPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  const testimonials = [
    {
      icon: 'school',
      name: 'Mrs. Sarah Chen',
      role: '5th Grade Teacher',
      quote: "ShelfQuest transformed my classroom reading program. The gamification levels reward students individually—when they level up, they earn classroom privileges. My reluctant readers are now racing to finish books!",
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
      quote: "I started using ShelfQuest for myself and loved it so much I set up my daughter's account. Now we compare reading streaks at dinner! It's become a bonding activity.",
      highlight: 'Family Reading'
    }
  ];

  // Focus on features, not inflated numbers - we're just getting started!
  const stats = [
    { value: 'PDF', label: '& EPUB Support' },
    { value: '6', label: 'Unlockable Themes' },
    { value: '∞', label: 'Reading Goals' },
    { value: 'Free', label: 'To Get Started' }
  ];

  // Feature cards for the bento grid
  const features = [
    {
      id: 'upload',
      icon: 'upload_file',
      title: 'Upload Your Books',
      description: 'Import PDF and EPUB files instantly. Your digital library, beautifully organized.',
      size: 'large',
      visual: 'upload'
    },
    {
      id: 'analytics',
      icon: 'bar_chart',
      title: 'Reading Analytics',
      description: 'Visualize your habits.',
      size: 'tall',
      dark: true,
      visual: 'analytics'
    },
    {
      id: 'collections',
      icon: 'sell',
      title: 'Smart Collections',
      description: 'Auto-organize by genre, author, and mood.',
      size: 'medium',
      visual: 'tags'
    },
    {
      id: 'gamification',
      icon: 'emoji_events',
      title: 'Gamification & Themes',
      description: 'Earn points, unlock achievements, maintain streaks. Unlock 6 beautiful themes as rewards for reading!',
      size: 'wide',
      visual: 'gamification'
    },
    {
      id: 'sessions',
      icon: 'auto_stories',
      title: 'Reading Sessions',
      description: 'Track time spent reading and resume exactly where you left off.',
      size: 'standard'
    },
    {
      id: 'notes',
      icon: 'mic',
      title: 'Voice & Text Notes',
      description: 'Record voice notes or type your thoughts. Highlight passages as you read.',
      size: 'standard'
    }
  ];

  // Render special visuals for certain feature cards
  const renderFeatureVisual = (visual) => {
    switch (visual) {
      case 'upload':
        return (
          <div className="bento-visual upload-visual">
            <div className="upload-mockup">
              <div className="upload-files">
                <div className="file-icon pdf">PDF</div>
                <div className="file-icon epub">EPUB</div>
              </div>
              <div className="upload-details">
                <div className="detail-line"></div>
                <div className="detail-line short"></div>
              </div>
            </div>
            <div className="upload-overlay">
              <span className="material-symbols-outlined">cloud_upload</span>
              <span>Drop files here</span>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="analytics-bars">
            <div className="analytics-row">
              <span className="analytics-label">Fiction</span>
              <div className="analytics-bar-track">
                <div className="analytics-bar-fill" style={{ width: '70%' }}></div>
              </div>
            </div>
            <div className="analytics-row">
              <span className="analytics-label">Sci-Fi</span>
              <div className="analytics-bar-track">
                <div className="analytics-bar-fill medium" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div className="analytics-row">
              <span className="analytics-label">History</span>
              <div className="analytics-bar-track">
                <div className="analytics-bar-fill low" style={{ width: '30%' }}></div>
              </div>
            </div>
          </div>
        );
      case 'tags':
        return (
          <div className="tags-preview">
            <span className="tag">Must Read</span>
            <span className="tag">Sci-Fi</span>
            <span className="tag filled">Favorite</span>
          </div>
        );
      case 'gamification':
        return (
          <div className="gamification-preview">
            <div className="theme-unlock-card">
              <div className="user-avatar-preview">
                <span className="material-symbols-outlined">person</span>
              </div>
              <div className="unlock-info">
                <span className="unlock-name">Ocean Blue Theme</span>
                <span className="unlock-status carolina">Unlocked at 1,501 pts</span>
              </div>
              <span className="material-symbols-outlined unlock-icon">lock_open</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Render a bento card based on feature data
  const renderBentoCard = (feature) => {
    const sizeClass = `bento-${feature.size}`;
    const darkClass = feature.dark ? 'bento-dark' : '';
    const isWide = feature.size === 'wide';

    return (
      <div key={feature.id} className={`bento-card ${sizeClass} ${darkClass}`}>
        {isWide ? (
          <div className="bento-content-row">
            <div className="bento-text-block">
              <div className={`bento-icon-wrap ${feature.dark ? 'dark' : ''}`}>
                <span className="material-symbols-outlined">{feature.icon}</span>
              </div>
              <h3 className="bento-title">{feature.title}</h3>
              <p className="bento-description">{feature.description}</p>
            </div>
            {renderFeatureVisual(feature.visual)}
          </div>
        ) : (
          <>
            {feature.size === 'large' ? (
              <div className="bento-content">
                <div className={`bento-icon-wrap ${feature.dark ? 'dark' : ''}`}>
                  <span className="material-symbols-outlined">{feature.icon}</span>
                </div>
                <h3 className="bento-title">{feature.title}</h3>
                <p className="bento-description">{feature.description}</p>
              </div>
            ) : (
              <>
                <div className={`bento-icon-wrap ${feature.dark ? 'dark' : ''}`}>
                  <span className="material-symbols-outlined">{feature.icon}</span>
                </div>
                <h3 className="bento-title">{feature.title}</h3>
                <p className="bento-description">{feature.description}</p>
              </>
            )}
            {renderFeatureVisual(feature.visual)}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="landing-page">
      {/* Fixed Navigation */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <a href="#" className="nav-logo">
            <img
              src="/ShelfQuest_logo_favicon.png"
              alt="ShelfQuest"
              className="nav-logo-image"
            />
            <span className="nav-logo-text">shelfquest</span>
          </a>

          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#testimonials" className="nav-link">Stories</a>
            <a href="#cta" className="nav-link">Get Started</a>
          </div>

          <div className="nav-actions">
            <button
              className="nav-btn nav-btn-text"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
            <button
              className="nav-btn nav-btn-filled"
              onClick={() => navigate('/signup')}
            >
              Get Started
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className={`hero-section ${isVisible ? 'visible' : ''}`}>
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              <span>Now with AI Reading Companion</span>
            </div>

            <h1 className="hero-title">
              The operating system for your reading life.
            </h1>

            <p className="hero-subtitle">
              ShelfQuest bridges the gap between your physical library and digital habits.
              Catalog, track, and discover with zero friction.
            </p>

            <div className="hero-social-proof">
              <div className="launch-badge">
                <span className="material-symbols-outlined">rocket_launch</span>
              </div>
              <p>New app, big dreams — join us from the start!</p>
            </div>
          </div>

          {/* Hero Visual - Abstract UI Preview */}
          <div className="hero-visual">
            <div className="hero-card-stack">
              <div className="hero-card hero-card-back"></div>
              <div className="hero-card hero-card-middle"></div>
              <div className="hero-card hero-card-front">
                <div className="hero-card-header">
                  <div className="window-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <div className="header-bar"></div>
                </div>
                <div className="hero-card-body">
                  <div className="preview-book-info">
                    <div className="preview-cover">
                      <span className="material-symbols-outlined">book</span>
                    </div>
                    <div className="preview-meta">
                      <div className="meta-line meta-title"></div>
                      <div className="meta-line meta-author"></div>
                      <div className="meta-box">
                        <div className="meta-line short"></div>
                        <div className="meta-line short"></div>
                      </div>
                      <div className="preview-actions">
                        <div className="action-btn-preview"></div>
                        <div className="action-icon-preview"></div>
                      </div>
                    </div>
                  </div>
                  <div className="preview-stats-row">
                    <div className="stat-card-preview">
                      <span className="material-symbols-outlined">bar_chart</span>
                      <div className="stat-bar"></div>
                    </div>
                    <div className="stat-card-preview">
                      <span className="material-symbols-outlined">schedule</span>
                      <div className="stat-bar"></div>
                    </div>
                    <div className="stat-card-preview">
                      <span className="material-symbols-outlined">favorite</span>
                      <div className="stat-bar"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Social Proof Stats */}
      <section className="stats-section">
        <div className="stats-container">
          <p className="stats-label">What you get with ShelfQuest</p>
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-name">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="features-section">
        <div className="features-header">
          <h2 className="section-title">
            Everything you need to<br />manage your collection.
          </h2>
          <p className="section-subtitle">
            Whether you have one shelf or a private library, ShelfQuest scales with your curiosity.
          </p>
        </div>

        <div className="bento-grid">
          {/* Large Card - Upload Books */}
          <div className="bento-card bento-large">
            <div className="bento-content">
              <div className="bento-icon-wrap">
                <span className="material-symbols-outlined">upload_file</span>
              </div>
              <h3 className="bento-title">Upload Your Books</h3>
              <p className="bento-description">Import PDF and EPUB files instantly. Your digital library, beautifully organized.</p>
            </div>
            <div className="bento-visual upload-visual">
              <div className="upload-mockup">
                <div className="upload-files">
                  <div className="file-icon pdf">PDF</div>
                  <div className="file-icon epub">EPUB</div>
                </div>
                <div className="upload-details">
                  <div className="detail-line"></div>
                  <div className="detail-line short"></div>
                </div>
              </div>
              <div className="upload-overlay">
                <span className="material-symbols-outlined">cloud_upload</span>
                <span>Drop files here</span>
              </div>
            </div>
          </div>

          {/* Tall Card - Analytics */}
          <div className="bento-card bento-tall bento-dark">
            <div className="bento-content">
              <div className="bento-icon-wrap dark">
                <span className="material-symbols-outlined">bar_chart</span>
              </div>
              <h3 className="bento-title">Reading Analytics</h3>
              <p className="bento-description">Visualize your habits.</p>
            </div>
            <div className="analytics-bars">
              <div className="analytics-row">
                <span className="analytics-label">Fiction</span>
                <div className="analytics-bar-track">
                  <div className="analytics-bar-fill" style={{ width: '70%' }}></div>
                </div>
              </div>
              <div className="analytics-row">
                <span className="analytics-label">Sci-Fi</span>
                <div className="analytics-bar-track">
                  <div className="analytics-bar-fill medium" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div className="analytics-row">
                <span className="analytics-label">History</span>
                <div className="analytics-bar-track">
                  <div className="analytics-bar-fill low" style={{ width: '30%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Medium Card - Collections */}
          <div className="bento-card bento-medium">
            <div className="bento-icon-wrap">
              <span className="material-symbols-outlined">sell</span>
            </div>
            <h3 className="bento-title">Smart Collections</h3>
            <p className="bento-description">Auto-organize by genre, author, and mood.</p>
            <div className="tags-preview">
              <span className="tag">Must Read</span>
              <span className="tag">Sci-Fi</span>
              <span className="tag filled">Favorite</span>
            </div>
          </div>

          {/* Wide Card - Gamification */}
          <div className="bento-card bento-wide">
            <div className="bento-content-row">
              <div className="bento-text-block">
                <div className="bento-icon-wrap">
                  <span className="material-symbols-outlined">emoji_events</span>
                </div>
                <h3 className="bento-title">Gamification & Themes</h3>
                <p className="bento-description">Earn points, unlock achievements, maintain streaks. Unlock 6 beautiful themes as rewards for reading!</p>
              </div>
              <div className="gamification-preview">
                <div className="theme-unlock-card">
                  <div className="user-avatar-preview">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className="unlock-info">
                    <span className="unlock-name">Ocean Blue Theme</span>
                    <span className="unlock-status carolina">Unlocked at 1,501 pts</span>
                  </div>
                  <span className="material-symbols-outlined unlock-icon">lock_open</span>
                </div>
              </div>
            </div>
          </div>

          {/* Standard Cards */}
          <div className="bento-card bento-standard">
            <div className="bento-icon-wrap">
              <span className="material-symbols-outlined">auto_stories</span>
            </div>
            <h3 className="bento-title">Reading Sessions</h3>
            <p className="bento-description">Track time spent reading and resume exactly where you left off.</p>
          </div>

          <div className="bento-card bento-standard">
            <div className="bento-icon-wrap">
              <span className="material-symbols-outlined">mic</span>
            </div>
            <h3 className="bento-title">Voice & Text Notes</h3>
            <p className="bento-description">Record voice notes or type your thoughts. Highlight passages as you read.</p>
          </div>
        </div>
      </section>

      {/* Dark Feature Spotlight */}
      <section className="spotlight-section">
        <div className="spotlight-container">
          <div className="spotlight-grid">
            <div className="spotlight-visual">
              <div className="spotlight-mockup">
                <div className="mockup-header">
                  <div className="mockup-search"></div>
                  <div className="mockup-add-btn">
                    <span className="material-symbols-outlined">add</span>
                  </div>
                </div>
                <div className="mockup-list">
                  <div className="mockup-book-item">
                    <div className="mockup-book-cover"></div>
                    <div className="mockup-book-info">
                      <div className="info-line"></div>
                      <div className="info-line short"></div>
                    </div>
                  </div>
                  <div className="mockup-book-item faded">
                    <div className="mockup-book-cover"></div>
                    <div className="mockup-book-info">
                      <div className="info-line"></div>
                      <div className="info-line short"></div>
                    </div>
                  </div>
                  <div className="mockup-book-item very-faded">
                    <div className="mockup-book-cover"></div>
                    <div className="mockup-book-info">
                      <div className="info-line"></div>
                      <div className="info-line short"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="spotlight-content">
              <h2 className="spotlight-title">Unified Search.</h2>
              <p className="spotlight-description">
                Stop wondering if you already own a copy. ShelfQuest unifies your physical shelves,
                eBooks, and audiobooks into a single, searchable database.
              </p>
              <ul className="spotlight-features">
                <li>
                  <span className="material-symbols-outlined">check_circle</span>
                  <div>
                    <h4>Cross-platform sync</h4>
                    <p>Access your library from any device, anywhere.</p>
                  </div>
                </li>
                <li>
                  <span className="material-symbols-outlined">check_circle</span>
                  <div>
                    <h4>AI Reading Companion</h4>
                    <p>Get summaries, insights, and personalized recommendations.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="testimonials-section">
        <h2 className="section-title centered">What Readers Are Saying</h2>
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

      {/* Final CTA */}
      <section id="cta" className="cta-section">
        <div className="cta-card">
          <h2 className="cta-title">Ready to organize your reading life?</h2>
          <p className="cta-description">
            Join thousands of readers who have transformed their relationship with books.
            Start for free, upgrade when you need more.
          </p>

          <form className="cta-form" onSubmit={(e) => { e.preventDefault(); navigate('/signup'); }}>
            <input
              type="email"
              placeholder="Enter your email"
              className="cta-input"
            />
            <button type="submit" className="cta-submit">
              Get Started
            </button>
          </form>
          <p className="cta-note">Free forever. No credit card required.</p>

          {/* Download Buttons */}
          <div className="download-section">
            <p className="download-label">Or download the app:</p>
            <div className="download-buttons">
              <a
                href="https://apps.microsoft.com/detail/9P23Z6MBNGSH"
                target="_blank"
                rel="noopener noreferrer"
                className="store-button"
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
              <div className="store-button coming-soon">
                <svg className="store-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" fill="#3DDC84"/>
                </svg>
                <div className="store-text">
                  <span className="store-label">Coming Soon</span>
                  <span className="store-name">Google Play</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="#" className="footer-logo">
                <img
                  src="/ShelfQuest_logo_favicon.png"
                  alt="ShelfQuest"
                  className="footer-logo-image"
                />
                <span className="footer-logo-text">shelfquest</span>
              </a>
              <p className="footer-tagline">
                Designed for the modern reader. Built to last as long as your books.
              </p>
              <div className="footer-social">
                <a href="#" aria-label="Twitter">
                  <span className="material-symbols-outlined">public</span>
                </a>
                <a href="#" aria-label="Instagram">
                  <span className="material-symbols-outlined">photo_camera</span>
                </a>
                <a href="https://github.com" aria-label="GitHub">
                  <span className="material-symbols-outlined">code</span>
                </a>
              </div>
            </div>

            <div className="footer-links-group">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="/premium">Premium</a></li>
                <li><a href="#">Changelog</a></li>
              </ul>
            </div>

            <div className="footer-links-group">
              <h4>Resources</h4>
              <ul>
                <li><a href="/help/viewer">Help Center</a></li>
                <li><a href="/contact">Contact Us</a></li>
                <li><a href="/jolman-press">About Jolman Press</a></li>
              </ul>
            </div>

            <div className="footer-links-group">
              <h4>Legal</h4>
              <ul>
                <li><a href="/legal/privacy-policy">Privacy Policy</a></li>
                <li><a href="/legal/terms-of-service">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2024 ShelfQuest by Jolman Press. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewLandingPage;
