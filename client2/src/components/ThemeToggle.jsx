import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';

const ThemeToggle = ({
  className = '',
  style = {},
  size = 20,
  ariaLabel,
}) => {
  const { actualTheme, toggleTheme } = useMaterial3Theme();
  const label = ariaLabel || `Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className || 'theme-toggle-button'}
      style={style}
      title={label}
      aria-label={label}
    >
      {actualTheme === 'dark' ? (
        <Sun size={size} aria-hidden="true" />
      ) : (
        <Moon size={size} aria-hidden="true" />
      )}
      <span className="sr-only">{label}</span>
    </button>
  );
};

export default ThemeToggle;

