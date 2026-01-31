#!/usr/bin/env npx tsx
/**
 * Design Catalog Validation Script
 *
 * Validates the integrity and accessibility compliance of the design catalog.
 * Run with: npx tsx scripts/validate-catalog.ts
 *
 * Note: This script only uses fs.readFileSync for file operations.
 * No shell commands or child processes are used.
 */

import * as fs from 'fs';
import * as path from 'path';

// Types for validation
interface ValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// WCAG contrast calculation
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Validation functions
function validateJSON(filePath: string): ValidationResult {
  const result: ValidationResult = {
    file: path.basename(filePath),
    valid: true,
    errors: [],
    warnings: []
  };

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    JSON.parse(content);
  } catch (error) {
    result.valid = false;
    result.errors.push(`Invalid JSON: ${(error as Error).message}`);
  }

  return result;
}

function validateColorPalettes(filePath: string): ValidationResult {
  const result: ValidationResult = {
    file: 'color-palettes.json',
    valid: true,
    errors: [],
    warnings: []
  };

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!content.palettes || !Array.isArray(content.palettes)) {
      result.valid = false;
      result.errors.push('Missing or invalid "palettes" array');
      return result;
    }

    content.palettes.forEach((palette: any, index: number) => {
      const prefix = `Palette ${index + 1} (${palette.id || 'unknown'})`;

      // Required fields (using actual file structure)
      const requiredFields = ['id', 'name', 'trend', 'colors', 'combinations', 'semanticColors'];
      requiredFields.forEach(field => {
        if (!palette[field]) {
          result.errors.push(`${prefix}: Missing required field "${field}"`);
          result.valid = false;
        }
      });

      // Validate colors
      if (palette.colors && Array.isArray(palette.colors)) {
        palette.colors.forEach((color: any, colorIndex: number) => {
          if (!color.hex || !/^#[0-9A-Fa-f]{6}$/.test(color.hex)) {
            result.errors.push(`${prefix}: Color ${colorIndex + 1} has invalid hex value`);
            result.valid = false;
          }
          // Check that each color has wcag info
          if (!color.wcag) {
            result.warnings.push(`${prefix}: Color "${color.name}" missing WCAG data`);
          }
        });

        // Validate contrast ratio combinations (using hex values directly)
        if (palette.combinations && Array.isArray(palette.combinations)) {
          palette.combinations.forEach((combo: any) => {
            const fgHex = combo.foreground;
            const bgHex = combo.background;
            const fgRgb = hexToRgb(fgHex);
            const bgRgb = hexToRgb(bgHex);

            if (fgRgb && bgRgb && combo.contrastRatio) {
              const fgLum = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
              const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
              const calculatedRatio = getContrastRatio(fgLum, bgLum);
              const reportedRatio = combo.contrastRatio;

              // Allow 0.5 tolerance for rounding differences
              if (Math.abs(calculatedRatio - reportedRatio) > 0.5) {
                result.warnings.push(
                  `${prefix}: Contrast ratio mismatch for ${fgHex}/${bgHex}. ` +
                  `Reported: ${reportedRatio.toFixed(2)}, Calculated: ${calculatedRatio.toFixed(2)}`
                );
              }

              // Validate rating claims
              const passesAAA = calculatedRatio >= 7;
              const passesAA = calculatedRatio >= 4.5;
              const passesAALarge = calculatedRatio >= 3;

              if (combo.rating === 'AAA' && !passesAAA) {
                result.warnings.push(
                  `${prefix}: Claims AAA but ratio ${calculatedRatio.toFixed(2)} < 7`
                );
              } else if (combo.rating === 'AA' && !passesAA) {
                result.warnings.push(
                  `${prefix}: Claims AA but ratio ${calculatedRatio.toFixed(2)} < 4.5`
                );
              } else if (combo.rating === 'AA-Large' && !passesAALarge) {
                result.warnings.push(
                  `${prefix}: Claims AA-Large but ratio ${calculatedRatio.toFixed(2)} < 3`
                );
              }
            }
          });
        }
      }
    });

  } catch (error) {
    result.valid = false;
    result.errors.push(`Validation error: ${(error as Error).message}`);
  }

  return result;
}

function validateTypographySystems(filePath: string): ValidationResult {
  const result: ValidationResult = {
    file: 'typography-systems.json',
    valid: true,
    errors: [],
    warnings: []
  };

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!content.systems || !Array.isArray(content.systems)) {
      result.valid = false;
      result.errors.push('Missing or invalid "systems" array');
      return result;
    }

    content.systems.forEach((system: any, index: number) => {
      const prefix = `System ${index + 1} (${system.id || 'unknown'})`;

      // Required fields
      const requiredFields = ['id', 'name', 'baseFontSize', 'scaleRatio', 'fonts', 'typeScale', 'readabilityScore'];
      requiredFields.forEach(field => {
        if (system[field] === undefined) {
          result.errors.push(`${prefix}: Missing required field "${field}"`);
          result.valid = false;
        }
      });

      // Validate scale ratio
      if (system.scaleRatio && (system.scaleRatio < 1 || system.scaleRatio > 2)) {
        result.warnings.push(`${prefix}: Scale ratio ${system.scaleRatio} is outside typical range (1.0-2.0)`);
      }

      // Validate readability score
      if (system.readabilityScore && (system.readabilityScore < 0 || system.readabilityScore > 100)) {
        result.errors.push(`${prefix}: Readability score must be between 0 and 100`);
        result.valid = false;
      }

      // Validate type scale calculations
      if (system.typeScale && system.baseFontSize && system.scaleRatio) {
        const base = system.baseFontSize;

        // Check that 'base' size matches baseFontSize
        const baseComputed = system.typeScale.base?.computed;
        if (baseComputed && baseComputed !== `${base}px`) {
          result.warnings.push(
            `${prefix}: Base size computed value mismatch. Expected: ${base}px, Got: ${baseComputed}`
          );
        }
      }

      // Validate fonts
      if (system.fonts) {
        const fontTypes = ['display', 'heading', 'body'];
        fontTypes.forEach(fontType => {
          if (!system.fonts[fontType]?.family) {
            result.warnings.push(`${prefix}: Missing ${fontType} font family`);
          }
        });
      }
    });

  } catch (error) {
    result.valid = false;
    result.errors.push(`Validation error: ${(error as Error).message}`);
  }

  return result;
}

function validateComponents(filePath: string): ValidationResult {
  const result: ValidationResult = {
    file: 'components/index.json',
    valid: true,
    errors: [],
    warnings: []
  };

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!content.components || !Array.isArray(content.components)) {
      result.valid = false;
      result.errors.push('Missing or invalid "components" array');
      return result;
    }

    // Actual component types from the file structure
    const validTypes = ['button', 'card', 'navigation', 'hero', 'cta', 'testimonial', 'form-input', 'form-select', 'form-checkbox', 'form-radio'];

    content.components.forEach((component: any, index: number) => {
      const prefix = `Component ${index + 1} (${component.id || 'unknown'})`;

      // Required fields (matching actual file structure)
      const requiredFields = ['id', 'type', 'trend', 'accessibility'];
      requiredFields.forEach(field => {
        if (!component[field]) {
          result.errors.push(`${prefix}: Missing required field "${field}"`);
          result.valid = false;
        }
      });

      // CSS is optional if states or layout exist (states/layout can generate CSS)
      // Non-interactive components (hero, testimonial) use layout/content instead of states
      const hasStyleInfo = component.css || component.states || component.layout || component.styles;
      if (!hasStyleInfo) {
        result.errors.push(`${prefix}: Missing style information (css, states, or layout)`);
        result.valid = false;
      } else if (!component.css) {
        result.warnings.push(`${prefix}: Missing "css" field (can be generated from states/layout)`);
      }

      // Validate type (not category)
      if (component.type && !validTypes.includes(component.type)) {
        result.warnings.push(`${prefix}: Unknown component type "${component.type}"`);
      }

      // Validate accessibility (using actual field names: ariaRole, focusVisible, keyboardSupport boolean)
      if (component.accessibility) {
        const a11y = component.accessibility;

        if (!a11y.ariaRole) {
          result.warnings.push(`${prefix}: Missing ariaRole`);
        }

        if (a11y.keyboardSupport === undefined) {
          result.warnings.push(`${prefix}: Missing keyboardSupport specification`);
        }

        if (!a11y.focusVisible) {
          result.warnings.push(`${prefix}: Missing focusVisible specification`);
        }

        if (!a11y.minTouchTarget) {
          result.warnings.push(`${prefix}: Missing minTouchTarget specification`);
        } else {
          // Check touch target is at least 44px
          const sizeMatch = String(a11y.minTouchTarget).match(/(\d+)/);
          if (sizeMatch && parseInt(sizeMatch[1], 10) < 44) {
            result.errors.push(`${prefix}: Touch target ${a11y.minTouchTarget} is below WCAG minimum (44px)`);
            result.valid = false;
          }
        }
      }

      // Validate states
      if (component.states) {
        const requiredStates = ['default', 'hover', 'focus', 'disabled'];
        requiredStates.forEach(state => {
          if (!component.states[state]) {
            result.warnings.push(`${prefix}: Missing "${state}" state`);
          }
        });
      } else {
        result.warnings.push(`${prefix}: Missing states object`);
      }
    });

    // Log component type counts
    const typeCounts: Record<string, number> = {};
    content.components.forEach((c: any) => {
      typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
    });

    console.log('\nComponent counts by type:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

  } catch (error) {
    result.valid = false;
    result.errors.push(`Validation error: ${(error as Error).message}`);
  }

  return result;
}

function validateCatalogIndex(filePath: string): ValidationResult {
  const result: ValidationResult = {
    file: 'design-catalog.json',
    valid: true,
    errors: [],
    warnings: []
  };

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Check required top-level fields
    const requiredFields = ['version', 'metadata', 'statistics', 'trends', 'files'];
    requiredFields.forEach(field => {
      if (!content[field]) {
        result.errors.push(`Missing required field "${field}"`);
        result.valid = false;
      }
    });

    // Validate file references exist
    if (content.files) {
      const catalogDir = path.dirname(filePath);
      Object.entries(content.files).forEach(([key, relativePath]) => {
        if (typeof relativePath === 'string' && relativePath !== './README.md') {
          const fullPath = path.join(catalogDir, relativePath as string);
          if (!fs.existsSync(fullPath)) {
            result.errors.push(`Referenced file does not exist: ${relativePath}`);
            result.valid = false;
          }
        }
      });
    }

    // Validate statistics
    if (content.statistics) {
      const stats = content.statistics;
      if (stats.trends < 1) result.warnings.push('Statistics show 0 trends');
      if (stats.colorPalettes < 1) result.warnings.push('Statistics show 0 color palettes');
      if (stats.typographySystems < 1) result.warnings.push('Statistics show 0 typography systems');
      if (stats.components < 1) result.warnings.push('Statistics show 0 components');
    }

  } catch (error) {
    result.valid = false;
    result.errors.push(`Validation error: ${(error as Error).message}`);
  }

  return result;
}

// Cross-reference validation
function validateCrossReferences(catalogDir: string): ValidationResult {
  const result: ValidationResult = {
    file: 'cross-references',
    valid: true,
    errors: [],
    warnings: []
  };

  try {
    const catalog = JSON.parse(fs.readFileSync(path.join(catalogDir, 'design-catalog.json'), 'utf-8'));
    const palettes = JSON.parse(fs.readFileSync(path.join(catalogDir, 'color-palettes.json'), 'utf-8'));
    const typography = JSON.parse(fs.readFileSync(path.join(catalogDir, 'typography-systems.json'), 'utf-8'));
    const components = JSON.parse(fs.readFileSync(path.join(catalogDir, 'components/index.json'), 'utf-8'));

    // Validate trend references
    const catalogTrends = new Set(catalog.trends.map((t: any) => t.id));

    palettes.palettes.forEach((p: any) => {
      if (!catalogTrends.has(p.trend)) {
        result.warnings.push(`Palette "${p.id}" references unknown trend "${p.trend}"`);
      }
    });

    typography.systems.forEach((s: any) => {
      if (!catalogTrends.has(s.trend)) {
        result.warnings.push(`Typography system "${s.id}" references unknown trend "${s.trend}"`);
      }
    });

    components.components.forEach((c: any) => {
      if (!catalogTrends.has(c.trend)) {
        result.warnings.push(`Component "${c.id}" references unknown trend "${c.trend}"`);
      }
    });

    // Validate statistics match actual counts
    const actualPalettes = palettes.palettes.length;
    const actualTypography = typography.systems.length;
    const actualComponents = components.components.length;

    if (catalog.statistics.colorPalettes !== actualPalettes) {
      result.warnings.push(
        `Statistics mismatch: colorPalettes says ${catalog.statistics.colorPalettes}, actual: ${actualPalettes}`
      );
    }
    if (catalog.statistics.typographySystems !== actualTypography) {
      result.warnings.push(
        `Statistics mismatch: typographySystems says ${catalog.statistics.typographySystems}, actual: ${actualTypography}`
      );
    }
    if (catalog.statistics.components !== actualComponents) {
      result.warnings.push(
        `Statistics mismatch: components says ${catalog.statistics.components}, actual: ${actualComponents}`
      );
    }

  } catch (error) {
    result.valid = false;
    result.errors.push(`Cross-reference validation error: ${(error as Error).message}`);
  }

  return result;
}

// Main validation runner
function main() {
  console.log('='.repeat(60));
  console.log('Design Catalog Validation');
  console.log('='.repeat(60));

  const catalogDir = path.join(__dirname, '..', 'design-catalog');

  if (!fs.existsSync(catalogDir)) {
    console.error('\nERROR: design-catalog directory not found!');
    console.error(`Expected at: ${catalogDir}`);
    return;
  }

  const results: ValidationResult[] = [];

  // Validate each file
  console.log('\n📁 Validating JSON structure...');

  const files = [
    { path: path.join(catalogDir, 'design-catalog.json'), validator: validateCatalogIndex },
    { path: path.join(catalogDir, 'color-palettes.json'), validator: validateColorPalettes },
    { path: path.join(catalogDir, 'typography-systems.json'), validator: validateTypographySystems },
    { path: path.join(catalogDir, 'components/index.json'), validator: validateComponents },
  ];

  for (const { path: filePath, validator } of files) {
    if (fs.existsSync(filePath)) {
      const jsonResult = validateJSON(filePath);
      if (!jsonResult.valid) {
        results.push(jsonResult);
        continue;
      }
      results.push(validator(filePath));
    } else {
      results.push({
        file: path.basename(filePath),
        valid: false,
        errors: [`File not found: ${filePath}`],
        warnings: []
      });
    }
  }

  // Cross-reference validation
  console.log('\n🔗 Validating cross-references...');
  results.push(validateCrossReferences(catalogDir));

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('Results');
  console.log('='.repeat(60));

  let totalErrors = 0;
  let totalWarnings = 0;

  results.forEach(result => {
    const status = result.valid ? '✅' : '❌';
    console.log(`\n${status} ${result.file}`);

    if (result.errors.length > 0) {
      console.log('  Errors:');
      result.errors.forEach(err => {
        console.log(`    ❌ ${err}`);
        totalErrors++;
      });
    }

    if (result.warnings.length > 0) {
      console.log('  Warnings:');
      result.warnings.forEach(warn => {
        console.log(`    ⚠️  ${warn}`);
        totalWarnings++;
      });
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log('  No issues found');
    }
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total Errors:   ${totalErrors}`);
  console.log(`Total Warnings: ${totalWarnings}`);

  const overallValid = results.every(r => r.valid);
  if (overallValid) {
    console.log('\n✅ Catalog validation PASSED');
  } else {
    console.log('\n❌ Catalog validation FAILED');
  }
}

main();
