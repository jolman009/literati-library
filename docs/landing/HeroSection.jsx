import React, { useEffect } from 'react';
/* import ThreeJsBookAnimation from './ThreeJsBookAnimation'; */

const HeroSection = () => {
  useEffect(() => {
    // Intersection Observer for animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title fade-in-up">
            Transform your reading journey, one page at a time
          </h1>
          <p className="hero-subtitle fade-in-up delay-1">
            A gamified digital bookshelf that makes reading addictive through achievements, 
            progress tracking, and personalized challenges.
          </p>
          
          <div className="hero-stats fade-in-up delay-2">
            <div className="stat-item">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Active Readers</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">2M+</span>
              <span className="stat-label">Books Tracked</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">95%</span>
              <span className="stat-label">Love It</span>
            </div>
          </div>

          <div className="button-group fade-in-up delay-3">
            <a href="/signup" className="md3-button filled">
              <span className="material-icons">menu_book</span>
              Start Reading
            </a>
            <a href="/login" className="md3-button outlined">
              <span className="material-icons">person</span>
              Sign In
            </a>
          </div>
        </div>

        {/* <div className="hero-animation"> */}
         {/* <ThreeJsBookAnimation /> */}
        {/* </div> */}
      </div>
    </section>
  );
};

export default HeroSection;