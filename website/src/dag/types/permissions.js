"use strict";
/**
 * Permission System Type Definitions
 *
 * Defines the permission matrix for agent spawning and execution.
 * Follows the principle: child permissions must be equal to or more restrictive than parent.
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
exports.PERMISSIVE_ISOLATION = exports.MODERATE_ISOLATION = exports.STRICT_ISOLATION = exports.DEFAULT_MODEL_PERMISSIONS = exports.PUBLIC_API_NETWORK = exports.DENY_NETWORK = exports.READ_ONLY_MCP = exports.DENY_MCP = exports.PROJECT_FILESYSTEM = exports.DENY_FILESYSTEM = exports.DEV_BASH = exports.READ_ONLY_BASH = exports.DENY_BASH = exports.READ_ONLY_CORE_TOOLS = exports.ALLOW_ALL_CORE_TOOLS = exports.DENY_ALL_CORE_TOOLS = void 0;
exports.getPermissionMatrixForLevel = getPermissionMatrixForLevel;
exports.validatePermissionInheritance = validatePermissionInheritance;
exports.restrictPermissions = restrictPermissions;
/**
 * Default restrictive tool permissions (deny by default)
 */
exports.DENY_ALL_CORE_TOOLS = {
    read: false,
    write: false,
    edit: false,
    glob: false,
    grep: false,
    task: false,
    webFetch: false,
    webSearch: false,
    todoWrite: false,
    ls: false,
    notebookEdit: false,
};
/**
 * Permissive tool permissions (allow all)
 */
exports.ALLOW_ALL_CORE_TOOLS = {
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
};
/**
 * Read-only tool permissions
 */
exports.READ_ONLY_CORE_TOOLS = {
    read: true,
    write: false,
    edit: false,
    glob: true,
    grep: true,
    task: false,
    webFetch: true,
    webSearch: true,
    todoWrite: false,
    ls: true,
    notebookEdit: false,
};
/**
 * No bash access
 */
exports.DENY_BASH = {
    enabled: false,
    allowedPatterns: [],
    deniedPatterns: ['.*'],
    sandboxed: true,
    maxExecutionTimeMs: 0,
    allowBackground: false,
};
/**
 * Read-only bash (safe commands only)
 */
exports.READ_ONLY_BASH = {
    enabled: true,
    allowedPatterns: [
        '^(ls|cat|head|tail|wc|grep|find|echo|pwd|whoami|date|which|type)\\b',
        '^git\\s+(status|log|diff|show|branch)\\b',
        '^npm\\s+(list|ls|outdated)\\b',
    ],
    deniedPatterns: [
        'rm\\s', 'mv\\s', 'cp\\s', // File operations
        'chmod', 'chown', // Permissions
        'sudo', 'su\\b', // Elevation
        '\\|\\s*sh', '\\|\\s*bash', // Pipe to shell
        '\\$\\(', '`', // Command substitution
        '>', '>>', '\\|', // Redirects and pipes (conservative)
    ],
    sandboxed: true,
    maxExecutionTimeMs: 30000,
    allowBackground: false,
};
/**
 * Development bash (build tools allowed)
 */
exports.DEV_BASH = {
    enabled: true,
    allowedPatterns: [
        '^(npm|yarn|pnpm|npx)\\s',
        '^(node|python|python3|ruby)\\s',
        '^git\\s',
        '^(docker|docker-compose)\\s',
        '^(make|cmake)\\b',
        '^(curl|wget)\\s',
        '^(ls|cat|head|tail|wc|grep|find|echo|pwd|mkdir|touch)\\b',
    ],
    deniedPatterns: [
        'sudo', 'su\\b',
        'rm\\s+-rf\\s+/', // Protect root
        'chmod\\s+777', // Dangerous permissions
        ':(){ :|:& };:', // Fork bomb
    ],
    sandboxed: false,
    maxExecutionTimeMs: 300000, // 5 minutes
    allowBackground: true,
};
/**
 * No file system access
 */
exports.DENY_FILESYSTEM = {
    readPatterns: [],
    writePatterns: [],
    denyPatterns: ['**/*'],
    maxReadSizeBytes: 0,
    maxWriteSizeBytes: 0,
    maxTotalWriteBytes: 0,
};
/**
 * Project-scoped file system (typical development)
 */
exports.PROJECT_FILESYSTEM = {
    readPatterns: [
        './**/*', // Project files
        '~/.claude/**/*', // Claude config
    ],
    writePatterns: [
        './src/**/*',
        './test/**/*',
        './docs/**/*',
        './*.json',
        './*.md',
        './*.ts',
        './*.js',
    ],
    denyPatterns: [
        '**/.env*', // Environment files
        '**/secrets/**', // Secrets directories
        '**/*.pem', // Keys
        '**/*.key',
        '**/node_modules/**', // Dependencies
        '**/.git/objects/**', // Git internals
    ],
    maxReadSizeBytes: 10 * 1024 * 1024, // 10 MB
    maxWriteSizeBytes: 1 * 1024 * 1024, // 1 MB
    maxTotalWriteBytes: 50 * 1024 * 1024, // 50 MB
};
/**
 * No MCP access
 */
exports.DENY_MCP = {
    allowed: [],
    denied: ['*:*'],
};
/**
 * Read-only MCP tools
 */
exports.READ_ONLY_MCP = {
    allowed: [
        'skill-matcher:*',
        'skills-search:*',
        'Context7:*',
        'brave-search:*',
    ],
    denied: [
        '*:write*',
        '*:create*',
        '*:delete*',
        '*:update*',
    ],
};
/**
 * No network access
 */
exports.DENY_NETWORK = {
    enabled: false,
    allowedDomains: [],
    deniedDomains: ['*'],
    allowedProtocols: [],
    maxRequestSizeBytes: 0,
    maxResponseSizeBytes: 0,
    requestTimeoutMs: 0,
    maxConcurrentRequests: 0,
};
/**
 * Public API access only
 */
exports.PUBLIC_API_NETWORK = {
    enabled: true,
    allowedDomains: [
        '*.github.com',
        '*.githubusercontent.com',
        'api.anthropic.com',
        '*.npmjs.org',
        '*.pypi.org',
        'context7.com',
    ],
    deniedDomains: [
        'localhost',
        '127.0.0.1',
        '*.local',
        '10.*',
        '192.168.*',
        '172.16.*',
    ],
    allowedProtocols: ['https'],
    maxRequestSizeBytes: 1 * 1024 * 1024, // 1 MB
    maxResponseSizeBytes: 10 * 1024 * 1024, // 10 MB
    requestTimeoutMs: 30000,
    maxConcurrentRequests: 5,
};
/**
 * Default model permissions
 */
exports.DEFAULT_MODEL_PERMISSIONS = {
    allowed: ['haiku', 'sonnet'],
    preferredForSpawning: 'haiku',
    maxTokensPerModel: {
        haiku: 4096,
        sonnet: 8192,
    },
    allowEscalation: true,
};
/**
 * Strict isolation: minimal permissions, sandboxed execution
 */
exports.STRICT_ISOLATION = {
    coreTools: exports.READ_ONLY_CORE_TOOLS,
    bash: exports.DENY_BASH,
    fileSystem: exports.DENY_FILESYSTEM,
    mcpTools: exports.DENY_MCP,
    network: exports.DENY_NETWORK,
    models: {
        allowed: ['haiku'],
        preferredForSpawning: 'haiku',
        maxTokensPerModel: { haiku: 2048 },
        allowEscalation: false,
    },
};
/**
 * Moderate isolation: development-appropriate permissions
 */
exports.MODERATE_ISOLATION = {
    coreTools: __assign(__assign({}, exports.ALLOW_ALL_CORE_TOOLS), { task: false }),
    bash: exports.READ_ONLY_BASH,
    fileSystem: exports.PROJECT_FILESYSTEM,
    mcpTools: exports.READ_ONLY_MCP,
    network: exports.PUBLIC_API_NETWORK,
    models: exports.DEFAULT_MODEL_PERMISSIONS,
};
/**
 * Permissive: full access (use with caution)
 */
exports.PERMISSIVE_ISOLATION = {
    coreTools: exports.ALLOW_ALL_CORE_TOOLS,
    bash: exports.DEV_BASH,
    fileSystem: __assign(__assign({}, exports.PROJECT_FILESYSTEM), { writePatterns: ['./**/*'], maxWriteSizeBytes: 10 * 1024 * 1024, maxTotalWriteBytes: 100 * 1024 * 1024 }),
    mcpTools: {
        allowed: ['*:*'],
        denied: [],
    },
    network: __assign(__assign({}, exports.PUBLIC_API_NETWORK), { allowedDomains: ['*'] }),
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
 * Get permission matrix for isolation level
 */
function getPermissionMatrixForLevel(level) {
    switch (level) {
        case 'strict':
            return exports.STRICT_ISOLATION;
        case 'moderate':
            return exports.MODERATE_ISOLATION;
        case 'permissive':
            return exports.PERMISSIVE_ISOLATION;
    }
}
/**
 * Validates that child permissions are a subset of parent permissions.
 * This is the core rule: children can only be equal to or more restrictive.
 */
function validatePermissionInheritance(parent, child) {
    var errors = [];
    var warnings = [];
    // Validate core tools
    for (var _i = 0, _a = Object.entries(child.coreTools); _i < _a.length; _i++) {
        var _b = _a[_i], tool = _b[0], allowed = _b[1];
        if (allowed && !parent.coreTools[tool]) {
            errors.push({
                path: "coreTools.".concat(tool),
                message: "Child cannot enable ".concat(tool, " when parent has it disabled"),
                parentValue: false,
                childValue: true,
            });
        }
    }
    // Validate bash
    if (child.bash.enabled && !parent.bash.enabled) {
        errors.push({
            path: 'bash.enabled',
            message: 'Child cannot enable bash when parent has it disabled',
            parentValue: false,
            childValue: true,
        });
    }
    // Validate models
    for (var _c = 0, _d = child.models.allowed; _c < _d.length; _c++) {
        var model = _d[_c];
        if (!parent.models.allowed.includes(model)) {
            errors.push({
                path: 'models.allowed',
                message: "Child cannot use model ".concat(model, " not allowed by parent"),
                parentValue: parent.models.allowed,
                childValue: child.models.allowed,
            });
        }
    }
    // Check for potential issues (warnings)
    if (child.bash.enabled && child.bash.allowedPatterns.length === 0) {
        warnings.push('Bash is enabled but no patterns are allowed - effectively disabled');
    }
    if (child.network.enabled && child.network.allowedDomains.length === 0) {
        warnings.push('Network is enabled but no domains are allowed - effectively disabled');
    }
    return {
        valid: errors.length === 0,
        errors: errors,
        warnings: warnings,
    };
}
/**
 * Creates a restricted copy of permissions
 */
function restrictPermissions(base, restrictions) {
    return {
        coreTools: __assign(__assign({}, base.coreTools), restrictions.coreTools),
        bash: __assign(__assign({}, base.bash), restrictions.bash),
        fileSystem: __assign(__assign({}, base.fileSystem), restrictions.fileSystem),
        mcpTools: __assign(__assign({}, base.mcpTools), restrictions.mcpTools),
        network: __assign(__assign({}, base.network), restrictions.network),
        models: __assign(__assign({}, base.models), restrictions.models),
    };
}
