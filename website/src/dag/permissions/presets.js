"use strict";
/**
 * Permission Presets - Common permission configurations
 *
 * Provides ready-to-use permission matrices for common use cases,
 * from highly restrictive to permissive development configurations.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CODE_GENERATION_PERMISSIONS = exports.RESEARCH_PERMISSIONS = exports.CI_CD_PERMISSIONS = exports.FULL_PERMISSIONS = exports.STANDARD_PERMISSIONS = exports.READ_ONLY_PERMISSIONS = exports.MINIMAL_PERMISSIONS = void 0;
exports.getPreset = getPreset;
exports.getRecommendedPreset = getRecommendedPreset;
exports.getIsolationLevel = getIsolationLevel;
exports.createCustomPreset = createCustomPreset;
exports.listPresets = listPresets;
/**
 * Minimal permissions - read-only access with no external connectivity
 */
exports.MINIMAL_PERMISSIONS = {
    coreTools: {
        read: true,
        write: false,
        edit: false,
        glob: true,
        grep: true,
        task: false,
        webFetch: false,
        webSearch: false,
        todoWrite: false,
        ls: true,
        notebookEdit: false,
    },
    bash: {
        enabled: false,
        sandboxed: true,
        allowedPatterns: [],
        deniedPatterns: ['.*'],
        maxExecutionTimeMs: 0,
        allowBackground: false,
    },
    fileSystem: {
        readPatterns: [],
        writePatterns: [],
        denyPatterns: [
            '**/.*', // Hidden files
            '**/.env*', // Environment files
            '**/secrets/**', // Secrets directories
            '**/credentials*', // Credentials files
            '**/*.pem', // Private keys
            '**/*.key', // Key files
        ],
        maxReadSizeBytes: 1 * 1024 * 1024, // 1 MB
        maxWriteSizeBytes: 0,
        maxTotalWriteBytes: 0,
    },
    mcpTools: {
        allowed: [],
        denied: ['*'],
    },
    network: {
        enabled: false,
        allowedDomains: [],
        deniedDomains: ['*'],
        allowedProtocols: [],
        maxRequestSizeBytes: 0,
        maxResponseSizeBytes: 0,
        requestTimeoutMs: 0,
        maxConcurrentRequests: 0,
    },
    models: {
        allowed: ['haiku'],
        preferredForSpawning: 'haiku',
        maxTokensPerModel: {
            haiku: 2048,
        },
        allowEscalation: false,
    },
};
/**
 * Read-only permissions - can read files and search but not modify
 */
exports.READ_ONLY_PERMISSIONS = {
    coreTools: {
        read: true,
        write: false,
        edit: false,
        glob: true,
        grep: true,
        task: true,
        webFetch: true,
        webSearch: true,
        todoWrite: true,
        ls: true,
        notebookEdit: false,
    },
    bash: {
        enabled: true,
        sandboxed: true,
        allowedPatterns: [
            '^ls\\b',
            '^cat\\b',
            '^head\\b',
            '^tail\\b',
            '^wc\\b',
            '^find\\b',
            '^grep\\b',
            '^git\\s+(status|log|diff|branch|show)',
            '^npm\\s+(list|ls|outdated)',
            '^node\\s+--version',
            '^python\\s+--version',
        ],
        deniedPatterns: [
            'rm\\b',
            'mv\\b',
            'cp\\b',
            'mkdir\\b',
            'touch\\b',
            'chmod\\b',
            'chown\\b',
            'sudo\\b',
            '\\|\\s*sh',
            '\\|\\s*bash',
            'curl.*\\|',
            'wget.*\\|',
        ],
        maxExecutionTimeMs: 30000,
        allowBackground: false,
    },
    fileSystem: {
        readPatterns: ['**/*'],
        writePatterns: [],
        denyPatterns: [
            '**/.env*',
            '**/secrets/**',
            '**/credentials*',
            '**/*.pem',
            '**/*.key',
            '**/node_modules/**',
        ],
        maxReadSizeBytes: 10 * 1024 * 1024, // 10 MB
        maxWriteSizeBytes: 0,
        maxTotalWriteBytes: 0,
    },
    mcpTools: {
        allowed: [
            'octocode:*',
            'Context7:*',
            'brave-search:*',
        ],
        denied: [],
    },
    network: {
        enabled: true,
        allowedDomains: [
            'github.com',
            '*.github.com',
            'api.github.com',
            'raw.githubusercontent.com',
            'npmjs.com',
            'pypi.org',
            'docs.python.org',
            'developer.mozilla.org',
        ],
        deniedDomains: [],
        allowedProtocols: ['https'],
        maxRequestSizeBytes: 1 * 1024 * 1024, // 1 MB
        maxResponseSizeBytes: 10 * 1024 * 1024, // 10 MB
        requestTimeoutMs: 30000,
        maxConcurrentRequests: 5,
    },
    models: {
        allowed: ['haiku', 'sonnet'],
        preferredForSpawning: 'haiku',
        maxTokensPerModel: {
            haiku: 4096,
            sonnet: 8192,
        },
        allowEscalation: true,
    },
};
/**
 * Standard development permissions - balanced for typical development work
 */
exports.STANDARD_PERMISSIONS = {
    coreTools: {
        read: true,
        write: true,
        edit: true,
        glob: true,
        grep: true,
        task: true,
        webFetch: true,
        webSearch: true,
        todoWrite: true,
        ls: true,
        notebookEdit: true,
    },
    bash: {
        enabled: true,
        sandboxed: false,
        allowedPatterns: [
            '^npm\\b',
            '^npx\\b',
            '^yarn\\b',
            '^pnpm\\b',
            '^node\\b',
            '^python\\b',
            '^python3\\b',
            '^pip\\b',
            '^pip3\\b',
            '^git\\b',
            '^ls\\b',
            '^cat\\b',
            '^head\\b',
            '^tail\\b',
            '^grep\\b',
            '^find\\b',
            '^wc\\b',
            '^mkdir\\b',
            '^touch\\b',
            '^cp\\b',
            '^mv\\b',
            '^rm\\s+-[rf]*\\s+(?!/)\\S+', // rm only in relative paths
            '^echo\\b',
            '^pwd\\b',
            '^cd\\b',
            '^which\\b',
            '^env\\b',
            '^export\\b',
            '^curl\\b',
            '^wget\\b',
        ],
        deniedPatterns: [
            'sudo\\b',
            'su\\b',
            'chmod\\s+777',
            'rm\\s+-rf\\s+/',
            'rm\\s+-rf\\s+\\*',
            'mkfs',
            'dd\\s+if=',
            '>\\/dev\\/',
            'eval\\b',
            '\\$\\(', // Command substitution
        ],
        maxExecutionTimeMs: 300000, // 5 minutes
        allowBackground: true,
    },
    fileSystem: {
        readPatterns: ['**/*'],
        writePatterns: [
            'src/**/*',
            'lib/**/*',
            'test/**/*',
            'tests/**/*',
            'docs/**/*',
            '*.json',
            '*.yaml',
            '*.yml',
            '*.md',
            '*.ts',
            '*.tsx',
            '*.js',
            '*.jsx',
            '*.py',
            '*.css',
            '*.html',
        ],
        denyPatterns: [
            '**/.env*',
            '**/secrets/**',
            '**/*.pem',
            '**/*.key',
            '**/credentials*',
            '.git/**',
        ],
        maxReadSizeBytes: 10 * 1024 * 1024, // 10 MB
        maxWriteSizeBytes: 1 * 1024 * 1024, // 1 MB
        maxTotalWriteBytes: 50 * 1024 * 1024, // 50 MB
    },
    mcpTools: {
        allowed: ['*'],
        denied: [],
    },
    network: {
        enabled: true,
        allowedDomains: [], // All domains allowed
        deniedDomains: [],
        allowedProtocols: ['http', 'https'],
        maxRequestSizeBytes: 5 * 1024 * 1024, // 5 MB
        maxResponseSizeBytes: 20 * 1024 * 1024, // 20 MB
        requestTimeoutMs: 60000,
        maxConcurrentRequests: 10,
    },
    models: {
        allowed: ['haiku', 'sonnet', 'opus'],
        preferredForSpawning: 'sonnet',
        maxTokensPerModel: {
            haiku: 8192,
            sonnet: 16384,
            opus: 32768,
        },
        allowEscalation: true,
    },
};
/**
 * Full permissions - maximum access for trusted operations
 */
exports.FULL_PERMISSIONS = {
    coreTools: {
        read: true,
        write: true,
        edit: true,
        glob: true,
        grep: true,
        task: true,
        webFetch: true,
        webSearch: true,
        todoWrite: true,
        ls: true,
        notebookEdit: true,
    },
    bash: {
        enabled: true,
        sandboxed: false,
        allowedPatterns: ['.*'], // All commands
        deniedPatterns: [], // Nothing denied
        maxExecutionTimeMs: 600000, // 10 minutes
        allowBackground: true,
    },
    fileSystem: {
        readPatterns: ['**/*'],
        writePatterns: ['**/*'],
        denyPatterns: [],
        maxReadSizeBytes: 100 * 1024 * 1024, // 100 MB
        maxWriteSizeBytes: 50 * 1024 * 1024, // 50 MB
        maxTotalWriteBytes: 500 * 1024 * 1024, // 500 MB
    },
    mcpTools: {
        allowed: ['*'],
        denied: [],
    },
    network: {
        enabled: true,
        allowedDomains: [],
        deniedDomains: [],
        allowedProtocols: ['http', 'https', 'ws', 'wss'],
        maxRequestSizeBytes: 50 * 1024 * 1024, // 50 MB
        maxResponseSizeBytes: 100 * 1024 * 1024, // 100 MB
        requestTimeoutMs: 300000,
        maxConcurrentRequests: 20,
    },
    models: {
        allowed: ['haiku', 'sonnet', 'opus'],
        preferredForSpawning: 'opus',
        maxTokensPerModel: {
            haiku: 8192,
            sonnet: 32768,
            opus: 65536,
        },
        allowEscalation: true,
    },
};
/**
 * CI/CD permissions - for automated pipelines
 */
exports.CI_CD_PERMISSIONS = {
    coreTools: {
        read: true,
        write: true,
        edit: true,
        glob: true,
        grep: true,
        task: true,
        webFetch: true,
        webSearch: false, // No web search in CI
        todoWrite: false, // No todo management in CI
        ls: true,
        notebookEdit: false,
    },
    bash: {
        enabled: true,
        sandboxed: false,
        allowedPatterns: [
            '^npm\\b',
            '^npx\\b',
            '^yarn\\b',
            '^pnpm\\b',
            '^node\\b',
            '^python\\b',
            '^pip\\b',
            '^git\\b',
            '^make\\b',
            '^docker\\b',
            '^kubectl\\b',
            '^terraform\\b',
            '^aws\\b',
            '^gcloud\\b',
            '^az\\b',
            '^curl\\b',
            '^wget\\b',
        ],
        deniedPatterns: [
            'sudo\\b',
            'rm\\s+-rf\\s+/',
            'eval\\b',
        ],
        maxExecutionTimeMs: 600000, // 10 minutes for CI builds
        allowBackground: true,
    },
    fileSystem: {
        readPatterns: ['**/*'],
        writePatterns: [
            'dist/**/*',
            'build/**/*',
            'out/**/*',
            'coverage/**/*',
            '*.log',
        ],
        denyPatterns: [
            '**/.env.local',
            '**/secrets/**',
            '**/*.pem',
            '**/*.key',
        ],
        maxReadSizeBytes: 50 * 1024 * 1024, // 50 MB
        maxWriteSizeBytes: 20 * 1024 * 1024, // 20 MB
        maxTotalWriteBytes: 200 * 1024 * 1024, // 200 MB
    },
    mcpTools: {
        allowed: [
            'octocode:*',
            'desktop-commander:*',
        ],
        denied: [
            'ElevenLabs:*',
            'stability-ai:*',
        ],
    },
    network: {
        enabled: true,
        allowedDomains: [
            'github.com',
            '*.github.com',
            'npmjs.com',
            'registry.npmjs.org',
            'pypi.org',
            '*.docker.io',
            '*.docker.com',
        ],
        deniedDomains: [],
        allowedProtocols: ['https'],
        maxRequestSizeBytes: 10 * 1024 * 1024, // 10 MB
        maxResponseSizeBytes: 50 * 1024 * 1024, // 50 MB
        requestTimeoutMs: 120000,
        maxConcurrentRequests: 10,
    },
    models: {
        allowed: ['haiku', 'sonnet'],
        preferredForSpawning: 'haiku', // Cost-effective for CI
        maxTokensPerModel: {
            haiku: 4096,
            sonnet: 8192,
        },
        allowEscalation: false,
    },
};
/**
 * Research permissions - for analysis and exploration tasks
 */
exports.RESEARCH_PERMISSIONS = {
    coreTools: {
        read: true,
        write: false,
        edit: false,
        glob: true,
        grep: true,
        task: true,
        webFetch: true,
        webSearch: true,
        todoWrite: true,
        ls: true,
        notebookEdit: true,
    },
    bash: {
        enabled: true,
        sandboxed: true,
        allowedPatterns: [
            '^curl\\b',
            '^wget\\b',
            '^git\\s+(clone|fetch|pull)',
            '^ls\\b',
            '^cat\\b',
            '^head\\b',
            '^tail\\b',
            '^wc\\b',
            '^grep\\b',
            '^find\\b',
            '^jq\\b',
        ],
        deniedPatterns: [
            'rm\\b',
            'mv\\b',
            'mkdir\\b',
            'touch\\b',
            'chmod\\b',
            'sudo\\b',
        ],
        maxExecutionTimeMs: 60000,
        allowBackground: false,
    },
    fileSystem: {
        readPatterns: ['**/*'],
        writePatterns: [
            'research/**/*',
            'notes/**/*',
            'analysis/**/*',
            '*.md',
            '*.txt',
        ],
        denyPatterns: [
            '**/.env*',
            '**/secrets/**',
            '**/*.pem',
            '**/*.key',
        ],
        maxReadSizeBytes: 20 * 1024 * 1024, // 20 MB
        maxWriteSizeBytes: 5 * 1024 * 1024, // 5 MB
        maxTotalWriteBytes: 50 * 1024 * 1024, // 50 MB
    },
    mcpTools: {
        allowed: [
            'octocode:*',
            'Context7:*',
            'brave-search:*',
            'firecrawl:*',
            'hf-mcp-server:*',
        ],
        denied: [
            'ElevenLabs:*',
            'stability-ai:*',
        ],
    },
    network: {
        enabled: true,
        allowedDomains: [], // All domains for research
        deniedDomains: [],
        allowedProtocols: ['https'],
        maxRequestSizeBytes: 5 * 1024 * 1024, // 5 MB
        maxResponseSizeBytes: 30 * 1024 * 1024, // 30 MB
        requestTimeoutMs: 60000,
        maxConcurrentRequests: 5,
    },
    models: {
        allowed: ['haiku', 'sonnet', 'opus'],
        preferredForSpawning: 'sonnet',
        maxTokensPerModel: {
            haiku: 4096,
            sonnet: 16384,
            opus: 32768,
        },
        allowEscalation: true,
    },
};
/**
 * Code generation permissions - for writing code with guardrails
 */
exports.CODE_GENERATION_PERMISSIONS = {
    coreTools: {
        read: true,
        write: true,
        edit: true,
        glob: true,
        grep: true,
        task: true,
        webFetch: true,
        webSearch: true,
        todoWrite: true,
        ls: true,
        notebookEdit: true,
    },
    bash: {
        enabled: true,
        sandboxed: false,
        allowedPatterns: [
            '^npm\\b',
            '^npx\\b',
            '^yarn\\b',
            '^pnpm\\b',
            '^node\\b',
            '^tsc\\b',
            '^eslint\\b',
            '^prettier\\b',
            '^jest\\b',
            '^vitest\\b',
            '^python\\b',
            '^pip\\b',
            '^pytest\\b',
            '^black\\b',
            '^ruff\\b',
            '^git\\b',
            '^ls\\b',
            '^cat\\b',
            '^mkdir\\b',
            '^touch\\b',
        ],
        deniedPatterns: [
            'sudo\\b',
            'rm\\s+-rf',
            'chmod\\b',
            'curl.*\\|\\s*(sh|bash)',
        ],
        maxExecutionTimeMs: 300000,
        allowBackground: true,
    },
    fileSystem: {
        readPatterns: ['**/*'],
        writePatterns: [
            'src/**/*',
            'lib/**/*',
            'app/**/*',
            'components/**/*',
            'pages/**/*',
            'api/**/*',
            'test/**/*',
            'tests/**/*',
            '__tests__/**/*',
            '*.ts',
            '*.tsx',
            '*.js',
            '*.jsx',
            '*.py',
            '*.json',
            '*.yaml',
            '*.yml',
            '*.md',
            '*.css',
            '*.scss',
            '*.html',
        ],
        denyPatterns: [
            '**/.env*',
            '**/secrets/**',
            '**/*.pem',
            '**/*.key',
            '.git/**',
            'node_modules/**',
        ],
        maxReadSizeBytes: 10 * 1024 * 1024, // 10 MB
        maxWriteSizeBytes: 2 * 1024 * 1024, // 2 MB
        maxTotalWriteBytes: 100 * 1024 * 1024, // 100 MB
    },
    mcpTools: {
        allowed: ['*'],
        denied: [],
    },
    network: {
        enabled: true,
        allowedDomains: [],
        deniedDomains: [],
        allowedProtocols: ['https'],
        maxRequestSizeBytes: 5 * 1024 * 1024, // 5 MB
        maxResponseSizeBytes: 20 * 1024 * 1024, // 20 MB
        requestTimeoutMs: 60000,
        maxConcurrentRequests: 10,
    },
    models: {
        allowed: ['haiku', 'sonnet', 'opus'],
        preferredForSpawning: 'sonnet',
        maxTokensPerModel: {
            haiku: 8192,
            sonnet: 16384,
            opus: 32768,
        },
        allowEscalation: true,
    },
};
/**
 * Get a preset by name
 */
function getPreset(name) {
    var presets = {
        minimal: exports.MINIMAL_PERMISSIONS,
        'read-only': exports.READ_ONLY_PERMISSIONS,
        standard: exports.STANDARD_PERMISSIONS,
        full: exports.FULL_PERMISSIONS,
        'ci-cd': exports.CI_CD_PERMISSIONS,
        research: exports.RESEARCH_PERMISSIONS,
        'code-generation': exports.CODE_GENERATION_PERMISSIONS,
    };
    var preset = presets[name];
    if (!preset) {
        throw new Error("Unknown preset: ".concat(name, ". Available: ").concat(Object.keys(presets).join(', ')));
    }
    return __assign({}, preset); // Return a copy
}
/**
 * Get recommended preset based on task type
 */
function getRecommendedPreset(taskType) {
    var recommendations = {
        analysis: 'read-only',
        research: 'research',
        refactoring: 'code-generation',
        'new-feature': 'standard',
        'bug-fix': 'standard',
        testing: 'code-generation',
        documentation: 'read-only',
        deployment: 'ci-cd',
        exploration: 'research',
    };
    return recommendations[taskType] || 'standard';
}
/**
 * Get recommended isolation level based on preset
 */
function getIsolationLevel(preset) {
    var levels = {
        minimal: 'strict',
        'read-only': 'strict',
        standard: 'moderate',
        full: 'permissive',
        'ci-cd': 'moderate',
        research: 'moderate',
        'code-generation': 'moderate',
    };
    return levels[preset] || 'moderate';
}
/**
 * Create a custom preset by merging with a base
 */
function createCustomPreset(base, overrides) {
    var basePreset = getPreset(base);
    return deepMerge(basePreset, overrides);
}
/**
 * Deep merge helper
 */
function deepMerge(target, source) {
    var result = __assign({}, target);
    for (var _i = 0, _a = Object.keys(source); _i < _a.length; _i++) {
        var key = _a[_i];
        var sourceValue = source[key];
        var targetValue = target[key];
        if (sourceValue !== undefined &&
            typeof sourceValue === 'object' &&
            sourceValue !== null &&
            !Array.isArray(sourceValue) &&
            typeof targetValue === 'object' &&
            targetValue !== null &&
            !Array.isArray(targetValue)) {
            result[key] = deepMerge(targetValue, sourceValue);
        }
        else if (sourceValue !== undefined) {
            result[key] = sourceValue;
        }
    }
    return result;
}
/**
 * List all available presets with descriptions
 */
function listPresets() {
    return [
        {
            name: 'minimal',
            description: 'Read-only access with no external connectivity',
            securityLevel: 'Highest',
        },
        {
            name: 'read-only',
            description: 'Can read files and search but not modify',
            securityLevel: 'High',
        },
        {
            name: 'standard',
            description: 'Balanced for typical development work',
            securityLevel: 'Medium',
        },
        {
            name: 'full',
            description: 'Maximum access for trusted operations',
            securityLevel: 'Low',
        },
        {
            name: 'ci-cd',
            description: 'For automated pipelines and deployments',
            securityLevel: 'Medium',
        },
        {
            name: 'research',
            description: 'For analysis and exploration tasks',
            securityLevel: 'Medium-High',
        },
        {
            name: 'code-generation',
            description: 'For writing code with guardrails',
            securityLevel: 'Medium',
        },
    ];
}
