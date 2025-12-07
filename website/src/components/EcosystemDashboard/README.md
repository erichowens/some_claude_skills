# Ecosystem Dashboard - "Bottle City" View

A comprehensive visualization dashboard for exploring the Claude Skills agentic ecosystem.

## Components

### `index.tsx` - Main Dashboard Container
Orchestrates the entire dashboard experience with three main views:
- **Knowledge Graph**: Force-directed graph visualization of agent/skill relationships
- **Agents Grid**: Browsable cards for all meta-orchestrating agents
- **Skills Grid**: Searchable, filterable grid of all domain-specific skills

Features:
- Dynamic view switching
- Agent detail panel (slides in from right)
- Responsive layout
- Windows 3.1 aesthetic throughout

### `StatsPanel.tsx` - Summary Statistics
Top-level overview panel displaying:
- Total agents, skills, and tools
- Most-used tools with visual bar charts
- Domain coverage heatmap (Computer Vision, Design, Audio, Psychology, etc.)

### `KnowledgeGraph.tsx` - Interactive Network Visualization
Force-directed graph using HTML5 Canvas:
- Agents in center ring (indigo nodes)
- Skills in outer ring (emerald nodes)
- Coordination edges showing agent relationships
- Real-time physics simulation (repulsion + attraction forces)
- Hover to highlight, click to view details

**Physics Parameters:**
- Repulsion: `100 / (dist²)` - keeps nodes from overlapping
- Attraction: `dist * 0.01` - pulls connected nodes together
- Center gravity: `dx * 0.001` - keeps graph centered
- Damping: `0.9` - prevents oscillation

### `AgentCard.tsx` - Individual Agent Display
Compact card showing:
- Agent initial icon (gradient background)
- Name, role, description
- Tool count and connection count
- Clickable for detail panel

### `SkillGrid.tsx` - Browsable Skill Browser
Filterable grid with:
- Search by name/description
- Filter by: has tools, has references
- Badges for: references, examples, tool count
- Responsive grid layout

## Data Flow

1. **Page** (`/ecosystem`) loads `ecosystem-state.json` from `.claude/data/`
2. **Dashboard** receives full data object as prop
3. **Components** extract needed subsets (agents, skills, graph nodes/edges)
4. **State** managed at Dashboard level for view selection and detail panel

## Styling

Uses CSS Modules (`styles.module.css`) with:
- **Dark theme**: `#0f172a` background
- **Agent color**: `#6366f1` (indigo)
- **Skill color**: `#10b981` (emerald)
- **Tool color**: `#f59e0b` (amber)
- Windows 3.1 chrome via `win31.css` globals

## Performance Considerations

- Force simulation runs at 60fps but dampens quickly (0.9 velocity decay)
- Canvas rendering batched per frame
- React memoization on filtered lists
- Detail panel uses CSS animation (GPU-accelerated)

## Accessibility

- Keyboard navigation support needed (TODO)
- ARIA labels needed (TODO)
- Color contrast meets WCAG AA for text
- Semantic HTML structure

## Usage

```tsx
import EcosystemDashboard from '../components/EcosystemDashboard';
import ecosystemData from '../../.claude/data/ecosystem-state.json';

<EcosystemDashboard data={ecosystemData} />
```

## Future Enhancements

- [ ] Activity feed (show recent agent/skill creation)
- [ ] Time-based graph replay
- [ ] Export graph as SVG/PNG
- [ ] Keyboard shortcuts for navigation
- [ ] Search across all entities
- [ ] Filter graph by tool usage
- [ ] Agent collaboration timeline
- [ ] Skill recommendation engine
