# Winamp Music Player Audio Upgrade

A comprehensive audio system upgrade for a faux-Winamp MIDI player, transforming it from a non-functional prototype with fake visualizations into a professional-grade music player with real FFT analysis, 3-band EQ, and dynamics compression.

## Overview

This artifact demonstrates multi-skill collaboration between:
- **sound-engineer**: Core audio chain architecture and Web Audio API implementation
- **windows-3-1-web-designer**: Authentic Windows 3.1 styled EQ panel
- **web-design-expert**: Integration and responsive design

## The Problem

The original Winamp-style MIDI player had several critical issues:

1. **Broken Volume Control**: The code tried to access `destination.gain` which doesn't exist on `AudioDestinationNode`
2. **Fake Visualizer**: CSS animations that didn't respond to actual audio
3. **No Audio Processing**: Missing EQ, compression, and analysis capabilities

## The Solution

### Audio Signal Chain

```
Source → GainNode → Bass EQ → Mid EQ → Treble EQ → Compressor → Analyser → Output
           ↓           ↓         ↓          ↓           ↓            ↓
        Volume     200Hz      1kHz       3kHz      Prevent       FFT for
        Control   lowshelf   peaking   highshelf   Clipping    Visualizer
```

### Key Implementations

#### 1. Volume Control with Logarithmic Scaling
Human hearing is logarithmic, so we square the volume value for natural perception:

```typescript
const scaledVolume = Math.pow(linearVolume, 2);
gainNode.gain.setTargetAtTime(scaledVolume, ctx.currentTime, 0.02);
```

#### 2. Real FFT Visualizer Hook
Custom React hook that extracts frequency data at 60fps:

```typescript
const frequencyData = useFFTData({
  analyserNode,
  binCount: 24,    // 24 bars in visualizer
  smoothing: 0.7,  // Smooth animation
  isPlaying,
});
```

#### 3. 3-Band Parametric EQ
Professional-style EQ with three bands:
- **Bass**: Low shelf filter at 200Hz
- **Mid**: Peaking filter at 1kHz (Q=1)
- **Treble**: High shelf filter at 3kHz

#### 4. Dynamics Compression
Prevents clipping with sensible defaults:
- Threshold: -24dB
- Ratio: 12:1
- Attack: 3ms
- Release: 250ms

## Files Changed

| File | Changes |
|------|---------|
| `MusicPlayerContext.tsx` | Complete audio chain rewrite (~200 lines) |
| `useFFTData.ts` | New hook for FFT analysis (~120 lines) |
| `WinampModal/index.tsx` | Real FFT visualizer + EQ panel |
| `WinampModal/styles.module.css` | Windows 3.1 EQ styles |
| `MinifiedMusicPlayer/index.tsx` | Real FFT mini visualizer |

## Windows 3.1 Styling

The EQ panel features authentic Windows 3.1 aesthetics:
- Outset borders with proper shadow colors (#fff, #808080)
- Blue gradient title bar (#000080 → #1084d0)
- MS Sans Serif typography
- Inset value displays
- Classic button states (normal, hover, active)

## Technical Learnings

1. **AudioDestinationNode** has no `gain` property - must create explicit GainNode
2. **setTargetAtTime** prevents clicks/pops during parameter changes
3. **BiquadFilter** types map to EQ bands: lowshelf, peaking, highshelf
4. **DynamicsCompressor** threshold around -24dB works well for music
5. **requestAnimationFrame** loops need cleanup to prevent memory leaks
6. **Logarithmic volume scaling** is essential for natural volume perception

## Results

- Volume control now works correctly
- Visualizer responds to actual audio frequencies
- EQ provides ±12dB adjustment per band
- Compression prevents distortion on loud passages
- Professional audio quality comparable to real music players

## Usage

The music player is embedded in the website navbar. Click to expand and access:
- Play/Pause controls
- Track selection
- Volume slider
- 3-band EQ with Windows 3.1 styling
- Real-time FFT visualizer
