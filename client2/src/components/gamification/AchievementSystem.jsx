
// src/components/gamification/AchievementSystem.jsx
import React, { useState } from 'react';
import { MD3Card } from '../Material3';

const AchievementItem = ({ achievement, isUnlocked, unlockedDate }) => (
  <MD3Card style={{
    padding: '16px',
    transition: 'all 0.3s ease',
    background: isUnlocked ? 'linear-gradient(to right, #fffbeb, #fff7ed)' : '#f9fafb',
    border: `1px solid ${isUnlocked ? '#fde68a' : '#e5e7eb'}`
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
      <div style={{
        fontSize: '36px',
        filter: isUnlocked ? 'none' : 'grayscale(100%)',
        opacity: isUnlocked ? 1 : 0.4
      }}>
        {achievement.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{
              fontWeight: 'bold',
              fontSize: '18px',
              color: isUnlocked ? '#111827' : '#6b7280'
            }}>
              {achievement.title}
            </h4>
            <p style={{
              fontSize: '14px',
              color: isUnlocked ? '#4b5563' : '#9ca3af'
            }}>
              {achievement.description}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: isUnlocked ? '#fef3c7' : '#f3f4f6',
              color: isUnlocked ? '#92400e' : '#6b7280'
            }}>
              {achievement.points} pts
            </span>
          </div>
        </div>
        
        {isUnlocked && unlockedDate && (
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '12px',
              color: '#16a34a',
              backgroundColor: '#dcfce7',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              ✓ Unlocked
            </span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {new Date(unlockedDate).toLocaleDateString()}
            </span>
          </div>
        )}
        
        {!isUnlocked && (
          <div style={{ marginTop: '12px' }}>
            <span style={{
              fontSize: '12px',
              color: '#9ca3af',
              backgroundColor: '#f3f4f6',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              🔒 Locked
            </span>
          </div>
        )}
      </div>
    </div>
  </MD3Card>
);

const AchievementSystem = ({ achievements = [], ACHIEVEMENTS = {}, showAll = false }) => {
  const [filter, setFilter] = useState('all'); // all, unlocked, locked
  const [sortBy, setSortBy] = useState('name'); // name, points, status

  // Create achievement data with unlock status
  const achievementData = Object.values(ACHIEVEMENTS).map(achievement => ({
    ...achievement,
    isUnlocked: achievements.includes(achievement.id),
    unlockedDate: null // In real app, this would come from backend
  }));

  // Filter achievements
  const filteredAchievements = achievementData.filter(achievement => {
    if (filter === 'unlocked') return achievement.isUnlocked;
    if (filter === 'locked') return !achievement.isUnlocked;
    return true;
  });

  // Sort achievements
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    switch (sortBy) {
      case 'points':
        return b.points - a.points;
      case 'status':
        return b.isUnlocked - a.isUnlocked;
      default:
        return a.title.localeCompare(b.title);
    }
  });

  const displayAchievements = showAll ? sortedAchievements : sortedAchievements.slice(0, 6);
  const unlockedCount = achievementData.filter(a => a.isUnlocked).length;
  const totalCount = achievementData.length;
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Progress Overview */}
      <MD3Card style={{
        padding: '24px',
        background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold' }}>Achievement Progress</h3>
            <p style={{ color: '#ddd6fe' }}>
              {unlockedCount} of {totalCount} achievements unlocked
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{completionPercentage}%</div>
            <div style={{ color: '#ddd6fe', fontSize: '14px' }}>Complete</div>
          </div>
        </div>
        <div style={{ marginTop: '16px', width: '100%', backgroundColor: '#a855f7', borderRadius: '9999px', height: '8px' }}>
          <div 
            style={{
              backgroundColor: 'white',
              height: '8px',
              borderRadius: '9999px',
              transition: 'all 0.5s ease',
              width: `${completionPercentage}%`
            }}
          />
        </div>
      </MD3Card>

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginRight: '8px' }}>Filter:</label>
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
              <option value="all">All Achievements</option>
              <option value="unlocked">Unlocked ({unlockedCount})</option>
              <option value="locked">Locked ({totalCount - unlockedCount})</option>
            </select>
          </div>
          
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginRight: '8px' }}>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '4px 12px',
                fontSize: '14px'
              }}
            >
              <option value="name">Name</option>
              <option value="points">Points</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '14px', color: '#4b5563' }}>
          Showing {displayAchievements.length} of {filteredAchievements.length} achievements
        </div>
      </div>

      {/* Achievements Grid */}
      {displayAchievements.length === 0 ? (
        <MD3Card style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>🏆</div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#4b5563', marginBottom: '8px' }}>No achievements found</h3>
          <p style={{ color: '#6b7280' }}>
            {filter === 'unlocked' 
              ? "You haven't unlocked any achievements yet. Keep reading!"
              : "Start reading to unlock your first achievement!"
            }
          </p>
        </MD3Card>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '16px'
        }}>
          {displayAchievements.map((achievement) => (
            <AchievementItem 
              key={achievement.id} 
              achievement={achievement}
              isUnlocked={achievement.isUnlocked}
              unlockedDate={achievement.unlockedDate}
            />
          ))}
        </div>
      )}

      {/* Show more button */}
      {!showAll && filteredAchievements.length > 6 && (
        <div style={{ textAlign: 'center' }}>
          <button style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '8px 24px',
            borderRadius: '8px',
            fontWeight: '500',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}>
            Show {filteredAchievements.length - 6} More Achievements
          </button>
        </div>
      )}
    </div>
  );
};

export default AchievementSystem;