# Gamification Action Tracking - Testing Plan

## Overview
This document provides a comprehensive testing plan for verifying that all gamification events are properly tracked throughout the application. Each action should award points immediately and trigger achievement unlocks when conditions are met.

---

## 1. Reading Activities Tracking

### 1.1 Start Reading Session
**Location**: `client2/src/contexts/ReadingSessionContext.jsx:106`
**Event**: `reading_session_started`
**Points**: 5 points
**Test Steps**:
1. Navigate to Library page
2. Click on any book to start reading
3. **Expected Result**:
   - Console log: "✅ Reading session start tracked - 5 points awarded"
   - Total points increase by 5
   - Active reading session created in localStorage

### 1.2 Complete Reading Session
**Location**: `client2/src/contexts/ReadingSessionContext.jsx:200`
**Event**: `reading_session_completed`
**Points**: 10 points + 1 point per minute of reading
**Test Steps**:
1. Start a reading session (see 1.1)
2. Read for at least 2-3 minutes
3. Stop the reading session
4. **Expected Result**:
   - Console log: "✅ Reading session completed tracked - 10 points + X minutes reading time"
   - Total points increase by 10 + minutes read
   - `totalReadingTime` stat updated
   - Session saved to `readingSessionHistory` in localStorage

### 1.3 Read Pages
**Location**: `client2/src/contexts/ReadingSessionContext.jsx:271`
**Event**: `page_read`
**Points**: 1 point per page
**Test Steps**:
1. Start a reading session
2. Navigate through pages using page navigation controls
3. Update progress (e.g., set pages read to 5)
4. **Expected Result**:
   - Console log: "✅ X page(s) tracked - X point(s) awarded"
   - Total points increase by number of pages
   - `pagesRead` stat updated

### 1.4 Complete Book ✅ IMPLEMENTED
**Locations**:
- `client2/src/hooks/useBookLibrary.js:203` (FIXED)
- `client2/src/components/wrappers/CollectionsPageWrapper.jsx:203`
- `client2/src/components/wrappers/LibraryPageWrapper.jsx:281, 430, 569`
**Event**: `book_completed`
**Points**: 100 points
**Test Steps**:
1. Mark a book as completed (in Library or Collections view)
2. **Expected Result**:
   - Console log: "✅ Book completion tracked - \"[Book Title]\" - 100 points awarded"
   - Total points increase by 100
   - `booksCompleted` stat updated
   - **Achievement Check**: "Finisher" (1 book) or "Completionist" (10 books)

---

## 2. Library Management Tracking

### 2.1 Upload Book
**Location**: `client2/src/pages/MD3UploadPage.jsx:127`
**Event**: `book_uploaded`
**Points**: 25 points
**Test Steps**:
1. Navigate to Upload page
2. Select a PDF or EPUB file
3. Fill in book details (title, author, genre)
4. Click "Upload Book"
5. **Expected Result**:
   - Console log: "✅ Book upload tracked successfully - 25 points awarded"
   - Snackbar: "...uploaded successfully! +25 points earned!"
   - Total points increase by 25
   - `booksRead` stat updated
   - **Achievement Check**:
     - "First Steps" (1 book)
     - "Bookworm" (10 books)
     - "Collector" (25 books)
     - "Librarian" (50 books)

### 2.2 Daily Check-in
**Location**: `client2/src/pages/DashboardPage.jsx:101`
**Event**: `daily_checkin`
**Points**: 10 points
**Test Steps**:
1. Navigate to Dashboard
2. Click "Daily Check-in" button
3. **Expected Result**:
   - Button becomes disabled showing "✓ Checked In Today"
   - Snackbar: "✅ Daily check-in complete! +10 points earned! 🔥 X day streak!"
   - Total points increase by 10
   - `lastDailyCheckIn` saved in localStorage with today's date
   - `checkInStreak` incremented in localStorage
   - **Streak Test**: Check in on consecutive days to verify streak increments

### 2.3 Daily Login ✅ IMPLEMENTED
**Location**: `client2/src/contexts/AuthContext.jsx:270-295`
**Event**: `daily_login`
**Points**: 10 points
**Implementation**: Event-based communication between AuthContext and GamificationContext
**Test Steps**:
1. Log out of the application
2. Log back in with valid credentials
3. **Expected Result**:
   - Console log: "✅ Daily login tracked - 10 points will be awarded"
   - Console log: "🎯 Daily login event received"
   - Total points increase by 10
   - `lastDailyLogin` saved in localStorage with today's date
4. Log out and log in again (same day)
5. **Expected Result**:
   - Console log: "ℹ️ Already logged in today - no additional points"
   - No additional points awarded
6. **Next Day Test**: Wait until next day, log in again
7. **Expected Result**: 10 points awarded again

---

## 3. Note-Taking & Study Tracking

### 3.1 Create Note
**Location**: `client2/src/pages/MD3NotesPage.jsx:202`
**Event**: `note_created`
**Points**: 15 points
**Test Steps**:
1. Navigate to Notes page
2. Click "+" or "Create New Note" button
3. Fill in title and content
4. Optionally select a book and add tags
5. Click "Save"
6. **Expected Result**:
   - Console log: "✅ Note creation tracked - 15 points awarded"
   - Snackbar: "Note created successfully! +15 points earned!"
   - Total points increase by 15
   - `notesCreated` stat updated
   - **Achievement Check**: "Note Taker" (10 notes)

### 3.2 Create Highlight
**Event**: `highlight_created`
**Points**: 10 points
**Status**: ⚠️ **NEEDS VERIFICATION** - Need to find where highlights are created
**Recommended Locations to Check**:
- `client2/src/pages/ReadBookEnhanced.jsx`
- `client2/src/components/gamification/BookNotesSystem.jsx`
**Test Steps**:
1. Open a book in reading view
2. Select text to highlight
3. Save the highlight
4. **Expected Result**:
   - Total points increase by 10
   - `highlightsCreated` stat updated
   - **Achievement Check**: "Highlighter" (25 highlights)

---

## 4. Streak Tracking

### 4.1 Reading Streak Calculation
**Location**: `client2/src/contexts/GamificationContext.jsx:121`
**Method**: `calculateReadingStreak()`
**Test Steps**:
1. Read on consecutive days (create reading sessions each day)
2. Check reading streak value in Dashboard
3. **Expected Result**:
   - Console log: "📊 Calculated reading streak: X days"
   - Reading streak displayed correctly in Dashboard
   - **Achievement Check**:
     - "3-Day Streak" (3 consecutive days)
     - "Week Warrior" (7 consecutive days)
     - "Monthly Master" (30 consecutive days)

### 4.2 Streak Break Test
**Test Steps**:
1. Read for 2 consecutive days
2. Skip a day (don't read or check in)
3. Read again on the 4th day
4. **Expected Result**: Streak resets to 1

### 4.3 Check-in Streak
**Location**: `client2/src/pages/DashboardPage.jsx:73-91`
**Storage**: `localStorage.checkInStreak`
**Test Steps**:
1. Check in daily for multiple consecutive days
2. Verify streak increments each day
3. Skip a day and verify streak resets

---

## 5. Achievement Unlock Testing

### 5.1 Achievement Unlock Flow
**Location**: `client2/src/contexts/GamificationContext.jsx:391`
**Method**: `checkAchievements()`

**Test Achievements**:
| Achievement | Condition | Points | Test Action |
|------------|-----------|--------|-------------|
| First Steps | Upload 1 book | 50 | Upload first book |
| Bookworm | Upload 10 books | 200 | Upload 10th book |
| Finisher | Complete 1 book | 100 | Complete first book |
| Note Taker | Create 10 notes | 150 | Create 10th note |
| 3-Day Streak | Read 3 consecutive days | 100 | Read 3rd day in a row |

**Test Steps for Each**:
1. Perform the action that should trigger the achievement
2. **Expected Result**:
   - Console log: "🏆 Achievement unlocked: [Achievement Title]"
   - Achievement points added to total
   - Achievement appears in Dashboard "Recent Achievements"
   - Achievement saved to localStorage
   - **UI Notification**: Check if achievement modal/snackbar appears

---

## 6. Point Values Reference

| Action | Event Name | Points | Location | Status |
|--------|-----------|--------|----------|---------|
| Start Reading Session | `reading_session_started` | 5 | ReadingSessionContext.jsx:106 | ✅ Working |
| Complete Reading Session | `reading_session_completed` | 10 | ReadingSessionContext.jsx:200 | ✅ Working |
| Read Page | `page_read` | 1 per page | ReadingSessionContext.jsx:271 | ✅ Working |
| Reading Time | N/A | 1 per minute | Included in session completion | ✅ Working |
| Complete Book | `book_completed` | 100 | useBookLibrary.js:203 + 4 others | ✅ Working (FIXED) |
| Upload Book | `book_uploaded` | 25 | MD3UploadPage.jsx:127 | ✅ Working |
| Daily Login | `daily_login` | 10 | AuthContext.jsx:270 | ✅ Working (NEW) |
| Daily Check-in | `daily_checkin` | 10 | DashboardPage.jsx:101 | ✅ Working |
| Create Note | `note_created` | 15 | MD3NotesPage.jsx:202 | ✅ Working |
| Create Highlight | `highlight_created` | 10 | ⚠️ NEEDS VERIFICATION | ⚠️ Not Found |

---

## 7. Testing Checklist

### Pre-Test Setup
- [ ] Clear browser localStorage to start fresh
- [ ] Log in with a test account
- [ ] Open browser console to view tracking logs
- [ ] Note initial point total (should be 0 for new account)

### Core Features
- [ ] Upload a book (25 points)
- [ ] Start a reading session (5 points)
- [ ] Read 5 pages (5 points)
- [ ] Stop reading session (10 points + time)
- [ ] Create a note (15 points)
- [ ] Daily check-in (10 points)
- [ ] Verify all points were awarded correctly

### Streak Tracking
- [ ] Complete daily check-in on Day 1
- [ ] Complete daily check-in on Day 2
- [ ] Verify 2-day streak displayed
- [ ] Read on consecutive days
- [ ] Verify reading streak increments

### Achievement Unlocking
- [ ] Upload first book → "First Steps" unlocks
- [ ] Create 10th note → "Note Taker" unlocks
- [ ] Read 3 consecutive days → "3-Day Streak" unlocks
- [ ] Verify achievement points added to total

### Edge Cases
- [ ] Try to check in twice in same day (should be prevented)
- [ ] Close browser and reopen (session should persist)
- [ ] Update page count multiple times in same session
- [ ] Verify no duplicate points awarded

---

## 8. Known Issues & Missing Features

### ⚠️ Needs Implementation
1. **Daily Login Tracking**: No automatic tracking on user login
   - Recommended: Add to AuthContext on successful login

2. **Book Completion Tracking**: No explicit book completion event
   - Recommended: Add tracking when user marks book as finished or reads final page

3. **Highlight Creation**: Cannot find highlight tracking implementation
   - Recommended: Add to BookNotesSystem or ReadBookEnhanced when highlights are saved

### ⚠️ Needs Verification
1. **Reading Time Tracking**: Verify 1 point per minute is calculated correctly
2. **Time-Based Achievements**: Early Bird and Night Owl achievements may need session time tracking
3. **Speed Reader Achievement**: Requires tracking pages per session
4. **Marathon Reader Achievement**: Requires tracking session duration

---

## 9. Manual Test Scenarios

### Scenario 1: New User Complete Flow
1. Create new account and login
2. Upload 3 books → Expect 75 points total
3. Start reading first book → Expect 80 points
4. Read 10 pages → Expect 90 points
5. Complete session after 5 minutes → Expect 105 points
6. Create 2 notes → Expect 135 points
7. Daily check-in → Expect 145 points
8. Check achievements → "First Steps" should be unlocked

### Scenario 2: Streak Building
**Day 1:**
- Check in → 10 points, 1-day check-in streak
- Read for 30 mins → Track reading session

**Day 2:**
- Check in → 10 points, 2-day check-in streak
- Read for 30 mins → Track reading session, 2-day reading streak

**Day 3:**
- Check in → 10 points, 3-day check-in streak
- Read for 30 mins → Track reading session, 3-day reading streak
- **Achievement**: "3-Day Streak" unlocks → +100 points

### Scenario 3: Heavy Note Taking
1. Create 10 notes → 150 points
2. **Achievement**: "Note Taker" unlocks → +150 points = 300 points total
3. Create 15 more notes (25 total) → +225 points
4. **Achievement**: "Highlighter" (if highlights = notes for testing) → +200 points

---

## 10. Debugging Tips

### Console Logs to Watch For
```
✅ Book upload tracked successfully - 25 points awarded
✅ Reading session start tracked - 5 points awarded
✅ X page(s) tracked - X point(s) awarded
✅ Reading session completed tracked - 10 points + X minutes
✅ Note creation tracked - 15 points awarded
✅ Daily check-in complete! +10 points earned!
📊 Calculated reading streak: X days
🏆 Achievement unlocked: [Achievement Name]
```

### localStorage Keys to Inspect
```javascript
// In browser console:
localStorage.getItem('gamification_stats_[userId]')
localStorage.getItem('gamification_achievements_[userId]')
localStorage.getItem('active_reading_session')
localStorage.getItem('readingSessionHistory')
localStorage.getItem('lastDailyCheckIn')
localStorage.getItem('checkInStreak')
```

### Common Issues
1. **Points not awarded**: Check console for tracking errors
2. **Achievements not unlocking**: Verify stats are updating correctly
3. **Streaks not calculating**: Check session history and dates
4. **Duplicate points**: Clear localStorage and retest

---

## 11. Next Steps

### High Priority
1. ✅ Fix event name inconsistencies (COMPLETED)
2. ⚠️ Implement daily login tracking
3. ⚠️ Implement book completion tracking
4. ⚠️ Verify highlight creation tracking
5. ⚠️ Add achievement unlock notifications/modal

### Medium Priority
1. Implement time-based achievements (Early Bird, Night Owl)
2. Implement session-based achievements (Speed Reader, Marathon Reader)
3. Add real-time point animation in UI
4. Create achievement showcase page

### Low Priority
1. Add leaderboard functionality
2. Add social sharing for achievements
3. Create weekly/monthly challenges
4. Add point multipliers for special events

---

## Success Criteria

✅ **All actions properly tracked and award correct points**
✅ **Achievements unlock when conditions are met**
✅ **Streaks calculate correctly across sessions**
✅ **Points persist in localStorage and sync with server**
✅ **No duplicate point awards**
✅ **Clear console logs for debugging**
✅ **User feedback (snackbars) for all point-earning actions**

---

**Document Version**: 1.0
**Last Updated**: 2025-10-09
**Status**: Ready for Testing
