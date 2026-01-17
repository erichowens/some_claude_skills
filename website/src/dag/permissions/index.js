"use strict";
/**
 * DAG Permissions Module Exports
 *
 * Permission validation, enforcement, and presets for DAG execution.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPresets = exports.createCustomPreset = exports.getIsolationLevel = exports.getRecommendedPreset = exports.getPreset = exports.CODE_GENERATION_PERMISSIONS = exports.RESEARCH_PERMISSIONS = exports.CI_CD_PERMISSIONS = exports.FULL_PERMISSIONS = exports.STANDARD_PERMISSIONS = exports.READ_ONLY_PERMISSIONS = exports.MINIMAL_PERMISSIONS = exports.createPermissiveEnforcer = exports.createStrictEnforcer = exports.createEnforcer = exports.PermissionDeniedError = exports.PermissionEnforcer = exports.validateInheritance = exports.validatePermissions = exports.createValidator = exports.PermissionValidationError = exports.PermissionValidator = void 0;
// Validator
var validator_1 = require("./validator");
Object.defineProperty(exports, "PermissionValidator", { enumerable: true, get: function () { return validator_1.PermissionValidator; } });
Object.defineProperty(exports, "PermissionValidationError", { enumerable: true, get: function () { return validator_1.PermissionValidationError; } });
Object.defineProperty(exports, "createValidator", { enumerable: true, get: function () { return validator_1.createValidator; } });
Object.defineProperty(exports, "validatePermissions", { enumerable: true, get: function () { return validator_1.validatePermissions; } });
Object.defineProperty(exports, "validateInheritance", { enumerable: true, get: function () { return validator_1.validateInheritance; } });
// Enforcer
var enforcer_1 = require("./enforcer");
Object.defineProperty(exports, "PermissionEnforcer", { enumerable: true, get: function () { return enforcer_1.PermissionEnforcer; } });
Object.defineProperty(exports, "PermissionDeniedError", { enumerable: true, get: function () { return enforcer_1.PermissionDeniedError; } });
Object.defineProperty(exports, "createEnforcer", { enumerable: true, get: function () { return enforcer_1.createEnforcer; } });
Object.defineProperty(exports, "createStrictEnforcer", { enumerable: true, get: function () { return enforcer_1.createStrictEnforcer; } });
Object.defineProperty(exports, "createPermissiveEnforcer", { enumerable: true, get: function () { return enforcer_1.createPermissiveEnforcer; } });
// Presets
var presets_1 = require("./presets");
Object.defineProperty(exports, "MINIMAL_PERMISSIONS", { enumerable: true, get: function () { return presets_1.MINIMAL_PERMISSIONS; } });
Object.defineProperty(exports, "READ_ONLY_PERMISSIONS", { enumerable: true, get: function () { return presets_1.READ_ONLY_PERMISSIONS; } });
Object.defineProperty(exports, "STANDARD_PERMISSIONS", { enumerable: true, get: function () { return presets_1.STANDARD_PERMISSIONS; } });
Object.defineProperty(exports, "FULL_PERMISSIONS", { enumerable: true, get: function () { return presets_1.FULL_PERMISSIONS; } });
Object.defineProperty(exports, "CI_CD_PERMISSIONS", { enumerable: true, get: function () { return presets_1.CI_CD_PERMISSIONS; } });
Object.defineProperty(exports, "RESEARCH_PERMISSIONS", { enumerable: true, get: function () { return presets_1.RESEARCH_PERMISSIONS; } });
Object.defineProperty(exports, "CODE_GENERATION_PERMISSIONS", { enumerable: true, get: function () { return presets_1.CODE_GENERATION_PERMISSIONS; } });
Object.defineProperty(exports, "getPreset", { enumerable: true, get: function () { return presets_1.getPreset; } });
Object.defineProperty(exports, "getRecommendedPreset", { enumerable: true, get: function () { return presets_1.getRecommendedPreset; } });
Object.defineProperty(exports, "getIsolationLevel", { enumerable: true, get: function () { return presets_1.getIsolationLevel; } });
Object.defineProperty(exports, "createCustomPreset", { enumerable: true, get: function () { return presets_1.createCustomPreset; } });
Object.defineProperty(exports, "listPresets", { enumerable: true, get: function () { return presets_1.listPresets; } });
