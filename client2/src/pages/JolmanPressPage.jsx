import React from 'react';
import { useNavigate } from 'react-router-dom';
import './JolmanPressPage.css';

const JolmanPressPage = () => {
  const navigate = useNavigate();

  const pillars = [
    {
      icon: 'apartment',
      title: 'Independent Studio',
      description: 'Jolman Press builds ShelfQuest and companion tools with a focus on reader-centric design and AI-assisted workflows.'
    },
    {
      icon: 'auto_awesome',
      title: 'Material Design 3',
      description: 'We rely on MD3 theming, motion, and accessibility guidance to deliver adaptive experiences across web and desktop.'
    },
    {
      icon: 'psychology',
      title: 'AI-Ready Foundation',
      description: 'Data-driven recommendations, smart insights, and assistive features keep your reading goals on track.'
    }
  ];

  const highlights = [
    'Unified brand across ShelfQuest, library dashboards, and future companion apps',
    'Deployment readiness checklists and release scorecards guide every launch',
    'Performance-first code with offline support and secure authentication',
    'Human-friendly documentation so partners understand how we build'
  ];

  return (
    <div className="jolman-page">
      <header className="jolman-hero" data-testid="jolman-hero">
        <div className="badge">Studio Identity</div>
        <h1>Jolman Press</h1>
        <p className="subtitle">
          The creative studio behind ShelfQuest and a growing suite of reading-forward applications.
        </p>
        <div className="hero-actions">
          <button
            type="button"
            className="md3-button md3-button-filled"
            onClick={() => navigate('/signup')}
          >
            <span className="material-symbols-outlined">rocket_launch</span>
            Start with ShelfQuest
          </button>
          <button
            type="button"
            className="md3-button md3-button-outlined"
            onClick={() => navigate('/login')}
          >
            <span className="material-symbols-outlined">login</span>
            Already a member
          </button>
        </div>
      </header>

      <section className="pillars" aria-label="Jolman Press pillars">
        {pillars.map(pillar => (
          <article key={pillar.title} className="pillar-card md3-surface" aria-label={pillar.title}>
            <div className="pillar-icon" aria-hidden="true">
              <span className="material-symbols-outlined">{pillar.icon}</span>
            </div>
            <div className="pillar-content">
              <h2>{pillar.title}</h2>
              <p>{pillar.description}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="highlights" aria-label="How we build">
        <div className="highlights-header">
          <h3>How we build and ship</h3>
          <p>
            Every release follows our Deployment Readiness checklist and a one-page Release Readiness Scorecard to keep
            engineering, design, and communications aligned.
          </p>
        </div>
        <ul className="highlight-list">
          {highlights.map(item => (
            <li key={item}>
              <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cta-card md3-elevated" aria-label="Get in touch">
        <div>
          <p className="eyebrow">Partner with us</p>
          <h3>Want to learn more about Jolman Press?</h3>
          <p className="cta-copy">
            We love collaborating on thoughtful reading tools. Reach out for product questions, partnerships, or to see how
            ShelfQuest can accelerate your team.
          </p>
        </div>
        <div className="cta-actions">
          <a className="md3-button md3-button-tonal" href="mailto:hello@jolmanpress.com">
            <span className="material-symbols-outlined">mail</span>
            Email the studio
          </a>
          <button
            type="button"
            className="md3-button md3-button-text"
            onClick={() => navigate('/')}
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Return home
          </button>
        </div>
      </section>
    </div>
  );
};

export default JolmanPressPage;
