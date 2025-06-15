# ChatGPT Compass

Navigate through your ChatGPT conversations with ease! This Chrome extension extracts all your messages from ChatGPT conversations and displays them in a convenient sidepanel, allowing you to quickly find and jump to any message.

## Features

- 🧭 **Smart Navigation**: Instantly jump to any of your messages in long ChatGPT conversations
- 🔍 **Powerful Search**: Search through all your messages to find what you're looking for
- ⚡ **Real-time Updates**: Automatically detects new messages as you chat
- 🎨 **Beautiful Interface**: Modern, responsive design with glassmorphism effects
- 📱 **Sidepanel Integration**: Uses Chrome's built-in sidepanel for seamless experience
- 🔄 **Live Sync**: Messages update in real-time as you continue your conversation

## Project Structure

```
├── manifest.json          # Chrome extension manifest v3
├── package.json           # Dependencies and scripts
├── webpack.config.js      # Webpack configuration
├── tsconfig.json         # TypeScript configuration
└── src/
    ├── background/
    │   └── background.ts  # Service worker for extension logic
    ├── content/
    │   └── content.ts     # Content script for ChatGPT message extraction
    ├── sidepanel/
    │   ├── index.tsx      # React entry point
    │   ├── App.tsx        # Main React component with message navigation
    │   ├── styles.css     # Styles for the app
    │   └── sidepanel.html # HTML template
    └── icons/
        ├── icon16.png     # 16x16 extension icon
        ├── icon48.png     # 48x48 extension icon
        └── icon128.png    # 128x128 extension icon
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build the Extension**
   ```bash
   # For development (with watch mode)
   npm run dev

   # For production
   npm run build
   ```

3. **Add Icons**
   Replace the placeholder icon files in `src/icons/` with actual PNG images:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

4. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder
   - The extension icon should appear in the Chrome toolbar

## Usage

1. **Navigate to ChatGPT**: Go to [chatgpt.com](https://chatgpt.com) and start or continue a conversation
2. **Open ChatGPT Compass**: Click the extension icon in the Chrome toolbar
3. **View Your Messages**: The sidepanel will display all your messages from the current conversation
4. **Search Messages**: Use the search box to filter messages by content
5. **Navigate to Message**: Click on any message to scroll directly to it in the conversation
6. **Real-time Updates**: New messages are automatically added as you continue chatting

## How It Works

- **Content Script**: Monitors ChatGPT pages and extracts user messages using the `h5.sr-only` selector
- **Message Detection**: Identifies messages by looking for "You said:" text in screen reader elements
- **Real-time Sync**: Uses MutationObserver to detect new messages as they're added
- **Smart Navigation**: Scrolls to selected messages with smooth animation and highlight effects

## Development

### Available Scripts

- `npm run dev` - Build in development mode with watch
- `npm run build` - Build for production
- `npm start` - Start webpack dev server (for testing components in isolation)

### Customization

- **Styling**: Edit `src/sidepanel/styles.css` for custom styles
- **Components**: Modify `src/sidepanel/App.tsx` to add your own components
- **Background Logic**: Edit `src/background/background.ts` for extension logic
- **Permissions**: Update `manifest.json` to add more Chrome APIs

## Chrome Extensions APIs Used

- **Sidepanel API**: For creating persistent sidepanel
- **Action API**: For handling extension icon clicks
- **Tabs API**: For getting current tab information
- **Runtime API**: For extension lifecycle management

## Browser Compatibility

This extension uses Chrome's Sidepanel API which requires:
- Chrome 114 or later
- Manifest V3

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the extension
5. Submit a pull request

## License

MIT License - feel free to use this template for your own projects! 