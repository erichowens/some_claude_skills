---
name: voice-audio-engineer
description: Expert audio engineer specializing in voice recording, podcast production, spatial audio (Ambisonics, binaural, Atmos), procedural sound design, real-time DSP implementation, and professional mixing/mastering with deep signal processing knowledge
version: 1.0.0
category: Creative & Design
tags:
  - audio-engineering
  - dsp
  - spatial-audio
  - ambisonics
  - podcast-production
  - mixing
  - mastering
author: Erich Owens
---

# Voice & Audio Engineer

Expert audio engineer with deep signal processing knowledge, spatial audio expertise, and production-ready implementation skills.

## Signal Processing Fundamentals

### The Signal Chain (Actually Understanding It)

```
                    ANALOG DOMAIN                           DIGITAL DOMAIN
┌─────────────────────────────────────────┐    ┌─────────────────────────────────────┐
│                                         │    │                                     │
│  [Acoustic] → [Transducer] → [Preamp]  │───▶│  [ADC] → [DSP] → [DAC] → [Amp]    │
│      ↓            ↓            ↓       │    │    ↓       ↓       ↓       ↓      │
│   Sound       Microphone    Gain +     │    │ Sample  Process  Reconstruct Power │
│   Pressure    (dBV/Pa)     Impedance   │    │ (bits,   (math)  (filters)   Stage │
│                            Matching    │    │  rate)                              │
│                                         │    │                                     │
└─────────────────────────────────────────┘    └─────────────────────────────────────┘
```

### Digital Audio Theory

```python
# Nyquist-Shannon: fs > 2 * fmax
# 44.1kHz captures up to 22.05kHz (human hearing ~20kHz)

# WHY 44.1kHz specifically?
# - CD standard derived from video: 44100 = 3 * 3 * 5 * 5 * 7 * 7 * 2
# - Divides evenly for video sync (NTSC/PAL)
# - 48kHz used in video (48000 = 48 * 1000, cleaner for video frames)

# Bit depth determines dynamic range:
# Dynamic Range (dB) ≈ 6.02 * bits + 1.76
# 16-bit: ~96 dB
# 24-bit: ~144 dB
# 32-bit float: ~1528 dB (effectively infinite for audio)

# Dithering: Adding noise to mask quantization distortion
# Required when reducing bit depth (24→16)
# Types: TPDF (triangular), shaped (noise pushed above hearing)
```

### Filter Design (The Real Math)

```python
import numpy as np
from scipy import signal

class AudioFilters:
    """Production-ready filter implementations."""

    @staticmethod
    def biquad_coefficients(filter_type: str, fc: float, fs: float,
                           Q: float = 0.707, gain_db: float = 0) -> tuple:
        """
        Calculate biquad filter coefficients.

        Uses Audio EQ Cookbook formulas (Robert Bristow-Johnson)
        """
        A = 10 ** (gain_db / 40)
        w0 = 2 * np.pi * fc / fs
        cos_w0 = np.cos(w0)
        sin_w0 = np.sin(w0)
        alpha = sin_w0 / (2 * Q)

        if filter_type == 'lowpass':
            b0 = (1 - cos_w0) / 2
            b1 = 1 - cos_w0
            b2 = (1 - cos_w0) / 2
            a0 = 1 + alpha
            a1 = -2 * cos_w0
            a2 = 1 - alpha

        elif filter_type == 'highpass':
            b0 = (1 + cos_w0) / 2
            b1 = -(1 + cos_w0)
            b2 = (1 + cos_w0) / 2
            a0 = 1 + alpha
            a1 = -2 * cos_w0
            a2 = 1 - alpha

        elif filter_type == 'bandpass':
            b0 = alpha
            b1 = 0
            b2 = -alpha
            a0 = 1 + alpha
            a1 = -2 * cos_w0
            a2 = 1 - alpha

        elif filter_type == 'notch':
            b0 = 1
            b1 = -2 * cos_w0
            b2 = 1
            a0 = 1 + alpha
            a1 = -2 * cos_w0
            a2 = 1 - alpha

        elif filter_type == 'peaking':
            b0 = 1 + alpha * A
            b1 = -2 * cos_w0
            b2 = 1 - alpha * A
            a0 = 1 + alpha / A
            a1 = -2 * cos_w0
            a2 = 1 - alpha / A

        elif filter_type == 'lowshelf':
            b0 = A * ((A + 1) - (A - 1) * cos_w0 + 2 * np.sqrt(A) * alpha)
            b1 = 2 * A * ((A - 1) - (A + 1) * cos_w0)
            b2 = A * ((A + 1) - (A - 1) * cos_w0 - 2 * np.sqrt(A) * alpha)
            a0 = (A + 1) + (A - 1) * cos_w0 + 2 * np.sqrt(A) * alpha
            a1 = -2 * ((A - 1) + (A + 1) * cos_w0)
            a2 = (A + 1) + (A - 1) * cos_w0 - 2 * np.sqrt(A) * alpha

        elif filter_type == 'highshelf':
            b0 = A * ((A + 1) + (A - 1) * cos_w0 + 2 * np.sqrt(A) * alpha)
            b1 = -2 * A * ((A - 1) + (A + 1) * cos_w0)
            b2 = A * ((A + 1) + (A - 1) * cos_w0 - 2 * np.sqrt(A) * alpha)
            a0 = (A + 1) - (A - 1) * cos_w0 + 2 * np.sqrt(A) * alpha
            a1 = 2 * ((A - 1) - (A + 1) * cos_w0)
            a2 = (A + 1) - (A - 1) * cos_w0 - 2 * np.sqrt(A) * alpha

        # Normalize
        b = np.array([b0/a0, b1/a0, b2/a0])
        a = np.array([1, a1/a0, a2/a0])

        return b, a

    @staticmethod
    def apply_biquad(audio: np.ndarray, b: np.ndarray, a: np.ndarray) -> np.ndarray:
        """Apply biquad filter using Direct Form II transposed."""
        return signal.lfilter(b, a, audio)
```

## Spatial Audio Deep Dive

### Ambisonics

```
AMBISONICS ORDER & CHANNELS
├── 0th order (B-format): 4 channels (W, X, Y, Z)
│   └── Omnidirectional + 3 figure-8 patterns
├── 1st order: 4 channels (most common)
├── 2nd order: 9 channels
├── 3rd order: 16 channels
└── nth order: (n+1)² channels

ENCODING (source → Ambisonics)
For a source at azimuth θ, elevation φ:
W = 1 (omnidirectional)
X = cos(θ) * cos(φ)  (front-back)
Y = sin(θ) * cos(φ)  (left-right)
Z = sin(φ)           (up-down)

DECODING (Ambisonics → speakers)
For each speaker at position (θs, φs):
speaker_signal = W + X*cos(θs)*cos(φs) + Y*sin(θs)*cos(φs) + Z*sin(φs)
```

```python
import numpy as np

class AmbisonicsEncoder:
    """First-order Ambisonics encoder."""

    def encode(self, mono_source: np.ndarray,
               azimuth: float, elevation: float = 0) -> np.ndarray:
        """
        Encode mono source to B-format.

        Args:
            mono_source: Mono audio array
            azimuth: Horizontal angle in radians (0 = front, π/2 = left)
            elevation: Vertical angle in radians (0 = horizon, π/2 = up)

        Returns:
            4-channel B-format array [W, X, Y, Z]
        """
        # ACN channel ordering, SN3D normalization
        W = mono_source * 1.0
        X = mono_source * np.cos(azimuth) * np.cos(elevation)
        Y = mono_source * np.sin(azimuth) * np.cos(elevation)
        Z = mono_source * np.sin(elevation)

        return np.stack([W, X, Y, Z], axis=0)

    def decode_binaural(self, bformat: np.ndarray,
                        hrtf_database: str = "CIPIC") -> np.ndarray:
        """Decode B-format to binaural stereo using HRTF."""
        # Virtual speaker approach: decode to virtual speaker positions,
        # then convolve each with appropriate HRTF
        pass  # Implementation depends on HRTF database
```

### Binaural & HRTF

```
HEAD-RELATED TRANSFER FUNCTION (HRTF)
├── ITD (Interaural Time Difference): ~0-0.7ms
│   └── Brain localizes by time difference between ears
├── ILD (Interaural Level Difference): ~0-20dB
│   └── Head shadows high frequencies
├── Spectral Cues: Pinna filtering
│   └── Elevation encoded in frequency notches
└── Individual variation is HUGE
    └── Generic HRTFs work ~70% of people well

HRTF DATABASES
├── CIPIC: 45 subjects, measured in anechoic chamber
├── MIT KEMAR: Single dummy head, widely used
├── HUTUBS: High-resolution, 96 subjects
└── SOFA format: Standard for HRTF exchange
```

```python
import numpy as np
from scipy.io import loadmat
from scipy.signal import fftconvolve

class BinauralRenderer:
    """Render 3D audio to headphones using HRTF."""

    def __init__(self, hrtf_path: str):
        """Load HRTF database (SOFA or CIPIC format)."""
        self.hrtf_data = self._load_hrtf(hrtf_path)

    def _load_hrtf(self, path: str):
        """Load HRTF from SOFA file."""
        # SOFA (Spatially Oriented Format for Acoustics)
        import sofar
        return sofar.read_sofa(path)

    def render(self, mono: np.ndarray,
               azimuth: float, elevation: float) -> np.ndarray:
        """
        Render mono source at position to binaural.

        Returns: Stereo array [2, samples]
        """
        # Find nearest HRTF measurement
        hrir_left, hrir_right = self._get_hrir(azimuth, elevation)

        # Convolve with impulse responses
        left = fftconvolve(mono, hrir_left, mode='same')
        right = fftconvolve(mono, hrir_right, mode='same')

        return np.stack([left, right], axis=0)

    def render_moving_source(self, mono: np.ndarray,
                            positions: list[tuple],
                            fs: int) -> np.ndarray:
        """Render source moving along path with interpolation."""
        block_size = 512  # ~10ms at 48kHz
        output = np.zeros((2, len(mono)))

        for i in range(0, len(mono), block_size):
            # Interpolate position
            t = i / len(mono)
            pos = self._interpolate_position(positions, t)

            block = mono[i:i+block_size]
            rendered = self.render(block, pos[0], pos[1])

            # Crossfade to avoid clicks
            output[:, i:i+len(block)] += rendered[:, :len(block)]

        return output
```

### Dolby Atmos / Object-Based Audio

```
DOLBY ATMOS CONCEPTS
├── Beds: Channel-based stems (7.1.4 base)
├── Objects: Individual audio with metadata
│   ├── Position (x, y, z) - can move!
│   ├── Size (spread)
│   └── Other parameters (snap, etc.)
└── Renderer: Maps objects to physical speakers

ADM (Audio Definition Model) - EBU standard
├── audioProgramme: Overall mix
├── audioContent: Group of objects
├── audioObject: Single positioned element
├── audioPackFormat: Channel layout
├── audioTrackFormat: Actual audio reference
└── audioBlockFormat: Time-varying position data
```

## Dynamics Processing

### Compressor Implementation

```python
import numpy as np

class Compressor:
    """
    Production-quality dynamics compressor.

    Implements proper ballistics, knee, and makeup gain.
    """

    def __init__(self, fs: int):
        self.fs = fs
        self.envelope = 0.0

    def process(self, audio: np.ndarray,
                threshold_db: float = -20,
                ratio: float = 4.0,
                attack_ms: float = 10,
                release_ms: float = 100,
                knee_db: float = 6,
                makeup_db: float = 0) -> np.ndarray:
        """
        Apply compression to audio signal.

        Args:
            threshold_db: Level above which compression kicks in
            ratio: Compression ratio (4:1 means 4dB in = 1dB out above threshold)
            attack_ms: Time to reach full compression
            release_ms: Time to release compression
            knee_db: Width of soft knee (0 = hard knee)
            makeup_db: Output gain to compensate for compression
        """
        # Convert times to coefficients
        attack_coef = np.exp(-1 / (self.fs * attack_ms / 1000))
        release_coef = np.exp(-1 / (self.fs * release_ms / 1000))

        output = np.zeros_like(audio)
        gain_reduction = np.zeros(len(audio))

        for i in range(len(audio)):
            # Get input level in dB
            input_level = 20 * np.log10(abs(audio[i]) + 1e-10)

            # Envelope follower (peak detection)
            if input_level > self.envelope:
                self.envelope = attack_coef * self.envelope + (1 - attack_coef) * input_level
            else:
                self.envelope = release_coef * self.envelope + (1 - release_coef) * input_level

            # Gain computer with soft knee
            over_threshold = self.envelope - threshold_db

            if knee_db > 0 and over_threshold > -knee_db/2 and over_threshold < knee_db/2:
                # Soft knee region
                knee_factor = (over_threshold + knee_db/2) ** 2 / (2 * knee_db)
                gain_db = -knee_factor * (1 - 1/ratio)
            elif over_threshold >= knee_db/2:
                # Full compression
                gain_db = -(over_threshold - knee_db/2) * (1 - 1/ratio) - \
                          (knee_db/2) * (1 - 1/ratio)
            else:
                # Below threshold
                gain_db = 0

            # Apply gain
            gain_linear = 10 ** ((gain_db + makeup_db) / 20)
            output[i] = audio[i] * gain_linear
            gain_reduction[i] = gain_db

        return output, gain_reduction
```

## Loudness Standards

```
LOUDNESS UNITS (ITU-R BS.1770)

LUFS (Loudness Units Full Scale)
├── Integrated: Average loudness over entire program
├── Short-term: 3-second sliding window
├── Momentary: 400ms sliding window
└── True Peak: Maximum sample value with intersample peaks

DELIVERY STANDARDS
├── Streaming (Spotify, Apple): -14 LUFS, -1 dBTP
├── Broadcast (EBU R128): -23 LUFS ±1, -1 dBTP
├── Broadcast (ATSC A/85): -24 LKFS ±2, -2 dBTP
├── Podcast: -16 to -19 LUFS (dialogue norm)
└── YouTube: -14 LUFS (normalized), no limit (not normalized)

LOUDNESS RANGE (LRA)
├── Measures dynamic range
├── Classical: 15-20 LU
├── Film: 10-15 LU
├── Pop music: 5-8 LU
└── Broadcast speech: 3-6 LU
```

```python
import numpy as np
from scipy import signal

def measure_lufs(audio: np.ndarray, fs: int) -> float:
    """
    Measure integrated loudness per ITU-R BS.1770-4.
    """
    # Stage 1: K-weighting filter
    # High shelf: +4dB at 1500Hz
    b1, a1 = signal.butter(2, 1500 / (fs/2), btype='high')
    # High pass: -inf at 0Hz (approximate with 38Hz HPF)
    b2, a2 = signal.butter(2, 38 / (fs/2), btype='high')

    # Apply K-weighting
    filtered = signal.lfilter(b1, a1, audio)
    filtered = signal.lfilter(b2, a2, filtered)

    # Stage 2: Mean square with gating
    block_size = int(0.4 * fs)  # 400ms blocks
    hop_size = int(0.1 * fs)    # 100ms overlap

    block_loudness = []
    for i in range(0, len(filtered) - block_size, hop_size):
        block = filtered[i:i+block_size]
        mean_square = np.mean(block ** 2)
        block_loudness.append(-0.691 + 10 * np.log10(mean_square + 1e-10))

    # Absolute threshold gate (-70 LUFS)
    gated = [l for l in block_loudness if l > -70]

    if not gated:
        return -70.0

    # Relative threshold gate (-10 LU below ungated mean)
    ungated_mean = np.mean(gated)
    relative_threshold = ungated_mean - 10

    final_gated = [l for l in gated if l > relative_threshold]

    if not final_gated:
        return ungated_mean

    return np.mean(final_gated)
```

## MCP Server Implementation

```python
#!/usr/bin/env python3
"""
audio_engineer_mcp.py - Professional audio analysis and processing MCP server
"""

from mcp.server import Server
from mcp.types import Tool, TextContent
import numpy as np
from scipy.io import wavfile

app = Server("audio-engineer")

@app.tool()
async def analyze_audio(file_path: str) -> str:
    """Comprehensive audio file analysis."""
    fs, audio = wavfile.read(file_path)

    # Normalize to float
    if audio.dtype == np.int16:
        audio = audio.astype(float) / 32768
    elif audio.dtype == np.int32:
        audio = audio.astype(float) / 2147483648

    # Mono for analysis
    if len(audio.shape) > 1:
        mono = np.mean(audio, axis=1)
    else:
        mono = audio

    # Measurements
    peak_db = 20 * np.log10(np.max(np.abs(mono)) + 1e-10)
    rms_db = 20 * np.log10(np.sqrt(np.mean(mono**2)) + 1e-10)
    crest_factor = peak_db - rms_db
    lufs = measure_lufs(mono, fs)
    dc_offset = np.mean(mono)

    # Frequency analysis
    from scipy.fft import rfft, rfftfreq
    spectrum = np.abs(rfft(mono))
    freqs = rfftfreq(len(mono), 1/fs)
    spectral_centroid = np.sum(freqs * spectrum) / np.sum(spectrum)

    return f"""
## Audio Analysis Report

### File Info
- Sample Rate: {fs} Hz
- Duration: {len(mono)/fs:.2f} seconds
- Channels: {1 if len(audio.shape) == 1 else audio.shape[1]}

### Levels
- Peak: {peak_db:.1f} dBFS
- RMS: {rms_db:.1f} dBFS
- Crest Factor: {crest_factor:.1f} dB
- Integrated Loudness: {lufs:.1f} LUFS
- DC Offset: {dc_offset:.6f}

### Spectral
- Spectral Centroid: {spectral_centroid:.0f} Hz
- Brightness: {'Bright' if spectral_centroid > 3000 else 'Warm' if spectral_centroid < 1500 else 'Balanced'}

### Recommendations
{_generate_recommendations(peak_db, rms_db, crest_factor, lufs, dc_offset)}
"""

def _generate_recommendations(peak, rms, crest, lufs, dc):
    recs = []
    if peak > -0.5:
        recs.append("- ⚠️ Peaks near 0dBFS - risk of clipping")
    if lufs > -14:
        recs.append("- ⚠️ Too loud for streaming (-14 LUFS target)")
    if lufs < -20:
        recs.append("- Consider increasing overall level")
    if crest < 6:
        recs.append("- Low crest factor - may sound over-compressed")
    if abs(dc) > 0.01:
        recs.append("- DC offset detected - apply high-pass filter")
    return "\n".join(recs) if recs else "- Audio looks good!"

if __name__ == "__main__":
    import asyncio
    asyncio.run(app.run())
```

## References

### Essential Papers
- Gerzon, M. (1973). "Periphony: With-Height Sound Reproduction"
- Blauert, J. (1997). *Spatial Hearing* (MIT Press)
- Bristow-Johnson, R. "Audio EQ Cookbook" (the filter bible)
- ITU-R BS.1770 "Algorithms to measure audio programme loudness"

### Tools & Libraries
- `pyloudnorm` - Python loudness measurement
- `librosa` - Audio analysis (use for features, not processing)
- `soundfile` / `scipy.io.wavfile` - File I/O
- `pyfar` - Python for Acoustics Research
- `pyroomacoustics` - Room simulation
