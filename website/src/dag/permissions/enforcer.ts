/**
 * Permission Enforcer - Runtime enforcement of permissions
 *
 * Intercepts tool calls and file operations to ensure they comply
 * with the active permission matrix. Acts as a security boundary.
 */

import {
  PermissionMatrix,
  IsolationLevel,
  CoreToolPermissions,
} from '../types/permissions';

/**
 * Result of an enforcement check
 */
export interface EnforcementResult {
  allowed: boolean;
  reason?: string;
  violations: Violation[];
  suggestions?: string[];
}

export interface Violation {
  type: ViolationType;
  resource: string;
  permission: string;
  message: string;
  severity: 'error' | 'warning';
}

export type ViolationType =
  | 'tool_denied'
  | 'file_read_denied'
  | 'file_write_denied'
  | 'bash_denied'
  | 'bash_pattern_denied'
  | 'mcp_denied'
  | 'network_denied'
  | 'model_denied'
  | 'isolation_violation';

/**
 * Request to check permissions
 */
export interface PermissionRequest {
  type: RequestType;
  resource: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export type RequestType =
  | 'tool'
  | 'file_read'
  | 'file_write'
  | 'bash'
  | 'mcp'
  | 'network'
  | 'model';

/**
 * Permission Enforcer class
 */
export class PermissionEnforcer {
  private permissions: PermissionMatrix;
  private isolationLevel: IsolationLevel;
  private auditLog: AuditEntry[] = [];
  private readonly maxAuditEntries: number;

  constructor(
    permissions: PermissionMatrix,
    options: EnforcerOptions = {}
  ) {
    this.permissions = permissions;
    this.isolationLevel = options.isolationLevel || 'moderate';
    this.maxAuditEntries = options.maxAuditEntries || 1000;
  }

  /**
   * Check if a request is allowed
   */
  check(request: PermissionRequest): EnforcementResult {
    const startTime = Date.now();
    let result: EnforcementResult;

    switch (request.type) {
      case 'tool':
        result = this.checkToolPermission(request.resource);
        break;
      case 'file_read':
        result = this.checkFileReadPermission(request.resource);
        break;
      case 'file_write':
        result = this.checkFileWritePermission(request.resource);
        break;
      case 'bash':
        result = this.checkBashPermission(request.resource);
        break;
      case 'mcp':
        result = this.checkMcpPermission(request.resource);
        break;
      case 'network':
        result = this.checkNetworkPermission(request.resource);
        break;
      case 'model':
        result = this.checkModelPermission(request.resource);
        break;
      default:
        result = {
          allowed: false,
          reason: `Unknown request type: ${request.type}`,
          violations: [{
            type: 'tool_denied',
            resource: request.resource,
            permission: request.type,
            message: 'Unknown request type',
            severity: 'error',
          }],
        };
    }

    // Log the check
    this.audit({
      timestamp: new Date(),
      request,
      result,
      durationMs: Date.now() - startTime,
    });

    return result;
  }

  /**
   * Enforce permission (throws if denied)
   */
  enforce(request: PermissionRequest): void {
    const result = this.check(request);
    if (!result.allowed) {
      throw new PermissionDeniedError(
        result.reason || 'Permission denied',
        result.violations
      );
    }
  }

  /**
   * Check multiple requests at once
   */
  checkAll(requests: PermissionRequest[]): Map<PermissionRequest, EnforcementResult> {
    const results = new Map<PermissionRequest, EnforcementResult>();
    for (const request of requests) {
      results.set(request, this.check(request));
    }
    return results;
  }

  /**
   * Update permissions (for dynamic permission changes)
   */
  updatePermissions(permissions: PermissionMatrix): void {
    this.permissions = permissions;
    this.audit({
      timestamp: new Date(),
      request: { type: 'tool', resource: 'permissions_update' },
      result: { allowed: true, violations: [] },
      durationMs: 0,
      metadata: { action: 'permissions_updated' },
    });
  }

  /**
   * Get current permissions
   */
  getPermissions(): PermissionMatrix {
    return { ...this.permissions };
  }

  /**
   * Get audit log
   */
  getAuditLog(options?: { limit?: number; filter?: (entry: AuditEntry) => boolean }): AuditEntry[] {
    let log = [...this.auditLog];

    if (options?.filter) {
      log = log.filter(options.filter);
    }

    if (options?.limit) {
      log = log.slice(-options.limit);
    }

    return log;
  }

  /**
   * Clear audit log
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }

  // ==================== Private Check Methods ====================

  private checkToolPermission(tool: string): EnforcementResult {
    const violations: Violation[] = [];
    const toolMap: Record<string, keyof CoreToolPermissions> = {
      'Read': 'read',
      'Write': 'write',
      'Edit': 'edit',
      'Glob': 'glob',
      'Grep': 'grep',
      'Task': 'task',
      'WebFetch': 'webFetch',
      'WebSearch': 'webSearch',
      'TodoWrite': 'todoWrite',
      'Ls': 'ls',
      'NotebookEdit': 'notebookEdit',
    };

    const permissionKey = toolMap[tool];
    if (permissionKey && !this.permissions.coreTools[permissionKey]) {
      violations.push({
        type: 'tool_denied',
        resource: tool,
        permission: `coreTools.${permissionKey}`,
        message: `Tool "${tool}" is not allowed`,
        severity: 'error',
      });
    }

    return {
      allowed: violations.length === 0,
      reason: violations.length > 0 ? violations[0].message : undefined,
      violations,
    };
  }

  private checkFileReadPermission(path: string): EnforcementResult {
    const violations: Violation[] = [];
    const suggestions: string[] = [];

    // Check deny patterns first (they take precedence)
    if (this.permissions.fileSystem.denyPatterns) {
      for (const pattern of this.permissions.fileSystem.denyPatterns) {
        if (this.matchesGlob(path, pattern)) {
          violations.push({
            type: 'file_read_denied',
            resource: path,
            permission: 'fileSystem.denyPatterns',
            message: `Path "${path}" matches deny pattern "${pattern}"`,
            severity: 'error',
          });
          return { allowed: false, reason: violations[0].message, violations };
        }
      }
    }

    // Check if path matches any allowed pattern
    const readPatterns = this.permissions.fileSystem.readPatterns || [];
    const isAllowed = readPatterns.length === 0 ||
      readPatterns.some(pattern => this.matchesGlob(path, pattern));

    if (!isAllowed) {
      violations.push({
        type: 'file_read_denied',
        resource: path,
        permission: 'fileSystem.readPatterns',
        message: `Path "${path}" does not match any allowed read pattern`,
        severity: 'error',
      });

      // Suggest similar allowed patterns
      const similar = this.findSimilarPatterns(path, readPatterns);
      if (similar.length > 0) {
        suggestions.push(`Similar allowed patterns: ${similar.join(', ')}`);
      }
    }

    return {
      allowed: violations.length === 0,
      reason: violations.length > 0 ? violations[0].message : undefined,
      violations,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }

  private checkFileWritePermission(path: string): EnforcementResult {
    const violations: Violation[] = [];

    // Check deny patterns first
    if (this.permissions.fileSystem.denyPatterns) {
      for (const pattern of this.permissions.fileSystem.denyPatterns) {
        if (this.matchesGlob(path, pattern)) {
          violations.push({
            type: 'file_write_denied',
            resource: path,
            permission: 'fileSystem.denyPatterns',
            message: `Path "${path}" matches deny pattern "${pattern}"`,
            severity: 'error',
          });
          return { allowed: false, reason: violations[0].message, violations };
        }
      }
    }

    // Check write tool permission
    if (!this.permissions.coreTools.write && !this.permissions.coreTools.edit) {
      violations.push({
        type: 'file_write_denied',
        resource: path,
        permission: 'coreTools.write',
        message: 'Write operations are not allowed',
        severity: 'error',
      });
      return { allowed: false, reason: violations[0].message, violations };
    }

    // Check if path matches any allowed write pattern
    const writePatterns = this.permissions.fileSystem.writePatterns || [];
    const isAllowed = writePatterns.length === 0 ||
      writePatterns.some(pattern => this.matchesGlob(path, pattern));

    if (!isAllowed) {
      violations.push({
        type: 'file_write_denied',
        resource: path,
        permission: 'fileSystem.writePatterns',
        message: `Path "${path}" does not match any allowed write pattern`,
        severity: 'error',
      });
    }

    return {
      allowed: violations.length === 0,
      reason: violations.length > 0 ? violations[0].message : undefined,
      violations,
    };
  }

  private checkBashPermission(command: string): EnforcementResult {
    const violations: Violation[] = [];

    // Check if bash is enabled
    if (!this.permissions.bash.enabled) {
      violations.push({
        type: 'bash_denied',
        resource: command,
        permission: 'bash.enabled',
        message: 'Bash commands are not allowed',
        severity: 'error',
      });
      return { allowed: false, reason: violations[0].message, violations };
    }

    // Check denied patterns first
    if (this.permissions.bash.deniedPatterns) {
      for (const pattern of this.permissions.bash.deniedPatterns) {
        if (this.matchesRegex(command, pattern)) {
          violations.push({
            type: 'bash_pattern_denied',
            resource: command,
            permission: 'bash.deniedPatterns',
            message: `Command matches denied pattern "${pattern}"`,
            severity: 'error',
          });
          return { allowed: false, reason: violations[0].message, violations };
        }
      }
    }

    // Check if command matches any allowed pattern
    const allowedPatterns = this.permissions.bash.allowedPatterns || [];
    if (allowedPatterns.length > 0) {
      const isAllowed = allowedPatterns.some(pattern =>
        this.matchesRegex(command, pattern)
      );

      if (!isAllowed) {
        violations.push({
          type: 'bash_pattern_denied',
          resource: command,
          permission: 'bash.allowedPatterns',
          message: 'Command does not match any allowed pattern',
          severity: 'error',
        });
      }
    }

    // Apply isolation level restrictions
    if (this.isolationLevel === 'strict') {
      const dangerousPatterns = [
        /rm\s+-rf/,
        /sudo/,
        /chmod\s+777/,
        />\s*\/dev\//,
        /mkfs/,
        /dd\s+if=/,
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(command)) {
          violations.push({
            type: 'isolation_violation',
            resource: command,
            permission: 'isolationLevel',
            message: `Command contains dangerous pattern in strict isolation mode`,
            severity: 'error',
          });
          break;
        }
      }
    }

    return {
      allowed: violations.length === 0,
      reason: violations.length > 0 ? violations[0].message : undefined,
      violations,
    };
  }

  private checkMcpPermission(toolSpec: string): EnforcementResult {
    const violations: Violation[] = [];

    // toolSpec format: "server:tool" or just "tool"
    const [server, tool] = toolSpec.includes(':')
      ? toolSpec.split(':')
      : ['*', toolSpec];

    // Check denied list first
    if (this.permissions.mcpTools.denied) {
      for (const denied of this.permissions.mcpTools.denied) {
        if (this.matchesMcpSpec(toolSpec, denied)) {
          violations.push({
            type: 'mcp_denied',
            resource: toolSpec,
            permission: 'mcpTools.denied',
            message: `MCP tool "${toolSpec}" is explicitly denied`,
            severity: 'error',
          });
          return { allowed: false, reason: violations[0].message, violations };
        }
      }
    }

    // Check allowed list
    const allowed = this.permissions.mcpTools.allowed || [];
    if (allowed.length > 0 && !allowed.includes('*')) {
      const isAllowed = allowed.some(a => this.matchesMcpSpec(toolSpec, a));

      if (!isAllowed) {
        violations.push({
          type: 'mcp_denied',
          resource: toolSpec,
          permission: 'mcpTools.allowed',
          message: `MCP tool "${toolSpec}" is not in allowed list`,
          severity: 'error',
        });
      }
    }

    return {
      allowed: violations.length === 0,
      reason: violations.length > 0 ? violations[0].message : undefined,
      violations,
    };
  }

  private checkNetworkPermission(url: string): EnforcementResult {
    const violations: Violation[] = [];

    // Check if network is enabled
    if (!this.permissions.network.enabled) {
      violations.push({
        type: 'network_denied',
        resource: url,
        permission: 'network.enabled',
        message: 'Network access is not allowed',
        severity: 'error',
      });
      return { allowed: false, reason: violations[0].message, violations };
    }

    // Extract domain from URL
    let domain: string;
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname;
    } catch {
      domain = url; // Assume it's just a domain
    }

    // Check denied domains first
    if (this.permissions.network.deniedDomains) {
      for (const denied of this.permissions.network.deniedDomains) {
        if (this.matchesDomain(domain, denied)) {
          violations.push({
            type: 'network_denied',
            resource: url,
            permission: 'network.deniedDomains',
            message: `Domain "${domain}" is explicitly denied`,
            severity: 'error',
          });
          return { allowed: false, reason: violations[0].message, violations };
        }
      }
    }

    // Check allowed domains
    const allowedDomains = this.permissions.network.allowedDomains || [];
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(a => this.matchesDomain(domain, a));

      if (!isAllowed) {
        violations.push({
          type: 'network_denied',
          resource: url,
          permission: 'network.allowedDomains',
          message: `Domain "${domain}" is not in allowed list`,
          severity: 'error',
        });
      }
    }

    return {
      allowed: violations.length === 0,
      reason: violations.length > 0 ? violations[0].message : undefined,
      violations,
    };
  }

  private checkModelPermission(model: string): EnforcementResult {
    const violations: Violation[] = [];
    const allowed = this.permissions.models.allowed || ['haiku', 'sonnet', 'opus'];

    if (!allowed.includes(model as 'haiku' | 'sonnet' | 'opus')) {
      violations.push({
        type: 'model_denied',
        resource: model,
        permission: 'models.allowed',
        message: `Model "${model}" is not allowed. Allowed: ${allowed.join(', ')}`,
        severity: 'error',
      });
    }

    return {
      allowed: violations.length === 0,
      reason: violations.length > 0 ? violations[0].message : undefined,
      violations,
      suggestions: violations.length > 0
        ? [`Consider using: ${allowed.join(', ')}`]
        : undefined,
    };
  }

  // ==================== Helper Methods ====================

  private matchesGlob(path: string, pattern: string): boolean {
    // Convert glob to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '{{DOUBLE_STAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/{{DOUBLE_STAR}}/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\//g, '\\/');

    try {
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(path);
    } catch {
      return path === pattern;
    }
  }

  private matchesRegex(text: string, pattern: string): boolean {
    try {
      const regex = new RegExp(pattern);
      return regex.test(text);
    } catch {
      return text.includes(pattern);
    }
  }

  private matchesMcpSpec(toolSpec: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern === toolSpec) return true;

    // Handle wildcards like "server:*" or "*:tool"
    if (pattern.includes('*')) {
      const regexPattern = pattern.replace(/\*/g, '.*');
      try {
        return new RegExp(`^${regexPattern}$`).test(toolSpec);
      } catch {
        return false;
      }
    }

    return false;
  }

  private matchesDomain(domain: string, pattern: string): boolean {
    if (pattern === domain) return true;

    // Handle wildcard subdomains like "*.example.com"
    if (pattern.startsWith('*.')) {
      const baseDomain = pattern.slice(2);
      return domain === baseDomain || domain.endsWith(`.${baseDomain}`);
    }

    return false;
  }

  private findSimilarPatterns(path: string, patterns: string[]): string[] {
    // Find patterns that share a common prefix with the path
    const pathParts = path.split('/');
    return patterns.filter(pattern => {
      const patternParts = pattern.split('/');
      return patternParts[0] === pathParts[0] || patternParts[1] === pathParts[1];
    }).slice(0, 3);
  }

  private audit(entry: AuditEntry): void {
    this.auditLog.push(entry);

    // Trim log if too large
    if (this.auditLog.length > this.maxAuditEntries) {
      this.auditLog = this.auditLog.slice(-this.maxAuditEntries);
    }
  }
}

/**
 * Audit log entry
 */
export interface AuditEntry {
  timestamp: Date;
  request: PermissionRequest;
  result: EnforcementResult;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

/**
 * Enforcer options
 */
export interface EnforcerOptions {
  isolationLevel?: IsolationLevel;
  maxAuditEntries?: number;
}

/**
 * Error thrown when permission is denied
 */
export class PermissionDeniedError extends Error {
  constructor(
    message: string,
    public readonly violations: Violation[]
  ) {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

/**
 * Create a permission enforcer with default options
 */
export function createEnforcer(
  permissions: PermissionMatrix,
  options?: EnforcerOptions
): PermissionEnforcer {
  return new PermissionEnforcer(permissions, options);
}

/**
 * Create a strict enforcer (highest security)
 */
export function createStrictEnforcer(permissions: PermissionMatrix): PermissionEnforcer {
  return new PermissionEnforcer(permissions, { isolationLevel: 'strict' });
}

/**
 * Create a permissive enforcer (lowest security, for development)
 */
export function createPermissiveEnforcer(permissions: PermissionMatrix): PermissionEnforcer {
  return new PermissionEnforcer(permissions, { isolationLevel: 'permissive' });
}
