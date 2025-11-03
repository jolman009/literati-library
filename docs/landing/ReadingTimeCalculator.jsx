import React, { useState, useEffect } from 'react';

const ReadingTimeCalculator = () => {
  const [minutes, setMinutes] = useState(30);
  const [results, setResults] = useState({
    books: 18,
    pages: 4500,
    level: 7,
    achievements: 12
  });

  useEffect(() => {
    const dailyPages = (minutes * 250) / 250; // words per minute / words per page
    const yearlyPages = Math.round(dailyPages * 365);
    const yearlyBooks = Math.round(yearlyPages / 250);
    
    // Calculate level based on yearly activity
    const level = Math.min(10, Math.floor(yearlyBooks / 3) + 2);
    const achievements = Math.min(25, Math.floor(yearlyBooks / 2) + 3);

    setResults({
      books: yearlyBooks,
      pages: yearlyPages,
      level: level,
      achievements: achievements
    });
  }, [minutes]);

  const getMotivationalMessage = () => {
    if (minutes < 15) {
      return "Great start! Even small reading sessions build powerful habits.";
    } else if (minutes < 30) {
      return "Excellent! You're on track to become a dedicated reader.";
    } else if (minutes < 60) {
      return "Amazing! You'd become a reading powerhouse and unlock tons of achievements!";
    } else {
      return "Incredible! You'd reach legendary reader status and inspire others!";
    }
  };

  const animateNumber = (element, newValue) => {
    if (!element) return;
    element.style.transform = 'scale(1.1)';
    element.style.color = 'var(--md-sys-color-primary)';
    setTimeout(() => {
      element.textContent = newValue;
      element.style.transform = 'scale(1)';
      element.style.color = '';
    }, 150);
  };

  const handleSliderChange = (e) => {
    const newMinutes = parseInt(e.target.value);
    setMinutes(newMinutes);

    // Animate the result numbers
    setTimeout(() => {
      const booksEl = document.getElementById('booksPerYear');
      const pagesEl = document.getElementById('pagesPerYear');
      const levelEl = document.getElementById('levelReached');
      const achievementsEl = document.getElementById('achievementsUnlocked');

      if (booksEl) animateNumber(booksEl, Math.round((newMinutes * 250 * 365) / (250 * 250)));
      if (pagesEl) animateNumber(pagesEl, Math.round(newMinutes * 250 * 365 / 250).toLocaleString());
      if (levelEl) animateNumber(levelEl, Math.min(10, Math.floor(Math.round((newMinutes * 250 * 365) / (250 * 250)) / 3) + 2));
      if (achievementsEl) animateNumber(achievementsEl, Math.min(25, Math.floor(Math.round((newMinutes * 250 * 365) / (250 * 250)) / 2) + 3));
    }, 50);
  };

  return (
    <section className="calculator-section">
      <div className="section-container">
        <div className="calculator-widget">
          <h2>Discover Your Reading Potential</h2>
          <p>See how much you could achieve with just a few minutes of daily reading</p>
          
          <div className="calculator-input">
            <span>I can read</span>
            <input 
              type="range" 
              id="timeSlider"
              className="time-slider" 
              min="5" 
              max="120" 
              value={minutes}
              step="5"
              onChange={handleSliderChange}
            />
            <span className="time-display" id="timeDisplay">
              {minutes} minute{minutes === 1 ? '' : 's'}
            </span>
            <span>per day</span>
          </div>

          <div className="results-grid" id="calculatorResults">
            <div className="result-item">
              <span className="result-number" id="booksPerYear">{results.books}</span>
              <span className="result-label">Books per Year</span>
            </div>
            <div className="result-item">
              <span className="result-number" id="pagesPerYear">{results.pages.toLocaleString()}</span>
              <span className="result-label">Pages per Year</span>
            </div>
            <div className="result-item">
              <span className="result-number" id="levelReached">{results.level}</span>
              <span className="result-label">Level Reached</span>
            </div>
            <div className="result-item">
              <span className="result-number" id="achievementsUnlocked">{results.achievements}</span>
              <span className="result-label">Achievements</span>
            </div>
          </div>

          <p className="motivational-message" id="motivationalMessage">
            {getMotivationalMessage()}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ReadingTimeCalculator;