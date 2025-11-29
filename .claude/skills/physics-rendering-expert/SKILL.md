---
name: physics-rendering-expert
description: "Real-time rope/cable physics using Position-Based Dynamics (PBD), Verlet integration, and constraint solvers. Expert in quaternion math, Gauss-Seidel/Jacobi solvers, and tangling detection. Activate on 'rope simulation', 'PBD', 'Position-Based Dynamics', 'Verlet', 'constraint solver', 'quaternion', 'cable dynamics', 'cloth simulation', 'leash physics'. NOT for fluid dynamics (SPH/MPM), fracture simulation (FEM), offline cinematic physics, molecular dynamics, or general game physics engines (use Unity/Unreal built-ins)."
allowed-tools: Read,Write,Edit,Bash,mcp__firecrawl__firecrawl_search,WebFetch
---

# Physics & Rendering Expert: Rope Dynamics & Constraint Solving

Expert in computational physics for real-time rope/cable dynamics, constraint solving, and physically-based simulations. Specializes in PBD, Verlet integration, quaternion math, and multi-body tangling.

## When to Use This Skill

✅ **Use for:**
- Real-time rope/cable/chain simulation (leashes, climbing ropes)
- Position-Based Dynamics (PBD) implementation
- Constraint solvers (Gauss-Seidel, Jacobi)
- Quaternion/dual-quaternion rotation math
- Verlet integration for particle systems
- Tangle detection (multi-rope collisions)
- Character physics (hair, cloth attachments)

❌ **Do NOT use for:**
- Fluid dynamics → specialized SPH/MPM solvers
- Fracture simulation → requires FEM or MPM
- Offline cinematic physics → different constraints
- Molecular dynamics → quantum-scale physics
- Unity/Unreal physics → use built-in systems
- Rigid body engines → use Bullet/PhysX directly

## MCP Integrations

| MCP | Purpose |
|-----|---------|
| **Firecrawl** | Research SIGGRAPH papers, physics algorithms |
| **WebFetch** | Fetch documentation, academic papers |

## Expert vs Novice Shibboleths

| Topic | Novice | Expert |
|-------|--------|--------|
| **Constraint approach** | Uses spring forces (F=ma) | Uses PBD (directly manipulates positions) |
| **Why PBD** | "Springs work fine" | Knows springs require tiny timesteps for stiffness; PBD is unconditionally stable |
| **Solver choice** | "Just iterate until done" | Gauss-Seidel for chains (fast convergence), Jacobi for GPU (parallelizable) |
| **Iterations** | 20+ iterations | Knows 5-10 is optimal; diminishing returns after |
| **Rotation** | Uses Euler angles | Uses quaternions (no gimbal lock, stable composition) |
| **Skinning** | Linear blend skinning | Dual quaternions (no candy-wrapper artifact) |
| **Integration** | Forward Euler | Verlet (symplectic, energy-conserving, second-order) |
| **Collision** | Per-frame point checks | Continuous collision detection with segment-segment distance |

## Common Anti-Patterns

### Anti-Pattern: Force-Based Springs for Stiff Constraints
**What it looks like**: `force = k * (distance - rest_length)` with high spring constant
**Why it's wrong**: High `k` requires tiny `dt` for stability; low `k` gives squishy ropes
**What to do instead**: Use PBD - directly move particles to satisfy constraints
```cpp
// BAD: Requires tiny timesteps
vec3 force = normalize(delta) * k * (distance - rest_length);

// GOOD: PBD constraint (stable at any timestep)
float error = distance - rest_length;
vec3 correction = (error / (distance * (w1 + w2))) * delta;
p1.position += w1 * correction;
p2.position -= w2 * correction;
```

### Anti-Pattern: Euler Angles for Rotation
**What it looks like**: `rotation = vec3(pitch, yaw, roll)` with sequential axis rotations
**Why it's wrong**: Gimbal lock at 90° pitch; order-dependent; unstable under composition
**What to do instead**: Use quaternions - 4 numbers, no gimbal lock, stable SLERP
**How to detect**: Look for `euler`, `pitch/yaw/roll`, or 3x3 rotation matrices being composed repeatedly

### Anti-Pattern: Synchronous Collision Detection
**What it looks like**: Point-in-volume checks once per frame
**Why it's wrong**: Fast-moving particles tunnel through obstacles between frames
**What to do instead**: Continuous collision detection (CCD) with swept volumes or segment tests

### Anti-Pattern: Over-Iteration
**What it looks like**: `solver_iterations = 50` or higher
**Why it's wrong**: Diminishing returns after 5-10 iterations; wastes CPU/GPU cycles
**What to do instead**: Use 5-10 iterations with proper stiffness; if more needed, use XPBD compliance

### Anti-Pattern: Single-Threaded Gauss-Seidel for Large Systems
**What it looks like**: Gauss-Seidel on 1000+ constraints in a complex mesh
**Why it's wrong**: Gauss-Seidel is inherently sequential; can't parallelize
**What to do instead**: Use Jacobi solver for GPU parallelization (accumulate corrections, average)

## Evolution Timeline

### Pre-2006: Force-Based Physics
- Mass-spring systems dominated
- Stability required tiny timesteps
- Stiff ropes = unstable simulations

### 2006-2015: Position-Based Dynamics Era
- Müller et al. (2006) introduced PBD
- Unconditional stability revolutionized real-time physics
- Gauss-Seidel became standard for game physics

### 2016-2020: XPBD and Compliance
- Extended PBD added compliance for soft constraints
- Better control over stiffness vs. iteration count
- GPU Jacobi solvers mature

### 2021-2024: Modern Advances
- **XPBD** now standard in Unreal/Unity
- **ALEM** (2024 SIGGRAPH): Lagrangian-Eulerian modal analysis for cables
- **BDEM** (2024): Bonded discrete element method with manifold optimization
- Neural physics for learned dynamics

### 2025+: Current Best Practices
- XPBD with 5-10 iterations for real-time
- Hybrid CPU/GPU pipelines
- Learned corrections for complex materials
- On-device physics for mobile/VR

## Core Concepts

### Position-Based Dynamics (PBD)

**Why PBD beats force-based physics:**
- ✅ Unconditionally stable (large timesteps OK)
- ✅ Direct control over constraint satisfaction
- ✅ No spring constants to tune
- ✅ Predictable behavior

**PBD Loop:**
1. **Predict**: Apply forces, compute predicted positions
2. **Solve**: Iteratively project constraints (distance, bending, collision)
3. **Update**: Derive velocity from position change

```cpp
void pbd_update(float dt) {
    // Step 1: Predict
    for (auto& p : particles) {
        if (p.inverse_mass == 0.0f) continue;
        p.velocity += gravity * dt;
        p.predicted = p.position + p.velocity * dt;
    }

    // Step 2: Solve constraints (5-10 iterations)
    for (int i = 0; i < solver_iterations; ++i) {
        solve_distance_constraints();
        solve_bending_constraints();
        solve_collisions();
    }

    // Step 3: Update
    for (auto& p : particles) {
        p.velocity = (p.predicted - p.position) / dt;
        p.position = p.predicted;
    }
}
```

### Distance Constraint

```cpp
void solve_distance(Particle& p1, Particle& p2, float rest_length) {
    vec3 delta = p2.predicted - p1.predicted;
    float dist = length(delta);
    if (dist < 1e-6f) return;

    float error = dist - rest_length;
    float w_sum = p1.inverse_mass + p2.inverse_mass;
    if (w_sum < 1e-6f) return;

    vec3 correction = (error / (dist * w_sum)) * delta;
    p1.predicted += p1.inverse_mass * correction;
    p2.predicted -= p2.inverse_mass * correction;
}
```

### Solver Choice

| Solver | Parallelizable | Convergence | Use Case |
|--------|---------------|-------------|----------|
| **Gauss-Seidel** | No | Fast | Chains, ropes (sequential structure) |
| **Jacobi** | Yes (GPU) | Slower | Large meshes, cloth, GPU physics |

**Gauss-Seidel**: Updates positions immediately; next constraint sees updated values.

**Jacobi**: Accumulates corrections; applies averaged result. Requires more iterations but GPU-parallelizable.

### Verlet Integration

**Why Verlet > Euler:**
- ✅ Symplectic (conserves energy)
- ✅ Second-order accurate
- ✅ No explicit velocity storage needed
- ✅ Time-reversible

```cpp
void verlet_step(Particle& p, vec3 accel, float dt) {
    vec3 new_pos = 2.0f * p.position - p.prev_position + accel * dt * dt;
    p.prev_position = p.position;
    p.position = new_pos;
    // Velocity if needed: (position - prev_position) / dt
}
```

### Quaternion Essentials

**Why quaternions:**
- ✅ No gimbal lock
- ✅ Compact (4 floats vs 9 for matrix)
- ✅ Smooth SLERP interpolation
- ✅ Stable composition

**Key operations:**
- `q * q'` = compose rotations
- `q * v * q*` = rotate vector
- `normalize(q)` = after every operation
- `slerp(q1, q2, t)` = smooth interpolation

### Tangle Detection (Multi-Rope)

For leash/cable tangling, use segment-segment distance:

```cpp
float segment_distance(vec3 p1, vec3 p2, vec3 q1, vec3 q2) {
    vec3 u = p2 - p1, v = q2 - q1, w = p1 - q1;
    float a = dot(u,u), b = dot(u,v), c = dot(v,v);
    float d = dot(u,w), e = dot(v,w);
    float denom = a*c - b*b;

    float s = clamp((b*e - c*d) / denom, 0, 1);
    float t = clamp((a*e - b*d) / denom, 0, 1);

    return length((q1 + t*v) - (p1 + s*u));
}
```

Check all segment pairs between ropes; if distance < rope_diameter, resolve collision.

### Tangle Formation Physics (Crossings → Physical Constraints)

**Critical insight**: Tangle DETECTION is not tangle PHYSICS. Detecting crossings for braid words is different from simulating the physical constraint that forms when ropes interlock.

**When crossings become physical constraints:**
1. Two rope segments cross (distance < rope_diameter)
2. Tension exists on one or both ropes (pulling them apart)
3. The crossing geometry prevents separation (wrap angle > threshold)

**The key difference:**
- **Detection only**: Ropes pass through each other, we just record the event
- **Physical tangle**: Ropes cannot pass through; crossing creates a new constraint point

#### TangleConstraint: Dynamic Constraint Creation

When a physical tangle forms, create a **TangleConstraint** between the closest particles on each rope:

```cpp
class TangleConstraint {
    Particle* p1;           // Closest particle on rope A
    Particle* p2;           // Closest particle on rope B
    float rest_distance;    // Distance at formation (typically rope_diameter)
    float friction;         // Capstan friction coefficient
    float wrap_angle;       // Accumulated wrap (affects friction)
    bool is_locked;         // Has tightened past threshold

    void solve() {
        vec3 delta = p2->predicted - p1->predicted;
        float dist = length(delta);

        // Tangle constraint acts like distance constraint
        // but with friction-dependent rest length
        float effective_rest = is_locked ?
            rest_distance * 0.5f :  // Tightened
            rest_distance;          // Initial

        if (dist < effective_rest) return; // Don't push apart

        float error = dist - effective_rest;
        float w_sum = p1->inverse_mass + p2->inverse_mass;

        // Apply friction-scaled correction (Capstan effect)
        float friction_factor = exp(friction * wrap_angle);
        vec3 correction = (error / (dist * w_sum)) * delta;
        correction *= min(friction_factor, 3.0f); // Cap for stability

        p1->predicted += p1->inverse_mass * correction;
        p2->predicted -= p2->inverse_mass * correction;
    }
};
```

#### Capstan Equation: Friction at Crossings

The **Capstan equation** governs friction amplification at rope crossings:

```
T₂ = T₁ × e^(μθ)
```

Where:
- `T₁` = tension on one side
- `T₂` = tension on other side (amplified by wrap)
- `μ` = friction coefficient (0.3-0.8 for rope on rope)
- `θ` = wrap angle in radians

**Practical implication**: Even 90° of wrap (π/2) with μ=0.5 gives T₂ = 2.2 × T₁. A full 360° wrap gives T₂ = 23 × T₁. This is why knots tighten!

```cpp
float capstan_friction(float tension_in, float wrap_angle, float mu = 0.5f) {
    return tension_in * exp(mu * wrap_angle);
}
```

#### Tangle Formation Detection

```cpp
struct TangleCandidate {
    int rope_a_segment;
    int rope_b_segment;
    vec3 crossing_point;
    float wrap_angle;
    bool forms_physical_tangle;
};

TangleCandidate check_tangle_formation(
    Particle& a1, Particle& a2,  // Segment A
    Particle& b1, Particle& b2,  // Segment B
    float rope_diameter
) {
    // 1. Check segment-segment distance
    auto [closest_a, closest_b, dist] = segment_closest_points(a1, a2, b1, b2);

    if (dist > rope_diameter) return {.forms_physical_tangle = false};

    // 2. Check if tension would tighten (not just touch and separate)
    vec3 tension_a = (a2.predicted - a1.predicted).normalized();
    vec3 tension_b = (b2.predicted - b1.predicted).normalized();
    vec3 separation = (closest_b - closest_a).normalized();

    // Dot products indicate if pulling would tighten
    float pull_a = dot(tension_a, separation);
    float pull_b = dot(tension_b, -separation);

    bool would_tighten = (pull_a > 0.3f) || (pull_b > 0.3f);

    // 3. Compute wrap angle (how much rope curves around crossing)
    float wrap_angle = acos(clamp(dot(tension_a, tension_b), -1.0f, 1.0f));

    return {
        .crossing_point = (closest_a + closest_b) * 0.5f,
        .wrap_angle = wrap_angle,
        .forms_physical_tangle = would_tighten && wrap_angle > 0.5f // ~30°
    };
}
```

#### Tangle Lifecycle

1. **Detection**: Segment distance < threshold
2. **Formation**: Tension + geometry = physical constraint created
3. **Tightening**: Under continued tension, rest_distance decreases (knot tightens)
4. **Locking**: Past threshold, tangle becomes "locked" (much harder to undo)
5. **Breaking**: Extreme force OR deliberate untangling action

```cpp
void update_tangle(TangleConstraint& tangle, float dt) {
    // Measure local tension
    float tension = measure_rope_tension_at(tangle.p1) +
                   measure_rope_tension_at(tangle.p2);

    // Tighten under tension
    if (tension > TIGHTEN_THRESHOLD && !tangle.is_locked) {
        tangle.rest_distance *= (1.0f - 0.1f * dt); // Gradual tightening
        tangle.rest_distance = max(tangle.rest_distance, MIN_TANGLE_DISTANCE);
    }

    // Lock if tightened enough
    if (tangle.rest_distance < LOCK_THRESHOLD) {
        tangle.is_locked = true;
    }

    // Update wrap angle based on local geometry
    tangle.wrap_angle = compute_local_wrap_angle(tangle);
}
```

### Anti-Patterns: Tangle Simulation

#### Anti-Pattern: Detection Without Physics
**What it looks like**: Recording braid words but ropes pass through each other
**Why it's wrong**: Braid tracking ≠ physical simulation; user sees ropes ghost through
**What to do instead**: Create TangleConstraints when crossings form; resolve as constraints in PBD loop

#### Anti-Pattern: Treating All Crossings as Tangles
**What it looks like**: Every segment intersection creates a constraint
**Why it's wrong**: Brief touches aren't tangles; creates explosion of unnecessary constraints
**What to do instead**: Check tension direction and wrap angle; only form tangle if would tighten

#### Anti-Pattern: Capsule Collision for Tangle Physics
**What it looks like**: Using thick capsule collision volumes around rope segments
**Why it's wrong**: Causes instability ("violent explosions" per Starframe devs); tunneling issues
**What to do instead**: Point-based collision with adaptive particle placement; or overlapping circular colliders

#### Anti-Pattern: Ignoring Directional Friction
**What it looks like**: Symmetric friction in all directions at crossing points
**Why it's wrong**: Real rope friction is directional (Capstan effect); symmetric friction feels wrong
**What to do instead**: Apply Capstan equation with wrap angle; or disable static friction entirely for simplicity

#### Anti-Pattern: Immediate Lock on Contact
**What it looks like**: `if (crossed) tangle.is_locked = true`
**Why it's wrong**: Real tangles form gradually under tension; instant lock feels jarring
**What to do instead**: Gradual tightening over time; lock only after rest_distance < threshold

### Tangle Decision Tree

**Should this crossing become a TangleConstraint?**
1. Distance < rope_diameter? → Continue
2. Already have a TangleConstraint for this pair? → Skip (update existing)
3. Would tension tighten (not separate) the ropes? → Continue
4. Wrap angle > 30°? → **Create TangleConstraint**
5. Otherwise → Ignore (transient contact)

**When to break a TangleConstraint?**
1. Distance > 2× rest_distance for sustained period → Break
2. External "untangle" action triggered → Break
3. is_locked == true → Much harder to break (require specific manipulation)

### Tangle Expert vs Novice Shibboleths

| Topic | Novice | Expert |
|-------|--------|--------|
| **Crossing = tangle** | "Detected crossing, add constraint" | "Check tension direction + wrap angle first" |
| **Friction model** | Symmetric Coulomb friction | Capstan equation (exponential with wrap) |
| **Collision volumes** | Capsules around segments | Point-based or circular with overlap |
| **Tightening** | Instant or none | Gradual under tension, lock at threshold |
| **Constraint creation** | At detection time | At PBD loop step 7 (after position prediction) |

## Performance Targets

| System | Budget | Notes |
|--------|--------|-------|
| Single rope (100 particles) | &lt;0.5ms | 5 iterations sufficient |
| Three-dog leash (60 particles) | &lt;0.7ms | Include tangle detection |
| Cloth (1000 particles) | &lt;2ms | Use Jacobi on GPU |
| Hair (10k strands) | &lt;5ms | LOD + GPU required |

## Integrates With

- **metal-shader-expert** - GPU compute shaders for Jacobi solver
- **vr-avatar-engineer** - Real-time character physics in VR
- **native-app-designer** - Visualization and debugging UI

## Quick Decision Tree

**Choosing constraint solver:**
- Sequential structure (rope/chain)? → Gauss-Seidel
- Large parallel system (cloth/hair)? → Jacobi (GPU)
- Need soft constraints? → XPBD with compliance

**Choosing integration:**
- Position-only needed? → Basic Verlet
- Need velocity for forces? → Velocity Verlet
- High accuracy required? → RK4 (but PBD usually sufficient)

**Rotation representation:**
- 3D rotation? → Quaternion (never Euler)
- Rotation + translation? → Dual quaternion
- Skinning/blending? → Dual quaternion (no candy-wrapper)

---

**For complete implementations**: See `/references/implementations.md`

**Remember**: Real-time physics is about stability and visual plausibility, not physical accuracy. PBD with 5-10 iterations at 60fps looks great and runs fast. Don't over-engineer.
