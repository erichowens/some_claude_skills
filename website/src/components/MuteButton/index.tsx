import React from 'react';
import { useUISounds } from '../../contexts/UISoundsContext';
import styles from './styles.module.css';

export default function MuteButton() {
  const { isMuted, toggleMute, playClick } = useUISounds();

  const handleToggle = () => {
    toggleMute();
    // Don't play click sound when unmuting, only when muting
    if (!isMuted) {
      playClick();
    }
  };

  return (
    <button
      className={styles.muteButton}
      onClick={handleToggle}
      aria-label={isMuted ? 'Unmute UI sounds' : 'Mute UI sounds'}
      title={isMuted ? 'Unmute UI sounds' : 'Mute UI sounds'}
    >
      {isMuted ? '🔇' : '🔊'}
    </button>
  );
}
