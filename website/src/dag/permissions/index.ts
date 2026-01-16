/**
 * DAG Permissions Module Exports
 *
 * Permission validation, enforcement, and presets for DAG execution.
 */

// Validator
export {
  PermissionValidator,
  PermissionValidationError,
  createValidator,
  validatePermissions,
  validateInheritance,
} from './validator';

export type {
  ValidationResult,
  PermissionError,
  PermissionWarning,
  PermissionErrorCode,
  PermissionWarningCode,
} from './validator';

// Enforcer
export {
  PermissionEnforcer,
  PermissionDeniedError,
  createEnforcer,
  createStrictEnforcer,
  createPermissiveEnforcer,
} from './enforcer';

export type {
  EnforcementResult,
  Violation,
  ViolationType,
  PermissionRequest,
  RequestType,
  AuditEntry,
  EnforcerOptions,
} from './enforcer';

// Presets
export {
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
} from './presets';

export type { PresetName, TaskType } from './presets';
