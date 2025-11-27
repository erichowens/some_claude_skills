---
name: clip-aware-embeddings
description: Semantic image-text matching with CLIP and alternatives, knowing when CLIP works and when to use specialized models
---

# CLIP-Aware Image Embeddings

<SkillHeader
  skillName="Clip Aware Embeddings"
  fileName="clip-aware-embeddings"
  description="Semantic image-text matching with CLIP and alternatives. Use for image search, zero-shot classification, similarity matching. NOT for counting objects, fine-grained classification (celebrities, car models), spatial reasoning, or compositional queries. Activate on \"CLIP\", \"embeddings\", \"image similarity\", \"semantic search\", \"zero-shot classification\", \"image-text matching\"."CLIP\", \"embeddings\", \"image similarity\", \"semantic search\", \"zero-shot classification\", \"image-text matching\"."CLIP\", \"embeddings\", \"image similarity\", \"semantic search\", \"zero-shot classification\", \"image-text matching\"."

  tags={["analysis","cv","ml","data","advanced"]}
/>

Smart image-text matching that knows when CLIP works and when to use alternatives.

## Your Mission

Stop using CLIP for everything. This skill helps you identify when CLIP is the right tool and when you need object detection, spatial reasoning models, or compositional alternatives like DCSMs and PC-CLIP.

## Quick Decision Tree

```
Your task:
├─ Semantic search ("find beach images") → CLIP ✓
├─ Zero-shot classification (broad categories) → CLIP ✓
├─ Counting objects → DETR, Faster R-CNN ✗
├─ Fine-grained ID (celebrities, car models) → Specialized model ✗
├─ Spatial relations ("cat left of dog") → GQA, SWIG ✗
└─ Compositional ("red car AND blue truck") → DCSMs, PC-CLIP ✗
```

## When to Use This Skill

### Perfect For:
- 🔍 Semantic image search
- 🏷️ Broad category classification
- 🖼️ Image similarity matching
- 🎯 Zero-shot tasks on new categories

### Not For:
- ❌ Counting objects in images
- ❌ Fine-grained classification (car models, flower species)
- ❌ Spatial understanding ("left of", "next to")
- ❌ Attribute binding ("red car AND blue truck")
- ❌ Negation handling

## Common Anti-Patterns

### Anti-Pattern 1: "CLIP for Everything"

**Wrong**:
```python
# Using CLIP to count cars in an image
prompt = "How many cars are in this image?"
# CLIP cannot count - it will give nonsense results
```

**Why wrong**: CLIP's architecture collapses spatial information into a single vector. It literally cannot count.

**Right**:
```python
from transformers import DetrImageProcessor, DetrForObjectDetection

processor = DetrImageProcessor.from_pretrained("facebook/detr-resnet-50")
model = DetrForObjectDetection.from_pretrained("facebook/detr-resnet-50")

# Detect objects
results = model(**processor(images=image, return_tensors="pt"))
# Filter for cars and count
car_detections = [d for d in results if d['label'] == 'car']
count = len(car_detections)
```

### Anti-Pattern 2: Spatial Understanding

**Wrong**:
```python
# CLIP cannot understand spatial relationships
prompts = [
    "cat to the left of dog",
    "cat to the right of dog"
]
# Will give nearly identical scores
```

**Why wrong**: CLIP embeddings lose spatial topology. "Left" and "right" are treated as bag-of-words.

## Evolution Timeline

| Year | Development |
|------|-------------|
| 2021 | CLIP Released - revolutionary but limitations unknown |
| 2022-2023 | Limitations discovered (counting, spatial, binding) |
| 2024 | PC-CLIP and DCSMs emerge as alternatives |
| 2025 | Best practice: task-specific model selection |

## Model Selection Guide

| Model | Best For | Avoid For |
|-------|----------|-----------|
| CLIP ViT-L/14 | Semantic search, broad categories | Counting, fine-grained, spatial |
| DETR | Object detection, counting | Semantic similarity |
| DINOv2 | Fine-grained features | Text-image matching |
| PC-CLIP | Attribute binding, comparisons | General embedding |
| DCSMs | Compositional reasoning | Simple similarity |

## Installation

```bash
pip install transformers pillow torch sentence-transformers
```

## Basic Usage

```python
from transformers import CLIPProcessor, CLIPModel
from PIL import Image

model = CLIPModel.from_pretrained("openai/clip-vit-large-patch14")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-large-patch14")

# Embed images
images = [Image.open(f"img{i}.jpg") for i in range(10)]
inputs = processor(images=images, return_tensors="pt")
image_features = model.get_image_features(**inputs)

# Search with text
text_inputs = processor(text=["a beach at sunset"], return_tensors="pt")
text_features = model.get_text_features(**text_inputs)

# Compute similarity
similarity = (image_features @ text_features.T).softmax(dim=0)
```

## Performance Notes

**CLIP models**:
- ViT-B/32: Fast, lower quality (~100ms CPU)
- ViT-L/14: Balanced, recommended (~300ms CPU)
- ViT-g-14: Highest quality, slower (~1000ms CPU)

## Key Insight

**LLM Mistake**: LLMs trained on 2021-2023 data will suggest CLIP for everything because limitations weren't widely known. This skill corrects that misconception with 2025 best practices.
