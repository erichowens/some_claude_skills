/**
 * Permission Presets - Common permission configurations
 *
 * Provides ready-to-use permission matrices for common use cases,
 * from highly restrictive to permissive development configurations.
 */

import { PermissionMatrix, IsolationLevel } from '../types/permissions';

/**
 * Minimal permissions - read-only access with no external connectivity
 */
export const MINIMAL_PERMISSIONS: PermissionMatrix = {
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
      '**/.*',           // Hidden files
      '**/.env*',        // Environment files
      '**/secrets/**',   // Secrets directories
      '**/credentials*', // Credentials files
      '**/*.pem',        // Private keys
      '**/*.key',        // Key files
    ],
    maxReadSizeBytes: 1 * 1024 * 1024,      // 1 MB
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
export const READ_ONLY_PERMISSIONS: PermissionMatrix = {
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
    maxExecutionTimeMs: 30_000,
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
    maxReadSizeBytes: 10 * 1024 * 1024,     // 10 MB
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
    maxRequestSizeBytes: 1 * 1024 * 1024,    // 1 MB
    maxResponseSizeBytes: 10 * 1024 * 1024,  // 10 MB
    requestTimeoutMs: 30_000,
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
export const STANDARD_PERMISSIONS: PermissionMatrix = {
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
      '^rm\\s+-[rf]*\\s+(?!/)\\S+',  // rm only in relative paths
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
      '\\$\\(',          // Command substitution
    ],
    maxExecutionTimeMs: 300_000, // 5 minutes
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
    maxReadSizeBytes: 10 * 1024 * 1024,      // 10 MB
    maxWriteSizeBytes: 1 * 1024 * 1024,      // 1 MB
    maxTotalWriteBytes: 50 * 1024 * 1024,    // 50 MB
  },
  mcpTools: {
    allowed: ['*'],
    denied: [],
  },
  network: {
    enabled: true,
    allowedDomains: [],  // All domains allowed
    deniedDomains: [],
    allowedProtocols: ['http', 'https'],
    maxRequestSizeBytes: 5 * 1024 * 1024,    // 5 MB
    maxResponseSizeBytes: 20 * 1024 * 1024,  // 20 MB
    requestTimeoutMs: 60_000,
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
export const FULL_PERMISSIONS: PermissionMatrix = {
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
    allowedPatterns: ['.*'],  // All commands
    deniedPatterns: [],       // Nothing denied
    maxExecutionTimeMs: 600_000, // 10 minutes
    allowBackground: true,
  },
  fileSystem: {
    readPatterns: ['**/*'],
    writePatterns: ['**/*'],
    denyPatterns: [],
    maxReadSizeBytes: 100 * 1024 * 1024,     // 100 MB
    maxWriteSizeBytes: 50 * 1024 * 1024,     // 50 MB
    maxTotalWriteBytes: 500 * 1024 * 1024,   // 500 MB
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
    maxRequestSizeBytes: 50 * 1024 * 1024,   // 50 MB
    maxResponseSizeBytes: 100 * 1024 * 1024, // 100 MB
    requestTimeoutMs: 300_000,
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
export const CI_CD_PERMISSIONS: PermissionMatrix = {
  coreTools: {
    read: true,
    write: true,
    edit: true,
    glob: true,
    grep: true,
    task: true,
    webFetch: true,
    webSearch: false,  // No web search in CI
    todoWrite: false,  // No todo management in CI
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
    maxExecutionTimeMs: 600_000, // 10 minutes for CI builds
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
    maxReadSizeBytes: 50 * 1024 * 1024,      // 50 MB
    maxWriteSizeBytes: 20 * 1024 * 1024,     // 20 MB
    maxTotalWriteBytes: 200 * 1024 * 1024,   // 200 MB
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
    maxRequestSizeBytes: 10 * 1024 * 1024,   // 10 MB
    maxResponseSizeBytes: 50 * 1024 * 1024,  // 50 MB
    requestTimeoutMs: 120_000,
    maxConcurrentRequests: 10,
  },
  models: {
    allowed: ['haiku', 'sonnet'],
    preferredForSpawning: 'haiku',  // Cost-effective for CI
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
export const RESEARCH_PERMISSIONS: PermissionMatrix = {
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
    maxExecutionTimeMs: 60_000,
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
    maxReadSizeBytes: 20 * 1024 * 1024,      // 20 MB
    maxWriteSizeBytes: 5 * 1024 * 1024,      // 5 MB
    maxTotalWriteBytes: 50 * 1024 * 1024,    // 50 MB
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
    allowedDomains: [],  // All domains for research
    deniedDomains: [],
    allowedProtocols: ['https'],
    maxRequestSizeBytes: 5 * 1024 * 1024,    // 5 MB
    maxResponseSizeBytes: 30 * 1024 * 1024,  // 30 MB
    requestTimeoutMs: 60_000,
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
export const CODE_GENERATION_PERMISSIONS: PermissionMatrix = {
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
    maxExecutionTimeMs: 300_000,
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
    maxReadSizeBytes: 10 * 1024 * 1024,      // 10 MB
    maxWriteSizeBytes: 2 * 1024 * 1024,      // 2 MB
    maxTotalWriteBytes: 100 * 1024 * 1024,   // 100 MB
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
    maxRequestSizeBytes: 5 * 1024 * 1024,    // 5 MB
    maxResponseSizeBytes: 20 * 1024 * 1024,  // 20 MB
    requestTimeoutMs: 60_000,
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
export function getPreset(name: PresetName): PermissionMatrix {
  const presets: Record<PresetName, PermissionMatrix> = {
    minimal: MINIMAL_PERMISSIONS,
    'read-only': READ_ONLY_PERMISSIONS,
    standard: STANDARD_PERMISSIONS,
    full: FULL_PERMISSIONS,
    'ci-cd': CI_CD_PERMISSIONS,
    research: RESEARCH_PERMISSIONS,
    'code-generation': CODE_GENERATION_PERMISSIONS,
  };

  const preset = presets[name];
  if (!preset) {
    throw new Error(`Unknown preset: ${name}. Available: ${Object.keys(presets).join(', ')}`);
  }

  return { ...preset };  // Return a copy
}

export type PresetName =
  | 'minimal'
  | 'read-only'
  | 'standard'
  | 'full'
  | 'ci-cd'
  | 'research'
  | 'code-generation';

/**
 * Get recommended preset based on task type
 */
export function getRecommendedPreset(taskType: TaskType): PresetName {
  const recommendations: Record<TaskType, PresetName> = {
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

export type TaskType =
  | 'analysis'
  | 'research'
  | 'refactoring'
  | 'new-feature'
  | 'bug-fix'
  | 'testing'
  | 'documentation'
  | 'deployment'
  | 'exploration';

/**
 * Get recommended isolation level based on preset
 */
export function getIsolationLevel(preset: PresetName): IsolationLevel {
  const levels: Record<PresetName, IsolationLevel> = {
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
export function createCustomPreset(
  base: PresetName,
  overrides: DeepPartial<PermissionMatrix>
): PermissionMatrix {
  const basePreset = getPreset(base);
  return deepMerge(basePreset, overrides) as PermissionMatrix;
}

/**
 * Deep partial type helper
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep merge helper
 */
function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
  const result = { ...target };

  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue !== undefined &&
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue as DeepPartial<typeof targetValue>);
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[keyof T];
    }
  }

  return result;
}

/**
 * List all available presets with descriptions
 */
export function listPresets(): Array<{ name: PresetName; description: string; securityLevel: string }> {
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
