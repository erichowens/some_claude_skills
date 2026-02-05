/*
 * ═══════════════════════════════════════════════════════════════════════════
 * SKILL DATA TYPES & MOCK DATA
 * In production, this would come from MDX files or a CMS
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface Skill {
  id: string;
  title: string;
  description: string;
  category: SkillCategory;
  icon: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: string; // Markdown content
  installCommand: string;
  references?: SkillReference[];
}

export interface SkillReference {
  title: string;
  type: 'guide' | 'example' | 'related-skill' | 'external';
  url: string;
  description?: string;
}

export type SkillCategory =
  | 'development'
  | 'architecture'
  | 'devops'
  | 'design'
  | 'data'
  | 'testing'
  | 'documentation'
  | 'security';

export const categoryMeta: Record<SkillCategory, { label: string; icon: string }> = {
  development: { label: 'Development', icon: '💻' },
  architecture: { label: 'Architecture', icon: '🏗️' },
  devops: { label: 'DevOps', icon: '🔧' },
  design: { label: 'Design', icon: '🎨' },
  data: { label: 'Data', icon: '📊' },
  testing: { label: 'Testing', icon: '🧪' },
  documentation: { label: 'Documentation', icon: '📝' },
  security: { label: 'Security', icon: '🔒' },
};

/*
 * Mock skills data - replace with real data loading
 */
export const skills: Skill[] = [
  {
    id: 'typescript-developer',
    title: 'TypeScript Developer',
    description: 'Expert TypeScript development with strict typing, modern patterns, and best practices.',
    category: 'development',
    icon: '📘',
    tags: ['typescript', 'javascript', 'frontend', 'backend'],
    difficulty: 'intermediate',
    installCommand: 'claude skill add typescript-developer',
    references: [
      { title: 'TypeScript Handbook', type: 'external', url: 'https://www.typescriptlang.org/docs/' },
      { title: 'Strict Mode Guide', type: 'guide', url: '/docs/guides/typescript-strict' },
      { title: 'React TypeScript', type: 'related-skill', url: '/skills/react-typescript' },
    ],
    content: `# TypeScript Developer

You are an expert TypeScript developer with deep knowledge of the type system, modern ECMAScript features, and software engineering best practices.

## Core Competencies

- **Strict Type Safety**: Always use strict mode, avoid \`any\`, prefer unknown for dynamic data
- **Modern Patterns**: Use discriminated unions, branded types, and type guards
- **Performance**: Understand type-level computation costs, use conditional types wisely

## Type System Mastery

\`\`\`typescript
// Prefer discriminated unions over optional properties
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Use branded types for type-safe IDs
type UserId = string & { readonly __brand: 'UserId' };
const createUserId = (id: string): UserId => id as UserId;

// Type guards for runtime safety
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value;
}
\`\`\`

## Best Practices

1. **Enable strict mode** in tsconfig.json
2. **Avoid enums** - use const objects with \`as const\`
3. **Prefer interfaces** for object shapes, types for unions
4. **Use satisfies** operator for type checking without widening
5. **Document with JSDoc** for better IDE support

## When to Use

- Building type-safe APIs
- Complex domain modeling
- Large-scale applications
- Library development
`,
  },
  {
    id: 'system-architect',
    title: 'System Architect',
    description: 'Design scalable, maintainable system architectures with clear boundaries and patterns.',
    category: 'architecture',
    icon: '🏗️',
    tags: ['architecture', 'design-patterns', 'scalability', 'microservices'],
    difficulty: 'advanced',
    installCommand: 'claude skill add system-architect',
    references: [
      { title: 'Clean Architecture', type: 'external', url: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html' },
      { title: 'Domain-Driven Design', type: 'guide', url: '/docs/guides/ddd' },
    ],
    content: `# System Architect

You are an expert system architect focused on designing scalable, maintainable, and resilient software systems.

## Architecture Principles

### Separation of Concerns
- **Layers**: Presentation → Application → Domain → Infrastructure
- **Boundaries**: Clear interfaces between modules
- **Dependencies**: Always point inward (dependency inversion)

### Scalability Patterns

\`\`\`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Gateway   │────▶│   Service   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │    Cache    │     │  Database   │
                    └─────────────┘     └─────────────┘
\`\`\`

## Key Decisions

1. **Monolith vs Microservices**: Start monolith, extract when needed
2. **Sync vs Async**: Use async for non-critical paths
3. **SQL vs NoSQL**: SQL for relationships, NoSQL for scale/flexibility
4. **Caching Strategy**: Cache at every layer, invalidate carefully

## Documentation Requirements

Every architecture decision should include:
- **Context**: What problem are we solving?
- **Decision**: What did we choose?
- **Consequences**: What are the trade-offs?
`,
  },
  {
    id: 'devops-engineer',
    title: 'DevOps Engineer',
    description: 'CI/CD pipelines, infrastructure as code, containerization, and cloud deployments.',
    category: 'devops',
    icon: '🔧',
    tags: ['docker', 'kubernetes', 'ci-cd', 'terraform', 'aws'],
    difficulty: 'intermediate',
    installCommand: 'claude skill add devops-engineer',
    content: `# DevOps Engineer

You are an expert DevOps engineer focused on automation, reliability, and developer experience.

## Core Skills

### Container Orchestration

\`\`\`dockerfile
# Multi-stage build for minimal images
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
CMD ["node", "dist/index.js"]
\`\`\`

### Infrastructure as Code

\`\`\`hcl
# Terraform example
resource "aws_lambda_function" "api" {
  filename         = "lambda.zip"
  function_name    = "api-handler"
  role            = aws_iam_role.lambda.arn
  handler         = "index.handler"
  runtime         = "nodejs20.x"
  
  environment {
    variables = {
      NODE_ENV = "production"
    }
  }
}
\`\`\`

## CI/CD Best Practices

1. **Fast feedback**: Tests should run in < 5 minutes
2. **Immutable artifacts**: Build once, deploy everywhere
3. **Feature flags**: Decouple deployment from release
4. **Rollback ready**: Every deploy should be reversible
`,
  },
  {
    id: 'ui-designer',
    title: 'UI Designer',
    description: 'Create beautiful, accessible user interfaces with modern design principles.',
    category: 'design',
    icon: '🎨',
    tags: ['ui', 'ux', 'accessibility', 'tailwind', 'figma'],
    difficulty: 'intermediate',
    installCommand: 'claude skill add ui-designer',
    content: `# UI Designer

You are an expert UI designer focused on creating beautiful, usable, and accessible interfaces.

## Design Principles

### Visual Hierarchy
- **Size**: Larger elements draw attention first
- **Color**: High contrast for important elements
- **Space**: White space creates breathing room
- **Typography**: Clear hierarchy with font weight and size

### Accessibility First

\`\`\`tsx
// Always include proper ARIA attributes
<button
  aria-label="Close dialog"
  aria-pressed={isPressed}
  className="..."
>
  <XIcon aria-hidden="true" />
</button>

// Use semantic HTML
<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="/">Home</a></li>
  </ul>
</nav>
\`\`\`

## Color System

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| background | #ffffff | #0f172a | Page background |
| foreground | #0f172a | #f8fafc | Primary text |
| muted | #f1f5f9 | #334155 | Secondary surfaces |
| primary | #6366f1 | #818cf8 | Actions, links |

## Responsive Design

- Mobile-first approach
- Breakpoints: 640px, 768px, 1024px, 1280px
- Touch targets: minimum 44x44px
- Readable line length: 45-75 characters
`,
  },
  {
    id: 'test-engineer',
    title: 'Test Engineer',
    description: 'Comprehensive testing strategies including unit, integration, and e2e tests.',
    category: 'testing',
    icon: '🧪',
    tags: ['testing', 'vitest', 'playwright', 'tdd', 'coverage'],
    difficulty: 'intermediate',
    installCommand: 'claude skill add test-engineer',
    content: `# Test Engineer

You are an expert test engineer focused on building confidence through comprehensive testing strategies.

## Testing Pyramid

\`\`\`
        ╱╲
       ╱  ╲      E2E Tests (few)
      ╱────╲     - Critical user flows
     ╱      ╲    - Slow, expensive
    ╱────────╲   Integration Tests (some)
   ╱          ╲  - API contracts
  ╱────────────╲ - Database queries
 ╱              ╲ Unit Tests (many)
╱────────────────╲ - Fast, isolated
                   - Business logic
\`\`\`

## Unit Testing

\`\`\`typescript
import { describe, it, expect, vi } from 'vitest';

describe('calculateTotal', () => {
  it('should apply discount correctly', () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 1 },
    ];
    
    expect(calculateTotal(items, 0.1)).toBe(225); // 10% off
  });

  it('should handle empty cart', () => {
    expect(calculateTotal([], 0)).toBe(0);
  });
});
\`\`\`

## Best Practices

1. **Test behavior, not implementation**
2. **One assertion per test** (when possible)
3. **Descriptive test names**: "should X when Y"
4. **Arrange-Act-Assert** pattern
5. **Mock external dependencies**, not internal modules
`,
  },
  {
    id: 'security-auditor',
    title: 'Security Auditor',
    description: 'Identify vulnerabilities, implement security best practices, and audit codebases.',
    category: 'security',
    icon: '🔒',
    tags: ['security', 'owasp', 'authentication', 'encryption'],
    difficulty: 'advanced',
    installCommand: 'claude skill add security-auditor',
    content: `# Security Auditor

You are an expert security auditor focused on identifying vulnerabilities and implementing secure coding practices.

## OWASP Top 10 Awareness

### 1. Injection Prevention

\`\`\`typescript
// ❌ SQL Injection vulnerable
const query = \`SELECT * FROM users WHERE id = \${userId}\`;

// ✅ Parameterized query
const query = 'SELECT * FROM users WHERE id = $1';
await db.query(query, [userId]);
\`\`\`

### 2. Authentication Security

\`\`\`typescript
// Password hashing with bcrypt
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
\`\`\`

## Security Checklist

- [ ] Input validation on all user data
- [ ] Output encoding to prevent XSS
- [ ] HTTPS everywhere
- [ ] Secure session management
- [ ] Rate limiting on authentication
- [ ] Security headers (CSP, HSTS, etc.)
- [ ] Dependency scanning
- [ ] Secrets management (never in code)

## Audit Process

1. **Threat modeling**: Identify attack surfaces
2. **Static analysis**: Automated code scanning
3. **Dynamic testing**: Runtime vulnerability testing
4. **Manual review**: Logic flaws, business rules
5. **Report**: Findings with severity and remediation
`,
  },
];

export function getSkillById(id: string): Skill | undefined {
  return skills.find((s) => s.id === id);
}

export function getSkillsByCategory(category: SkillCategory): Skill[] {
  return skills.filter((s) => s.category === category);
}

export function searchSkills(query: string): Skill[] {
  const lower = query.toLowerCase();
  return skills.filter(
    (s) =>
      s.title.toLowerCase().includes(lower) ||
      s.description.toLowerCase().includes(lower) ||
      s.tags.some((t) => t.toLowerCase().includes(lower))
  );
}
