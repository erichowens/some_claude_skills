"use strict";
/**
 * Generated Bundle Data
 *
 * Auto-generated from YAML files in /bundles
 * DO NOT EDIT DIRECTLY - run 'npm run generate:bundles' instead
 *
 * Generated: 2026-01-15T15:32:33.006Z
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundles = void 0;
exports.getBundleById = getBundleById;
exports.getFeaturedBundles = getFeaturedBundles;
exports.getBundlesByAudience = getBundlesByAudience;
exports.getBundlesByDifficulty = getBundlesByDifficulty;
exports.getBundlesByTag = getBundlesByTag;
exports.searchBundles = searchBundles;
exports.bundles = [
    {
        "id": "ai-development-stack",
        "title": "AI Development Stack",
        "description": "Build production-ready AI applications with RAG systems, prompt engineering, and LLM orchestration. From embeddings to deployment.",
        "audience": "ml-engineers",
        "difficulty": "advanced",
        "skills": [
            {
                "id": "ai-engineer",
                "role": "Builds RAG pipelines and LLM applications"
            },
            {
                "id": "prompt-engineer",
                "role": "Crafts effective prompts and prompt chains"
            },
            {
                "id": "mcp-creator",
                "role": "Creates Model Context Protocol servers"
            },
            {
                "id": "agent-creator",
                "role": "Designs and builds AI agents"
            },
            {
                "id": "clip-aware-embeddings",
                "role": "Implements semantic image-text matching",
                "optional": true
            }
        ],
        "installCommand": "claude \"/install @some-claude-skills/ai-development-stack\"",
        "estimatedCost": {
            "tokens": 100000,
            "usd": 1.5
        },
        "useCases": [
            "Build a RAG-powered customer support bot",
            "Create an MCP server for your internal tools",
            "Design multi-agent orchestration systems",
            "Optimize prompts for production reliability"
        ],
        "tags": [
            "ai",
            "llm",
            "rag",
            "mcp",
            "agents",
            "featured"
        ],
        "heroImage": "/img/bundles/ai-development-stack-hero.png",
        "featured": true,
        "relatedBundles": [
            "documentation-powerhouse",
            "startup-mvp-kit"
        ]
    },
    {
        "id": "code-review-suite",
        "title": "Code Review Suite",
        "description": "Comprehensive code review covering security vulnerabilities, performance issues, style consistency, and documentation gaps. Perfect for team PRs.",
        "audience": "teams",
        "difficulty": "intermediate",
        "skills": [
            {
                "id": "security-auditor",
                "role": "Scans for OWASP vulnerabilities and security anti-patterns"
            },
            {
                "id": "refactoring-surgeon",
                "role": "Identifies code smells and suggests clean refactors"
            },
            {
                "id": "test-automation-expert",
                "role": "Reviews test coverage and suggests missing test cases"
            },
            {
                "id": "technical-writer",
                "role": "Checks documentation quality and suggests improvements"
            },
            {
                "id": "vitest-testing-patterns",
                "role": "Applies modern testing patterns for JavaScript/TypeScript",
                "optional": true
            }
        ],
        "installCommand": "claude \"/install @some-claude-skills/code-review-suite\"",
        "estimatedCost": {
            "tokens": 50000,
            "usd": 0.75
        },
        "useCases": [
            "Review a PR for security and performance issues",
            "Audit codebase before a major release",
            "Onboard new team members with code quality standards",
            "Generate comprehensive code review checklists"
        ],
        "tags": [
            "code-review",
            "security",
            "testing",
            "teams",
            "featured"
        ],
        "heroImage": "/img/bundles/code-review-suite-hero.png",
        "featured": true,
        "relatedBundles": [
            "startup-mvp-kit",
            "documentation-powerhouse"
        ]
    },
    {
        "id": "documentation-powerhouse",
        "title": "Documentation Powerhouse",
        "description": "Create comprehensive technical documentation from READMEs to API references. Includes diagram generation, style guides, and accessibility checks.",
        "audience": "technical-writers",
        "difficulty": "beginner",
        "skills": [
            {
                "id": "technical-writer",
                "role": "Writes clear, structured technical documentation"
            },
            {
                "id": "diagramming-expert",
                "role": "Creates architecture diagrams, flowcharts, and ERDs"
            },
            {
                "id": "docusaurus-expert",
                "role": "Builds documentation sites with Docusaurus"
            },
            {
                "id": "seo-visibility-expert",
                "role": "Optimizes docs for search engine discoverability"
            },
            {
                "id": "research-analyst",
                "role": "Researches topics for comprehensive coverage",
                "optional": true
            }
        ],
        "installCommand": "claude \"/install @some-claude-skills/documentation-powerhouse\"",
        "estimatedCost": {
            "tokens": 40000,
            "usd": 0.6
        },
        "useCases": [
            "Generate API documentation from code",
            "Create getting started guides and tutorials",
            "Build a complete documentation site",
            "Audit existing docs for clarity and completeness"
        ],
        "tags": [
            "documentation",
            "technical-writing",
            "api-docs",
            "diagrams",
            "featured"
        ],
        "heroImage": "/img/bundles/documentation-powerhouse-hero.png",
        "featured": true,
        "relatedBundles": [
            "code-review-suite",
            "ai-development-stack"
        ]
    },
    {
        "id": "personal-growth-bundle",
        "title": "Personal Growth Bundle",
        "description": "Discover how Claude Code can help with career development, personal projects, and learning. A gentle introduction with immediately useful skills.",
        "audience": "newcomers",
        "difficulty": "beginner",
        "skills": [
            {
                "id": "career-biographer",
                "role": "Documents your career journey and achievements"
            },
            {
                "id": "cv-creator",
                "role": "Creates ATS-optimized resumes and portfolios"
            },
            {
                "id": "job-application-optimizer",
                "role": "Tailors applications to specific job postings"
            },
            {
                "id": "digital-estate-planner",
                "role": "Organizes digital life and important accounts"
            },
            {
                "id": "personal-finance-coach",
                "role": "Helps with budgeting and financial planning",
                "optional": true
            }
        ],
        "installCommand": "claude \"/install @some-claude-skills/personal-growth-bundle\"",
        "estimatedCost": {
            "tokens": 30000,
            "usd": 0.45
        },
        "useCases": [
            "Create a professional resume from scratch",
            "Document your career story for interviews",
            "Organize passwords and important accounts",
            "Optimize job applications for specific roles"
        ],
        "tags": [
            "career",
            "productivity",
            "beginner",
            "personal"
        ],
        "heroImage": "/img/bundles/personal-growth-bundle-hero.png",
        "featured": false,
        "relatedBundles": [
            "startup-mvp-kit",
            "documentation-powerhouse"
        ]
    },
    {
        "id": "startup-mvp-kit",
        "title": "Startup MVP Kit",
        "description": "Everything you need to go from idea to deployed MVP. Covers UI design, API architecture, database setup, and deployment automation.",
        "audience": "entrepreneurs",
        "difficulty": "intermediate",
        "skills": [
            {
                "id": "web-design-expert",
                "role": "Creates responsive UI components and landing pages"
            },
            {
                "id": "api-architect",
                "role": "Designs REST/GraphQL APIs with proper authentication"
            },
            {
                "id": "drizzle-migrations",
                "role": "Manages database schema with type-safe migrations"
            },
            {
                "id": "vercel-deployment",
                "role": "Deploys with CI/CD, preview URLs, and custom domains"
            },
            {
                "id": "modern-auth-2026",
                "role": "Implements secure OAuth, JWT, and session management",
                "optional": true
            }
        ],
        "installCommand": "claude \"/install @some-claude-skills/startup-mvp-kit\"",
        "estimatedCost": {
            "tokens": 75000,
            "usd": 1.13
        },
        "useCases": [
            "Build a SaaS landing page with waitlist signup",
            "Create a REST API with user authentication",
            "Deploy a Next.js app with database to Vercel",
            "Set up CI/CD pipeline with preview environments"
        ],
        "tags": [
            "startup",
            "web-development",
            "full-stack",
            "deployment",
            "featured"
        ],
        "heroImage": "/img/bundles/startup-mvp-kit-hero.png",
        "featured": true,
        "relatedBundles": [
            "code-review-suite",
            "documentation-powerhouse"
        ]
    }
];
function getBundleById(id) {
    return exports.bundles.find(function (b) { return b.id === id; });
}
function getFeaturedBundles() {
    return exports.bundles.filter(function (b) { return b.featured; });
}
function getBundlesByAudience(audience) {
    return exports.bundles.filter(function (b) { return b.audience === audience; });
}
function getBundlesByDifficulty(difficulty) {
    return exports.bundles.filter(function (b) { return b.difficulty === difficulty; });
}
function getBundlesByTag(tag) {
    return exports.bundles.filter(function (b) { return b.tags.includes(tag); });
}
function searchBundles(query) {
    var lowerQuery = query.toLowerCase();
    return exports.bundles.filter(function (b) {
        return b.title.toLowerCase().includes(lowerQuery) ||
            b.description.toLowerCase().includes(lowerQuery) ||
            b.tags.some(function (t) { return t.toLowerCase().includes(lowerQuery); });
    });
}
