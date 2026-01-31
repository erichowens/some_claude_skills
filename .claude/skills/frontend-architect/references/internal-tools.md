# Internal Tools Patterns

Patterns for building prototypes and side projects exposed to select users.

## Philosophy

Internal tools are for:
1. **Experimentation** - Try ideas without production polish
2. **Learning** - Discover what to build right
3. **Velocity** - Ship fast, iterate faster
4. **Stakeholder demos** - Show progress without risk

---

## Access Control Layers

### Layer 1: Cloudflare Access (Authentication)

Who can reach the tool at all.

```
Configuration:
- Create Access Application
- Domain: internal.example.com
- Identity: GitHub (or Google, OIDC, etc.)
- Policy: Allow specific email domain (@yourcompany.com)
```

### Layer 2: Application-Level (Authorization)

What features they can use.

```typescript
// lib/permissions.ts
const ROLES = {
  admin: ["*"],
  beta: ["stable-tool", "beta-tool"],
  viewer: ["stable-tool"],
};

const USER_ROLES: Record<string, keyof typeof ROLES> = {
  "admin@example.com": "admin",
  "beta@example.com": "beta",
};

export function canAccess(email: string, tool: string): boolean {
  const role = USER_ROLES[email] || "viewer";
  const permissions = ROLES[role];

  return permissions.includes("*") || permissions.includes(tool);
}
```

### Layer 3: Feature Flags (Gradual Rollout)

Fine-grained control within tools.

```typescript
// lib/flags.ts
interface FeatureFlags {
  newUploader: boolean;
  experimentalAPI: boolean;
  betaUI: boolean;
}

const FLAGS_BY_USER: Record<string, Partial<FeatureFlags>> = {
  "admin@example.com": { newUploader: true, experimentalAPI: true, betaUI: true },
  "beta@example.com": { newUploader: true, betaUI: true },
};

export function getFlags(email: string): FeatureFlags {
  const defaults: FeatureFlags = {
    newUploader: false,
    experimentalAPI: false,
    betaUI: false,
  };

  return { ...defaults, ...(FLAGS_BY_USER[email] || {}) };
}
```

---

## Project Structure

### Monorepo Layout

```
apps/
├── web/                    # Public production site
├── internal/               # Protected internal tools
│   ├── _shared/           # Shared internal components
│   │   ├── layout.tsx     # Common internal layout
│   │   ├── auth.ts        # Auth utilities
│   │   └── nav.tsx        # Internal navigation
│   │
│   ├── dashboard/         # Admin dashboard
│   │   ├── package.json
│   │   ├── app/
│   │   └── wrangler.toml
│   │
│   ├── experiment-1/      # First experiment
│   │   ├── package.json
│   │   ├── app/
│   │   └── wrangler.toml
│   │
│   └── experiment-2/      # Second experiment
│       └── ...

packages/
├── ui/                     # Shared design system
├── db/                     # Database clients
└── types/                  # Shared TypeScript types
```

### Per-Tool Configuration

Each internal tool gets its own:

```toml
# apps/internal/experiment-1/wrangler.toml
name = "internal-experiment-1"
compatibility_date = "2026-01-31"

[vars]
TOOL_NAME = "experiment-1"
ENVIRONMENT = "internal"

# Secrets via: wrangler secret put SECRET_NAME
```

---

## Quick Start Patterns

### New Prototype Script

```bash
#!/bin/bash
# scripts/new-prototype.sh

set -e

NAME=$1
if [ -z "$NAME" ]; then
  echo "Usage: ./new-prototype.sh <name>"
  exit 1
fi

DIR="apps/internal/$NAME"
mkdir -p "$DIR"

# Create minimal package.json
cat > "$DIR/package.json" << EOF
{
  "name": "@internal/$NAME",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3100",
    "build": "next build",
    "start": "next start",
    "deploy": "wrangler pages deploy out --project-name=internal-$NAME"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
EOF

# Create minimal app
mkdir -p "$DIR/app"
cat > "$DIR/app/page.tsx" << 'EOF'
export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Internal Prototype</h1>
      <p className="mt-4">Replace this with your experiment.</p>
    </main>
  );
}
EOF

cat > "$DIR/app/layout.tsx" << 'EOF'
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Internal Tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

# Create wrangler config
cat > "$DIR/wrangler.toml" << EOF
name = "internal-$NAME"
compatibility_date = "2026-01-31"
pages_build_output_dir = "out"
EOF

echo "Created $DIR"
echo ""
echo "Next steps:"
echo "  cd $DIR"
echo "  pnpm install"
echo "  pnpm dev"
```

### Shared Internal Layout

```typescript
// apps/internal/_shared/layout.tsx
import { getAccessEmail } from "./auth";
import { InternalNav } from "./nav";

export function InternalLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const email = getAccessEmail();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-yellow-400 border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <span className="font-bold">🔒 Internal Tools</span>
          <span className="text-sm">{email}</span>
        </div>
      </header>

      {/* Navigation */}
      <InternalNav />

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        {children}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t text-center text-sm py-2 text-gray-600">
        Internal use only. Do not share externally.
      </footer>
    </div>
  );
}
```

---

## Lifecycle Management

### Stage 1: Experiment

```
Characteristics:
- Minimal polish (70%)
- No tests
- Manual deployment
- Single user (you)

Duration: 1-2 weeks

Artifacts:
- Working prototype
- Learnings document
- Decision: promote or kill
```

### Stage 2: Beta

```
Characteristics:
- Medium polish (85%)
- Basic tests for critical paths
- CI deployment
- 3-5 beta users

Duration: 2-4 weeks

Artifacts:
- Feedback collection
- Bug fixes
- Feature prioritization
```

### Stage 3: Internal Launch

```
Characteristics:
- High polish (95%)
- Comprehensive tests
- Automatic deployment
- All internal users

Duration: Ongoing

Artifacts:
- Documentation
- User onboarding
- Metrics dashboard
```

### Stage 4: Productization

```
If internal tool proves valuable:
- Extract to production codebase
- Add public auth
- Performance optimization
- Full test coverage
```

---

## Common Patterns

### Quick Feedback Form

```typescript
// components/feedback.tsx
"use client";

import { useState } from "react";

export function FeedbackButton({ toolName }: { toolName: string }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async () => {
    await fetch("/api/feedback", {
      method: "POST",
      body: JSON.stringify({ tool: toolName, feedback }),
    });
    setSent(true);
  };

  if (sent) return <div className="text-green-600">Thanks!</div>;

  return (
    <div className="fixed bottom-4 right-4">
      {open ? (
        <div className="bg-white border-2 border-black p-4 shadow-lg">
          <textarea
            className="border p-2 w-64"
            placeholder="What do you think?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <button onClick={submit} className="bg-black text-white px-4 py-1">
              Send
            </button>
            <button onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-yellow-400 border-2 border-black px-4 py-2 font-bold"
        >
          Feedback
        </button>
      )}
    </div>
  );
}
```

### Usage Analytics

```typescript
// lib/analytics.ts
export function trackEvent(event: string, data?: Record<string, unknown>) {
  // Simple logging for internal tools
  console.log("[Analytics]", event, data);

  // Or send to simple endpoint
  fetch("/api/analytics", {
    method: "POST",
    body: JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString(),
      user: getAccessEmail(),
    }),
  });
}

// Usage
trackEvent("feature_used", { feature: "export", format: "csv" });
trackEvent("error", { message: "API failed", code: 500 });
```

### Version Display

```typescript
// components/version.tsx
export function VersionBadge() {
  return (
    <div className="fixed bottom-2 left-2 text-xs text-gray-400">
      v{process.env.NEXT_PUBLIC_VERSION || "dev"} |{" "}
      {process.env.NEXT_PUBLIC_COMMIT_SHA?.slice(0, 7) || "local"}
    </div>
  );
}
```

---

## Anti-Patterns

### ❌ Over-Engineering

```
WRONG: "Let me set up full CI/CD, comprehensive tests, and proper architecture"

RIGHT: "Ship it, see if it's useful, then add rigor"
```

### ❌ Waiting for Polish

```
WRONG: "I'll share it when it's ready"

RIGHT: "Share it now, get feedback, iterate"
```

### ❌ Ignoring Feedback

```
WRONG: Build in isolation for weeks

RIGHT: Daily/weekly feedback loops with beta users
```

### ❌ Keeping Zombie Projects

```
WRONG: Keep all experiments around forever

RIGHT: Archive/delete after 30 days of no activity
```

---

## Cleanup Process

### Monthly Review

```markdown
## Internal Tools Review - [Month]

### Active Tools
- [ ] Tool A - Last used: [date] - Keep
- [ ] Tool B - Last used: [date] - Keep

### Candidates for Archival
- [ ] Tool C - Last used: 45 days ago - Archive?
- [ ] Tool D - Never launched - Delete?

### Candidates for Promotion
- [ ] Tool E - High usage, stable - Promote to production?
```

### Archive Script

```bash
#!/bin/bash
# scripts/archive-internal-tool.sh

NAME=$1
if [ -z "$NAME" ]; then
  echo "Usage: ./archive-internal-tool.sh <name>"
  exit 1
fi

# Move to archive
mv "apps/internal/$NAME" "apps/internal/_archived/$NAME"

# Remove from Cloudflare
wrangler pages project delete "internal-$NAME" --yes

echo "Archived $NAME"
```
