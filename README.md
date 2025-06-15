# Chrome Extension with React Sidepanel

A modern Chrome extension template that renders a React app in Chrome's built-in sidepanel using TypeScript and Webpack.

## Features

- ✨ React 18 with TypeScript
- 🎨 Modern, responsive design with beautiful gradients and glassmorphism
- 🔧 Webpack build system with development and production modes
- 📱 Chrome Sidepanel API integration
- 🚀 Ready for development and customization
- 💡 Example components and functionality
- 🔄 Hot reloading during development

## Project Structure

```
├── manifest.json          # Chrome extension manifest v3
├── package.json           # Dependencies and scripts
├── webpack.config.js      # Webpack configuration
├── tsconfig.json         # TypeScript configuration
└── src/
    ├── background/
    │   └── background.ts  # Service worker for extension logic
    ├── sidepanel/
    │   ├── index.tsx      # React entry point
    │   ├── App.tsx        # Main React component
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

1. Click the extension icon in the Chrome toolbar
2. The sidepanel will open on the right side of the browser
3. The sidepanel persists across all tabs until manually closed
4. The app displays current tab information and includes interactive components

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