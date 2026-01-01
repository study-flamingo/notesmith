# NoteSmith Chrome Extension

A browser extension for inserting NoteSmith clinical notes into web-based practice management systems.

## Features

- View recent clinical notes from NoteSmith
- Insert notes directly into any text field
- Copy notes to clipboard
- Secure session-based authentication

## Development

```bash
# Install dependencies
npm install

# Start development server (Chrome)
npm run dev

# Start development server (Firefox)
npm run dev:firefox

# Build for production
npm run build

# Package for distribution
npm run zip
```

## Architecture

Built with [WXT](https://wxt.dev/) - a modern framework for browser extensions.

```
extension/
├── entrypoints/
│   ├── popup/          # Extension popup UI (React)
│   ├── background.ts   # Service worker (auth, API)
│   └── content.ts      # Page injection (note insertion)
├── components/         # Shared React components
├── lib/                # API client, storage utilities
└── wxt.config.ts       # WXT configuration
```

## Authentication Flow

1. User clicks "Sign in" in the popup
2. Extension opens NoteSmith web app at `/auth/extension`
3. User authenticates via Supabase
4. Web app sends JWT back to extension via `postMessage`
5. Extension stores token in `chrome.storage.session` (session-only for security)

## Security (HIPAA Compliance)

- **Session-only storage**: Tokens cleared on browser close
- **No PHI caching**: Full note content fetched on-demand
- **Audit logging**: All insertions logged server-side
- **Auto-timeout**: Configurable inactivity logout

