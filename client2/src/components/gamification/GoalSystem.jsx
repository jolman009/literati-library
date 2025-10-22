
// src/components/gamification/GoalSystem.jsx
import React, { useState } from 'react';
import { MD3Card } from '../Material3';

const GoalItem = ({ goal, onComplete }) => {
  const isCompleted = goal.progress >= 100;
  const progressWidth = Math.min(100, goal.progress);

  return (
    <MD3Card
      variant="outlined"
      style={{
        padding: '24px',
        transition: 'all 0.3s ease',
        background: isCompleted ? 'color-mix(in srgb, #22c55e 15%, var(--md-sys-color-surface-container))' : 'var(--md-sys-color-surface-container)',
        border: `3px solid ${isCompleted ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)'
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--md-sys-color-on-surface)' }}>
            {goal.title}
          </h4>
          <p style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)' }}>
            {goal.description}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isCompleted && (
            <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500' }}>
              ✓ Completed
            </span>
          )}
          <span style={{
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '14px',
            fontWeight: '500',
            backgroundColor: isCompleted ? '#dcfce7' : '#dbeafe',
            color: isCompleted ? '#166534' : '#1e40af'
          }}>
            +{goal.reward} pts
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
          <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: isCompleted ? '500' : 'normal' }}>
            Progress
          </span>
          <span style={{ fontWeight: '500', color: 'var(--md-sys-color-on-surface)' }}>
            {goal.currentValue} / {goal.targetValue}
          </span>
        </div>

        <div style={{ width: '100%', backgroundColor: 'var(--md-sys-color-surface-container-highest)', borderRadius: '9999px', height: '12px' }}>
          <div
            style={{
              height: '12px',
              borderRadius: '9999px',
              transition: 'all 0.5s ease',
              backgroundColor: isCompleted ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-secondary)',
              width: `${progressWidth}%`
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
            {progressWidth.toFixed(1)}% complete
          </span>
          {isCompleted && onComplete && (
            <button 
              onClick={() => onComplete(goal)}
              style={{
                backgroundColor: '#22c55e',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#16a34a'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#22c55e'}
            >
              Claim Reward
            </button>
          )}
        </div>
      </div>

      {/* Goal Type Indicator */}
      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
        <span style={{
          display: 'inline-block',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: 
            goal.type === 'pages' ? '#dbeafe' :
            goal.type === 'time' ? '#f3e8ff' :
            goal.type === 'streak' ? '#fed7aa' :
            goal.type === 'level' ? '#fce7f3' :
            '#f3f4f6',
          color:
            goal.type === 'pages' ? '#1e40af' :
            goal.type === 'time' ? '#24A8E0' :
            goal.type === 'streak' ? '#ea580c' :
            goal.type === 'level' ? '#be185d' :
            '#374151'
        }}>
          {goal.type === 'pages' ? '📄 Pages' :
           goal.type === 'time' ? '⏰ Time' :
           goal.type === 'streak' ? '🔥 Streak' :
           goal.type === 'level' ? '⭐ Level' :
           '🎯 Goal'}
        </span>
      </div>
    </MD3Card>
  );
};

const GoalCreator = ({ onCreateGoal, onCancel }) => {
  const [goalType, setGoalType] = useState('pages');
  const [targetValue, setTargetValue] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  const goalTemplates = {
    pages: {
      title: 'Read Pages',
      suggestions: [50, 100, 250, 500, 1000],
      description: 'Read a specific number of pages'
    },
    time: {
      title: 'Reading Time',
      suggestions: [60, 120, 300, 600, 1200], // minutes
      description: 'Spend time reading (in minutes)'
    },
    streak: {
      title: 'Reading Streak',
      suggestions: [3, 7, 14, 30, 365],
      description: 'Read consistently for consecutive days'
    },
    books: {
      title: 'Complete Books',
      suggestions: [1, 3, 5, 10, 25],
      description: 'Finish reading complete books'
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetValue || targetValue <= 0) return;

    const template = goalTemplates[goalType];
    const goal = {
      id: `custom_${Date.now()}`,
      title: customTitle || `${template.title} - ${targetValue}`,
      description: `${template.description}: ${targetValue}`,
      type: goalType,
      currentValue: 0,
      targetValue: parseInt(targetValue),
      reward: Math.max(50, Math.floor(targetValue / 10)),
      progress: 0,
      isCustom: true
    };

    onCreateGoal(goal);
  };

  return (
    <MD3Card
      variant="outlined"
      style={{
        padding: '24px',
        border: '3px solid var(--md-sys-color-outline-variant)',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)'
      }}
    >
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--md-sys-color-on-surface)' }}>Create Custom Goal</h3>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Goal Type</label>
          <select 
            value={goalType}
            onChange={(e) => setGoalType(e.target.value)}
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 12px' }}
          >
            {Object.entries(goalTemplates).map(([key, template]) => (
              <option key={key} value={key}>{template.title}</option>
            ))}
          </select>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            {goalTemplates[goalType].description}
          </p>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Target Value</label>
          <input
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 12px' }}
            placeholder="Enter target value"
            min="1"
            required
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {goalTemplates[goalType].suggestions.map(suggestion => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setTargetValue(suggestion.toString())}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Custom Title (optional)
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 12px' }}
            placeholder="Enter custom goal title"
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
          <button
            type="submit"
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 24px',
              borderRadius: '8px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            Create Goal
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              backgroundColor: '#d1d5db',
              color: '#374151',
              padding: '8px 24px',
              borderRadius: '8px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#9ca3af'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#d1d5db'}
          >
            Cancel
          </button>
        </div>
      </form>
    </MD3Card>
  );
};

const GoalSystem = ({ goals = [], onComplete, onCompleteGoal, onCreateGoal }) => {
  // Support both onComplete and onCompleteGoal props
  const handleComplete = onComplete || onCompleteGoal;
  const [showCreator, setShowCreator] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, completed

  const filteredGoals = goals.filter(goal => {
    if (filter === 'active') return goal.progress < 100;
    if (filter === 'completed') return goal.progress >= 100;
    return true;
  });

  const activeGoals = goals.filter(g => g.progress < 100).length;
  const completedGoals = goals.filter(g => g.progress >= 100).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Your Goals</h3>
          <p style={{ color: '#4b5563', fontSize: '14px' }}>
            {activeGoals} active • {completedGoals} completed
          </p>
        </div>
        <button
          onClick={() => setShowCreator(!showCreator)}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: '500',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          {showCreator ? 'Cancel' : 'New Goal'}
        </button>
      </div>

      {/* Goal Creator */}
      {showCreator && (
        <GoalCreator 
          onCreateGoal={(goal) => {
            onCreateGoal?.(goal);
            setShowCreator(false);
          }}
          onCancel={() => setShowCreator(false)}
        />
      )}

      {/* Filter */}
      {goals.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Filter:</label>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '14px'
            }}
          >
            <option value="all">All Goals ({goals.length})</option>
            <option value="active">Active ({activeGoals})</option>
            <option value="completed">Completed ({completedGoals})</option>
          </select>
        </div>
      )}

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <MD3Card
          variant="outlined"
          style={{
            padding: '32px',
            textAlign: 'center',
            border: '3px solid var(--md-sys-color-outline-variant)',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)'
          }}
        >
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎯</div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--md-sys-color-on-surface)', marginBottom: '8px' }}>
            {goals.length === 0 ? 'No goals yet' : 'No goals match your filter'}
          </h3>
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '16px' }}>
            {goals.length === 0 
              ? "Create your first reading goal to stay motivated!"
              : "Try adjusting your filter to see more goals."
            }
          </p>
          {goals.length === 0 && (
            <button
              onClick={() => setShowCreator(true)}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 24px',
                borderRadius: '8px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              Create Your First Goal
            </button>
          )}
        </MD3Card>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {filteredGoals.map((goal) => (
            <GoalItem 
              key={goal.id} 
              goal={goal}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalSystem;
