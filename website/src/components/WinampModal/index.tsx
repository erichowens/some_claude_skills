import React from 'react';
import { useMusicPlayer } from '../../contexts/MusicPlayerContext';
import { MUSIC_LIBRARY, getGenreColors } from '../../data/musicMetadata';
import styles from './styles.module.css';

export default function WinampModal() {
  const {
    isPlaying,
    isLoading,
    currentTrack,
    currentTrackIndex,
    volume,
    progress,
    isMinimized,
    togglePlayPause,
    setVolume,
    switchTrack,
    nextTrack,
    previousTrack,
    setMinimized,
  } = useMusicPlayer();

  if (isMinimized || !currentTrack) {
    return null;
  }

  const genreColors = getGenreColors(currentTrack.genre);

  return (
    <div className={styles.modalOverlay} onClick={() => setMinimized(true)}>
      <div
        className={styles.winampModal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.title}>
            ████ WINAMP 5.X ████
          </div>
          <div className={styles.headerButtons}>
            <button
              className={styles.closeButton}
              onClick={() => setMinimized(true)}
              aria-label="Minimize"
            >
              _
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {/* Left: Album Art & Metadata */}
          <div className={styles.leftPanel}>
            <div className={styles.albumCover}>
              <img src={currentTrack.coverArt} alt={currentTrack.album} />
              <div className={styles.coverOverlay}></div>
            </div>

            <div className={styles.metadata}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>TITLE:</span>
                <span className={styles.metaValue}>{currentTrack.title}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>ARTIST:</span>
                <span className={styles.metaValue}>{currentTrack.artist}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>ALBUM:</span>
                <span className={styles.metaValue}>{currentTrack.album}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>YEAR:</span>
                <span className={styles.metaValue}>{currentTrack.year}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>GENRE:</span>
                <span
                  className={styles.metaValue}
                  style={{ color: genreColors.primary }}
                >
                  {currentTrack.genre}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>BPM:</span>
                <span className={styles.metaValue}>{currentTrack.bpm}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>MOOD:</span>
                <span className={styles.metaValue}>{currentTrack.mood}</span>
              </div>
              <div className={styles.description}>
                {currentTrack.description}
              </div>

              {/* AI Generation Credits */}
              {currentTrackIndex < 7 && (
                <div className={styles.aiCredits}>
                  <span className={styles.creditIcon}>🤖</span>
                  <span className={styles.creditText}>
                    MIDI & Album Art: AI-Generated
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Player Controls */}
          <div className={styles.rightPanel}>
            {/* Visualizer */}
            <div className={styles.visualizer}>
              <div className={styles.scanlines}></div>
              <div className={styles.waveform}>
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    className={`${styles.bar} ${isPlaying ? styles.barAnimated : ''}`}
                    style={{
                      animationDelay: `${i * 0.05}s`,
                      background: `linear-gradient(180deg, ${genreColors.primary}, ${genreColors.secondary})`
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${genreColors.primary}, ${genreColors.secondary})`
                }}
              />
            </div>

            {/* Main Controls */}
            <div className={styles.controls}>
              <button
                className={styles.controlButton}
                onClick={previousTrack}
                disabled={isLoading}
              >
                ⏮
              </button>
              <button
                className={`${styles.controlButton} ${styles.playButton}`}
                onClick={togglePlayPause}
                disabled={isLoading}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button
                className={styles.controlButton}
                onClick={nextTrack}
                disabled={isLoading}
              >
                ⏭
              </button>
            </div>

            {/* Volume Control */}
            <div className={styles.volumeSection}>
              <span className={styles.volumeLabel}>VOL</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className={styles.volumeSlider}
                style={{
                  background: `linear-gradient(90deg, ${genreColors.primary}, ${genreColors.secondary})`
                }}
              />
              <span className={styles.volumeValue}>{Math.round(volume * 100)}%</span>
            </div>

            {/* Track List */}
            <div className={styles.playlist}>
              <div className={styles.playlistHeader}>PLAYLIST</div>
              <div className={styles.trackList}>
                {MUSIC_LIBRARY.map((track, idx) => (
                  <div
                    key={track.id}
                    className={`${styles.playlistItem} ${idx === currentTrackIndex ? styles.playlistItemActive : ''}`}
                    onClick={() => switchTrack(idx)}
                    style={idx === currentTrackIndex ? {
                      borderColor: genreColors.primary,
                      background: `linear-gradient(90deg, ${genreColors.primary}22, ${genreColors.secondary}22)`
                    } : {}}
                  >
                    <span className={styles.trackNumber}>{String(idx + 1).padStart(2, '0')}</span>
                    <span className={styles.trackName}>{track.title}</span>
                    <span className={styles.trackDuration}>{track.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
