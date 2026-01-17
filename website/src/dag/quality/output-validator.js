"use strict";
/**
 * Output Validator
 *
 * Validates agent outputs against expected schemas and formats.
 * Ensures DAG node outputs meet quality requirements before propagation.
 *
 * @module dag/quality/output-validator
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FILE_PATH_OUTPUT_SCHEMA = exports.JSON_OUTPUT_SCHEMA = exports.MARKDOWN_OUTPUT_SCHEMA = exports.CODE_OUTPUT_SCHEMA = exports.outputValidator = exports.OutputValidator = void 0;
exports.validateOutput = validateOutput;
exports.isValidOutput = isValidOutput;
exports.registerOutputSchema = registerOutputSchema;
// =============================================================================
// BUILT-IN VALIDATORS
// =============================================================================
/**
 * Built-in validation functions by type
 */
var builtInValidators = {
    string: validateString,
    number: validateNumber,
    boolean: validateBoolean,
    array: validateArray,
    object: validateObject,
    code: validateCode,
    markdown: validateMarkdown,
    json: validateJson,
    'file-path': validateFilePath,
    url: validateUrl,
    custom: function () { return []; },
};
function validateString(value, schema) {
    var issues = [];
    if (typeof value !== 'string') {
        issues.push({
            severity: 'error',
            code: 'INVALID_TYPE',
            message: "Expected string, got ".concat(typeof value),
            expected: 'string',
            actual: typeof value,
        });
        return issues;
    }
    if (schema.min !== undefined && value.length < schema.min) {
        issues.push({
            severity: 'error',
            code: 'STRING_TOO_SHORT',
            message: "String length ".concat(value.length, " is less than minimum ").concat(schema.min),
            expected: ">= ".concat(schema.min, " characters"),
            actual: "".concat(value.length, " characters"),
        });
    }
    if (schema.max !== undefined && value.length > schema.max) {
        issues.push({
            severity: 'error',
            code: 'STRING_TOO_LONG',
            message: "String length ".concat(value.length, " exceeds maximum ").concat(schema.max),
            expected: "<= ".concat(schema.max, " characters"),
            actual: "".concat(value.length, " characters"),
        });
    }
    if (schema.pattern) {
        var regex = new RegExp(schema.pattern);
        if (!regex.test(value)) {
            issues.push({
                severity: 'error',
                code: 'PATTERN_MISMATCH',
                message: "String does not match pattern: ".concat(schema.pattern),
                expected: "Match pattern: ".concat(schema.pattern),
                actual: value.substring(0, 50) + (value.length > 50 ? '...' : ''),
            });
        }
    }
    if (schema.enum && !schema.enum.includes(value)) {
        issues.push({
            severity: 'error',
            code: 'NOT_IN_ENUM',
            message: "Value not in allowed values: ".concat(schema.enum.join(', ')),
            expected: schema.enum.join(' | '),
            actual: value,
        });
    }
    return issues;
}
function validateNumber(value, schema) {
    var issues = [];
    if (typeof value !== 'number' || isNaN(value)) {
        issues.push({
            severity: 'error',
            code: 'INVALID_TYPE',
            message: "Expected number, got ".concat(typeof value),
            expected: 'number',
            actual: typeof value,
        });
        return issues;
    }
    if (schema.min !== undefined && value < schema.min) {
        issues.push({
            severity: 'error',
            code: 'NUMBER_TOO_SMALL',
            message: "Value ".concat(value, " is less than minimum ").concat(schema.min),
            expected: ">= ".concat(schema.min),
            actual: String(value),
        });
    }
    if (schema.max !== undefined && value > schema.max) {
        issues.push({
            severity: 'error',
            code: 'NUMBER_TOO_LARGE',
            message: "Value ".concat(value, " exceeds maximum ").concat(schema.max),
            expected: "<= ".concat(schema.max),
            actual: String(value),
        });
    }
    if (schema.enum && !schema.enum.includes(value)) {
        issues.push({
            severity: 'error',
            code: 'NOT_IN_ENUM',
            message: "Value not in allowed values: ".concat(schema.enum.join(', ')),
            expected: schema.enum.join(' | '),
            actual: String(value),
        });
    }
    return issues;
}
function validateBoolean(value, _schema) {
    var issues = [];
    if (typeof value !== 'boolean') {
        issues.push({
            severity: 'error',
            code: 'INVALID_TYPE',
            message: "Expected boolean, got ".concat(typeof value),
            expected: 'boolean',
            actual: typeof value,
        });
    }
    return issues;
}
function validateArray(value, schema) {
    var issues = [];
    if (!Array.isArray(value)) {
        issues.push({
            severity: 'error',
            code: 'INVALID_TYPE',
            message: "Expected array, got ".concat(typeof value),
            expected: 'array',
            actual: typeof value,
        });
        return issues;
    }
    if (schema.min !== undefined && value.length < schema.min) {
        issues.push({
            severity: 'error',
            code: 'ARRAY_TOO_SHORT',
            message: "Array length ".concat(value.length, " is less than minimum ").concat(schema.min),
            expected: ">= ".concat(schema.min, " items"),
            actual: "".concat(value.length, " items"),
        });
    }
    if (schema.max !== undefined && value.length > schema.max) {
        issues.push({
            severity: 'error',
            code: 'ARRAY_TOO_LONG',
            message: "Array length ".concat(value.length, " exceeds maximum ").concat(schema.max),
            expected: "<= ".concat(schema.max, " items"),
            actual: "".concat(value.length, " items"),
        });
    }
    // Validate items
    if (schema.items) {
        var itemValidator = builtInValidators[schema.items.type];
        for (var i = 0; i < value.length; i++) {
            var itemIssues = itemValidator(value[i], schema.items);
            for (var _i = 0, itemIssues_1 = itemIssues; _i < itemIssues_1.length; _i++) {
                var issue = itemIssues_1[_i];
                issues.push(__assign(__assign({}, issue), { path: "[".concat(i, "]").concat(issue.path ? '.' + issue.path : '') }));
            }
        }
    }
    return issues;
}
function validateObject(value, schema) {
    var issues = [];
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        issues.push({
            severity: 'error',
            code: 'INVALID_TYPE',
            message: "Expected object, got ".concat(Array.isArray(value) ? 'array' : typeof value),
            expected: 'object',
            actual: Array.isArray(value) ? 'array' : typeof value,
        });
        return issues;
    }
    var obj = value;
    // Validate properties
    if (schema.properties) {
        for (var _i = 0, _a = Object.entries(schema.properties); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], propSchema = _b[1];
            var propValue = obj[key];
            if (propValue === undefined) {
                if (propSchema.required) {
                    issues.push({
                        severity: 'error',
                        code: 'MISSING_REQUIRED',
                        message: "Missing required property: ".concat(key),
                        path: key,
                        expected: propSchema.type,
                        actual: 'undefined',
                    });
                }
                continue;
            }
            var propValidator = builtInValidators[propSchema.type];
            var propIssues = propValidator(propValue, propSchema);
            for (var _c = 0, propIssues_1 = propIssues; _c < propIssues_1.length; _c++) {
                var issue = propIssues_1[_c];
                issues.push(__assign(__assign({}, issue), { path: key + (issue.path ? '.' + issue.path : '') }));
            }
        }
    }
    return issues;
}
function validateCode(value, schema) {
    var issues = [];
    // First validate as string
    var stringIssues = validateString(value, schema);
    if (stringIssues.some(function (i) { return i.severity === 'error'; })) {
        return stringIssues;
    }
    var code = value;
    // Check for common code issues
    if (code.includes('TODO:') || code.includes('FIXME:')) {
        issues.push({
            severity: 'warning',
            code: 'INCOMPLETE_CODE',
            message: 'Code contains TODO or FIXME markers',
            suggestion: 'Complete the implementation before submitting',
        });
    }
    // Check for balanced brackets
    var brackets = { '{': 0, '[': 0, '(': 0 };
    for (var _i = 0, code_1 = code; _i < code_1.length; _i++) {
        var char = code_1[_i];
        if (char === '{')
            brackets['{']++;
        if (char === '}')
            brackets['{']--;
        if (char === '[')
            brackets['[']++;
        if (char === ']')
            brackets['[']--;
        if (char === '(')
            brackets['(']++;
        if (char === ')')
            brackets['(']--;
    }
    if (brackets['{'] !== 0 || brackets['['] !== 0 || brackets['('] !== 0) {
        issues.push({
            severity: 'error',
            code: 'UNBALANCED_BRACKETS',
            message: 'Code has unbalanced brackets',
            suggestion: 'Check for missing or extra brackets',
        });
    }
    return issues;
}
function validateMarkdown(value, schema) {
    var issues = [];
    // First validate as string
    var stringIssues = validateString(value, schema);
    if (stringIssues.some(function (i) { return i.severity === 'error'; })) {
        return stringIssues;
    }
    var markdown = value;
    // Check for empty content
    if (markdown.trim().length === 0) {
        issues.push({
            severity: 'error',
            code: 'EMPTY_CONTENT',
            message: 'Markdown content is empty',
        });
        return issues;
    }
    // Check for unclosed code blocks
    var codeBlockCount = (markdown.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
        issues.push({
            severity: 'error',
            code: 'UNCLOSED_CODE_BLOCK',
            message: 'Markdown has unclosed code blocks',
            suggestion: 'Ensure all ``` code blocks are properly closed',
        });
    }
    // Check for broken links (basic check)
    var linkPattern = /\[([^\]]*)\]\(([^)]*)\)/g;
    var match;
    while ((match = linkPattern.exec(markdown)) !== null) {
        var linkText = match[1];
        var linkUrl = match[2];
        if (!linkText.trim()) {
            issues.push({
                severity: 'warning',
                code: 'EMPTY_LINK_TEXT',
                message: "Link has empty text: ".concat(linkUrl),
                suggestion: 'Add descriptive link text',
            });
        }
        if (!linkUrl.trim()) {
            issues.push({
                severity: 'error',
                code: 'EMPTY_LINK_URL',
                message: "Link has empty URL: [".concat(linkText, "]"),
                suggestion: 'Add a valid URL',
            });
        }
    }
    return issues;
}
function validateJson(value, schema) {
    var issues = [];
    // If string, try to parse
    if (typeof value === 'string') {
        try {
            JSON.parse(value);
        }
        catch (e) {
            issues.push({
                severity: 'error',
                code: 'INVALID_JSON',
                message: "Invalid JSON: ".concat(e.message),
                suggestion: 'Ensure JSON is properly formatted',
            });
        }
    }
    else if (typeof value !== 'object' || value === null) {
        issues.push({
            severity: 'error',
            code: 'INVALID_TYPE',
            message: "Expected JSON (string or object), got ".concat(typeof value),
        });
    }
    // Apply object validation if properties defined
    if (schema.properties && typeof value === 'object' && value !== null) {
        issues.push.apply(issues, validateObject(value, schema));
    }
    return issues;
}
function validateFilePath(value, schema) {
    var issues = [];
    // First validate as string
    var stringIssues = validateString(value, schema);
    if (stringIssues.some(function (i) { return i.severity === 'error'; })) {
        return stringIssues;
    }
    var path = value;
    // Check for invalid characters
    var invalidChars = /[<>:"|?*\x00-\x1f]/;
    if (invalidChars.test(path)) {
        issues.push({
            severity: 'error',
            code: 'INVALID_PATH_CHARS',
            message: 'File path contains invalid characters',
            suggestion: 'Remove special characters from path',
        });
    }
    // Check for path traversal
    if (path.includes('..')) {
        issues.push({
            severity: 'warning',
            code: 'PATH_TRAVERSAL',
            message: 'File path contains parent directory reference (..)',
            suggestion: 'Use absolute paths or resolve relative paths',
        });
    }
    return issues;
}
function validateUrl(value, schema) {
    var issues = [];
    // First validate as string
    var stringIssues = validateString(value, schema);
    if (stringIssues.some(function (i) { return i.severity === 'error'; })) {
        return stringIssues;
    }
    var url = value;
    try {
        new URL(url);
    }
    catch (_a) {
        issues.push({
            severity: 'error',
            code: 'INVALID_URL',
            message: 'Invalid URL format',
            actual: url,
            suggestion: 'Ensure URL includes protocol (http:// or https://)',
        });
    }
    return issues;
}
// =============================================================================
// OUTPUT VALIDATOR CLASS
// =============================================================================
/**
 * OutputValidator validates agent outputs against schemas.
 *
 * @example
 * ```typescript
 * const validator = new OutputValidator();
 *
 * const schema: OutputSchema = {
 *   id: 'api-response',
 *   name: 'API Response',
 *   type: 'object',
 *   required: true,
 *   properties: {
 *     status: { id: 'status', name: 'Status', type: 'number', required: true },
 *     data: { id: 'data', name: 'Data', type: 'object', required: true },
 *   },
 * };
 *
 * const result = validator.validate(output, schema);
 * if (!result.isValid) {
 *   console.error('Validation failed:', result.issues);
 * }
 * ```
 */
var OutputValidator = /** @class */ (function () {
    function OutputValidator() {
        this.schemas = new Map();
    }
    /**
     * Register a schema for reuse
     */
    OutputValidator.prototype.registerSchema = function (schema) {
        this.schemas.set(schema.id, schema);
    };
    /**
     * Get a registered schema
     */
    OutputValidator.prototype.getSchema = function (id) {
        return this.schemas.get(id);
    };
    /**
     * Validate output against a schema
     */
    OutputValidator.prototype.validate = function (output, schema, options) {
        if (options === void 0) { options = {}; }
        var startTime = Date.now();
        // Resolve schema if string
        var resolvedSchema = typeof schema === 'string'
            ? this.schemas.get(schema)
            : schema;
        if (!resolvedSchema) {
            return {
                isValid: false,
                issues: [{
                        severity: 'error',
                        code: 'SCHEMA_NOT_FOUND',
                        message: "Schema not found: ".concat(schema),
                    }],
                errorCount: 1,
                warningCount: 0,
                validatedAt: new Date(),
                validationTimeMs: Date.now() - startTime,
            };
        }
        // Check for null/undefined
        if (output === null || output === undefined) {
            if (resolvedSchema.required) {
                return {
                    isValid: false,
                    issues: [{
                            severity: 'error',
                            code: 'REQUIRED_VALUE_MISSING',
                            message: 'Required output is null or undefined',
                        }],
                    errorCount: 1,
                    warningCount: 0,
                    validatedAt: new Date(),
                    validationTimeMs: Date.now() - startTime,
                };
            }
            return {
                isValid: true,
                issues: [],
                errorCount: 0,
                warningCount: 0,
                sanitizedOutput: output,
                validatedAt: new Date(),
                validationTimeMs: Date.now() - startTime,
            };
        }
        // Run validation
        var issues = [];
        // Built-in validation
        var validator = builtInValidators[resolvedSchema.type];
        var builtInIssues = validator(output, resolvedSchema);
        issues.push.apply(issues, builtInIssues);
        // Custom schema validator
        if (resolvedSchema.customValidator) {
            issues.push.apply(issues, resolvedSchema.customValidator(output));
        }
        // Custom validators from options
        if (options.customValidators) {
            for (var _i = 0, _a = options.customValidators; _i < _a.length; _i++) {
                var customValidator = _a[_i];
                issues.push.apply(issues, customValidator(output, resolvedSchema));
            }
        }
        // Filter and count issues
        var filteredIssues = issues;
        if (!options.includeWarnings) {
            filteredIssues = issues.filter(function (i) { return i.severity === 'error'; });
        }
        // In strict mode, warnings become errors
        if (options.strict) {
            filteredIssues = filteredIssues.map(function (i) {
                return i.severity === 'warning' ? __assign(__assign({}, i), { severity: 'error' }) : i;
            });
        }
        var errorCount = filteredIssues.filter(function (i) { return i.severity === 'error'; }).length;
        var warningCount = filteredIssues.filter(function (i) { return i.severity === 'warning'; }).length;
        // Sanitize output if requested
        var sanitizedOutput = output;
        if (options.sanitize && resolvedSchema.type === 'object' && resolvedSchema.properties) {
            sanitizedOutput = this.sanitizeObject(output, resolvedSchema);
        }
        return {
            isValid: errorCount === 0,
            issues: filteredIssues,
            errorCount: errorCount,
            warningCount: warningCount,
            sanitizedOutput: sanitizedOutput,
            validatedAt: new Date(),
            validationTimeMs: Date.now() - startTime,
        };
    };
    /**
     * Sanitize object by removing invalid/unknown fields
     */
    OutputValidator.prototype.sanitizeObject = function (obj, schema) {
        if (!schema.properties)
            return obj;
        var sanitized = {};
        for (var _i = 0, _a = Object.entries(schema.properties); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], propSchema = _b[1];
            var value = obj[key];
            if (value === undefined)
                continue;
            // Recursively sanitize nested objects
            if (propSchema.type === 'object' && propSchema.properties) {
                sanitized[key] = this.sanitizeObject(value, propSchema);
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    };
    /**
     * Quick validation check (returns boolean only)
     */
    OutputValidator.prototype.isValid = function (output, schema) {
        return this.validate(output, schema).isValid;
    };
    /**
     * Validate multiple outputs
     */
    OutputValidator.prototype.validateMany = function (outputs, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        return outputs.map(function (_a) {
            var output = _a.output, schema = _a.schema;
            return _this.validate(output, schema, options);
        });
    };
    /**
     * Create a common schema for DAG node outputs
     */
    OutputValidator.createNodeOutputSchema = function (config) {
        return {
            id: "dag-node-output-".concat(Date.now()),
            name: 'DAG Node Output',
            type: config.expectedType,
            required: true,
            description: config.description,
            properties: config.properties,
        };
    };
    return OutputValidator;
}());
exports.OutputValidator = OutputValidator;
// =============================================================================
// SINGLETON INSTANCE
// =============================================================================
/** Global output validator instance */
exports.outputValidator = new OutputValidator();
// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================
/**
 * Validate output against schema
 */
function validateOutput(output, schema, options) {
    return exports.outputValidator.validate(output, schema, options);
}
/**
 * Quick validation check
 */
function isValidOutput(output, schema) {
    return exports.outputValidator.isValid(output, schema);
}
/**
 * Register a reusable schema
 */
function registerOutputSchema(schema) {
    exports.outputValidator.registerSchema(schema);
}
// =============================================================================
// COMMON SCHEMAS
// =============================================================================
/** Schema for code output */
exports.CODE_OUTPUT_SCHEMA = {
    id: 'code-output',
    name: 'Code Output',
    type: 'code',
    required: true,
    min: 1,
    description: 'Valid code output',
};
/** Schema for markdown output */
exports.MARKDOWN_OUTPUT_SCHEMA = {
    id: 'markdown-output',
    name: 'Markdown Output',
    type: 'markdown',
    required: true,
    min: 1,
    description: 'Valid markdown content',
};
/** Schema for JSON output */
exports.JSON_OUTPUT_SCHEMA = {
    id: 'json-output',
    name: 'JSON Output',
    type: 'json',
    required: true,
    description: 'Valid JSON data',
};
/** Schema for file path output */
exports.FILE_PATH_OUTPUT_SCHEMA = {
    id: 'file-path-output',
    name: 'File Path Output',
    type: 'file-path',
    required: true,
    description: 'Valid file path',
};
// Register common schemas
exports.outputValidator.registerSchema(exports.CODE_OUTPUT_SCHEMA);
exports.outputValidator.registerSchema(exports.MARKDOWN_OUTPUT_SCHEMA);
exports.outputValidator.registerSchema(exports.JSON_OUTPUT_SCHEMA);
exports.outputValidator.registerSchema(exports.FILE_PATH_OUTPUT_SCHEMA);
