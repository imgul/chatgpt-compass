# ChatGPT Compass Configuration

## Environment Variables

You can configure the ChatGPT Compass extension using environment variables during the build process.

### Available Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `HIGHLIGHT_DURATION_SECONDS` | `3` | Duration in seconds for how long the selected message highlight animation should show |
| `EXTENSION_NAME` | `ChatGPT Compass` | Name of the extension |
| `EXTENSION_VERSION` | `1.0.0` | Version of the extension |

### Example Usage

#### Windows (Command Prompt)
```cmd
set HIGHLIGHT_DURATION_SECONDS=5
npm run build
```

#### Windows (PowerShell)
```powershell
$env:HIGHLIGHT_DURATION_SECONDS = "5"
npm run build
```

#### macOS/Linux (Terminal)
```bash
export HIGHLIGHT_DURATION_SECONDS=5
npm run build
```

#### Using .env file (if supported)
Create a `.env` file in the root directory with:
```env
# ChatGPT Compass Extension Configuration

# Duration in seconds for how long the selected message highlight animation should show
HIGHLIGHT_DURATION_SECONDS=3

# Extension settings
EXTENSION_NAME=ChatGPT Compass
EXTENSION_VERSION=1.0.0
```

## Features Controlled by Configuration

### Highlight Duration
- **Variable**: `HIGHLIGHT_DURATION_SECONDS`
- **Effect**: Controls how long the animated border remains visible around a selected message
- **Range**: Any positive number (recommended: 2-10 seconds)
- **Default**: 3 seconds

### Animation Colors
The extension uses dark vibrant AI-inspired colors:
- Deep navy blues (#1a1a2e, #16213e, #0f3460)
- Vibrant accent colors (#e94560, #f38ba8)
- Bright tech colors (#a6e3a1, #94e2d5, #89dceb)
- AI-themed purples and blues (#74c7ec, #7287fd, #c6a0f6)
- Modern coral (#eba0ac)

### Animation Timing
- **Rotation Speed**: 3000ms (3 seconds) per full color cycle
- **Pulse Speed**: 2000ms (2 seconds) per pulse cycle
- **Smooth Transitions**: Optimized for 60fps performance 