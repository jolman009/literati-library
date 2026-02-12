import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './HelpFAQPage.css';

const faqData = [
  {
    category: 'Getting Started',
    icon: 'rocket_launch',
    items: [
      {
        q: 'How do I add books to my library?',
        a: 'Tap "Upload Books" from the sidebar or More menu. You can upload EPUB files from your device. Once uploaded, books appear in your Library and are ready to read.',
      },
      {
        q: 'How do I search for a book in my library?',
        a: 'Use the search bar at the top of the Library page. You can search by title or author name. The search filters your library in real time as you type.',
      },
      {
        q: 'What file formats are supported?',
        a: 'ShelfQuest currently supports EPUB files. This is the most widely used open e-book format and works great for novels, textbooks, and other long-form content.',
      },
      {
        q: 'Can I organize my books?',
        a: 'Yes! Use Collections to group books by topic, genre, or any category you choose. Go to "Collections" from the sidebar to create and manage them.',
      },
    ],
  },
  {
    category: 'Reading & Progress',
    icon: 'auto_stories',
    items: [
      {
        q: 'How does the reading tracker work?',
        a: 'ShelfQuest automatically tracks your reading time and page progress when you read a book. Visit the "Progress & Journey" page to see your stats, streaks, and reading tiers.',
      },
      {
        q: 'What are reading streaks?',
        a: 'A reading streak counts consecutive days you\'ve read. Open any book and read for at least a few minutes to keep your streak alive. Streaks earn bonus points!',
      },
      {
        q: 'How do reading tiers work?',
        a: 'As you read more books, you progress through tiers: Curious Reader, Avid Reader, Bookworm, Scholar, and Literati. Each tier unlocks new themes and rewards.',
      },
      {
        q: 'Can I read offline?',
        a: 'Yes! Books you\'ve opened are cached for offline reading. Make sure to open them at least once while online so they can be stored on your device.',
      },
    ],
  },
  {
    category: 'Notes & Highlights',
    icon: 'edit_note',
    items: [
      {
        q: 'How do I create notes while reading?',
        a: 'While reading, select any text to see the annotation toolbar. You can highlight text, add notes, or bookmark a passage. All annotations are saved automatically.',
      },
      {
        q: 'Where can I find all my notes?',
        a: 'Go to the "Notes" page from the sidebar or bottom navigation. You\'ll see all your notes organized by book, with the ability to search and filter.',
      },
      {
        q: 'Do notes sync across devices?',
        a: 'Notes created while online are saved to the server immediately. Notes created offline are stored locally and sync automatically the next time you\'re connected.',
      },
    ],
  },
  {
    category: 'Gamification & Rewards',
    icon: 'emoji_events',
    items: [
      {
        q: 'How do I earn points?',
        a: 'You earn points for daily logins (10 pts), reading sessions, completing books, creating notes, and reaching milestones. Check the Rewards page for the full points breakdown.',
      },
      {
        q: 'What are achievements?',
        a: 'Achievements are badges you earn for specific accomplishments — like reading your first book, maintaining a 7-day streak, or creating 50 notes. Visit the Achievements page to see them all.',
      },
      {
        q: 'How does the leaderboard work?',
        a: 'The leaderboard ranks readers by total points. It refreshes regularly so you can see how you compare with other ShelfQuest readers. Keep reading to climb the ranks!',
      },
      {
        q: 'Can I unlock new themes?',
        a: 'Yes! As you progress through reading tiers, new color themes become available in Settings > Appearance & Themes. Higher tiers unlock more exclusive themes.',
      },
    ],
  },
  {
    category: 'Account & Login',
    icon: 'account_circle',
    items: [
      {
        q: 'How do I sign in with Google?',
        a: 'On the login or sign-up page, tap the "Sign in with Google" button. If you already have a ShelfQuest account with the same email, your Google account will be linked automatically.',
      },
      {
        q: 'I forgot my password. How do I reset it?',
        a: 'On the login page, tap "Forgot password?" and enter your email address. You\'ll receive a reset link to create a new password. If your account uses Google Sign-In only, you don\'t need a password.',
      },
      {
        q: 'How do I change my password?',
        a: 'Go to Settings and look for the password change option. You\'ll need to enter your current password and then your new password. This doesn\'t apply to Google-only accounts.',
      },
      {
        q: 'How is my data protected?',
        a: 'ShelfQuest uses encrypted connections (HTTPS), secure authentication tokens, and your passwords are hashed with bcrypt. We never store plain-text passwords. See our Privacy Policy for full details.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings > Privacy > Delete Account. You\'ll need to confirm with your password. This permanently removes your account and all associated data.',
      },
    ],
  },
  {
    category: 'Troubleshooting',
    icon: 'build',
    items: [
      {
        q: 'The app isn\'t loading properly. What should I do?',
        a: 'Try refreshing the page. If that doesn\'t help, clear your browser cache and cookies for shelfquest.org, then reload. On mobile, you can also try closing and reopening the app.',
      },
      {
        q: 'My reading progress isn\'t showing up.',
        a: 'Progress updates may take a moment to sync. Make sure you\'re connected to the internet and try refreshing the page. If you were reading offline, progress will sync once you\'re back online.',
      },
      {
        q: 'I can\'t upload a book. What\'s wrong?',
        a: 'Make sure the file is in EPUB format and under the size limit. Check your internet connection and try again. If the issue persists, try a different browser or clear your cache.',
      },
      {
        q: 'Google Sign-In isn\'t working.',
        a: 'Ensure pop-ups are allowed for shelfquest.org in your browser settings. Try disabling any ad blockers temporarily. If the popup appears but login fails, try clearing cookies and signing in again.',
      },
    ],
  },
];

const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="faq-item">
      <button
        className="faq-item-question"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{question}</span>
        <span className={`material-symbols-outlined faq-item-expand-icon ${open ? 'open' : ''}`}>
          expand_more
        </span>
      </button>
      {open && <div className="faq-item-answer">{answer}</div>}
    </div>
  );
};

const HelpFAQPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    if (!search.trim()) return faqData;

    const term = search.toLowerCase();
    return faqData
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.q.toLowerCase().includes(term) ||
            item.a.toLowerCase().includes(term)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [search]);

  return (
    <div className="help-faq-page">
      <div className="help-faq-header">
        <button
          className="help-faq-back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="md-headline-medium" style={{ margin: 0 }}>Help & FAQ</h1>
      </div>
      <p className="help-faq-subtitle md-body-medium">
        Find answers to common questions about ShelfQuest.
      </p>

      <div className="help-faq-search">
        <span className="material-symbols-outlined help-faq-search-icon">search</span>
        <input
          type="text"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredData.length === 0 ? (
        <div className="help-faq-no-results">
          <span className="material-symbols-outlined">search_off</span>
          <p className="md-body-large">No results found for "{search}"</p>
          <p className="md-body-medium">Try different keywords or browse all categories below.</p>
          <button
            className="md3-button md3-button--tonal"
            style={{ marginTop: 12 }}
            onClick={() => setSearch('')}
          >
            Clear search
          </button>
        </div>
      ) : (
        filteredData.map((category) => (
          <div key={category.category} className="faq-category">
            <div className="faq-category-header">
              <div className="faq-category-icon">
                <span className="material-symbols-outlined">{category.icon}</span>
              </div>
              <h2 className="faq-category-title">{category.category}</h2>
            </div>
            {category.items.map((item) => (
              <FAQItem key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        ))
      )}

      <div className="help-faq-contact">
        <h2>Still need help?</h2>
        <p>Can't find what you're looking for? Send us a message and we'll get back to you.</p>
        <button
          className="md3-button md3-button--filled"
          onClick={() => navigate('/feedback')}
        >
          <span className="material-symbols-outlined" style={{ marginRight: 8, fontSize: 20 }}>
            feedback
          </span>
          Contact Us
        </button>
      </div>
    </div>
  );
};

export default HelpFAQPage;
