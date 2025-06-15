# Changelog

All notable changes to ChatGPT Compass will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Export functionality for conversations and bookmarks
- Analytics dashboard with conversation statistics
- Bookmark tags for better organization
- Custom theme options

## [1.0.0] - 2024-01-XX

### Added
- 🎯 **Smart Message Navigation**
  - Real-time message extraction from ChatGPT conversations
  - Instant click-to-navigate functionality
  - Turn-by-turn message tracking
  - Smooth animated scrolling with highlighting

- 📌 **Advanced Bookmarking System**
  - One-click bookmark functionality
  - Visual indicators with animated rainbow borders
  - Persistent local storage
  - Cross-conversation bookmark tracking
  - Dedicated bookmark management panel

- 🔍 **Powerful Search & Filter**
  - Real-time search through all messages
  - Case-sensitive/insensitive search options
  - Time-based filtering (today, week, month)
  - Multiple sorting options (recent, oldest, chat, content)

- 🎨 **Modern UI/UX Design**
  - Glassmorphism design with backdrop blur effects
  - AI-inspired animations and gradients
  - Automatic theme adaptation (light/dark)
  - Responsive layout for all screen sizes
  - Vibrant color palette with smooth transitions

- 🚀 **Chrome Sidepanel Integration**
  - Native Chrome sidepanel API integration
  - Non-intrusive ChatGPT interface
  - Always accessible from toolbar
  - Performance optimized

### Technical Features
- React 18 with TypeScript architecture
- Chrome Extensions Manifest V3 compliance
- Webpack 5 build system
- Local storage for privacy
- MutationObserver for real-time updates
- Theme detection system
- Error handling and retry mechanisms

### Fixed
- Bookmark icon visibility in dark mode
- Message highlighting animation timing
- Cross-browser compatibility issues
- Memory leak prevention in observers

### Changed
- Improved bookmark icon contrast in dark mode (#e5e7eb → #f3f4f6)
- Enhanced border color visibility (#4a4a4a → #525252)
- Optimized theme-aware background colors
- Better error handling for edge cases

## [0.1.0] - Initial Development

### Added
- Basic extension structure
- Chrome sidepanel integration
- Message extraction prototype
- Basic UI components 