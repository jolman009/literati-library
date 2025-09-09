import React, { useState } from 'react';


const InteractiveFeatureCards = () => {
  const [flippedCards, setFlippedCards] = useState(new Set());

  const flipCard = (cardIndex) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(cardIndex)) {
      newFlipped.delete(cardIndex);
    } else {
      newFlipped.add(cardIndex);
    }
    setFlippedCards(newFlipped);

    // Auto-flip back after 5 seconds
    setTimeout(() => {
      setFlippedCards(prev => {
        const updated = new Set(prev);
        updated.delete(cardIndex);
        return updated;
      });
    }, 5000);
  };

  const features = [
    {
      icon: 'emoji_events',
      title: 'Gamified Reading Experience',
      description: 'Unlock 30+ achievements, level up from Novice to Legend, and earn points for every page you read.',
      demo: {
        title: '🏆 Live Achievement Demo',
        items: [
          { label: '+25 XP - Page Turner', subtitle: 'Read 100 pages' },
          { label: 'Level Up! 📈', subtitle: 'Bookworm → Scholar' },
          { label: 'Streak Bonus! 🔥', subtitle: '7 days in a row' }
        ]
      }
    },
    {
      icon: 'analytics',
      title: 'Smart Progress Tracking',
      description: 'Monitor your reading speed, track time spent, and visualize your growth with detailed analytics.',
      demo: {
        title: '📊 Your Reading Stats',
        items: [
          { label: 'Reading Speed', subtitle: '245 words/min (+15 this week)' },
          { label: 'Weekly Goal', subtitle: '4h 32m / 5h 00m' },
          { label: 'Books This Month', subtitle: '3 completed, 1 in progress' }
        ]
      }
    },
    {
      icon: 'library_books',
      title: 'Personal Digital Library',
      description: 'Upload, organize, and access your entire book collection anywhere.',
      demo: {
        title: '📚 Library Features',
        items: [
          { label: 'Smart Collections', subtitle: 'Auto-organize by genre, author' },
          { label: 'Cloud Sync', subtitle: 'Access anywhere, offline ready' },
          { label: 'Book Covers', subtitle: 'Auto-fetch or custom upload' }
        ]
      }
    },
    {
      icon: 'edit_note',
      title: 'Smart Note-Taking',
      description: 'Capture insights with rich annotations, highlights, and searchable notes.',
      demo: {
        title: '✍️ Note-Taking Tools',
        items: [
          { label: 'Quick Highlights', subtitle: 'Tap & hold to highlight text' },
          { label: 'Rich Annotations', subtitle: 'Add thoughts, questions, insights' },
          { label: 'Search Notes', subtitle: 'Find any note across all books' }
        ]
      }
    },
    {
      icon: 'flag',
      title: 'Personalized Goals',
      description: 'Set custom reading challenges or let our AI create perfect goals for your skill level.',
      demo: {
        title: '🎯 Goal Examples',
        items: [
          { label: 'Daily Reading', subtitle: '30 minutes every day' },
          { label: 'Genre Challenge', subtitle: 'Try 3 new genres this month' },
          { label: 'Speed Reading', subtitle: 'Increase WPM by 10%' }
        ]
      }
    },
    {
      icon: 'offline_bolt',
      title: 'Read Anywhere',
      description: 'Progressive Web App technology means you can read offline and sync across all platforms.',
      demo: {
        title: '🌐 Platform Features',
        items: [
          { label: 'Offline Reading', subtitle: 'No internet? No problem!' },
          { label: 'Cross-Device Sync', subtitle: 'Phone, tablet, computer' },
          { label: 'Install as App', subtitle: 'Add to home screen' }
        ]
      }
    }
  ];

  return (
    <section className="features-section">
      <div className="section-container">
        <h2 className="section-title">Why Readers Choose Literati</h2>
        <p className="section-subtitle">
          Everything you need to build a lasting reading habit and unlock your full literary potential
          <br /><small>(Click any card to see more details)</small>
        </p>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`feature-card ${flippedCards.has(index) ? 'flipped' : ''}`}
              onClick={() => flipCard(index)}
            >
              <div className="feature-card-inner">
                <div className="feature-card-front">
                  <div className="feature-icon">
                    <span className="material-icons">{feature.icon}</span>
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
                <div className="feature-card-back">
                  <div className="feature-demo">
                    <h4>{feature.demo.title}</h4>
                    {feature.demo.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="demo-element">
                        <strong>{item.label}</strong><br />
                        <small>{item.subtitle}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InteractiveFeatureCards;