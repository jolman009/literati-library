/**
 * Goal Templates Library
 * Pre-made goal templates for easy goal creation
 * Organized by category with smart defaults
 */

export const GOAL_CATEGORIES = {
  READING_TIME: 'reading_time',
  PAGES: 'pages',
  BOOKS: 'books',
  STREAK: 'streak',
  NOTES: 'notes',
  CHALLENGE: 'challenge'
};

export const GOAL_TEMPLATES = [
  // ============================================
  // READING TIME GOALS
  // ============================================
  {
    id: 'power_hour',
    name: 'Power Hour',
    description: 'Read for 60 minutes every day',
    category: GOAL_CATEGORIES.READING_TIME,
    icon: 'timer',
    type: 'time',
    targetValue: 60,
    period: 'daily',
    reward: 50,
    difficulty: 'medium',
    popular: true,
    tips: 'Try reading first thing in the morning or before bed!'
  },
  {
    id: 'morning_reader',
    name: 'Morning Reader',
    description: 'Read for 30 minutes in the morning',
    category: GOAL_CATEGORIES.READING_TIME,
    icon: 'wb_sunny',
    type: 'time',
    targetValue: 30,
    period: 'daily',
    reward: 30,
    difficulty: 'easy',
    tips: 'Set your alarm 30 minutes earlier and enjoy peaceful reading time.'
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Read for 3 hours over the weekend',
    category: GOAL_CATEGORIES.READING_TIME,
    icon: 'weekend',
    type: 'time',
    targetValue: 180,
    period: 'weekly',
    reward: 75,
    difficulty: 'medium',
    tips: 'Perfect for catching up on your reading list!'
  },
  {
    id: 'marathon_month',
    name: 'Marathon Month',
    description: 'Read for 20 hours this month',
    category: GOAL_CATEGORIES.READING_TIME,
    icon: 'calendar_month',
    type: 'time',
    targetValue: 1200,
    period: 'monthly',
    reward: 200,
    difficulty: 'hard',
    tips: 'That\'s about 40 minutes a day - totally doable!'
  },

  // ============================================
  // PAGES GOALS
  // ============================================
  {
    id: 'page_a_day',
    name: '25 Pages a Day',
    description: 'Read at least 25 pages daily',
    category: GOAL_CATEGORIES.PAGES,
    icon: 'article',
    type: 'pages',
    targetValue: 25,
    period: 'daily',
    reward: 25,
    difficulty: 'easy',
    popular: true,
    tips: 'A small daily goal that adds up to big results!'
  },
  {
    id: 'fifty_pages',
    name: 'Fifty Pages',
    description: 'Read 50 pages in one day',
    category: GOAL_CATEGORIES.PAGES,
    icon: 'menu_book',
    type: 'pages',
    targetValue: 50,
    period: 'daily',
    reward: 50,
    difficulty: 'medium',
    tips: 'Perfect for a lazy Sunday reading session.'
  },
  {
    id: 'century_club',
    name: 'Century Club',
    description: 'Read 100 pages in one sitting',
    category: GOAL_CATEGORIES.PAGES,
    icon: 'military_tech',
    type: 'pages',
    targetValue: 100,
    period: 'daily',
    reward: 100,
    difficulty: 'hard',
    tips: 'Find a cozy spot and get lost in your book!'
  },
  {
    id: 'weekly_500',
    name: '500 Pages Week',
    description: 'Read 500 pages this week',
    category: GOAL_CATEGORIES.PAGES,
    icon: 'auto_stories',
    type: 'pages',
    targetValue: 500,
    period: 'weekly',
    reward: 150,
    difficulty: 'hard',
    tips: 'About 70 pages a day - great for avid readers!'
  },

  // ============================================
  // BOOKS GOALS
  // ============================================
  {
    id: 'book_a_month',
    name: 'Book a Month',
    description: 'Complete one book this month',
    category: GOAL_CATEGORIES.BOOKS,
    icon: 'book',
    type: 'books',
    targetValue: 1,
    period: 'monthly',
    reward: 100,
    difficulty: 'easy',
    popular: true,
    tips: 'Start with books you\'re excited about!'
  },
  {
    id: 'two_books_month',
    name: 'Double Feature',
    description: 'Complete two books this month',
    category: GOAL_CATEGORIES.BOOKS,
    icon: 'library_books',
    type: 'books',
    targetValue: 2,
    period: 'monthly',
    reward: 175,
    difficulty: 'medium',
    tips: 'Mix a quick read with something longer.'
  },
  {
    id: 'book_a_week',
    name: 'Book a Week',
    description: 'Complete one book every week',
    category: GOAL_CATEGORIES.BOOKS,
    icon: 'speed',
    type: 'books',
    targetValue: 1,
    period: 'weekly',
    reward: 150,
    difficulty: 'hard',
    tips: 'Choose shorter books or read fast-paced genres!'
  },
  {
    id: 'yearly_52',
    name: '52 Book Challenge',
    description: 'Read 52 books this year (1 per week)',
    category: GOAL_CATEGORIES.BOOKS,
    icon: 'emoji_events',
    type: 'books',
    targetValue: 52,
    period: 'yearly',
    reward: 1000,
    difficulty: 'expert',
    popular: true,
    tips: 'The classic reading challenge! Track your progress all year.'
  },

  // ============================================
  // STREAK GOALS
  // ============================================
  {
    id: 'streak_starter',
    name: 'Streak Starter',
    description: 'Maintain a 3-day reading streak',
    category: GOAL_CATEGORIES.STREAK,
    icon: 'local_fire_department',
    type: 'streak',
    targetValue: 3,
    period: 'ongoing',
    reward: 50,
    difficulty: 'easy',
    tips: 'Just a few minutes each day counts!'
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day reading streak',
    category: GOAL_CATEGORIES.STREAK,
    icon: 'whatshot',
    type: 'streak',
    targetValue: 7,
    period: 'ongoing',
    reward: 100,
    difficulty: 'medium',
    popular: true,
    tips: 'One full week of daily reading!'
  },
  {
    id: 'fortnight_focus',
    name: 'Fortnight Focus',
    description: 'Maintain a 14-day reading streak',
    category: GOAL_CATEGORIES.STREAK,
    icon: 'bolt',
    type: 'streak',
    targetValue: 14,
    period: 'ongoing',
    reward: 175,
    difficulty: 'medium',
    tips: 'Two weeks builds a real habit!'
  },
  {
    id: 'monthly_dedication',
    name: 'Monthly Dedication',
    description: 'Maintain a 30-day reading streak',
    category: GOAL_CATEGORIES.STREAK,
    icon: 'stars',
    type: 'streak',
    targetValue: 30,
    period: 'ongoing',
    reward: 300,
    difficulty: 'hard',
    tips: 'After 30 days, reading becomes automatic!'
  },

  // ============================================
  // NOTES GOALS
  // ============================================
  {
    id: 'note_ninja',
    name: 'Note Ninja',
    description: 'Create 5 notes per book',
    category: GOAL_CATEGORIES.NOTES,
    icon: 'edit_note',
    type: 'notes',
    targetValue: 5,
    period: 'per_book',
    reward: 50,
    difficulty: 'easy',
    tips: 'Capture key insights as you read!'
  },
  {
    id: 'highlight_hero',
    name: 'Highlight Hero',
    description: 'Create 10 highlights this week',
    category: GOAL_CATEGORIES.NOTES,
    icon: 'highlight',
    type: 'highlights',
    targetValue: 10,
    period: 'weekly',
    reward: 40,
    difficulty: 'easy',
    tips: 'Mark passages that resonate with you.'
  },
  {
    id: 'annotation_master',
    name: 'Annotation Master',
    description: 'Create 20 notes this month',
    category: GOAL_CATEGORIES.NOTES,
    icon: 'rate_review',
    type: 'notes',
    targetValue: 20,
    period: 'monthly',
    reward: 100,
    difficulty: 'medium',
    popular: true,
    tips: 'Your future self will thank you for these notes!'
  },

  // ============================================
  // CHALLENGE GOALS (Special/Themed)
  // ============================================
  {
    id: 'genre_explorer',
    name: 'Genre Explorer',
    description: 'Read from 3 different genres this month',
    category: GOAL_CATEGORIES.CHALLENGE,
    icon: 'explore',
    type: 'genres',
    targetValue: 3,
    period: 'monthly',
    reward: 150,
    difficulty: 'medium',
    tips: 'Step outside your comfort zone!'
  },
  {
    id: 'classic_reader',
    name: 'Classic Reader',
    description: 'Read a book published before 1950',
    category: GOAL_CATEGORIES.CHALLENGE,
    icon: 'history',
    type: 'special',
    targetValue: 1,
    period: 'monthly',
    reward: 100,
    difficulty: 'medium',
    tips: 'Discover timeless literature!'
  },
  {
    id: 'long_form',
    name: 'Long Form',
    description: 'Complete a book over 400 pages',
    category: GOAL_CATEGORIES.CHALLENGE,
    icon: 'straighten',
    type: 'special',
    targetValue: 400,
    period: 'monthly',
    reward: 150,
    difficulty: 'hard',
    tips: 'Tackle that epic you\'ve been putting off!'
  },
  {
    id: 'new_author',
    name: 'New Author',
    description: 'Read a book by an author you\'ve never read before',
    category: GOAL_CATEGORIES.CHALLENGE,
    icon: 'person_search',
    type: 'special',
    targetValue: 1,
    period: 'monthly',
    reward: 75,
    difficulty: 'easy',
    tips: 'Discover your next favorite author!'
  }
];

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category) => {
  if (!category) return GOAL_TEMPLATES;
  return GOAL_TEMPLATES.filter(t => t.category === category);
};

/**
 * Get popular templates
 */
export const getPopularTemplates = () => {
  return GOAL_TEMPLATES.filter(t => t.popular);
};

/**
 * Get templates by difficulty
 */
export const getTemplatesByDifficulty = (difficulty) => {
  return GOAL_TEMPLATES.filter(t => t.difficulty === difficulty);
};

/**
 * Get template by ID
 */
export const getTemplateById = (id) => {
  return GOAL_TEMPLATES.find(t => t.id === id);
};

/**
 * Get difficulty color
 */
export const getDifficultyColor = (difficulty) => {
  const colors = {
    easy: '#22c55e',
    medium: '#f59e0b',
    hard: '#ef4444',
    expert: '#8b5cf6'
  };
  return colors[difficulty] || '#6b7280';
};

/**
 * Get category icon
 */
export const getCategoryIcon = (category) => {
  const icons = {
    [GOAL_CATEGORIES.READING_TIME]: 'schedule',
    [GOAL_CATEGORIES.PAGES]: 'menu_book',
    [GOAL_CATEGORIES.BOOKS]: 'library_books',
    [GOAL_CATEGORIES.STREAK]: 'local_fire_department',
    [GOAL_CATEGORIES.NOTES]: 'edit_note',
    [GOAL_CATEGORIES.CHALLENGE]: 'emoji_events'
  };
  return icons[category] || 'flag';
};

export default GOAL_TEMPLATES;
