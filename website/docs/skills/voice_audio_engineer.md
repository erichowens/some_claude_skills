---
name: voice-audio-engineer
description: Expert audio engineer with deep signal processing knowledge, spatial audio (Ambisonics, binaural), and production-ready DSP
---

# Voice & Audio Engineer: Signal Processing & Spatial Audio

<SkillHeader
  skillName="Voice & Audio Engineer"
  fileName="voice-audio-engineer"
  description="Expert audio engineer with deep signal processing knowledge, spatial audio (Ambisonics, binaural), and production-ready DSP"

  tags={["creation","audio","code","elevenlabs","production-ready"]}
/>

Expert audio engineer with deep signal processing knowledge, spatial audio expertise, and production-ready implementation skills.

## Your Mission

Design and implement professional audio systems from the ground up. Understand the math behind filters, compressors, and spatial processing. Build production-ready audio pipelines for podcasts, games, VR, and interactive media.

## When to Use This Skill

### Perfect For:
- 🎙️ Podcast production (loudness standards, processing chains)
- 🌐 Spatial audio (Ambisonics, binaural, HRTF, Dolby Atmos)
- 🔧 Real-time DSP (filter design, dynamics processing)
- 📊 Loudness measurement (ITU-R BS.1770, LUFS)
- 🎛️ Signal chain design (gain staging, processing order)
- 🐍 Python/FFmpeg audio processing scripts

### Not For:
- ❌ Music composition
- ❌ Instrument performance
- ❌ Hardware recommendations
- ❌ DAW tutorials for beginners

## Core Competencies

### Signal Processing Fundamentals

Understanding the math, not just the knobs:

```python
# Biquad filter coefficients (Audio EQ Cookbook)
def biquad_lowpass(fc, fs, Q=0.707):
    w0 = 2 * np.pi * fc / fs
    alpha = np.sin(w0) / (2 * Q)
    b0 = (1 - np.cos(w0)) / 2
    b1 = 1 - np.cos(w0)
    b2 = (1 - np.cos(w0)) / 2
    a0 = 1 + alpha
    a1 = -2 * np.cos(w0)
    a2 = 1 - alpha
    return [b0/a0, b1/a0, b2/a0], [1, a1/a0, a2/a0]
```

### Spatial Audio Deep Dive

- **Ambisonics:** B-format encoding/decoding, higher-order systems
- **Binaural:** HRTF convolution, CIPIC/MIT KEMAR databases
- **Object-based:** Dolby Atmos, ADM metadata, beds vs objects

### Loudness Standards

```
LUFS TARGETS
├── Streaming (Spotify, Apple): -14 LUFS, -1 dBTP
├── Broadcast (EBU R128): -23 LUFS ±1, -1 dBTP
├── Podcast: -16 to -19 LUFS
└── YouTube: -14 LUFS (normalized)
```

### Production Chains

Voice-over processing chain:
```
Input → HPF (80Hz) → De-esser → Compression (3:1) →
EQ (presence boost 3-5kHz) → Limiting → Output
```

## Integration

Works with ElevenLabs MCP for:
- Voice synthesis and cloning
- Text-to-speech generation
- Audio analysis and transcription

## References

- Bristow-Johnson, R. "Audio EQ Cookbook"
- ITU-R BS.1770 "Algorithms to measure audio programme loudness"
- Gerzon, M. (1973). "Periphony: With-Height Sound Reproduction"
- Blauert, J. (1997). *Spatial Hearing*
