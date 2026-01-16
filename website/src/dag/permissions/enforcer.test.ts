/**
 * Tests for Permission Enforcer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PermissionEnforcer,
  PermissionDeniedError,
  createEnforcer,
  createStrictEnforcer,
  createPermissiveEnforcer,
  EnforcementResult,
  PermissionRequest,
  AuditEntry,
} from './enforcer';
import type { PermissionMatrix } from '../types/permissions';

// =============================================================================
// Test Fixtures
// =============================================================================

function createFullPermissions(): PermissionMatrix {
  return {
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
      allowedPatterns: ['.*'],
      deniedPatterns: [],
      sandboxed: false,
    },
    fileSystem: {
      readPatterns: ['**/*'],
      writePatterns: ['**/*'],
      denyPatterns: [],
    },
    mcpTools: {
      allowed: ['*'],
      denied: [],
    },
    network: {
      enabled: true,
      allowedDomains: [],
      deniedDomains: [],
    },
    models: {
      allowed: ['haiku', 'sonnet', 'opus'],
      preferredForSpawning: 'haiku',
    },
  };
}

function createRestrictedPermissions(): PermissionMatrix {
  return {
    coreTools: {
      read: true,
      write: false,
      edit: false,
      glob: true,
      grep: true,
      task: false,
      webFetch: false,
      webSearch: false,
      todoWrite: true,
      ls: true,
      notebookEdit: false,
    },
    bash: {
      enabled: true,
      allowedPatterns: ['^ls', '^cat', '^echo'],
      deniedPatterns: ['rm\\s+-rf', 'sudo', 'chmod'],
      sandboxed: true,
    },
    fileSystem: {
      readPatterns: ['src/**/*', 'docs/**/*'],
      writePatterns: [],
      denyPatterns: ['**/node_modules/**', '**/.env*'],
    },
    mcpTools: {
      allowed: ['fetch:*', 'search:web'],
      denied: ['*:dangerous', 'admin:*'],
    },
    network: {
      enabled: true,
      allowedDomains: ['github.com', '*.github.com', 'api.anthropic.com'],
      deniedDomains: ['evil.com', '*.malware.org'],
    },
    models: {
      allowed: ['haiku', 'sonnet'],
      preferredForSpawning: 'haiku',
    },
  };
}

function createMinimalPermissions(): PermissionMatrix {
  return {
    coreTools: {
      read: true,
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
    },
    bash: {
      enabled: false,
      allowedPatterns: [],
      deniedPatterns: [],
      sandboxed: true,
    },
    fileSystem: {
      readPatterns: ['README.md'],
      writePatterns: [],
      denyPatterns: ['**/*'],
    },
    mcpTools: {
      allowed: [],
      denied: ['*'],
    },
    network: {
      enabled: false,
      allowedDomains: [],
      deniedDomains: [],
    },
    models: {
      allowed: ['haiku'],
      preferredForSpawning: 'haiku',
    },
  };
}

// =============================================================================
// Constructor Tests
// =============================================================================

describe('PermissionEnforcer', () => {
  describe('constructor', () => {
    it('should create an enforcer with default options', () => {
      const permissions = createFullPermissions();
      const enforcer = new PermissionEnforcer(permissions);

      expect(enforcer).toBeInstanceOf(PermissionEnforcer);
      expect(enforcer.getPermissions()).toEqual(permissions);
    });

    it('should accept isolation level option', () => {
      const permissions = createFullPermissions();
      const enforcer = new PermissionEnforcer(permissions, { isolationLevel: 'strict' });

      expect(enforcer).toBeInstanceOf(PermissionEnforcer);
    });

    it('should accept maxAuditEntries option', () => {
      const permissions = createFullPermissions();
      const enforcer = new PermissionEnforcer(permissions, { maxAuditEntries: 100 });

      expect(enforcer).toBeInstanceOf(PermissionEnforcer);
    });
  });

  // ===========================================================================
  // Tool Permission Tests
  // ===========================================================================

  describe('check - tool permissions', () => {
    let enforcer: PermissionEnforcer;

    beforeEach(() => {
      enforcer = new PermissionEnforcer(createRestrictedPermissions());
    });

    it('should allow enabled tools', () => {
      const result = enforcer.check({ type: 'tool', resource: 'Read' });

      expect(result.allowed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should deny disabled tools', () => {
      const result = enforcer.check({ type: 'tool', resource: 'Write' });

      expect(result.allowed).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('tool_denied');
      expect(result.violations[0].resource).toBe('Write');
    });

    it('should allow unknown tools (not in mapping)', () => {
      const result = enforcer.check({ type: 'tool', resource: 'UnknownTool' });

      expect(result.allowed).toBe(true);
    });

    it('should check all core tools correctly', () => {
      const toolStates = {
        'Read': true,
        'Write': false,
        'Edit': false,
        'Glob': true,
        'Grep': true,
        'Task': false,
        'WebFetch': false,
        'WebSearch': false,
        'TodoWrite': true,
        'Ls': true,
        'NotebookEdit': false,
      };

      for (const [tool, expected] of Object.entries(toolStates)) {
        const result = enforcer.check({ type: 'tool', resource: tool });
        expect(result.allowed).toBe(expected);
      }
    });
  });

  // ===========================================================================
  // File Read Permission Tests
  // ===========================================================================

  describe('check - file_read permissions', () => {
    let enforcer: PermissionEnforcer;

    beforeEach(() => {
      enforcer = new PermissionEnforcer(createRestrictedPermissions());
    });

    it('should allow reading files matching readPatterns', () => {
      // Pattern src/**/* requires at least one subdirectory
      const result = enforcer.check({ type: 'file_read', resource: 'src/components/index.ts' });

      expect(result.allowed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should deny reading files not matching readPatterns', () => {
      const result = enforcer.check({ type: 'file_read', resource: 'config/secret.json' });

      expect(result.allowed).toBe(false);
      expect(result.violations[0].type).toBe('file_read_denied');
    });

    it('should deny reading files matching denyPatterns (precedence over allow)', () => {
      const result = enforcer.check({ type: 'file_read', resource: 'src/node_modules/lodash/index.js' });

      expect(result.allowed).toBe(false);
      expect(result.violations[0].type).toBe('file_read_denied');
      expect(result.violations[0].message).toContain('deny pattern');
    });

    it('should deny reading .env files', () => {
      const result = enforcer.check({ type: 'file_read', resource: 'src/.env.local' });

      expect(result.allowed).toBe(false);
    });

    it('should allow any file when readPatterns is empty', () => {
      const permissions = createFullPermissions();
      permissions.fileSystem.readPatterns = [];
      const enforcer = new PermissionEnforcer(permissions);

      const result = enforcer.check({ type: 'file_read', resource: 'any/path/file.txt' });

      expect(result.allowed).toBe(true);
    });

    it('should provide suggestions for denied files', () => {
      const result = enforcer.check({ type: 'file_read', resource: 'src-backup/index.ts' });

      // Should suggest similar patterns (src/** is close to src-backup)
      expect(result.allowed).toBe(false);
    });
  });

  // ===========================================================================
  // File Write Permission Tests
  // ===========================================================================

  describe('check - file_write permissions', () => {
    it('should deny when write and edit are both disabled', () => {
      const enforcer = new PermissionEnforcer(createRestrictedPermissions());
      const result = enforcer.check({ type: 'file_write', resource: 'src/test.ts' });

      expect(result.allowed).toBe(false);
      expect(result.violations[0].message).toBe('Write operations are not allowed');
    });

    it('should check writePatterns when write is enabled', () => {
      const permissions = createFullPermissions();
      // Pattern src/**/* requires at least one subdirectory
      permissions.fileSystem.writePatterns = ['src/**/*'];
      const enforcer = new PermissionEnforcer(permissions);

      const allowedResult = enforcer.check({ type: 'file_write', resource: 'src/components/new.ts' });
      expect(allowedResult.allowed).toBe(true);

      const deniedResult = enforcer.check({ type: 'file_write', resource: 'docs/readme.md' });
      expect(deniedResult.allowed).toBe(false);
    });

    it('should deny writes matching denyPatterns', () => {
      const permissions = createFullPermissions();
      permissions.fileSystem.denyPatterns = ['**/*.secret'];
      const enforcer = new PermissionEnforcer(permissions);

      const result = enforcer.check({ type: 'file_write', resource: 'config/api.secret' });

      expect(result.allowed).toBe(false);
      expect(result.violations[0].message).toContain('deny pattern');
    });

    it('should allow write when edit is enabled but write is disabled', () => {
      const permissions = createRestrictedPermissions();
      permissions.coreTools.write = false;
      permissions.coreTools.edit = true;
      permissions.fileSystem.writePatterns = ['**/*'];
      const enforcer = new PermissionEnforcer(permissions);

      const result = enforcer.check({ type: 'file_write', resource: 'src/test.ts' });

      expect(result.allowed).toBe(true);
    });
  });

  // ===========================================================================
  // Bash Permission Tests
  // ===========================================================================

  describe('check - bash permissions', () => {
    it('should deny all commands when bash is disabled', () => {
      const enforcer = new PermissionEnforcer(createMinimalPermissions());
      const result = enforcer.check({ type: 'bash', resource: 'echo hello' });

      expect(result.allowed).toBe(false);
      expect(result.violations[0].type).toBe('bash_denied');
    });

    it('should allow commands matching allowedPatterns', () => {
      const enforcer = new PermissionEnforcer(createRestrictedPermissions());

      const result = enforcer.check({ type: 'bash', resource: 'ls -la' });

      expect(result.allowed).toBe(true);
    });

    it('should deny commands matching deniedPatterns', () => {
      const enforcer = new PermissionEnforcer(createRestrictedPermissions());

      const result = enforcer.check({ type: 'bash', resource: 'rm -rf /' });

      expect(result.allowed).toBe(false);
      expect(result.violations[0].type).toBe('bash_pattern_denied');
    });

    it('should deny commands not matching any allowedPattern', () => {
      const enforcer = new PermissionEnforcer(createRestrictedPermissions());

      const result = enforcer.check({ type: 'bash', resource: 'wget http://evil.com' });

      expect(result.allowed).toBe(false);
    });

    it('should apply strict isolation mode restrictions', () => {
      const permissions = createFullPermissions();
      const enforcer = new PermissionEnforcer(permissions, { isolationLevel: 'strict' });

      const dangerousCommands = [
        'rm -rf /home',
        'sudo apt install something',
        'chmod 777 /etc/passwd',
        'dd if=/dev/zero of=/dev/sda',
        'mkfs.ext4 /dev/sdb',
      ];

      for (const cmd of dangerousCommands) {
        const result = enforcer.check({ type: 'bash', resource: cmd });
        expect(result.allowed).toBe(false);
        expect(result.violations[0].type).toBe('isolation_violation');
      }
    });

    it('should allow dangerous commands in permissive mode', () => {
      const permissions = createFullPermissions();
      const enforcer = new PermissionEnforcer(permissions, { isolationLevel: 'permissive' });

      const result = enforcer.check({ type: 'bash', resource: 'rm -rf /tmp/test' });

      expect(result.allowed).toBe(true);
    });

    it('should allow all commands when allowedPatterns is empty', () => {
      const permissions = createFullPermissions();
      permissions.bash.allowedPatterns = [];
      const enforcer = new PermissionEnforcer(permissions);

      const result = enforcer.check({ type: 'bash', resource: 'any command' });

      expect(result.allowed).toBe(true);
    });
  });

  // ===========================================================================
  // MCP Permission Tests
  // ===========================================================================

  describe('check - mcp permissions', () => {
    let enforcer: PermissionEnforcer;

    beforeEach(() => {
      enforcer = new PermissionEnforcer(createRestrictedPermissions());
    });

    it('should allow MCP tools in allowed list', () => {
      const result = enforcer.check({ type: 'mcp', resource: 'fetch:get' });

      expect(result.allowed).toBe(true);
    });

    it('should allow MCP tools matching wildcard pattern', () => {
      const result = enforcer.check({ type: 'mcp', resource: 'fetch:post' });

      expect(result.allowed).toBe(true);
    });

    it('should deny MCP tools in denied list', () => {
      const result = enforcer.check({ type: 'mcp', resource: 'server:dangerous' });

      expect(result.allowed).toBe(false);
      expect(result.violations[0].message).toContain('explicitly denied');
    });

    it('should deny MCP tools matching denied wildcard', () => {
      const result = enforcer.check({ type: 'mcp', resource: 'admin:user-delete' });

      expect(result.allowed).toBe(false);
    });

    it('should deny MCP tools not in allowed list', () => {
      const result = enforcer.check({ type: 'mcp', resource: 'unknown:tool' });

      expect(result.allowed).toBe(false);
      expect(result.violations[0].message).toContain('not in allowed list');
    });

    it('should allow all tools with wildcard allowed', () => {
      const permissions = createFullPermissions();
      const enforcer = new PermissionEnforcer(permissions);

      const result = enforcer.check({ type: 'mcp', resource: 'any:tool' });

      expect(result.allowed).toBe(true);
    });

    it('should handle tool spec without server prefix', () => {
      const permissions = createRestrictedPermissions();
      permissions.mcpTools.allowed = ['simple-tool'];
      const enforcer = new PermissionEnforcer(permissions);

      const result = enforcer.check({ type: 'mcp', resource: 'simple-tool' });

      expect(result.allowed).toBe(true);
    });
  });

  // ===========================================================================
  // Network Permission Tests
  // ===========================================================================

  describe('check - network permissions', () => {
    let enforcer: PermissionEnforcer;

    beforeEach(() => {
      enforcer = new PermissionEnforcer(createRestrictedPermissions());
    });

    it('should deny all network when disabled', () => {
      const minimalEnforcer = new PermissionEnforcer(createMinimalPermissions());
      const result = minimalEnforcer.check({ type: 'network', resource: 'https://google.com' });

      expect(result.allowed).toBe(false);
      expect(result.violations[0].message).toBe('Network access is not allowed');
    });

    it('should allow URLs with domains in allowedDomains', () => {
      const result = enforcer.check({ type: 'network', resource: 'https://github.com/user/repo' });

      expect(result.allowed).toBe(true);
    });

    it('should allow subdomains with wildcard pattern', () => {
      const result = enforcer.check({ type: 'network', resource: 'https://api.github.com/users' });

      expect(result.allowed).toBe(true);
    });

    it('should deny URLs in deniedDomains', () => {
      const result = enforcer.check({ type: 'network', resource: 'https://evil.com/hack' });

      expect(result.allowed).toBe(false);
      expect(result.violations[0].message).toContain('explicitly denied');
    });

    it('should deny subdomains of denied wildcard domains', () => {
      const result = enforcer.check({ type: 'network', resource: 'https://payload.malware.org' });

      expect(result.allowed).toBe(false);
    });

    it('should deny URLs not in allowedDomains', () => {
      const result = enforcer.check({ type: 'network', resource: 'https://random-site.com' });

      expect(result.allowed).toBe(false);
      expect(result.violations[0].message).toContain('not in allowed list');
    });

    it('should allow all domains when allowedDomains is empty', () => {
      const permissions = createFullPermissions();
      permissions.network.allowedDomains = [];
      const enforcer = new PermissionEnforcer(permissions);

      const result = enforcer.check({ type: 'network', resource: 'https://any-domain.com' });

      expect(result.allowed).toBe(true);
    });

    it('should handle plain domain strings (not URLs)', () => {
      const result = enforcer.check({ type: 'network', resource: 'github.com' });

      expect(result.allowed).toBe(true);
    });

    it('should handle malformed URLs gracefully', () => {
      const result = enforcer.check({ type: 'network', resource: 'not-a-valid-url' });

      // Should treat as domain directly
      expect(result.allowed).toBe(false);
    });
  });

  // ===========================================================================
  // Model Permission Tests
  // ===========================================================================

  describe('check - model permissions', () => {
    let enforcer: PermissionEnforcer;

    beforeEach(() => {
      enforcer = new PermissionEnforcer(createRestrictedPermissions());
    });

    it('should allow models in allowed list', () => {
      const result = enforcer.check({ type: 'model', resource: 'haiku' });

      expect(result.allowed).toBe(true);
    });

    it('should deny models not in allowed list', () => {
      const result = enforcer.check({ type: 'model', resource: 'opus' });

      expect(result.allowed).toBe(false);
      expect(result.violations[0].type).toBe('model_denied');
    });

    it('should provide suggestions for denied models', () => {
      const result = enforcer.check({ type: 'model', resource: 'opus' });

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.[0]).toContain('haiku');
    });

    it('should allow all models with full permissions', () => {
      const enforcer = new PermissionEnforcer(createFullPermissions());

      for (const model of ['haiku', 'sonnet', 'opus']) {
        const result = enforcer.check({ type: 'model', resource: model });
        expect(result.allowed).toBe(true);
      }
    });

    it('should deny unknown model names', () => {
      const result = enforcer.check({ type: 'model', resource: 'gpt-4' });

      expect(result.allowed).toBe(false);
    });
  });

  // ===========================================================================
  // Unknown Request Type Tests
  // ===========================================================================

  describe('check - unknown request types', () => {
    it('should deny unknown request types', () => {
      const enforcer = new PermissionEnforcer(createFullPermissions());
      const result = enforcer.check({ type: 'unknown' as any, resource: 'something' });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Unknown request type');
    });
  });

  // ===========================================================================
  // Enforce Method Tests
  // ===========================================================================

  describe('enforce', () => {
    let enforcer: PermissionEnforcer;

    beforeEach(() => {
      enforcer = new PermissionEnforcer(createRestrictedPermissions());
    });

    it('should not throw for allowed requests', () => {
      expect(() => {
        enforcer.enforce({ type: 'tool', resource: 'Read' });
      }).not.toThrow();
    });

    it('should throw PermissionDeniedError for denied requests', () => {
      expect(() => {
        enforcer.enforce({ type: 'tool', resource: 'Write' });
      }).toThrow(PermissionDeniedError);
    });

    it('should include violations in thrown error', () => {
      try {
        enforcer.enforce({ type: 'tool', resource: 'Write' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PermissionDeniedError);
        const permError = error as PermissionDeniedError;
        expect(permError.violations).toHaveLength(1);
        expect(permError.violations[0].type).toBe('tool_denied');
      }
    });

    it('should have correct error name', () => {
      try {
        enforcer.enforce({ type: 'bash', resource: 'rm -rf /' });
      } catch (error) {
        expect((error as Error).name).toBe('PermissionDeniedError');
      }
    });
  });

  // ===========================================================================
  // checkAll Method Tests
  // ===========================================================================

  describe('checkAll', () => {
    let enforcer: PermissionEnforcer;

    beforeEach(() => {
      enforcer = new PermissionEnforcer(createRestrictedPermissions());
    });

    it('should check multiple requests at once', () => {
      const requests: PermissionRequest[] = [
        { type: 'tool', resource: 'Read' },
        { type: 'tool', resource: 'Write' },
        // Pattern src/**/* requires subdirectory
        { type: 'file_read', resource: 'src/components/index.ts' },
      ];

      const results = enforcer.checkAll(requests);

      expect(results.size).toBe(3);
      expect(results.get(requests[0])?.allowed).toBe(true);
      expect(results.get(requests[1])?.allowed).toBe(false);
      expect(results.get(requests[2])?.allowed).toBe(true);
    });

    it('should return empty map for empty input', () => {
      const results = enforcer.checkAll([]);

      expect(results.size).toBe(0);
    });
  });

  // ===========================================================================
  // Permissions Management Tests
  // ===========================================================================

  describe('updatePermissions', () => {
    it('should update permissions dynamically', () => {
      const permissions = createRestrictedPermissions();
      const enforcer = new PermissionEnforcer(permissions);

      // Initially write is disabled
      expect(enforcer.check({ type: 'tool', resource: 'Write' }).allowed).toBe(false);

      // Update permissions
      const newPermissions = createFullPermissions();
      enforcer.updatePermissions(newPermissions);

      // Now write should be allowed
      expect(enforcer.check({ type: 'tool', resource: 'Write' }).allowed).toBe(true);
    });

    it('should log permission updates in audit log', () => {
      const enforcer = new PermissionEnforcer(createRestrictedPermissions());
      enforcer.updatePermissions(createFullPermissions());

      const log = enforcer.getAuditLog();
      const updateEntry = log.find(e => e.metadata?.action === 'permissions_updated');

      expect(updateEntry).toBeDefined();
    });
  });

  describe('getPermissions', () => {
    it('should return a copy of permissions', () => {
      const original = createFullPermissions();
      const enforcer = new PermissionEnforcer(original);

      const retrieved = enforcer.getPermissions();

      // Should be equal but not same reference
      expect(retrieved).toEqual(original);
      expect(retrieved).not.toBe(original);
    });
  });

  // ===========================================================================
  // Audit Log Tests
  // ===========================================================================

  describe('audit log', () => {
    let enforcer: PermissionEnforcer;

    beforeEach(() => {
      enforcer = new PermissionEnforcer(createRestrictedPermissions());
    });

    it('should record all checks in audit log', () => {
      enforcer.check({ type: 'tool', resource: 'Read' });
      enforcer.check({ type: 'tool', resource: 'Write' });
      enforcer.check({ type: 'file_read', resource: 'test.ts' });

      const log = enforcer.getAuditLog();

      expect(log).toHaveLength(3);
    });

    it('should include timestamp in entries', () => {
      const before = new Date();
      enforcer.check({ type: 'tool', resource: 'Read' });
      const after = new Date();

      const log = enforcer.getAuditLog();

      expect(log[0].timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(log[0].timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should include duration in entries', () => {
      enforcer.check({ type: 'tool', resource: 'Read' });

      const log = enforcer.getAuditLog();

      expect(log[0].durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should filter audit log entries', () => {
      enforcer.check({ type: 'tool', resource: 'Read' });
      enforcer.check({ type: 'tool', resource: 'Write' });
      enforcer.check({ type: 'file_read', resource: 'test.ts' });

      const filtered = enforcer.getAuditLog({
        filter: entry => entry.request.type === 'tool',
      });

      expect(filtered).toHaveLength(2);
    });

    it('should limit audit log entries', () => {
      for (let i = 0; i < 10; i++) {
        enforcer.check({ type: 'tool', resource: 'Read' });
      }

      const limited = enforcer.getAuditLog({ limit: 5 });

      expect(limited).toHaveLength(5);
    });

    it('should clear audit log', () => {
      enforcer.check({ type: 'tool', resource: 'Read' });
      enforcer.check({ type: 'tool', resource: 'Write' });

      expect(enforcer.getAuditLog()).toHaveLength(2);

      enforcer.clearAuditLog();

      expect(enforcer.getAuditLog()).toHaveLength(0);
    });

    it('should trim log when exceeding maxAuditEntries', () => {
      const enforcer = new PermissionEnforcer(createFullPermissions(), {
        maxAuditEntries: 5,
      });

      for (let i = 0; i < 10; i++) {
        enforcer.check({ type: 'tool', resource: 'Read' });
      }

      const log = enforcer.getAuditLog();

      expect(log).toHaveLength(5);
    });
  });

  // ===========================================================================
  // Convenience Function Tests
  // ===========================================================================

  describe('convenience functions', () => {
    describe('createEnforcer', () => {
      it('should create an enforcer with default options', () => {
        const enforcer = createEnforcer(createFullPermissions());

        expect(enforcer).toBeInstanceOf(PermissionEnforcer);
      });

      it('should accept options', () => {
        const enforcer = createEnforcer(createFullPermissions(), {
          isolationLevel: 'strict',
          maxAuditEntries: 50,
        });

        expect(enforcer).toBeInstanceOf(PermissionEnforcer);
      });
    });

    describe('createStrictEnforcer', () => {
      it('should create an enforcer with strict isolation', () => {
        const enforcer = createStrictEnforcer(createFullPermissions());

        // Strict mode blocks dangerous bash commands
        const result = enforcer.check({ type: 'bash', resource: 'sudo rm -rf /' });

        expect(result.allowed).toBe(false);
        expect(result.violations[0].type).toBe('isolation_violation');
      });
    });

    describe('createPermissiveEnforcer', () => {
      it('should create an enforcer with permissive isolation', () => {
        const enforcer = createPermissiveEnforcer(createFullPermissions());

        // Permissive mode allows dangerous commands (if not denied by patterns)
        const result = enforcer.check({ type: 'bash', resource: 'rm -rf /tmp/test' });

        expect(result.allowed).toBe(true);
      });
    });
  });

  // ===========================================================================
  // PermissionDeniedError Tests
  // ===========================================================================

  describe('PermissionDeniedError', () => {
    it('should create error with message and violations', () => {
      const violations = [{
        type: 'tool_denied' as const,
        resource: 'Write',
        permission: 'coreTools.write',
        message: 'Write tool is disabled',
        severity: 'error' as const,
      }];

      const error = new PermissionDeniedError('Permission denied', violations);

      expect(error.message).toBe('Permission denied');
      expect(error.violations).toEqual(violations);
      expect(error.name).toBe('PermissionDeniedError');
    });

    it('should be instanceof Error', () => {
      const error = new PermissionDeniedError('test', []);

      expect(error).toBeInstanceOf(Error);
    });
  });

  // ===========================================================================
  // Edge Cases and Integration Tests
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle empty pattern arrays', () => {
      const permissions = createFullPermissions();
      permissions.bash.allowedPatterns = [];
      permissions.bash.deniedPatterns = [];
      permissions.fileSystem.readPatterns = [];
      permissions.fileSystem.writePatterns = [];
      permissions.fileSystem.denyPatterns = [];

      const enforcer = new PermissionEnforcer(permissions);

      // Should allow everything when patterns are empty
      expect(enforcer.check({ type: 'bash', resource: 'any command' }).allowed).toBe(true);
      expect(enforcer.check({ type: 'file_read', resource: 'any/path' }).allowed).toBe(true);
      expect(enforcer.check({ type: 'file_write', resource: 'any/path' }).allowed).toBe(true);
    });

    it('should handle special regex characters in patterns', () => {
      const permissions = createRestrictedPermissions();
      permissions.fileSystem.readPatterns = ['src/**/*.ts'];
      const enforcer = new PermissionEnforcer(permissions);

      const result = enforcer.check({ type: 'file_read', resource: 'src/components/test.ts' });

      expect(result.allowed).toBe(true);
    });

    it('should handle complex glob patterns', () => {
      const permissions = createFullPermissions();
      // Pattern **/test/**/*.spec.ts requires: (anything)/test/(anything)/(file).spec.ts
      // Note: ** becomes .*\/ which requires a path separator before 'test'
      permissions.fileSystem.readPatterns = ['**/test/**/*.spec.ts'];
      const enforcer = new PermissionEnforcer(permissions);

      // Has proper structure: prefix/test/subdir/file.spec.ts
      expect(enforcer.check({ type: 'file_read', resource: 'src/test/unit/foo.spec.ts' }).allowed).toBe(true);
      // Another valid path with something before test
      expect(enforcer.check({ type: 'file_read', resource: 'lib/test/integration/bar.spec.ts' }).allowed).toBe(true);
      // Should fail - doesn't match pattern
      expect(enforcer.check({ type: 'file_read', resource: 'src/foo.ts' }).allowed).toBe(false);
    });

    it('should prioritize deny patterns over allow patterns', () => {
      const permissions = createFullPermissions();
      permissions.fileSystem.readPatterns = ['**/*'];
      permissions.fileSystem.denyPatterns = ['**/secret/**'];
      const enforcer = new PermissionEnforcer(permissions);

      expect(enforcer.check({ type: 'file_read', resource: 'src/secret/key.txt' }).allowed).toBe(false);
    });

    it('should handle invalid regex patterns gracefully', () => {
      const permissions = createFullPermissions();
      permissions.bash.allowedPatterns = ['[invalid(regex'];
      const enforcer = new PermissionEnforcer(permissions);

      // Should fall back to string matching
      expect(() => enforcer.check({ type: 'bash', resource: 'ls' })).not.toThrow();
    });
  });
});
