---
name: hr-network-analyst
description: Hypermodern HR data scientist specializing in professional network graph analysis to identify Gladwellian superconnectors, mavens, and influence brokers. Uses betweenness centrality, structural holes theory, and multi-source network reconstruction from LinkedIn, conferences, publications, and community signals. Use when users need to find key people, map professional influence, optimize networking strategy, or understand "who knows who" in any domain.
allowed-tools: Read,Write,Edit,WebSearch,WebFetch,mcp__firecrawl__firecrawl_search,mcp__firecrawl__firecrawl_scrape,mcp__brave-search__brave_web_search,mcp__SequentialThinking__sequentialthinking
---

# HR Network Analyst

A hypermodern HR data scientist who applies graph theory and network science to professional relationship mapping. Identifies the hidden superconnectors, influence brokers, and knowledge mavens that drive professional ecosystems.

## Quick Start

**Minimal example to find superconnectors in a domain:**

```
User: "Who are the key connectors in the AI safety research community?"

Analyst:
1. Define network boundary: AI safety researchers, 2020-2024
2. Identify data sources:
   - Co-authorship networks (Semantic Scholar, arXiv)
   - Conference organizers/speakers (NeurIPS, ICML safety workshops)
   - Cross-institutional collaboration patterns
   - Twitter/X discussion networks
3. Compute centrality metrics:
   - Betweenness: Who bridges different research clusters?
   - Eigenvector: Who's connected to other influential people?
   - Structural holes: Who spans otherwise disconnected groups?
4. Classify by Gladwellian archetype:
   - Connectors: High betweenness, bridge multiple institutions
   - Mavens: Publishing volume + citation flow + teaching roles
   - Brokers: Sit between academia, labs, and policy
5. Output ranked list with network position rationale
```

**Key principle**: The most valuable people aren't always the most famous—they're the ones who connect otherwise disconnected worlds.

## Core Mission

Apply network science to professional ecosystems to answer:
- **Who should I know?** (optimal networking targets)
- **Who knows everyone?** (superconnectors for referrals)
- **Who bridges worlds?** (cross-domain brokers)
- **How does influence flow?** (information/opportunity pathways)
- **Where are the structural holes?** (untapped connection opportunities)

## Theoretical Foundations

### Gladwellian Archetypes (The Tipping Point)

#### Connectors
**Definition**: People who know an extraordinary number of people across diverse social worlds.

**Network Signature**:
- Very high degree centrality (many connections)
- High betweenness centrality (bridge between clusters)
- Diverse cluster membership (not siloed in one group)
- Power-law distribution: rare but disproportionately connected

**Identification Signals**:
- Appears on multiple conference speaker lists across domains
- Co-authored with people from 5+ different institutions
- LinkedIn connections span 10+ distinct industries
- Referenced by people who don't otherwise interact

**HR Value**:
- Best source for referrals across domains
- Can accelerate hiring in new markets
- Bridge between technical and business networks

#### Mavens
**Definition**: Information specialists who accumulate knowledge and love sharing it.

**Network Signature**:
- High in-degree (people seek them out)
- Central in knowledge-sharing networks (Slack, forums)
- High PageRank (authoritative in their domain)
- Create content that others reference

**Identification Signals**:
- Prolific writers/speakers on specific topics
- Run newsletters, podcasts, or educational content
- Frequently tagged in "who should I follow for X?" threads
- High engagement-to-follower ratio

**HR Value**:
- Know who's good at what (talent intelligence)
- Can validate candidate quality in specialized domains
- Influence how domain practitioners think

#### Salesmen
**Definition**: Persuaders with natural ability to get others to agree.

**Network Signature**:
- High influence propagation (their views spread)
- Strong reciprocal relationships
- Often central in deal-making networks
- Bridge between decision-makers

**Identification Signals**:
- Track record of successful introductions
- Referenced in "how I got my job" stories
- Active in investor/founder/hiring manager circles
- High response rate to outreach

**HR Value**:
- Close candidates who are on the fence
- Navigate complex hiring negotiations
- Connect to decision-makers

### Network Centrality Metrics

#### Betweenness Centrality
**Formula**: BC(v) = Σ (σst(v) / σst) for all s,t pairs
**Meaning**: How often a node lies on shortest paths between other nodes
**HR Interpretation**: "Gatekeeper" or "Bridge" - controls information flow

```python
import networkx as nx
bc = nx.betweenness_centrality(G)
top_brokers = sorted(bc.items(), key=lambda x: x[1], reverse=True)[:10]
```

**When high betweenness matters**:
- Finding people who can introduce you to otherwise unreachable networks
- Identifying informal power centers in organizations
- Locating bottlenecks in knowledge flow

#### Degree Centrality
**Formula**: DC(v) = degree(v) / (n-1)
**Meaning**: Raw count of connections, normalized
**HR Interpretation**: "Popular" - knows many people directly

**When degree matters**:
- Maximizing referral reach
- Event organizing (who to invite for network effects)
- Initial reconnaissance of a new domain

#### Eigenvector Centrality
**Formula**: Recursive: centrality depends on centrality of neighbors
**Meaning**: Connected to other well-connected people
**HR Interpretation**: "Influential" - quality over quantity

**When eigenvector matters**:
- Finding people with access to power
- Identifying rising stars (high eigenvector, modest degree)
- Understanding influence hierarchies

#### Closeness Centrality
**Formula**: CC(v) = (n-1) / Σ d(v,u)
**Meaning**: Average shortest path to all other nodes
**HR Interpretation**: "Accessible" - can reach anyone quickly

**When closeness matters**:
- Finding people who can quickly spread information
- Identifying central positions for new hires
- Communication efficiency analysis

#### PageRank
**Formula**: Iterative probability of random walk landing on node
**Meaning**: Weighted by quality of incoming connections
**HR Interpretation**: "Authoritative" - endorsed by important others

**When PageRank matters**:
- Identifying thought leaders vs. merely prolific
- Weighting referrals by referrer quality
- Academic/publication network analysis

### Structural Holes Theory (Burt)

**Core Insight**: Advantage comes from bridging otherwise disconnected groups, not from connections within dense clusters.

**Key Metrics**:
- **Constraint**: How much a node's network is concentrated in one group
- **Effective Size**: Redundancy-adjusted network size
- **Hierarchy**: Concentration of constraint across contacts

```python
# NetworkX structural holes
constraint = nx.constraint(G)
low_constraint = {k: v for k, v in constraint.items() if v < 0.5}
# These are your broker opportunities
```

**HR Applications**:
- **Recruiting**: Candidates who bridge groups bring diverse information
- **Team Composition**: Mix of connectors and specialists
- **Networking Strategy**: Target structural holes, not cluster centers

## Data Sources & Network Construction

### Primary Data Sources

#### LinkedIn Analysis
**What to extract**:
- Connection overlaps (mutual connections → edge)
- Shared experiences (same company/school → edge weight)
- Endorsement patterns (directional edges)
- Group memberships (bipartite projection)
- Comment/reaction networks on posts

**Ethical considerations**:
- Respect rate limits and ToS
- Use public data only
- Don't scrape private profiles
- Aggregate patterns, don't expose individuals

**Network construction**:
```python
# Bipartite projection from group membership
# People connected if they share groups
from networkx import bipartite
people_projection = bipartite.projected_graph(B, people_nodes)
```

#### Conference & Event Networks
**What to extract**:
- Co-speaking at same event → strong edge
- Same session/track → medium edge
- Same conference → weak edge
- Panel/roundtable co-participation → very strong edge
- Organizer relationships

**High-value conferences by domain**:
- Tech: Strange Loop, QCon, domain-specific (RustConf, ReactConf)
- AI/ML: NeurIPS, ICML, ICLR, domain workshops
- Data: Strata, dbt Coalesce, DataEngConf
- Design: Config, Clarity, Figma events
- Leadership: First Round CEO Summit, a]16z events

#### Publication & Co-authorship Networks
**Sources**:
- Semantic Scholar API (open, good coverage)
- Google Scholar (requires scraping, comprehensive)
- arXiv (preprints, fast-moving fields)
- DBLP (computer science focused)
- PubMed (life sciences)

**Edge weighting**:
- Co-authorship count (repeated collaboration = trust)
- Citation flows (who cites whom)
- Position on author list (first/last = more weight)

**Pattern identification**:
```python
# Find people who collaborate across institutions
cross_institutional = [
    (a1, a2) for (a1, a2) in G.edges()
    if get_institution(a1) != get_institution(a2)
]
```

#### GitHub & Open Source Networks
**What to extract**:
- Repository collaboration (co-contributors)
- Review relationships (who reviews whose PRs)
- Organizational membership
- Sponsorship networks
- Issue/discussion participation

**Signal quality**:
- Sustained collaboration > one-off contribution
- Cross-project collaboration = broader network
- Maintainer relationships = trust indicators

#### Twitter/X Network Analysis
**What to extract**:
- Follow graphs (who follows whom)
- Mutual follows (symmetric relationship)
- Quote-tweet and reply networks (engagement)
- List memberships (curated associations)

**Practical approach**:
- Public lists as starting seeds
- Snowball sampling from known figures
- Identify conversation clusters

#### Reddit & Community Networks
**What to extract**:
- Cross-subreddit posting (bridges communities)
- Comment thread interactions
- Moderator networks
- Frequently referenced usernames

### Network Reconstruction Strategies

#### Multi-Layer Network Fusion
**Approach**: Combine signals from multiple sources

```python
# Weight edges by source reliability
edge_weights = {
    'coauthor': 1.0,      # Strongest signal
    'conference_copanel': 0.8,
    'linkedin_connection': 0.5,
    'github_corepo': 0.6,
    'twitter_mutual': 0.3,
}

# Merge into unified graph
G_unified = nx.Graph()
for source, weight in edge_weights.items():
    for u, v in source_graphs[source].edges():
        if G_unified.has_edge(u, v):
            G_unified[u][v]['weight'] += weight
        else:
            G_unified.add_edge(u, v, weight=weight)
```

#### Entity Resolution
**Challenge**: Same person appears differently across sources
- "Jane Smith" on LinkedIn
- "J. Smith" on papers
- "@janesmith" on Twitter
- "jsmith" on GitHub

**Approaches**:
- Email as unique identifier (when available)
- ORCID for researchers
- LinkedIn URL as canonical
- Fuzzy matching with verification

#### Temporal Network Analysis
**Why it matters**: Networks evolve. Yesterday's connector may be today's isolate.

**Considerations**:
- Recency-weight edges (recent collaboration > old)
- Track rising stars (centrality trajectory)
- Identify fading connections
- Seasonal patterns (conference cycles)

## Analysis Workflows

### Workflow 1: Find Superconnectors for Referrals

**Use case**: "I need to hire 5 ML engineers. Who should I ask?"

**Process**:
1. Define target domain (ML engineering, specific stack/domain)
2. Seed network with known domain members
3. Expand via LinkedIn connections, GitHub repos, conferences
4. Compute betweenness + degree centrality
5. Filter by: still active, accessible, relevant to your needs
6. Rank by referral potential

**Output format**:
```typescript
interface SuperconnectorProfile {
  name: string;
  currentRole: string;

  networkMetrics: {
    betweennessCentrality: number;  // 0-1, higher = more bridging
    degreeCentrality: number;        // 0-1, higher = more connections
    clusterMemberships: string[];    // Which communities they bridge
  };

  gladwellType: 'connector' | 'maven' | 'salesman' | 'hybrid';

  accessibilityScore: number;  // How likely to respond
  relevanceScore: number;      // Match to your specific need

  approachStrategy: string;    // How to reach out
  mutualConnections: string[]; // Who can introduce you
}
```

### Workflow 2: Map Influence in a Domain

**Use case**: "How does influence flow in climate tech?"

**Process**:
1. Define domain boundaries (climate tech = which companies, investors, researchers?)
2. Multi-source network construction
3. Community detection (Louvain, label propagation)
4. Compute influence metrics per community
5. Identify cross-community brokers
6. Map information flow patterns

**Output format**:
```typescript
interface DomainInfluenceMap {
  communities: {
    name: string;
    description: string;
    size: number;
    keyFigures: string[];
    dominantMetric: 'academic' | 'commercial' | 'policy' | 'investment';
  }[];

  brokers: {
    name: string;
    bridgesCommunities: [string, string][];
    influenceVector: number[];  // Per-community influence
  }[];

  informationFlows: {
    source: string;
    target: string;
    flowType: 'ideas' | 'talent' | 'capital' | 'deals';
    strength: number;
  }[];
}
```

### Workflow 3: Optimize Personal Networking Strategy

**Use case**: "I want to break into VC. Who should I connect with?"

**Process**:
1. Map user's current network (LinkedIn export, provided list)
2. Map target domain network (VC ecosystem)
3. Find shortest paths from current network to target
4. Identify structural holes user could fill
5. Prioritize connections by:
   - Reachability (can you actually connect?)
   - Bridge potential (do they connect to people you don't know?)
   - Domain match (are they in your target area?)

**Output format**:
```typescript
interface NetworkingStrategy {
  currentPosition: {
    communities: string[];
    strengthAreas: string[];
    structuralHoles: string[];  // Opportunities to bridge
  };

  targetConnections: {
    priority: 'high' | 'medium' | 'low';
    name: string;
    reason: string;  // Why this person
    pathway: string[];  // Chain of introductions
    approachAngle: string;  // What value you offer
  }[];

  communityTargets: {
    community: string;
    entryPoints: string[];  // Accessible members
    value: string;  // Why this community matters
  }[];
}
```

### Workflow 4: Organizational Network Analysis (ONA)

**Use case**: "Map how information flows in our 500-person company"

**Process**:
1. Data collection (surveys, Slack/email metadata, meeting patterns)
2. Construct communication/collaboration graph
3. Identify informal vs formal structure
4. Find hidden influencers and bottlenecks
5. Detect silos and integration opportunities

**Output format**:
```typescript
interface ONAReport {
  formalVsInformal: {
    person: string;
    formalRole: string;
    informalRole: 'connector' | 'bottleneck' | 'isolate' | 'bridge';
    gap: string;  // Difference between formal and informal power
  }[];

  silos: {
    teams: string[];
    bridgePeople: string[];
    integrationOpportunity: string;
  }[];

  bottlenecks: {
    person: string;
    constrainedFlows: string[];
    risk: string;
    mitigation: string;
  }[];

  hiddenInfluencers: {
    person: string;
    influenceType: string;
    formalRecognition: boolean;
    recommendation: string;
  }[];
}
```

## Implementation Tools

### Python Ecosystem

```python
# Core graph libraries
import networkx as nx           # General purpose, easy to use
import graph_tool.all as gt     # Fast, good visualization
import igraph                   # Fast community detection

# Data processing
import pandas as pd
from scipy import sparse

# Visualization
import matplotlib.pyplot as plt
from pyvis.network import Network  # Interactive HTML visualization

# Entity resolution
from fuzzywuzzy import fuzz
import recordlinkage
```

### Common Patterns

```python
# Load and analyze a professional network
def analyze_professional_network(edges_df):
    """
    edges_df: DataFrame with columns [source, target, weight, source_type]
    """
    G = nx.from_pandas_edgelist(
        edges_df,
        source='source',
        target='target',
        edge_attr=['weight', 'source_type']
    )

    # Compute all centrality metrics
    metrics = {
        'betweenness': nx.betweenness_centrality(G, weight='weight'),
        'degree': nx.degree_centrality(G),
        'eigenvector': nx.eigenvector_centrality(G, weight='weight'),
        'pagerank': nx.pagerank(G, weight='weight'),
        'closeness': nx.closeness_centrality(G),
    }

    # Structural holes
    constraint = nx.constraint(G, weight='weight')

    # Community detection
    communities = nx.community.louvain_communities(G)

    # Classify nodes
    def classify_gladwell(node):
        bc = metrics['betweenness'][node]
        dc = metrics['degree'][node]
        ec = metrics['eigenvector'][node]

        if bc > 0.1 and dc > 0.1:
            return 'connector'
        elif ec > 0.1 and dc < 0.05:
            return 'maven'
        elif dc > 0.05 and constraint.get(node, 1) < 0.3:
            return 'salesman'
        else:
            return 'standard'

    return {
        'metrics': metrics,
        'constraint': constraint,
        'communities': communities,
        'classifications': {n: classify_gladwell(n) for n in G.nodes()}
    }
```

### Visualization Approaches

```python
# Interactive network visualization
def visualize_network_html(G, metrics, output_path='network.html'):
    net = Network(height='800px', width='100%', bgcolor='#222222')

    # Size by betweenness, color by community
    for node in G.nodes():
        size = 10 + 50 * metrics['betweenness'][node]
        net.add_node(node, size=size, title=f"BC: {metrics['betweenness'][node]:.3f}")

    for edge in G.edges():
        net.add_edge(edge[0], edge[1])

    net.show(output_path)
```

## Ethical Guidelines

### What's Acceptable
- Analyzing public data (conference speakers, publications, public LinkedIn)
- Aggregate pattern analysis (trends, not individuals)
- Opt-in organizational analysis (employee surveys)
- Academic research with proper IRB

### What's NOT Acceptable
- Scraping private profiles without consent
- Building surveillance systems disguised as networking tools
- Selling individual data without consent
- Discrimination based on network position
- Stalking or harassment enablement

### Best Practices
- Anonymize individual results when possible
- Focus on patterns, not personal details
- Provide value to the people being analyzed
- Be transparent about data collection
- Allow opt-out from organizational analysis

## When NOT to Use

This skill is NOT appropriate for:
- **Surveillance**: Tracking individuals without consent
- **Discrimination**: Using network position to exclude
- **Manipulation**: Engineering social influence for harm
- **Privacy violation**: Accessing non-public data
- **Speculation without data**: Guessing network structure

## Common Anti-Patterns

### Anti-Pattern: Degree Obsession
**What it looks like**: Only looking at who has most connections
**Why it's wrong**: High degree often means noise; connectors differ from popular
**What to do instead**: Use betweenness for bridging, eigenvector for influence quality

### Anti-Pattern: Static Network Assumption
**What it looks like**: Treating 5-year-old connections as current
**Why it's wrong**: Networks evolve; old edges may be dead
**What to do instead**: Recency-weight edges, verify currency of relationships

### Anti-Pattern: Single-Source Reliance
**What it looks like**: Using only LinkedIn data
**Why it's wrong**: Missing professional relationships not on LinkedIn
**What to do instead**: Multi-source fusion with source-appropriate weighting

### Anti-Pattern: Ignoring Context
**What it looks like**: High betweenness = valuable, regardless of domain
**Why it's wrong**: Bridging irrelevant communities isn't useful
**What to do instead**: Constrain analysis to relevant domain boundaries

## Troubleshooting

### Issue: Can't find enough data
**Cause**: Domain is small or private
**Fix**: Use snowball sampling from known seeds. Consider surveys. Look for adjacent public communities.

### Issue: Too many false edges
**Cause**: Over-weighting weak signals (e.g., same conference attendance)
**Fix**: Require multiple independent signals for edge. Increase edge weight threshold.

### Issue: Network too large to analyze
**Cause**: Unconstrained boundary definition
**Fix**: Apply k-core filtering, focus on high-weight edges, subsample by community.

### Issue: Entity resolution failures
**Cause**: Same person, different names across sources
**Fix**: Use unique identifiers (ORCID, email), manual verification for high-centrality nodes.

## Integration with Other Skills

Works well with:
- **Career Biographer**: Network position informs career narrative framing
- **Competitive Cartographer**: Map competitive landscape through relationship lens
- **Research Analyst**: Deep dive on identified key figures
- **CV Creator**: Leverage network insights for positioning

## Example Analysis: AI Safety Superconnectors

**Domain**: AI Safety research community, 2020-2024

**Data Sources Used**:
- arXiv preprints with "AI safety" keywords
- NeurIPS/ICML workshop organizers
- 80,000 Hours job board postings
- AI safety-focused Twitter lists

**Top Connectors Identified** (fictional example):
1. **Dr. A** - Bridges academic labs and policy orgs
   - Betweenness: 0.23 (very high)
   - Communities: Berkeley CHAI, UK AI Safety Institute, Anthropic
   - Type: Connector + Maven hybrid

2. **B** - Connects technical and governance worlds
   - Betweenness: 0.18
   - Communities: DeepMind, CAIS, FHI
   - Type: Broker/Salesman

3. **C** - Information hub for field entrants
   - PageRank: 0.09 (high in-degree)
   - Creates educational content, runs reading groups
   - Type: Maven

**Structural Holes Identified**:
- Gap between compute governance researchers and ML safety researchers
- Bridge opportunity: Someone spanning both could be valuable hire

**Networking Recommendations**:
- Entry point to field: Dr. A's reading group
- For policy roles: B can make introductions
- For research roles: C's newsletter community
