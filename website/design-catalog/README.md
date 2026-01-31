# Design System Catalog

A comprehensive, curated collection of modern design trends, color palettes, typography systems, and UI components with full accessibility specifications.

## Overview

This catalog provides Session 4 (Design System Generator) with the data needed to generate custom design systems. All entries include:

- **WCAG 2.1 compliance ratings** (AA/AAA levels)
- **Accessibility specifications** (ARIA, keyboard, focus states)
- **CSS variables and code snippets**
- **Real-world usage examples**

## Contents

| File | Description | Count |
|------|-------------|-------|
| `design-catalog.json` | Main index with metadata | - |
| `color-palettes.json` | Color palettes with WCAG ratings | 16 |
| `typography-systems.json` | Typography scales with readability scores | 12 |
| `components/index.json` | UI components with accessibility specs | 22 |

## Design Trends Covered

1. **Neobrutalism** (2022-2025) - Bold colors, thick borders, raw aesthetic
2. **Swiss Modern Revival** (2023-2025) - Grid systems, clean typography
3. **Glassmorphism** (2020-2024) - Frosted glass, transparency, blur
4. **Digital Maximalism** (2024-2025) - Layered, expressive, multimedia
5. **Hyperminimalism** (2023-2025) - Extreme reduction, whitespace
6. **Cyberpunk/Neon** (2019-2025) - Neon colors, dark backgrounds
7. **Cottagecore/Organic** (2020-2025) - Natural, soft, handcrafted
8. **Brutalist Minimal** (2024-2025) - Raw structure, monospace

## Usage

### In TypeScript/React

```typescript
import catalog from './design-catalog/design-catalog.json';
import palettes from './design-catalog/color-palettes.json';
import typography from './design-catalog/typography-systems.json';
import components from './design-catalog/components/index.json';

// Get a specific palette
const neoPalette = palettes.palettes.find(p => p.id === 'neobrutalism-primary');

// Get typography system
const swissTypo = typography.systems.find(s => s.id === 'swiss-modern');

// Get component by category
const buttons = components.components.filter(c => c.category === 'buttons');
```

### With Types

```typescript
import type {
  ColorPalette,
  TypographySystem,
  Component
} from '@site/src/types/design-catalog';

const palette: ColorPalette = palettes.palettes[0];
```

## Color Palettes

Each palette includes:

```json
{
  "id": "neobrutalism-primary",
  "name": "Neo Primary",
  "trend": "neobrutalism",
  "colors": [
    {
      "name": "Electric Yellow",
      "hex": "#FFDE00",
      "rgb": { "r": 255, "g": 222, "b": 0 },
      "hsl": { "h": 52, "s": 100, "l": 50 },
      "usage": ["backgrounds", "highlights"]
    }
  ],
  "wcag": {
    "combinations": [
      {
        "foreground": "Stark Black",
        "background": "Electric Yellow",
        "ratio": 19.56,
        "aa": { "normalText": true, "largeText": true },
        "aaa": { "normalText": true, "largeText": true }
      }
    ]
  }
}
```

## Typography Systems

Each system includes:

```json
{
  "id": "swiss-modern",
  "name": "Swiss Modern",
  "baseFontSize": 16,
  "scaleRatio": 1.25,
  "fonts": {
    "display": { "family": "Inter", "weight": 700 },
    "heading": { "family": "Inter", "weight": 600 },
    "body": { "family": "Inter", "weight": 400 }
  },
  "typeScale": {
    "xs": { "size": "0.64rem", "computed": "10.24px" },
    "sm": { "size": "0.8rem", "computed": "12.8px" },
    "base": { "size": "1rem", "computed": "16px" },
    "lg": { "size": "1.25rem", "computed": "20px" }
  },
  "readabilityScore": 92
}
```

## Components

Each component includes:

```json
{
  "id": "primary-button-neobrutalism",
  "name": "Primary Button",
  "category": "buttons",
  "trend": "neobrutalism",
  "accessibility": {
    "role": "button",
    "ariaRequired": ["aria-label (if icon-only)"],
    "keyboardSupport": ["Enter", "Space"],
    "focusIndicator": "4px black outline, 2px offset",
    "minTouchTarget": "44px x 44px"
  },
  "css": "/* Full CSS implementation */"
}
```

## Accessibility Standards

All content meets WCAG 2.1 Level AA:

| Requirement | Standard | Verified |
|-------------|----------|----------|
| Normal text contrast | 4.5:1 | ✅ |
| Large text contrast | 3.0:1 | ✅ |
| UI component contrast | 3.0:1 | ✅ |
| Focus indicators | Visible | ✅ |
| Touch targets | ≥44px | ✅ |
| Keyboard navigation | Full | ✅ |

## Validation

Run the validation script to verify catalog integrity:

```bash
npx tsx scripts/validate-catalog.ts
```

This checks:
- JSON schema validity
- Required fields presence
- WCAG contrast calculations
- Cross-references between files
- Component accessibility specs

## Contributing

When adding new entries:

1. Follow the existing JSON structure
2. Calculate WCAG contrast ratios
3. Include all accessibility specifications
4. Run validation before committing
5. Update statistics in `design-catalog.json`

## License

MIT - See repository root for details.

---

*Generated for Session 4: Design System Generator dependency*
*Last updated: 2026-01-29*
