// src/components/Material3/MD3Switch.jsx
import React, { memo, forwardRef } from 'react';
import './MD3Switch.css';

const MD3Switch = memo(forwardRef(({
  checked = false,
  disabled = false,
  label,
  supportingText,
  showIcons = false,
  icons,
  onChange,
  className = '',
  id,
  ...props
}, ref) => {
  const uniqueId = id || `md3-switch-${Math.random().toString(36).substr(2, 9)}`;

  const handleChange = (e) => {
    if (disabled) return;
    onChange?.(e);
  };

  const containerClasses = [
    'md3-switch',
    disabled && 'md3-switch--disabled',
    showIcons && 'md3-switch--with-icons',
    className
  ].filter(Boolean).join(' ');

  const defaultIcons = {
    checked: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    ),
    unchecked: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 13H5v-2h14v2z"/>
      </svg>
    )
  };

  const switchIcons = icons || defaultIcons;

  return (
    <div className={containerClasses}>
      <label 
        htmlFor={uniqueId} 
        className="md3-switch__container"
      >
        <div className="md3-switch__control">
          <input
            ref={ref}
            id={uniqueId}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            className="md3-switch__input"
            role="switch"
            aria-checked={checked}
            {...props}
          />
          
          <div className="md3-switch__track">
            <div className="md3-switch__track-background" />
            
            <div className="md3-switch__handle-container">
              <div className="md3-switch__handle">
                <div className="md3-switch__handle-background" />
                
                {showIcons && (
                  <div className="md3-switch__icon">
                    {checked ? switchIcons.checked : switchIcons.unchecked}
                  </div>
                )}
              </div>
              
              <div className="md3-switch__ripple" />
            </div>
          </div>
        </div>
        
        {label && (
          <div className="md3-switch__label-container">
            <span className="md3-switch__label">
              {label}
            </span>
            {supportingText && (
              <span className="md3-switch__supporting-text">
                {supportingText}
              </span>
            )}
          </div>
        )}
      </label>
    </div>
  );
}));

MD3Switch.displayName = 'MD3Switch';

// Settings Switch Group (specialized component)
export const MD3SettingsGroup = memo(({
  title,
  description,
  switches = [],
  values = {},
  onChange,
  className = ''
}) => {
  const handleSwitchChange = (key, event) => {
    onChange?.(key, event.target.checked, event);
  };

  return (
    <div className={`md3-settings-group ${className}`}>
      {title && (
        <div className="md3-settings-group__header">
          <h3 className="md3-settings-group__title">{title}</h3>
          {description && (
            <p className="md3-settings-group__description">{description}</p>
          )}
        </div>
      )}
      
      <div className="md3-settings-group__switches">
        {switches.map((switchConfig, index) => (
          <MD3Switch
            key={switchConfig.key || index}
            checked={values[switchConfig.key] || false}
            disabled={switchConfig.disabled}
            label={switchConfig.label}
            supportingText={switchConfig.supportingText}
            showIcons={switchConfig.showIcons}
            icons={switchConfig.icons}
            onChange={(e) => handleSwitchChange(switchConfig.key, e)}
          />
        ))}
      </div>
    </div>
  );
});

MD3SettingsGroup.displayName = 'MD3SettingsGroup';

// Reading Settings Switches (specialized component)
export const MD3ReadingSettings = memo(({
  settings = {},
  onChange,
  className = ''
}) => {
  const readingSettingsConfig = [
    {
      key: 'darkMode',
      label: 'Dark Mode',
      supportingText: 'Easier on the eyes in low light',
      showIcons: true,
      icons: {
        checked: (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-5.52-4.48-10-10-10z"/>
          </svg>
        ),
        unchecked: (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z"/>
          </svg>
        )
      }
    },
    {
      key: 'autoBookmark',
      label: 'Auto-bookmark',
      supportingText: 'Automatically save reading position'
    },
    {
      key: 'readingReminders',
      label: 'Reading Reminders',
      supportingText: 'Get notified about your reading goals'
    },
    {
      key: 'offlineReading',
      label: 'Offline Reading',
      supportingText: 'Download books for offline access'
    },
    {
      key: 'pageAnimations',
      label: 'Page Animations',
      supportingText: 'Smooth page turn animations'
    },
    {
      key: 'readingStats',
      label: 'Reading Statistics',
      supportingText: 'Track reading speed and progress'
    }
  ];

  return (
    <MD3SettingsGroup
      title="Reading Preferences"
      description="Customize your reading experience"
      switches={readingSettingsConfig}
      values={settings}
      onChange={onChange}
      className={`md3-reading-settings ${className}`}
    />
  );
});

MD3ReadingSettings.displayName = 'MD3ReadingSettings';

// Privacy Settings Switches (specialized component)
export const MD3PrivacySettings = memo(({
  settings = {},
  onChange,
  className = ''
}) => {
  const privacySettingsConfig = [
    {
      key: 'analytics',
      label: 'Usage Analytics',
      supportingText: 'Help improve the app with anonymous usage data'
    },
    {
      key: 'crashReports',
      label: 'Crash Reports',
      supportingText: 'Automatically send crash reports'
    },
    {
      key: 'personalizedRecommendations',
      label: 'Personalized Recommendations',
      supportingText: 'Get book suggestions based on your reading history'
    },
    {
      key: 'shareReadingProgress',
      label: 'Share Reading Progress',
      supportingText: 'Allow friends to see your reading activity'
    }
  ];

  return (
    <MD3SettingsGroup
      title="Privacy & Data"
      description="Control how your data is used"
      switches={privacySettingsConfig}
      values={settings}
      onChange={onChange}
      className={`md3-privacy-settings ${className}`}
    />
  );
});

MD3PrivacySettings.displayName = 'MD3PrivacySettings';

export default MD3Switch;