import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMusicPlayer } from '../../contexts/MusicPlayerContext';
import styles from './styles.module.css';

// Import Butterchurn from npm (it's a UMD module so we need dynamic import for SSR safety)
let butterchurnModule: any = null;
let butterchurnPresetsModule: any = null;

// Curated preset categories
const PRESET_CATEGORIES = {
  psychedelic: [
    'Flexi, martin + geiss - dedicated to the sherwin maxawow',
    'Rovastar - Fractopia',
    'Unchained - Unified Drag',
    'martin - castle in the air',
    'Geiss - Spiral Artifact',
  ],
  smooth: [
    'Flexi - predator-prey-spirals',
    'Geiss - Cosmic Strings 2',
    'Martin - liquid science',
    'Rovastar - Inner Thoughts (Frantic Dream Mix)',
    'Flexi - infused with the spiral',
  ],
  energetic: [
    'Flexi + Martin - disconnected',
    'shifter - tumbling cubes',
    'Zylot - Clouds (Tunnel Mix)',
    'Rovastar - Explosive Stained Glass',
    'Geiss - Reaction Diffusion',
  ],
  abstract: [
    'yin - 257 - Smoke on the Water Fisheye Kaleidoscope',
    'Rovastar & Idiot24-7 - Balk Acid',
    'Flexi - smouldering',
    'martin - ripples in a new dimension',
    'Geiss - Swirlie 3',
  ],
};

export default function FullScreenVisualizer() {
  const {
    isPlaying,
    currentTrack,
    audioContext,
    gainNode,
    isVisualizerFullScreen,
    setVisualizerFullScreen,
    togglePlayPause,
    nextTrack,
    previousTrack,
  } = useMusicPlayer();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPresetName, setCurrentPresetName] = useState('');
  const [presets, setPresets] = useState<Record<string, any>>({});
  const [presetKeys, setPresetKeys] = useState<string[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [showTrackInfo, setShowTrackInfo] = useState(true);

  const cursorTimeoutRef = useRef<number | null>(null);

  // Initialize Butterchurn
  useEffect(() => {
    if (!isVisualizerFullScreen) return;

    const init = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        // Dynamic import for SSR safety
        if (!butterchurnModule) {
          butterchurnModule = await import('butterchurn');
          console.log('[FullScreenVisualizer] Butterchurn module:', butterchurnModule);
        }
        if (!butterchurnPresetsModule) {
          butterchurnPresetsModule = await import('butterchurn-presets');
          console.log('[FullScreenVisualizer] Presets module:', butterchurnPresetsModule);
        }

        if (!canvasRef.current || !audioContext || !gainNode) {
          throw new Error('Canvas or audio context not available');
        }

        // Ensure audio context is running
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const canvas = canvasRef.current;
        // Use screen dimensions for true fullscreen
        const width = window.screen.width;
        const height = window.screen.height;
        const dpr = window.devicePixelRatio || 1;

        // Set canvas internal resolution
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        // CSS will handle the display size via 100vw/100vh

        console.log('[FullScreenVisualizer] Canvas setup:', { width, height, dpr, canvasWidth: canvas.width, canvasHeight: canvas.height });

        // Get the actual functions (handle default exports)
        const butterchurn = butterchurnModule.default || butterchurnModule;
        const butterchurnPresets = butterchurnPresetsModule.default || butterchurnPresetsModule;

        console.log('[FullScreenVisualizer] butterchurn:', butterchurn);
        console.log('[FullScreenVisualizer] butterchurnPresets:', butterchurnPresets);

        if (!butterchurn || typeof butterchurn.createVisualizer !== 'function') {
          throw new Error(`Butterchurn createVisualizer not available. Got: ${typeof butterchurn}`);
        }

        const visualizer = butterchurn.createVisualizer(audioContext, canvas, {
          width: width * dpr,
          height: height * dpr,
          pixelRatio: 1,  // We've already accounted for DPR in canvas size
          textureRatio: 1,
        });

        // Connect to our gain node (audio chain)
        visualizer.connectAudio(gainNode);

        // Load presets
        const getPresets = butterchurnPresets.getPresets || butterchurnPresets;
        const loadedPresets = typeof getPresets === 'function' ? getPresets() : getPresets;

        console.log('[FullScreenVisualizer] Loaded presets count:', Object.keys(loadedPresets).length);

        const keys = Object.keys(loadedPresets);
        setPresets(loadedPresets);
        setPresetKeys(keys);

        // Pick a random psychedelic preset to start
        const psychedelicPresets = PRESET_CATEGORIES.psychedelic.filter(p => keys.includes(p));
        const startPreset = psychedelicPresets.length > 0
          ? psychedelicPresets[Math.floor(Math.random() * psychedelicPresets.length)]
          : keys[Math.floor(Math.random() * keys.length)];

        visualizer.loadPreset(loadedPresets[startPreset], 0);
        setCurrentPresetName(startPreset);

        visualizerRef.current = visualizer;
        setIsLoading(false);

        console.log('[FullScreenVisualizer] Butterchurn initialized with preset:', startPreset);
      } catch (error) {
        console.error('[FullScreenVisualizer] Failed to initialize:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load visualizer');
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisualizerFullScreen, audioContext, gainNode]);

  // Render loop
  useEffect(() => {
    if (!isVisualizerFullScreen || !visualizerRef.current || isLoading) return;

    const render = () => {
      if (visualizerRef.current) {
        visualizerRef.current.render();
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisualizerFullScreen, isLoading]);

  // Handle resize
  useEffect(() => {
    if (!isVisualizerFullScreen) return;

    const handleResize = () => {
      if (!canvasRef.current || !visualizerRef.current) return;

      const width = window.screen.width;
      const height = window.screen.height;
      const dpr = window.devicePixelRatio || 1;
      const canvas = canvasRef.current;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      // CSS handles display size

      visualizerRef.current.setRendererSize(width * dpr, height * dpr);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVisualizerFullScreen]);

  // Load random preset
  const loadRandomPreset = useCallback(() => {
    if (!visualizerRef.current || presetKeys.length === 0) return;

    const randomIndex = Math.floor(Math.random() * presetKeys.length);
    const presetName = presetKeys[randomIndex];

    visualizerRef.current.loadPreset(presets[presetName], 2.0); // 2 second blend
    setCurrentPresetName(presetName);
  }, [presets, presetKeys]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isVisualizerFullScreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setVisualizerFullScreen(false);
          break;
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
          nextTrack();
          break;
        case 'ArrowLeft':
          previousTrack();
          break;
        case 'n':
        case 'N':
          loadRandomPreset();
          break;
        case 'h':
        case 'H':
          setShowControls(prev => !prev);
          break;
        case 't':
        case 'T':
          setShowTrackInfo(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisualizerFullScreen, togglePlayPause, nextTrack, previousTrack, setVisualizerFullScreen, loadRandomPreset]);

  // Cursor hiding
  useEffect(() => {
    if (!isVisualizerFullScreen) return;

    const handleMouseMove = () => {
      setShowControls(true);
      document.body.style.cursor = 'default';

      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }

      cursorTimeoutRef.current = window.setTimeout(() => {
        document.body.style.cursor = 'none';
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    handleMouseMove(); // Start the timer

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
      document.body.style.cursor = 'default';
    };
  }, [isVisualizerFullScreen]);

  // Auto-cycle presets every 30 seconds when playing
  useEffect(() => {
    if (!isVisualizerFullScreen || !isPlaying) return;

    const interval = setInterval(() => {
      loadRandomPreset();
    }, 30000);

    return () => clearInterval(interval);
  }, [isVisualizerFullScreen, isPlaying, loadRandomPreset]);

  // Request fullscreen when opening
  useEffect(() => {
    if (isVisualizerFullScreen && containerRef.current) {
      containerRef.current.requestFullscreen?.().catch(console.warn);
    }
  }, [isVisualizerFullScreen]);

  // Handle fullscreen exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isVisualizerFullScreen) {
        setVisualizerFullScreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isVisualizerFullScreen, setVisualizerFullScreen]);

  if (!isVisualizerFullScreen) {
    return null;
  }

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* Loading state */}
      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <div className={styles.loadingText}>Loading Milkdrop Visualizer...</div>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div className={styles.error}>
          <div className={styles.errorIcon}>[!]</div>
          <div className={styles.errorText}>{loadError}</div>
          <button
            className={styles.errorButton}
            onClick={() => setVisualizerFullScreen(false)}
          >
            CLOSE
          </button>
        </div>
      )}

      {/* Track info overlay */}
      {showTrackInfo && currentTrack && !isLoading && !loadError && (
        <div className={styles.trackInfo}>
          <div className={styles.trackAlbumArt}>
            <img src={currentTrack.coverArt} alt={currentTrack.album} />
          </div>
          <div className={styles.trackDetails}>
            <div className={styles.trackTitle}>{currentTrack.title}</div>
            <div className={styles.trackArtist}>{currentTrack.artist}</div>
            <div className={styles.trackAlbum}>{currentTrack.album}</div>
          </div>
          <div className={styles.playState}>
            {isPlaying ? '► NOW PLAYING' : '|| PAUSED'}
          </div>
        </div>
      )}

      {/* Current preset name */}
      {showControls && !isLoading && !loadError && (
        <div className={styles.presetInfo}>
          <div className={styles.presetLabel}>PRESET:</div>
          <div className={styles.presetName}>{currentPresetName}</div>
        </div>
      )}

      {/* Controls overlay */}
      {showControls && !isLoading && !loadError && (
        <div className={styles.controls}>
          <div className={styles.controlsGroup}>
            <button
              className={`${styles.controlButton} ${styles.prevButton}`}
              onClick={previousTrack}
              title="Previous track"
            />
            <button
              className={`${styles.controlButton} ${isPlaying ? styles.pauseButton : styles.playButton}`}
              onClick={togglePlayPause}
              title={isPlaying ? 'Pause' : 'Play'}
            />
            <button
              className={`${styles.controlButton} ${styles.nextButton}`}
              onClick={nextTrack}
              title="Next track"
            />
          </div>

          <div className={styles.controlsGroup}>
            <button
              className={`${styles.controlButton} ${styles.presetButton}`}
              onClick={loadRandomPreset}
              title="Next preset (N)"
            />
            <button
              className={`${styles.controlButton} ${styles.infoButton}`}
              onClick={() => setShowTrackInfo(prev => !prev)}
              title="Toggle track info (T)"
            />
            <button
              className={`${styles.controlButton} ${styles.closeButton}`}
              onClick={() => setVisualizerFullScreen(false)}
              title="Exit fullscreen (ESC)"
            />
          </div>
        </div>
      )}

      {/* Keyboard hints */}
      {showControls && !isLoading && !loadError && (
        <div className={styles.hints}>
          <span>ESC: Exit</span>
          <span>SPACE: Play/Pause</span>
          <span>←/→: Tracks</span>
          <span>N: Next Preset</span>
          <span>T: Toggle Info</span>
          <span>H: Hide Controls</span>
        </div>
      )}
    </div>
  );
}
