# Before State: Winamp Music Player Audio Issues

## Date: 2025-11-26
## Skills to be used: sound-engineer, web-design-expert, windows-3-1-web-designer

## Current Issues

### 1. BROKEN: Volume Control (Critical)
**Location**: `MusicPlayerContext.tsx:226-233`

```typescript
// This doesn't work - destination.gain doesn't exist on AudioDestinationNode
instrument.context.destination.gain?.setValueAtTime?.(newVolume, 0);
```

The AudioDestinationNode doesn't have a `gain` property. Volume control currently does nothing.

### 2. FAKE: FFT Visualizer
**Location**: `WinampModal/index.tsx:112-126`

The visualizer uses CSS animations instead of real FFT data:
```typescript
className={`${styles.bar} ${isPlaying ? styles.barAnimated : ''}`}
```

This just toggles an animation class - bars don't respond to actual audio frequencies.

### 3. MISSING: Audio Routing Chain
There's no proper Web Audio API signal chain. Should be:
```
Source → GainNode → AnalyserNode → Destination
```

Currently there's no GainNode for volume control and no AnalyserNode for FFT data.

### 4. MISSING: Professional Audio Features
- No 3-band EQ (Bass, Mid, Treble)
- No dynamic range compression
- No stereo width control
- No VU meters

## Files in this "before" snapshot:
- `contexts/MusicPlayerContext.tsx` - Core audio logic with broken volume
- `components/WinampModal/index.tsx` - Main player with fake visualizer
- `components/WinampModal/styles.module.css` - CSS with animation-based visualizer
- `components/MinifiedMusicPlayer/index.tsx` - Navbar widget with fake visualizer

## Expected Improvements
1. Working volume control with logarithmic scaling
2. Real FFT visualizer responding to actual frequencies
3. 3-band EQ with Windows 3.1 styled sliders
4. Dynamic compression to prevent clipping
5. Professional audio quality comparable to real music player software
