// src/pages/OnboardingGuide.jsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MD3Card, MD3Button, MD3Divider } from '../components/Material3';
import './OnboardingGuide.css';

const Section = ({ title, children }) => (
  <MD3Card className="onboarding-section" variant="elevated">
    <h2 className="onboarding-title">{title}</h2>
    <div className="onboarding-content">{children}</div>
  </MD3Card>
);

const OnboardingGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="onboarding-guide" style={{ padding: '24px', maxWidth: 980, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Welcome to ShelfQuest</h1>
        <p style={{ marginTop: 8, color: 'var(--md-sys-color-on-surface-variant)' }}>
          A quick guide to get you reading, taking notes, and earning points.
        </p>
      </header>

      <Section title="Quick Start">
        <ol className="onboarding-list">
          <li>Upload a PDF or EPUB on the Upload page.</li>
          <li>Open your book from the Library and start a reading session.</li>
          <li>Highlight or add notes while you read — they are saved automatically.</li>
          <li>Earn points for reading, notes, streaks, and check-ins.</li>
        </ol>
        <div className="onboarding-actions">
          <MD3Button onClick={() => navigate('/upload')}>Upload a Book</MD3Button>
          <MD3Button variant="outlined" onClick={() => navigate('/library')} style={{ marginLeft: 12 }}>Go to Library</MD3Button>
        </div>
      </Section>

      <Section title="Upload a PDF or EPUB">
        <p>
          Go to the Upload page to add new books. ShelfQuest supports <strong>PDF</strong> and <strong>EPUB</strong>
          files. After upload, the book appears in your Library.
        </p>
        <ul className="onboarding-bullets">
          <li>Drag-and-drop or choose a file in <code>/upload</code>.</li>
          <li>Large books process in the background — you can navigate away safely.</li>
          <li>Your uploads are available offline once opened at least once.</li>
        </ul>
        <div className="onboarding-actions">
          <MD3Button onClick={() => navigate('/upload')}>Open Upload</MD3Button>
        </div>
      </Section>

      <Section title="Start a Reading Session">
        <p>
          From your Library, click a book to open the reader. A reading session starts automatically and is tracked
          for your streaks and points.
        </p>
        <ul className="onboarding-bullets">
          <li>Use the toolbar to navigate pages/chapters and adjust zoom.</li>
          <li>Reading sessions auto-pause when you close the reader.</li>
          <li>Continue where you left off from the Library or Dashboard.</li>
        </ul>
      </Section>

      <Section title="Notes and Highlights">
        <p>
          Capture insights as you read. Notes and highlights are stored per book and can be reviewed centrally on
          the Notes page.
        </p>
        <ul className="onboarding-bullets">
          <li>Select text to highlight or create a note in the reader.</li>
          <li>Open <code>/notes</code> to browse, search, and edit your notes.</li>
          <li>Notes sync when online; they’re safe to create offline.</li>
        </ul>
        <div className="onboarding-actions">
          <MD3Button variant="outlined" onClick={() => navigate('/notes')}>Open Notes</MD3Button>
        </div>
      </Section>

      <Section title="Earn Points as You Learn">
        <p>
          ShelfQuest uses a lightweight gamification system to keep you motivated. You’ll earn points for consistent
          reading, taking notes, completing books, and daily check-ins.
        </p>
        <div className="onboarding-columns" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <MD3Card variant="outlined" className="onboarding-mini-card">
            <h3>Reading Sessions</h3>
            <p>Points for active time spent reading and streaks.</p>
          </MD3Card>
          <MD3Card variant="outlined" className="onboarding-mini-card">
            <h3>Notes & Highlights</h3>
            <p>Earn points when you capture insights while reading.</p>
          </MD3Card>
          <MD3Card variant="outlined" className="onboarding-mini-card">
            <h3>Daily Check-In</h3>
            <p>Open the app and check in to maintain your streak.</p>
          </MD3Card>
          <MD3Card variant="outlined" className="onboarding-mini-card">
            <h3>Milestones</h3>
            <p>Level up by reaching total point thresholds and achievements.</p>
          </MD3Card>
        </div>
        <div className="onboarding-actions" style={{ marginTop: 12 }}>
          <MD3Button onClick={() => navigate('/gamification')}>View Gamification Rules</MD3Button>
        </div>
      </Section>

      <MD3Divider style={{ margin: '24px 0' }} />

      <Section title="Tips">
        <ul className="onboarding-bullets">
          <li>Install ShelfQuest as a PWA for a native-like experience.</li>
          <li>Reading and notes work offline; data syncs when reconnected.</li>
          <li>Use the Dashboard to see streaks, points, and recent activity.</li>
        </ul>
        <p style={{ marginTop: 8 }}>
          Want the deep dive? See <Link to="/gamification">Gamification Rules</Link> or open <code>/upload</code> to begin.
        </p>
      </Section>
    </div>
  );
};

export default OnboardingGuide;
