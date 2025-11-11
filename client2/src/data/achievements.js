/**
 * ShelfQuest Achievements System
 * Complete achievement definitions with unlock conditions
 */

export const ACHIEVEMENT_CATEGORIES = {
  READING: 'reading',
  CONSISTENCY: 'consistency',
  EXPLORATION: 'exploration',
  SOCIAL: 'social',
  COLLECTION: 'collection',
  MASTERY: 'mastery',
};

export const ACHIEVEMENT_TIERS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
  DIAMOND: 'diamond',
};

/**
 * All available achievements
 * Each achievement has:
 * - id: unique identifier
 * - title: display name
 * - description: what it takes to earn
 * - category: achievement type
 * - tier: difficulty/prestige level
 * - icon: Material Symbol icon name
 * - points: gamification points awarded
 * - requirement: condition to unlock
 * - secret: hidden until unlocked (optional)
 * - rewardMessage: celebration message on unlock
 */
export const ACHIEVEMENTS = [
  // ============================================
  // READING ACHIEVEMENTS
  // ============================================
  {
    id: 'first_book',
    title: 'First Chapter',
    description: 'Complete your first book',
    category: ACHIEVEMENT_CATEGORIES.READING,
    tier: ACHIEVEMENT_TIERS.BRONZE,
    icon: 'book',
    points: 100,
    requirement: { type: 'books_completed', count: 1 },
    rewardMessage: 'You\'ve completed your first book! The journey begins!',
  },
  {
    id: 'bookworm',
    title: 'Bookworm',
    description: 'Complete 5 books',
    category: ACHIEVEMENT_CATEGORIES.READING,
    tier: ACHIEVEMENT_TIERS.SILVER,
    icon: 'auto_stories',
    points: 250,
    requirement: { type: 'books_completed', count: 5 },
    rewardMessage: 'Five books down! You\'re building great habits!',
  },
  {
    id: 'avid_reader',
    title: 'Avid Reader',
    description: 'Complete 10 books',
    category: ACHIEVEMENT_CATEGORIES.READING,
    tier: ACHIEVEMENT_TIERS.GOLD,
    icon: 'library_books',
    points: 500,
    requirement: { type: 'books_completed', count: 10 },
    rewardMessage: 'Ten books completed! You\'re officially an avid reader!',
  },
  {
    id: 'bibliophile',
    title: 'Bibliophile',
    description: 'Complete 25 books',
    category: ACHIEVEMENT_CATEGORIES.READING,
    tier: ACHIEVEMENT_TIERS.PLATINUM,
    icon: 'collections_bookmark',
    points: 1000,
    requirement: { type: 'books_completed', count: 25 },
    rewardMessage: 'Twenty-five books! Your dedication is inspiring!',
  },
  {
    id: 'literary_legend',
    title: 'Literary Legend',
    description: 'Complete 50 books',
    category: ACHIEVEMENT_CATEGORIES.READING,
    tier: ACHIEVEMENT_TIERS.DIAMOND,
    icon: 'workspace_premium',
    points: 2500,
    requirement: { type: 'books_completed', count: 50 },
    secret: true,
    rewardMessage: 'FIFTY BOOKS! You are a literary legend! 🌟',
  },

  // ============================================
  // CONSISTENCY ACHIEVEMENTS
  // ============================================
  {
    id: 'daily_reader',
    title: 'Daily Reader',
    description: 'Read 3 days in a row',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    tier: ACHIEVEMENT_TIERS.BRONZE,
    icon: 'today',
    points: 150,
    requirement: { type: 'streak', count: 3 },
    rewardMessage: 'Three days strong! Consistency is key!',
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Maintain a 7-day reading streak',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    tier: ACHIEVEMENT_TIERS.SILVER,
    icon: 'calendar_today',
    points: 300,
    requirement: { type: 'streak', count: 7 },
    rewardMessage: 'One week streak! You\'re building amazing habits!',
  },
  {
    id: 'monthly_master',
    title: 'Monthly Master',
    description: 'Maintain a 30-day reading streak',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    tier: ACHIEVEMENT_TIERS.GOLD,
    icon: 'event',
    points: 750,
    requirement: { type: 'streak', count: 30 },
    rewardMessage: 'Thirty days straight! You\'re a reading machine!',
  },
  {
    id: 'century_streak',
    title: 'Century Streak',
    description: 'Maintain a 100-day reading streak',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    tier: ACHIEVEMENT_TIERS.PLATINUM,
    icon: 'bolt',
    points: 2000,
    requirement: { type: 'streak', count: 100 },
    rewardMessage: '100 days! Your dedication is extraordinary!',
  },
  {
    id: 'unstoppable',
    title: 'Unstoppable',
    description: 'Maintain a 365-day reading streak',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    tier: ACHIEVEMENT_TIERS.DIAMOND,
    icon: 'local_fire_department',
    points: 5000,
    requirement: { type: 'streak', count: 365 },
    secret: true,
    rewardMessage: 'ONE FULL YEAR! You are truly unstoppable! 🔥',
  },

  // ============================================
  // EXPLORATION ACHIEVEMENTS
  // ============================================
  {
    id: 'genre_explorer',
    title: 'Genre Explorer',
    description: 'Read books from 3 different genres',
    category: ACHIEVEMENT_CATEGORIES.EXPLORATION,
    tier: ACHIEVEMENT_TIERS.BRONZE,
    icon: 'explore',
    points: 200,
    requirement: { type: 'unique_genres', count: 3 },
    rewardMessage: 'Exploring different genres! Keep broadening your horizons!',
  },
  {
    id: 'diverse_reader',
    title: 'Diverse Reader',
    description: 'Read books from 5 different genres',
    category: ACHIEVEMENT_CATEGORIES.EXPLORATION,
    tier: ACHIEVEMENT_TIERS.SILVER,
    icon: 'public',
    points: 400,
    requirement: { type: 'unique_genres', count: 5 },
    rewardMessage: 'Five genres mastered! You appreciate variety!',
  },
  {
    id: 'literary_adventurer',
    title: 'Literary Adventurer',
    description: 'Read books from 10 different genres',
    category: ACHIEVEMENT_CATEGORIES.EXPLORATION,
    tier: ACHIEVEMENT_TIERS.GOLD,
    icon: 'flight_takeoff',
    points: 800,
    requirement: { type: 'unique_genres', count: 10 },
    rewardMessage: 'Ten genres! You\'re a true literary adventurer!',
  },
  {
    id: 'note_taker',
    title: 'Note Taker',
    description: 'Create 10 reading notes',
    category: ACHIEVEMENT_CATEGORIES.EXPLORATION,
    tier: ACHIEVEMENT_TIERS.BRONZE,
    icon: 'note_add',
    points: 150,
    requirement: { type: 'notes_created', count: 10 },
    rewardMessage: 'Ten notes! You\'re actively engaging with your reading!',
  },
  {
    id: 'thoughtful_reader',
    title: 'Thoughtful Reader',
    description: 'Create 50 reading notes',
    category: ACHIEVEMENT_CATEGORIES.EXPLORATION,
    tier: ACHIEVEMENT_TIERS.SILVER,
    icon: 'edit_note',
    points: 400,
    requirement: { type: 'notes_created', count: 50 },
    rewardMessage: 'Fifty notes! Your insights are valuable!',
  },

  // ============================================
  // COLLECTION ACHIEVEMENTS
  // ============================================
  {
    id: 'librarian',
    title: 'Librarian',
    description: 'Upload 10 books to your library',
    category: ACHIEVEMENT_CATEGORIES.COLLECTION,
    tier: ACHIEVEMENT_TIERS.BRONZE,
    icon: 'upload_file',
    points: 100,
    requirement: { type: 'books_uploaded', count: 10 },
    rewardMessage: 'Ten books in your library! Nice collection!',
  },
  {
    id: 'curator',
    title: 'Curator',
    description: 'Upload 25 books to your library',
    category: ACHIEVEMENT_CATEGORIES.COLLECTION,
    tier: ACHIEVEMENT_TIERS.SILVER,
    icon: 'inventory_2',
    points: 250,
    requirement: { type: 'books_uploaded', count: 25 },
    rewardMessage: 'Twenty-five books! You\'re curating a great library!',
  },
  {
    id: 'collector',
    title: 'Collector',
    description: 'Upload 50 books to your library',
    category: ACHIEVEMENT_CATEGORIES.COLLECTION,
    tier: ACHIEVEMENT_TIERS.GOLD,
    icon: 'folder_special',
    points: 500,
    requirement: { type: 'books_uploaded', count: 50 },
    rewardMessage: 'Fifty books uploaded! Your library is impressive!',
  },
  {
    id: 'organizer',
    title: 'Organizer',
    description: 'Create 5 book collections',
    category: ACHIEVEMENT_CATEGORIES.COLLECTION,
    tier: ACHIEVEMENT_TIERS.BRONZE,
    icon: 'category',
    points: 150,
    requirement: { type: 'collections_created', count: 5 },
    rewardMessage: 'Five collections! You love staying organized!',
  },

  // ============================================
  // MASTERY ACHIEVEMENTS
  // ============================================
  {
    id: 'speed_reader',
    title: 'Speed Reader',
    description: 'Read 100 pages in one session',
    category: ACHIEVEMENT_CATEGORIES.MASTERY,
    tier: ACHIEVEMENT_TIERS.SILVER,
    icon: 'speed',
    points: 300,
    requirement: { type: 'pages_single_session', count: 100 },
    rewardMessage: '100 pages in one sitting! Impressive focus!',
  },
  {
    id: 'marathon_reader',
    title: 'Marathon Reader',
    description: 'Read for 3 hours straight',
    category: ACHIEVEMENT_CATEGORIES.MASTERY,
    tier: ACHIEVEMENT_TIERS.GOLD,
    icon: 'timer',
    points: 500,
    requirement: { type: 'reading_time_single_session', minutes: 180 },
    rewardMessage: 'Three hours straight! Your endurance is remarkable!',
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Read before 6 AM',
    category: ACHIEVEMENT_CATEGORIES.MASTERY,
    tier: ACHIEVEMENT_TIERS.BRONZE,
    icon: 'wb_twilight',
    points: 200,
    requirement: { type: 'read_early_morning', before_hour: 6 },
    secret: true,
    rewardMessage: 'Reading before dawn! You\'re dedicated!',
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Read after midnight',
    category: ACHIEVEMENT_CATEGORIES.MASTERY,
    tier: ACHIEVEMENT_TIERS.BRONZE,
    icon: 'bedtime',
    points: 200,
    requirement: { type: 'read_late_night', after_hour: 0 },
    secret: true,
    rewardMessage: 'Midnight reading! The best stories happen late!',
  },
  {
    id: 'mentor_master',
    title: 'Mentor Master',
    description: 'Use the AI Mentor 20 times',
    category: ACHIEVEMENT_CATEGORIES.MASTERY,
    tier: ACHIEVEMENT_TIERS.SILVER,
    icon: 'psychology',
    points: 300,
    requirement: { type: 'mentor_uses', count: 20 },
    rewardMessage: 'Twenty mentor sessions! You love deepening your understanding!',
  },

  // ============================================
  // SOCIAL ACHIEVEMENTS
  // ============================================
  {
    id: 'sharer',
    title: 'Sharer',
    description: 'Share your first achievement',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    tier: ACHIEVEMENT_TIERS.BRONZE,
    icon: 'share',
    points: 100,
    requirement: { type: 'achievements_shared', count: 1 },
    rewardMessage: 'First share! Spread the reading love!',
  },
  {
    id: 'influencer',
    title: 'Influencer',
    description: 'Share 10 achievements',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    tier: ACHIEVEMENT_TIERS.SILVER,
    icon: 'trending_up',
    points: 300,
    requirement: { type: 'achievements_shared', count: 10 },
    rewardMessage: 'Ten shares! You\'re inspiring others!',
  },
];

/**
 * Get achievements by category
 */
export const getAchievementsByCategory = (category) => {
  if (!category) return ACHIEVEMENTS;
  return ACHIEVEMENTS.filter(a => a.category === category);
};

/**
 * Get achievements by tier
 */
export const getAchievementsByTier = (tier) => {
  return ACHIEVEMENTS.filter(a => a.tier === tier);
};

/**
 * Calculate total possible points
 */
export const getTotalPossiblePoints = () => {
  return ACHIEVEMENTS.reduce((sum, a) => sum + a.points, 0);
};

/**
 * Get tier color (for UI)
 */
export const getTierColor = (tier) => {
  const colors = {
    [ACHIEVEMENT_TIERS.BRONZE]: '#CD7F32',
    [ACHIEVEMENT_TIERS.SILVER]: '#C0C0C0',
    [ACHIEVEMENT_TIERS.GOLD]: '#FFD700',
    [ACHIEVEMENT_TIERS.PLATINUM]: '#E5E4E2',
    [ACHIEVEMENT_TIERS.DIAMOND]: '#B9F2FF',
  };
  return colors[tier] || '#888';
};

/**
 * Get category icon
 */
export const getCategoryIcon = (category) => {
  const icons = {
    [ACHIEVEMENT_CATEGORIES.READING]: 'menu_book',
    [ACHIEVEMENT_CATEGORIES.CONSISTENCY]: 'local_fire_department',
    [ACHIEVEMENT_CATEGORIES.EXPLORATION]: 'explore',
    [ACHIEVEMENT_CATEGORIES.SOCIAL]: 'groups',
    [ACHIEVEMENT_CATEGORIES.COLLECTION]: 'inventory_2',
    [ACHIEVEMENT_CATEGORIES.MASTERY]: 'workspace_premium',
  };
  return icons[category] || 'emoji_events';
};

export default ACHIEVEMENTS;
