/**
 * Permission System Type Definitions
 *
 * Defines the permission matrix for agent spawning and execution.
 * Follows the principle: child permissions must be equal to or more restrictive than parent.
 */

// =============================================================================
// Core Tool Permissions
// =============================================================================

/**
 * Permissions for Claude Code's core tools
 */
export interface CoreToolPermissions {
  /** Read files from filesystem */
  read: boolean;

  /** Write/create files */
  write: boolean;

  /** Edit existing files */
  edit: boolean;

  /** Search for files by pattern */
  glob: boolean;

  /** Search file contents */
  grep: boolean;

  /** Spawn sub-agents via Task tool */
  task: boolean;

  /** Fetch web content */
  webFetch: boolean;

  /** Search the web */
  webSearch: boolean;

  /** Write todo items */
  todoWrite: boolean;

  /** List directory contents */
  ls: boolean;

  /** Notebook editing */
  notebookEdit: boolean;
}

/**
 * Default restrictive tool permissions (deny by default)
 */
export const DENY_ALL_CORE_TOOLS: CoreToolPermissions = {
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
export const ALLOW_ALL_CORE_TOOLS: CoreToolPermissions = {
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
export const READ_ONLY_CORE_TOOLS: CoreToolPermissions = {
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

// =============================================================================
// Bash Permissions
// =============================================================================

/**
 * Permissions for bash command execution
 */
export interface BashPermissions {
  /** Whether bash is enabled at all */
  enabled: boolean;

  /** Regex patterns for allowed commands */
  allowedPatterns: string[];

  /** Regex patterns for denied commands (takes precedence) */
  deniedPatterns: string[];

  /** Whether to run in sandboxed mode */
  sandboxed: boolean;

  /** Maximum execution time (ms) */
  maxExecutionTimeMs: number;

  /** Whether to allow background processes */
  allowBackground: boolean;

  /** Environment variables to set */
  environmentOverrides?: Record<string, string>;

  /** Working directory restriction */
  workingDirectoryPattern?: string;
}

/**
 * No bash access
 */
export const DENY_BASH: BashPermissions = {
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
export const READ_ONLY_BASH: BashPermissions = {
  enabled: true,
  allowedPatterns: [
    '^(ls|cat|head|tail|wc|grep|find|echo|pwd|whoami|date|which|type)\\b',
    '^git\\s+(status|log|diff|show|branch)\\b',
    '^npm\\s+(list|ls|outdated)\\b',
  ],
  deniedPatterns: [
    'rm\\s', 'mv\\s', 'cp\\s',  // File operations
    'chmod', 'chown',            // Permissions
    'sudo', 'su\\b',             // Elevation
    '\\|\\s*sh', '\\|\\s*bash',  // Pipe to shell
    '\\$\\(', '`',               // Command substitution
    '>', '>>', '\\|',            // Redirects and pipes (conservative)
  ],
  sandboxed: true,
  maxExecutionTimeMs: 30_000,
  allowBackground: false,
};

/**
 * Development bash (build tools allowed)
 */
export const DEV_BASH: BashPermissions = {
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
    'rm\\s+-rf\\s+/',           // Protect root
    'chmod\\s+777',              // Dangerous permissions
    ':(){ :|:& };:',             // Fork bomb
  ],
  sandboxed: false,
  maxExecutionTimeMs: 300_000,  // 5 minutes
  allowBackground: true,
};

// =============================================================================
// File System Permissions
// =============================================================================

/**
 * File system access permissions
 */
export interface FileSystemPermissions {
  /** Glob patterns for readable paths */
  readPatterns: string[];

  /** Glob patterns for writable paths */
  writePatterns: string[];

  /** Glob patterns that are always denied (highest precedence) */
  denyPatterns: string[];

  /** Maximum file size that can be read (bytes) */
  maxReadSizeBytes: number;

  /** Maximum file size that can be written (bytes) */
  maxWriteSizeBytes: number;

  /** Maximum total bytes that can be written per session */
  maxTotalWriteBytes: number;

  /** File extensions that can be read */
  allowedReadExtensions?: string[];

  /** File extensions that can be written */
  allowedWriteExtensions?: string[];
}

/**
 * No file system access
 */
export const DENY_FILESYSTEM: FileSystemPermissions = {
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
export const PROJECT_FILESYSTEM: FileSystemPermissions = {
  readPatterns: [
    './**/*',           // Project files
    '~/.claude/**/*',   // Claude config
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
    '**/.env*',         // Environment files
    '**/secrets/**',    // Secrets directories
    '**/*.pem',         // Keys
    '**/*.key',
    '**/node_modules/**',  // Dependencies
    '**/.git/objects/**',  // Git internals
  ],
  maxReadSizeBytes: 10 * 1024 * 1024,     // 10 MB
  maxWriteSizeBytes: 1 * 1024 * 1024,     // 1 MB
  maxTotalWriteBytes: 50 * 1024 * 1024,   // 50 MB
};

// =============================================================================
// MCP Tool Permissions
// =============================================================================

/**
 * Permissions for MCP server tools
 */
export interface MCPToolPermissions {
  /** Allowed tools in 'server:tool' format, or '*' for server wildcard */
  allowed: string[];

  /** Denied tools (takes precedence over allowed) */
  denied: string[];

  /** Per-tool rate limits */
  rateLimits?: Record<string, {
    maxCallsPerMinute: number;
    maxCallsPerHour: number;
  }>;
}

/**
 * No MCP access
 */
export const DENY_MCP: MCPToolPermissions = {
  allowed: [],
  denied: ['*:*'],
};

/**
 * Read-only MCP tools
 */
export const READ_ONLY_MCP: MCPToolPermissions = {
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

// =============================================================================
// Network Permissions
// =============================================================================

/**
 * Network access permissions
 */
export interface NetworkPermissions {
  /** Whether network access is enabled */
  enabled: boolean;

  /** Allowed domains (supports wildcards) */
  allowedDomains: string[];

  /** Denied domains (takes precedence) */
  deniedDomains: string[];

  /** Allowed protocols */
  allowedProtocols: ('http' | 'https' | 'ws' | 'wss')[];

  /** Maximum request size (bytes) */
  maxRequestSizeBytes: number;

  /** Maximum response size (bytes) */
  maxResponseSizeBytes: number;

  /** Request timeout (ms) */
  requestTimeoutMs: number;

  /** Maximum concurrent requests */
  maxConcurrentRequests: number;
}

/**
 * No network access
 */
export const DENY_NETWORK: NetworkPermissions = {
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
export const PUBLIC_API_NETWORK: NetworkPermissions = {
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
  maxRequestSizeBytes: 1 * 1024 * 1024,    // 1 MB
  maxResponseSizeBytes: 10 * 1024 * 1024,  // 10 MB
  requestTimeoutMs: 30_000,
  maxConcurrentRequests: 5,
};

// =============================================================================
// Model Permissions
// =============================================================================

/**
 * Which Claude models can be used
 */
export interface ModelPermissions {
  /** Allowed models */
  allowed: ('haiku' | 'sonnet' | 'opus')[];

  /** Preferred model for spawning sub-agents */
  preferredForSpawning: 'haiku' | 'sonnet' | 'opus';

  /** Maximum tokens per request by model */
  maxTokensPerModel: {
    haiku?: number;
    sonnet?: number;
    opus?: number;
  };

  /** Whether to allow model escalation (simpler -> more capable) */
  allowEscalation: boolean;
}

/**
 * Default model permissions
 */
export const DEFAULT_MODEL_PERMISSIONS: ModelPermissions = {
  allowed: ['haiku', 'sonnet'],
  preferredForSpawning: 'haiku',
  maxTokensPerModel: {
    haiku: 4096,
    sonnet: 8192,
  },
  allowEscalation: true,
};

// =============================================================================
// Complete Permission Matrix
// =============================================================================

/**
 * The complete permission matrix for an agent
 */
export interface PermissionMatrix {
  /** Core tool permissions */
  coreTools: CoreToolPermissions;

  /** Bash permissions */
  bash: BashPermissions;

  /** File system permissions */
  fileSystem: FileSystemPermissions;

  /** MCP tool permissions */
  mcpTools: MCPToolPermissions;

  /** Network permissions */
  network: NetworkPermissions;

  /** Model permissions */
  models: ModelPermissions;
}

// =============================================================================
// Isolation Levels
// =============================================================================

/**
 * Predefined isolation levels
 */
export type IsolationLevel = 'strict' | 'moderate' | 'permissive';

/**
 * Strict isolation: minimal permissions, sandboxed execution
 */
export const STRICT_ISOLATION: PermissionMatrix = {
  coreTools: READ_ONLY_CORE_TOOLS,
  bash: DENY_BASH,
  fileSystem: DENY_FILESYSTEM,
  mcpTools: DENY_MCP,
  network: DENY_NETWORK,
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
export const MODERATE_ISOLATION: PermissionMatrix = {
  coreTools: {
    ...ALLOW_ALL_CORE_TOOLS,
    task: false,  // No recursive spawning
  },
  bash: READ_ONLY_BASH,
  fileSystem: PROJECT_FILESYSTEM,
  mcpTools: READ_ONLY_MCP,
  network: PUBLIC_API_NETWORK,
  models: DEFAULT_MODEL_PERMISSIONS,
};

/**
 * Permissive: full access (use with caution)
 */
export const PERMISSIVE_ISOLATION: PermissionMatrix = {
  coreTools: ALLOW_ALL_CORE_TOOLS,
  bash: DEV_BASH,
  fileSystem: {
    ...PROJECT_FILESYSTEM,
    writePatterns: ['./**/*'],
    maxWriteSizeBytes: 10 * 1024 * 1024,
    maxTotalWriteBytes: 100 * 1024 * 1024,
  },
  mcpTools: {
    allowed: ['*:*'],
    denied: [],
  },
  network: {
    ...PUBLIC_API_NETWORK,
    allowedDomains: ['*'],
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
 * Get permission matrix for isolation level
 */
export function getPermissionMatrixForLevel(level: IsolationLevel): PermissionMatrix {
  switch (level) {
    case 'strict':
      return STRICT_ISOLATION;
    case 'moderate':
      return MODERATE_ISOLATION;
    case 'permissive':
      return PERMISSIVE_ISOLATION;
  }
}

// =============================================================================
// Permission Validation
// =============================================================================

/**
 * Result of permission validation
 */
export interface PermissionValidationResult {
  /** Whether the permissions are valid */
  valid: boolean;

  /** Validation errors */
  errors: PermissionValidationError[];

  /** Warnings (non-blocking) */
  warnings: string[];
}

/**
 * A specific permission validation error
 */
export interface PermissionValidationError {
  /** Which part of the matrix has the error */
  path: string;

  /** Error message */
  message: string;

  /** The parent's permission value */
  parentValue?: unknown;

  /** The child's requested permission value */
  childValue?: unknown;
}

/**
 * Validates that child permissions are a subset of parent permissions.
 * This is the core rule: children can only be equal to or more restrictive.
 */
export function validatePermissionInheritance(
  parent: PermissionMatrix,
  child: PermissionMatrix
): PermissionValidationResult {
  const errors: PermissionValidationError[] = [];
  const warnings: string[] = [];

  // Validate core tools
  for (const [tool, allowed] of Object.entries(child.coreTools) as [keyof CoreToolPermissions, boolean][]) {
    if (allowed && !parent.coreTools[tool]) {
      errors.push({
        path: `coreTools.${tool}`,
        message: `Child cannot enable ${tool} when parent has it disabled`,
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
  for (const model of child.models.allowed) {
    if (!parent.models.allowed.includes(model)) {
      errors.push({
        path: 'models.allowed',
        message: `Child cannot use model ${model} not allowed by parent`,
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
    errors,
    warnings,
  };
}

/**
 * Creates a restricted copy of permissions
 */
export function restrictPermissions(
  base: PermissionMatrix,
  restrictions: Partial<PermissionMatrix>
): PermissionMatrix {
  return {
    coreTools: { ...base.coreTools, ...restrictions.coreTools },
    bash: { ...base.bash, ...restrictions.bash },
    fileSystem: { ...base.fileSystem, ...restrictions.fileSystem },
    mcpTools: { ...base.mcpTools, ...restrictions.mcpTools },
    network: { ...base.network, ...restrictions.network },
    models: { ...base.models, ...restrictions.models },
  };
}
