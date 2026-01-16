# DAG System Platform Features

## Overview

The DAG execution framework unlocks several powerful features for the Some Claude Skills website platform. This document outlines the features, their implementation approach, and integration points.

---

## Feature 1: Skill Workflows (Recipes)

### Description
Pre-built DAGs that combine multiple skills for common tasks. Users see the execution flow visually and can install all skills needed for a workflow with one click.

### Example Workflows
1. **Build a Production Chatbot**
   - `ai-engineer` → Prompt engineering & RAG setup
   - `backend-architect` → API design
   - `test-automator` → Test coverage
   - `deployment-engineer` → CI/CD pipeline

2. **Create a Portfolio Website**
   - `career-biographer` → Extract career narrative
   - `competitive-cartographer` → Analyze positioning
   - `design-archivist` → Research designs
   - `web-design-expert` → Build the site

3. **Analyze Drone Footage**
   - `drone-cv-expert` → Flight control & SLAM
   - `drone-inspection-specialist` → Damage detection
   - `clip-aware-embeddings` → Image similarity search
   - `collage-layout-expert` → Arrange findings

### Data Structure
```typescript
interface SkillWorkflow {
  id: string;
  name: string;
  description: string;
  category: string;
  skills: SkillWorkflowNode[];
  dag: DAG;  // The actual DAG structure
  estimatedTime: string;  // "30 minutes", "2-4 hours"
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface SkillWorkflowNode {
  skillId: string;
  role: string;  // "Extracts career story", "Designs API"
  wave: number;  // Execution order
  inputs: string[];  // What it receives
  outputs: string[];  // What it produces
}
```

### UI Components
- `WorkflowCard` - Shows workflow with mini DAG visualization
- `WorkflowDetail` - Full page with step-by-step guide
- `WorkflowDAGViewer` - Interactive DAG visualization
- `WorkflowInstaller` - One-click install all skills

### Page
`/workflows` - Browse all pre-built workflows

---

## Feature 2: Interactive Workflow Builder

### Description
Visual drag-and-drop interface for creating custom skill workflows. Users can:
- Search and add skills to canvas
- Draw dependency edges
- Configure inputs/outputs
- Export as executable DAG or shareable link

### Technical Approach
```typescript
interface WorkflowBuilderState {
  nodes: Map<string, BuilderNode>;
  edges: Edge[];
  selectedNode: string | null;
  validationErrors: ValidationError[];
}

interface BuilderNode {
  id: string;
  skillId: string;
  position: { x: number; y: number };
  config: NodeConfig;
}
```

### UI Components
- `WorkflowBuilder` - Main canvas component
- `SkillPalette` - Searchable skill list to drag from
- `NodeConnector` - Handles edge drawing
- `WorkflowExporter` - Export to JSON, YAML, or URL

### Page
`/builder` - Interactive workflow builder

---

## Feature 3: Skill Relationship Graph

### Description
Shows how skills relate to each other:
- Skills that work well together
- Skills with similar capabilities
- Skill "stacks" for domains (ML stack, Design stack, etc.)

### Data Structure
```typescript
interface SkillRelationship {
  skillA: string;
  skillB: string;
  relationship: 'complements' | 'extends' | 'alternative' | 'precedes';
  strength: number;  // 0-1
  description: string;
}

interface SkillStack {
  id: string;
  name: string;  // "ML Engineering Stack"
  skills: string[];
  order: 'sequential' | 'any';
}
```

### UI Components
- `SkillGraph` - Force-directed graph visualization
- `RelatedSkills` - Shows related skills on skill detail page
- `SkillStackCard` - Domain-specific skill collections

### Integration
- Add "Related Skills" section to each skill's doc page
- Show mini relationship graph on skill quick view
- Full interactive graph on `/ecosystem` page

---

## Feature 4: Live Execution Demos

### Description
Interactive demos showing DAG execution in real-time. Users can see:
- Wave-based parallel execution
- Progress through nodes
- Token usage tracking
- Simulated outputs

### Technical Approach
Use mock API client (like in demos) for safe browser execution:
```typescript
interface ExecutionDemo {
  id: string;
  name: string;
  dag: DAG;
  mockResponses: Map<NodeId, string>;
  displayConfig: {
    showTokenUsage: boolean;
    showTimings: boolean;
    playbackSpeed: 'slow' | 'normal' | 'fast';
  };
}
```

### UI Components
- `DAGExecutionViewer` - Shows DAG with animated execution
- `NodeProgressIndicator` - Individual node status
- `WaveProgressBar` - Wave-level progress
- `TokenUsageDisplay` - Running token count
- `ExecutionTimeline` - Event log

### Integration
- Add to workflow detail pages
- Standalone demo page `/demos`
- Embed in documentation

---

## Feature 5: Workflow API

### Description
REST API for external integrations using the HTTP API runtime.

### Endpoints
```
POST   /api/workflows/execute      - Start workflow execution
GET    /api/workflows/:id/status   - Get execution status
POST   /api/workflows/:id/cancel   - Cancel execution
GET    /api/workflows/templates    - List available workflows
POST   /api/workflows/custom       - Execute custom DAG
```

### Use Cases
- CI/CD integration (run skills as pipeline step)
- Webhook triggers
- External tool integration
- Custom automation

### Authentication
- API keys for public access
- OAuth for user-specific workflows

---

## Feature 6: Skill Bundles v2 (DAG-Backed)

### Description
Enhanced bundles that include execution order and dependency information.

### Current Bundle Format
```yaml
name: ML Engineering Stack
skills:
  - ml-engineer
  - data-scientist
  - mlops-engineer
```

### DAG-Backed Bundle Format
```yaml
name: ML Engineering Stack
skills:
  - id: data-scientist
    wave: 0
    role: "Data exploration and model development"
  - id: ml-engineer
    wave: 1
    depends_on: [data-scientist]
    role: "Production ML pipeline"
  - id: mlops-engineer
    wave: 2
    depends_on: [ml-engineer]
    role: "Deployment and monitoring"
execution_pattern: sequential
estimated_tokens: 50000
```

### UI Enhancement
- Show execution flow in bundle card
- "Install in order" vs "Install all"
- Progress tracker when using bundle

---

## Implementation Priority

### Phase 1 (High Value, Low Effort)
1. **Skill Relationship Graph** - Enhance existing ecosystem page
2. **DAG-Backed Bundles** - Extend existing bundle system
3. **Related Skills on Detail Pages** - Add to existing components

### Phase 2 (High Value, Medium Effort)
4. **Skill Workflows/Recipes** - New page with pre-built workflows
5. **Live Execution Demos** - Interactive DAG visualization
6. **DAG Execution Viewer Component** - Reusable across features

### Phase 3 (High Value, High Effort)
7. **Interactive Workflow Builder** - Full drag-and-drop builder
8. **Workflow API** - External integrations

---

## File Structure

```
website/src/
├── components/
│   ├── workflow/
│   │   ├── WorkflowCard.tsx
│   │   ├── WorkflowDetail.tsx
│   │   ├── WorkflowDAGViewer.tsx
│   │   ├── WorkflowInstaller.tsx
│   │   └── index.ts
│   ├── dag-viz/
│   │   ├── DAGCanvas.tsx
│   │   ├── DAGNode.tsx
│   │   ├── DAGEdge.tsx
│   │   ├── DAGExecutionViewer.tsx
│   │   ├── WaveProgressBar.tsx
│   │   └── index.ts
│   └── builder/
│       ├── WorkflowBuilder.tsx
│       ├── SkillPalette.tsx
│       ├── NodeConnector.tsx
│       └── index.ts
├── pages/
│   ├── workflows.tsx
│   ├── builder.tsx
│   └── demos.tsx
├── data/
│   ├── workflows.ts
│   ├── skillRelationships.ts
│   └── skillStacks.ts
└── dag/
    ├── types/
    ├── core/
    ├── runtimes/
    ├── demos/
    └── PLATFORM_FEATURES.md  (this file)
```

---

## Success Metrics

- **Workflow Views**: How many users explore pre-built workflows
- **Bundle Installs**: Increase in full bundle installations
- **Time on Site**: Users spending more time exploring relationships
- **Builder Usage**: Custom workflows created
- **API Calls**: External integrations

---

## Next Steps

1. Create `skillRelationships.ts` with relationship data
2. Enhance ecosystem page with relationship graph
3. Add "Related Skills" to skill quick view
4. Create first 3-5 pre-built workflows
5. Build DAG visualization component
