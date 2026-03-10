// src/components/UpgradePrompt.jsx — Shown when free users hit AI limits
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Crown } from 'lucide-react';
import './UpgradePrompt.css';

export default function UpgradePrompt({ used = 0, limit = 5, feature = 'AI features', onDismiss }) {
  const navigate = useNavigate();

  return (
    <div className="upgrade-prompt">
      <div className="upgrade-prompt__icon">
        <Crown size={32} />
      </div>
      <h3 className="upgrade-prompt__title">Upgrade to ShelfQuest Pro</h3>

      <div className="upgrade-prompt__usage">
        <div className="upgrade-prompt__bar-track">
          <div
            className="upgrade-prompt__bar-fill"
            style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
          />
        </div>
        <p className="upgrade-prompt__usage-text">
          {used} of {limit} free {feature} used this month
        </p>
      </div>

      <p className="upgrade-prompt__description">
        Get unlimited AI-powered recommendations, Mentor AI discussions, quizzes, and note enhancement.
      </p>

      <div className="upgrade-prompt__pricing">
        <div className="upgrade-prompt__plan">
          <span className="upgrade-prompt__price">$4.99</span>
          <span className="upgrade-prompt__period">/month</span>
        </div>
        <div className="upgrade-prompt__plan upgrade-prompt__plan--popular">
          <span className="upgrade-prompt__badge">Best Value</span>
          <span className="upgrade-prompt__price">$39.99</span>
          <span className="upgrade-prompt__period">/year</span>
        </div>
        <div className="upgrade-prompt__plan">
          <span className="upgrade-prompt__price">$79.99</span>
          <span className="upgrade-prompt__period">lifetime</span>
        </div>
      </div>

      <div className="upgrade-prompt__actions">
        <button
          className="upgrade-prompt__cta"
          onClick={() => navigate('/pricing')}
        >
          <Zap size={16} />
          View Plans
        </button>
        {onDismiss && (
          <button className="upgrade-prompt__dismiss" onClick={onDismiss}>
            Maybe later
          </button>
        )}
      </div>
    </div>
  );
}

// Inline badge showing remaining AI credits for free users
export function AICreditsBadge({ used = 0, limit = 5, isPremium = false }) {
  if (isPremium) {
    return (
      <span className="ai-credits-badge ai-credits-badge--pro">
        <Sparkles size={12} />
        Pro
      </span>
    );
  }

  const remaining = Math.max(0, limit - used);
  const isLow = remaining <= 2;

  return (
    <span className={`ai-credits-badge ${isLow ? 'ai-credits-badge--low' : ''}`}>
      <Zap size={12} />
      {remaining} AI left
    </span>
  );
}
