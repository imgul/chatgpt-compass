// ChatGPT Compass Extension Configuration

export const CONFIG = {
  // Duration in seconds for how long the selected message highlight animation should show
  HIGHLIGHT_DURATION_SECONDS: parseInt(process.env.HIGHLIGHT_DURATION_SECONDS || '3', 10),
  
  // Extension settings
  EXTENSION_NAME: process.env.EXTENSION_NAME || 'ChatGPT Compass',
  EXTENSION_VERSION: process.env.EXTENSION_VERSION || '1.0.0',
  
  // Animation settings
  ANIMATION_SPEED_MS: 3000, // Speed of the color rotation animation
  PULSE_SPEED_MS: 2000, // Speed of the pulse animation
} as const;

export default CONFIG; 