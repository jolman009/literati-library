// src/components/ThemeToggle.jsx - Working theme toggle button
import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';

const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme, setLightTheme, setDarkTheme } = useMaterial3Theme();

  const handleToggle = () => {
    console.log('🎨 Theme toggle clicked, current theme:', theme);
    toggleTheme();
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5" />;
      case 'dark':
        return <Moon className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const getTooltip = () => {
    switch (theme) {
      case 'light':
        return 'Switch to dark mode';
      case 'dark':
        return 'Switch to light mode';
      default:
        return 'Switch to light mode';
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        p-2 rounded-lg transition-all duration-200 
        bg-gray-100 hover:bg-gray-200 
        dark:bg-gray-800 dark:hover:bg-gray-700
        border border-gray-200 dark:border-gray-700
        text-gray-700 dark:text-gray-300
        hover:scale-105 active:scale-95
        ${className}
      `}
      title={getTooltip()}
      aria-label={getTooltip()}
    >
      {getIcon()}
    </button>
  );
};

export default ThemeToggle;