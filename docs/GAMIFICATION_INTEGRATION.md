# Gamification Integration Guide

## Overview

This document describes the complete integration of the gamification system into the Literati application. The system tracks user actions, awards points, unlocks achievements, and provides visual feedback through an enhanced progress visualization.

## Table of Contents

1. [Architecture](#architecture)
2. [Visual Components](#visual-components)
3. [Action Tracking](#action-tracking)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

---

## Architecture

### Context Layer

The gamification system is built on React Context for state management:

**Location**: `client2/src/contexts/GamificationContext.jsx`

**Key Features**:
- Central state management for points, levels, achievements, and stats
- `trackAction()` function for logging user actions
- Real-time stat updates
- Achievement unlock notifications
- Reading streak tracking
- Goal progress monitoring

**Available Actions**:
```javascript
// Book-related actions
trackAction('book_upload', { bookId, bookTitle, bookAuthor, fileType, fileSize })
trackAction('complete_book', { bookId, bookTitle, bookAuthor, totalPages, completedAt })

// Reading session actions
trackAction('start_reading_session', { bookId, bookTitle, timestamp })
trackAction('complete_reading_session', { bookId, bookTitle, duration, sessionLength, pagesRead, timestamp })
trackAction('pages_read', { pages, bookId, bookTitle, timestamp })

// Note-related actions
trackAction('create_note', { noteId, bookId, noteLength, hasTags })

// Daily engagement
trackAction('daily_checkin', { points, streak, timestamp })
```

### Points System

| Action | Points Awarded |
|--------|---------------|
| Daily Check-in | 10 points |
| Upload Book | 50 points |
| Create Note | 25 points |
| Complete Reading Session | 5 points per minute (max 120 points/session) |
| Pages Read | 2 points per page |
| Complete Book | 200 points |
| Complete Chapter | 50 points |

### Level System

**Level Calculation**:
- Each level requires 100 points × level number
- Level 1: 0-100 points
- Level 2: 100-200 points
- Level 3: 200-300 points
- And so on...

**Level-up Rewards**:
- Visual notification with animation
- Snackbar notification
- Unlock new achievements
- Progress toward goals

---

## Visual Components

### FillingArc Progress Visualization

**Location**: `client2/src/components/gamification/FillingArc.jsx`

The FillingArc component replaces traditional progress bars with an animated, glowing circular arc that provides rich visual feedback for level progress.

#### Variants

**1. Simple** - Clean gradient arc with basic glow
```jsx
<FillingArc
  progress={75}
  level={5}
  variant="simple"
  size="medium"
/>
```

**2. Detailed** (Default) - Multi-layer with progress cap and dual glow
```jsx
<FillingArc
  progress={45}
  level={3}
  variant="detailed"
  size="large"
  showStats={true}
  stats={{
    totalPoints: 245,
    nextLevelPoints: 300,
    currentLevelPoints: 200
  }}
/>
```

**3. Intricate** - Rotating decorations with pulsing underglow
```jsx
<FillingArc
  progress={80}
  level={7}
  variant="intricate"
  size="medium"
/>
```

**4. Cosmic** - Star field, nebula effect, energy particles
```jsx
<FillingArc
  progress={60}
  level={10}
  variant="cosmic"
  size="large"
/>
```

#### Props Reference

```typescript
interface FillingArcProps {
  progress: number;        // 0-100 percentage
  level: number;           // Current user level
  variant?: 'simple' | 'detailed' | 'intricate' | 'cosmic';
  size?: 'small' | 'medium' | 'large';
  showStats?: boolean;     // Show level/points overlay
  stats?: {
    totalPoints: number;
    nextLevelPoints: number;
    currentLevelPoints: number;
  };
  className?: string;
}
```

#### Size Specifications

| Size | Dimensions | Use Case |
|------|-----------|----------|
| Small | 120×120px | Compact widgets, mobile views |
| Medium | 200×200px | Standard dashboard cards |
| Large | 280×280px | Hero sections, welcome screens |

#### Animation Features

The CSS animations (`FillingArc.css`) include:

- **Glow Pulse**: Dynamic shadow that breathes with the arc
- **Rotation**: Decorative elements slowly rotate around center
- **Shimmer**: Light reflection sweeps across the arc
- **Twinkle**: Star-like sparkles (cosmic variant)
- **Cosmic Pulse**: Color-shifting glow with hue rotation
- **Gradient Flow**: Animated color gradients along arc path

**Performance Considerations**:
- Animations are GPU-accelerated using transforms
- Reduced motion support via `@media (prefers-reduced-motion: reduce)`
- Mobile devices get simplified animations for better battery life
- All animations pause when component is not visible

---

## Action Tracking

### Integration Points

The gamification system is integrated at key user action points throughout the application:

#### 1. Book Upload

**File**: `client2/src/pages/MD3UploadPage.jsx:125-137`

```javascript
const uploadedBook = response.data;

// Track book upload action for gamification
try {
  await trackAction('book_upload', {
    bookId: uploadedBook.id,
    bookTitle: uploadedBook.title,
    bookAuthor: uploadedBook.author,
    fileType: selectedFile.type,
    fileSize: selectedFile.size
  });
} catch (trackError) {
  console.error('Failed to track book upload:', trackError);
  // Don't fail the upload if tracking fails
}

showSnackbar({
  message: `"${uploadedBook.title}" uploaded successfully! +50 points earned!`,
  variant: 'success'
});
```

**Points Awarded**: 50 points
**Achievements**: Can unlock "First Upload", "Collector" achievements

---

#### 2. Reading Sessions

**File**: `client2/src/contexts/ReadingSessionContext.jsx`

**Start Session** (Lines 104-114):
```javascript
// Track to gamification system
if (trackAction) {
  try {
    await trackAction('start_reading_session', {
      bookId: book.id,
      bookTitle: book.title,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Failed to track reading start:', error);
  }
}
```

**Complete Session** (Lines 197-210):
```javascript
// Track session end to gamification system
if (trackAction && durationMinutes > 0) {
  try {
    await trackAction('complete_reading_session', {
      bookId: activeSession.book.id,
      bookTitle: activeSession.book.title,
      duration: durationMinutes,
      sessionLength: durationMinutes,
      pagesRead: activeSession.pagesRead || 0,
      timestamp: endTime.toISOString()
    });
  } catch (error) {
    console.warn('Failed to track reading session completion:', error);
  }
}
```

**Pages Read** (Lines 262-273):
```javascript
// Track to gamification if available
if (trackAction && pagesRead > 0) {
  try {
    await trackAction('pages_read', {
      pages: pagesRead,
      bookId: activeSession.book.id,
      bookTitle: activeSession.book.title,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Failed to track pages read:', error);
  }
}
```

**Points Awarded**:
- 5 points per minute of reading (max 120 points per session)
- 2 points per page read

**Achievements**: Can unlock "Bookworm", "Marathon Reader", "Night Owl" achievements

---

#### 3. Note Creation

**File**: `client2/src/pages/MD3NotesPage.jsx:200-211`

```javascript
const response = await API.post('/notes', noteData, { timeout: 30000 });

// Track note creation for gamification
try {
  await trackAction('create_note', {
    noteId: response.data.id,
    bookId: noteData.book_id,
    noteLength: noteData.content.length,
    hasTags: noteData.tags.length > 0
  });
} catch (trackError) {
  console.error('Failed to track note creation:', trackError);
  // Don't fail note creation if tracking fails
}

showSnackbar({
  message: 'Note created successfully! +25 points earned!',
  variant: 'success'
});
```

**Points Awarded**: 25 points
**Achievements**: Can unlock "Note Taker", "Scholar" achievements

---

#### 4. Book Completion

**File**: `client2/src/hooks/useBookLibrary.js:199-214`

```javascript
// Track book completion for gamification
if (wasJustCompleted && trackAction) {
  try {
    const book = books.find(b => b.id === bookId);
    await trackAction('complete_book', {
      bookId,
      bookTitle: book?.title,
      bookAuthor: book?.author,
      totalPages: book?.total_pages,
      completedAt: updates.completed_at
    });
  } catch (trackError) {
    console.error('Failed to track book completion:', trackError);
    // Don't fail the progress update if tracking fails
  }
}
```

**Points Awarded**: 200 points
**Achievements**: Can unlock "Finisher", "Completionist" achievements

---

#### 5. Daily Check-in

**File**: `client2/src/pages/DashboardPage.jsx:98-108`

```javascript
// Track the action if trackAction exists
if (typeof trackAction === 'function') {
  try {
    await trackAction('daily_checkin', {
      points: 10,
      streak: newStreak,
      timestamp: new Date().toISOString()
    });
  } catch (trackError) {
    console.log('Tracking not available, but check-in recorded locally');
  }
}
```

**Points Awarded**: 10 points
**Streak Bonus**: Consecutive days increase streak multiplier
**Achievements**: Can unlock "Committed" (7-day streak), "Dedicated" (30-day streak)

---

### Dashboard Integration

**File**: `client2/src/pages/DashboardPage.jsx:158-172`

The FillingArc component has been integrated into the main dashboard to replace the traditional progress bar:

```jsx
{/* Level Progress Arc */}
<div className="level-progress-container">
  <FillingArc
    progress={levelProgress}
    level={stats?.level || 1}
    variant="detailed"
    size="large"
    showStats={true}
    stats={{
      totalPoints: stats?.totalPoints || 0,
      nextLevelPoints: (stats?.level || 1) * 100,
      currentLevelPoints: ((stats?.level || 1) - 1) * 100
    }}
  />
</div>
```

**Visual Hierarchy**:
1. **Welcome Section** - Motivational message with streak info
2. **Level Progress Arc** - Large detailed variant showing level, percentage, points
3. **Quick Actions** - Continue Reading, Add Books, Daily Check-in
4. **Stats Overview** - 6-card grid showing reading metrics
5. **Currently Reading** - Books in progress
6. **Recently Added** - Latest uploads
7. **Recent Achievements** - Unlocked badges

---

## Testing

### End-to-End Testing Checklist

#### ✅ Book Upload Flow
1. Navigate to Upload page (`/upload`)
2. Select a PDF or EPUB file
3. Fill in book details (title, author, genre)
4. Click "Upload"
5. **Expected**:
   - Success snackbar shows "+50 points earned!"
   - Dashboard level progress updates
   - Total points increase by 50
   - Possible achievement unlock notification

#### ✅ Reading Session Flow
1. Start reading a book from Library
2. Read for at least 1 minute
3. Update page progress
4. End reading session
5. **Expected**:
   - Session start tracked
   - Points awarded per minute (5 pts/min)
   - Points awarded per page (2 pts/page)
   - Total reading time stat updates
   - Reading streak updates if consecutive days

#### ✅ Note Creation Flow
1. Navigate to Notes page (`/notes`)
2. Click "Create New Note" button
3. Fill in note title and content
4. (Optional) Associate with a book
5. (Optional) Add tags
6. Click "Save Note"
7. **Expected**:
   - Success snackbar shows "+25 points earned!"
   - Dashboard total points increase by 25
   - "Notes Created" stat increments

#### ✅ Book Completion Flow
1. Open a book that's nearly finished
2. Update progress to 100%
3. **Expected**:
   - Success snackbar shows book completed
   - +200 points awarded
   - Book marked as "Completed"
   - "Books Read" stat increments
   - Possible achievement unlock ("Finisher", "Speed Reader", etc.)

#### ✅ Daily Check-in Flow
1. Navigate to Dashboard
2. Click "Daily Check-in" button
3. **Expected**:
   - Success snackbar shows "+10 points earned!" with streak
   - Check-in button becomes disabled
   - Check-in streak counter increments
   - Button shows "✓ Checked In" with flame badge
4. Return tomorrow
5. **Expected**:
   - Check-in button re-enabled
   - Streak continues if within 24 hours

#### ✅ Level-Up Flow
1. Perform actions until next level threshold
2. **Expected**:
   - Level-up snackbar notification
   - FillingArc animation resets to 0%
   - Level number increments
   - Welcome message updates

#### ✅ Visual Testing

**FillingArc Component**:
- [ ] Simple variant renders with basic glow
- [ ] Detailed variant shows progress cap and dual layers
- [ ] Intricate variant has rotating decorations
- [ ] Cosmic variant displays star field and particles
- [ ] Animations are smooth (60fps)
- [ ] Stats overlay shows correct level/points/percentage
- [ ] Responsive sizing works on mobile/tablet/desktop
- [ ] Dark mode colors display correctly
- [ ] Reduced motion preference disables animations

**Dashboard Integration**:
- [ ] FillingArc replaces old progress bar
- [ ] Arc size is appropriate for hero section
- [ ] Stats align with arc visually
- [ ] Arc updates in real-time after actions
- [ ] Arc animation is performant

---

## Troubleshooting

### Common Issues

#### 1. Points Not Updating

**Symptoms**: Actions complete but points don't increase

**Diagnosis**:
```javascript
// Check if GamificationContext is mounted
import { useGamification } from '../contexts/GamificationContext';

const { stats, trackAction } = useGamification();
console.log('Current stats:', stats);
console.log('trackAction available:', typeof trackAction);
```

**Possible Causes**:
- GamificationProvider not wrapping app in `App.jsx`
- trackAction not imported in component
- API endpoint `/gamification/track-action` not responding
- Network error preventing action tracking

**Solution**:
1. Verify `App.jsx` has `<GamificationProvider>` wrapping routes
2. Check browser console for errors
3. Verify backend server is running
4. Check network tab for failed API calls

---

#### 2. FillingArc Not Rendering

**Symptoms**: Dashboard shows empty space where arc should be

**Diagnosis**:
```javascript
// Check props being passed
console.log('FillingArc props:', {
  progress: levelProgress,
  level: stats?.level,
  stats
});
```

**Possible Causes**:
- CSS file not imported
- stats object is undefined
- progress calculation error (NaN, Infinity)
- SVG rendering issue in browser

**Solution**:
1. Verify `FillingArc.css` is imported in `FillingArc.jsx`
2. Add fallback values: `progress={levelProgress || 0}`
3. Check browser console for SVG errors
4. Ensure browser supports SVG filters and gradients

---

#### 3. Animations Not Working

**Symptoms**: Arc displays but doesn't animate

**Diagnosis**:
```javascript
// Check if reduced motion is enabled
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
console.log('Prefers reduced motion:', prefersReducedMotion);
```

**Possible Causes**:
- User has "Reduce Motion" accessibility setting enabled
- CSS animations not supported in browser
- GPU acceleration disabled
- CSS file not loaded

**Solution**:
1. Check `@media (prefers-reduced-motion: reduce)` in DevTools
2. Verify CSS animations in computed styles
3. Test in different browser (Chrome, Firefox, Safari)
4. Check if hardware acceleration is enabled

---

#### 4. Achievement Not Unlocking

**Symptoms**: User completes achievement requirement but badge doesn't appear

**Diagnosis**:
```javascript
// Check achievement status
const { achievements, unlockedAchievements } = useGamification();
console.log('All achievements:', achievements);
console.log('Unlocked set:', unlockedAchievements);
```

**Possible Causes**:
- Achievement logic not triggered
- Supabase query failed
- Achievement already unlocked (duplicate)
- Criteria not met (e.g., time window, consecutive days)

**Solution**:
1. Check `GamificationContext.jsx` achievement unlock logic
2. Verify Supabase `user_achievements` table
3. Check if achievement requires multiple conditions
4. Review achievement definition in context

---

#### 5. Daily Check-in Button Stays Disabled

**Symptoms**: Check-in button remains disabled after midnight

**Diagnosis**:
```javascript
// Check localStorage values
const lastCheckIn = localStorage.getItem('lastDailyCheckIn');
const today = new Date().toDateString();
console.log('Last check-in:', lastCheckIn);
console.log('Today:', today);
console.log('Match:', lastCheckIn === today);
```

**Possible Causes**:
- localStorage not clearing properly
- Time zone mismatch
- Date comparison logic error

**Solution**:
1. Clear localStorage: `localStorage.removeItem('lastDailyCheckIn')`
2. Refresh page
3. Check system time/time zone settings
4. Wait until after midnight local time

---

#### 6. Reading Streak Not Incrementing

**Symptoms**: User reads daily but streak stays at 1

**Diagnosis**:
```javascript
// Check streak calculation
const streak = parseInt(localStorage.getItem('checkInStreak') || '0');
const lastCheckIn = localStorage.getItem('lastDailyCheckIn');
console.log('Current streak:', streak);
console.log('Last check-in:', lastCheckIn);
```

**Possible Causes**:
- Gap between check-ins exceeds 24 hours
- Check-in not registered properly
- localStorage cleared manually
- Streak logic broken

**Solution**:
1. Check `DashboardPage.jsx:78-84` for streak calculation logic
2. Ensure check-in happens within 24-hour window
3. Verify localStorage persistence across sessions
4. Check if user changed device/browser

---

### Debug Mode

Enable debug logging for detailed tracking information:

**File**: `client2/src/contexts/GamificationContext.jsx`

```javascript
const DEBUG = true; // Set to true for verbose logging

if (DEBUG) {
  console.log('🎮 [Gamification] Action tracked:', action, metadata);
  console.log('🎮 [Gamification] Stats updated:', newStats);
  console.log('🎮 [Gamification] Achievement unlocked:', achievement);
}
```

---

## Performance Optimization

### Best Practices

1. **Debounce Rapid Actions**:
   ```javascript
   // Debounce page tracking to avoid excessive calls
   const debouncedTrackPages = debounce((pages) => {
     trackAction('pages_read', { pages });
   }, 1000);
   ```

2. **Batch Updates**:
   ```javascript
   // Batch multiple stat updates into single API call
   const batchActions = [];
   batchActions.push({ action: 'pages_read', metadata: { pages: 5 } });
   batchActions.push({ action: 'create_note', metadata: { noteId: 123 } });
   await API.post('/gamification/batch-track', { actions: batchActions });
   ```

3. **Optimize Arc Rendering**:
   - Use `memo()` for FillingArc component
   - Only re-render when progress/level changes
   - Disable animations on mobile for battery savings

4. **Cache Achievement Data**:
   - Load achievements once on app mount
   - Store in context/local state
   - Only refetch on achievement unlock

---

## Future Enhancements

### Planned Features

1. **Leaderboards**:
   - Weekly/monthly top readers
   - Category-specific rankings
   - Friend comparisons

2. **Social Sharing**:
   - Share achievements on social media
   - Invite friends to compete
   - Book recommendations based on reading habits

3. **Advanced Achievements**:
   - Genre-specific badges (e.g., "Sci-Fi Scholar")
   - Time-based challenges (e.g., "Weekend Warrior")
   - Collection milestones (e.g., "Century Club" for 100 books)

4. **Customization**:
   - Choose FillingArc variant in settings
   - Custom color themes for arcs
   - Achievement badge display preferences

5. **Rewards**:
   - Unlock themes/avatars at certain levels
   - Earn reading insights reports
   - Access to premium features

---

## API Reference

### trackAction Function

**Signature**:
```typescript
trackAction(
  action: string,
  metadata?: Record<string, any>
): Promise<void>
```

**Parameters**:
- `action` (string): Action type identifier
- `metadata` (object): Optional additional data about the action

**Returns**: Promise that resolves when tracking completes

**Example**:
```javascript
await trackAction('custom_action', {
  customField: 'value',
  timestamp: new Date().toISOString()
});
```

**Error Handling**:
```javascript
try {
  await trackAction('risky_action', metadata);
} catch (error) {
  console.error('Tracking failed:', error);
  // Gracefully degrade - don't block user action
}
```

---

## Database Schema

### Supabase Tables

**user_achievements**:
```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);
```

**gamification_stats**:
```sql
CREATE TABLE gamification_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  books_read INTEGER DEFAULT 0,
  pages_read INTEGER DEFAULT 0,
  notes_created INTEGER DEFAULT 0,
  reading_streak INTEGER DEFAULT 0,
  last_activity TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);
```

**gamification_actions**:
```sql
CREATE TABLE gamification_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  points_awarded INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Credits

**Design**: Material Design 3 specifications
**Animation**: CSS3 with GPU acceleration
**State Management**: React Context API
**Database**: Supabase PostgreSQL

**Contributors**:
- Claude (AI Assistant) - Architecture & implementation
- User (Jolma) - Requirements & testing

---

## Changelog

### v1.0.0 (2025-10-09)

**Added**:
- ✅ FillingArc component with 4 visual variants
- ✅ Comprehensive animation system with CSS
- ✅ trackAction integration for book uploads
- ✅ trackAction integration for reading sessions
- ✅ trackAction integration for note creation
- ✅ trackAction integration for book completion
- ✅ Daily check-in with streak tracking
- ✅ Dashboard integration replacing progress bar
- ✅ Fixed MD3 component CSS import issues

**Changed**:
- Progress bar replaced with FillingArc in WelcomeSection
- Snackbar messages now show points earned
- Success messages include gamification feedback

**Fixed**:
- MD3FloatingActionButton CSS import path
- Missing exports in Material3 index

---

## License

This gamification system is part of the Literati application.
All rights reserved.
