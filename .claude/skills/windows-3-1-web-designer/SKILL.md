# Windows 3.1 Web Designer

Expert in authentic Windows 3.1 aesthetic for modern web applications. Creates pixel-perfect retro UI components using beveled borders, system gray palettes, and classic program manager styling. Specializes in translating 1990s desktop metaphors into responsive web experiences while maintaining nostalgic authenticity.

**Keywords**: windows 3.1, retro ui, beveled borders, win31, program manager, file manager, 90s aesthetic, pixel art, system gray, 3d buttons, titlebar, inset panels, outset buttons, hotdog stand

**NOT for**: Vaporwave aesthetics (neon gradients, glowing text, cyan-magenta schemes), modern glassmorphism, macOS/iOS styling, flat design, material design, or skeuomorphic iOS textures.

---

## When to Use This Skill

Use this skill when:
- Building retro-themed web applications with Windows 3.1 authenticity
- Converting vaporwave or modern UI to classic Win31 styling
- Creating nostalgic landing pages, documentation sites, or portfolios
- Designing game interfaces with 90s desktop aesthetic
- Building pixel-art adjacent web experiences

---

## Core Design System

### Color Palette

```css
:root {
  /* Primary System Colors */
  --win31-white: #ffffff;
  --win31-black: #000000;
  --win31-gray: #c0c0c0;           /* THE system gray - most important */
  --win31-dark-gray: #808080;      /* Shadow/pressed states */
  --win31-light-gray: #dfdfdf;     /* Highlights */

  /* Window Chrome */
  --win31-navy: #000080;           /* Title bar background */
  --win31-title-text: #ffffff;     /* Title bar text */

  /* Accent Colors (use sparingly) */
  --win31-teal: #008080;           /* Links, highlights */
  --win31-yellow: #ffff00;         /* Warnings, featured items */
  --win31-lime: #00ff00;           /* Success states */
  --win31-magenta: #ff00ff;        /* Rare accent only */
  --win31-red: #ff0000;            /* Errors, close buttons */
  --win31-blue: #0000ff;           /* Selected text background */
}
```

### The Sacred Rule of Beveled Borders

Windows 3.1's entire visual language rests on the illusion of depth created by beveled borders. This is the single most important pattern to master:

**OUTSET (Raised) Elements** - Buttons, toolbars, status bars:
```css
.win31-outset {
  border-style: solid;
  border-width: 2px;
  border-top-color: var(--win31-white);
  border-left-color: var(--win31-white);
  border-bottom-color: var(--win31-black);
  border-right-color: var(--win31-black);
  box-shadow:
    inset 1px 1px 0 var(--win31-light-gray),
    inset -1px -1px 0 var(--win31-dark-gray);
}
```

**INSET (Sunken) Elements** - Text fields, list boxes, content areas:
```css
.win31-inset {
  border-style: solid;
  border-width: 2px;
  border-top-color: var(--win31-dark-gray);
  border-left-color: var(--win31-dark-gray);
  border-bottom-color: var(--win31-white);
  border-right-color: var(--win31-white);
  box-shadow:
    inset 1px 1px 0 var(--win31-black),
    inset -1px -1px 0 var(--win31-light-gray);
}
```

**PRESSED State** - Active buttons:
```css
.win31-pressed {
  border-top-color: var(--win31-black);
  border-left-color: var(--win31-black);
  border-bottom-color: var(--win31-white);
  border-right-color: var(--win31-white);
  box-shadow: inset 1px 1px 0 var(--win31-dark-gray);
}
```

### Typography

```css
:root {
  /* Primary UI Font - pixel-style */
  --font-pixel: 'VT323', 'Courier New', monospace;

  /* Headings - chunky pixel font */
  --font-pixel-heading: 'Press Start 2P', 'VT323', monospace;

  /* Code/Terminal */
  --font-code: 'IBM Plex Mono', 'Courier Prime', 'Courier New', monospace;

  /* System UI (fallback) */
  --font-system: 'MS Sans Serif', 'Arial', sans-serif;
}

/* Sizing Guidelines */
.win31-text-tiny { font-size: 8px; letter-spacing: 1px; }
.win31-text-small { font-size: 10px; letter-spacing: 1px; }
.win31-text-body { font-size: 12px; letter-spacing: 0.5px; }
.win31-text-large { font-size: 14px; }
.win31-text-title { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; }
```

---

## Component Patterns

### Window Chrome

The classic Win31 window structure:

```jsx
<div className="win31-window">
  {/* Title Bar */}
  <div className="win31-titlebar">
    <div className="win31-titlebar__left">
      <div className="win31-btn-3d win31-btn-3d--small">─</div>
    </div>
    <span className="win31-title-text">PROGRAM.EXE</span>
    <div className="win31-titlebar__right">
      <div className="win31-btn-3d win31-btn-3d--small">▲</div>
      <div className="win31-btn-3d win31-btn-3d--small">▼</div>
    </div>
  </div>

  {/* Content Area */}
  <div className="win31-content">
    {/* Your content here */}
  </div>

  {/* Optional Status Bar */}
  <div className="win31-statusbar">
    <div className="win31-statusbar-panel">Ready</div>
  </div>
</div>
```

```css
.win31-window {
  background: var(--win31-gray);
  border: 3px solid var(--win31-black);
  box-shadow:
    inset 2px 2px 0 var(--win31-white),
    inset -2px -2px 0 var(--win31-dark-gray);
}

.win31-titlebar {
  background: var(--win31-navy);
  color: var(--win31-white);
  padding: 4px 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-pixel);
  font-size: 12px;
  font-weight: bold;
}

.win31-content {
  padding: 12px;
  background: var(--win31-gray);
}

.win31-statusbar {
  display: flex;
  gap: 2px;
  padding: 2px;
  background: var(--win31-gray);
  border-top: 2px solid var(--win31-dark-gray);
}

.win31-statusbar-panel {
  flex: 1;
  padding: 2px 8px;
  font-family: var(--font-pixel);
  font-size: 11px;
  border: 1px solid;
  border-color: var(--win31-dark-gray) var(--win31-white) var(--win31-white) var(--win31-dark-gray);
}
```

### 3D Push Buttons

```css
.win31-btn-3d {
  background: var(--win31-gray);
  border: none;
  padding: 8px 16px;
  font-family: var(--font-pixel);
  font-size: 12px;
  cursor: pointer;

  /* The magic bevel */
  box-shadow:
    inset -2px -2px 0 var(--win31-dark-gray),
    inset 2px 2px 0 var(--win31-white),
    inset -3px -3px 0 var(--win31-black),
    inset 3px 3px 0 var(--win31-light-gray);
}

.win31-btn-3d:hover {
  background: var(--win31-light-gray);
}

.win31-btn-3d:active,
.win31-btn-3d--pressed {
  box-shadow:
    inset 2px 2px 0 var(--win31-dark-gray),
    inset -2px -2px 0 var(--win31-white),
    inset 3px 3px 0 var(--win31-black),
    inset -3px -3px 0 var(--win31-light-gray);
  padding: 9px 15px 7px 17px; /* Shift content down-right */
}

/* Default button (highlighted action) */
.win31-btn-3d--default {
  border: 2px solid var(--win31-black);
}

/* Small variant for titlebar buttons */
.win31-btn-3d--small {
  padding: 2px 6px;
  font-size: 10px;
  min-width: 20px;
}
```

### Form Controls

**Text Input:**
```css
.win31-input {
  background: var(--win31-white);
  border: 2px solid;
  border-color: var(--win31-dark-gray) var(--win31-white) var(--win31-white) var(--win31-dark-gray);
  box-shadow: inset 1px 1px 0 var(--win31-black);
  padding: 4px 8px;
  font-family: var(--font-code);
  font-size: 12px;
}

.win31-input:focus {
  outline: none;
  border-color: var(--win31-navy);
}
```

**Checkbox:**
```css
.win31-checkbox {
  appearance: none;
  width: 13px;
  height: 13px;
  background: var(--win31-white);
  border: 2px solid;
  border-color: var(--win31-dark-gray) var(--win31-white) var(--win31-white) var(--win31-dark-gray);
  box-shadow: inset 1px 1px 0 var(--win31-black);
}

.win31-checkbox:checked::after {
  content: '✓';
  display: block;
  font-size: 11px;
  font-weight: bold;
  text-align: center;
  line-height: 11px;
}
```

### Panels and Groups

```css
/* Raised panel (toolbar, button group) */
.win31-panel-raised {
  background: var(--win31-gray);
  border: 2px solid;
  border-color: var(--win31-white) var(--win31-black) var(--win31-black) var(--win31-white);
  padding: 8px;
}

/* Sunken panel (content area, list) */
.win31-panel-inset {
  background: var(--win31-white);
  border: 2px solid;
  border-color: var(--win31-dark-gray) var(--win31-white) var(--win31-white) var(--win31-dark-gray);
  box-shadow: inset 1px 1px 0 var(--win31-black);
  padding: 8px;
}

/* Group box (labeled section) */
.win31-groupbox {
  border: 2px solid var(--win31-dark-gray);
  padding: 16px 12px 12px;
  margin-top: 8px;
  position: relative;
}

.win31-groupbox__label {
  position: absolute;
  top: -8px;
  left: 12px;
  background: var(--win31-gray);
  padding: 0 6px;
  font-family: var(--font-pixel);
  font-size: 11px;
}
```

---

## Anti-Patterns: Windows 3.1 vs Vaporwave

### What Makes Something Look VAPORWAVE (Avoid These):

| Vaporwave Element | Win31 Alternative |
|-------------------|-------------------|
| `linear-gradient(135deg, #1a1a2e, #16213e)` | `background: var(--win31-gray)` |
| `text-shadow: 0 0 10px rgba(0,255,255,0.5)` | No text shadow, or `1px 1px 0 var(--win31-dark-gray)` |
| `background: linear-gradient(#00d4ff, #ff00ff)` | Solid `var(--win31-teal)` or `var(--win31-navy)` |
| `border: 2px solid #00d4ff` | Beveled border pattern |
| Dark backgrounds (#1a1a2e) | System gray (#c0c0c0) |
| Neon cyan (#00d4ff) | Win31 teal (#008080) |
| Glowing/pulsing animations | Static or simple transitions |
| Glassmorphism blur | Solid opaque panels |
| Rounded corners (border-radius) | Sharp 90° corners |
| Drop shadows (box-shadow blur) | Hard-edge bevel shadows |

### The Quick Test

If your component has:
- ❌ Any blur effects → NOT Win31
- ❌ Any gradient backgrounds → NOT Win31
- ❌ Any neon colors (#00d4ff, #ff00ff bright) → NOT Win31
- ❌ Any rounded corners → NOT Win31
- ❌ Any glowing text/borders → NOT Win31
- ❌ Dark/black backgrounds → NOT Win31 (except inset content areas)

It should have:
- ✅ System gray (#c0c0c0) base
- ✅ Beveled borders (white top-left, black bottom-right)
- ✅ Sharp corners everywhere
- ✅ Pixel fonts (VT323, Press Start 2P)
- ✅ Navy blue title bars
- ✅ Hard-edge box shadows only

---

## Decision Tree: Designing a Win31 Component

```
START: What are you building?
│
├─► Window/Dialog
│   ├─► Has title bar? → Navy background, white text, system buttons
│   ├─► Has menu bar? → Gray, beveled, 2px borders
│   ├─► Content area? → Gray background or white inset
│   └─► Status bar? → Gray panels with inset borders
│
├─► Button
│   ├─► Primary action? → .win31-btn-3d--default (extra black border)
│   ├─► Secondary? → .win31-btn-3d (standard)
│   ├─► Titlebar button? → .win31-btn-3d--small
│   └─► Toggle/checked? → Use pressed state permanently
│
├─► Form Control
│   ├─► Text input? → White background, inset border
│   ├─► Dropdown? → White background, inset, with button
│   ├─► Checkbox? → 13x13px, inset, checkmark on select
│   └─► Radio? → Same as checkbox but circular appearance
│
├─► Panel/Section
│   ├─► Contains controls? → Raised panel (outset)
│   ├─► Contains content? → Inset panel
│   └─► Labeled section? → Groupbox with label
│
└─► Decorative Element
    ├─► Badge/tag? → Gray background, outset, small text
    ├─► Sticker? → Yellow background, black border, rotated
    └─► Icon? → 16x16 or 32x32, pixel art style
```

---

## Responsive Considerations

Windows 3.1 was designed for 640x480. When adapting for modern screens:

```css
/* Mobile: Stack windows vertically */
@media (max-width: 768px) {
  .win31-window {
    width: 100%;
    margin-bottom: 16px;
  }

  /* Reduce padding */
  .win31-content {
    padding: 8px;
  }

  /* Smaller title text */
  .win31-titlebar {
    font-size: 10px;
  }
}

/* Desktop: Allow side-by-side */
@media (min-width: 769px) {
  .win31-window-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
  }
}
```

---

## Example: Converting Vaporwave to Win31

### Before (Vaporwave):
```jsx
<div style={{
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  border: '3px solid #00d4ff',
  boxShadow: '0 0 20px rgba(0,255,255,0.3)',
}}>
  <div style={{
    color: '#00d4ff',
    textShadow: '0 0 10px rgba(0,255,255,0.5)',
    fontSize: '16px',
  }}>
    ⚡ Get This Skill
  </div>
  <button style={{
    background: 'linear-gradient(135deg, #00d4ff 0%, #ff00ff 100%)',
    border: '2px outset #00d4ff',
    color: '#000',
  }}>
    Download
  </button>
</div>
```

### After (Win31):
```jsx
<div className="win31-window">
  <div className="win31-titlebar">
    <span className="win31-title-text">GET SKILL</span>
  </div>
  <div className="win31-content">
    <button className="win31-btn-3d win31-btn-3d--default">
      📦 Download Skill Folder
    </button>
  </div>
</div>
```

---

## File Naming Conventions

When creating Win31-themed assets:
- All caps filenames: `README.TXT`, `INSTALL.EXE`, `SKILL.DLL`
- 8.3 format for authenticity: `PROGRAM.EXE`, `CONFIG.SYS`
- Use period sparingly: prefer `SKILLSDAT` over `SKILLS.DAT`

---

## Hotdog Stand Mode

The infamous high-contrast color scheme. Use only for easter eggs or accessibility options:

```css
.hotdog-stand {
  --win31-gray: #ff0000;
  --win31-dark-gray: #800000;
  --win31-light-gray: #ff8080;
  --win31-navy: #ffff00;
  --win31-title-text: #ff0000;
}
```

---

## Quick Reference Card

| Element | Background | Border Pattern | Shadow |
|---------|------------|----------------|--------|
| Window | #c0c0c0 | 3px solid black | inset white/dark-gray |
| Titlebar | #000080 | none | none |
| Button (up) | #c0c0c0 | none | inset white TL, black BR |
| Button (down) | #c0c0c0 | none | inset black TL, white BR |
| Input | #ffffff | inset 2px | inset 1px black |
| Panel (raised) | #c0c0c0 | outset 2px | none |
| Panel (inset) | #ffffff | inset 2px | inset 1px black |
| Statusbar | #c0c0c0 | inset 1px per panel | none |

---

## Resources

- **Color Reference**: Windows 3.1 default VGA palette
- **Font**: VT323 (Google Fonts), Press Start 2P (Google Fonts)
- **Inspiration**: Program Manager, File Manager, Notepad, Paintbrush
- **Testing**: Ensure components work without JavaScript (progressive enhancement)
