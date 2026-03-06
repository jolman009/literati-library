# Chrome Web Store Listing — ShelfQuest Extension

## Store Listing Fields

**Name:** ShelfQuest

**Short Description (132 chars max):**
Save web clippings and notes from any page. Right-click to clip articles or capture notes — all synced to your ShelfQuest library.

**Detailed Description:**
ShelfQuest is your digital reading companion. The extension connects to your ShelfQuest account at shelfquest.org, letting you capture and organize web content without leaving the page.

FEATURES

- Save as Clipping — Right-click any page or selected text to save it as a clipping with the page title, URL, favicon, and Open Graph metadata. HTML selections are automatically converted to clean markdown.

- Save as Note — Select text and right-click to save it as a note with full source citation. Notes appear on your Notes page with a link back to the original source.

- Quick Note — Open the popup and jot down a thought instantly. The current tab's URL is automatically attached as the source. Add comma-separated tags for easy organization.

- Source Citations — Every web-captured note shows its source URL on your Notes page, so you always know where an idea came from.

- Clippings Dashboard — View, search, edit, and manage all your clippings at shelfquest.org/clippings. Filter by read status, search by title or tags, and link clippings to books in your library.

HOW IT WORKS

1. Sign in with your ShelfQuest account
2. Browse the web normally
3. When you find something worth saving, select text and right-click
4. Choose "ShelfQuest > Save as Clipping" or "Save as Note"
5. Check the popup for save confirmation
6. View your saved content at shelfquest.org

PRIVACY & SECURITY

- Bearer token authentication (no cookies)
- Your data is stored securely in your ShelfQuest account
- The extension only accesses page content when you explicitly trigger a save action
- No background tracking or analytics
- Full privacy policy: https://shelfquest.org/legal/privacy-policy

Requires a free ShelfQuest account at https://shelfquest.org

**Category:** Productivity

**Language:** English

---

## Permission Justifications (for Chrome review)

| Permission | Justification |
|-----------|---------------|
| `storage` | Stores authentication tokens and save-status in chrome.storage.local for session persistence across popup opens |
| `contextMenus` | Creates "ShelfQuest > Save as Clipping" and "Save as Note" right-click menu items |
| `activeTab` | Accesses the current tab's URL and content only when the user triggers a save via context menu |
| `scripting` | Injects the content script on-demand when the context menu is used on a tab that was open before the extension was installed |
| `alarms` | Refreshes the authentication token every 14 minutes to maintain the user's session |

**Content Scripts (`<all_urls>`):**
The content script listens for save commands from the background worker. It only activates when the user explicitly right-clicks and selects a ShelfQuest action. It does not modify page content, inject UI elements, or run any code passively.

---

## Required Assets

| Asset | Spec | File |
|-------|------|------|
| Store Icon | 128x128 PNG | `extension/src/assets/icon-128.png` |
| Screenshot 1 | 1280x800 PNG | Popup with QuickNote panel (authenticated state) |
| Screenshot 2 | 1280x800 PNG | Context menu showing ShelfQuest > Save as Clipping / Save as Note |
| Screenshot 3 | 1280x800 PNG | Clippings page at shelfquest.org |
| Screenshot 4 | 1280x800 PNG | Notes page showing a note with source citation |
| Promo tile (optional) | 440x280 PNG | ShelfQuest logo + tagline |

**Privacy Policy URL:** https://shelfquest.org/legal/privacy-policy

**Support Email:** info@shelfquest.org

**Website:** https://shelfquest.org
