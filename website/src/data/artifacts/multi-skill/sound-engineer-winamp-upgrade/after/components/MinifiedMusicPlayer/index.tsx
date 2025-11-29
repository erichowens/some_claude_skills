import React from 'react';
import { useMusicPlayer } from '../../contexts/MusicPlayerContext';
import { useWinampSkin } from '../../hooks/useWinampSkin';
import { useFFTData } from '../../hooks/useFFTData';
import styles from './styles.module.css';

export default function MinifiedMusicPlayer() {
  const {
    isPlaying,
    currentTrack,
    analyserNode,
    togglePlayPause,
    setMinimized
  } = useMusicPlayer();

  const { currentSkin } = useWinampSkin();

  // Real FFT data for minified visualizer (8 bars)
  const frequencyData = useFFTData({
    analyserNode,
    binCount: 8,
    smoothing: 0.6,
    isPlaying,
  });

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
        {frequencyData.map((magnitude, i) => {
          // Normalize magnitude (0-255) to percentage height
          const heightPercent = Math.max(10, (magnitude / 255) * 100);
          return (
            <div
              key={i}
              className={styles.bar}
              style={{
                height: `${heightPercent}%`,
                backgroundColor: currentSkin.colors.visualizer,
                transition: 'height 50ms ease-out',
              }}
            />
          );
        })}
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
