import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('auto');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  // Detect ChatGPT's theme
  const detectChatGPTTheme = (): ResolvedTheme => {
    try {
      // Check if we're on a ChatGPT page
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url && (tabs[0].url.includes('chatgpt.com') || tabs[0].url.includes('chat.openai.com'))) {
          // Send message to content script to detect theme
          chrome.tabs.sendMessage(tabs[0].id!, { type: 'GET_CHATGPT_THEME' }, (response) => {
            if (response && response.theme) {
              const detectedTheme = response.theme === 'dark' ? 'dark' : 'light';
              if (theme === 'auto') {
                setResolvedTheme(detectedTheme);
              }
            }
          });
        }
      });
    } catch (error) {
      console.log('Could not detect ChatGPT theme:', error);
    }
    
    // Fallback to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Update resolved theme based on current theme setting
  useEffect(() => {
    let newResolvedTheme: ResolvedTheme;

    switch (theme) {
      case 'light':
        newResolvedTheme = 'light';
        break;
      case 'dark':
        newResolvedTheme = 'dark';
        break;
      case 'auto':
        newResolvedTheme = detectChatGPTTheme();
        break;
      default:
        newResolvedTheme = 'dark';
    }

    setResolvedTheme(newResolvedTheme);
    
    // Save theme preference
    chrome.storage.local.set({ theme });
  }, [theme]);

  // Load saved theme preference
  useEffect(() => {
    chrome.storage.local.get(['theme'], (result) => {
      if (result.theme) {
        setTheme(result.theme);
      }
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'auto') {
        setResolvedTheme(detectChatGPTTheme());
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.documentElement.className = resolvedTheme;
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 