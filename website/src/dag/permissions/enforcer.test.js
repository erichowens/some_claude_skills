"use strict";
/**
 * Tests for Permission Enforcer
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var enforcer_1 = require("./enforcer");
// =============================================================================
// Test Fixtures
// =============================================================================
function createFullPermissions() {
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
function createRestrictedPermissions() {
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
function createMinimalPermissions() {
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
(0, vitest_1.describe)('PermissionEnforcer', function () {
    (0, vitest_1.describe)('constructor', function () {
        (0, vitest_1.it)('should create an enforcer with default options', function () {
            var permissions = createFullPermissions();
            var enforcer = new enforcer_1.PermissionEnforcer(permissions);
            (0, vitest_1.expect)(enforcer).toBeInstanceOf(enforcer_1.PermissionEnforcer);
            (0, vitest_1.expect)(enforcer.getPermissions()).toEqual(permissions);
        });
        (0, vitest_1.it)('should accept isolation level option', function () {
            var permissions = createFullPermissions();
            var enforcer = new enforcer_1.PermissionEnforcer(permissions, { isolationLevel: 'strict' });
            (0, vitest_1.expect)(enforcer).toBeInstanceOf(enforcer_1.PermissionEnforcer);
        });
        (0, vitest_1.it)('should accept maxAuditEntries option', function () {
            var permissions = createFullPermissions();
            var enforcer = new enforcer_1.PermissionEnforcer(permissions, { maxAuditEntries: 100 });
            (0, vitest_1.expect)(enforcer).toBeInstanceOf(enforcer_1.PermissionEnforcer);
        });
    });
    // ===========================================================================
    // Tool Permission Tests
    // ===========================================================================
    (0, vitest_1.describe)('check - tool permissions', function () {
        var enforcer;
        (0, vitest_1.beforeEach)(function () {
            enforcer = new enforcer_1.PermissionEnforcer(createRestrictedPermissions());
        });
        (0, vitest_1.it)('should allow enabled tools', function () {
            var result = enforcer.check({ type: 'tool', resource: 'Read' });
            (0, vitest_1.expect)(result.allowed).toBe(true);
            (0, vitest_1.expect)(result.violations).toHaveLength(0);
        });
        (0, vitest_1.it)('should deny disabled tools', function () {
            var result = enforcer.check({ type: 'tool', resource: 'Write' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.violations).toHaveLength(1);
            (0, vitest_1.expect)(result.violations[0].type).toBe('tool_denied');
            (0, vitest_1.expect)(result.violations[0].resource).toBe('Write');
        });
        (0, vitest_1.it)('should allow unknown tools (not in mapping)', function () {
            var result = enforcer.check({ type: 'tool', resource: 'UnknownTool' });
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
        (0, vitest_1.it)('should check all core tools correctly', function () {
            var toolStates = {
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
            for (var _i = 0, _a = Object.entries(toolStates); _i < _a.length; _i++) {
                var _b = _a[_i], tool = _b[0], expected = _b[1];
                var result = enforcer.check({ type: 'tool', resource: tool });
                (0, vitest_1.expect)(result.allowed).toBe(expected);
            }
        });
    });
    // ===========================================================================
    // File Read Permission Tests
    // ===========================================================================
    (0, vitest_1.describe)('check - file_read permissions', function () {
        var enforcer;
        (0, vitest_1.beforeEach)(function () {
            enforcer = new enforcer_1.PermissionEnforcer(createRestrictedPermissions());
        });
        (0, vitest_1.it)('should allow reading files matching readPatterns', function () {
            // Pattern src/**/* requires at least one subdirectory
            var result = enforcer.check({ type: 'file_read', resource: 'src/components/index.ts' });
            (0, vitest_1.expect)(result.allowed).toBe(true);
            (0, vitest_1.expect)(result.violations).toHaveLength(0);
        });
        (0, vitest_1.it)('should deny reading files not matching readPatterns', function () {
            var result = enforcer.check({ type: 'file_read', resource: 'config/secret.json' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.violations[0].type).toBe('file_read_denied');
        });
        (0, vitest_1.it)('should deny reading files matching denyPatterns (precedence over allow)', function () {
            var result = enforcer.check({ type: 'file_read', resource: 'src/node_modules/lodash/index.js' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.violations[0].type).toBe('file_read_denied');
            (0, vitest_1.expect)(result.violations[0].message).toContain('deny pattern');
        });
        (0, vitest_1.it)('should deny reading .env files', function () {
            var result = enforcer.check({ type: 'file_read', resource: 'src/.env.local' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
        });
        (0, vitest_1.it)('should allow any file when readPatterns is empty', function () {
            var permissions = createFullPermissions();
            permissions.fileSystem.readPatterns = [];
            var enforcer = new enforcer_1.PermissionEnforcer(permissions);
            var result = enforcer.check({ type: 'file_read', resource: 'any/path/file.txt' });
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
        (0, vitest_1.it)('should provide suggestions for denied files', function () {
            var result = enforcer.check({ type: 'file_read', resource: 'src-backup/index.ts' });
            // Should suggest similar patterns (src/** is close to src-backup)
            (0, vitest_1.expect)(result.allowed).toBe(false);
        });
    });
    // ===========================================================================
    // File Write Permission Tests
    // ===========================================================================
    (0, vitest_1.describe)('check - file_write permissions', function () {
        (0, vitest_1.it)('should deny when write and edit are both disabled', function () {
            var enforcer = new enforcer_1.PermissionEnforcer(createRestrictedPermissions());
            var result = enforcer.check({ type: 'file_write', resource: 'src/test.ts' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.violations[0].message).toBe('Write operations are not allowed');
        });
        (0, vitest_1.it)('should check writePatterns when write is enabled', function () {
            var permissions = createFullPermissions();
            // Pattern src/**/* requires at least one subdirectory
            permissions.fileSystem.writePatterns = ['src/**/*'];
            var enforcer = new enforcer_1.PermissionEnforcer(permissions);
            var allowedResult = enforcer.check({ type: 'file_write', resource: 'src/components/new.ts' });
            (0, vitest_1.expect)(allowedResult.allowed).toBe(true);
            var deniedResult = enforcer.check({ type: 'file_write', resource: 'docs/readme.md' });
            (0, vitest_1.expect)(deniedResult.allowed).toBe(false);
        });
        (0, vitest_1.it)('should deny writes matching denyPatterns', function () {
            var permissions = createFullPermissions();
            permissions.fileSystem.denyPatterns = ['**/*.secret'];
            var enforcer = new enforcer_1.PermissionEnforcer(permissions);
            var result = enforcer.check({ type: 'file_write', resource: 'config/api.secret' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.violations[0].message).toContain('deny pattern');
        });
        (0, vitest_1.it)('should allow write when edit is enabled but write is disabled', function () {
            var permissions = createRestrictedPermissions();
            permissions.coreTools.write = false;
            permissions.coreTools.edit = true;
            permissions.fileSystem.writePatterns = ['**/*'];
            var enforcer = new enforcer_1.PermissionEnforcer(permissions);
            var result = enforcer.check({ type: 'file_write', resource: 'src/test.ts' });
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
    });
    // ===========================================================================
    // Bash Permission Tests
    // ===========================================================================
    (0, vitest_1.describe)('check - bash permissions', function () {
        (0, vitest_1.it)('should deny all commands when bash is disabled', function () {
            var enforcer = new enforcer_1.PermissionEnforcer(createMinimalPermissions());
            var result = enforcer.check({ type: 'bash', resource: 'echo hello' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.violations[0].type).toBe('bash_denied');
        });
        (0, vitest_1.it)('should allow commands matching allowedPatterns', function () {
            var enforcer = new enforcer_1.PermissionEnforcer(createRestrictedPermissions());
            var result = enforcer.check({ type: 'bash', resource: 'ls -la' });
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
        (0, vitest_1.it)('should deny commands matching deniedPatterns', function () {
            var enforcer = new enforcer_1.PermissionEnforcer(createRestrictedPermissions());
            var result = enforcer.check({ type: 'bash', resource: 'rm -rf /' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.violations[0].type).toBe('bash_pattern_denied');
        });
        (0, vitest_1.it)('should deny commands not matching any allowedPattern', function () {
            var enforcer = new enforcer_1.PermissionEnforcer(createRestrictedPermissions());
            var result = enforcer.check({ type: 'bash', resource: 'wget http://evil.com' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
        });
        (0, vitest_1.it)('should apply strict isolation mode restrictions', function () {
            var permissions = createFullPermissions();
            var enforcer = new enforcer_1.PermissionEnforcer(permissions, { isolationLevel: 'strict' });
            var dangerousCommands = [
                'rm -rf /home',
                'sudo apt install something',
                'chmod 777 /etc/passwd',
                'dd if=/dev/zero of=/dev/sda',
                'mkfs.ext4 /dev/sdb',
            ];
            for (var _i = 0, dangerousCommands_1 = dangerousCommands; _i < dangerousCommands_1.length; _i++) {
                var cmd = dangerousCommands_1[_i];
                var result = enforcer.check({ type: 'bash', resource: cmd });
                (0, vitest_1.expect)(result.allowed).toBe(false);
                (0, vitest_1.expect)(result.violations[0].type).toBe('isolation_violation');
            }
        });
        (0, vitest_1.it)('should allow dangerous commands in permissive mode', function () {
            var permissions = createFullPermissions();
            var enforcer = new enforcer_1.PermissionEnforcer(permissions, { isolationLevel: 'permissive' });
            var result = enforcer.check({ type: 'bash', resource: 'rm -rf /tmp/test' });
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
        (0, vitest_1.it)('should allow all commands when allowedPatterns is empty', function () {
            var permissions = createFullPermissions();
            permissions.bash.allowedPatterns = [];
            var enforcer = new enforcer_1.PermissionEnforcer(permissions);
            var result = enforcer.check({ type: 'bash', resource: 'any command' });
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
    });
    // ===========================================================================
    // MCP Permission Tests
    // ===========================================================================
    (0, vitest_1.describe)('check - mcp permissions', function () {
        var enforcer;
        (0, vitest_1.beforeEach)(function () {
            enforcer = new enforcer_1.PermissionEnforcer(createRestrictedPermissions());
        });
        (0, vitest_1.it)('should allow MCP tools in allowed list', function () {
            var result = enforcer.check({ type: 'mcp', resource: 'fetch:get' });
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
        (0, vitest_1.it)('should allow MCP tools matching wildcard pattern', function () {
            var result = enforcer.check({ type: 'mcp', resource: 'fetch:post' });
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
        (0, vitest_1.it)('should deny MCP tools in denied list', function () {
            var result = enforcer.check({ type: 'mcp', resource: 'server:dangerous' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.violations[0].message).toContain('explicitly denied');
        });
        (0, vitest_1.it)('should deny MCP tools matching denied wildcard', function () {
            var result = enforcer.check({ type: 'mcp', resource: 'admin:user-delete' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
        });
        (0, vitest_1.it)('should deny MCP tools not in allowed list', function () {
            var result = enforcer.check({ type: 'mcp', resource: 'unknown:tool' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.violations[0].message).toContain('not in allowed list');
        });
        (0, vitest_1.it)('should allow all tools with wildcard allowed', function () {
            var permissions = createFullPermissions();
            var enforcer = new enforcer_1.PermissionEnforcer(permissions);
            var result = enforcer.check({ type: 'mcp', resource: 'any:tool' });
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
        (0, vitest_1.it)('should handle tool spec without server prefix', function () {
            var permissions = createRestrictedPermissions();
            permissions.mcpTools.allowed = ['simple-tool'];
            var enforcer = new enforcer_1.PermissionEnforcer(permissions);
            var result = enforcer.check({ type: 'mcp', resource: 'simple-tool' });
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
    });
    // ===========================================================================
    // Network Permission Tests
    // ===========================================================================
    (0, vitest_1.describe)('check - network permissions', function () {
        var enforcer;
        (0, vitest_1.beforeEach)(function () {
            enforcer = new enforcer_1.PermissionEnforcer(createRestrictedPermissions());
        });
        (0, vitest_1.it)('should deny all network when disabled', function () {
            var minimalEnforcer = new enforcer_1.PermissionEnforcer(createMinimalPermissions());
            var result = minimalEnforcer.check({ type: 'network', resource: 'https://google.com' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.violations[0].message).toBe('Network access is not allowed');
        });
        (0, vitest_1.it)('should allow URLs with domains in allowedDomains', function () {
            var result = enforcer.check({ type: 'network', resource: 'https://github.com/user/repo' });
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
        (0, vitest_1.it)('should allow subdomains with wildcard pattern', function () {
            var result = enforcer.check({ type: 'network', resource: 'https://api.github.com/users' });
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
        (0, vitest_1.it)('should deny URLs in deniedDomains', function () {
            var result = enforcer.check({ type: 'network', resource: 'https://evil.com/hack' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.violations[0].message).toContain('explicitly denied');
        });
        (0, vitest_1.it)('should deny subdomains of denied wildcard domains', function () {
            var result = enforcer.check({ type: 'network', resource: 'https://payload.malware.org' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
        });
        (0, vitest_1.it)('should deny URLs not in allowedDomains', function () {
            var result = enforcer.check({ type: 'network', resource: 'https://random-site.com' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.violations[0].message).toContain('not in allowed list');
        });
        (0, vitest_1.it)('should allow all domains when allowedDomains is empty', function () {
            var permissions = createFullPermissions();
            permissions.network.allowedDomains = [];
            var enforcer = new enforcer_1.PermissionEnforcer(permissions);
            var result = enforcer.check({ type: 'network', resource: 'https://any-domain.com' });
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
        (0, vitest_1.it)('should handle plain domain strings (not URLs)', function () {
            var result = enforcer.check({ type: 'network', resource: 'github.com' });
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
        (0, vitest_1.it)('should handle malformed URLs gracefully', function () {
            var result = enforcer.check({ type: 'network', resource: 'not-a-valid-url' });
            // Should treat as domain directly
            (0, vitest_1.expect)(result.allowed).toBe(false);
        });
    });
    // ===========================================================================
    // Model Permission Tests
    // ===========================================================================
    (0, vitest_1.describe)('check - model permissions', function () {
        var enforcer;
        (0, vitest_1.beforeEach)(function () {
            enforcer = new enforcer_1.PermissionEnforcer(createRestrictedPermissions());
        });
        (0, vitest_1.it)('should allow models in allowed list', function () {
            var result = enforcer.check({ type: 'model', resource: 'haiku' });
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
        (0, vitest_1.it)('should deny models not in allowed list', function () {
            var result = enforcer.check({ type: 'model', resource: 'opus' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.violations[0].type).toBe('model_denied');
        });
        (0, vitest_1.it)('should provide suggestions for denied models', function () {
            var _a;
            var result = enforcer.check({ type: 'model', resource: 'opus' });
            (0, vitest_1.expect)(result.suggestions).toBeDefined();
            (0, vitest_1.expect)((_a = result.suggestions) === null || _a === void 0 ? void 0 : _a[0]).toContain('haiku');
        });
        (0, vitest_1.it)('should allow all models with full permissions', function () {
            var enforcer = new enforcer_1.PermissionEnforcer(createFullPermissions());
            for (var _i = 0, _a = ['haiku', 'sonnet', 'opus']; _i < _a.length; _i++) {
                var model = _a[_i];
                var result = enforcer.check({ type: 'model', resource: model });
                (0, vitest_1.expect)(result.allowed).toBe(true);
            }
        });
        (0, vitest_1.it)('should deny unknown model names', function () {
            var result = enforcer.check({ type: 'model', resource: 'gpt-4' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
        });
    });
    // ===========================================================================
    // Unknown Request Type Tests
    // ===========================================================================
    (0, vitest_1.describe)('check - unknown request types', function () {
        (0, vitest_1.it)('should deny unknown request types', function () {
            var enforcer = new enforcer_1.PermissionEnforcer(createFullPermissions());
            var result = enforcer.check({ type: 'unknown', resource: 'something' });
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('Unknown request type');
        });
    });
    // ===========================================================================
    // Enforce Method Tests
    // ===========================================================================
    (0, vitest_1.describe)('enforce', function () {
        var enforcer;
        (0, vitest_1.beforeEach)(function () {
            enforcer = new enforcer_1.PermissionEnforcer(createRestrictedPermissions());
        });
        (0, vitest_1.it)('should not throw for allowed requests', function () {
            (0, vitest_1.expect)(function () {
                enforcer.enforce({ type: 'tool', resource: 'Read' });
            }).not.toThrow();
        });
        (0, vitest_1.it)('should throw PermissionDeniedError for denied requests', function () {
            (0, vitest_1.expect)(function () {
                enforcer.enforce({ type: 'tool', resource: 'Write' });
            }).toThrow(enforcer_1.PermissionDeniedError);
        });
        (0, vitest_1.it)('should include violations in thrown error', function () {
            try {
                enforcer.enforce({ type: 'tool', resource: 'Write' });
                vitest_1.expect.fail('Should have thrown');
            }
            catch (error) {
                (0, vitest_1.expect)(error).toBeInstanceOf(enforcer_1.PermissionDeniedError);
                var permError = error;
                (0, vitest_1.expect)(permError.violations).toHaveLength(1);
                (0, vitest_1.expect)(permError.violations[0].type).toBe('tool_denied');
            }
        });
        (0, vitest_1.it)('should have correct error name', function () {
            try {
                enforcer.enforce({ type: 'bash', resource: 'rm -rf /' });
            }
            catch (error) {
                (0, vitest_1.expect)(error.name).toBe('PermissionDeniedError');
            }
        });
    });
    // ===========================================================================
    // checkAll Method Tests
    // ===========================================================================
    (0, vitest_1.describe)('checkAll', function () {
        var enforcer;
        (0, vitest_1.beforeEach)(function () {
            enforcer = new enforcer_1.PermissionEnforcer(createRestrictedPermissions());
        });
        (0, vitest_1.it)('should check multiple requests at once', function () {
            var _a, _b, _c;
            var requests = [
                { type: 'tool', resource: 'Read' },
                { type: 'tool', resource: 'Write' },
                // Pattern src/**/* requires subdirectory
                { type: 'file_read', resource: 'src/components/index.ts' },
            ];
            var results = enforcer.checkAll(requests);
            (0, vitest_1.expect)(results.size).toBe(3);
            (0, vitest_1.expect)((_a = results.get(requests[0])) === null || _a === void 0 ? void 0 : _a.allowed).toBe(true);
            (0, vitest_1.expect)((_b = results.get(requests[1])) === null || _b === void 0 ? void 0 : _b.allowed).toBe(false);
            (0, vitest_1.expect)((_c = results.get(requests[2])) === null || _c === void 0 ? void 0 : _c.allowed).toBe(true);
        });
        (0, vitest_1.it)('should return empty map for empty input', function () {
            var results = enforcer.checkAll([]);
            (0, vitest_1.expect)(results.size).toBe(0);
        });
    });
    // ===========================================================================
    // Permissions Management Tests
    // ===========================================================================
    (0, vitest_1.describe)('updatePermissions', function () {
        (0, vitest_1.it)('should update permissions dynamically', function () {
            var permissions = createRestrictedPermissions();
            var enforcer = new enforcer_1.PermissionEnforcer(permissions);
            // Initially write is disabled
            (0, vitest_1.expect)(enforcer.check({ type: 'tool', resource: 'Write' }).allowed).toBe(false);
            // Update permissions
            var newPermissions = createFullPermissions();
            enforcer.updatePermissions(newPermissions);
            // Now write should be allowed
            (0, vitest_1.expect)(enforcer.check({ type: 'tool', resource: 'Write' }).allowed).toBe(true);
        });
        (0, vitest_1.it)('should log permission updates in audit log', function () {
            var enforcer = new enforcer_1.PermissionEnforcer(createRestrictedPermissions());
            enforcer.updatePermissions(createFullPermissions());
            var log = enforcer.getAuditLog();
            var updateEntry = log.find(function (e) { var _a; return ((_a = e.metadata) === null || _a === void 0 ? void 0 : _a.action) === 'permissions_updated'; });
            (0, vitest_1.expect)(updateEntry).toBeDefined();
        });
    });
    (0, vitest_1.describe)('getPermissions', function () {
        (0, vitest_1.it)('should return a copy of permissions', function () {
            var original = createFullPermissions();
            var enforcer = new enforcer_1.PermissionEnforcer(original);
            var retrieved = enforcer.getPermissions();
            // Should be equal but not same reference
            (0, vitest_1.expect)(retrieved).toEqual(original);
            (0, vitest_1.expect)(retrieved).not.toBe(original);
        });
    });
    // ===========================================================================
    // Audit Log Tests
    // ===========================================================================
    (0, vitest_1.describe)('audit log', function () {
        var enforcer;
        (0, vitest_1.beforeEach)(function () {
            enforcer = new enforcer_1.PermissionEnforcer(createRestrictedPermissions());
        });
        (0, vitest_1.it)('should record all checks in audit log', function () {
            enforcer.check({ type: 'tool', resource: 'Read' });
            enforcer.check({ type: 'tool', resource: 'Write' });
            enforcer.check({ type: 'file_read', resource: 'test.ts' });
            var log = enforcer.getAuditLog();
            (0, vitest_1.expect)(log).toHaveLength(3);
        });
        (0, vitest_1.it)('should include timestamp in entries', function () {
            var before = new Date();
            enforcer.check({ type: 'tool', resource: 'Read' });
            var after = new Date();
            var log = enforcer.getAuditLog();
            (0, vitest_1.expect)(log[0].timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
            (0, vitest_1.expect)(log[0].timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
        });
        (0, vitest_1.it)('should include duration in entries', function () {
            enforcer.check({ type: 'tool', resource: 'Read' });
            var log = enforcer.getAuditLog();
            (0, vitest_1.expect)(log[0].durationMs).toBeGreaterThanOrEqual(0);
        });
        (0, vitest_1.it)('should filter audit log entries', function () {
            enforcer.check({ type: 'tool', resource: 'Read' });
            enforcer.check({ type: 'tool', resource: 'Write' });
            enforcer.check({ type: 'file_read', resource: 'test.ts' });
            var filtered = enforcer.getAuditLog({
                filter: function (entry) { return entry.request.type === 'tool'; },
            });
            (0, vitest_1.expect)(filtered).toHaveLength(2);
        });
        (0, vitest_1.it)('should limit audit log entries', function () {
            for (var i = 0; i < 10; i++) {
                enforcer.check({ type: 'tool', resource: 'Read' });
            }
            var limited = enforcer.getAuditLog({ limit: 5 });
            (0, vitest_1.expect)(limited).toHaveLength(5);
        });
        (0, vitest_1.it)('should clear audit log', function () {
            enforcer.check({ type: 'tool', resource: 'Read' });
            enforcer.check({ type: 'tool', resource: 'Write' });
            (0, vitest_1.expect)(enforcer.getAuditLog()).toHaveLength(2);
            enforcer.clearAuditLog();
            (0, vitest_1.expect)(enforcer.getAuditLog()).toHaveLength(0);
        });
        (0, vitest_1.it)('should trim log when exceeding maxAuditEntries', function () {
            var enforcer = new enforcer_1.PermissionEnforcer(createFullPermissions(), {
                maxAuditEntries: 5,
            });
            for (var i = 0; i < 10; i++) {
                enforcer.check({ type: 'tool', resource: 'Read' });
            }
            var log = enforcer.getAuditLog();
            (0, vitest_1.expect)(log).toHaveLength(5);
        });
    });
    // ===========================================================================
    // Convenience Function Tests
    // ===========================================================================
    (0, vitest_1.describe)('convenience functions', function () {
        (0, vitest_1.describe)('createEnforcer', function () {
            (0, vitest_1.it)('should create an enforcer with default options', function () {
                var enforcer = (0, enforcer_1.createEnforcer)(createFullPermissions());
                (0, vitest_1.expect)(enforcer).toBeInstanceOf(enforcer_1.PermissionEnforcer);
            });
            (0, vitest_1.it)('should accept options', function () {
                var enforcer = (0, enforcer_1.createEnforcer)(createFullPermissions(), {
                    isolationLevel: 'strict',
                    maxAuditEntries: 50,
                });
                (0, vitest_1.expect)(enforcer).toBeInstanceOf(enforcer_1.PermissionEnforcer);
            });
        });
        (0, vitest_1.describe)('createStrictEnforcer', function () {
            (0, vitest_1.it)('should create an enforcer with strict isolation', function () {
                var enforcer = (0, enforcer_1.createStrictEnforcer)(createFullPermissions());
                // Strict mode blocks dangerous bash commands
                var result = enforcer.check({ type: 'bash', resource: 'sudo rm -rf /' });
                (0, vitest_1.expect)(result.allowed).toBe(false);
                (0, vitest_1.expect)(result.violations[0].type).toBe('isolation_violation');
            });
        });
        (0, vitest_1.describe)('createPermissiveEnforcer', function () {
            (0, vitest_1.it)('should create an enforcer with permissive isolation', function () {
                var enforcer = (0, enforcer_1.createPermissiveEnforcer)(createFullPermissions());
                // Permissive mode allows dangerous commands (if not denied by patterns)
                var result = enforcer.check({ type: 'bash', resource: 'rm -rf /tmp/test' });
                (0, vitest_1.expect)(result.allowed).toBe(true);
            });
        });
    });
    // ===========================================================================
    // PermissionDeniedError Tests
    // ===========================================================================
    (0, vitest_1.describe)('PermissionDeniedError', function () {
        (0, vitest_1.it)('should create error with message and violations', function () {
            var violations = [{
                    type: 'tool_denied',
                    resource: 'Write',
                    permission: 'coreTools.write',
                    message: 'Write tool is disabled',
                    severity: 'error',
                }];
            var error = new enforcer_1.PermissionDeniedError('Permission denied', violations);
            (0, vitest_1.expect)(error.message).toBe('Permission denied');
            (0, vitest_1.expect)(error.violations).toEqual(violations);
            (0, vitest_1.expect)(error.name).toBe('PermissionDeniedError');
        });
        (0, vitest_1.it)('should be instanceof Error', function () {
            var error = new enforcer_1.PermissionDeniedError('test', []);
            (0, vitest_1.expect)(error).toBeInstanceOf(Error);
        });
    });
    // ===========================================================================
    // Edge Cases and Integration Tests
    // ===========================================================================
    (0, vitest_1.describe)('edge cases', function () {
        (0, vitest_1.it)('should handle empty pattern arrays', function () {
            var permissions = createFullPermissions();
            permissions.bash.allowedPatterns = [];
            permissions.bash.deniedPatterns = [];
            permissions.fileSystem.readPatterns = [];
            permissions.fileSystem.writePatterns = [];
            permissions.fileSystem.denyPatterns = [];
            var enforcer = new enforcer_1.PermissionEnforcer(permissions);
            // Should allow everything when patterns are empty
            (0, vitest_1.expect)(enforcer.check({ type: 'bash', resource: 'any command' }).allowed).toBe(true);
            (0, vitest_1.expect)(enforcer.check({ type: 'file_read', resource: 'any/path' }).allowed).toBe(true);
            (0, vitest_1.expect)(enforcer.check({ type: 'file_write', resource: 'any/path' }).allowed).toBe(true);
        });
        (0, vitest_1.it)('should handle special regex characters in patterns', function () {
            var permissions = createRestrictedPermissions();
            permissions.fileSystem.readPatterns = ['src/**/*.ts'];
            var enforcer = new enforcer_1.PermissionEnforcer(permissions);
            var result = enforcer.check({ type: 'file_read', resource: 'src/components/test.ts' });
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
        (0, vitest_1.it)('should handle complex glob patterns', function () {
            var permissions = createFullPermissions();
            // Pattern **/test/**/*.spec.ts requires: (anything)/test/(anything)/(file).spec.ts
            // Note: ** becomes .*\/ which requires a path separator before 'test'
            permissions.fileSystem.readPatterns = ['**/test/**/*.spec.ts'];
            var enforcer = new enforcer_1.PermissionEnforcer(permissions);
            // Has proper structure: prefix/test/subdir/file.spec.ts
            (0, vitest_1.expect)(enforcer.check({ type: 'file_read', resource: 'src/test/unit/foo.spec.ts' }).allowed).toBe(true);
            // Another valid path with something before test
            (0, vitest_1.expect)(enforcer.check({ type: 'file_read', resource: 'lib/test/integration/bar.spec.ts' }).allowed).toBe(true);
            // Should fail - doesn't match pattern
            (0, vitest_1.expect)(enforcer.check({ type: 'file_read', resource: 'src/foo.ts' }).allowed).toBe(false);
        });
        (0, vitest_1.it)('should prioritize deny patterns over allow patterns', function () {
            var permissions = createFullPermissions();
            permissions.fileSystem.readPatterns = ['**/*'];
            permissions.fileSystem.denyPatterns = ['**/secret/**'];
            var enforcer = new enforcer_1.PermissionEnforcer(permissions);
            (0, vitest_1.expect)(enforcer.check({ type: 'file_read', resource: 'src/secret/key.txt' }).allowed).toBe(false);
        });
        (0, vitest_1.it)('should handle invalid regex patterns gracefully', function () {
            var permissions = createFullPermissions();
            permissions.bash.allowedPatterns = ['[invalid(regex'];
            var enforcer = new enforcer_1.PermissionEnforcer(permissions);
            // Should fall back to string matching
            (0, vitest_1.expect)(function () { return enforcer.check({ type: 'bash', resource: 'ls' }); }).not.toThrow();
        });
    });
});
