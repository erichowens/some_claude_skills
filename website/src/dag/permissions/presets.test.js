"use strict";
/**
 * Tests for Permission Presets
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var presets_1 = require("./presets");
var validator_1 = require("./validator");
// =============================================================================
// Preset Structure Tests
// =============================================================================
(0, vitest_1.describe)('Preset Structure', function () {
    var presets = [
        { name: 'MINIMAL_PERMISSIONS', preset: presets_1.MINIMAL_PERMISSIONS },
        { name: 'READ_ONLY_PERMISSIONS', preset: presets_1.READ_ONLY_PERMISSIONS },
        { name: 'STANDARD_PERMISSIONS', preset: presets_1.STANDARD_PERMISSIONS },
        { name: 'FULL_PERMISSIONS', preset: presets_1.FULL_PERMISSIONS },
        { name: 'CI_CD_PERMISSIONS', preset: presets_1.CI_CD_PERMISSIONS },
        { name: 'RESEARCH_PERMISSIONS', preset: presets_1.RESEARCH_PERMISSIONS },
        { name: 'CODE_GENERATION_PERMISSIONS', preset: presets_1.CODE_GENERATION_PERMISSIONS },
    ];
    var _loop_1 = function (name_1, preset) {
        (0, vitest_1.describe)(name_1, function () {
            (0, vitest_1.it)('should have coreTools', function () {
                (0, vitest_1.expect)(preset.coreTools).toBeDefined();
                (0, vitest_1.expect)(typeof preset.coreTools.read).toBe('boolean');
                (0, vitest_1.expect)(typeof preset.coreTools.write).toBe('boolean');
                (0, vitest_1.expect)(typeof preset.coreTools.edit).toBe('boolean');
            });
            (0, vitest_1.it)('should have bash', function () {
                (0, vitest_1.expect)(preset.bash).toBeDefined();
                (0, vitest_1.expect)(typeof preset.bash.enabled).toBe('boolean');
                (0, vitest_1.expect)(typeof preset.bash.sandboxed).toBe('boolean');
                (0, vitest_1.expect)(Array.isArray(preset.bash.allowedPatterns)).toBe(true);
                (0, vitest_1.expect)(Array.isArray(preset.bash.deniedPatterns)).toBe(true);
            });
            (0, vitest_1.it)('should have fileSystem', function () {
                (0, vitest_1.expect)(preset.fileSystem).toBeDefined();
                (0, vitest_1.expect)(Array.isArray(preset.fileSystem.readPatterns)).toBe(true);
                (0, vitest_1.expect)(Array.isArray(preset.fileSystem.writePatterns)).toBe(true);
                (0, vitest_1.expect)(Array.isArray(preset.fileSystem.denyPatterns)).toBe(true);
            });
            (0, vitest_1.it)('should have mcpTools', function () {
                (0, vitest_1.expect)(preset.mcpTools).toBeDefined();
                (0, vitest_1.expect)(Array.isArray(preset.mcpTools.allowed)).toBe(true);
                (0, vitest_1.expect)(Array.isArray(preset.mcpTools.denied)).toBe(true);
            });
            (0, vitest_1.it)('should have network', function () {
                (0, vitest_1.expect)(preset.network).toBeDefined();
                (0, vitest_1.expect)(typeof preset.network.enabled).toBe('boolean');
                (0, vitest_1.expect)(Array.isArray(preset.network.allowedDomains)).toBe(true);
            });
            (0, vitest_1.it)('should have models', function () {
                (0, vitest_1.expect)(preset.models).toBeDefined();
                (0, vitest_1.expect)(Array.isArray(preset.models.allowed)).toBe(true);
                (0, vitest_1.expect)(preset.models.preferredForSpawning).toBeDefined();
            });
            (0, vitest_1.it)('should pass validation', function () {
                var validator = new validator_1.PermissionValidator();
                var result = validator.validate(preset);
                (0, vitest_1.expect)(result.valid).toBe(true);
            });
        });
    };
    for (var _i = 0, presets_2 = presets; _i < presets_2.length; _i++) {
        var _a = presets_2[_i], name_1 = _a.name, preset = _a.preset;
        _loop_1(name_1, preset);
    }
});
// =============================================================================
// MINIMAL_PERMISSIONS Tests
// =============================================================================
(0, vitest_1.describe)('MINIMAL_PERMISSIONS', function () {
    (0, vitest_1.it)('should have read enabled but write/edit disabled', function () {
        (0, vitest_1.expect)(presets_1.MINIMAL_PERMISSIONS.coreTools.read).toBe(true);
        (0, vitest_1.expect)(presets_1.MINIMAL_PERMISSIONS.coreTools.write).toBe(false);
        (0, vitest_1.expect)(presets_1.MINIMAL_PERMISSIONS.coreTools.edit).toBe(false);
    });
    (0, vitest_1.it)('should have bash disabled', function () {
        (0, vitest_1.expect)(presets_1.MINIMAL_PERMISSIONS.bash.enabled).toBe(false);
    });
    (0, vitest_1.it)('should have no write patterns', function () {
        (0, vitest_1.expect)(presets_1.MINIMAL_PERMISSIONS.fileSystem.writePatterns).toHaveLength(0);
    });
    (0, vitest_1.it)('should have network disabled', function () {
        (0, vitest_1.expect)(presets_1.MINIMAL_PERMISSIONS.network.enabled).toBe(false);
    });
    (0, vitest_1.it)('should only allow haiku model', function () {
        (0, vitest_1.expect)(presets_1.MINIMAL_PERMISSIONS.models.allowed).toEqual(['haiku']);
    });
    (0, vitest_1.it)('should have highest security (deny all MCP)', function () {
        (0, vitest_1.expect)(presets_1.MINIMAL_PERMISSIONS.mcpTools.denied).toContain('*');
    });
    (0, vitest_1.it)('should have comprehensive file deny patterns', function () {
        (0, vitest_1.expect)(presets_1.MINIMAL_PERMISSIONS.fileSystem.denyPatterns).toContain('**/.env*');
        (0, vitest_1.expect)(presets_1.MINIMAL_PERMISSIONS.fileSystem.denyPatterns).toContain('**/secrets/**');
        (0, vitest_1.expect)(presets_1.MINIMAL_PERMISSIONS.fileSystem.denyPatterns).toContain('**/*.pem');
    });
});
// =============================================================================
// READ_ONLY_PERMISSIONS Tests
// =============================================================================
(0, vitest_1.describe)('READ_ONLY_PERMISSIONS', function () {
    (0, vitest_1.it)('should have read enabled but write/edit disabled', function () {
        (0, vitest_1.expect)(presets_1.READ_ONLY_PERMISSIONS.coreTools.read).toBe(true);
        (0, vitest_1.expect)(presets_1.READ_ONLY_PERMISSIONS.coreTools.write).toBe(false);
        (0, vitest_1.expect)(presets_1.READ_ONLY_PERMISSIONS.coreTools.edit).toBe(false);
    });
    (0, vitest_1.it)('should have bash enabled with sandbox', function () {
        (0, vitest_1.expect)(presets_1.READ_ONLY_PERMISSIONS.bash.enabled).toBe(true);
        (0, vitest_1.expect)(presets_1.READ_ONLY_PERMISSIONS.bash.sandboxed).toBe(true);
    });
    (0, vitest_1.it)('should have read-only bash commands', function () {
        var allowed = presets_1.READ_ONLY_PERMISSIONS.bash.allowedPatterns;
        (0, vitest_1.expect)(allowed.some(function (p) { return p.includes('ls'); })).toBe(true);
        (0, vitest_1.expect)(allowed.some(function (p) { return p.includes('cat'); })).toBe(true);
        (0, vitest_1.expect)(allowed.some(function (p) { return p.includes('git'); })).toBe(true);
    });
    (0, vitest_1.it)('should deny dangerous bash commands', function () {
        var denied = presets_1.READ_ONLY_PERMISSIONS.bash.deniedPatterns;
        (0, vitest_1.expect)(denied.some(function (p) { return p.includes('rm'); })).toBe(true);
        (0, vitest_1.expect)(denied.some(function (p) { return p.includes('sudo'); })).toBe(true);
    });
    (0, vitest_1.it)('should have file read patterns but no write patterns', function () {
        (0, vitest_1.expect)(presets_1.READ_ONLY_PERMISSIONS.fileSystem.readPatterns).toContain('**/*');
        (0, vitest_1.expect)(presets_1.READ_ONLY_PERMISSIONS.fileSystem.writePatterns).toHaveLength(0);
    });
    (0, vitest_1.it)('should have limited MCP access', function () {
        (0, vitest_1.expect)(presets_1.READ_ONLY_PERMISSIONS.mcpTools.allowed).toContain('octocode:*');
        (0, vitest_1.expect)(presets_1.READ_ONLY_PERMISSIONS.mcpTools.allowed).toContain('Context7:*');
    });
    (0, vitest_1.it)('should have network enabled with domain restrictions', function () {
        (0, vitest_1.expect)(presets_1.READ_ONLY_PERMISSIONS.network.enabled).toBe(true);
        (0, vitest_1.expect)(presets_1.READ_ONLY_PERMISSIONS.network.allowedDomains.length).toBeGreaterThan(0);
    });
});
// =============================================================================
// STANDARD_PERMISSIONS Tests
// =============================================================================
(0, vitest_1.describe)('STANDARD_PERMISSIONS', function () {
    (0, vitest_1.it)('should have all core tools enabled', function () {
        (0, vitest_1.expect)(presets_1.STANDARD_PERMISSIONS.coreTools.read).toBe(true);
        (0, vitest_1.expect)(presets_1.STANDARD_PERMISSIONS.coreTools.write).toBe(true);
        (0, vitest_1.expect)(presets_1.STANDARD_PERMISSIONS.coreTools.edit).toBe(true);
        (0, vitest_1.expect)(presets_1.STANDARD_PERMISSIONS.coreTools.task).toBe(true);
    });
    (0, vitest_1.it)('should have bash enabled without sandbox', function () {
        (0, vitest_1.expect)(presets_1.STANDARD_PERMISSIONS.bash.enabled).toBe(true);
        (0, vitest_1.expect)(presets_1.STANDARD_PERMISSIONS.bash.sandboxed).toBe(false);
    });
    (0, vitest_1.it)('should have comprehensive bash commands', function () {
        var allowed = presets_1.STANDARD_PERMISSIONS.bash.allowedPatterns;
        (0, vitest_1.expect)(allowed.some(function (p) { return p.includes('npm'); })).toBe(true);
        (0, vitest_1.expect)(allowed.some(function (p) { return p.includes('git'); })).toBe(true);
        (0, vitest_1.expect)(allowed.some(function (p) { return p.includes('python'); })).toBe(true);
    });
    (0, vitest_1.it)('should deny dangerous commands', function () {
        var denied = presets_1.STANDARD_PERMISSIONS.bash.deniedPatterns;
        (0, vitest_1.expect)(denied.some(function (p) { return p.includes('sudo'); })).toBe(true);
        (0, vitest_1.expect)(denied.some(function (p) { return p.includes('rm') && p.includes('rf'); })).toBe(true);
    });
    (0, vitest_1.it)('should have limited write patterns', function () {
        (0, vitest_1.expect)(presets_1.STANDARD_PERMISSIONS.fileSystem.writePatterns).toContain('src/**/*');
        (0, vitest_1.expect)(presets_1.STANDARD_PERMISSIONS.fileSystem.writePatterns).toContain('*.ts');
    });
    (0, vitest_1.it)('should deny sensitive file patterns', function () {
        (0, vitest_1.expect)(presets_1.STANDARD_PERMISSIONS.fileSystem.denyPatterns).toContain('**/.env*');
        (0, vitest_1.expect)(presets_1.STANDARD_PERMISSIONS.fileSystem.denyPatterns).toContain('.git/**');
    });
    (0, vitest_1.it)('should allow all MCP tools', function () {
        (0, vitest_1.expect)(presets_1.STANDARD_PERMISSIONS.mcpTools.allowed).toContain('*');
    });
    (0, vitest_1.it)('should allow all models', function () {
        (0, vitest_1.expect)(presets_1.STANDARD_PERMISSIONS.models.allowed).toContain('haiku');
        (0, vitest_1.expect)(presets_1.STANDARD_PERMISSIONS.models.allowed).toContain('sonnet');
        (0, vitest_1.expect)(presets_1.STANDARD_PERMISSIONS.models.allowed).toContain('opus');
    });
});
// =============================================================================
// FULL_PERMISSIONS Tests
// =============================================================================
(0, vitest_1.describe)('FULL_PERMISSIONS', function () {
    (0, vitest_1.it)('should have all core tools enabled', function () {
        var tools = Object.values(presets_1.FULL_PERMISSIONS.coreTools);
        (0, vitest_1.expect)(tools.every(function (v) { return v === true; })).toBe(true);
    });
    (0, vitest_1.it)('should have unrestricted bash', function () {
        (0, vitest_1.expect)(presets_1.FULL_PERMISSIONS.bash.enabled).toBe(true);
        (0, vitest_1.expect)(presets_1.FULL_PERMISSIONS.bash.sandboxed).toBe(false);
        (0, vitest_1.expect)(presets_1.FULL_PERMISSIONS.bash.allowedPatterns).toContain('.*');
        (0, vitest_1.expect)(presets_1.FULL_PERMISSIONS.bash.deniedPatterns).toHaveLength(0);
    });
    (0, vitest_1.it)('should have unrestricted file access', function () {
        (0, vitest_1.expect)(presets_1.FULL_PERMISSIONS.fileSystem.readPatterns).toContain('**/*');
        (0, vitest_1.expect)(presets_1.FULL_PERMISSIONS.fileSystem.writePatterns).toContain('**/*');
        (0, vitest_1.expect)(presets_1.FULL_PERMISSIONS.fileSystem.denyPatterns).toHaveLength(0);
    });
    (0, vitest_1.it)('should have generous file size limits', function () {
        (0, vitest_1.expect)(presets_1.FULL_PERMISSIONS.fileSystem.maxReadSizeBytes).toBe(100 * 1024 * 1024);
        (0, vitest_1.expect)(presets_1.FULL_PERMISSIONS.fileSystem.maxWriteSizeBytes).toBe(50 * 1024 * 1024);
    });
    (0, vitest_1.it)('should allow all network protocols', function () {
        (0, vitest_1.expect)(presets_1.FULL_PERMISSIONS.network.allowedProtocols).toContain('http');
        (0, vitest_1.expect)(presets_1.FULL_PERMISSIONS.network.allowedProtocols).toContain('https');
        (0, vitest_1.expect)(presets_1.FULL_PERMISSIONS.network.allowedProtocols).toContain('ws');
        (0, vitest_1.expect)(presets_1.FULL_PERMISSIONS.network.allowedProtocols).toContain('wss');
    });
    (0, vitest_1.it)('should prefer opus model for spawning', function () {
        (0, vitest_1.expect)(presets_1.FULL_PERMISSIONS.models.preferredForSpawning).toBe('opus');
    });
});
// =============================================================================
// CI_CD_PERMISSIONS Tests
// =============================================================================
(0, vitest_1.describe)('CI_CD_PERMISSIONS', function () {
    (0, vitest_1.it)('should have web search disabled for CI', function () {
        (0, vitest_1.expect)(presets_1.CI_CD_PERMISSIONS.coreTools.webSearch).toBe(false);
        (0, vitest_1.expect)(presets_1.CI_CD_PERMISSIONS.coreTools.todoWrite).toBe(false);
    });
    (0, vitest_1.it)('should have CI-appropriate bash commands', function () {
        var allowed = presets_1.CI_CD_PERMISSIONS.bash.allowedPatterns;
        (0, vitest_1.expect)(allowed.some(function (p) { return p.includes('npm'); })).toBe(true);
        (0, vitest_1.expect)(allowed.some(function (p) { return p.includes('docker'); })).toBe(true);
        (0, vitest_1.expect)(allowed.some(function (p) { return p.includes('terraform'); })).toBe(true);
        (0, vitest_1.expect)(allowed.some(function (p) { return p.includes('aws'); })).toBe(true);
    });
    (0, vitest_1.it)('should have CI-appropriate write patterns', function () {
        (0, vitest_1.expect)(presets_1.CI_CD_PERMISSIONS.fileSystem.writePatterns).toContain('dist/**/*');
        (0, vitest_1.expect)(presets_1.CI_CD_PERMISSIONS.fileSystem.writePatterns).toContain('build/**/*');
        (0, vitest_1.expect)(presets_1.CI_CD_PERMISSIONS.fileSystem.writePatterns).toContain('coverage/**/*');
    });
    (0, vitest_1.it)('should have CI-specific domain restrictions', function () {
        (0, vitest_1.expect)(presets_1.CI_CD_PERMISSIONS.network.allowedDomains).toContain('github.com');
        (0, vitest_1.expect)(presets_1.CI_CD_PERMISSIONS.network.allowedDomains).toContain('registry.npmjs.org');
        (0, vitest_1.expect)(presets_1.CI_CD_PERMISSIONS.network.allowedDomains.some(function (d) { return d.includes('docker'); })).toBe(true);
    });
    (0, vitest_1.it)('should deny expensive tools for CI', function () {
        (0, vitest_1.expect)(presets_1.CI_CD_PERMISSIONS.mcpTools.denied).toContain('ElevenLabs:*');
        (0, vitest_1.expect)(presets_1.CI_CD_PERMISSIONS.mcpTools.denied).toContain('stability-ai:*');
    });
    (0, vitest_1.it)('should use cost-effective model for spawning', function () {
        (0, vitest_1.expect)(presets_1.CI_CD_PERMISSIONS.models.preferredForSpawning).toBe('haiku');
        (0, vitest_1.expect)(presets_1.CI_CD_PERMISSIONS.models.allowEscalation).toBe(false);
    });
});
// =============================================================================
// RESEARCH_PERMISSIONS Tests
// =============================================================================
(0, vitest_1.describe)('RESEARCH_PERMISSIONS', function () {
    (0, vitest_1.it)('should have read but not write/edit', function () {
        (0, vitest_1.expect)(presets_1.RESEARCH_PERMISSIONS.coreTools.read).toBe(true);
        (0, vitest_1.expect)(presets_1.RESEARCH_PERMISSIONS.coreTools.write).toBe(false);
        (0, vitest_1.expect)(presets_1.RESEARCH_PERMISSIONS.coreTools.edit).toBe(false);
    });
    (0, vitest_1.it)('should have sandbox enabled', function () {
        (0, vitest_1.expect)(presets_1.RESEARCH_PERMISSIONS.bash.sandboxed).toBe(true);
    });
    (0, vitest_1.it)('should allow research-appropriate commands', function () {
        var allowed = presets_1.RESEARCH_PERMISSIONS.bash.allowedPatterns;
        (0, vitest_1.expect)(allowed.some(function (p) { return p.includes('curl'); })).toBe(true);
        (0, vitest_1.expect)(allowed.some(function (p) { return p.includes('wget'); })).toBe(true);
        (0, vitest_1.expect)(allowed.some(function (p) { return p.includes('jq'); })).toBe(true);
    });
    (0, vitest_1.it)('should allow writing to research directories', function () {
        (0, vitest_1.expect)(presets_1.RESEARCH_PERMISSIONS.fileSystem.writePatterns).toContain('research/**/*');
        (0, vitest_1.expect)(presets_1.RESEARCH_PERMISSIONS.fileSystem.writePatterns).toContain('notes/**/*');
        (0, vitest_1.expect)(presets_1.RESEARCH_PERMISSIONS.fileSystem.writePatterns).toContain('analysis/**/*');
    });
    (0, vitest_1.it)('should allow research MCP tools', function () {
        (0, vitest_1.expect)(presets_1.RESEARCH_PERMISSIONS.mcpTools.allowed).toContain('firecrawl:*');
        (0, vitest_1.expect)(presets_1.RESEARCH_PERMISSIONS.mcpTools.allowed).toContain('hf-mcp-server:*');
    });
    (0, vitest_1.it)('should have unrestricted network domains', function () {
        (0, vitest_1.expect)(presets_1.RESEARCH_PERMISSIONS.network.allowedDomains).toHaveLength(0);
        (0, vitest_1.expect)(presets_1.RESEARCH_PERMISSIONS.network.enabled).toBe(true);
    });
});
// =============================================================================
// CODE_GENERATION_PERMISSIONS Tests
// =============================================================================
(0, vitest_1.describe)('CODE_GENERATION_PERMISSIONS', function () {
    (0, vitest_1.it)('should have all core tools enabled', function () {
        (0, vitest_1.expect)(presets_1.CODE_GENERATION_PERMISSIONS.coreTools.write).toBe(true);
        (0, vitest_1.expect)(presets_1.CODE_GENERATION_PERMISSIONS.coreTools.edit).toBe(true);
        (0, vitest_1.expect)(presets_1.CODE_GENERATION_PERMISSIONS.coreTools.notebookEdit).toBe(true);
    });
    (0, vitest_1.it)('should allow dev tool commands', function () {
        var allowed = presets_1.CODE_GENERATION_PERMISSIONS.bash.allowedPatterns;
        (0, vitest_1.expect)(allowed.some(function (p) { return p.includes('tsc'); })).toBe(true);
        (0, vitest_1.expect)(allowed.some(function (p) { return p.includes('eslint'); })).toBe(true);
        (0, vitest_1.expect)(allowed.some(function (p) { return p.includes('jest'); })).toBe(true);
        (0, vitest_1.expect)(allowed.some(function (p) { return p.includes('vitest'); })).toBe(true);
    });
    (0, vitest_1.it)('should allow code file write patterns', function () {
        (0, vitest_1.expect)(presets_1.CODE_GENERATION_PERMISSIONS.fileSystem.writePatterns).toContain('*.ts');
        (0, vitest_1.expect)(presets_1.CODE_GENERATION_PERMISSIONS.fileSystem.writePatterns).toContain('*.tsx');
        (0, vitest_1.expect)(presets_1.CODE_GENERATION_PERMISSIONS.fileSystem.writePatterns).toContain('*.py');
    });
    (0, vitest_1.it)('should deny node_modules writes', function () {
        (0, vitest_1.expect)(presets_1.CODE_GENERATION_PERMISSIONS.fileSystem.denyPatterns).toContain('node_modules/**');
    });
    (0, vitest_1.it)('should deny curl piping to shell', function () {
        var denied = presets_1.CODE_GENERATION_PERMISSIONS.bash.deniedPatterns;
        (0, vitest_1.expect)(denied.some(function (p) { return p.includes('curl') && p.includes('sh|bash'); })).toBe(true);
    });
});
// =============================================================================
// getPreset() Tests
// =============================================================================
(0, vitest_1.describe)('getPreset()', function () {
    var presetNames = [
        'minimal',
        'read-only',
        'standard',
        'full',
        'ci-cd',
        'research',
        'code-generation',
    ];
    var _loop_2 = function (name_2) {
        (0, vitest_1.it)("should return preset for '".concat(name_2, "'"), function () {
            var preset = (0, presets_1.getPreset)(name_2);
            (0, vitest_1.expect)(preset).toBeDefined();
            (0, vitest_1.expect)(preset.coreTools).toBeDefined();
            (0, vitest_1.expect)(preset.bash).toBeDefined();
            (0, vitest_1.expect)(preset.fileSystem).toBeDefined();
        });
    };
    for (var _i = 0, presetNames_1 = presetNames; _i < presetNames_1.length; _i++) {
        var name_2 = presetNames_1[_i];
        _loop_2(name_2);
    }
    (0, vitest_1.it)('should return a copy, not the original', function () {
        var preset1 = (0, presets_1.getPreset)('standard');
        var preset2 = (0, presets_1.getPreset)('standard');
        (0, vitest_1.expect)(preset1).not.toBe(preset2);
        (0, vitest_1.expect)(preset1).toEqual(preset2);
    });
    (0, vitest_1.it)('should throw error for unknown preset', function () {
        (0, vitest_1.expect)(function () { return (0, presets_1.getPreset)('unknown'); }).toThrow('Unknown preset');
    });
    (0, vitest_1.it)('should include available presets in error message', function () {
        (0, vitest_1.expect)(function () { return (0, presets_1.getPreset)('invalid'); }).toThrow('Available:');
    });
});
// =============================================================================
// getRecommendedPreset() Tests
// =============================================================================
(0, vitest_1.describe)('getRecommendedPreset()', function () {
    var expectations = [
        { taskType: 'analysis', expected: 'read-only' },
        { taskType: 'research', expected: 'research' },
        { taskType: 'refactoring', expected: 'code-generation' },
        { taskType: 'new-feature', expected: 'standard' },
        { taskType: 'bug-fix', expected: 'standard' },
        { taskType: 'testing', expected: 'code-generation' },
        { taskType: 'documentation', expected: 'read-only' },
        { taskType: 'deployment', expected: 'ci-cd' },
        { taskType: 'exploration', expected: 'research' },
    ];
    var _loop_3 = function (taskType, expected) {
        (0, vitest_1.it)("should recommend '".concat(expected, "' for '").concat(taskType, "'"), function () {
            (0, vitest_1.expect)((0, presets_1.getRecommendedPreset)(taskType)).toBe(expected);
        });
    };
    for (var _i = 0, expectations_1 = expectations; _i < expectations_1.length; _i++) {
        var _a = expectations_1[_i], taskType = _a.taskType, expected = _a.expected;
        _loop_3(taskType, expected);
    }
    (0, vitest_1.it)('should return standard for unknown task type', function () {
        (0, vitest_1.expect)((0, presets_1.getRecommendedPreset)('unknown')).toBe('standard');
    });
});
// =============================================================================
// getIsolationLevel() Tests
// =============================================================================
(0, vitest_1.describe)('getIsolationLevel()', function () {
    var expectations = [
        { preset: 'minimal', expected: 'strict' },
        { preset: 'read-only', expected: 'strict' },
        { preset: 'standard', expected: 'moderate' },
        { preset: 'full', expected: 'permissive' },
        { preset: 'ci-cd', expected: 'moderate' },
        { preset: 'research', expected: 'moderate' },
        { preset: 'code-generation', expected: 'moderate' },
    ];
    var _loop_4 = function (preset, expected) {
        (0, vitest_1.it)("should return '".concat(expected, "' for '").concat(preset, "'"), function () {
            (0, vitest_1.expect)((0, presets_1.getIsolationLevel)(preset)).toBe(expected);
        });
    };
    for (var _i = 0, expectations_2 = expectations; _i < expectations_2.length; _i++) {
        var _a = expectations_2[_i], preset = _a.preset, expected = _a.expected;
        _loop_4(preset, expected);
    }
    (0, vitest_1.it)('should return moderate for unknown preset', function () {
        (0, vitest_1.expect)((0, presets_1.getIsolationLevel)('unknown')).toBe('moderate');
    });
});
// =============================================================================
// createCustomPreset() Tests
// =============================================================================
(0, vitest_1.describe)('createCustomPreset()', function () {
    (0, vitest_1.it)('should create preset based on base with overrides', function () {
        var custom = (0, presets_1.createCustomPreset)('standard', {
            coreTools: { write: false },
        });
        (0, vitest_1.expect)(custom.coreTools.write).toBe(false);
        (0, vitest_1.expect)(custom.coreTools.read).toBe(true); // From base
    });
    (0, vitest_1.it)('should deep merge nested objects', function () {
        var custom = (0, presets_1.createCustomPreset)('standard', {
            bash: { maxExecutionTimeMs: 60000 },
        });
        (0, vitest_1.expect)(custom.bash.maxExecutionTimeMs).toBe(60000);
        (0, vitest_1.expect)(custom.bash.enabled).toBe(true); // From base
    });
    (0, vitest_1.it)('should override array values completely', function () {
        var custom = (0, presets_1.createCustomPreset)('standard', {
            fileSystem: { readPatterns: ['src/**/*'] },
        });
        (0, vitest_1.expect)(custom.fileSystem.readPatterns).toEqual(['src/**/*']);
    });
    (0, vitest_1.it)('should preserve base values not in overrides', function () {
        var custom = (0, presets_1.createCustomPreset)('minimal', {
            models: { preferredForSpawning: 'sonnet' },
        });
        (0, vitest_1.expect)(custom.models.preferredForSpawning).toBe('sonnet');
        (0, vitest_1.expect)(custom.models.allowed).toEqual(['haiku']); // From base
    });
    (0, vitest_1.it)('should handle empty overrides', function () {
        var custom = (0, presets_1.createCustomPreset)('standard', {});
        (0, vitest_1.expect)(custom).toEqual(presets_1.STANDARD_PERMISSIONS);
    });
    (0, vitest_1.it)('should create valid permission matrix', function () {
        var custom = (0, presets_1.createCustomPreset)('standard', {
            bash: { sandboxed: true },
        });
        var validator = new validator_1.PermissionValidator();
        var result = validator.validate(custom);
        (0, vitest_1.expect)(result.valid).toBe(true);
    });
});
// =============================================================================
// listPresets() Tests
// =============================================================================
(0, vitest_1.describe)('listPresets()', function () {
    (0, vitest_1.it)('should return array of preset descriptions', function () {
        var presets = (0, presets_1.listPresets)();
        (0, vitest_1.expect)(Array.isArray(presets)).toBe(true);
        (0, vitest_1.expect)(presets.length).toBe(7);
    });
    (0, vitest_1.it)('should include all preset names', function () {
        var presets = (0, presets_1.listPresets)();
        var names = presets.map(function (p) { return p.name; });
        (0, vitest_1.expect)(names).toContain('minimal');
        (0, vitest_1.expect)(names).toContain('read-only');
        (0, vitest_1.expect)(names).toContain('standard');
        (0, vitest_1.expect)(names).toContain('full');
        (0, vitest_1.expect)(names).toContain('ci-cd');
        (0, vitest_1.expect)(names).toContain('research');
        (0, vitest_1.expect)(names).toContain('code-generation');
    });
    (0, vitest_1.it)('should have description for each preset', function () {
        var presets = (0, presets_1.listPresets)();
        for (var _i = 0, presets_3 = presets; _i < presets_3.length; _i++) {
            var preset = presets_3[_i];
            (0, vitest_1.expect)(typeof preset.description).toBe('string');
            (0, vitest_1.expect)(preset.description.length).toBeGreaterThan(0);
        }
    });
    (0, vitest_1.it)('should have security level for each preset', function () {
        var presets = (0, presets_1.listPresets)();
        for (var _i = 0, presets_4 = presets; _i < presets_4.length; _i++) {
            var preset = presets_4[_i];
            (0, vitest_1.expect)(typeof preset.securityLevel).toBe('string');
            (0, vitest_1.expect)(preset.securityLevel.length).toBeGreaterThan(0);
        }
    });
    (0, vitest_1.it)('should have correct structure', function () {
        var presets = (0, presets_1.listPresets)();
        for (var _i = 0, presets_5 = presets; _i < presets_5.length; _i++) {
            var preset = presets_5[_i];
            (0, vitest_1.expect)(preset).toHaveProperty('name');
            (0, vitest_1.expect)(preset).toHaveProperty('description');
            (0, vitest_1.expect)(preset).toHaveProperty('securityLevel');
        }
    });
});
// =============================================================================
// Inheritance Chain Tests
// =============================================================================
(0, vitest_1.describe)('Inheritance Chain', function () {
    var validator = new validator_1.PermissionValidator();
    (0, vitest_1.it)('should allow full -> standard inheritance', function () {
        (0, vitest_1.expect)(validator.canInherit(presets_1.FULL_PERMISSIONS, presets_1.STANDARD_PERMISSIONS)).toBe(true);
    });
    (0, vitest_1.it)('should not allow standard -> read-only inheritance (domain mismatch)', function () {
        // STANDARD has empty allowedDomains (unrestricted) but READ_ONLY has specific domains
        // The validator treats empty as "no explicitly allowed domains" not "all domains allowed"
        // So child's specific domains fail the subset check
        (0, vitest_1.expect)(validator.canInherit(presets_1.STANDARD_PERMISSIONS, presets_1.READ_ONLY_PERMISSIONS)).toBe(false);
    });
    (0, vitest_1.it)('should allow read-only -> minimal inheritance', function () {
        (0, vitest_1.expect)(validator.canInherit(presets_1.READ_ONLY_PERMISSIONS, presets_1.MINIMAL_PERMISSIONS)).toBe(true);
    });
    (0, vitest_1.it)('should not allow minimal -> standard inheritance', function () {
        (0, vitest_1.expect)(validator.canInherit(presets_1.MINIMAL_PERMISSIONS, presets_1.STANDARD_PERMISSIONS)).toBe(false);
    });
    (0, vitest_1.it)('should not allow full -> ci-cd inheritance (domain mismatch)', function () {
        // FULL has empty allowedDomains but CI_CD has specific domains
        // Same issue as standard -> read-only
        (0, vitest_1.expect)(validator.canInherit(presets_1.FULL_PERMISSIONS, presets_1.CI_CD_PERMISSIONS)).toBe(false);
    });
    (0, vitest_1.it)('should allow full -> research inheritance', function () {
        (0, vitest_1.expect)(validator.canInherit(presets_1.FULL_PERMISSIONS, presets_1.RESEARCH_PERMISSIONS)).toBe(true);
    });
    (0, vitest_1.it)('should allow full -> code-generation inheritance', function () {
        (0, vitest_1.expect)(validator.canInherit(presets_1.FULL_PERMISSIONS, presets_1.CODE_GENERATION_PERMISSIONS)).toBe(true);
    });
});
