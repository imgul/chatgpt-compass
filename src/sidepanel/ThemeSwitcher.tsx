import React from 'react';
import { useTheme, Theme } from './ThemeContext';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes: { value: Theme; icon: string; label: string }[] = [
    { value: 'light', icon: '☀️', label: 'Light' },
    { value: 'dark', icon: '🌙', label: 'Dark' },
    { value: 'auto', icon: '🤖', label: 'Auto' },
  ];

  return (
    <div className="theme-switcher">
      <div className="theme-options">
        {themes.map((themeOption) => (
          <button
            key={themeOption.value}
            className={`theme-option ${theme === themeOption.value ? 'active' : ''}`}
            onClick={() => setTheme(themeOption.value)}
            title={`${themeOption.label} theme`}
          >
            <span className="theme-icon">{themeOption.icon}</span>
            <span className="theme-label">{themeOption.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSwitcher; 