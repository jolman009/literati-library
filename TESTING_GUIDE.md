# Quick Testing Guide: Mobile Bottom Sheet

## 🚀 Quick Start (30 seconds)

```bash
pnpm dev
```

Open Chrome → F12 → Device toolbar (Cmd+Shift+M) → iPhone 13 Pro → http://localhost:5173

## 📱 Test Flow (2 minutes)

### 1. **Open Bottom Sheet**
```
Navigate: Dashboard → Any Book → Start Reading
Action:   Tap the 📝 FAB (bottom-right corner)
Expected: Bottom sheet slides up to PEEK state (10% height)
          Shows: [🎤 Voice Note] [✍️ Type Note] [✕]
```

### 2. **Test Voice Recording**
```
Action:   Tap "🎤 Voice Note" button
Expected: - Microphone permission prompt (first time)
          - Sheet auto-expands to HALF state (48% height)
          - Button turns red with pulsing animation
          - Speak: "This is a test note"
          - See transcription appear in real-time
Action:   Tap voice button again to stop
Expected: Recording stops, text remains
```

### 3. **Test Drag Gestures**
```
Action:   Drag handle UP (the gray bar at top of sheet)
Expected: Sheet smoothly snaps to FULL state (88% height)

Action:   Drag handle DOWN slowly
Expected: Sheet snaps to nearest state (FULL → HALF → PEEK)

Action:   Fast swipe UP from PEEK
Expected: Sheet skips HALF and jumps directly to FULL

Action:   Fast swipe DOWN from FULL
Expected: Sheet skips HALF and drops to PEEK
```

### 4. **Test Editing Features**
```
In HALF or FULL state:
Action:   Click "✍️" button (plain text ↔ markdown toggle)
Expected: Editor switches between textarea and MDEditor

Action:   Click "📋" button (templates)
Expected: Dropdown appears ABOVE sheet showing 5 templates
          (Quote, Question, Summary, Insight, Analysis)

Action:   Click "Quote" template
Expected: Template inserts into editor with placeholder text

Action:   Type some content
Expected: Text appears normally, save button becomes enabled
```

### 5. **Test Saving**
```
Action:   Type "This is my test note"
Expected: Save button enabled (blue, not grayed out)

Action:   (Optional) Add tags: "test, mobile"
Expected: Tag input accepts text

Action:   Click "💾 Save" button
Expected: - Snackbar shows "Note saved successfully! ⭐ Total points: X"
          - Note content clears
          - Sheet minimizes back to PEEK state automatically
```

### 6. **Test Overlay Dimming**
```
State:    PEEK (10%)
Expected: No overlay visible, book fully bright

State:    HALF (48%)
Expected: Subtle dark overlay (20% opacity), book slightly dimmed

State:    FULL (88%)
Expected: Darker overlay (40% opacity), book more dimmed for focus

Action:   Tap the dimmed book area in HALF or FULL state
Expected: Sheet minimizes to PEEK (not close completely)

Action:   Tap dimmed area again in PEEK state
Expected: Sheet closes completely
```

### 7. **Test Responsive Behavior**
```
Action:   Resize browser window > 768px wide
Expected: Bottom sheet disappears, traditional sidebar appears instead

Action:   Resize back < 768px
Expected: Bottom sheet returns, sidebar disappears

Action:   Rotate device to landscape
Expected: Bottom sheet still works (narrower height due to screen)
```

### 8. **Test Dark Mode**
```
Action:   Toggle theme in top-right corner
Expected: Bottom sheet colors update immediately
          - Light: White background, dark text
          - Dark: Dark gray background, light text
          - Voice button stays blue in both themes
```

## ⚠️ Edge Cases to Test

### Empty Note Prevention
```
Action:   Open sheet, leave content empty, tap Save
Expected: Warning snackbar: "Cannot save empty note"
          Sheet stays open, button remains disabled
```

### Voice Not Supported
```
Browser:  Firefox (if Speech API not available)
Action:   Tap Voice button
Expected: Error snackbar: "Voice input not supported in this browser"
```

### Network Error (Offline)
```
Action:   Open DevTools Network tab → Set to "Offline"
Action:   Type note and tap Save
Expected: Warning snackbar: "⚠️ Network error. Note saved locally - will sync when online ✓"
          Note stored in localStorage
          Sheet minimizes normally
```

### Long Note (Performance)
```
Action:   Paste a 5000-word essay into the editor
Expected: - Typing remains smooth (no lag)
          - Drag gestures still 60fps
          - Markdown preview renders without jank (in full state)
```

### Rapid State Changes
```
Action:   Quickly drag up and down 10 times in a row
Expected: - No visual glitches
          - Animations remain smooth
          - Sheet doesn't get "stuck" between states
          - Always snaps cleanly to nearest state
```

## ✅ Success Criteria

All of these should be TRUE:

- [x] Bottom sheet only appears on mobile (<768px)
- [x] Desktop users still see the sidebar (no changes)
- [x] Peek state is unobtrusive (10% height)
- [x] Voice button is largest and most prominent in peek
- [x] Dragging feels smooth and native (not jittery)
- [x] Snap points feel intentional (not arbitrary)
- [x] Half state lets you still see book content (52% visible)
- [x] Full state provides immersive editing (88% height)
- [x] Overlay dimming helps focus without being too dark
- [x] Saving auto-minimizes back to peek (good UX loop)
- [x] Dark mode looks good (not washed out)
- [x] Voice transcription works in Chrome/Safari
- [x] Templates insert correctly with formatting
- [x] No errors in browser console
- [x] Build passes without warnings

## 🐛 Known Limitations

These are NOT bugs (by design):

1. **Desktop users don't see this** - Only <768px gets bottom sheet
2. **Voice requires HTTPS** - Web Speech API needs secure context (works on localhost)
3. **Voice browser support** - Chrome/Edge/Safari only (not Firefox)
4. **Markdown in half state** - Limited height (200px), expand to full for better editing
5. **Template dropdown** - Appears above sheet (limited space below)

## 📊 Performance Benchmarks

Use Chrome DevTools Performance tab:

```
Action:   Record opening/closing bottom sheet 10 times
Expected: - Layout shifts: 0
          - Paint time: < 16ms per frame (60fps)
          - JavaScript execution: < 5ms per interaction
          - Memory: No leaks (heap size stable after 10 cycles)
```

## 🎬 Recording Demo

### Suggested Demo Flow (30-second GIF):
1. Show book in reading mode (mobile view)
2. Tap FAB → Peek appears
3. Tap voice → Auto-expands, speak "Testing voice notes"
4. Drag up to full state
5. Insert Quote template
6. Drag back down through states
7. Save → Auto-minimizes
8. Close sheet

### Tools:
- **Mac:** Kap (free, https://getkap.co)
- **Windows:** ScreenToGif (free)
- **Linux:** Peek (sudo apt install peek)

**Settings:**
- Resolution: 390×844 (iPhone 13 Pro)
- FPS: 60 (smooth animations)
- Format: GIF or MP4
- Duration: 30-45 seconds max

---

## 🚨 If Something Doesn't Work

### Bottom sheet doesn't appear?
- Check browser width < 768px
- Open console, look for React errors
- Verify you're on `/read/:bookId` page (not /notes page)

### Drag gestures feel broken?
- Check `framer-motion` is installed: `pnpm list framer-motion`
- Clear browser cache (Cmd+Shift+R)
- Try different browser (Chrome works best)

### Voice doesn't work?
- Check microphone permissions
- Use HTTPS or localhost (not HTTP)
- Try Chrome (best support)
- Check console for Speech API errors

### Build fails?
```bash
# Clean install
rm -rf node_modules
pnpm install

# Clear cache
rm -rf client2/dist
pnpm run build
```

---

**Questions?** Check the main PR description (PR_DESCRIPTION.md) for detailed explanations!
