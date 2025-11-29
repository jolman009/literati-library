// src/components/gamification/ChallengeCard.jsx
import React, { useState } from 'react';
import { MD3Card } from '../Material3';
import './ChallengeCard.css';

/**
 * ChallengeCard - Displays a single challenge with progress
 * Used for both daily and weekly challenges
 */
const ChallengeCard = ({ challenge, onClaim, compact = false }) => {
  const [claiming, setClaiming] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const {
    id,
    title,
    description,
    icon,
    reward_points,
    requirement_value,
    current_progress,
    progress_percent,
    is_completed,
    reward_claimed,
    type,
    period_start
  } = challenge;

  const handleClaim = async () => {
    if (claiming || !is_completed || reward_claimed) return;

    setClaiming(true);
    try {
      await onClaim?.(id, type, period_start);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    } catch (error) {
      console.error('Error claiming reward:', error);
    } finally {
      setClaiming(false);
    }
  };

  const getStatusBadge = () => {
    if (reward_claimed) {
      return <span className="challenge-badge claimed">Claimed</span>;
    }
    if (is_completed) {
      return <span className="challenge-badge ready">Ready to Claim!</span>;
    }
    return null;
  };

  const getProgressText = () => {
    if (reward_claimed) return 'Completed!';
    return `${current_progress} / ${requirement_value}`;
  };

  return (
    <MD3Card
      variant="outlined"
      className={`challenge-card ${type} ${is_completed ? 'completed' : ''} ${reward_claimed ? 'claimed' : ''} ${compact ? 'compact' : ''} ${showCelebration ? 'celebrating' : ''}`}
    >
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="challenge-celebration">
          <span className="celebration-emoji">🎉</span>
          <span className="celebration-text">+{reward_points} pts!</span>
        </div>
      )}

      <div className="challenge-content">
        {/* Icon and Type Badge */}
        <div className="challenge-header">
          <div className="challenge-icon-wrapper">
            <span className="material-symbols-outlined challenge-icon">{icon}</span>
          </div>
          <span className={`challenge-type-badge ${type}`}>
            {type === 'daily' ? 'Daily' : 'Weekly'}
          </span>
          {getStatusBadge()}
        </div>

        {/* Title and Description */}
        <div className="challenge-info">
          <h4 className="challenge-title">{title}</h4>
          {!compact && <p className="challenge-description">{description}</p>}
        </div>

        {/* Progress Bar */}
        <div className="challenge-progress-section">
          <div className="challenge-progress-header">
            <span className="challenge-progress-text">{getProgressText()}</span>
            <span className="challenge-reward">
              <span className="material-symbols-outlined reward-icon">stars</span>
              {reward_points} pts
            </span>
          </div>
          <div className="challenge-progress-bar">
            <div
              className="challenge-progress-fill"
              style={{ width: `${Math.min(100, progress_percent)}%` }}
            />
          </div>
        </div>

        {/* Claim Button */}
        {is_completed && !reward_claimed && (
          <button
            className={`challenge-claim-btn ${claiming ? 'claiming' : ''}`}
            onClick={handleClaim}
            disabled={claiming}
          >
            {claiming ? (
              <>
                <span className="material-symbols-outlined spinning">sync</span>
                Claiming...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">redeem</span>
                Claim Reward
              </>
            )}
          </button>
        )}
      </div>
    </MD3Card>
  );
};

export default ChallengeCard;
