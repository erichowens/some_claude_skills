import React, { useEffect, useRef, useState } from 'react';
import MidiPlayer from 'midi-player-js';
import Soundfont from 'soundfont-player';
import styles from './styles.module.css';

interface VaporwavePlayerProps {
  autoplay?: boolean;
  className?: string;
}

interface Track {
  name: string;
  file: string;
}

const TRACKS: Track[] = [
  { name: 'Blank Banshee Flow', file: '/audio/blank-banshee-flow.mid' },
  { name: 'Neon Dreams', file: '/audio/neon-dreams.mid' },
  { name: 'Outrun Nights', file: '/audio/outrun-nights.mid' },
  { name: 'Dark Ritual', file: '/audio/dark-ritual.mid' },
  { name: 'Vapor Trap', file: '/audio/vapor-trap.mid' },
  { name: 'Chip Dreams', file: '/audio/chip-dreams.mid' },
  { name: 'Mall Soft', file: '/audio/mall-soft.mid' },
];

export default function VaporwavePlayer({ autoplay = false, className }: VaporwavePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);

  const playerRef = useRef<MidiPlayer.Player | null>(null);
  const instrumentsRef = useRef<Map<number, any>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize audio context and MIDI player
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
        });

        // Load first track
        await loadTrack(0);

        setIsLoading(false);

        if (autoplay) {
          play();
        }
      } catch (error) {
        console.error('Failed to initialize vaporwave player:', error);
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
    };
  }, []);

  const loadTrack = async (trackIndex: number) => {
    if (!playerRef.current || !audioContextRef.current) return;

    try {
      const response = await fetch(TRACKS[trackIndex].file);
      const arrayBuffer = await response.arrayBuffer();
      const midiData = new Uint8Array(arrayBuffer);

      playerRef.current.loadArrayBuffer(midiData);
      setCurrentTrack(trackIndex);
      setProgress(0);

      // Preload common instruments
      await loadInstrument(81); // Synth lead
      await loadInstrument(89); // Pad
      await loadInstrument(39); // Synth bass
      await loadInstrument(5);  // Electric piano
      await loadInstrument(12); // Vibraphone

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

      // Map MIDI program numbers to instrument names (simplified)
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
    // Determine instrument based on track
    const programMap: { [key: number]: number } = {
      0: 89, // Pad
      1: 5,  // Electric piano
      2: 39, // Bass
      3: 12, // Vibraphone
    };

    const program = programMap[track] || 0;
    await loadInstrument(program);

    const instrument = instrumentsRef.current.get(program);
    if (instrument && audioContextRef.current) {
      try {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(note / 12) - 1;
        const noteName = noteNames[note % 12];
        const fullNoteName = `${noteName}${octave}`;

        instrument.play(fullNoteName, audioContextRef.current.currentTime, {
          gain: (velocity / 127) * volume,
        });
      } catch (error) {
        // Silently handle note play errors
      }
    }
  };

  const play = () => {
    if (!playerRef.current || !audioContextRef.current) return;

    // Resume audio context if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    playerRef.current.play();
    setIsPlaying(true);

    // Update progress
    const updateProgress = () => {
      if (playerRef.current && isPlaying) {
        const progress = (playerRef.current.getSongPercentRemaining() || 0);
        setProgress(100 - progress);

        if (isPlaying) {
          requestAnimationFrame(updateProgress);
        }
      }
    };
    requestAnimationFrame(updateProgress);
  };

  const pause = () => {
    if (!playerRef.current) return;
    playerRef.current.pause();
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    // Update all loaded instruments
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
    await loadTrack(trackIndex);
    if (wasPlaying) {
      setTimeout(() => play(), 100);
    }
  };

  if (isLoading) {
    return (
      <div className={`${styles.player} ${className || ''}`}>
        <div className={styles.loading}>
          <div className={styles.loadingBar}>
            <div className={styles.loadingBarFill}></div>
          </div>
          <div className={styles.loadingText}>Loading vaporwave vibes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.player} ${className || ''}`}>
      <div className={styles.playerHeader}>
        <div className={styles.trackInfo}>
          <div className={styles.trackTitle}>
            {TRACKS[currentTrack]?.name || 'Vaporwave Track'}
          </div>
          <div className={styles.trackSubtitle}>
            {isPlaying ? '▶ NOW PLAYING' : '⏸ PAUSED'}
          </div>
        </div>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.controls}>
        <button
          className={styles.playButton}
          onClick={togglePlayPause}
          disabled={isLoading}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className={styles.trackSelector}>
          {TRACKS.map((track, idx) => (
            <button
              key={idx}
              className={`${styles.trackButton} ${idx === currentTrack ? styles.trackButtonActive : ''}`}
              onClick={() => switchTrack(idx)}
              disabled={isLoading}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <div className={styles.volumeControl}>
          <span className={styles.volumeIcon}>🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className={styles.volumeSlider}
            aria-label="Volume"
          />
        </div>
      </div>

      <div className={styles.visualizer}>
        <div className={styles.waveform}>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`${styles.bar} ${isPlaying ? styles.barAnimated : ''}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
