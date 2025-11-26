import React from 'react';
import { useMusicPlayer } from '../../contexts/MusicPlayerContext';
import { useWinampSkin } from '../../hooks/useWinampSkin';
import styles from './styles.module.css';

export default function MinifiedMusicPlayer() {
  const {
    isPlaying,
    currentTrack,
    togglePlayPause,
    setMinimized
  } = useMusicPlayer();

  const { currentSkin } = useWinampSkin();

  if (!currentTrack) {
    return null;
  }

  return (
    <div
      className={styles.minifiedPlayer}
      onClick={() => setMinimized(false)}
      style={{
        background: `linear-gradient(135deg, ${currentSkin.colors.bg}, ${currentSkin.colors.bgDark})`,
        borderColor: currentSkin.colors.border,
      }}
    >
      <div className={styles.visualizer}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`${styles.bar} ${isPlaying ? styles.barAnimated : ''}`}
            style={{
              animationDelay: `${i * 0.1}s`,
              backgroundColor: currentSkin.colors.visualizer,
            }}
          />
        ))}
      </div>

      <button
        className={styles.playButton}
        onClick={(e) => {
          e.stopPropagation();
          togglePlayPause();
        }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        style={{
          backgroundColor: currentSkin.colors.buttonBg,
          borderColor: currentSkin.colors.accent,
          color: currentSkin.colors.accent,
        }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div className={styles.trackInfo}>
        <div
          className={styles.trackTitle}
          style={{ color: currentSkin.colors.text }}
        >
          {currentTrack.title}
        </div>
        <div
          className={styles.trackArtist}
          style={{ color: currentSkin.colors.textDim }}
        >
          {currentTrack.artist}
        </div>
      </div>

      <div
        className={styles.expandIcon}
        style={{ color: currentSkin.colors.accent }}
      >
        ⬜
      </div>
    </div>
  );
}
