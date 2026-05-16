// src/pages/GoalsPage.jsx
import { useMemo } from 'react';
import { useGamification } from '../contexts/GamificationContext';
import AchievementSystem from '../components/gamification/AchievementSystem';
import GoalSystem from '../components/gamification/GoalSystem';

/**
 * GoalsPage — revives the AchievementSystem + GoalSystem gamification
 * components (formerly only rendered by the removed pages/library
 * EnhancedStatisticsPage) on a dedicated /goals route, wired to the
 * live GamificationContext instead of the old hardcoded data.
 */
const pageStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px 16px 48px',
};

const headerStyle = {
  marginBottom: '32px',
};

const titleStyle = {
  fontSize: '28px',
  fontWeight: 700,
  color: 'var(--md-sys-color-on-surface)',
  margin: 0,
};

const subtitleStyle = {
  fontSize: '14px',
  color: 'var(--md-sys-color-on-surface-variant)',
  marginTop: '6px',
};

const sectionTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '20px',
  fontWeight: 600,
  color: 'var(--md-sys-color-on-surface)',
  margin: '0 0 16px',
};

const GoalsPage = () => {
  const {
    achievements = [],
    goals = [],
    ACHIEVEMENTS = {},
    createGoal,
    trackAction,
  } = useGamification();

  // AchievementSystem expects a flat array of unlocked achievement IDs.
  // The context stores achievements as objects ({ id, ... }); tolerate
  // either shape so the page survives both online and offline data paths.
  const unlockedIds = useMemo(
    () => achievements.map(a => (typeof a === 'string' ? a : a?.id)).filter(Boolean),
    [achievements]
  );

  // GoalSystem's GoalItem reads currentValue/targetValue/progress, but the
  // context stores goals with current/target. Adapt so progress bars render.
  const adaptedGoals = useMemo(
    () => goals.map(goal => {
      const currentValue = goal.currentValue ?? goal.current ?? 0;
      const targetValue = goal.targetValue ?? goal.target ?? 0;
      const progress = goal.progress ?? (
        targetValue > 0 ? Math.min(100, Math.round((currentValue / targetValue) * 100)) : 0
      );
      return {
        ...goal,
        currentValue,
        targetValue,
        progress,
        reward: goal.reward ?? 0,
        type: goal.type ?? 'goal',
      };
    }),
    [goals]
  );

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Goals &amp; Achievements</h1>
        <p style={subtitleStyle}>
          Track your reading milestones and set new targets to stay motivated.
        </p>
      </header>

      <section aria-label="Achievements" style={{ marginBottom: '40px' }}>
        <h2 style={sectionTitleStyle}>
          <span className="material-symbols-outlined" aria-hidden="true">emoji_events</span>
          Achievements
        </h2>
        <AchievementSystem
          achievements={unlockedIds}
          ACHIEVEMENTS={ACHIEVEMENTS}
          showAll
        />
      </section>

      <section aria-label="Goals">
        <h2 style={sectionTitleStyle}>
          <span className="material-symbols-outlined" aria-hidden="true">flag</span>
          Goals
        </h2>
        <GoalSystem
          goals={adaptedGoals}
          onComplete={(goal) => trackAction?.('goal_completed', { goalId: goal.id, reward: goal.reward })}
          onCreateGoal={(goal) => createGoal?.(goal)}
        />
      </section>
    </div>
  );
};

export default GoalsPage;
