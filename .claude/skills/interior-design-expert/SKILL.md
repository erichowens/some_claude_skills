---
name: interior-design-expert
description: Expert interior designer with deep knowledge of space planning, color theory (Munsell, NCS), lighting design (IES standards), furniture proportions, and AI-assisted visualization. Use for room layout optimization, lighting calculations, color palette selection for interiors, furniture placement, style consultation. Activate on "interior design", "room layout", "lighting design", "furniture placement", "space planning", "Munsell color". NOT for exterior/landscape design, architectural structure, web/UI design (use web-design-expert), brand color theory (use color-theory-palette-harmony-expert), or building codes/permits.
allowed-tools: Read,Write,Edit,mcp__stability-ai__stability-ai-generate-image,mcp__ideogram__generate_image
---

# Interior Design Expert

Expert interior designer combining classical training with computational design tools and AI-assisted visualization.

## When to Use This Skill

✅ **Use for:**
- Room layout optimization and furniture placement
- Lighting design calculations (IES standards)
- Color palette selection using Munsell/NCS systems
- Space planning with anthropometric considerations
- Style consultation (Mid-Century, Scandinavian, Japandi, etc.)
- AI-assisted room visualization with Stability AI/Ideogram
- Furniture proportion and scale analysis
- Circulation path planning

❌ **Do NOT use for:**
- Exterior/landscape design → different domain
- Architectural structural changes → requires licensed architect
- Web/UI color design → use **web-design-expert**
- Brand/marketing color theory → use **color-theory-palette-harmony-expert**
- Building codes/permits → consult local regulations
- Kitchen/bath detailed cabinetry → specialized trades
- 3D modeling implementation → use SketchUp directly

## MCP Integrations

### Available MCPs

| MCP | Purpose |
|-----|---------|
| **Stability AI** | Generate photorealistic room renders |
| **Ideogram** | Create room visualizations with text control |
| **SketchUp MCP** (if configured) | Direct 3D modeling control |

### Room Visualization Workflow
```
1. Establish room parameters (dimensions, style, colors)
2. Use mcp__stability-ai__stability-ai-generate-image for renders
3. Or use mcp__ideogram__generate_image for concept exploration
4. Iterate based on feedback
```

## Common Anti-Patterns

### Anti-Pattern: Ignoring Traffic Flow
**What it looks like**: Furniture blocking natural pathways, awkward circulation
**Why it's wrong**: Rooms feel cramped, daily use becomes frustrating
**What to do instead**: Map circulation paths first, then place furniture. Primary paths: 900-1200mm. Secondary: 600-900mm.

### Anti-Pattern: Single Light Source
**What it looks like**: One overhead light illuminating entire room
**Why it's wrong**: Creates harsh shadows, unflattering light, no ambiance
**What to do instead**: Layer lighting: ambient + task + accent. See Lighting Layer Design below.

### Anti-Pattern: Scale Mismatch
**What it looks like**: Oversized sectional in small room, tiny rug under large furniture
**Why it's wrong**: Proportions feel "off," space reads awkwardly
**What to do instead**: Measure room, calculate proportions. Rugs should extend under front legs of furniture at minimum.

### Anti-Pattern: Paint Color from Memory
**What it looks like**: Selecting paint without testing in actual lighting conditions
**Why it's wrong**: Metamerism - colors shift dramatically under different light sources
**What to do instead**: Always test paint samples in YOUR lighting, at different times of day.

For detailed technical references, see:
- `/references/color-science.md` - Munsell system, color harmony calculations
- `/references/lighting-design.md` - IES standards, layer design, CCT programming
- `/references/space-planning.md` - Anthropometrics, circulation, proportions
- `/references/style-guide.md` - Style DNA breakdowns

## Color Science (Not Just Wheels)

### Munsell Color System

```
MUNSELL NOTATION: Hue Value/Chroma
                  5R 5/14 = Red at middle value, high chroma

HUE (10 major hues, 100 steps total)
├── R (Red) → YR → Y (Yellow) → GY → G (Green)
└── → BG → B (Blue) → PB → P (Purple) → RP → R

VALUE (lightness, 0-10)
├── 0 = Pure black
├── 5 = Middle gray
└── 10 = Pure white

CHROMA (saturation, 0-max varies by hue)
├── 0 = Neutral gray
├── Low = Muted, sophisticated
├── High = Vivid, intense
└── Max varies: Blue max ~12, Red max ~14

WHY MUNSELL FOR INTERIORS:
├── Perceptually uniform (steps look equal)
├── Paint companies use it (Benjamin Moore, Sherwin-Williams)
├── Precise specification (no "kind of blue")
└── Predicts how colors will interact
```

### Color Harmony Systems

```python
class ColorHarmony:
    """
    Calculate color harmonies using perceptually uniform space.
    """

    @staticmethod
    def complementary(munsell_hue: str) -> str:
        """Direct opposite on Munsell hue circle."""
        hue_map = {
            'R': 'BG', 'YR': 'B', 'Y': 'PB',
            'GY': 'P', 'G': 'RP', 'BG': 'R',
            'B': 'YR', 'PB': 'Y', 'P': 'GY', 'RP': 'G'
        }
        return hue_map.get(munsell_hue, 'N')

    @staticmethod
    def split_complementary(munsell_hue: str) -> tuple[str, str]:
        """Two colors adjacent to the complement."""
        hue_order = ['R', 'YR', 'Y', 'GY', 'G', 'BG', 'B', 'PB', 'P', 'RP']
        idx = hue_order.index(munsell_hue)
        comp_idx = (idx + 5) % 10
        return (hue_order[(comp_idx - 1) % 10],
                hue_order[(comp_idx + 1) % 10])

    @staticmethod
    def value_contrast_ratio(v1: float, v2: float) -> float:
        """
        Calculate WCAG-style contrast for Munsell values.
        Values 0-10 mapped to luminance.
        """
        # Munsell value to relative luminance (approximate)
        def to_luminance(v):
            return (v / 10) ** 2.4  # Approximate gamma

        l1 = to_luminance(max(v1, v2))
        l2 = to_luminance(min(v1, v2))
        return (l1 + 0.05) / (l2 + 0.05)


# PRACTICAL APPLICATION
"""
LIVING ROOM PALETTE EXAMPLE

Base: 10YR 8/2 (Warm off-white walls)
    └── High value, low chroma = recedes, spacious

Accent 1: 5B 4/6 (Teal sofa)
    └── Complement to YR, lower value draws attention

Accent 2: 5Y 7/4 (Gold pillows)
    └── Analogous to base hue, medium chroma for warmth

Trim: N 9.5/ (Near white)
    └── Neutral, highest value for clean lines

Floor: 7.5YR 4/4 (Warm wood)
    └── Low value grounds the space
"""
```

### Light and Color Interaction

```
METAMERISM: Colors that match under one light source
            look different under another.

CRITICAL FOR INTERIORS:
├── Always test paint samples in YOUR lighting
├── Test at different times of day
├── North-facing rooms: Cooler light, colors shift blue
├── South-facing rooms: Warm light, colors appear warmer
├── LED CRI matters: >90 CRI for accurate color rendering

COLOR CONSTANCY FAILURE ZONES:
├── Near windows (daylight vs interior mix)
├── Under warm Edison bulbs (orange shift)
├── Near colored surfaces (reflected color)
└── High-chroma colors are most affected
```

## Lighting Design (IES Standards)

### Illuminance Requirements

```
IES RECOMMENDED LIGHT LEVELS (lux)

RESIDENTIAL
├── General living: 150-300 lux
├── Reading/detailed work: 300-500 lux
├── Kitchen counters: 300-750 lux
├── Bathroom vanity: 300-500 lux (vertical)
├── Bedroom general: 50-150 lux
├── Hallways: 50-100 lux
└── Dining (ambient): 100-200 lux

VERTICAL ILLUMINATION
├── Art on walls: 200-500 lux (often higher than ambient)
├── Bathroom mirrors: Match from front, not above
└── Video calls: 300+ lux on face, even distribution

UNIFORMITY RATIO
└── Max:Min ratio should be <3:1 for comfort
    (No dark holes or blinding spots)
```

### Lighting Layer Design

```
LAYER 1: AMBIENT (General)
├── Provides overall illumination
├── 60-70% of total light
├── Sources: Recessed, chandeliers, cove lighting
└── Calculation: Lumens = Area(m²) × Lux / CU × MF
    where CU = Coefficient of Utilization (~0.5-0.8)
    MF = Maintenance Factor (~0.8)

LAYER 2: TASK (Functional)
├── Supplements ambient for specific activities
├── Should be 2-3x brighter than ambient
├── Sources: Desk lamps, pendant over island, under-cabinet
└── Direction: Avoid shadows on work surface

LAYER 3: ACCENT (Decorative)
├── Creates visual interest and drama
├── 3-5x brighter than ambient on subject
├── Sources: Track, picture lights, uplights
└── Beam angles matter:
    ├── Narrow (10-15°): Art focus
    ├── Medium (25-40°): General accent
    └── Wide (50-60°): Wall wash

LAYER 4: NATURAL (Daylight)
├── Free, healthy, variable
├── Design for worst case (cloudy winter)
├── Control glare: Shades, diffusion
└── Daylight Factor = (Interior lux / Exterior lux) × 100
    Target: 2-5% minimum
```

### Color Temperature Programming

```python
def recommend_cct(room_type: str, time_of_day: str) -> int:
    """
    Recommend Correlated Color Temperature (Kelvin).

    Tunable white systems can shift throughout day.
    """

    base_recommendations = {
        'living_room': {'day': 4000, 'evening': 2700, 'night': 2200},
        'bedroom': {'day': 3500, 'evening': 2700, 'night': 2200},
        'kitchen': {'day': 4000, 'evening': 3000, 'night': 2700},
        'bathroom': {'day': 4000, 'evening': 3000, 'night': 2400},
        'office': {'day': 5000, 'evening': 4000, 'night': 3000},
        'dining': {'day': 3000, 'evening': 2700, 'night': 2400},
    }

    return base_recommendations.get(room_type, {}).get(time_of_day, 3000)

# CIRCADIAN CONSIDERATIONS
"""
Morning (6-9am): 5000-6500K - Alertness, cortisol
Midday (9am-5pm): 4000-5000K - Productivity
Evening (5-9pm): 2700-3000K - Relaxation transition
Night (9pm+): 2200-2700K - Melatonin production

Avoid blue light (<3000K) in:
├── Bedrooms after 8pm
├── Bathrooms used before sleep
└── Hallways at night
"""
```

## Space Planning Mathematics

### Anthropometric Standards

```
HUMAN DIMENSIONS (95th percentile male for clearances)

STANDING
├── Height: 1880mm (6'2")
├── Eye level: 1720mm (5'8")
├── Shoulder breadth: 490mm (19")
├── Reach (forward): 840mm (33")
└── Reach (overhead): 2105mm (6'11")

SITTING (desk chair)
├── Seat height: 430-530mm (17-21")
├── Eye level: 1180mm (46") from floor
├── Knee clearance: 640mm (25") minimum
└── Thigh clearance: 190mm (7.5")

WHEELCHAIR (ADA)
├── Width: 810mm (32") minimum clear
├── Turning: 1525mm (60") diameter
├── Reach (forward): 610mm (24") max
└── Reach (high): 1220mm (48") max
```

### Circulation Planning

```
MINIMUM PASSAGE WIDTHS

Primary circulation: 900-1200mm (36-48")
├── Main hallways
├── Living room paths
└── Kitchen work triangle paths

Secondary circulation: 600-900mm (24-36")
├── Between furniture
├── Bedroom around bed
└── Home office paths

Squeeze points: 450mm (18") minimum
├── Between wall and furniture
├── Tight bathroom clearances
└── Not for regular use

FURNITURE CLEARANCES
├── Sofa to coffee table: 450-500mm (18-20")
├── Dining chair push-back: 900mm (36")
├── Bed side clearance: 600mm (24") minimum
├── Desk chair area: 900×900mm (36×36")
└── Closet in front: 750mm (30") minimum
```

### Proportion Systems

```
CLASSICAL PROPORTIONS

GOLDEN RATIO (φ = 1.618...)
├── Room width : length
├── Furniture grouping proportions
├── Art placement on wall
└── Not magical, but often pleasing

ROOT RECTANGLES
├── √2 (1:1.414): A-series paper, many floor plans
├── √3 (1:1.732): Equilateral triangle derived
├── √5 (1:2.236): Contains golden ratio
└── Double square (1:2): Classic rug proportions

PRACTICAL APPLICATION
Room 4m × 6m = 1:1.5 ratio (between √2 and φ)

Furniture grouping:
├── Sofa: 2400mm
├── Coffee table: 1500mm (0.625 of sofa ≈ φ⁻¹)
└── Side tables: 600mm each (0.25 of sofa)
```

## AI-Assisted Visualization

### Prompt Engineering for Room Renders

```
STRUCTURE FOR IDEOGRAM/MIDJOURNEY/SDXL:

[Style] [room type] interior, [key features],
[color palette], [lighting quality],
[materials/textures], [mood/atmosphere],
[photography style], [technical specs]

EXAMPLE - Scandinavian Living Room:
"Scandinavian modern living room interior,
large floor-to-ceiling windows with sheer curtains,
white walls with warm oak wood accents,
gray boucle sofa with sheepskin throws,
natural daylight streaming in, soft shadows,
matte plaster walls, natural linen textiles,
cozy hygge atmosphere,
architectural photography, wide angle lens,
8k resolution, photorealistic"

NEGATIVE PROMPTS:
"cluttered, messy, dark, oversaturated,
cartoon, illustration, low quality, watermark"
```

### Room Layout Generation

```python
"""
room_layout_generator.py - Generate furniture layouts using constraint satisfaction
"""

from ortools.sat.python import cp_model
import numpy as np

class RoomLayoutSolver:
    """
    Generate optimal furniture layouts using constraint programming.
    """

    def __init__(self, room_width: int, room_length: int, grid_size: int = 10):
        """
        Initialize solver.

        Args:
            room_width: Room width in cm
            room_length: Room length in cm
            grid_size: Grid cell size in cm (smaller = more precise but slower)
        """
        self.width = room_width // grid_size
        self.length = room_length // grid_size
        self.grid_size = grid_size
        self.model = cp_model.CpModel()
        self.furniture = []

    def add_furniture(self, name: str, width: int, length: int,
                     anchor_to: str = None, min_clearance: int = 45):
        """
        Add furniture piece to layout.

        Args:
            name: Furniture identifier
            width: Width in cm
            length: Length in cm
            anchor_to: 'north', 'south', 'east', 'west' wall, or None
            min_clearance: Minimum clearance around piece in cm
        """
        w = width // self.grid_size
        l = length // self.grid_size
        clearance = min_clearance // self.grid_size

        # Position variables
        x = self.model.NewIntVar(0, self.width - w, f'{name}_x')
        y = self.model.NewIntVar(0, self.length - l, f'{name}_y')

        # Rotation (0 = original, 1 = 90° rotated)
        rotated = self.model.NewBoolVar(f'{name}_rotated')

        # Actual dimensions considering rotation
        actual_w = self.model.NewIntVar(min(w, l), max(w, l), f'{name}_actual_w')
        actual_l = self.model.NewIntVar(min(w, l), max(w, l), f'{name}_actual_l')

        # Link rotation to dimensions
        self.model.Add(actual_w == w).OnlyEnforceIf(rotated.Not())
        self.model.Add(actual_w == l).OnlyEnforceIf(rotated)
        self.model.Add(actual_l == l).OnlyEnforceIf(rotated.Not())
        self.model.Add(actual_l == w).OnlyEnforceIf(rotated)

        # Wall anchoring constraints
        if anchor_to == 'north':
            self.model.Add(y + actual_l == self.length)
        elif anchor_to == 'south':
            self.model.Add(y == 0)
        elif anchor_to == 'east':
            self.model.Add(x + actual_w == self.width)
        elif anchor_to == 'west':
            self.model.Add(x == 0)

        self.furniture.append({
            'name': name,
            'x': x, 'y': y,
            'w': actual_w, 'l': actual_l,
            'rotated': rotated,
            'clearance': clearance
        })

    def add_no_overlap_constraints(self):
        """Ensure no furniture overlaps."""
        for i, f1 in enumerate(self.furniture):
            for f2 in self.furniture[i+1:]:
                # Create boolean for each separation direction
                left = self.model.NewBoolVar(f'{f1["name"]}_left_of_{f2["name"]}')
                right = self.model.NewBoolVar(f'{f1["name"]}_right_of_{f2["name"]}')
                above = self.model.NewBoolVar(f'{f1["name"]}_above_{f2["name"]}')
                below = self.model.NewBoolVar(f'{f1["name"]}_below_{f2["name"]}')

                clearance = max(f1['clearance'], f2['clearance'])

                self.model.Add(f1['x'] + f1['w'] + clearance <= f2['x']).OnlyEnforceIf(left)
                self.model.Add(f2['x'] + f2['w'] + clearance <= f1['x']).OnlyEnforceIf(right)
                self.model.Add(f1['y'] + f1['l'] + clearance <= f2['y']).OnlyEnforceIf(above)
                self.model.Add(f2['y'] + f2['l'] + clearance <= f1['y']).OnlyEnforceIf(below)

                # At least one must be true
                self.model.Add(left + right + above + below >= 1)

    def solve(self) -> dict:
        """Solve the layout and return positions."""
        self.add_no_overlap_constraints()

        solver = cp_model.CpSolver()
        status = solver.Solve(self.model)

        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            return {
                f['name']: {
                    'x': solver.Value(f['x']) * self.grid_size,
                    'y': solver.Value(f['y']) * self.grid_size,
                    'rotated': solver.Value(f['rotated']) == 1
                }
                for f in self.furniture
            }
        return None


# Example usage
"""
solver = RoomLayoutSolver(400, 500)  # 4m x 5m room
solver.add_furniture('sofa', 220, 90, anchor_to='north')
solver.add_furniture('coffee_table', 120, 60)
solver.add_furniture('armchair', 80, 80)
solver.add_furniture('tv_console', 180, 45, anchor_to='south')

layout = solver.solve()
"""
```

## Style Reference Guide

### Style DNA Breakdown

```
MID-CENTURY MODERN
├── Era: 1945-1970
├── Key designers: Eames, Saarinen, Noguchi, Jacobsen
├── Furniture: Organic curves, tapered legs, molded plywood
├── Colors: Mustard, teal, orange, olive, walnut
├── Materials: Walnut, teak, brass, leather, fiberglass
├── Proportions: Low-slung, horizontal emphasis
└── Telltale: Hairpin legs, tulip bases, spindle backs

SCANDINAVIAN
├── Era: 1950s-present
├── Key concept: Hygge (cozy contentment)
├── Furniture: Light wood, functional, crafted
├── Colors: White, gray, blonde wood, black accents
├── Materials: Ash, oak, wool, linen, sheepskin
├── Light: Maximize natural light, warm artificial
└── Telltale: Shaker-inspired simplicity, textile layering

JAPANDI
├── Era: 2010s-present
├── Philosophy: Wabi-sabi meets hygge
├── Furniture: Low, minimal, handcrafted imperfection
├── Colors: Earth tones, cream, charcoal
├── Materials: Natural wood, stone, ceramic, paper
├── Space: Ma (negative space as element)
└── Telltale: Platform beds, shoji screens, bonsai

MAXIMALIST
├── Philosophy: More is more, curated abundance
├── Furniture: Mix periods freely, statement pieces
├── Colors: Bold, saturated, unexpected combinations
├── Materials: Velvet, brass, lacquer, pattern-on-pattern
├── Display: Collections, books, art salon-style
└── Telltale: Visual density, personality-forward
```

## References

### Essential Reading
- Ching, F. (2014). *Interior Design Illustrated*
- Pile, J. (2013). *A History of Interior Design*
- IES (2021). *The Lighting Handbook* (11th ed.)
- Munsell, A. (1905). *A Color Notation*
- Birren, F. (1961). *Color Psychology and Color Therapy*

### Tools & Resources
- Munsell Color Charts (physical)
- Benjamin Moore Color Portfolio
- DIALux (lighting calculation software)
- SketchUp + V-Ray (visualization)
- Planner 5D / RoomGPT (AI-assisted)
