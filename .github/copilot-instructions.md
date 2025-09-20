# ChatGPT Compass - AI Coding Instructions# Copilot Instructions for ChatGPT Compass



## Project Overview## Project Overview

**ChatGPT Compass** is a Chrome Extension (Manifest V3) that provides real-time message navigation, bookmarking, and search capabilities for ChatGPT conversations. It uses React sidepanel integration with TypeScript and a sophisticated content script architecture.- **ChatGPT Compass** is a Chrome extension for advanced ChatGPT conversation management: message tracking, bookmarking, search/filter, and navigation.

- Built with **React 18 + TypeScript** (sidepanel UI), **Webpack 5** (custom config), and **Chrome Extension Manifest V3**.

## Core Architecture- Data is stored **locally** using the Chrome Storage API. No external servers or analytics.



### Three-Component System## Architecture & Key Components

1. **Content Script** (`src/content/content.ts`) - DOM manipulation on ChatGPT pages- `src/background/`: Service worker for extension lifecycle, bookmark persistence, and inter-component messaging.

2. **Background Service Worker** (`src/background/background.ts`) - Message routing and persistence  - `src/content/`: Content script for DOM extraction, message monitoring (MutationObserver), theme detection, and bookmark triggers.

3. **React Sidepanel** (`src/sidepanel/`) - User interface and state management- `src/sidepanel/`: React UI for navigation, search, filtering, and bookmark management. Uses context for theme and bookmarks.

- `src/types/`: TypeScript types for bookmarks and message data.

### Message Communication Pattern- `src/config/`: Configuration logic and constants.

- **Content → Background**: `chrome.runtime.sendMessage()` for message extraction updates- `manifest.json`: Chrome extension manifest (permissions, entry points, icons).

- **Sidepanel → Background**: API calls for message retrieval and navigation commands

- **Background → Content**: Message forwarding for scroll-to-message actions## Developer Workflows

- **Storage Events**: Real-time updates via `chrome.storage.onChanged` listeners- **Install**: `npm install`

- **Build (prod)**: `npm run build` → outputs to `dist/`

## Key Implementation Patterns- **Dev mode**: `npm run dev` (watch mode)

- **Clean**: `npm run clean`

### Content Script DOM Integration- **Load in Chrome**: Use `dist/` as unpacked extension

```typescript- **Config**: Environment variables (see `CONFIG.md`), e.g. `HIGHLIGHT_DURATION_SECONDS` for UI animation

// Message extraction uses specific ChatGPT selectors

const messageSelector = '[data-message-author-role="user"]';## Project Conventions & Patterns

// MutationObserver pattern for real-time detection- **Component Structure**: Sidepanel UI is modular, with context providers for bookmarks and theme (`BookmarkContext.tsx`, `ThemeContext.tsx`).

this.observer = new MutationObserver((mutations) => {- **Styling**: Modern CSS with custom properties and AI-inspired color palette (see `CONFIG.md`).

  this.extractUserMessages();- **Data Flow**: Content script extracts messages → background script persists bookmarks → sidepanel UI displays and manages state.

});- **Communication**: Uses Chrome messaging API for cross-script communication.

```- **No tracking**: All data is local; privacy is a core principle.



**Critical**: Always use `waitForDOM()` before DOM manipulation and implement retry logic for dynamic content.## Integration & Extensibility

- **Manifest V3**: All extension logic must comply with Manifest V3 (service worker, no background pages).

### Bookmark System Architecture- **Chrome APIs**: Uses `chrome.storage`, `chrome.runtime`, and `chrome.sidePanel`.

- **Storage**: `chrome.storage.local` with structured `BookmarkStorage` interface- **No external backend**: All logic is client-side.

- **Context Pattern**: React Context (`BookmarkContext.tsx`) manages all bookmark operations

- **Visual Feedback**: CSS animations with rainbow gradient borders for bookmarked messages## Examples & References

- **Persistence**: Auto-sync between content script visual states and storage- For message extraction, see `src/content/content.ts`.

- For bookmark logic, see `src/background/background.ts` and `src/sidepanel/BookmarkContext.tsx`.

### Theme Integration- For UI patterns, see `src/sidepanel/components/`.

- **Auto-detection**: Content script detects ChatGPT's light/dark theme via DOM classes- For configuration, see `CONFIG.md` and `src/config/config.ts`.

- **Adaptive Styling**: CSS custom properties update based on detected theme

- **Context Management**: `ThemeContext.tsx` provides theme state throughout React components## Contribution & Quality

- Follow the modular React/TypeScript patterns in `src/sidepanel/`.

## Development Workflows- Use the provided types in `src/types/` for all bookmark/message data.

- Test changes in both dev and production builds.

### Build System (Webpack)- See `README.md` for full setup, usage, and roadmap.

```bash

npm run dev    # Development with watch mode---

npm run build  # Production build to dist/For questions or unclear patterns, review `README.md`, `CONFIG.md`, and the code in `src/` for canonical examples.

```

**Entry Points**: 
- `sidepanel`: React app bundle
- `background`: Service worker
- `content`: ChatGPT integration script

### Extension Loading
1. Build project: `npm run build`
2. Load `dist/` folder in Chrome Developer Mode
3. Test on `https://chatgpt.com` or `https://chat.openai.com`

### Debugging Patterns
- **Content Script**: Use browser DevTools on ChatGPT page
- **Background**: Chrome Extensions page → Inspect Service Worker
- **Sidepanel**: Right-click sidepanel → Inspect

## Component-Specific Guidelines

### Content Script (`content.ts`)
- **Message Extraction**: Uses turn-based indexing (`turnIndex`) for precise navigation
- **Bookmark Buttons**: Dynamically injected with `createBookmarkButton()` method
- **Scroll Animation**: Implements smooth scrolling with highlight effects via `scrollToMessage()`
- **Theme Detection**: Monitors DOM changes for theme switching

### Background Worker (`background.ts`)
- **Tab Management**: Maintains `tabMessages` Map for per-tab message storage
- **Sidepanel Control**: Handles extension icon clicks and redirects non-ChatGPT pages
- **Message Routing**: Central hub for content ↔ sidepanel communication

### React Sidepanel
- **State Management**: Combines React Context (bookmarks, theme) with local component state
- **Search Implementation**: Real-time filtering with content/number search modes
- **Bookmark Management**: CRUD operations with visual feedback and persistence

## Critical Dependencies

### Chrome APIs Used
- `sidePanel` - Main UI integration
- `storage.local` - Bookmark and message persistence  
- `activeTab` + `scripting` - Content script injection
- `notifications` - User feedback for redirects

### External Libraries
- **React 18** with functional components and hooks
- **react-icons/hi** for consistent iconography
- **TypeScript** with strict mode enabled

## Common Patterns

### Error Handling
```typescript
// Always wrap Chrome API calls
chrome.runtime.sendMessage(message, (response) => {
  if (chrome.runtime.lastError) {
    console.error('Message failed:', chrome.runtime.lastError);
    return;
  }
  // Process response
});
```

### Async Storage Operations
```typescript
// Consistent pattern for bookmark operations
const saveStorage = async (newStorage: BookmarkStorage) => {
  try {
    await chrome.storage.local.set({ bookmarkStorage: newStorage });
    setStorage(newStorage);
  } catch (error) {
    console.error('Storage save failed:', error);
  }
};
```

### Dynamic Content Handling
```typescript
// Wait for ChatGPT's dynamic content before DOM operations
private async waitForDOM(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', () => resolve());
    }
  });
}
```

## Configuration
- **Environment**: Config values in `src/config/config.ts` with webpack DefinePlugin injection
- **Manifest**: Permissions and host patterns in `manifest.json`
- **Build Settings**: Entry points and asset copying in `webpack.config.js`

## Testing Approach
- **Manual Testing**: Load extension in Chrome and test on live ChatGPT
- **Console Logging**: Extensive logging for debugging message flow and state changes
- **Storage Inspection**: Use Chrome DevTools Application tab to verify bookmark persistence