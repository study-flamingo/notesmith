# Chrome Extension Design Document

## Overview

The NoteSmith Chrome Extension enables users to insert generated clinical notes directly into web-based practice management systems (PMS) without copy-pasting.

## Goals

1. **Streamlined workflow**: One-click note insertion from browser toolbar
2. **Universal compatibility**: Works with any web-based PMS via manual field targeting
3. **HIPAA compliance**: Secure auth, session-only storage, audit trail

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Chrome Extension (WXT)                             │
│                                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌──────────────────┐                  │
│  │  Popup      │   │  Content    │   │  Service Worker  │                  │
│  │  (React)    │   │  Script     │   │  (Auth + API)    │                  │
│  │             │   │             │   │                  │                  │
│  │ • Note list │   │ • Listen    │   │ • Store JWT      │                  │
│  │ • Search    │   │   for       │   │ • Fetch notes    │                  │
│  │ • Copy btn  │   │   "insert"  │   │ • Mark inserted  │                  │
│  │             │   │ • Paste     │   │                  │                  │
│  └─────────────┘   │   into      │   └──────────────────┘                  │
│        │           │   focused   │            │                            │
│        │           │   field     │            │                            │
│        └───────────┴─────────────┴────────────┘                            │
│                           │                                                │
└───────────────────────────┼────────────────────────────────────────────────┘
                            ▼
                   ┌─────────────────┐
                   │  FastAPI + API  │
                   │  (existing)     │
                   └─────────────────┘
```

## User Flow

1. **Authentication**
   - User clicks extension icon → "Sign in with NoteSmith"
   - Opens NoteSmith web app for authentication
   - Web app returns JWT to extension via `postMessage`

2. **Viewing Notes**
   - Popup displays today's notes (most recent first)
   - Search by patient name or date
   - Click to expand and preview full note

3. **Inserting Notes**
   - User focuses a text field in their PMS
   - User clicks "Insert" on a note in the popup
   - Content script inserts note into the focused field
   - Toast notification confirms success

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | WXT (Vite-based) |
| UI | React 19, Tailwind CSS |
| Manifest | Chrome Extension V3 |
| Storage | `chrome.storage.session` |

## Backend API Additions

New endpoints needed for extension support:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/notes/pending` | GET | Notes not yet marked "inserted" |
| `/api/v1/notes/{id}/mark-inserted` | POST | Audit trail for insertion |
| `/api/v1/auth/extension` | GET | Extension auth callback page |

## Security Considerations

### Token Storage
- Use `chrome.storage.session` (not `local`)
- Tokens cleared when browser closes
- Token refresh before expiry

### Data Handling
- No PHI stored in extension
- Note content fetched on-demand
- IDs and metadata cached briefly

### Audit Trail
- Log every insertion with timestamp
- Record target page URL (domain only)
- Track which user inserted which note

## Development Phases

### Phase 1: MVP (Current)
- [x] WXT scaffold with React popup
- [x] Note list and card components
- [x] Content script for field insertion
- [ ] Connect to real API endpoints
- [ ] Authentication flow

### Phase 2: Polish
- [ ] Options page (API URL config)
- [ ] Keyboard shortcuts
- [ ] Firefox support
- [ ] Chrome Web Store submission

### Phase 3: Enhancements
- [ ] PMS-specific field detection (Dentrix, Open Dental)
- [ ] Section-by-section insertion
- [ ] Recent insertions history

## File Structure

```
extension/
├── entrypoints/
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   └── style.css
│   ├── background.ts
│   └── content.ts
├── components/
│   ├── NoteList.tsx
│   ├── NoteCard.tsx
│   └── LoginPrompt.tsx
├── lib/
│   ├── api.ts
│   ├── storage.ts
│   └── types.ts
├── package.json
├── wxt.config.ts
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## Distribution

- **Chrome Web Store**: Public listing
- **Unlisted**: Direct CRX for enterprise (if needed)
- **Firefox Add-ons**: Future (WXT supports both)

