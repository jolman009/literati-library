import { useMemo } from 'react';
import './ReadingHeatmap.css';

/**
 * GitHub-style Reading Activity Heatmap
 * Visualizes reading activity over the past year
 */
const ReadingHeatmap = ({ readingSessions = [], startDate = null }) => {
  // Generate calendar data for the past year
  const heatmapData = useMemo(() => {
    const today = new Date();
    const start = startDate ? new Date(startDate) : new Date(today.getFullYear(), 0, 1); // Jan 1st or custom
    const days = [];

    // Calculate days to show (full year or custom range)
    const daysToShow = Math.min(
      365,
      Math.ceil((today - start) / (1000 * 60 * 60 * 24)) + 1
    );

    // Create map of reading activity by date
    const activityMap = new Map();

    readingSessions.forEach(session => {
      if (!session.startTime) return;

      const sessionDate = new Date(session.startTime);
      const dateKey = sessionDate.toDateString();

      if (!activityMap.has(dateKey)) {
        activityMap.set(dateKey, {
          minutes: 0,
          pages: 0,
          sessions: 0
        });
      }

      const activity = activityMap.get(dateKey);
      activity.minutes += session.duration || 0;
      activity.pages += session.pagesRead || 0;
      activity.sessions += 1;
    });

    // Generate day objects for each day
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dateKey = date.toDateString();
      const activity = activityMap.get(dateKey) || { minutes: 0, pages: 0, sessions: 0 };

      days.push({
        date,
        dateString: dateKey,
        ...activity,
        level: getActivityLevel(activity.minutes)
      });
    }

    return days;
  }, [readingSessions, startDate]);

  // Organize days into weeks (Sunday - Saturday)
  const weeks = useMemo(() => {
    const weeksArray = [];
    let currentWeek = [];

    // Find the first day of the week (Sunday) before our start date
    const firstDay = heatmapData[0]?.date;
    if (!firstDay) return [];

    const startDayOfWeek = firstDay.getDay();

    // Add empty cells for days before our data starts
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    // Add all days
    heatmapData.forEach((day, index) => {
      currentWeek.push(day);

      // If Saturday or last day, complete the week
      if (day.date.getDay() === 6 || index === heatmapData.length - 1) {
        weeksArray.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return weeksArray;
  }, [heatmapData]);

  // Get month labels for the timeline
  const monthLabels = useMemo(() => {
    const labels = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let currentMonth = -1;
    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week.find(day => day !== null);
      if (firstDayOfWeek) {
        const month = firstDayOfWeek.date.getMonth();
        if (month !== currentMonth) {
          labels.push({
            weekIndex,
            label: months[month]
          });
          currentMonth = month;
        }
      }
    });

    return labels;
  }, [weeks]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalMinutes = heatmapData.reduce((sum, day) => sum + day.minutes, 0);
    const totalPages = heatmapData.reduce((sum, day) => sum + day.pages, 0);
    const totalSessions = heatmapData.reduce((sum, day) => sum + day.sessions, 0);
    const activeDays = heatmapData.filter(day => day.minutes > 0).length;

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toDateString();
    for (let i = heatmapData.length - 1; i >= 0; i--) {
      const day = heatmapData[i];
      if (day.dateString === today || day.minutes > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    heatmapData.forEach(day => {
      if (day.minutes > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    });

    return {
      totalMinutes,
      totalPages,
      totalSessions,
      activeDays,
      currentStreak,
      longestStreak,
      totalDays: heatmapData.length
    };
  }, [heatmapData]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="reading-heatmap">
      {/* Stats Summary */}
      <div className="heatmap-stats">
        <div className="stat-item">
          <span className="stat-value">{stats.activeDays}</span>
          <span className="stat-label">days active</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{formatTime(stats.totalMinutes)}</span>
          <span className="stat-label">total time</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.currentStreak}</span>
          <span className="stat-label">current streak</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.longestStreak}</span>
          <span className="stat-label">longest streak</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="heatmap-container">
        {/* Day labels */}
        <div className="heatmap-day-labels">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Month labels */}
        <div className="heatmap-month-labels">
          {monthLabels.map((label, index) => (
            <span
              key={index}
              style={{ gridColumnStart: label.weekIndex + 1 }}
              className="month-label"
            >
              {label.label}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="heatmap-grid">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="heatmap-week">
              {Array.from({ length: 7 }, (_, dayIndex) => {
                const day = week[dayIndex];

                if (!day) {
                  return <div key={dayIndex} className="heatmap-day empty" />;
                }

                return (
                  <div
                    key={dayIndex}
                    className={`heatmap-day level-${day.level}`}
                    data-date={formatDate(day.date)}
                    data-minutes={day.minutes}
                    data-pages={day.pages}
                    data-sessions={day.sessions}
                    title={`${formatDate(day.date)}: ${formatTime(day.minutes)}${day.pages > 0 ? `, ${day.pages} pages` : ''}`}
                  >
                    <span className="day-tooltip">
                      <strong>{formatDate(day.date)}</strong>
                      {day.minutes > 0 ? (
                        <>
                          <br />
                          {formatTime(day.minutes)} reading
                          {day.pages > 0 && <><br />{day.pages} pages</>}
                          {day.sessions > 1 && <><br />{day.sessions} sessions</>}
                        </>
                      ) : (
                        <><br />No reading activity</>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="heatmap-legend">
          <span className="legend-label">Less</span>
          <div className="legend-boxes">
            <div className="legend-box level-0" title="No activity" />
            <div className="legend-box level-1" title="1-15 minutes" />
            <div className="legend-box level-2" title="16-30 minutes" />
            <div className="legend-box level-3" title="31-60 minutes" />
            <div className="legend-box level-4" title="60+ minutes" />
          </div>
          <span className="legend-label">More</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Get activity level (0-4) based on reading minutes
 */
function getActivityLevel(minutes) {
  if (minutes === 0) return 0;
  if (minutes <= 15) return 1;
  if (minutes <= 30) return 2;
  if (minutes <= 60) return 3;
  return 4;
}

export default ReadingHeatmap;
