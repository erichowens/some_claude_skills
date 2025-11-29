import React from 'react';
import { useMusicPlayer } from '../../contexts/MusicPlayerContext';
import { MUSIC_LIBRARY, getGenreColors } from '../../data/musicMetadata';
import { useFFTData } from '../../hooks/useFFTData';
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
    analyserNode,
    eqSettings,
    togglePlayPause,
    setVolume,
    setEQ,
    resetEQ,
    switchTrack,
    nextTrack,
    previousTrack,
    setMinimized,
  } = useMusicPlayer();

  // Real FFT frequency data for visualizer (24 bars)
  const frequencyData = useFFTData({
    analyserNode,
    binCount: 24,
    smoothing: 0.7,
    isPlaying,
  });

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
            {/* Real FFT Visualizer */}
            <div className={styles.visualizer}>
              <div className={styles.scanlines}></div>
              <div className={styles.waveform}>
                {frequencyData.map((magnitude, i) => {
                  // Normalize magnitude (0-255) to percentage height
                  const heightPercent = Math.max(2, (magnitude / 255) * 100);
                  return (
                    <div
                      key={i}
                      className={styles.bar}
                      style={{
                        height: `${heightPercent}%`,
                        background: `linear-gradient(180deg, ${genreColors.primary}, ${genreColors.secondary})`,
                        transition: 'height 50ms ease-out',
                      }}
                    />
                  );
                })}
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

            {/* Windows 3.1 Style EQ Panel */}
            <div className={styles.eqPanel}>
              <div className={styles.eqHeader}>
                <span className={styles.eqTitle}>▓ EQUALIZER</span>
                <button
                  className={styles.eqResetButton}
                  onClick={resetEQ}
                  title="Reset EQ to flat"
                >
                  RESET
                </button>
              </div>
              <div className={styles.eqSliders}>
                {/* Bass */}
                <div className={styles.eqSliderGroup}>
                  <div className={styles.eqDbLabel}>
                    {eqSettings.bass > 0 ? '+' : ''}{eqSettings.bass}dB
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={eqSettings.bass}
                    onChange={(e) => setEQ('bass', parseInt(e.target.value))}
                    className={styles.eqVerticalSlider}
                    orient="vertical"
                  />
                  <div className={styles.eqBandLabel}>BASS</div>
                  <div className={styles.eqFreqLabel}>200Hz</div>
                </div>

                {/* Mid */}
                <div className={styles.eqSliderGroup}>
                  <div className={styles.eqDbLabel}>
                    {eqSettings.mid > 0 ? '+' : ''}{eqSettings.mid}dB
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={eqSettings.mid}
                    onChange={(e) => setEQ('mid', parseInt(e.target.value))}
                    className={styles.eqVerticalSlider}
                    orient="vertical"
                  />
                  <div className={styles.eqBandLabel}>MID</div>
                  <div className={styles.eqFreqLabel}>1kHz</div>
                </div>

                {/* Treble */}
                <div className={styles.eqSliderGroup}>
                  <div className={styles.eqDbLabel}>
                    {eqSettings.treble > 0 ? '+' : ''}{eqSettings.treble}dB
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={eqSettings.treble}
                    onChange={(e) => setEQ('treble', parseInt(e.target.value))}
                    className={styles.eqVerticalSlider}
                    orient="vertical"
                  />
                  <div className={styles.eqBandLabel}>TREBLE</div>
                  <div className={styles.eqFreqLabel}>3kHz</div>
                </div>
              </div>
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
