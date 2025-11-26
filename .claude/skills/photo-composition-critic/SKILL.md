---
name: photo-composition-critic
description: Expert photography composition critic grounded in graduate-level visual aesthetics education, computational aesthetics research (AVA, NIMA, LAION-Aesthetics, VisualQuality-R1), and professional image analysis with custom tooling
version: 1.0.0
category: Creative & Design
tags:
  - photography
  - composition
  - computational-aesthetics
  - nima
  - ava-dataset
  - image-quality
  - visual-analysis
author: Erich Owens
---

# Photo Composition Critic

Expert photography critic with deep grounding in graduate-level visual aesthetics, computational aesthetics research, and professional image analysis.

## Theoretical Foundations

### Graduate-Level Composition Theory

Beyond "rule of thirds" - the actual principles:

#### Visual Weight & Balance
```
VISUAL WEIGHT FACTORS (Arnheim, 1974)
├── Size: Larger = heavier
├── Color: Warm/saturated = heavier than cool/desaturated
├── Isolation: Isolated elements carry more weight
├── Intrinsic Interest: Faces, text, unusual shapes
├── Position: Upper-right carries more weight (Western reading)
└── Depth: Objects appearing closer = heavier

BALANCE TYPES
├── Symmetrical: Formal, stable, static
├── Asymmetrical: Dynamic, interesting, requires skill
├── Radial: Energy emanating from center
└── Crystallographic: All-over pattern (Pollock)
```

#### Gestalt Principles in Photography
```
PROXIMITY: Elements near each other = grouped
SIMILARITY: Similar elements = related
CONTINUITY: Eye follows lines/curves
CLOSURE: Brain completes incomplete shapes
FIGURE-GROUND: Subject/background separation
PRÄGNANZ: Simplest interpretation preferred
```

#### Dynamic Symmetry (Hambidge)
```
Not just golden ratio - the full system:

ROOT RECTANGLES
├── √2 (1:1.414) - A-series paper, dynamic diagonal
├── √3 (1:1.732) - Hexagonal harmony
├── √4 (1:2) - Double square, panoramic
├── √5 (1:2.236) - Contains golden ratio
└── φ (1:1.618) - Golden rectangle

CONSTRUCTION
├── Diagonal from corner to corner
├── Reciprocal from corner to opposite diagonal
├── Intersection points = "eyes" of the rectangle
└── Baroque/Sinister diagonals (left-rising vs right-rising)
```

#### The Arabesque (Harold Speed)
```
The continuous line that leads the eye through the composition.
NOT just leading lines - the entire visual flow:

TYPES
├── S-curve (Hogarth's "Line of Beauty")
├── Spiral (nautilus, cochlea)
├── Diagonal thrust
├── Circular containment
└── Zigzag energy

QUALITY METRICS
├── Does it enter the frame naturally?
├── Does it touch key subjects?
├── Does it avoid exits (corners, edges)?
└── Does it create rhythm through variation?
```

### Color Theory Beyond Basics

```
JOSEF ALBERS - INTERACTION OF COLOR
├── Colors change based on neighbors
├── One color can appear as two different colors
├── Two colors can appear identical
└── Quantity affects perception (small vs large areas)

JOHANNES ITTEN - 7 COLOR CONTRASTS
├── Hue: Different colors
├── Value: Light vs dark
├── Saturation: Pure vs muted
├── Temperature: Warm vs cool
├── Complementary: Opposites
├── Simultaneous: Induced complementary
└── Extension: Ratio of color areas

BEZOLD EFFECT
└── A color appears different depending on surrounding colors
    (Critical for evaluating edits)
```

## Computational Aesthetics

### Key Models & Datasets

#### AVA Dataset (Aesthetic Visual Analysis)
```
250,000+ images from dpchallenge.com
├── Mean scores from 78-549 votes each
├── Semantic tags (landscape, portrait, etc.)
├── Style tags (HDR, vintage, etc.)
└── Ground truth for training aesthetics models

SCORE DISTRIBUTION INSIGHT
├── Most images: 5.0-5.5 (mediocre)
├── Great images: 6.5+ (top ~5%)
├── Exceptional: 7.0+ (top ~1%)
└── Bimodal: Some images polarize voters
```

#### NIMA (Neural Image Assessment)
```python
# Google's 2017 model predicting AVA scores
# Predicts DISTRIBUTION not just mean score

Architecture: MobileNet/VGG16/Inception + custom head
Output: 10-class probability distribution (scores 1-10)
Loss: Earth Mover's Distance (EMD)

INTERPRETATION
├── Mean: Overall quality prediction
├── Std Dev: How polarizing/consistent
└── Distribution shape: Technical vs aesthetic issues

# Example inference
def get_nima_score(image_path):
    img = preprocess(load_image(image_path))
    distribution = model.predict(img)
    mean_score = sum(i * distribution[i] for i in range(10))
    return mean_score, distribution
```

#### LAION-Aesthetics
```
LAION-5B filtered by aesthetic predictor

SUBSETS
├── aesthetics_6plus: ~600M images, score ≥6
├── aesthetics_5plus: ~1.2B images, score ≥5
└── Used to train Stable Diffusion!

THE AESTHETIC PREDICTOR
├── CLIP ViT-L/14 embeddings
├── Simple MLP regression head
├── Trained on SAC (Simulacra Aesthetic Captions)
└── Fast inference, reasonable accuracy

# Get LAION aesthetic score
def laion_aesthetic_score(image):
    clip_embedding = clip_model.encode_image(image)
    score = aesthetic_mlp(clip_embedding)
    return score  # 1-10 scale
```

#### VisualQuality-R1
```
Recent (2024) reasoning-augmented quality assessment

KEY INNOVATION
├── Chain-of-thought reasoning about quality
├── Explains WHY an image scores high/low
├── Trained on quality rationales, not just scores
└── Better generalization than pure regression

EVALUATION DIMENSIONS
├── Technical: Sharpness, noise, exposure, color
├── Aesthetic: Composition, lighting, subject
├── Semantic: Meaning, story, emotional impact
└── Contextual: Genre-appropriate quality
```

### Custom Analysis Scripts

#### Multi-Model Ensemble Scorer
```python
#!/usr/bin/env python3
"""
photo_critic.py - Multi-model image aesthetic analysis
Requires: torch, transformers, clip, pillow
"""

import torch
import clip
from PIL import Image
from pathlib import Path

class PhotoCritic:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._load_models()

    def _load_models(self):
        # CLIP for embeddings
        self.clip_model, self.clip_preprocess = clip.load("ViT-L/14", self.device)

        # LAION aesthetic predictor (simple MLP)
        self.aesthetic_model = self._load_aesthetic_mlp()

        # NIMA model
        self.nima_model = self._load_nima()

    def analyze(self, image_path: str) -> dict:
        """Full aesthetic analysis of an image."""
        img = Image.open(image_path).convert("RGB")

        results = {
            "laion_aesthetic": self._laion_score(img),
            "nima_technical": self._nima_score(img, "technical"),
            "nima_aesthetic": self._nima_score(img, "aesthetic"),
            "composition": self._analyze_composition(img),
            "color_harmony": self._analyze_color(img),
            "technical_quality": self._analyze_technical(img),
        }

        results["overall"] = self._compute_overall(results)
        results["critique"] = self._generate_critique(results)

        return results

    def _analyze_composition(self, img) -> dict:
        """Rule of thirds, golden ratio, visual weight analysis."""
        import numpy as np
        from scipy import ndimage

        arr = np.array(img.convert("L"))

        # Find visual weight center (centroid of intensity)
        y_coords, x_coords = np.mgrid[0:arr.shape[0], 0:arr.shape[1]]
        total = arr.sum()
        center_y = (y_coords * arr).sum() / total
        center_x = (x_coords * arr).sum() / total

        # Normalize to 0-1
        norm_y = center_y / arr.shape[0]
        norm_x = center_x / arr.shape[1]

        # Distance from rule of thirds intersections
        thirds_points = [(1/3, 1/3), (2/3, 1/3), (1/3, 2/3), (2/3, 2/3)]
        min_thirds_dist = min(
            ((norm_x - px)**2 + (norm_y - py)**2)**0.5
            for px, py in thirds_points
        )

        # Golden ratio analysis
        phi = 0.618
        golden_points = [(phi, phi), (1-phi, phi), (phi, 1-phi), (1-phi, 1-phi)]
        min_golden_dist = min(
            ((norm_x - px)**2 + (norm_y - py)**2)**0.5
            for px, py in golden_points
        )

        return {
            "visual_center": (norm_x, norm_y),
            "thirds_alignment": max(0, 1 - min_thirds_dist * 3),
            "golden_alignment": max(0, 1 - min_golden_dist * 3),
            "balance": 1 - abs(norm_x - 0.5) - abs(norm_y - 0.5)
        }

    def _analyze_color(self, img) -> dict:
        """Color harmony and palette analysis."""
        import numpy as np
        from collections import Counter

        # Quantize to find dominant colors
        small = img.resize((100, 100))
        pixels = list(small.getdata())

        # Convert to HSV for harmony analysis
        hsv_pixels = [self._rgb_to_hsv(p) for p in pixels]
        hues = [p[0] for p in hsv_pixels if p[1] > 0.2]  # Ignore desaturated

        if not hues:
            return {"harmony_type": "achromatic", "score": 0.7}

        # Analyze hue distribution
        hue_hist = np.histogram(hues, bins=12, range=(0, 360))[0]
        active_bins = np.sum(hue_hist > len(hues) * 0.05)

        if active_bins == 1:
            harmony = "monochromatic"
            score = 0.85
        elif active_bins == 2:
            harmony = "complementary" if self._are_complementary(hue_hist) else "analogous"
            score = 0.9 if harmony == "complementary" else 0.8
        elif active_bins == 3:
            harmony = "triadic"
            score = 0.85
        else:
            harmony = "complex"
            score = 0.6

        return {"harmony_type": harmony, "score": score, "active_hues": active_bins}

    def _generate_critique(self, results: dict) -> str:
        """Generate human-readable critique from analysis."""
        critique_parts = []

        # Overall impression
        overall = results["overall"]
        if overall >= 8:
            critique_parts.append("Exceptional image with professional-level execution.")
        elif overall >= 6.5:
            critique_parts.append("Strong image with good technical and aesthetic qualities.")
        elif overall >= 5:
            critique_parts.append("Competent image with room for improvement.")
        else:
            critique_parts.append("Image needs significant work on fundamentals.")

        # Composition feedback
        comp = results["composition"]
        if comp["thirds_alignment"] > 0.7:
            critique_parts.append("Strong rule-of-thirds placement.")
        elif comp["golden_alignment"] > 0.7:
            critique_parts.append("Nice golden ratio composition.")
        elif comp["balance"] < 0.3:
            critique_parts.append("Consider rebalancing - visual weight is off-center.")

        # Color feedback
        color = results["color_harmony"]
        critique_parts.append(f"Color scheme: {color['harmony_type']} "
                            f"(harmony score: {color['score']:.2f})")

        return " ".join(critique_parts)
```

#### MCP Server for Photo Critique
```python
#!/usr/bin/env python3
"""
photo_critic_mcp.py - MCP server for photo composition analysis
"""

from mcp.server import Server
from mcp.types import Tool, TextContent
import asyncio

app = Server("photo-critic")

@app.tool()
async def analyze_composition(image_path: str) -> str:
    """Analyze image composition using ML models and classical theory."""
    from photo_critic import PhotoCritic

    critic = PhotoCritic()
    results = critic.analyze(image_path)

    return f"""
## Aesthetic Analysis Results

**Overall Score: {results['overall']:.1f}/10**

### Model Scores
- LAION Aesthetic: {results['laion_aesthetic']:.2f}
- NIMA Technical: {results['nima_technical']:.2f}
- NIMA Aesthetic: {results['nima_aesthetic']:.2f}

### Composition Analysis
- Rule of Thirds Alignment: {results['composition']['thirds_alignment']:.0%}
- Golden Ratio Alignment: {results['composition']['golden_alignment']:.0%}
- Visual Balance: {results['composition']['balance']:.0%}

### Color Analysis
- Harmony Type: {results['color_harmony']['harmony_type']}
- Harmony Score: {results['color_harmony']['score']:.2f}

### Critique
{results['critique']}
"""

@app.tool()
async def compare_crops(image_path: str, crops: list[dict]) -> str:
    """Compare multiple crop options for an image.

    crops: List of {x, y, width, height} dicts defining crop regions
    """
    from photo_critic import PhotoCritic
    from PIL import Image

    critic = PhotoCritic()
    img = Image.open(image_path)

    results = []
    for i, crop in enumerate(crops):
        cropped = img.crop((
            crop['x'], crop['y'],
            crop['x'] + crop['width'],
            crop['y'] + crop['height']
        ))
        # Save temp and analyze
        temp_path = f"/tmp/crop_{i}.jpg"
        cropped.save(temp_path)
        score = critic.analyze(temp_path)['overall']
        results.append((i, score, crop))

    results.sort(key=lambda x: x[1], reverse=True)

    output = "## Crop Comparison\n\n"
    for rank, (idx, score, crop) in enumerate(results, 1):
        output += f"{rank}. Crop {idx}: **{score:.1f}/10** "
        output += f"({crop['width']}x{crop['height']} at {crop['x']},{crop['y']})\n"

    return output

if __name__ == "__main__":
    asyncio.run(app.run())
```

## Critique Framework

### The Full Analysis Protocol

```
1. FIRST IMPRESSION (2 seconds)
   └── What does your eye do? Where does it go first, second, third?
   └── What's the emotional hit?
   └── Does anything feel "off"?

2. TECHNICAL SCAN
   ├── Exposure: Histogram, highlight/shadow clipping
   ├── Focus: Sharpness at intended focal point
   ├── Noise: ISO artifacts, luminance vs chroma noise
   ├── Color: White balance, color cast, saturation
   └── Artifacts: Chromatic aberration, distortion, banding

3. COMPOSITIONAL ANALYSIS
   ├── Subject: Clear? Dominant? Well-placed?
   ├── Structure: What geometric framework is used?
   ├── Balance: Visual weight distribution
   ├── Flow: How does the eye move through the frame?
   ├── Depth: Foreground/middle/background relationships
   └── Edges: What's happening at frame boundaries?

4. AESTHETIC EVALUATION
   ├── Light: Quality, direction, contrast, mood
   ├── Color: Harmony, emotion, intention
   ├── Moment: Decisive? Peak action? Emotional truth?
   └── Story: What narrative is being told?

5. CONTEXTUAL ASSESSMENT
   ├── Genre: Does it succeed at what it's trying to be?
   ├── Intent: What was the photographer's goal?
   └── Audience: Who is this for? Does it work for them?

6. ACTIONABLE RECOMMENDATIONS
   ├── What specifically would improve this image?
   ├── Post-processing suggestions with parameters
   ├── Alternative crop/composition ideas
   └── What to do differently next time
```

## References

### Essential Reading
- Arnheim, R. (1974). *Art and Visual Perception*
- Hambidge, J. (1926). *The Elements of Dynamic Symmetry*
- Itten, J. (1961). *The Art of Color*
- Albers, J. (1963). *Interaction of Color*
- Freeman, M. (2007). *The Photographer's Eye*

### Key Papers
- Murray, N. et al. (2012). "AVA: A Large-Scale Database for Aesthetic Visual Analysis"
- Talebi, H. & Milanfar, P. (2018). "NIMA: Neural Image Assessment"
- Schuhmann, C. et al. (2022). "LAION-5B: An open large-scale dataset"
- Wu, Q. et al. (2024). "Q-Instruct: Improving Low-level Visual Abilities"
