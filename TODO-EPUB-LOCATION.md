# TODO: EPUB Location Tracking

## Status: Postponed (Pinned for Future Iteration)

## Problem Summary
Attempted to implement page number/location tracking for EPUB files in the FloatingNotepad component, but encountered persistent infinite loop issues.

## What Was Attempted

### Approach 1: EPUB.js `relocated` event
- Used EPUB.js's built-in `relocated` event for location tracking
- **Issue:** In `scrolled-doc` mode, `location.start.percentage` always returns 0 and doesn't track continuous scrolling

### Approach 2: Manual scroll calculation with polling
- Accessed iframe's `contentDocument` to calculate scroll position
- Implemented synthetic page numbers (viewport-based, like Kindle locations)
- Used 500ms polling interval to track changes
- **Issue:** Caused infinite loops despite change detection logic with refs

## Technical Challenges
1. EPUB.js uses sandboxed iframes (`about:srcdoc`) which blocks script execution and scroll event propagation
2. In `scrolled-doc` mode, EPUB.js doesn't provide reliable scroll percentage tracking
3. Polling approach created performance issues and infinite render loops
4. React re-render cycles caused by location state updates

## Files Modified (Now Reverted)
- `client2/src/components/EpubReader.jsx` - Location tracking polling removed
- `client2/src/components/FloatingNotepad.jsx` - Synthetic page UI removed

## Current State
- PDF page tracking works perfectly (uses `currentPage` prop)
- EPUB notes can be saved, but without location metadata
- Notes widget shows "Drag me" hint for EPUBs instead of page/location

## Future Considerations

### Alternative Approaches to Explore:
1. **Chapter-based navigation**: Use EPUB.js's chapter/spine position instead of scroll percentage
2. **CFI-only approach**: Store just the CFI (Canonical Fragment Identifier) and display human-readable chapter names
3. **Event-based vs Polling**: Try IntersectionObserver or ResizeObserver instead of polling
4. **Worker thread**: Move location calculation to Web Worker to prevent main thread blocking
5. **Debouncing**: Add debounce/throttle to location updates (currently tried 500ms intervals)
6. **EPUB.js pagination mode**: Switch from `scrolled-doc` to `paginated` flow (but loses continuous scroll UX)

### Questions to Answer:
- Do users actually need precise page numbers for EPUBs, or is chapter-level tracking sufficient?
- Would a "bookmark" button approach work better than automatic position tracking?
- Can we leverage EPUB.js's built-in location tracking without triggering infinite loops?

## References
- EPUB.js Documentation: https://github.com/futurepress/epub.js/
- CFI Specification: http://www.idpf.org/epub/linking/cfi/epub-cfi.html
- Related discussion in continuation session summary (see commit history)

## Date Postponed
2025-10-08

---
**Note:** When revisiting, review the git history for the attempted implementations before starting fresh.
