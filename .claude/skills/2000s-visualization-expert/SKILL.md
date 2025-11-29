---
name: 2000s-visualization-expert
description: Expert in 2000s-era music visualization (Milkdrop, AVS, Geiss) and modern WebGL implementations. Specializes in Butterchurn integration, Web Audio API AnalyserNode FFT data, GLSL shaders for audio-reactive visuals, and psychedelic generative art. Activate on "Milkdrop", "music visualization", "WebGL visualizer", "Butterchurn", "audio reactive", "FFT visualization", "spectrum analyzer". NOT for simple bar charts/waveforms (use basic canvas), video editing, or non-audio visuals.
allowed-tools: Read,Write,Edit,Bash,WebFetch
---

# 2000s Music Visualization Expert

Expert in recreating the legendary 2000s music visualization era - Milkdrop, AVS, Geiss - using modern WebGL and Web Audio APIs.

## When to Use

✅ **Use for:**
- Implementing Milkdrop-style psychedelic visualizations
- Butterchurn library integration (WebGL Milkdrop)
- Web Audio API AnalyserNode FFT/waveform extraction
- GLSL fragment shaders for audio-reactive effects
- Full-screen immersive music experiences
- Real-time beat detection and audio analysis
- Preset systems and visualization transitions

❌ **NOT for:**
- Simple spectrum bar charts (use Canvas 2D)
- Static audio waveform displays
- Video editing or processing
- Non-audio generative art
- Audio playback/streaming issues (use audio-engineer skills)

## The Golden Era: 2000s Visualization History

### Milkdrop (2001-2007) - The Legend
Created by **Ryan Geiss** for Winamp. Revolutionary features:
- **Preset system**: User-created visualization scripts
- **Per-pixel equations**: Every pixel could react to audio
- **Motion vectors**: Fluid dynamics simulation
- **Custom waveforms**: Draw arbitrary shapes with audio data
- **Shader-like language**: "EEL" (Expression Evaluation Library)

**Key insight**: Milkdrop's magic came from layering simple effects - blur, zoom, rotation, color shift - with audio-reactive parameters.

### AVS (Advanced Visualization Studio)
Winamp's built-in system. More accessible than Milkdrop but less powerful.
- Stack-based effect system
- Superscopes and dynamic movements
- Color maps and transitions

### Geiss (1998)
Ryan Geiss's earlier work. Simpler but influential plasma/tunnel effects.

## Modern Implementation: Butterchurn

**Butterchurn** is THE WebGL Milkdrop reimplementation:
- 1.7k GitHub stars, MIT licensed
- Full preset compatibility with original Milkdrop
- WASM-accelerated EEL expression compiler
- npm packages: `butterchurn`, `butterchurn-presets`

### Basic Butterchurn Integration

```typescript
import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';

// Setup
const visualizer = butterchurn.createVisualizer(audioContext, canvas, {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio || 1,
  textureRatio: 1,  // Lower for performance
});

// Connect audio source
visualizer.connectAudio(audioNode);  // Can be MediaElementSource, Oscillator, etc.

// Load preset
const presets = butterchurnPresets.getPresets();
const presetKeys = Object.keys(presets);
visualizer.loadPreset(presets[presetKeys[0]], 2.0);  // 2 second blend

// Render loop
function render() {
  visualizer.render();
  requestAnimationFrame(render);
}
render();
```

### Preset Recommendations

**Psychedelic/Trippy:**
- `Flexi, martin + geiss - dedicated to the sherwin maxawow`
- `Rovastar - Fractopia`
- `Unchained - Unified Drag`

**Smooth/Chill:**
- `Flexi - predator-prey-spirals`
- `Geiss - Cosmic Strings 2`
- `Martin - liquid science`

**High Energy:**
- `Flexi + Martin - disconnected`
- `shifter - tumbling cubes`
- `Zylot - Clouds (Tunnel Mix)`

## Web Audio API: FFT Data Extraction

The foundation of all audio visualization:

```typescript
// Create analyser
const analyserNode = audioContext.createAnalyser();
analyserNode.fftSize = 2048;  // Power of 2, 32-32768
analyserNode.smoothingTimeConstant = 0.8;  // 0-1, higher = smoother

// Connect to audio chain
source.connect(analyserNode);
analyserNode.connect(audioContext.destination);

// Get frequency data (spectrum)
const frequencyData = new Uint8Array(analyserNode.frequencyBinCount);
analyserNode.getByteFrequencyData(frequencyData);  // 0-255 values

// Get waveform data (time domain)
const waveformData = new Uint8Array(analyserNode.fftSize);
analyserNode.getByteTimeDomainData(waveformData);  // 128 = silence
```

### Frequency Bin Distribution

**Critical knowledge**: FFT bins are linear in frequency, but human hearing is logarithmic!

```typescript
// Convert linear bins to perceptually-uniform bands
function getLogarithmicBands(frequencyData: Uint8Array, numBands: number): number[] {
  const bands = new Array(numBands).fill(0);
  const nyquist = audioContext.sampleRate / 2;

  for (let i = 0; i < numBands; i++) {
    // Logarithmic frequency mapping
    const lowFreq = 20 * Math.pow(nyquist / 20, i / numBands);
    const highFreq = 20 * Math.pow(nyquist / 20, (i + 1) / numBands);

    const lowBin = Math.floor(lowFreq / nyquist * frequencyData.length);
    const highBin = Math.floor(highFreq / nyquist * frequencyData.length);

    let sum = 0;
    for (let j = lowBin; j < highBin; j++) {
      sum += frequencyData[j];
    }
    bands[i] = sum / (highBin - lowBin || 1);
  }
  return bands;
}
```

## GLSL Shaders for Custom Visualizations

When you want to go beyond Butterchurn presets:

### Basic Audio-Reactive Fragment Shader

```glsl
precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_audioData;  // FFT as 1D texture
uniform float u_bass;
uniform float u_mid;
uniform float u_treble;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 center = uv - 0.5;

  // Audio-reactive radius
  float dist = length(center);
  float audioSample = texture2D(u_audioData, vec2(dist, 0.0)).r;

  // Psychedelic color cycling
  float hue = u_time * 0.1 + audioSample * 0.5;
  vec3 color = 0.5 + 0.5 * cos(6.28 * (hue + vec3(0.0, 0.33, 0.67)));

  // Pulsing glow based on bass
  float glow = smoothstep(0.5 - u_bass * 0.3, 0.0, dist);

  gl_FragColor = vec4(color * glow, 1.0);
}
```

### Passing Audio Data to Shaders

```typescript
// Create 1D texture from FFT data
const audioTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, audioTexture);
gl.texImage2D(
  gl.TEXTURE_2D, 0, gl.LUMINANCE,
  frequencyData.length, 1, 0,
  gl.LUMINANCE, gl.UNSIGNED_BYTE,
  frequencyData
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
```

## Common Anti-Patterns

### Anti-Pattern: Ignoring AudioContext State

**What it looks like**: Visualization silently fails
```typescript
// WRONG
const visualizer = butterchurn.createVisualizer(audioContext, canvas, opts);
visualizer.render();  // Nothing happens!
```

**Why it's wrong**: AudioContext starts suspended, needs user interaction

**Correct approach**:
```typescript
canvas.addEventListener('click', async () => {
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  // Now visualization will work
});
```

### Anti-Pattern: Linear Frequency Display

**What it looks like**: Bass frequencies dominate, treble invisible

**Why it's wrong**: FFT bins are linear but hearing is logarithmic. First 100 bins might be 0-2kHz (speech range), remaining 900 bins are 2-22kHz.

**Correct approach**: Use logarithmic bin mapping (see code above)

### Anti-Pattern: No Smoothing

**What it looks like**: Jittery, seizure-inducing visuals

**Why it's wrong**: Raw FFT data is noisy frame-to-frame

**Correct approach**:
```typescript
analyserNode.smoothingTimeConstant = 0.7;  // Built-in smoothing

// Or manual exponential smoothing
smoothedValue = smoothedValue * 0.8 + newValue * 0.2;
```

### Anti-Pattern: requestAnimationFrame Without Cleanup

**What it looks like**: Memory leaks, multiple render loops

**Correct approach**:
```typescript
let animationId: number | null = null;

function startVisualization() {
  function render() {
    visualizer.render();
    animationId = requestAnimationFrame(render);
  }
  render();
}

function stopVisualization() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}
```

## Full-Screen Visualization Best Practices

```typescript
// Handle resize
function handleResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  visualizer.setRendererSize(width, height);
}

window.addEventListener('resize', handleResize);

// Full-screen toggle
async function toggleFullscreen(element: HTMLElement) {
  if (!document.fullscreenElement) {
    await element.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
}

// Hide cursor after inactivity
let cursorTimeout: number;
document.addEventListener('mousemove', () => {
  document.body.style.cursor = 'default';
  clearTimeout(cursorTimeout);
  cursorTimeout = setTimeout(() => {
    document.body.style.cursor = 'none';
  }, 3000);
});
```

## Performance Optimization

1. **Lower texture ratio** for older GPUs: `textureRatio: 0.5`
2. **Reduce fftSize** if not needed: 512 or 1024 vs 2048
3. **Use `will-change: transform`** on canvas for compositor hints
4. **Avoid DOM updates** during render loop
5. **Profile with Chrome DevTools** GPU timeline

## Evolution Timeline

### 1998-2000: Early Era
- Geiss plugin, simple plasma effects
- AVS beginnings
- DirectX-based

### 2001-2007: Golden Age
- Milkdrop 1 & 2 released
- Massive preset community
- Peak Winamp usage

### 2007-2015: Decline
- Streaming services rise
- Winamp sold, neglected
- Community fragments

### 2018-Present: WebGL Renaissance
- Butterchurn released (2018)
- Webamp integration
- WASM performance boost (2020)
- Active development continues (2024)

## Integration Checklist

- [ ] AudioContext created and resumed on user interaction
- [ ] AnalyserNode connected to audio source
- [ ] Canvas sized correctly (account for devicePixelRatio)
- [ ] Render loop with requestAnimationFrame
- [ ] Cleanup on unmount (cancelAnimationFrame)
- [ ] Preset loading with blend time
- [ ] Resize handling
- [ ] Full-screen support with ESC to exit
- [ ] Track info overlay (z-index above canvas)
- [ ] Cursor hiding after inactivity

---

**This skill covers**: Butterchurn/Milkdrop | Web Audio FFT | GLSL shaders | Full-screen visualization | Audio-reactive art
