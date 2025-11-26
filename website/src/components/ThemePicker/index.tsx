import React, { useState } from 'react';
import { useWin31Theme, ThemeName } from '../../hooks/useWin31Theme';
import { usePlausibleTracking } from '../../hooks/usePlausibleTracking';
import './styles.css';

interface ThemePickerProps {
  className?: string;
}

export default function ThemePicker({ className = '' }: ThemePickerProps): JSX.Element {
  const { colorScheme, setTheme, themes } = useWin31Theme();
  const { track } = usePlausibleTracking();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showHotDog, setShowHotDog] = useState(true);

  const handleToggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleThemeSelect = (name: ThemeName) => {
    setTheme(name);
    setShowDropdown(false);
    setShowHotDog(false); // Hide hot dog after theme selection
    track('Theme Changed', { theme: name });
  };

  return (
    <div className={`theme-picker ${className}`}>
      {/* 16-bit hot dog floating below theme picker */}
      {showHotDog && (
        <div className="theme-picker__hotdog">
          🌭
        </div>
      )}
      <button
        className="theme-picker__btn"
        onClick={handleToggleDropdown}
      >
        <span className="theme-picker__icon">🎨</span>
        <span className="theme-picker__label">Theme</span>
        <span className="theme-picker__arrow">▼</span>
      </button>
      {showDropdown && (
        <>
          <div
            className="theme-picker__backdrop"
            onClick={() => setShowDropdown(false)}
          />
          <div className="theme-picker__dropdown">
            <div className="theme-picker__dropdown-titlebar">
              <span>Select Color Scheme</span>
            </div>
            <div className="theme-picker__dropdown-content">
              {themes.map((name) => (
                <button
                  key={name}
                  className={`theme-picker__item ${colorScheme === name ? 'theme-picker__item--active' : ''}`}
                  onClick={() => handleThemeSelect(name)}
                >
                  <span className="theme-picker__item-check">
                    {colorScheme === name ? '●' : '○'}
                  </span>
                  {name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
