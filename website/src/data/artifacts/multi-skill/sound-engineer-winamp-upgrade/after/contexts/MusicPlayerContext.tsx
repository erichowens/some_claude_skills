import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import MidiPlayer from 'midi-player-js';
import Soundfont from 'soundfont-player';
import { MUSIC_LIBRARY, TrackMetadata } from '../data/musicMetadata';

// EQ settings interface
interface EQSettings {
  bass: number;    // -12 to +12 dB
  mid: number;     // -12 to +12 dB
  treble: number;  // -12 to +12 dB
}

interface MusicPlayerContextType {
  // State
  isPlaying: boolean;
  isLoading: boolean;
  currentTrack: TrackMetadata | null;
  currentTrackIndex: number;
  volume: number;
  progress: number;
  isMinimized: boolean;

  // Audio Analysis (NEW)
  analyserNode: AnalyserNode | null;

  // EQ State (NEW)
  eqSettings: EQSettings;

  // Actions
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  switchTrack: (index: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  toggleMinimized: () => void;
  setMinimized: (minimized: boolean) => void;

  // EQ Actions (NEW)
  setEQ: (band: 'bass' | 'mid' | 'treble', value: number) => void;
  resetEQ: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  }
  return context;
}

interface MusicPlayerProviderProps {
  children: ReactNode;
}

// Default EQ settings
const DEFAULT_EQ: EQSettings = { bass: 0, mid: 0, treble: 0 };

export function MusicPlayerProvider({ children }: MusicPlayerProviderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(8); // Default to SPAWN by Blank Banshee
  const [volume, setVolumeState] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [isMinimized, setIsMinimized] = useState(true);
  const [eqSettings, setEqSettings] = useState<EQSettings>(DEFAULT_EQ);

  // Core audio refs
  const playerRef = useRef<MidiPlayer.Player | null>(null);
  const instrumentsRef = useRef<Map<number, any>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const progressAnimationRef = useRef<number | null>(null);

  // NEW: Audio processing chain refs
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);

  // NEW: EQ filter refs
  const eqNodesRef = useRef<{
    bass: BiquadFilterNode | null;
    mid: BiquadFilterNode | null;
    treble: BiquadFilterNode | null;
  }>({ bass: null, mid: null, treble: null });

  const currentTrack = MUSIC_LIBRARY[currentTrackIndex] || null;

  // Initialize player on mount
  useEffect(() => {
    const initPlayer = async () => {
      setIsLoading(true);
      try {
        // Create audio context
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;

        // ============================================
        // AUDIO CHAIN: Source → Gain → EQ → Compressor → Analyser → Destination
        // ============================================

        // 1. Create GainNode for volume control
        const gainNode = audioCtx.createGain();
        // Apply logarithmic scaling for natural volume perception
        const scaledVolume = Math.pow(volume, 2);
        gainNode.gain.setValueAtTime(scaledVolume, audioCtx.currentTime);
        gainNodeRef.current = gainNode;

        // 2. Create 3-band EQ filters
        // Bass: Low shelf filter at 200 Hz
        const bassFilter = audioCtx.createBiquadFilter();
        bassFilter.type = 'lowshelf';
        bassFilter.frequency.setValueAtTime(200, audioCtx.currentTime);
        bassFilter.gain.setValueAtTime(eqSettings.bass, audioCtx.currentTime);
        eqNodesRef.current.bass = bassFilter;

        // Mid: Peaking filter at 1000 Hz
        const midFilter = audioCtx.createBiquadFilter();
        midFilter.type = 'peaking';
        midFilter.frequency.setValueAtTime(1000, audioCtx.currentTime);
        midFilter.Q.setValueAtTime(1, audioCtx.currentTime);
        midFilter.gain.setValueAtTime(eqSettings.mid, audioCtx.currentTime);
        eqNodesRef.current.mid = midFilter;

        // Treble: High shelf filter at 3000 Hz
        const trebleFilter = audioCtx.createBiquadFilter();
        trebleFilter.type = 'highshelf';
        trebleFilter.frequency.setValueAtTime(3000, audioCtx.currentTime);
        trebleFilter.gain.setValueAtTime(eqSettings.treble, audioCtx.currentTime);
        eqNodesRef.current.treble = trebleFilter;

        // 3. Create DynamicsCompressor to prevent clipping
        const compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-24, audioCtx.currentTime);  // dB
        compressor.knee.setValueAtTime(30, audioCtx.currentTime);        // dB
        compressor.ratio.setValueAtTime(12, audioCtx.currentTime);       // 12:1 ratio
        compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);   // 3ms
        compressor.release.setValueAtTime(0.25, audioCtx.currentTime);   // 250ms
        compressorNodeRef.current = compressor;

        // 4. Create AnalyserNode for FFT visualization
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;  // 32 frequency bins for 24-bar display
        analyser.smoothingTimeConstant = 0.8;  // Smooth transitions
        analyserNodeRef.current = analyser;

        // 5. Connect the audio chain
        // GainNode → Bass → Mid → Treble → Compressor → Analyser → Destination
        gainNode.connect(bassFilter);
        bassFilter.connect(midFilter);
        midFilter.connect(trebleFilter);
        trebleFilter.connect(compressor);
        compressor.connect(analyser);
        analyser.connect(audioCtx.destination);

        console.log('[MusicPlayer] Audio chain initialized: Gain → EQ → Compressor → Analyser → Output');

        // Create MIDI player
        playerRef.current = new MidiPlayer.Player((event: any) => {
          if (event.name === 'Note on' && event.velocity > 0) {
            playNote(event.noteNumber, event.velocity, event.track);
          }
        });

        playerRef.current.on('endOfFile', () => {
          setIsPlaying(false);
          setProgress(0);
          // Auto-advance to next track
          setCurrentTrackIndex((prev) => (prev + 1) % MUSIC_LIBRARY.length);
        });

        // Load first track
        await loadTrack(0);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize music player:', error);
        setIsLoading(false);
      }
    };

    initPlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (progressAnimationRef.current) {
        cancelAnimationFrame(progressAnimationRef.current);
      }
    };
  }, []);

  const loadTrack = async (trackIndex: number) => {
    if (!playerRef.current || !audioContextRef.current) return;

    try {
      const track = MUSIC_LIBRARY[trackIndex];
      const response = await fetch(track.file);
      const arrayBuffer = await response.arrayBuffer();
      const midiData = new Uint8Array(arrayBuffer);

      playerRef.current.loadArrayBuffer(midiData);
      setProgress(0);

      // Preload acoustic piano (most common instrument)
      await loadInstrument(0);  // Acoustic grand piano
      await loadInstrument(33); // Acoustic bass
    } catch (error) {
      console.error('Failed to load track:', error);
    }
  };

  const loadInstrument = async (program: number) => {
    if (!audioContextRef.current || instrumentsRef.current.has(program)) return;

    try {
      const instrumentNames = [
        'acoustic_grand_piano', 'bright_acoustic_piano', 'electric_grand_piano',
        'honkytonk_piano', 'electric_piano_1', 'electric_piano_2', 'harpsichord',
        'clavinet', 'celesta', 'glockenspiel', 'music_box', 'vibraphone',
        'marimba', 'xylophone', 'tubular_bells', 'dulcimer', 'drawbar_organ',
      ];

      const instrumentName = instrumentNames[program % instrumentNames.length] || 'acoustic_grand_piano';

      const instrument = await Soundfont.instrument(
        audioContextRef.current,
        instrumentName,
        { gain: volume }
      );

      instrumentsRef.current.set(program, instrument);
    } catch (error) {
      console.error(`Failed to load instrument ${program}:`, error);
    }
  };

  const playNote = async (note: number, velocity: number, track: number) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    const programMap: { [key: number]: number } = {
      0: 0,  // Acoustic piano
      1: 0,  // Acoustic piano
      2: 33, // Acoustic bass
      3: 0,  // Acoustic piano
    };

    const program = programMap[track] || 0;

    // Ensure instrument is loaded
    if (!instrumentsRef.current.has(program)) {
      await loadInstrument(program);
    }

    const instrument = instrumentsRef.current.get(program);
    if (instrument && audioContextRef.current) {
      try {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(note / 12) - 1;
        const noteName = noteNames[note % 12];
        const fullNoteName = `${noteName}${octave}`;

        // Play the note through our audio chain
        // Velocity is normalized (0-1), volume is handled by GainNode
        const node = instrument.play(fullNoteName, audioContextRef.current.currentTime, {
          gain: velocity / 127,  // Just use velocity, volume handled by GainNode
          duration: 0.5,
          destination: gainNodeRef.current,  // Route through our audio chain!
        });
      } catch (error) {
        console.error('Error playing note:', error);
      }
    }
  };

  const play = () => {
    if (!playerRef.current || !audioContextRef.current) return;

    // Resume audio context if suspended
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    playerRef.current.play();
    setIsPlaying(true);

    // Update progress
    const updateProgress = () => {
      if (playerRef.current && isPlaying) {
        const remaining = playerRef.current.getSongPercentRemaining() || 0;
        setProgress(100 - remaining);

        if (isPlaying) {
          progressAnimationRef.current = requestAnimationFrame(updateProgress);
        }
      }
    };
    progressAnimationRef.current = requestAnimationFrame(updateProgress);
  };

  const pause = () => {
    if (!playerRef.current) return;
    playerRef.current.pause();
    setIsPlaying(false);
    if (progressAnimationRef.current) {
      cancelAnimationFrame(progressAnimationRef.current);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  // FIXED: Volume control using proper GainNode with logarithmic scaling
  const setVolume = (linearVolume: number) => {
    // Clamp to valid range
    const clamped = Math.max(0, Math.min(1, linearVolume));

    // Store linear value for slider display
    setVolumeState(clamped);

    // Apply logarithmic scaling for natural volume perception
    // Human hearing is logarithmic, so square the value
    const scaledVolume = Math.pow(clamped, 2);

    // Apply to GainNode
    if (gainNodeRef.current && audioContextRef.current) {
      // Use setTargetAtTime for smooth transitions (avoids clicks)
      gainNodeRef.current.gain.setTargetAtTime(
        scaledVolume,
        audioContextRef.current.currentTime,
        0.02  // 20ms time constant for smooth fade
      );
    }

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('music-player-volume', clamped.toString());
    }
  };

  // NEW: EQ control function
  const setEQ = (band: 'bass' | 'mid' | 'treble', dbValue: number) => {
    // Clamp to valid range (-12 to +12 dB)
    const clamped = Math.max(-12, Math.min(12, dbValue));
    const node = eqNodesRef.current[band];

    if (node && audioContextRef.current) {
      // Smooth transition for EQ changes
      node.gain.setTargetAtTime(
        clamped,
        audioContextRef.current.currentTime,
        0.02
      );

      // Update state
      setEqSettings(prev => ({ ...prev, [band]: clamped }));

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        const currentEQ = JSON.parse(localStorage.getItem('music-player-eq') || '{}');
        currentEQ[band] = clamped;
        localStorage.setItem('music-player-eq', JSON.stringify(currentEQ));
      }
    }
  };

  // NEW: Reset EQ to flat
  const resetEQ = () => {
    setEQ('bass', 0);
    setEQ('mid', 0);
    setEQ('treble', 0);
  };

  const switchTrack = async (trackIndex: number) => {
    const wasPlaying = isPlaying;
    if (isPlaying) {
      pause();
    }
    setCurrentTrackIndex(trackIndex);
    await loadTrack(trackIndex);
    if (wasPlaying) {
      setTimeout(() => play(), 100);
    }
  };

  const nextTrack = () => {
    switchTrack((currentTrackIndex + 1) % MUSIC_LIBRARY.length);
  };

  const previousTrack = () => {
    switchTrack((currentTrackIndex - 1 + MUSIC_LIBRARY.length) % MUSIC_LIBRARY.length);
  };

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  const contextValue: MusicPlayerContextType = {
    // State
    isPlaying,
    isLoading,
    currentTrack,
    currentTrackIndex,
    volume,
    progress,
    isMinimized,

    // Audio Analysis (NEW)
    analyserNode: analyserNodeRef.current,

    // EQ State (NEW)
    eqSettings,

    // Actions
    play,
    pause,
    togglePlayPause,
    setVolume,
    switchTrack,
    nextTrack,
    previousTrack,
    toggleMinimized,
    setMinimized: setIsMinimized,

    // EQ Actions (NEW)
    setEQ,
    resetEQ,
  };

  return (
    <MusicPlayerContext.Provider value={contextValue}>
      {children}
    </MusicPlayerContext.Provider>
  );
}
