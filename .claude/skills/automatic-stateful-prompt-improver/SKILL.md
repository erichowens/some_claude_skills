---
name: automatic-stateful-prompt-improver
description: Automatically intercepts and optimizes prompts using the prompt-learning MCP server. Learns from performance over time via embedding-indexed history. Uses APE, OPRO, DSPy patterns. Activate on "optimize prompt", "improve this prompt", "prompt engineering", or ANY complex task request. Requires prompt-learning MCP server.
tools:
  - mcp__prompt-learning__optimize_prompt        # Primary optimization tool
  - mcp__prompt-learning__retrieve_prompts       # Find similar high-performing prompts
  - mcp__prompt-learning__record_feedback        # Record prompt performance
  - mcp__prompt-learning__suggest_improvements   # Quick improvement suggestions
  - mcp__prompt-learning__get_analytics          # Performance insights
  - mcp__SequentialThinking__sequentialthinking  # Complex reasoning
---

# Automatic Stateful Prompt Improver

## MANDATORY AUTOMATIC BEHAVIOR

**THIS IS NOT OPTIONAL. When this skill is active, I MUST follow these rules:**

### Auto-Optimization Triggers

I AUTOMATICALLY call `mcp__prompt-learning__optimize_prompt` BEFORE responding when the user's request:

1. **Is a complex task** (multi-step, requires reasoning)
2. **Will generate code or technical output**
3. **Is a system prompt, template, or reusable instruction**
4. **Explicitly mentions optimization** ("improve", "better", "optimize")
5. **Has ambiguous requirements** (underspecified, interpretable multiple ways)
6. **Is in a precision-critical domain** (code, legal, medical, financial)

### Auto-Optimization Process

When triggered, I MUST:

```
1. INTERCEPT the user's request
2. CALL: mcp__prompt-learning__optimize_prompt
   - prompt: [user's original request]
   - domain: [inferred domain]
   - max_iterations: [based on complexity: 3-10]
3. RECEIVE: optimized prompt + improvement details
4. INFORM user briefly: "I've refined your request for [reason]"
5. PROCEED with the OPTIMIZED version (not the original)
```

### Exception Cases (Do NOT optimize)

- Simple questions ("what is X?")
- Direct commands ("run npm install")
- Conversational responses ("hello", "thanks")
- File operations without reasoning
- Already-optimized prompts (check for structure markers)

## Learning Loop (Post-Response)

After completing ANY significant task, I MUST:

```
1. ASSESS: Did the response achieve the goal?
2. CALL: mcp__prompt-learning__record_feedback
   - prompt_id: [from optimization response]
   - success: [true/false]
   - quality_score: [0.0-1.0]
   - feedback: [what worked/didn't]
3. This enables future retrievals to learn from outcomes
```

## Warm Start Behavior

When optimizing, if `mcp__prompt-learning__retrieve_prompts` returns similar high-performing prompts:
- Incorporate patterns from successful variants
- Weight recent successes higher (30-day half-life)
- Only use prompts with success_rate > 0.7

---

## Core Mission

Transform mediocre prompts into high-performing ones through:
1. **Automatic interception** - No user action required
2. **Stateful learning** - Improves over time via MCP server
3. **Iterative refinement** - Calibrated to complexity and ambiguity
4. **Continuous feedback** - Records outcomes for future retrieval

## Cold Start: Research-Backed Strategies

When I have no performance history, I apply these proven techniques:

### 1. APE-Style Instruction Generation
**Source**: Zhou et al., 2022 (outperformed human prompts on 19/24 NLP tasks)

```
Given your task and examples:
Task: [description]
Examples: Input → Output pairs

I generate 5-10 instruction candidates, then select the best based on:
- Clarity score (0-1): How unambiguous is the instruction?
- Completeness (0-1): Does it cover all requirements?
- Constraint density: Appropriate constraints without over-specification
```

### 2. OPRO Meta-Prompting
**Source**: Yang et al., 2023 (up to 50% improvement on Big-Bench Hard)

I treat prompt optimization AS a prompting task:
```
Previous prompt attempts and their scores:
- "Step by step, solve..." | Score: 0.65
- "Carefully analyze each..." | Score: 0.72

Generate a new instruction that will achieve a higher score.
```

### 3. Chain-of-Thought Enhancement
**Source**: Wei et al., 2022 (best for complex reasoning)

I add reasoning scaffolds:
- "Let's think step by step" (zero-shot CoT)
- Structured reasoning templates
- Self-consistency through multiple paths

### 4. Task Decomposition
Break complex prompts into modular components:
1. **Context setting** - Domain and background
2. **Instruction specification** - What to do
3. **Output format** - How to respond
4. **Constraints** - What to avoid

## Warm Start: Embedding-Based Learning

When I have performance history, I retrieve and learn from similar prompts.

### Retrieval Strategy

```
1. Embed the current prompt with contextual metadata:
   - Domain classification
   - Task type
   - Complexity score

2. Hybrid search (vector similarity + BM25 keyword):
   - Retrieve top-20 candidates
   - Rerank to top-5

3. Filter by performance threshold:
   - Only prompts with success_rate > 0.7
   - Weight by recency (exponential decay, half-life: 30 days)

4. Generate improvements based on:
   - What made similar prompts succeed
   - Patterns in high-performing variants
```

### Performance Metrics Tracked

| Metric | Description | Weight |
|--------|-------------|--------|
| `success_rate` | Task completion accuracy | 0.40 |
| `token_efficiency` | Output quality / tokens used | 0.20 |
| `coherence` | Logical consistency score | 0.15 |
| `user_satisfaction` | Explicit feedback | 0.15 |
| `latency_ms` | Response time | 0.10 |

## Iteration Triggers: When to Iterate More

**The core question**: How many improvement iterations should I perform?

### Decision Matrix

| Factor | Low (3-5 iter) | Medium (5-10 iter) | High (10-20 iter) |
|--------|----------------|-------------------|-------------------|
| **Complexity** | Simple classification | Multi-step reasoning | Agent/pipeline |
| **Ambiguity** | Clear requirements | Some interpretation | Underspecified |
| **Domain** | Well-researched | Moderate coverage | Novel domain |
| **Search Space** | Single instruction | Few-shot selection | Full program |
| **Stakes** | Low impact | Moderate impact | Critical path |

### Complexity Assessment

I automatically assess complexity:
```
Complexity Score (0-1):
- Task decomposition depth (0.3): How many sub-tasks?
- Reasoning steps required (0.3): Chain length
- Domain specificity (0.2): Specialized knowledge?
- Output structure (0.2): Format complexity

Score < 0.3 → 3-5 iterations
Score 0.3-0.6 → 5-10 iterations
Score > 0.6 → 10-20 iterations
```

### Ambiguity Assessment

```
Ambiguity Score (0-1):
- Requirement clarity (0.4): Are success criteria explicit?
- Interpretation variance (0.3): Multiple valid readings?
- Example availability (0.3): Concrete examples provided?

High ambiguity → +5 iterations (for exploration)
```

### Convergence Criteria

I stop iterating when:
1. **Performance plateau**: No improvement > 1% over last 3 iterations
2. **Diminishing returns**: Cost per improvement unit exceeds threshold
3. **Statistical significance**: Confidence interval < 2%
4. **Budget exhausted**: Max iterations or token limit reached

```python
def check_convergence(scores, window=3, threshold=0.01):
    """Stop if improvement < threshold over window iterations"""
    if len(scores) < window:
        return False
    recent_improvement = max(scores[-window:]) - scores[-window]
    return recent_improvement < threshold
```

## Optimization Techniques

### Technique 1: Instruction Rewriting

**Pattern**: Generate instruction variants, evaluate, select best

```markdown
Original: "Summarize this text"

Generated Variants:
1. "Extract the key points from this text in bullet form"
2. "Provide a concise 2-3 sentence summary capturing the main argument"
3. "Identify the thesis and supporting evidence, then summarize"

Selection Criteria:
- Specificity: Variant 2 wins (format specified)
- Clarity: Variant 1 wins (clear structure)
- Completeness: Variant 3 wins (methodology included)

Best: Combine insights → "Extract the thesis and key supporting points, then provide a concise 2-3 sentence summary in bullet form"
```

### Technique 2: Few-Shot Optimization

**Pattern**: Select examples that maximize performance

```markdown
Selection Methods:
1. Semantic similarity: Examples similar to test case
2. Diversity: Cover different scenarios
3. Difficulty progression: Easy → Hard examples
4. Contrastive: Include near-misses for boundary learning
```

### Technique 3: Constraint Engineering

**Pattern**: Add/remove constraints to improve output

```markdown
Under-constrained Prompt:
"Write code for a sorting function"

After Constraint Engineering:
"Write a Python function that sorts a list of integers in ascending order.
Requirements:
- Use O(n log n) time complexity
- Handle empty lists gracefully
- Include type hints
- Do not use built-in sort()"
```

### Technique 4: Output Format Specification

**Pattern**: Explicit format reduces ambiguity

```markdown
Before: "Analyze this data"

After: "Analyze this data and respond with:
1. **Summary** (2-3 sentences): Key findings
2. **Metrics** (bullet list): Quantitative observations
3. **Recommendations** (numbered): Actionable next steps"
```

## Anti-Patterns

### Anti-Pattern: Over-Optimization

**Symptom**: Prompt becomes overly complex with many constraints
**Why wrong**: Can cause brittleness, model confusion, token waste
**Solution**: Apply Occam's Razor - simplest sufficient prompt wins

### Anti-Pattern: Template Obsession

**Symptom**: Focusing on templates rather than task understanding
**Why wrong**: Templates don't generalize; understanding does
**Solution**: Focus on WHAT the task requires, not HOW to format it

### Anti-Pattern: Iteration Without Measurement

**Symptom**: Multiple rewrites without tracking improvements
**Why wrong**: Can't know if changes help without metrics
**Solution**: Always define success criteria before optimizing

### Anti-Pattern: Ignoring Model Capabilities

**Symptom**: Prompt assumes model can't do things it can
**Why wrong**: Over-scaffolding wastes tokens, under-scaffolding misses potential
**Solution**: Test model capabilities before heavy prompting

## Continuous Learning Architecture

### How I Learn Over Time

```
1. OBSERVE: Track prompt → outcome pairs
   - Store prompt embedding
   - Record performance metrics
   - Capture context (domain, task type, complexity)

2. INDEX: Build retrievable knowledge base
   - Vector database for semantic similarity
   - BM25 for keyword matching
   - Metadata for filtering

3. UPDATE: Exponential moving average
   - α = 0.3 (30% new, 70% historical)
   - Recency decay: half-life 30 days
   - Distribution drift detection

4. ADAPT: Adjust strategies based on patterns
   - Which techniques work for which domains?
   - What iteration counts converge fastest?
   - Where do certain patterns fail?
```

### Drift Detection

When the distribution of prompts shifts (new domain, new patterns):
```
If embedding_drift > 0.15:
  - Increase learning rate (α → 0.5)
  - Flag for human review
  - Log potential new domain
```

## Integration Requirements

### MCP Server Setup (For Stateful Learning)

To enable persistent learning, configure the prompt-learning MCP server:

```json
{
  "mcpServers": {
    "prompt-learning": {
      "command": "node",
      "args": ["path/to/prompt-learning-server/index.js"],
      "env": {
        "VECTOR_DB_URL": "your-vector-db-url",
        "REDIS_URL": "your-redis-url"
      }
    }
  }
}
```

**Required Tools** (exposed by MCP):
- `retrieve_prompts`: Get similar high-performing prompts
- `record_feedback`: Update prompt metrics
- `suggest_improvements`: RAG-based optimization
- `get_analytics`: Performance insights

### Without MCP (Cold Start Only)

If MCP is not configured, I operate in cold-start mode only:
- Apply research-backed strategies
- No retrieval from history
- No persistent learning
- Still effective, just not stateful

## Usage Examples

### Example 1: Simple Prompt Optimization

**Input**: "optimize this prompt: 'Summarize the document'"

**Process**:
1. Assess complexity: Low (0.2) → 3-5 iterations
2. Apply APE generation: Generate 5 variants
3. Evaluate each variant mentally
4. Select best, explain reasoning

**Output**:
```markdown
Optimized Prompt:
"Read the following document and provide a structured summary:
1. Main thesis (1 sentence)
2. Key supporting arguments (3-5 bullet points)
3. Conclusion/implications (1-2 sentences)

Document: [insert here]"

Improvements Made:
- Added structure (reduces ambiguity)
- Specified output format (improves consistency)
- Included document placeholder (clear input location)
```

### Example 2: Complex System Prompt

**Input**: "optimize this prompt for a code review agent"

**Process**:
1. Assess complexity: High (0.7) → 10-15 iterations
2. Retrieve similar high-performing prompts (if MCP available)
3. Apply iterative refinement
4. Check convergence after each iteration

### Example 3: Iterative with Feedback

**Input**: "improve this prompt, I'll tell you how it performs"

**Process**:
1. Initial optimization
2. User provides feedback
3. Record outcome → update metrics
4. Generate next iteration based on feedback
5. Repeat until convergence or user satisfied

## Performance Expectations

| Scenario | Expected Improvement | Iterations |
|----------|---------------------|------------|
| Simple task | 10-20% | 3-5 |
| Complex reasoning | 20-40% | 10-15 |
| Agent/pipeline | 30-50% | 15-20 |
| With history | +10-15% additional | Varies |

## Decision Trees

### When to Iterate More?

```
START
│
├─ Is task critical? ──YES──→ +5 iterations
│
├─ Is domain novel? ──YES──→ +5 iterations
│
├─ Are requirements ambiguous? ──YES──→ +5 iterations
│
├─ Do I have similar prompts? ──YES──→ -3 iterations (start better)
│
└─ Base: 5 iterations

TOTAL = Base + adjustments (min 3, max 20)
```

### When to Stop?

```
STOP if ANY:
- Improvement < 1% for 3 consecutive iterations
- User signals satisfaction
- Token budget exhausted
- 20 iterations reached
- Validation score > 0.95
```

## References

For deep dives on specific techniques, see:
- `/references/dspy-patterns.md` - DSPy optimization patterns
- `/references/ape-opro-implementation.md` - APE/OPRO algorithms
- `/references/embedding-architecture.md` - Vector DB setup
- `/references/mcp-server-spec.md` - MCP server implementation

---

**Remember**: The goal isn't the most sophisticated prompt—it's the simplest prompt that achieves the desired outcome reliably. Optimize for clarity, specificity, and measurable improvement.
