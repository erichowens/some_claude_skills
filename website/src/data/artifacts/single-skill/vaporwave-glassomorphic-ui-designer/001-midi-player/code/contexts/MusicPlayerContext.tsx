import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import MidiPlayer from 'midi-player-js';
import Soundfont from 'soundfont-player';
import { MUSIC_LIBRARY, TrackMetadata } from '../data/musicMetadata';

interface MusicPlayerContextType {
  // State
  isPlaying: boolean;
  isLoading: boolean;
  currentTrack: TrackMetadata | null;
  currentTrackIndex: number;
  volume: number;
  progress: number;
  isMinimized: boolean;

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

export function MusicPlayerProvider({ children }: MusicPlayerProviderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(8); // Default to SPAWN by Blank Banshee
  const [volume, setVolumeState] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [isMinimized, setIsMinimized] = useState(true);

  const playerRef = useRef<MidiPlayer.Player | null>(null);
  const instrumentsRef = useRef<Map<number, any>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const progressAnimationRef = useRef<number | null>(null);

  const currentTrack = MUSIC_LIBRARY[currentTrackIndex] || null;

  // Initialize player on mount
  useEffect(() => {
    const initPlayer = async () => {
      setIsLoading(true);
      try {
        // Create audio context
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

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
    if (!audioContextRef.current) return;

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

        // Play the note with proper timing
        instrument.play(fullNoteName, audioContextRef.current.currentTime, {
          gain: (velocity / 127) * volume,
          duration: 0.5, // Add note duration
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

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    instrumentsRef.current.forEach((instrument) => {
      if (instrument && instrument.context) {
        instrument.context.destination.gain?.setValueAtTime?.(newVolume, 0);
      }
    });
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
    isPlaying,
    isLoading,
    currentTrack,
    currentTrackIndex,
    volume,
    progress,
    isMinimized,
    play,
    pause,
    togglePlayPause,
    setVolume,
    switchTrack,
    nextTrack,
    previousTrack,
    toggleMinimized,
    setMinimized: setIsMinimized,
  };

  return (
    <MusicPlayerContext.Provider value={contextValue}>
      {children}
    </MusicPlayerContext.Provider>
  );
}
