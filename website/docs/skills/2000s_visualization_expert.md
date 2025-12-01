---
title: 2000s Visualization Expert
description: Expert in Milkdrop, AVS, Geiss music visualization and modern WebGL implementations with Butterchurn
sidebar_label: 2000s Visualization Expert
---

# 2000s Visualization Expert

Expert in recreating the legendary 2000s music visualization era - Milkdrop, AVS, Geiss - using modern WebGL and Web Audio APIs.

## Quick Facts

| Attribute | Value |
|-----------|-------|
| **Category** | Visual Design & UI |
| **Activation Keywords** | Milkdrop, music visualization, WebGL visualizer, Butterchurn, audio reactive, FFT visualization, spectrum analyzer |
| **Tools Required** | Read, Write, Edit, Bash, WebFetch |

## What It Does

The 2000s Visualization Expert skill helps you:

- **Implement Milkdrop-style visualizations** - Psychedelic, audio-reactive effects
- **Integrate Butterchurn** - The WebGL Milkdrop reimplementation
- **Extract FFT data** - Web Audio API AnalyserNode for frequency/waveform
- **Write GLSL shaders** - Custom audio-reactive fragment shaders
- **Build full-screen experiences** - Immersive music visualization
- **Handle audio context** - Proper state management and user interaction

## The Golden Era

### Milkdrop (2001-2007)

Created by Ryan Geiss for Winamp. Revolutionary features:

- **Preset system** - User-created visualization scripts
- **Per-pixel equations** - Every pixel could react to audio
- **Motion vectors** - Fluid dynamics simulation
- **Custom waveforms** - Draw arbitrary shapes with audio data

### Modern Implementation: Butterchurn

**Butterchurn** is THE WebGL Milkdrop reimplementation:

- Full preset compatibility with original Milkdrop
- WASM-accelerated EEL expression compiler
- npm packages: `butterchurn`, `butterchurn-presets`

```typescript
import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';

const visualizer = butterchurn.createVisualizer(audioContext, canvas, {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio || 1,
});

visualizer.connectAudio(audioNode);
const presets = butterchurnPresets.getPresets();
visualizer.loadPreset(presets[Object.keys(presets)[0]], 2.0);
```

## Web Audio API FFT

The foundation of all audio visualization:

```typescript
const analyserNode = audioContext.createAnalyser();
analyserNode.fftSize = 2048;
analyserNode.smoothingTimeConstant = 0.8;

const frequencyData = new Uint8Array(analyserNode.frequencyBinCount);
analyserNode.getByteFrequencyData(frequencyData);
```

**Critical knowledge**: FFT bins are linear in frequency, but human hearing is logarithmic! Use logarithmic bin mapping for perceptually-correct displays.

## When to Use

**Use for:**
- Implementing Milkdrop-style psychedelic visualizations
- Butterchurn library integration
- Web Audio API FFT/waveform extraction
- GLSL fragment shaders for audio-reactive effects
- Full-screen immersive music experiences
- Real-time beat detection and audio analysis

**NOT for:**
- Simple spectrum bar charts (use Canvas 2D)
- Static audio waveform displays
- Video editing or processing
- Non-audio generative art

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Ignoring AudioContext state | Visualization silently fails | Resume context on user interaction |
| Linear frequency display | Bass dominates, treble invisible | Use logarithmic bin mapping |
| No smoothing | Jittery, seizure-inducing visuals | Set smoothingTimeConstant or manual EMA |
| No render cleanup | Memory leaks, multiple loops | cancelAnimationFrame on unmount |

## Installation

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="download" label="Download" default>
    Download from the [Skills Gallery](/skills) and extract to your `.claude/skills/` directory.
  </TabItem>
  <TabItem value="git" label="Git Clone">
    ```bash
    git clone https://github.com/erichowens/some_claude_skills.git
    cp -r some_claude_skills/.claude/skills/2000s-visualization-expert ~/.claude/skills/
    ```
  </TabItem>
</Tabs>

## Related Skills

- [Sound Engineer](/docs/skills/sound_engineer) - Spatial audio and procedural sound design
- [Metal Shader Expert](/docs/skills/metal_shader_expert) - Real-time graphics and MSL shaders
- [Vaporwave UI Designer](/docs/skills/vaporwave_glassomorphic_ui_designer) - Retro-futuristic aesthetics
