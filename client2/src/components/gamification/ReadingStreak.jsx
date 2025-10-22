// src/components/gamification/ReadingStreak.jsx
import React, { useState, useEffect } from 'react';
import { MD3Card, MD3Chip, MD3Button, useSnackbar } from '../Material3';
import './ReadingStreak.css';
import Icon from '../ui/Icon';

const ReadingStreak = () => {
  const { showSnackbar } = useSnackbar();
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastReadDate: null,
    todayRead: false,
    weeklyProgress: [false, false, false, false, false, false, false]
  });

  // Load streak data from localStorage
  useEffect(() => {
    const loadStreakData = () => {
      const saved = localStorage.getItem('readingStreak');
      if (saved) {
        const data = JSON.parse(saved);
        // Check if streak is still valid
        const today = new Date().toDateString();
        const lastRead = data.lastReadDate ? new Date(data.lastReadDate).toDateString() : null;
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        // Reset streak if more than 1 day has passed
        if (lastRead && lastRead !== today && lastRead !== yesterday) {
          data.currentStreak = 0;
          data.weeklyProgress = [false, false, false, false, false, false, false];
        }
        
        // Check if today was already marked
        data.todayRead = lastRead === today;
        
        setStreakData(data);
      }
    };
    
    loadStreakData();
  }, []);

  // Save streak data
  const saveStreakData = (data) => {
    localStorage.setItem('readingStreak', JSON.stringify(data));
    setStreakData(data);
  };

  // Mark today as read
  const markTodayAsRead = () => {
    const today = new Date();
    const todayString = today.toDateString();
    
    if (streakData.todayRead) {
      showSnackbar({
        message: "You've already logged reading for today!",
        variant: 'info'
      });
      return;
    }

    const newStreak = streakData.currentStreak + 1;
    const newLongest = Math.max(newStreak, streakData.longestStreak);
    
    // Update weekly progress
    const dayOfWeek = today.getDay();
    const newWeeklyProgress = [...streakData.weeklyProgress];
    newWeeklyProgress[dayOfWeek] = true;
    
    const newData = {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastReadDate: today.toISOString(),
      todayRead: true,
      weeklyProgress: newWeeklyProgress
    };
    
    saveStreakData(newData);
    
    // Celebrate milestones
    if (newStreak === 7) {
      showSnackbar({
        message: '🎉 One week streak! Keep it up!',
        variant: 'success'
      });
    } else if (newStreak === 30) {
      showSnackbar({
        message: '🏆 30 day streak! You\'re a reading champion!',
        variant: 'success'
      });
    } else if (newStreak === 100) {
      showSnackbar({
        message: '💯 100 day streak! Legendary reader!',
        variant: 'success'
      });
    } else {
      showSnackbar({
        message: `Reading streak: ${newStreak} ${newStreak === 1 ? 'day' : 'days'}! 🔥`,
        variant: 'success'
      });
    }
  };

  // Map streak state to semantic icon names
  const getStreakIcon = () => {
    if (streakData.currentStreak === 0) return 'books';
    if (streakData.currentStreak < 7) return 'fire';
    if (streakData.currentStreak < 30) return 'bolt';
    if (streakData.currentStreak < 100) return 'star';
    return 'crown';
  };

  // Get day names
  const getDayName = (index) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[index];
  };

  return (
    <MD3Card className="reading-streak-card">
      <div className="streak-header">
        <h3 className="md-title-medium">Reading Streak</h3>
        <div className="streak-emoji"><Icon name={getStreakIcon()} size={22} /></div>
      </div>

      <div className="streak-stats">
        <div className="streak-stat">
          <span className="streak-number">{streakData.currentStreak}</span>
          <span className="streak-label md-label-small">Current Streak</span>
        </div>
        <div className="streak-stat">
          <span className="streak-number">{streakData.longestStreak}</span>
          <span className="streak-label md-label-small">Longest Streak</span>
        </div>
      </div>

      <div className="weekly-progress">
        <p className="md-label-medium">This Week</p>
        <div className="week-days">
          {streakData.weeklyProgress.map((read, index) => (
            <div key={index} className="week-day">
              <div className={`day-indicator ${read ? 'active' : ''} ${index === new Date().getDay() ? 'today' : ''}`}>
                {read ? '✓' : ''}
              </div>
              <span className="day-name md-label-small">{getDayName(index)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="streak-actions">
        <MD3Button
          variant="filled"
          onClick={markTodayAsRead}
          disabled={streakData.todayRead}
          fullWidth
        >
          {streakData.todayRead ? "Today's Reading Logged ✓" : "Log Today's Reading"}
        </MD3Button>
      </div>

      {/* Motivational message */}
      <div className="streak-message">
        {streakData.currentStreak === 0 && (
          <p className="md-body-small on-surface-variant">
            Start your reading streak today! <Icon name="book" size={16} />
          </p>
        )}
        {streakData.currentStreak > 0 && streakData.currentStreak < 7 && (
          <p className="md-body-small on-surface-variant">
            Great start! Keep reading to build your streak!
          </p>
        )}
        {streakData.currentStreak >= 7 && streakData.currentStreak < 30 && (
          <p className="md-body-small on-surface-variant">
            Amazing consistency! You're on fire! <Icon name="fire" size={16} />
          </p>
        )}
        {streakData.currentStreak >= 30 && (
          <p className="md-body-small on-surface-variant">
            You're a reading legend! Keep it going! <Icon name="crown" size={16} />
          </p>
        )}
      </div>
    </MD3Card>
  );
};

export default ReadingStreak;
