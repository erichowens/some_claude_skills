---
sidebar_label: Design Justice
sidebar_position: 1
---

# 🏠 Design Justice

Digital equity and trauma-informed design for marginalized populations. Activate on "accessibility", "offline-first", "trauma-informed", "reentry", "recovery population", "shared device", "unstable phone", "digital equity", "design justice", "low-literacy", "intermittent access". NOT for general UX, marketing optimization, or enterprise SaaS design.

---

## Allowed Tools

```
Read, Write, Edit, Glob, Grep
```

## Tags

`accessibility` `trauma-informed` `equity` `civic-tech` `offline-first`

## References

- [Authentication Patterns for Unstable Phone Access](./references/authentication-patterns)
- [Code for America Learnings](./references/code-for-america-learnings)
- [Offline-First Patterns for Intermittent Access](./references/offline-first-patterns)
- [Trauma-Informed Language Guide](./references/trauma-informed-language)

# Design Justice: Equity-Centered Digital Design

Design for the margins, benefit the center. If it works for someone with no stable phone, unstable housing, trauma history, and low digital literacy → it works better for everyone.

## Philosophy

**Design Justice** (Sasha Costanza-Chock) + **Trauma-Informed Design** + **Digital Equity Design**

Core principle: The people most impacted by design decisions should be centered in the design process, not treated as edge cases.

## When to Use

✅ **Use for**:
- Apps serving recovery/reentry populations
- Government/civic tech applications
- Healthcare portals for vulnerable populations
- Housing/benefits applications
- Legal aid and court self-help tools
- Nonprofit service delivery platforms
- Any app used on shared/public devices

❌ **NOT for**:
- Enterprise B2B SaaS (different constraints)
- Marketing funnel optimization
- Gamification/engagement maximization
- Social media features
- General "make it pretty" UX requests

---

## Decision Tree: Which Pattern Applies?

```
User has unstable phone number?
├── YES → See: Authentication Without Stable Phones
└── NO → Standard auth OK

User may lose internet mid-task?
├── YES → See: Offline-First Design
└── NO → Standard web patterns OK

User may be on shared/public device?
├── YES → See: Shared Device Privacy
└── NO → Standard session management OK

Form is complex or emotionally difficult?
├── YES → See: Trauma-Informed Forms
└── NO → Standard form patterns OK

User has history of system trauma?
├── YES → Apply ALL trauma-informed patterns
└── UNKNOWN → Assume YES for civic/legal/benefits apps
```

---

## Pattern 1: Authentication Without Stable Phones

### Anti-Pattern: Phone-First Auth

**Novice thinking**: "Everyone has a phone, SMS 2FA is secure"

**Reality**:
- 25% of formerly incarcerated people lack stable phone access
- Phone numbers change frequently during housing instability
- Prepaid phones get disconnected for non-payment
- SMS 2FA locks people out of critical services

**Timeline**:
- Pre-2020: SMS 2FA considered best practice
- 2020+: Code for America documented access barriers
- 2024+: Email-first + backup codes emerging as standard for civic tech

### Correct Patterns

| Need | Pattern | Implementation |
|------|---------|----------------|
| Primary auth | Email-first | Email is identifier, phone optional |
| 2FA | Multiple pathways | Email OR backup codes OR case worker verification |
| Recovery | Printable codes | One-time codes that can be written down |
| Bypass | Trusted intermediary | Case managers verify via org email |
| Essential access | No-signup mode | Core features work without account |

### Implementation Checklist

```
□ Email is primary identifier (phone optional)
□ Backup codes can be printed/written
□ Case worker recovery pathway exists
□ Core features work without login
□ Sessions are not device-locked
□ Phone number changes don't lock accounts
□ "Forgot password" has non-SMS option
```

---

## Pattern 2: Offline-First / Intermittent Access

### Anti-Pattern: Always-Online Assumption

**Novice thinking**: "Just show 'No connection' error"

**Reality**:
- Public library computers have session limits
- Mobile data runs out mid-month
- Shelter wifi is unreliable
- Users may have ONE chance to complete a form

### Correct Patterns

| Need | Pattern | Implementation |
|------|---------|----------------|
| Data persistence | Local-first | Save to localStorage/IndexedDB immediately |
| Form state | Auto-save | Save every field change, not just on submit |
| Submission | Background sync | Queue actions, sync when connection returns |
| UI feedback | Optimistic updates | Update UI immediately, sync in background |
| Progress | Resume anywhere | Let users pick up exactly where they left off |
| Status | Visible sync state | "Saved locally" / "Syncing..." / "Up to date" |
| Degradation | Graceful offline | Core features work without network |

### Implementation Checklist

```
□ PWA with service worker caching
□ All form data saves to localStorage on every change
□ Clear sync status indicator visible
□ Offline mode tested (airplane mode)
□ Background sync when connection returns
□ No data loss on connection drop (verified)
□ Multi-step flows don't timeout
□ Minimal asset downloads (text-first views available)
```

### Code Pattern: Auto-Save Hook

```typescript
// Save form state on every change
function useAutoSave(key: string, data: any) {
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify({
      data,
      savedAt: new Date().toISOString(),
      synced: false
    }));
  }, [key, data]);

  // Return saved data on mount
  return useMemo(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved).data : null;
  }, [key]);
}
```

---

## Pattern 3: Shared/Public Device Privacy

### Anti-Pattern: Persistent Sessions

**Novice thinking**: "Remember me improves UX"

**Reality**:
- Library computers used by multiple people
- Shelter computers are shared
- Previous user's data visible = safety risk
- Domestic violence survivors need privacy

### Correct Patterns

| Need | Pattern | Implementation |
|------|---------|----------------|
| Default state | Privacy mode ON | Don't auto-save sensitive info |
| Logout | Prominent button | Make it obvious, not buried in menu |
| Timeout | Warning + auto-logout | "5 min left. Continue?" |
| Forms | No autofill default | Disable browser autofill on sensitive fields |
| Mode toggle | "Public computer?" | One-click extra privacy mode |
| Cookies | Session-only option | Clear on browser close |

### Implementation Checklist

```
□ "Remember me" is UNCHECKED by default
□ Logout button visible on every page
□ Session timeout with save-progress warning
□ Sensitive fields have autocomplete="off"
□ Incognito mode suggested in UI for public computers
□ No cached personal data after logout
□ "Working on a shared computer?" toggle available
```

---

## Pattern 4: Trauma-Informed Forms & Flows

### Anti-Pattern: Bureaucratic Interrogation

**Novice thinking**: "Collect all info upfront for efficiency"

**Reality**:
- Long forms trigger overwhelm and abandonment
- Red error text is shame-triggering
- Legal jargon creates anxiety
- Surprise requirements feel like traps
- "Tell your story" boxes are cognitively overwhelming

### Correct Patterns

| Need | Pattern | Implementation |
|------|---------|----------------|
| Length | Chunked progress | Break into short sections, save each |
| Language | Plain language | 6th-8th grade reading level |
| Complexity | One question/page | For difficult topics |
| Progress | Clear indicators | "Step 2 of 5" always visible |
| Validation | Forgiving input | Auto-format, accept variations |
| Defaults | Smart prefill | Pre-fill what you can infer |
| Help | Inline, not hidden | Help text visible, not in modals |
| Flow | Skip and return | Never force-block on optional fields |

### Tone Guidelines

✅ **Use**:
- Person-first language: "Person with a conviction"
- Transparent timelines: "We'll review in 3-5 days"
- Acknowledgment: "This process can be frustrating"
- Affirming: "You're making progress"

❌ **Avoid**:
- Shame language: "Your criminal past..."
- Vague timelines: "We'll get back to you"
- Blame: "You didn't complete..."
- Guilt assumptions: "Your offense..."

### Color & Visual Guidelines

```
✅ Calm palette:
- Success: Soft green (#4a9d9e), not aggressive lime
- Warning: Warm amber (#d4a03a), not alarming yellow
- Error: Muted terracotta (#c97a5d), not aggressive red
- Background: Cream/warm neutrals

❌ Avoid:
- Aggressive red for errors
- High-contrast warning colors
- Flashing or pulsing elements
- Visual "alarm" states
```

### Implementation Checklist

```
□ No form longer than 5 fields per page
□ Progress indicator on all multi-step flows
□ Help text inline, not in tooltips/modals
□ Forgiving validation (formats automatically)
□ No required fields that aren't truly required
□ "Skip for now" on optional sections
□ Calm color palette (no aggressive reds)
□ Person-first language throughout
□ Clear "what happens next" on every screen
```

---

## Pattern 5: Expungement/Record Clearance Specific

### Anti-Pattern: Assuming User Knowledge

**Novice thinking**: "They know their case numbers"

**Reality**:
- People don't remember case numbers from years ago
- Legal terminology is confusing
- County/jurisdiction boundaries are unclear
- Documents may be inaccessible

### Correct Patterns

| Need | Pattern | Implementation |
|------|---------|----------------|
| Eligibility | Checker first | Show if qualified BEFORE collecting info |
| Documents | Multiple upload methods | Email, fax, mail, in-person, photo |
| Location | Auto-detection | Don't make them figure out jurisdiction |
| Records | Lookup tools | Help them find their own case numbers |
| Terms | Plain language | Define every legal term |
| Timeline | Explicit expectations | "Most cases take 60-90 days" |
| Fees | Waiver prominent | Fee waiver should be default path |

### Implementation Checklist

```
□ Eligibility checker before signup/info collection
□ Case number lookup tool or "I don't know" option
□ County auto-detected from address
□ Document upload alternatives (not just scan)
□ Legal terms have inline definitions
□ Expected timeline stated clearly
□ Fee waiver is default, not hidden option
□ "Not eligible" includes explanation WHY
```

---

## Code for America Principles

The gold standard for civic tech:

1. **Automatic > Petition-based** - Don't require action from people with records
2. **No-cost by default** - Fee waivers automatic, not applied for
3. **Government does the work** - Don't burden individuals
4. **Co-design with impacted people** - Not just user research ON them
5. **Assume gaps in data** - Design around incomplete records
6. **Backend automation** - Minimal staff time, no manual bottlenecks

---

## Quick Audit Checklist

Run this against any civic/legal/benefits application:

```
AUTHENTICATION
□ Can user sign up with just email?
□ Is there a non-SMS account recovery option?
□ Do core features work without login?

OFFLINE/INTERMITTENT
□ Does form data survive connection loss?
□ Is there visible "saved" indicator?
□ Can user resume exactly where they left off?

SHARED DEVICES
□ Is "remember me" unchecked by default?
□ Is logout button prominent?
□ Does session timeout with warning?

FORMS
□ Is reading level ≤8th grade?
□ Are there ≤5 fields per page?
□ Is help text inline (not hidden)?
□ Are required fields truly required?

TONE
□ Is language person-first?
□ Are timelines explicit?
□ Is error messaging non-blaming?
□ Are colors calm (no aggressive red)?

LEGAL/EXPUNGEMENT SPECIFIC
□ Is eligibility checked first?
□ Are fee waivers prominent?
□ Is "I don't know my case number" handled?
```

---

## References

- `/references/authentication-patterns.md` - Detailed auth implementation
- `/references/offline-first-patterns.md` - PWA and sync patterns
- `/references/trauma-informed-language.md` - Tone and word choice guide
- `/references/code-for-america-learnings.md` - CfA case studies

## Key Readings

- Design Justice Network principles
- Code for America's design principles
- C4 Innovations equity work (homeless response systems)
- Innovation Unit's digital access for rough sleepers
- Sasha Costanza-Chock: "Design Justice" (2020)
