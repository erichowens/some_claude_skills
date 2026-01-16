# Additional Skills the Site Needs

## Summary

~~The skill relationships data references 2 skills that don't exist in the registry yet.~~
**UPDATE**: The 2 missing skills (`ai-engineer` and `prompt-engineer`) have been created.
Additionally, 23 DAG framework meta-skills have been created but aren't in the website yet.

---

## ~~Missing Skills Referenced in Relationships~~ COMPLETED

~~These skills are referenced in `skillRelationships.ts` but don't exist in the skills registry:~~

### 1. `ai-engineer` ✅ CREATED
- **Purpose**: LLM application development, RAG systems, agent orchestration
- **Location**: `.claude/skills/ai-engineer/SKILL.md`
- **Relationships**:
  - `ai-engineer` extends `prompt-engineer`
  - `ai-engineer` complements `chatbot-analytics`
  - Used in AI/ML stack and AI Chatbot Development workflow

### 2. `prompt-engineer` ✅ CREATED
- **Purpose**: Prompt optimization, few-shot learning, chain-of-thought techniques
- **Location**: `.claude/skills/prompt-engineer/SKILL.md`
- **Relationships**:
  - `automatic-stateful-prompt-improver` extends `prompt-engineer`
  - Used in AI/ML stack and AI Chatbot Development workflow

---

## DAG Framework Meta-Skills (23 skills)

These exist in `.claude/skills/dag-framework/` but aren't in the website registry yet.
They could be added as an "Advanced: DAG Orchestration" category.

### Orchestration Layer (7 skills)
| Skill | Purpose |
|-------|---------|
| `graph-builder` | Parses problems into DAG structure |
| `dependency-resolver` | Topological sort, cycle detection |
| `task-scheduler` | Wave-based parallel scheduling |
| `parallel-executor` | Concurrent execution within waves |
| `result-aggregator` | Combines outputs from parallel branches |
| `context-bridger` | Passes context between agents |
| `dynamic-replanner` | Modifies DAG mid-execution on failures |

### Registry & Discovery Layer (3 skills)
| Skill | Purpose |
|-------|---------|
| `skill-registry` | Central skill catalog with metadata |
| `semantic-matcher` | Finds skills for natural language requests |
| `capability-ranker` | Ranks matches by fit and performance |

### Permission & Scoping Layer (3 skills)
| Skill | Purpose |
|-------|---------|
| `permission-validator` | Validates permission inheritance |
| `scope-enforcer` | Enforces file/tool boundaries |
| `isolation-manager` | Manages agent isolation levels |

### Quality Assurance Layer (3 skills)
| Skill | Purpose |
|-------|---------|
| `output-validator` | Validates agent outputs against schemas |
| `confidence-scorer` | Assigns confidence to results |
| `hallucination-detector` | Detects fabricated content |

### Iteration & Feedback Layer (3 skills)
| Skill | Purpose |
|-------|---------|
| `iteration-detector` | Identifies when iteration needed |
| `feedback-synthesizer` | Creates actionable feedback |
| `convergence-monitor` | Tracks progress toward goal |

### Observability & Learning Layer (4 skills)
| Skill | Purpose |
|-------|---------|
| `execution-tracer` | Traces full execution path |
| `performance-profiler` | Measures latency, tokens, cost |
| `failure-analyzer` | Root cause analysis for failures |
| `pattern-learner` | Learns from successes/failures |

---

## Recommendations

### ~~Immediate (for relationships to work)~~ DONE
1. ~~Create `ai-engineer` skill~~ ✅ Created
2. ~~Create `prompt-engineer` skill~~ ✅ Created

### Future (for advanced users)
3. Add DAG framework skills to website as "Advanced: Orchestration" category
4. These are internal/meta skills, so mark them appropriately

---

## Implementation Notes

- Skills must be added to `.claude/skills/` directory first
- Then regenerate website skills data: `npm run generate:skills`
- The test tolerance allows up to 10 invalid skill IDs, so current state works
