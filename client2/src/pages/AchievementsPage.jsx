import { useState, useMemo } from 'react';
import { useGamification } from '../contexts/GamificationContext';
import BottomSheet from '../components/BottomSheet';
import haptics from '../utils/haptics';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_TIERS,
  getAchievementsByCategory,
  getTierColor,
  getCategoryIcon,
  getTotalPossiblePoints,
} from '../data/achievements';
import '../styles/achievements-page.css';

/**
 * Achievement Card Component
 */
const AchievementCard = ({ achievement, isUnlocked, onCardClick }) => {
  const tierColor = getTierColor(achievement.tier);

  const handleClick = () => {
    haptics.lightTap();
    onCardClick(achievement);
  };

  return (
    <button
      className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'} ${achievement.secret && !isUnlocked ? 'secret' : ''}`}
      onClick={handleClick}
      style={{
        '--tier-color': tierColor,
      }}
    >
      {/* Tier Badge */}
      <div className="achievement-tier-badge" style={{ backgroundColor: tierColor }}>
        {achievement.tier}
      </div>

      {/* Icon */}
      <div className="achievement-icon">
        <span className="material-symbols-outlined">
          {achievement.secret && !isUnlocked ? 'lock' : achievement.icon}
        </span>
      </div>

      {/* Content */}
      <div className="achievement-content">
        <h3 className="achievement-title">
          {achievement.secret && !isUnlocked ? '???' : achievement.title}
        </h3>
        <p className="achievement-description">
          {achievement.secret && !isUnlocked
            ? 'Secret achievement - keep exploring!'
            : achievement.description}
        </p>
      </div>

      {/* Points Badge */}
      <div className="achievement-points">
        <span className="material-symbols-outlined">stars</span>
        <span>{achievement.points}</span>
      </div>

      {/* Unlocked indicator */}
      {isUnlocked && (
        <div className="achievement-unlocked-badge">
          <span className="material-symbols-outlined">check_circle</span>
        </div>
      )}
    </button>
  );
};

/**
 * Main Achievements Page
 */
const AchievementsPage = () => {
  const { state: gamificationState } = useGamification();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Get user's unlocked achievements
  const unlockedAchievements = useMemo(() => {
    return gamificationState?.achievements || [];
  }, [gamificationState?.achievements]);

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    let filtered = ACHIEVEMENTS;

    if (selectedCategory !== 'all') {
      filtered = getAchievementsByCategory(selectedCategory);
    }

    if (selectedTier !== 'all') {
      filtered = filtered.filter(a => a.tier === selectedTier);
    }

    return filtered;
  }, [selectedCategory, selectedTier]);

  // Statistics
  const unlockedCount = unlockedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);
  const totalEarnedPoints = useMemo(() => {
    return ACHIEVEMENTS
      .filter(a => unlockedAchievements.includes(a.id))
      .reduce((sum, a) => sum + a.points, 0);
  }, [unlockedAchievements]);
  const totalPossiblePoints = getTotalPossiblePoints();

  // Category stats
  const categoryStats = useMemo(() => {
    return Object.values(ACHIEVEMENT_CATEGORIES).map(category => {
      const categoryAchievements = getAchievementsByCategory(category);
      const unlocked = categoryAchievements.filter(a =>
        unlockedAchievements.includes(a.id)
      ).length;

      return {
        category,
        icon: getCategoryIcon(category),
        label: category.charAt(0).toUpperCase() + category.slice(1),
        unlocked,
        total: categoryAchievements.length,
        percentage: Math.round((unlocked / categoryAchievements.length) * 100),
      };
    });
  }, [unlockedAchievements]);

  // Handle card click
  const handleAchievementClick = (achievement) => {
    setSelectedAchievement(achievement);
    setShowDetailModal(true);
  };

  // Handle share
  const handleShare = async (achievement) => {
    haptics.mediumTap();

    const isUnlocked = unlockedAchievements.includes(achievement.id);
    if (!isUnlocked) return;

    const shareData = {
      title: `ShelfQuest Achievement: ${achievement.title}`,
      text: `I just unlocked "${achievement.title}" on ShelfQuest! ${achievement.rewardMessage}`,
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        haptics.success();
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareData.url}`
        );
        alert('Achievement copied to clipboard!');
        haptics.success();
      }
    } catch (error) {
      console.warn('Share cancelled or failed:', error);
    }
  };

  return (
    <div className="achievements-page">
      {/* Header Stats */}
      <div className="achievements-header">
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <span className="material-symbols-outlined">emoji_events</span>
            </div>
            <div className="stat-content">
              <div className="stat-value">{unlockedCount} / {totalCount}</div>
              <div className="stat-label">Achievements</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <span className="material-symbols-outlined">stars</span>
            </div>
            <div className="stat-content">
              <div className="stat-value">{totalEarnedPoints.toLocaleString()}</div>
              <div className="stat-label">Points Earned</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <span className="material-symbols-outlined">percent</span>
            </div>
            <div className="stat-content">
              <div className="stat-value">{completionPercentage}%</div>
              <div className="stat-label">Complete</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="achievements-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="progress-text">
            {unlockedCount} of {totalCount} achievements unlocked
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="category-tabs">
        <button
          className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => {
            setSelectedCategory('all');
            haptics.selection();
          }}
        >
          <span className="material-symbols-outlined">grid_view</span>
          <span>All</span>
          <span className="tab-count">{ACHIEVEMENTS.length}</span>
        </button>

        {categoryStats.map(({ category, icon, label, unlocked, total }) => (
          <button
            key={category}
            className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory(category);
              haptics.selection();
            }}
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span>{label}</span>
            <span className="tab-count">{unlocked}/{total}</span>
          </button>
        ))}
      </div>

      {/* Tier Filter */}
      <div className="tier-filter">
        <label>Filter by tier:</label>
        <div className="tier-buttons">
          <button
            className={`tier-btn ${selectedTier === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedTier('all')}
          >
            All
          </button>
          {Object.values(ACHIEVEMENT_TIERS).map(tier => (
            <button
              key={tier}
              className={`tier-btn ${selectedTier === tier ? 'active' : ''}`}
              onClick={() => setSelectedTier(tier)}
              style={{ borderColor: getTierColor(tier) }}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="achievements-grid">
        {filteredAchievements.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined">search_off</span>
            <h3>No achievements found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          filteredAchievements.map(achievement => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              isUnlocked={unlockedAchievements.includes(achievement.id)}
              onCardClick={handleAchievementClick}
            />
          ))
        )}
      </div>

      {/* Detail Modal */}
      <BottomSheet
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        height="medium"
        showHandle={true}
      >
        {selectedAchievement && (
          <div className="achievement-detail">
            <div
              className="detail-header"
              style={{ '--tier-color': getTierColor(selectedAchievement.tier) }}
            >
              <div className="detail-icon">
                <span className="material-symbols-outlined">
                  {selectedAchievement.icon}
                </span>
              </div>
              <h2>{selectedAchievement.title}</h2>
              <div className="detail-tier-badge">
                {selectedAchievement.tier} Tier
              </div>
            </div>

            <div className="detail-body">
              <div className="detail-section">
                <h3>Description</h3>
                <p>{selectedAchievement.description}</p>
              </div>

              <div className="detail-section">
                <h3>Reward</h3>
                <div className="detail-reward">
                  <span className="material-symbols-outlined">stars</span>
                  <span>{selectedAchievement.points} Points</span>
                </div>
              </div>

              {unlockedAchievements.includes(selectedAchievement.id) ? (
                <>
                  <div className="detail-section">
                    <div className="detail-unlocked">
                      <span className="material-symbols-outlined">check_circle</span>
                      <span>Achievement Unlocked!</span>
                    </div>
                    <p className="reward-message">{selectedAchievement.rewardMessage}</p>
                  </div>

                  <button
                    className="share-button"
                    onClick={() => handleShare(selectedAchievement)}
                  >
                    <span className="material-symbols-outlined">share</span>
                    <span>Share Achievement</span>
                  </button>
                </>
              ) : (
                <div className="detail-section">
                  <div className="detail-locked">
                    <span className="material-symbols-outlined">lock</span>
                    <span>Not Yet Unlocked</span>
                  </div>
                  <p>Complete the requirement to unlock this achievement!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default AchievementsPage;
