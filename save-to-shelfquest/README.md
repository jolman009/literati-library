# Save to ShelfQuest - Edge Extension

A Microsoft Edge extension that lets you save web pages, PDFs, and articles directly to your ShelfQuest library with one click.

## Features

- **One-click save** - Save any webpage via toolbar button or context menu
- **Smart metadata extraction** - Automatically extracts title, author, description, reading time
- **Folder organization** - Save to any folder in your ShelfQuest library
- **Tag support** - Add tags for easy categorization
- **Keyboard shortcut** - `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac)
- **Quick save** - Right-click menu for saving without opening popup

## Development

### Prerequisites

- Node.js 18+
- pnpm (or npm)
- A ShelfQuest account with API access

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Load Extension in Edge

1. Open `edge://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

### Build for Production

```bash
pnpm build
```

## Project Structure

```
save-to-shelfquest/
├── src/
│   ├── background/          # Service worker (context menus, messaging)
│   ├── content/             # Content script (metadata extraction)
│   ├── popup/               # React popup UI
│   ├── components/          # Shared React components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # API client, types, storage helpers
│   └── styles/              # Tailwind CSS
├── public/icons/            # Extension icons
├── manifest.json            # Extension manifest (MV3)
└── vite.config.ts           # Vite + CRXJS config
```

## Configuration

After installing the extension:

1. Click the extension icon
2. Go to Settings
3. Enter your ShelfQuest Supabase URL and anon key
4. Sign in with your ShelfQuest credentials

## Tech Stack

- **React 18** - Popup UI
- **TypeScript** - Type safety
- **Vite + CRXJS** - Fast development & HMR for extensions
- **Tailwind CSS** - Styling
- **Supabase JS** - Backend integration

## License

MIT
