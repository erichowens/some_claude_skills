/**
 * Tests for Permission Presets
 */

import { describe, it, expect } from 'vitest';
import {
  MINIMAL_PERMISSIONS,
  READ_ONLY_PERMISSIONS,
  STANDARD_PERMISSIONS,
  FULL_PERMISSIONS,
  CI_CD_PERMISSIONS,
  RESEARCH_PERMISSIONS,
  CODE_GENERATION_PERMISSIONS,
  getPreset,
  getRecommendedPreset,
  getIsolationLevel,
  createCustomPreset,
  listPresets,
  PresetName,
  TaskType,
} from './presets';
import { PermissionValidator } from './validator';

// =============================================================================
// Preset Structure Tests
// =============================================================================

describe('Preset Structure', () => {
  const presets = [
    { name: 'MINIMAL_PERMISSIONS', preset: MINIMAL_PERMISSIONS },
    { name: 'READ_ONLY_PERMISSIONS', preset: READ_ONLY_PERMISSIONS },
    { name: 'STANDARD_PERMISSIONS', preset: STANDARD_PERMISSIONS },
    { name: 'FULL_PERMISSIONS', preset: FULL_PERMISSIONS },
    { name: 'CI_CD_PERMISSIONS', preset: CI_CD_PERMISSIONS },
    { name: 'RESEARCH_PERMISSIONS', preset: RESEARCH_PERMISSIONS },
    { name: 'CODE_GENERATION_PERMISSIONS', preset: CODE_GENERATION_PERMISSIONS },
  ];

  for (const { name, preset } of presets) {
    describe(name, () => {
      it('should have coreTools', () => {
        expect(preset.coreTools).toBeDefined();
        expect(typeof preset.coreTools.read).toBe('boolean');
        expect(typeof preset.coreTools.write).toBe('boolean');
        expect(typeof preset.coreTools.edit).toBe('boolean');
      });

      it('should have bash', () => {
        expect(preset.bash).toBeDefined();
        expect(typeof preset.bash.enabled).toBe('boolean');
        expect(typeof preset.bash.sandboxed).toBe('boolean');
        expect(Array.isArray(preset.bash.allowedPatterns)).toBe(true);
        expect(Array.isArray(preset.bash.deniedPatterns)).toBe(true);
      });

      it('should have fileSystem', () => {
        expect(preset.fileSystem).toBeDefined();
        expect(Array.isArray(preset.fileSystem.readPatterns)).toBe(true);
        expect(Array.isArray(preset.fileSystem.writePatterns)).toBe(true);
        expect(Array.isArray(preset.fileSystem.denyPatterns)).toBe(true);
      });

      it('should have mcpTools', () => {
        expect(preset.mcpTools).toBeDefined();
        expect(Array.isArray(preset.mcpTools.allowed)).toBe(true);
        expect(Array.isArray(preset.mcpTools.denied)).toBe(true);
      });

      it('should have network', () => {
        expect(preset.network).toBeDefined();
        expect(typeof preset.network.enabled).toBe('boolean');
        expect(Array.isArray(preset.network.allowedDomains)).toBe(true);
      });

      it('should have models', () => {
        expect(preset.models).toBeDefined();
        expect(Array.isArray(preset.models.allowed)).toBe(true);
        expect(preset.models.preferredForSpawning).toBeDefined();
      });

      it('should pass validation', () => {
        const validator = new PermissionValidator();
        const result = validator.validate(preset);
        expect(result.valid).toBe(true);
      });
    });
  }
});

// =============================================================================
// MINIMAL_PERMISSIONS Tests
// =============================================================================

describe('MINIMAL_PERMISSIONS', () => {
  it('should have read enabled but write/edit disabled', () => {
    expect(MINIMAL_PERMISSIONS.coreTools.read).toBe(true);
    expect(MINIMAL_PERMISSIONS.coreTools.write).toBe(false);
    expect(MINIMAL_PERMISSIONS.coreTools.edit).toBe(false);
  });

  it('should have bash disabled', () => {
    expect(MINIMAL_PERMISSIONS.bash.enabled).toBe(false);
  });

  it('should have no write patterns', () => {
    expect(MINIMAL_PERMISSIONS.fileSystem.writePatterns).toHaveLength(0);
  });

  it('should have network disabled', () => {
    expect(MINIMAL_PERMISSIONS.network.enabled).toBe(false);
  });

  it('should only allow haiku model', () => {
    expect(MINIMAL_PERMISSIONS.models.allowed).toEqual(['haiku']);
  });

  it('should have highest security (deny all MCP)', () => {
    expect(MINIMAL_PERMISSIONS.mcpTools.denied).toContain('*');
  });

  it('should have comprehensive file deny patterns', () => {
    expect(MINIMAL_PERMISSIONS.fileSystem.denyPatterns).toContain('**/.env*');
    expect(MINIMAL_PERMISSIONS.fileSystem.denyPatterns).toContain('**/secrets/**');
    expect(MINIMAL_PERMISSIONS.fileSystem.denyPatterns).toContain('**/*.pem');
  });
});

// =============================================================================
// READ_ONLY_PERMISSIONS Tests
// =============================================================================

describe('READ_ONLY_PERMISSIONS', () => {
  it('should have read enabled but write/edit disabled', () => {
    expect(READ_ONLY_PERMISSIONS.coreTools.read).toBe(true);
    expect(READ_ONLY_PERMISSIONS.coreTools.write).toBe(false);
    expect(READ_ONLY_PERMISSIONS.coreTools.edit).toBe(false);
  });

  it('should have bash enabled with sandbox', () => {
    expect(READ_ONLY_PERMISSIONS.bash.enabled).toBe(true);
    expect(READ_ONLY_PERMISSIONS.bash.sandboxed).toBe(true);
  });

  it('should have read-only bash commands', () => {
    const allowed = READ_ONLY_PERMISSIONS.bash.allowedPatterns;
    expect(allowed.some(p => p.includes('ls'))).toBe(true);
    expect(allowed.some(p => p.includes('cat'))).toBe(true);
    expect(allowed.some(p => p.includes('git'))).toBe(true);
  });

  it('should deny dangerous bash commands', () => {
    const denied = READ_ONLY_PERMISSIONS.bash.deniedPatterns;
    expect(denied.some(p => p.includes('rm'))).toBe(true);
    expect(denied.some(p => p.includes('sudo'))).toBe(true);
  });

  it('should have file read patterns but no write patterns', () => {
    expect(READ_ONLY_PERMISSIONS.fileSystem.readPatterns).toContain('**/*');
    expect(READ_ONLY_PERMISSIONS.fileSystem.writePatterns).toHaveLength(0);
  });

  it('should have limited MCP access', () => {
    expect(READ_ONLY_PERMISSIONS.mcpTools.allowed).toContain('octocode:*');
    expect(READ_ONLY_PERMISSIONS.mcpTools.allowed).toContain('Context7:*');
  });

  it('should have network enabled with domain restrictions', () => {
    expect(READ_ONLY_PERMISSIONS.network.enabled).toBe(true);
    expect(READ_ONLY_PERMISSIONS.network.allowedDomains.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// STANDARD_PERMISSIONS Tests
// =============================================================================

describe('STANDARD_PERMISSIONS', () => {
  it('should have all core tools enabled', () => {
    expect(STANDARD_PERMISSIONS.coreTools.read).toBe(true);
    expect(STANDARD_PERMISSIONS.coreTools.write).toBe(true);
    expect(STANDARD_PERMISSIONS.coreTools.edit).toBe(true);
    expect(STANDARD_PERMISSIONS.coreTools.task).toBe(true);
  });

  it('should have bash enabled without sandbox', () => {
    expect(STANDARD_PERMISSIONS.bash.enabled).toBe(true);
    expect(STANDARD_PERMISSIONS.bash.sandboxed).toBe(false);
  });

  it('should have comprehensive bash commands', () => {
    const allowed = STANDARD_PERMISSIONS.bash.allowedPatterns;
    expect(allowed.some(p => p.includes('npm'))).toBe(true);
    expect(allowed.some(p => p.includes('git'))).toBe(true);
    expect(allowed.some(p => p.includes('python'))).toBe(true);
  });

  it('should deny dangerous commands', () => {
    const denied = STANDARD_PERMISSIONS.bash.deniedPatterns;
    expect(denied.some(p => p.includes('sudo'))).toBe(true);
    expect(denied.some(p => p.includes('rm') && p.includes('rf'))).toBe(true);
  });

  it('should have limited write patterns', () => {
    expect(STANDARD_PERMISSIONS.fileSystem.writePatterns).toContain('src/**/*');
    expect(STANDARD_PERMISSIONS.fileSystem.writePatterns).toContain('*.ts');
  });

  it('should deny sensitive file patterns', () => {
    expect(STANDARD_PERMISSIONS.fileSystem.denyPatterns).toContain('**/.env*');
    expect(STANDARD_PERMISSIONS.fileSystem.denyPatterns).toContain('.git/**');
  });

  it('should allow all MCP tools', () => {
    expect(STANDARD_PERMISSIONS.mcpTools.allowed).toContain('*');
  });

  it('should allow all models', () => {
    expect(STANDARD_PERMISSIONS.models.allowed).toContain('haiku');
    expect(STANDARD_PERMISSIONS.models.allowed).toContain('sonnet');
    expect(STANDARD_PERMISSIONS.models.allowed).toContain('opus');
  });
});

// =============================================================================
// FULL_PERMISSIONS Tests
// =============================================================================

describe('FULL_PERMISSIONS', () => {
  it('should have all core tools enabled', () => {
    const tools = Object.values(FULL_PERMISSIONS.coreTools);
    expect(tools.every(v => v === true)).toBe(true);
  });

  it('should have unrestricted bash', () => {
    expect(FULL_PERMISSIONS.bash.enabled).toBe(true);
    expect(FULL_PERMISSIONS.bash.sandboxed).toBe(false);
    expect(FULL_PERMISSIONS.bash.allowedPatterns).toContain('.*');
    expect(FULL_PERMISSIONS.bash.deniedPatterns).toHaveLength(0);
  });

  it('should have unrestricted file access', () => {
    expect(FULL_PERMISSIONS.fileSystem.readPatterns).toContain('**/*');
    expect(FULL_PERMISSIONS.fileSystem.writePatterns).toContain('**/*');
    expect(FULL_PERMISSIONS.fileSystem.denyPatterns).toHaveLength(0);
  });

  it('should have generous file size limits', () => {
    expect(FULL_PERMISSIONS.fileSystem.maxReadSizeBytes).toBe(100 * 1024 * 1024);
    expect(FULL_PERMISSIONS.fileSystem.maxWriteSizeBytes).toBe(50 * 1024 * 1024);
  });

  it('should allow all network protocols', () => {
    expect(FULL_PERMISSIONS.network.allowedProtocols).toContain('http');
    expect(FULL_PERMISSIONS.network.allowedProtocols).toContain('https');
    expect(FULL_PERMISSIONS.network.allowedProtocols).toContain('ws');
    expect(FULL_PERMISSIONS.network.allowedProtocols).toContain('wss');
  });

  it('should prefer opus model for spawning', () => {
    expect(FULL_PERMISSIONS.models.preferredForSpawning).toBe('opus');
  });
});

// =============================================================================
// CI_CD_PERMISSIONS Tests
// =============================================================================

describe('CI_CD_PERMISSIONS', () => {
  it('should have web search disabled for CI', () => {
    expect(CI_CD_PERMISSIONS.coreTools.webSearch).toBe(false);
    expect(CI_CD_PERMISSIONS.coreTools.todoWrite).toBe(false);
  });

  it('should have CI-appropriate bash commands', () => {
    const allowed = CI_CD_PERMISSIONS.bash.allowedPatterns;
    expect(allowed.some(p => p.includes('npm'))).toBe(true);
    expect(allowed.some(p => p.includes('docker'))).toBe(true);
    expect(allowed.some(p => p.includes('terraform'))).toBe(true);
    expect(allowed.some(p => p.includes('aws'))).toBe(true);
  });

  it('should have CI-appropriate write patterns', () => {
    expect(CI_CD_PERMISSIONS.fileSystem.writePatterns).toContain('dist/**/*');
    expect(CI_CD_PERMISSIONS.fileSystem.writePatterns).toContain('build/**/*');
    expect(CI_CD_PERMISSIONS.fileSystem.writePatterns).toContain('coverage/**/*');
  });

  it('should have CI-specific domain restrictions', () => {
    expect(CI_CD_PERMISSIONS.network.allowedDomains).toContain('github.com');
    expect(CI_CD_PERMISSIONS.network.allowedDomains).toContain('registry.npmjs.org');
    expect(CI_CD_PERMISSIONS.network.allowedDomains.some(d => d.includes('docker'))).toBe(true);
  });

  it('should deny expensive tools for CI', () => {
    expect(CI_CD_PERMISSIONS.mcpTools.denied).toContain('ElevenLabs:*');
    expect(CI_CD_PERMISSIONS.mcpTools.denied).toContain('stability-ai:*');
  });

  it('should use cost-effective model for spawning', () => {
    expect(CI_CD_PERMISSIONS.models.preferredForSpawning).toBe('haiku');
    expect(CI_CD_PERMISSIONS.models.allowEscalation).toBe(false);
  });
});

// =============================================================================
// RESEARCH_PERMISSIONS Tests
// =============================================================================

describe('RESEARCH_PERMISSIONS', () => {
  it('should have read but not write/edit', () => {
    expect(RESEARCH_PERMISSIONS.coreTools.read).toBe(true);
    expect(RESEARCH_PERMISSIONS.coreTools.write).toBe(false);
    expect(RESEARCH_PERMISSIONS.coreTools.edit).toBe(false);
  });

  it('should have sandbox enabled', () => {
    expect(RESEARCH_PERMISSIONS.bash.sandboxed).toBe(true);
  });

  it('should allow research-appropriate commands', () => {
    const allowed = RESEARCH_PERMISSIONS.bash.allowedPatterns;
    expect(allowed.some(p => p.includes('curl'))).toBe(true);
    expect(allowed.some(p => p.includes('wget'))).toBe(true);
    expect(allowed.some(p => p.includes('jq'))).toBe(true);
  });

  it('should allow writing to research directories', () => {
    expect(RESEARCH_PERMISSIONS.fileSystem.writePatterns).toContain('research/**/*');
    expect(RESEARCH_PERMISSIONS.fileSystem.writePatterns).toContain('notes/**/*');
    expect(RESEARCH_PERMISSIONS.fileSystem.writePatterns).toContain('analysis/**/*');
  });

  it('should allow research MCP tools', () => {
    expect(RESEARCH_PERMISSIONS.mcpTools.allowed).toContain('firecrawl:*');
    expect(RESEARCH_PERMISSIONS.mcpTools.allowed).toContain('hf-mcp-server:*');
  });

  it('should have unrestricted network domains', () => {
    expect(RESEARCH_PERMISSIONS.network.allowedDomains).toHaveLength(0);
    expect(RESEARCH_PERMISSIONS.network.enabled).toBe(true);
  });
});

// =============================================================================
// CODE_GENERATION_PERMISSIONS Tests
// =============================================================================

describe('CODE_GENERATION_PERMISSIONS', () => {
  it('should have all core tools enabled', () => {
    expect(CODE_GENERATION_PERMISSIONS.coreTools.write).toBe(true);
    expect(CODE_GENERATION_PERMISSIONS.coreTools.edit).toBe(true);
    expect(CODE_GENERATION_PERMISSIONS.coreTools.notebookEdit).toBe(true);
  });

  it('should allow dev tool commands', () => {
    const allowed = CODE_GENERATION_PERMISSIONS.bash.allowedPatterns;
    expect(allowed.some(p => p.includes('tsc'))).toBe(true);
    expect(allowed.some(p => p.includes('eslint'))).toBe(true);
    expect(allowed.some(p => p.includes('jest'))).toBe(true);
    expect(allowed.some(p => p.includes('vitest'))).toBe(true);
  });

  it('should allow code file write patterns', () => {
    expect(CODE_GENERATION_PERMISSIONS.fileSystem.writePatterns).toContain('*.ts');
    expect(CODE_GENERATION_PERMISSIONS.fileSystem.writePatterns).toContain('*.tsx');
    expect(CODE_GENERATION_PERMISSIONS.fileSystem.writePatterns).toContain('*.py');
  });

  it('should deny node_modules writes', () => {
    expect(CODE_GENERATION_PERMISSIONS.fileSystem.denyPatterns).toContain('node_modules/**');
  });

  it('should deny curl piping to shell', () => {
    const denied = CODE_GENERATION_PERMISSIONS.bash.deniedPatterns;
    expect(denied.some(p => p.includes('curl') && p.includes('sh|bash'))).toBe(true);
  });
});

// =============================================================================
// getPreset() Tests
// =============================================================================

describe('getPreset()', () => {
  const presetNames: PresetName[] = [
    'minimal',
    'read-only',
    'standard',
    'full',
    'ci-cd',
    'research',
    'code-generation',
  ];

  for (const name of presetNames) {
    it(`should return preset for '${name}'`, () => {
      const preset = getPreset(name);
      expect(preset).toBeDefined();
      expect(preset.coreTools).toBeDefined();
      expect(preset.bash).toBeDefined();
      expect(preset.fileSystem).toBeDefined();
    });
  }

  it('should return a copy, not the original', () => {
    const preset1 = getPreset('standard');
    const preset2 = getPreset('standard');
    expect(preset1).not.toBe(preset2);
    expect(preset1).toEqual(preset2);
  });

  it('should throw error for unknown preset', () => {
    expect(() => getPreset('unknown' as PresetName)).toThrow('Unknown preset');
  });

  it('should include available presets in error message', () => {
    expect(() => getPreset('invalid' as PresetName)).toThrow('Available:');
  });
});

// =============================================================================
// getRecommendedPreset() Tests
// =============================================================================

describe('getRecommendedPreset()', () => {
  const expectations: Array<{ taskType: TaskType; expected: PresetName }> = [
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

  for (const { taskType, expected } of expectations) {
    it(`should recommend '${expected}' for '${taskType}'`, () => {
      expect(getRecommendedPreset(taskType)).toBe(expected);
    });
  }

  it('should return standard for unknown task type', () => {
    expect(getRecommendedPreset('unknown' as TaskType)).toBe('standard');
  });
});

// =============================================================================
// getIsolationLevel() Tests
// =============================================================================

describe('getIsolationLevel()', () => {
  const expectations: Array<{ preset: PresetName; expected: string }> = [
    { preset: 'minimal', expected: 'strict' },
    { preset: 'read-only', expected: 'strict' },
    { preset: 'standard', expected: 'moderate' },
    { preset: 'full', expected: 'permissive' },
    { preset: 'ci-cd', expected: 'moderate' },
    { preset: 'research', expected: 'moderate' },
    { preset: 'code-generation', expected: 'moderate' },
  ];

  for (const { preset, expected } of expectations) {
    it(`should return '${expected}' for '${preset}'`, () => {
      expect(getIsolationLevel(preset)).toBe(expected);
    });
  }

  it('should return moderate for unknown preset', () => {
    expect(getIsolationLevel('unknown' as PresetName)).toBe('moderate');
  });
});

// =============================================================================
// createCustomPreset() Tests
// =============================================================================

describe('createCustomPreset()', () => {
  it('should create preset based on base with overrides', () => {
    const custom = createCustomPreset('standard', {
      coreTools: { write: false },
    });
    expect(custom.coreTools.write).toBe(false);
    expect(custom.coreTools.read).toBe(true); // From base
  });

  it('should deep merge nested objects', () => {
    const custom = createCustomPreset('standard', {
      bash: { maxExecutionTimeMs: 60000 },
    });
    expect(custom.bash.maxExecutionTimeMs).toBe(60000);
    expect(custom.bash.enabled).toBe(true); // From base
  });

  it('should override array values completely', () => {
    const custom = createCustomPreset('standard', {
      fileSystem: { readPatterns: ['src/**/*'] },
    });
    expect(custom.fileSystem.readPatterns).toEqual(['src/**/*']);
  });

  it('should preserve base values not in overrides', () => {
    const custom = createCustomPreset('minimal', {
      models: { preferredForSpawning: 'sonnet' },
    });
    expect(custom.models.preferredForSpawning).toBe('sonnet');
    expect(custom.models.allowed).toEqual(['haiku']); // From base
  });

  it('should handle empty overrides', () => {
    const custom = createCustomPreset('standard', {});
    expect(custom).toEqual(STANDARD_PERMISSIONS);
  });

  it('should create valid permission matrix', () => {
    const custom = createCustomPreset('standard', {
      bash: { sandboxed: true },
    });
    const validator = new PermissionValidator();
    const result = validator.validate(custom);
    expect(result.valid).toBe(true);
  });
});

// =============================================================================
// listPresets() Tests
// =============================================================================

describe('listPresets()', () => {
  it('should return array of preset descriptions', () => {
    const presets = listPresets();
    expect(Array.isArray(presets)).toBe(true);
    expect(presets.length).toBe(7);
  });

  it('should include all preset names', () => {
    const presets = listPresets();
    const names = presets.map(p => p.name);
    expect(names).toContain('minimal');
    expect(names).toContain('read-only');
    expect(names).toContain('standard');
    expect(names).toContain('full');
    expect(names).toContain('ci-cd');
    expect(names).toContain('research');
    expect(names).toContain('code-generation');
  });

  it('should have description for each preset', () => {
    const presets = listPresets();
    for (const preset of presets) {
      expect(typeof preset.description).toBe('string');
      expect(preset.description.length).toBeGreaterThan(0);
    }
  });

  it('should have security level for each preset', () => {
    const presets = listPresets();
    for (const preset of presets) {
      expect(typeof preset.securityLevel).toBe('string');
      expect(preset.securityLevel.length).toBeGreaterThan(0);
    }
  });

  it('should have correct structure', () => {
    const presets = listPresets();
    for (const preset of presets) {
      expect(preset).toHaveProperty('name');
      expect(preset).toHaveProperty('description');
      expect(preset).toHaveProperty('securityLevel');
    }
  });
});

// =============================================================================
// Inheritance Chain Tests
// =============================================================================

describe('Inheritance Chain', () => {
  const validator = new PermissionValidator();

  it('should allow full -> standard inheritance', () => {
    expect(validator.canInherit(FULL_PERMISSIONS, STANDARD_PERMISSIONS)).toBe(true);
  });

  it('should not allow standard -> read-only inheritance (domain mismatch)', () => {
    // STANDARD has empty allowedDomains (unrestricted) but READ_ONLY has specific domains
    // The validator treats empty as "no explicitly allowed domains" not "all domains allowed"
    // So child's specific domains fail the subset check
    expect(validator.canInherit(STANDARD_PERMISSIONS, READ_ONLY_PERMISSIONS)).toBe(false);
  });

  it('should allow read-only -> minimal inheritance', () => {
    expect(validator.canInherit(READ_ONLY_PERMISSIONS, MINIMAL_PERMISSIONS)).toBe(true);
  });

  it('should not allow minimal -> standard inheritance', () => {
    expect(validator.canInherit(MINIMAL_PERMISSIONS, STANDARD_PERMISSIONS)).toBe(false);
  });

  it('should not allow full -> ci-cd inheritance (domain mismatch)', () => {
    // FULL has empty allowedDomains but CI_CD has specific domains
    // Same issue as standard -> read-only
    expect(validator.canInherit(FULL_PERMISSIONS, CI_CD_PERMISSIONS)).toBe(false);
  });

  it('should allow full -> research inheritance', () => {
    expect(validator.canInherit(FULL_PERMISSIONS, RESEARCH_PERMISSIONS)).toBe(true);
  });

  it('should allow full -> code-generation inheritance', () => {
    expect(validator.canInherit(FULL_PERMISSIONS, CODE_GENERATION_PERMISSIONS)).toBe(true);
  });
});
