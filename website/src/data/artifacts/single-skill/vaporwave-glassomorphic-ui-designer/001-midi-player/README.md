# 🎵 Vaporwave MIDI Player Artifact

A complete preserved implementation of the Winamp-style vaporwave music player built for the Claude Skills website.

---

## 📸 The Player in Action

![Winamp Player - LARVA Track](/img/artifacts/winamp-player/winamp-full-player-larva.png)

*The full player interface showing the MIDImorphosis album with LARVA track selected. Note the Windows 3.1 beveled borders, CRT glow effects, and the 24-bar visualizer.*

---

## 🎨 AI-Generated Album Art Gallery

Every album cover was generated using Ideogram AI with vaporwave aesthetic prompts. Each captures a different facet of the genre:

### The Complete Collection

<table>
<tr>
<td align="center" width="25%">
<img src="/img/artifacts/winamp-player/blank-banshee-midimorphosis.png" width="200" alt="MIDImorphosis"/>
<br/><strong>MIDImorphosis</strong>
<br/><em>Blank Banshee</em>
<br/>Pixelated butterfly, vaporwave grid
</td>
<td align="center" width="25%">
<img src="/img/artifacts/winamp-player/neon-dreams.png" width="200" alt="Digital Paradise"/>
<br/><strong>Digital Paradise</strong>
<br/><em>Cyber Lotus</em>
<br/>Dolphin, lotus flowers, sunset
</td>
<td align="center" width="25%">
<img src="/img/artifacts/winamp-player/outrun-nights.png" width="200" alt="Neon Highway"/>
<br/><strong>Neon Highway</strong>
<br/><em>Outrun Nights</em>
<br/>DeLorean, palm trees, sunset grid
</td>
<td align="center" width="25%">
<img src="/img/artifacts/winamp-player/dark-ritual.png" width="200" alt="King Night"/>
<br/><strong>King Night</strong>
<br/><em>Salem</em>
<br/>Hooded figure, candles, occult
</td>
</tr>
<tr>
<td align="center" width="25%">
<img src="/img/artifacts/winamp-player/vapor-trap.png" width="200" alt="With Love"/>
<br/><strong>With Love</strong>
<br/><em>Luxury Elite</em>
<br/>Champagne, penthouse, sunset
</td>
<td align="center" width="25%">
<img src="/img/artifacts/winamp-player/chip-dreams.png" width="200" alt="Fasttracker Forever"/>
<br/><strong>Fasttracker Forever</strong>
<br/><em>Chip Dreams</em>
<br/>Pixel art, retro computer
</td>
<td align="center" width="25%">
<img src="/img/artifacts/winamp-player/mall-soft.png" width="200" alt="Virtua.zip"/>
<br/><strong>Virtua.zip</strong>
<br/><em>Esprit 空虚</em>
<br/>Pink mall corridor, liminal
</td>
<td align="center" width="25%">
<img src="/img/artifacts/winamp-player/blank-banshee-flow.png" width="200" alt="MEGA"/>
<br/><strong>MEGA</strong>
<br/><em>Digital</em>
<br/>Mall escalators, statues
</td>
</tr>
</table>

### Art Style Breakdown

| Cover | Genre Influence | Key Elements |
|-------|-----------------|--------------|
| **MIDImorphosis** | Future Funk | 8-bit butterfly, neon grid, Japanese text |
| **Digital Paradise** | Chillwave | Dolphins, lotus flowers, pastel sunset |
| **Neon Highway** | Synthwave/Outrun | Sports car, palm trees, sunset gradient |
| **King Night** | Witch House | Occult imagery, purple haze, candles |
| **With Love** | Late Night Lo-Fi | Luxury aesthetic, champagne, skyline |
| **Fasttracker Forever** | Chiptune | Pixel art, floppy disks, green CRT |
| **Virtua.zip** | Mallsoft | Empty mall, pink tiles, plants |
| **MEGA** | Classic Vaporwave | Mall escalators, Greek statues |

---

## What's Preserved Here

This artifact captures the initial working implementation of the vaporwave music player created by the `vaporwave-glassomorphic-ui-designer` skill. This is the **vaporwave skill's work only** - it does not include later enhancements from the sound-engineer skill.

## Contents

### Code (`code/`)
- **Components**: WinampModal, MinifiedMusicPlayer, SkinPicker
- **Context**: MusicPlayerContext.tsx (audio playback logic)
- **Data**: musicMetadata.ts (22 track definitions)
- **Hooks**: useWinampSkin.ts (theme management)

### Assets (`assets/`)
- **MIDI Files** (15): Original Blank Banshee "MIDImorphosis" album tracks
- **Album Covers** (24): AI-generated vaporwave cover art in multiple variations

### Documentation (`docs/`)
- **MUSIC_PLAYER_README.md**: Complete player documentation
- **MUSIC_PLAYER_CHANGELOG.md**: Implementation history and feature breakdown
- **ROADMAP.md**: Future enhancement plans
- **SOUND_ENGINEER_RECOMMENDATIONS.md**: Professional audio proposals (not yet implemented)

## Key Features

✅ **22 MIDI Tracks** - 15 real Blank Banshee + 7 AI-generated
✅ **8 Album Covers** - Vaporwave aesthetic with pink/purple sunsets
✅ **4 Theme Skins** - Classic, Dolphin, Sailor Moon, Vintage
✅ **24-Bar Visualizer** - Animated frequency display
✅ **Winamp UI** - Title bar, display, controls, visualizer layout
✅ **Persistent Preferences** - LocalStorage for skin selection
✅ **Navbar Widget** - Minified player in site navigation

## Design Philosophy

This player embodies the **vaporwave aesthetic**:
- 🌅 Pink/purple sunset gradients
- 📺 CRT monitor glow effects
- 🖥️ Windows 3.1 beveled borders
- 💾 Retro computing nostalgia
- ✨ Glassomorphic transparency

## Technical Highlights

- **React + TypeScript** - Type-safe component architecture
- **Context API** - Global audio state management
- **CSS Variables** - Theme switching system
- **LocalStorage** - User preference persistence
- **Conditional Rendering** - Dynamic UI based on playback state

## What's NOT Included

This artifact preserves the **initial vaporwave implementation only**. The following sound-engineer enhancements are NOT included:
- ❌ Real-time FFT visualizer
- ❌ Vaporwave effects chain (reverb, chorus, lo-fi)
- ❌ Better synthesis (vaporwave synth patches)
- ❌ Spatial audio & stereo enhancement
- ❌ Adaptive music system

These enhancements are documented in `docs/SOUND_ENGINEER_RECOMMENDATIONS.md` but were not implemented in this version.

## How to Use This Artifact

1. **Browse the code** in `code/` to understand component architecture
2. **Check the assets** in `assets/` to see MIDI files and album covers
3. **Read the docs** in `docs/` for full implementation details
4. **Reference artifact.json** for metadata and metrics

## Metrics

- **Component Files**: 6
- **MIDI Tracks**: 22
- **Album Covers**: 8 (24 variations)
- **Theme Skins**: 4
- **Visualizer Bars**: 24
- **Planning Docs**: 4

## Related Skills

- [vaporwave-glassomorphic-ui-designer](/docs/skills/vaporwave_glassomorphic_ui_designer) - Creator of this artifact

## Timeline

**Created**: November 24-25, 2024
**Status**: Initial implementation complete, sound enhancements pending

---

*This artifact is preserved following the skill-documentarian pattern for artifact preservation.*
