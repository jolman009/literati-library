# Quick Test: See the Mobile Bottom Sheet

## 🎯 Most Likely Issue: You're in Desktop View

The bottom sheet ONLY appears when your browser width is **less than 768px**.
If your browser is wider, you'll see the **sidebar from the right** instead.

## ✅ Solution: Force Mobile View

### Method 1: Browser DevTools (Easiest)

1. **Open your app:**
   ```
   pnpm dev
   Visit: http://localhost:5173
   ```

2. **Open DevTools:**
   - Windows: `F12` or `Ctrl+Shift+I`
   - Mac: `Cmd+Option+I`

3. **Toggle Device Toolbar:**
   - Windows: `Ctrl+Shift+M`
   - Mac: `Cmd+Shift+M`
   - Or click the phone/tablet icon in DevTools toolbar

4. **Select a Mobile Device:**
   - Choose "iPhone 13 Pro" (390×844)
   - Or "Pixel 5" (393×851)

5. **Navigate to Reading Page:**
   - Click Dashboard
   - Click any book
   - Click "Start Reading"

6. **Click the 📝 FAB button** (bottom-right floating circle)

7. **You should see:**
   ```
   ┌─────────────────┐
   │   Book Content  │  ← 90% of screen
   │                 │
   ├─────────────────┤  ← Drag handle (gray bar)
   │ [🎤 Voice Note] │  ← Bottom sheet (10% height)
   │ [✍️ Type Note]  │
   │      [✕]       │
   └─────────────────┘
   ```

### Method 2: Resize Browser Window

1. **Resize your browser to be very narrow:**
   - Drag the window edge until it's < 768px wide
   - (About half your screen width)

2. **Refresh the page**

3. **Navigate to reading page and click 📝**

4. **You should see the bottom sheet!**

---

## 🔍 What You See in Each Mode

### Desktop Mode (≥768px width)
```
Browser width: 1024px or wider
When you click 📝:
→ Sidebar slides in from RIGHT side
→ Full-height panel
→ No drag handle at top
→ Shows: Header, Toolbar, Editor, Footer
```

### Mobile Mode (<768px width)
```
Browser width: 375px - 767px
When you click 📝:
→ Bottom sheet slides up from BOTTOM
→ Starts at 10% height (peek mode)
→ Drag handle at top (gray bar)
→ Shows: [🎤 Voice Note] [✍️ Type Note] [✕]

When you click "Type Note":
→ Expands to 88% height (full mode)
→ Shows: Editor, Templates, Voice, Tags
→ You can now type your note!
```

---

## 🐛 Still Not Working? Check Console

### Open Browser Console:
1. Press `F12`
2. Click "Console" tab
3. Look for red errors

### Common Errors and Fixes:

#### Error: "Cannot find module 'framer-motion'"
```bash
cd client2
pnpm install
pnpm dev
```

#### Error: "styles is undefined"
```bash
# Check CSS file exists
ls client2/src/components/BottomSheetNotes.module.css

# If missing, pull latest code
git pull origin main
pnpm install
pnpm dev
```

#### Error: Network errors or 404s
```bash
# Clear cache and rebuild
rm -rf client2/dist
rm -rf client2/node_modules/.vite
pnpm dev
```

---

## 📊 Component Comparison

| Feature | BottomSheetNotes (Mobile) | NotesSidebar (Desktop) |
|---------|---------------------------|------------------------|
| **Trigger** | Browser width < 768px | Browser width ≥ 768px |
| **Direction** | Slides from BOTTOM | Slides from RIGHT |
| **States** | Peek / Half / Full | Open / Closed |
| **Gestures** | Draggable | Not draggable |
| **Voice Button** | Prominent in peek mode | In toolbar |
| **Type Note** | Click to expand | Always visible |

---

## ✅ Success Checklist

You'll know it's working when:

- [ ] Browser width shows < 768px in DevTools
- [ ] Click 📝 FAB button
- [ ] Bottom sheet slides UP from bottom (not from right)
- [ ] See three buttons: Voice Note, Type Note, Close
- [ ] Voice Note button is large and blue
- [ ] Clicking "Type Note" expands sheet to show editor
- [ ] You can drag the gray bar up/down
- [ ] Sheet snaps to peek/half/full positions

---

## 🎬 Screen Recording for Reference

Expected behavior on mobile:

1. **Initial state:** Just the 📝 FAB visible at bottom-right
2. **Click FAB:** Sheet slides up (10% height), shows Voice + Type buttons
3. **Click "Type Note":** Sheet expands to 88% height, shows full editor
4. **Type your note:** Textarea appears with placeholder text
5. **Click Save:** Note saves, sheet minimizes back to 10% (peek)

---

## 🆘 Still Stuck?

If you still can't see the bottom sheet:

1. **Verify you're on mobile view** - Check DevTools shows < 768px
2. **Check console for errors** - F12 → Console tab
3. **Try a different browser** - Chrome works best
4. **Clear all caches:**
   ```bash
   rm -rf client2/dist
   rm -rf client2/node_modules/.vite
   pnpm dev
   ```

---

**Most important:** Make sure your browser width is **less than 768px**!
Use DevTools device toolbar for guaranteed mobile view.
