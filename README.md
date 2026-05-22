# 🧭 ChatGPT Compass

> Navigate your ChatGPT conversations with precision and style

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-brightgreen?style=for-the-badge&logo=googlechrome)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue?style=for-the-badge)

**ChatGPT Compass** is a powerful Chrome extension that transforms how you navigate and manage your ChatGPT conversations. Built with modern web technologies and featuring a stunning AI-inspired interface, it provides seamless message tracking, bookmarking, and navigation capabilities right within ChatGPT's interface.

## 🧩 Product Problem Statement

ChatGPT conversations are increasingly used as long-running workspaces for research, planning, coding help, writing, and decision-making, but the native ChatGPT experience offers limited tools for rediscovering important context inside a single conversation. When a thread grows beyond 20 messages, users often have to manually scroll through long exchanges to find an earlier prompt, key answer, decision, link, code snippet, or instruction. This becomes even harder days or weeks later, when the user remembers that the information exists but cannot quickly locate where it appeared.

The missing product capabilities create friction for users who rely on ChatGPT as a knowledge workspace:

- No dedicated in-conversation search for quickly finding previously sent messages or responses.
- No lightweight way to mark, save, or return to important moments inside long conversations.
- No structured navigation across user prompts and ChatGPT responses in lengthy threads.
- No efficient recovery path for valuable context after time has passed.
- Increased cognitive load from repeatedly rereading and scrolling through old messages.

## 💡 Product Solution Statement

ChatGPT Compass addresses this problem by adding a product layer for conversation navigation, discovery, and retention directly inside the ChatGPT experience. It helps users treat long conversations as organized, searchable workspaces instead of disposable chat logs.

The solution focuses on practical productivity outcomes:

- Surface conversation messages in a side panel so users can quickly scan the thread structure.
- Enable fast search and filtering to rediscover specific content without manual scrolling.
- Provide bookmarking so important prompts, answers, decisions, and references can be saved.
- Support direct navigation back to selected messages with clear visual highlighting.
- Preserve saved context across sessions so useful information remains accessible later.

## ✨ Features

### 🎯 **Smart Message Navigation**
- **Real-time Message Extraction**: Automatically detects and extracts all your messages from ChatGPT conversations
- **Instant Navigation**: Click any message in the sidebar to jump directly to it in the chat
- **Turn-by-Turn Tracking**: Each message is indexed by conversation turn for precise navigation
- **Smooth Scrolling**: Animated scroll-to-message with highlighting effects

### 📌 **Advanced Bookmarking System**
- **One-Click Bookmarking**: Bookmark any message with a single click
- **Visual Indicators**: Bookmarked messages feature stunning animated borders with rainbow gradients
- **Smart Management**: Organized bookmark panel with search, filtering, and sorting capabilities
- **Persistent Storage**: Bookmarks are saved locally and persist across browser sessions
- **Cross-Chat Tracking**: Bookmarks work across different ChatGPT conversations

### 🔍 **Powerful Search & Filter**
- **Real-time Search**: Instantly search through all your messages as you type
- **Content Filtering**: Filter messages by content, date, or bookmark status
- **Case Sensitivity Toggle**: Flexible search options for precise or broad matching
- **Time-based Filtering**: Filter bookmarks by today, this week, or this month
- **Smart Sorting**: Sort by recent, oldest, chat, or content

### 🎨 **Modern UI/UX Design**
- **Glassmorphism Interface**: Beautiful frosted glass design with backdrop blur effects
- **AI-Inspired Animations**: Dynamic gradients, pulsing effects, and smooth transitions
- **Theme Adaptive**: Automatically adapts to ChatGPT's light and dark themes
- **Responsive Layout**: Works perfectly on all screen sizes
- **Vibrant Color Palette**: Rich teals, blues, purples, and rainbow gradients

### 🚀 **Chrome Sidepanel Integration**
- **Native Sidepanel**: Utilizes Chrome's built-in sidepanel API for seamless integration
- **Always Accessible**: Toggle the sidepanel from the Chrome toolbar or context menu
- **Non-Intrusive**: Doesn't interfere with ChatGPT's native functionality
- **Performance Optimized**: Minimal impact on ChatGPT's performance

## 🛠 Installation

### Option 1: Developer Mode Installation

1. **Download the Extension**
   ```bash
   git clone https://github.com/imgul/chatgpt-compass.git
   cd chatgpt-compass
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked" and select the `dist` folder
   - The extension will appear in your Chrome toolbar

## 📖 Usage Guide

### Getting Started

1. **Open ChatGPT**: Navigate to [ChatGPT](https://chat.openai.com) in Chrome
2. **Open Sidepanel**: Click the ChatGPT Compass icon in the Chrome toolbar
3. **Start Chatting**: Begin or continue any ChatGPT conversation
4. **Watch the Magic**: Your messages automatically appear in the sidebar

### Message Navigation

- **View Messages**: All your messages appear in the sidebar with timestamps
- **Click to Navigate**: Click any message to jump directly to it in the chat
- **Message Highlighting**: Selected messages are highlighted with animated borders
- **Auto-refresh**: New messages appear automatically as you chat

### Bookmarking Messages

- **Add Bookmarks**: Hover over any message in ChatGPT and click the bookmark icon
- **Visual Feedback**: Bookmarked messages get a stunning animated rainbow border
- **Manage Bookmarks**: Use the dedicated Bookmarks panel in the sidebar
- **Remove Bookmarks**: Click the trash icon to remove bookmarks

### Search & Filter

- **Search Messages**: Use the search bar to find specific content
- **Filter Options**: Use dropdown filters for time-based filtering
- **Sort Results**: Choose from multiple sorting options
- **Bookmark Search**: Dedicated search functionality for bookmarked messages

## 🏗 Technical Architecture

### Core Technologies

- **Frontend**: React 18 with TypeScript
- **Build System**: Webpack 5 with custom configuration
- **Extension API**: Chrome Extensions Manifest V3
- **Storage**: Chrome Local Storage API
- **Styling**: Modern CSS with custom properties and animations

### Key Components

#### Content Script
- Message extraction and DOM manipulation
- Theme detection and bookmark management
- Real-time message monitoring with MutationObserver

#### Background Service Worker
- Extension lifecycle management
- Inter-component communication hub
- Bookmark data persistence

#### Sidepanel Interface
- React-based user interface
- Theme context and state management
- Search and filtering logic

## 🎯 Browser Compatibility

- **Chrome**: Version 88+ (Manifest V3 support required)
- **Edge**: Version 88+ (Chromium-based)
- **Brave**: Version 1.20+ (Chromium-based)

## 🚧 Development

### Prerequisites

- Node.js 16+ and npm
- Chrome browser with Developer Mode enabled
- TypeScript knowledge for contributions

### Development Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/imgul/chatgpt-compass.git
   cd chatgpt-compass
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Mode**
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run build` - Production build
- `npm run dev` - Development build with watch mode
- `npm run clean` - Clean build artifacts

### Project Structure

```
chatgpt-compass/
├── src/
│   ├── background/          # Background service worker
│   ├── content/            # Content script for ChatGPT integration
│   ├── sidepanel/          # React sidepanel application
│   ├── types/              # TypeScript type definitions
│   └── config/             # Configuration files
├── public/                 # Static assets and manifest
├── webpack.config.js       # Webpack configuration
└── dist/                   # Built extension (generated)
```

## 🔐 Privacy & Security

- **Local Storage Only**: All data is stored locally in your browser
- **No External Servers**: No data is sent to external servers
- **Permission Minimal**: Requests only necessary Chrome permissions
- **Open Source**: Full transparency with public source code
- **No Tracking**: Zero analytics or tracking functionality

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commit Changes**: `git commit -m 'Add amazing feature'`
4. **Push to Branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

## 📄 License

This project is licensed under the MIT License.

## 🗺 Roadmap

### Current Version (v1.0)
- ✅ Basic message navigation
- ✅ Bookmark system
- ✅ Search and filtering
- ✅ Theme adaptation
- ✅ Chrome sidepanel integration

### Upcoming Features
- 🔄 **Export Functionality**: Export conversations and bookmarks
- 📊 **Analytics Dashboard**: Conversation statistics and insights
- 🏷 **Bookmark Tags**: Categorize bookmarks with custom tags
- 🎨 **Custom Themes**: User-customizable color schemes

---

**Made with ❤️ for the ChatGPT community**

*Enhance your AI conversations with style and precision* ✨ 
