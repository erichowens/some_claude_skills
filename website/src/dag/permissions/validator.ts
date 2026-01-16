/**
 * Permission Validator - Validates permission inheritance and constraints
 *
 * Ensures child agents can only have permissions equal to or more restrictive
 * than their parent agents. Validates permission matrices against security policies.
 */

import {
  PermissionMatrix,
  FileSystemPermissions,
  BashPermissions,
  NetworkPermissions,
  MCPToolPermissions,
  CoreToolPermissions,
} from '../types/permissions';

/**
 * Result of permission validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: PermissionError[];
  warnings: PermissionWarning[];
  inheritanceValid: boolean;
  securityScore: number; // 0-100, higher is more restrictive
}

export interface PermissionError {
  code: PermissionErrorCode;
  message: string;
  field: string;
  parentValue?: unknown;
  childValue?: unknown;
}

export interface PermissionWarning {
  code: PermissionWarningCode;
  message: string;
  field: string;
  recommendation?: string;
}

export type PermissionErrorCode =
  | 'INHERITANCE_VIOLATION'
  | 'INVALID_PATTERN'
  | 'CONFLICTING_RULES'
  | 'MISSING_REQUIRED'
  | 'INVALID_ISOLATION'
  | 'SCOPE_EXCEEDED';

export type PermissionWarningCode =
  | 'OVERLY_PERMISSIVE'
  | 'UNUSED_PERMISSION'
  | 'DEPRECATED_PATTERN'
  | 'SECURITY_RECOMMENDATION';

/**
 * Permission Validator class
 */
export class PermissionValidator {
  private readonly strictMode: boolean;

  constructor(options: { strictMode?: boolean } = {}) {
    this.strictMode = options.strictMode ?? true;
  }

  /**
   * Validate that child permissions are a subset of parent permissions
   */
  validateInheritance(
    parent: PermissionMatrix,
    child: PermissionMatrix
  ): ValidationResult {
    const errors: PermissionError[] = [];
    const warnings: PermissionWarning[] = [];

    // Validate core tools
    this.validateCoreToolInheritance(parent.coreTools, child.coreTools, errors);

    // Validate bash permissions
    this.validateBashInheritance(parent.bash, child.bash, errors, warnings);

    // Validate file system permissions
    this.validateFileSystemInheritance(
      parent.fileSystem,
      child.fileSystem,
      errors,
      warnings
    );

    // Validate MCP permissions
    this.validateMcpInheritance(parent.mcpTools, child.mcpTools, errors);

    // Validate network permissions
    this.validateNetworkInheritance(parent.network, child.network, errors);

    // Validate model permissions
    this.validateModelInheritance(parent.models, child.models, errors);

    // Calculate security score
    const securityScore = this.calculateSecurityScore(child);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      inheritanceValid: errors.filter((e) => e.code === 'INHERITANCE_VIOLATION').length === 0,
      securityScore,
    };
  }

  /**
   * Validate a single permission matrix
   */
  validate(permissions: PermissionMatrix): ValidationResult {
    const errors: PermissionError[] = [];
    const warnings: PermissionWarning[] = [];

    // Validate structure
    this.validateStructure(permissions, errors);

    // Validate patterns
    this.validatePatterns(permissions, errors, warnings);

    // Check for conflicts
    this.detectConflicts(permissions, errors, warnings);

    // Security recommendations
    this.addSecurityRecommendations(permissions, warnings);

    const securityScore = this.calculateSecurityScore(permissions);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      inheritanceValid: true, // No parent to compare
      securityScore,
    };
  }

  /**
   * Check if child can inherit from parent
   */
  canInherit(parent: PermissionMatrix, child: PermissionMatrix): boolean {
    const result = this.validateInheritance(parent, child);
    return result.inheritanceValid;
  }

  /**
   * Create a restricted child permission matrix
   */
  createRestrictedChild(
    parent: PermissionMatrix,
    restrictions: Partial<PermissionMatrix>
  ): PermissionMatrix {
    const child: PermissionMatrix = {
      coreTools: this.intersectCoreTools(
        parent.coreTools,
        restrictions.coreTools || parent.coreTools
      ),
      bash: this.restrictBash(parent.bash, restrictions.bash),
      fileSystem: this.restrictFileSystem(parent.fileSystem, restrictions.fileSystem),
      mcpTools: this.restrictMcp(parent.mcpTools, restrictions.mcpTools),
      network: this.restrictNetwork(parent.network, restrictions.network),
      models: this.restrictModels(parent.models, restrictions.models),
    };

    // Validate the result
    const validation = this.validateInheritance(parent, child);
    if (!validation.valid) {
      throw new PermissionValidationError(
        'Failed to create valid restricted child',
        validation.errors
      );
    }

    return child;
  }

  // ==================== Private Validation Methods ====================

  private validateCoreToolInheritance(
    parent: CoreToolPermissions,
    child: CoreToolPermissions,
    errors: PermissionError[]
  ): void {
    const tools: Array<keyof CoreToolPermissions> = [
      'read',
      'write',
      'edit',
      'glob',
      'grep',
      'task',
      'webFetch',
      'webSearch',
      'todoWrite',
      'ls',
      'notebookEdit',
    ];

    for (const tool of tools) {
      if (!parent[tool] && child[tool]) {
        errors.push({
          code: 'INHERITANCE_VIOLATION',
          message: `Child cannot have ${tool} permission when parent doesn't`,
          field: `coreTools.${tool}`,
          parentValue: parent[tool],
          childValue: child[tool],
        });
      }
    }
  }

  private validateBashInheritance(
    parent: BashPermissions,
    child: BashPermissions,
    errors: PermissionError[],
    warnings: PermissionWarning[]
  ): void {
    // Can't enable bash if parent disabled
    if (!parent.enabled && child.enabled) {
      errors.push({
        code: 'INHERITANCE_VIOLATION',
        message: 'Child cannot enable bash when parent has it disabled',
        field: 'bash.enabled',
        parentValue: false,
        childValue: true,
      });
    }

    // Can't disable sandbox if parent has it enabled
    if (parent.sandboxed && !child.sandboxed) {
      errors.push({
        code: 'INHERITANCE_VIOLATION',
        message: 'Child cannot disable sandbox when parent requires it',
        field: 'bash.sandboxed',
        parentValue: true,
        childValue: false,
      });
    }

    // Allowed patterns must be subset
    if (child.allowedPatterns) {
      for (const pattern of child.allowedPatterns) {
        if (!this.patternIsSubset(pattern, parent.allowedPatterns || [])) {
          errors.push({
            code: 'INHERITANCE_VIOLATION',
            message: `Child bash pattern "${pattern}" not allowed by parent`,
            field: 'bash.allowedPatterns',
            parentValue: parent.allowedPatterns,
            childValue: pattern,
          });
        }
      }
    }

    // Warn about missing denied patterns
    if (parent.deniedPatterns && parent.deniedPatterns.length > 0) {
      const childDenied = new Set(child.deniedPatterns || []);
      for (const pattern of parent.deniedPatterns) {
        if (!childDenied.has(pattern)) {
          warnings.push({
            code: 'SECURITY_RECOMMENDATION',
            message: `Parent denies pattern "${pattern}" but child doesn't explicitly deny it`,
            field: 'bash.deniedPatterns',
            recommendation: 'Consider explicitly denying this pattern in child',
          });
        }
      }
    }
  }

  private validateFileSystemInheritance(
    parent: FileSystemPermissions,
    child: FileSystemPermissions,
    errors: PermissionError[],
    warnings: PermissionWarning[]
  ): void {
    // Read patterns must be subset
    if (child.readPatterns) {
      for (const pattern of child.readPatterns) {
        if (!this.globIsSubset(pattern, parent.readPatterns || [])) {
          errors.push({
            code: 'INHERITANCE_VIOLATION',
            message: `Child read pattern "${pattern}" exceeds parent permissions`,
            field: 'fileSystem.readPatterns',
            parentValue: parent.readPatterns,
            childValue: pattern,
          });
        }
      }
    }

    // Write patterns must be subset
    if (child.writePatterns) {
      for (const pattern of child.writePatterns) {
        if (!this.globIsSubset(pattern, parent.writePatterns || [])) {
          errors.push({
            code: 'INHERITANCE_VIOLATION',
            message: `Child write pattern "${pattern}" exceeds parent permissions`,
            field: 'fileSystem.writePatterns',
            parentValue: parent.writePatterns,
            childValue: pattern,
          });
        }
      }
    }

    // Child should inherit deny patterns
    if (parent.denyPatterns && parent.denyPatterns.length > 0) {
      const childDeny = new Set(child.denyPatterns || []);
      for (const pattern of parent.denyPatterns) {
        if (!childDeny.has(pattern)) {
          warnings.push({
            code: 'SECURITY_RECOMMENDATION',
            message: `Parent denies path "${pattern}" but child doesn't`,
            field: 'fileSystem.denyPatterns',
            recommendation: 'Inherit deny patterns from parent',
          });
        }
      }
    }
  }

  private validateMcpInheritance(
    parent: MCPToolPermissions,
    child: MCPToolPermissions,
    errors: PermissionError[]
  ): void {
    // Child allowed tools must be subset of parent
    if (child.allowed) {
      const parentAllowed = new Set(parent.allowed || []);
      for (const tool of child.allowed) {
        if (!parentAllowed.has(tool) && !this.matchesWildcard(tool, parent.allowed || [])) {
          errors.push({
            code: 'INHERITANCE_VIOLATION',
            message: `Child MCP tool "${tool}" not allowed by parent`,
            field: 'mcpTools.allowed',
            parentValue: parent.allowed,
            childValue: tool,
          });
        }
      }
    }

    // Child must inherit parent's denied tools
    if (parent.denied) {
      const childDenied = new Set(child.denied || []);
      for (const tool of parent.denied) {
        // Check if child allows a tool that parent denies
        if (child.allowed?.includes(tool)) {
          errors.push({
            code: 'INHERITANCE_VIOLATION',
            message: `Child allows MCP tool "${tool}" that parent denies`,
            field: 'mcpTools.denied',
            parentValue: parent.denied,
            childValue: child.allowed,
          });
        }
      }
    }
  }

  private validateNetworkInheritance(
    parent: NetworkPermissions,
    child: NetworkPermissions,
    errors: PermissionError[]
  ): void {
    // Can't enable network if parent disabled
    if (!parent.enabled && child.enabled) {
      errors.push({
        code: 'INHERITANCE_VIOLATION',
        message: 'Child cannot enable network when parent has it disabled',
        field: 'network.enabled',
        parentValue: false,
        childValue: true,
      });
    }

    // Allowed domains must be subset
    if (child.allowedDomains) {
      for (const domain of child.allowedDomains) {
        if (!this.domainIsAllowed(domain, parent.allowedDomains || [])) {
          errors.push({
            code: 'INHERITANCE_VIOLATION',
            message: `Child network domain "${domain}" not allowed by parent`,
            field: 'network.allowedDomains',
            parentValue: parent.allowedDomains,
            childValue: domain,
          });
        }
      }
    }
  }

  private validateModelInheritance(
    parent: PermissionMatrix['models'],
    child: PermissionMatrix['models'],
    errors: PermissionError[]
  ): void {
    // Child allowed models must be subset
    if (child.allowed) {
      const parentAllowed = new Set(parent.allowed || ['haiku', 'sonnet', 'opus']);
      for (const model of child.allowed) {
        if (!parentAllowed.has(model)) {
          errors.push({
            code: 'INHERITANCE_VIOLATION',
            message: `Child model "${model}" not allowed by parent`,
            field: 'models.allowed',
            parentValue: parent.allowed,
            childValue: model,
          });
        }
      }
    }
  }

  private validateStructure(
    permissions: PermissionMatrix,
    errors: PermissionError[]
  ): void {
    // Check required fields
    if (!permissions.coreTools) {
      errors.push({
        code: 'MISSING_REQUIRED',
        message: 'coreTools is required',
        field: 'coreTools',
      });
    }

    if (!permissions.bash) {
      errors.push({
        code: 'MISSING_REQUIRED',
        message: 'bash is required',
        field: 'bash',
      });
    }

    if (!permissions.fileSystem) {
      errors.push({
        code: 'MISSING_REQUIRED',
        message: 'fileSystem is required',
        field: 'fileSystem',
      });
    }
  }

  private validatePatterns(
    permissions: PermissionMatrix,
    errors: PermissionError[],
    warnings: PermissionWarning[]
  ): void {
    // Validate regex patterns in bash
    if (permissions.bash?.allowedPatterns) {
      for (const pattern of permissions.bash.allowedPatterns) {
        try {
          new RegExp(pattern);
        } catch {
          errors.push({
            code: 'INVALID_PATTERN',
            message: `Invalid regex pattern in bash.allowedPatterns: ${pattern}`,
            field: 'bash.allowedPatterns',
          });
        }
      }
    }

    // Validate glob patterns in fileSystem
    if (permissions.fileSystem?.readPatterns) {
      for (const pattern of permissions.fileSystem.readPatterns) {
        if (!this.isValidGlob(pattern)) {
          warnings.push({
            code: 'DEPRECATED_PATTERN',
            message: `Potentially invalid glob pattern: ${pattern}`,
            field: 'fileSystem.readPatterns',
            recommendation: 'Use standard glob syntax',
          });
        }
      }
    }
  }

  private detectConflicts(
    permissions: PermissionMatrix,
    errors: PermissionError[],
    warnings: PermissionWarning[]
  ): void {
    // Check if file read patterns conflict with deny patterns
    if (permissions.fileSystem?.readPatterns && permissions.fileSystem?.denyPatterns) {
      for (const readPattern of permissions.fileSystem.readPatterns) {
        for (const denyPattern of permissions.fileSystem.denyPatterns) {
          if (this.patternsOverlap(readPattern, denyPattern)) {
            warnings.push({
              code: 'SECURITY_RECOMMENDATION',
              message: `Read pattern "${readPattern}" may conflict with deny pattern "${denyPattern}"`,
              field: 'fileSystem',
              recommendation: 'Review patterns to ensure deny takes precedence',
            });
          }
        }
      }
    }

    // Check for overly permissive patterns
    if (permissions.fileSystem?.readPatterns?.includes('**/*')) {
      warnings.push({
        code: 'OVERLY_PERMISSIVE',
        message: 'Read pattern "**/*" allows access to all files',
        field: 'fileSystem.readPatterns',
        recommendation: 'Consider restricting to specific directories',
      });
    }

    if (permissions.bash?.allowedPatterns?.includes('.*')) {
      warnings.push({
        code: 'OVERLY_PERMISSIVE',
        message: 'Bash pattern ".*" allows all commands',
        field: 'bash.allowedPatterns',
        recommendation: 'Consider restricting to specific commands',
      });
    }
  }

  private addSecurityRecommendations(
    permissions: PermissionMatrix,
    warnings: PermissionWarning[]
  ): void {
    // Recommend sandbox for bash
    if (permissions.bash?.enabled && !permissions.bash?.sandboxed) {
      warnings.push({
        code: 'SECURITY_RECOMMENDATION',
        message: 'Bash is enabled without sandbox',
        field: 'bash.sandboxed',
        recommendation: 'Consider enabling sandbox for bash commands',
      });
    }

    // Recommend network restrictions
    if (
      permissions.network?.enabled &&
      (!permissions.network?.allowedDomains ||
        permissions.network.allowedDomains.length === 0)
    ) {
      warnings.push({
        code: 'SECURITY_RECOMMENDATION',
        message: 'Network enabled without domain restrictions',
        field: 'network.allowedDomains',
        recommendation: 'Consider restricting to specific domains',
      });
    }

    // Recommend MCP restrictions
    if (
      permissions.mcpTools?.allowed &&
      permissions.mcpTools.allowed.includes('*')
    ) {
      warnings.push({
        code: 'OVERLY_PERMISSIVE',
        message: 'All MCP tools allowed with wildcard',
        field: 'mcpTools.allowed',
        recommendation: 'Consider listing specific allowed tools',
      });
    }
  }

  private calculateSecurityScore(permissions: PermissionMatrix): number {
    let score = 100;

    // Deduct for enabled features
    if (permissions.bash?.enabled) score -= 15;
    if (permissions.bash?.enabled && !permissions.bash?.sandboxed) score -= 10;
    if (permissions.network?.enabled) score -= 10;
    if (permissions.coreTools?.write) score -= 5;
    if (permissions.coreTools?.edit) score -= 5;
    if (permissions.coreTools?.task) score -= 5;

    // Deduct for overly permissive patterns
    if (permissions.fileSystem?.readPatterns?.includes('**/*')) score -= 15;
    if (permissions.fileSystem?.writePatterns?.includes('**/*')) score -= 20;
    if (permissions.bash?.allowedPatterns?.includes('.*')) score -= 20;
    if (permissions.mcpTools?.allowed?.includes('*')) score -= 10;

    // Add for restrictions
    if (permissions.fileSystem?.denyPatterns?.length) score += 5;
    if (permissions.bash?.deniedPatterns?.length) score += 5;
    if (permissions.network?.deniedDomains?.length) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  // ==================== Helper Methods ====================

  private patternIsSubset(pattern: string, parentPatterns: string[]): boolean {
    // Check if pattern is explicitly in parent patterns
    if (parentPatterns.includes(pattern)) return true;

    // Check if any parent pattern is more permissive
    for (const parentPattern of parentPatterns) {
      if (parentPattern === '.*') return true; // Parent allows everything
      try {
        const parentRegex = new RegExp(`^${parentPattern}$`);
        if (parentRegex.test(pattern)) return true;
      } catch {
        // Invalid regex, skip
      }
    }

    return false;
  }

  private globIsSubset(pattern: string, parentPatterns: string[]): boolean {
    // Check if pattern is explicitly in parent patterns
    if (parentPatterns.includes(pattern)) return true;

    // Check for wildcard patterns
    for (const parentPattern of parentPatterns) {
      if (parentPattern === '**/*') return true; // Parent allows everything
      if (this.globMatches(parentPattern, pattern)) return true;
    }

    return false;
  }

  private globMatches(pattern: string, path: string): boolean {
    // Simple glob matching (** matches any path, * matches single level)
    const regexPattern = pattern
      .replace(/\*\*/g, '{{DOUBLE_STAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/{{DOUBLE_STAR}}/g, '.*')
      .replace(/\//g, '\\/');

    try {
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(path);
    } catch {
      return pattern === path;
    }
  }

  private domainIsAllowed(domain: string, allowedDomains: string[]): boolean {
    if (allowedDomains.includes(domain)) return true;

    // Check for wildcard subdomains
    for (const allowed of allowedDomains) {
      if (allowed.startsWith('*.')) {
        const baseDomain = allowed.slice(2);
        if (domain === baseDomain || domain.endsWith(`.${baseDomain}`)) {
          return true;
        }
      }
    }

    return false;
  }

  private matchesWildcard(tool: string, allowedTools: string[]): boolean {
    for (const allowed of allowedTools) {
      if (allowed === '*') return true;
      if (allowed.endsWith('*')) {
        const prefix = allowed.slice(0, -1);
        if (tool.startsWith(prefix)) return true;
      }
    }
    return false;
  }

  private isValidGlob(pattern: string): boolean {
    // Basic validation - check for common glob characters
    return /^[a-zA-Z0-9_\-./\*\?\[\]{}]+$/.test(pattern);
  }

  private patternsOverlap(pattern1: string, pattern2: string): boolean {
    // Simplified overlap detection
    if (pattern1 === pattern2) return true;
    if (pattern1.includes(pattern2) || pattern2.includes(pattern1)) return true;
    return false;
  }

  private intersectCoreTools(
    parent: CoreToolPermissions,
    child: CoreToolPermissions
  ): CoreToolPermissions {
    return {
      read: parent.read && child.read,
      write: parent.write && child.write,
      edit: parent.edit && child.edit,
      glob: parent.glob && child.glob,
      grep: parent.grep && child.grep,
      task: parent.task && child.task,
      webFetch: parent.webFetch && child.webFetch,
      webSearch: parent.webSearch && child.webSearch,
      todoWrite: parent.todoWrite && child.todoWrite,
      ls: parent.ls && child.ls,
      notebookEdit: parent.notebookEdit && child.notebookEdit,
    };
  }

  private restrictBash(
    parent: BashPermissions,
    child?: Partial<BashPermissions>
  ): BashPermissions {
    return {
      enabled: parent.enabled && (child?.enabled ?? parent.enabled),
      sandboxed: parent.sandboxed || (child?.sandboxed ?? false),
      allowedPatterns: child?.allowedPatterns || parent.allowedPatterns,
      deniedPatterns: [
        ...(parent.deniedPatterns || []),
        ...(child?.deniedPatterns || []),
      ],
      maxExecutionTimeMs: Math.min(
        parent.maxExecutionTimeMs,
        child?.maxExecutionTimeMs ?? parent.maxExecutionTimeMs
      ),
      allowBackground: parent.allowBackground && (child?.allowBackground ?? parent.allowBackground),
      environmentOverrides: {
        ...parent.environmentOverrides,
        ...child?.environmentOverrides,
      },
      workingDirectoryPattern: child?.workingDirectoryPattern || parent.workingDirectoryPattern,
    };
  }

  private restrictFileSystem(
    parent: FileSystemPermissions,
    child?: Partial<FileSystemPermissions>
  ): FileSystemPermissions {
    return {
      readPatterns: child?.readPatterns || parent.readPatterns,
      writePatterns: child?.writePatterns || parent.writePatterns,
      denyPatterns: [
        ...(parent.denyPatterns || []),
        ...(child?.denyPatterns || []),
      ],
      maxReadSizeBytes: Math.min(
        parent.maxReadSizeBytes,
        child?.maxReadSizeBytes ?? parent.maxReadSizeBytes
      ),
      maxWriteSizeBytes: Math.min(
        parent.maxWriteSizeBytes,
        child?.maxWriteSizeBytes ?? parent.maxWriteSizeBytes
      ),
      maxTotalWriteBytes: Math.min(
        parent.maxTotalWriteBytes,
        child?.maxTotalWriteBytes ?? parent.maxTotalWriteBytes
      ),
      allowedReadExtensions: child?.allowedReadExtensions || parent.allowedReadExtensions,
      allowedWriteExtensions: child?.allowedWriteExtensions || parent.allowedWriteExtensions,
    };
  }

  private restrictMcp(
    parent: MCPToolPermissions,
    child?: Partial<MCPToolPermissions>
  ): MCPToolPermissions {
    // Merge rate limits, taking the more restrictive values
    const mergedRateLimits: Record<string, { maxCallsPerMinute: number; maxCallsPerHour: number }> = {};
    const allTools = new Set([
      ...Object.keys(parent.rateLimits || {}),
      ...Object.keys(child?.rateLimits || {}),
    ]);
    for (const tool of allTools) {
      const parentLimit = parent.rateLimits?.[tool];
      const childLimit = child?.rateLimits?.[tool];
      mergedRateLimits[tool] = {
        maxCallsPerMinute: Math.min(
          parentLimit?.maxCallsPerMinute ?? Infinity,
          childLimit?.maxCallsPerMinute ?? Infinity
        ),
        maxCallsPerHour: Math.min(
          parentLimit?.maxCallsPerHour ?? Infinity,
          childLimit?.maxCallsPerHour ?? Infinity
        ),
      };
    }

    return {
      allowed: child?.allowed || parent.allowed,
      denied: [...(parent.denied || []), ...(child?.denied || [])],
      rateLimits: Object.keys(mergedRateLimits).length > 0 ? mergedRateLimits : undefined,
    };
  }

  private restrictNetwork(
    parent: NetworkPermissions,
    child?: Partial<NetworkPermissions>
  ): NetworkPermissions {
    // Intersect allowed protocols (child can only use what parent allows)
    const parentProtocols = new Set(parent.allowedProtocols);
    const childProtocols = child?.allowedProtocols || parent.allowedProtocols;
    const allowedProtocols = childProtocols.filter(p => parentProtocols.has(p)) as NetworkPermissions['allowedProtocols'];

    return {
      enabled: parent.enabled && (child?.enabled ?? parent.enabled),
      allowedDomains: child?.allowedDomains || parent.allowedDomains,
      deniedDomains: [
        ...(parent.deniedDomains || []),
        ...(child?.deniedDomains || []),
      ],
      allowedProtocols,
      maxRequestSizeBytes: Math.min(
        parent.maxRequestSizeBytes,
        child?.maxRequestSizeBytes ?? parent.maxRequestSizeBytes
      ),
      maxResponseSizeBytes: Math.min(
        parent.maxResponseSizeBytes,
        child?.maxResponseSizeBytes ?? parent.maxResponseSizeBytes
      ),
      requestTimeoutMs: Math.min(
        parent.requestTimeoutMs,
        child?.requestTimeoutMs ?? parent.requestTimeoutMs
      ),
      maxConcurrentRequests: Math.min(
        parent.maxConcurrentRequests,
        child?.maxConcurrentRequests ?? parent.maxConcurrentRequests
      ),
    };
  }

  private restrictModels(
    parent: PermissionMatrix['models'],
    child?: Partial<PermissionMatrix['models']>
  ): PermissionMatrix['models'] {
    const parentAllowed = new Set(parent.allowed || ['haiku', 'sonnet', 'opus']);
    const childAllowed = child?.allowed || parent.allowed;

    // Merge maxTokensPerModel, taking minimum values
    const maxTokensPerModel: { haiku?: number; sonnet?: number; opus?: number } = {};
    const models = ['haiku', 'sonnet', 'opus'] as const;
    for (const model of models) {
      const parentMax = parent.maxTokensPerModel?.[model];
      const childMax = child?.maxTokensPerModel?.[model];
      if (parentMax !== undefined || childMax !== undefined) {
        maxTokensPerModel[model] = Math.min(
          parentMax ?? Infinity,
          childMax ?? Infinity
        );
        if (maxTokensPerModel[model] === Infinity) {
          delete maxTokensPerModel[model];
        }
      }
    }

    return {
      allowed: childAllowed?.filter((m) => parentAllowed.has(m)) || parent.allowed,
      preferredForSpawning: child?.preferredForSpawning || parent.preferredForSpawning,
      maxTokensPerModel,
      // Child can only escalate if parent allows it
      allowEscalation: parent.allowEscalation && (child?.allowEscalation ?? parent.allowEscalation),
    };
  }
}

/**
 * Error thrown during permission validation
 */
export class PermissionValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: PermissionError[]
  ) {
    super(message);
    this.name = 'PermissionValidationError';
  }
}

/**
 * Convenience function to create a validator
 */
export function createValidator(options?: { strictMode?: boolean }): PermissionValidator {
  return new PermissionValidator(options);
}

/**
 * Quick validation function
 */
export function validatePermissions(permissions: PermissionMatrix): ValidationResult {
  return new PermissionValidator().validate(permissions);
}

/**
 * Quick inheritance validation function
 */
export function validateInheritance(
  parent: PermissionMatrix,
  child: PermissionMatrix
): ValidationResult {
  return new PermissionValidator().validateInheritance(parent, child);
}
