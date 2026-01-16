/**
 * Output Validator
 *
 * Validates agent outputs against expected schemas and formats.
 * Ensures DAG node outputs meet quality requirements before propagation.
 *
 * @module dag/quality/output-validator
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Supported validation types
 */
export type ValidationType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'code'
  | 'markdown'
  | 'json'
  | 'file-path'
  | 'url'
  | 'custom';

/**
 * Schema definition for output validation
 */
export interface OutputSchema {
  /** Schema identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Expected output type */
  type: ValidationType;

  /** Is output required? */
  required: boolean;

  /** Description of expected output */
  description?: string;

  /** For arrays: item schema */
  items?: OutputSchema;

  /** For objects: property schemas */
  properties?: Record<string, OutputSchema>;

  /** Minimum length/value */
  min?: number;

  /** Maximum length/value */
  max?: number;

  /** Regex pattern for strings */
  pattern?: string;

  /** Allowed values (enum) */
  enum?: unknown[];

  /** Custom validation function */
  customValidator?: (value: unknown) => ValidationIssue[];
}

/**
 * Validation issue severity
 */
export type IssueSeverity = 'error' | 'warning' | 'info';

/**
 * A single validation issue
 */
export interface ValidationIssue {
  /** Severity level */
  severity: IssueSeverity;

  /** Issue code for programmatic handling */
  code: string;

  /** Human-readable message */
  message: string;

  /** Path to the problematic field */
  path?: string;

  /** Expected value/type */
  expected?: string;

  /** Actual value/type */
  actual?: string;

  /** Suggested fix */
  suggestion?: string;
}

/**
 * Complete validation result
 */
export interface ValidationResult {
  /** Is the output valid? (no errors) */
  isValid: boolean;

  /** All validation issues */
  issues: ValidationIssue[];

  /** Error count */
  errorCount: number;

  /** Warning count */
  warningCount: number;

  /** Validated/sanitized output */
  sanitizedOutput?: unknown;

  /** Validation timestamp */
  validatedAt: Date;

  /** Time taken to validate (ms) */
  validationTimeMs: number;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Stop at first error */
  failFast?: boolean;

  /** Include warnings */
  includeWarnings?: boolean;

  /** Sanitize output (remove invalid fields) */
  sanitize?: boolean;

  /** Custom validators to apply */
  customValidators?: Array<(value: unknown, schema: OutputSchema) => ValidationIssue[]>;

  /** Strict mode (warnings become errors) */
  strict?: boolean;
}

// =============================================================================
// BUILT-IN VALIDATORS
// =============================================================================

/**
 * Built-in validation functions by type
 */
const builtInValidators: Record<ValidationType, (value: unknown, schema: OutputSchema) => ValidationIssue[]> = {
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
  custom: () => [],
};

function validateString(value: unknown, schema: OutputSchema): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (typeof value !== 'string') {
    issues.push({
      severity: 'error',
      code: 'INVALID_TYPE',
      message: `Expected string, got ${typeof value}`,
      expected: 'string',
      actual: typeof value,
    });
    return issues;
  }

  if (schema.min !== undefined && value.length < schema.min) {
    issues.push({
      severity: 'error',
      code: 'STRING_TOO_SHORT',
      message: `String length ${value.length} is less than minimum ${schema.min}`,
      expected: `>= ${schema.min} characters`,
      actual: `${value.length} characters`,
    });
  }

  if (schema.max !== undefined && value.length > schema.max) {
    issues.push({
      severity: 'error',
      code: 'STRING_TOO_LONG',
      message: `String length ${value.length} exceeds maximum ${schema.max}`,
      expected: `<= ${schema.max} characters`,
      actual: `${value.length} characters`,
    });
  }

  if (schema.pattern) {
    const regex = new RegExp(schema.pattern);
    if (!regex.test(value)) {
      issues.push({
        severity: 'error',
        code: 'PATTERN_MISMATCH',
        message: `String does not match pattern: ${schema.pattern}`,
        expected: `Match pattern: ${schema.pattern}`,
        actual: value.substring(0, 50) + (value.length > 50 ? '...' : ''),
      });
    }
  }

  if (schema.enum && !schema.enum.includes(value)) {
    issues.push({
      severity: 'error',
      code: 'NOT_IN_ENUM',
      message: `Value not in allowed values: ${schema.enum.join(', ')}`,
      expected: schema.enum.join(' | '),
      actual: value,
    });
  }

  return issues;
}

function validateNumber(value: unknown, schema: OutputSchema): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (typeof value !== 'number' || isNaN(value)) {
    issues.push({
      severity: 'error',
      code: 'INVALID_TYPE',
      message: `Expected number, got ${typeof value}`,
      expected: 'number',
      actual: typeof value,
    });
    return issues;
  }

  if (schema.min !== undefined && value < schema.min) {
    issues.push({
      severity: 'error',
      code: 'NUMBER_TOO_SMALL',
      message: `Value ${value} is less than minimum ${schema.min}`,
      expected: `>= ${schema.min}`,
      actual: String(value),
    });
  }

  if (schema.max !== undefined && value > schema.max) {
    issues.push({
      severity: 'error',
      code: 'NUMBER_TOO_LARGE',
      message: `Value ${value} exceeds maximum ${schema.max}`,
      expected: `<= ${schema.max}`,
      actual: String(value),
    });
  }

  if (schema.enum && !schema.enum.includes(value)) {
    issues.push({
      severity: 'error',
      code: 'NOT_IN_ENUM',
      message: `Value not in allowed values: ${schema.enum.join(', ')}`,
      expected: schema.enum.join(' | '),
      actual: String(value),
    });
  }

  return issues;
}

function validateBoolean(value: unknown, _schema: OutputSchema): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (typeof value !== 'boolean') {
    issues.push({
      severity: 'error',
      code: 'INVALID_TYPE',
      message: `Expected boolean, got ${typeof value}`,
      expected: 'boolean',
      actual: typeof value,
    });
  }

  return issues;
}

function validateArray(value: unknown, schema: OutputSchema): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!Array.isArray(value)) {
    issues.push({
      severity: 'error',
      code: 'INVALID_TYPE',
      message: `Expected array, got ${typeof value}`,
      expected: 'array',
      actual: typeof value,
    });
    return issues;
  }

  if (schema.min !== undefined && value.length < schema.min) {
    issues.push({
      severity: 'error',
      code: 'ARRAY_TOO_SHORT',
      message: `Array length ${value.length} is less than minimum ${schema.min}`,
      expected: `>= ${schema.min} items`,
      actual: `${value.length} items`,
    });
  }

  if (schema.max !== undefined && value.length > schema.max) {
    issues.push({
      severity: 'error',
      code: 'ARRAY_TOO_LONG',
      message: `Array length ${value.length} exceeds maximum ${schema.max}`,
      expected: `<= ${schema.max} items`,
      actual: `${value.length} items`,
    });
  }

  // Validate items
  if (schema.items) {
    const itemValidator = builtInValidators[schema.items.type];
    for (let i = 0; i < value.length; i++) {
      const itemIssues = itemValidator(value[i], schema.items);
      for (const issue of itemIssues) {
        issues.push({
          ...issue,
          path: `[${i}]${issue.path ? '.' + issue.path : ''}`,
        });
      }
    }
  }

  return issues;
}

function validateObject(value: unknown, schema: OutputSchema): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    issues.push({
      severity: 'error',
      code: 'INVALID_TYPE',
      message: `Expected object, got ${Array.isArray(value) ? 'array' : typeof value}`,
      expected: 'object',
      actual: Array.isArray(value) ? 'array' : typeof value,
    });
    return issues;
  }

  const obj = value as Record<string, unknown>;

  // Validate properties
  if (schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const propValue = obj[key];

      if (propValue === undefined) {
        if (propSchema.required) {
          issues.push({
            severity: 'error',
            code: 'MISSING_REQUIRED',
            message: `Missing required property: ${key}`,
            path: key,
            expected: propSchema.type,
            actual: 'undefined',
          });
        }
        continue;
      }

      const propValidator = builtInValidators[propSchema.type];
      const propIssues = propValidator(propValue, propSchema);
      for (const issue of propIssues) {
        issues.push({
          ...issue,
          path: key + (issue.path ? '.' + issue.path : ''),
        });
      }
    }
  }

  return issues;
}

function validateCode(value: unknown, schema: OutputSchema): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // First validate as string
  const stringIssues = validateString(value, schema);
  if (stringIssues.some(i => i.severity === 'error')) {
    return stringIssues;
  }

  const code = value as string;

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
  const brackets = { '{': 0, '[': 0, '(': 0 };
  for (const char of code) {
    if (char === '{') brackets['{']++;
    if (char === '}') brackets['{']--;
    if (char === '[') brackets['[']++;
    if (char === ']') brackets['[']--;
    if (char === '(') brackets['(']++;
    if (char === ')') brackets['(']--;
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

function validateMarkdown(value: unknown, schema: OutputSchema): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // First validate as string
  const stringIssues = validateString(value, schema);
  if (stringIssues.some(i => i.severity === 'error')) {
    return stringIssues;
  }

  const markdown = value as string;

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
  const codeBlockCount = (markdown.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    issues.push({
      severity: 'error',
      code: 'UNCLOSED_CODE_BLOCK',
      message: 'Markdown has unclosed code blocks',
      suggestion: 'Ensure all ``` code blocks are properly closed',
    });
  }

  // Check for broken links (basic check)
  const linkPattern = /\[([^\]]*)\]\(([^)]*)\)/g;
  let match;
  while ((match = linkPattern.exec(markdown)) !== null) {
    const linkText = match[1];
    const linkUrl = match[2];

    if (!linkText.trim()) {
      issues.push({
        severity: 'warning',
        code: 'EMPTY_LINK_TEXT',
        message: `Link has empty text: ${linkUrl}`,
        suggestion: 'Add descriptive link text',
      });
    }

    if (!linkUrl.trim()) {
      issues.push({
        severity: 'error',
        code: 'EMPTY_LINK_URL',
        message: `Link has empty URL: [${linkText}]`,
        suggestion: 'Add a valid URL',
      });
    }
  }

  return issues;
}

function validateJson(value: unknown, schema: OutputSchema): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // If string, try to parse
  if (typeof value === 'string') {
    try {
      JSON.parse(value);
    } catch (e) {
      issues.push({
        severity: 'error',
        code: 'INVALID_JSON',
        message: `Invalid JSON: ${(e as Error).message}`,
        suggestion: 'Ensure JSON is properly formatted',
      });
    }
  } else if (typeof value !== 'object' || value === null) {
    issues.push({
      severity: 'error',
      code: 'INVALID_TYPE',
      message: `Expected JSON (string or object), got ${typeof value}`,
    });
  }

  // Apply object validation if properties defined
  if (schema.properties && typeof value === 'object' && value !== null) {
    issues.push(...validateObject(value, schema));
  }

  return issues;
}

function validateFilePath(value: unknown, schema: OutputSchema): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // First validate as string
  const stringIssues = validateString(value, schema);
  if (stringIssues.some(i => i.severity === 'error')) {
    return stringIssues;
  }

  const path = value as string;

  // Check for invalid characters
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
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

function validateUrl(value: unknown, schema: OutputSchema): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // First validate as string
  const stringIssues = validateString(value, schema);
  if (stringIssues.some(i => i.severity === 'error')) {
    return stringIssues;
  }

  const url = value as string;

  try {
    new URL(url);
  } catch {
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
export class OutputValidator {
  private schemas: Map<string, OutputSchema> = new Map();

  /**
   * Register a schema for reuse
   */
  registerSchema(schema: OutputSchema): void {
    this.schemas.set(schema.id, schema);
  }

  /**
   * Get a registered schema
   */
  getSchema(id: string): OutputSchema | undefined {
    return this.schemas.get(id);
  }

  /**
   * Validate output against a schema
   */
  validate(
    output: unknown,
    schema: OutputSchema | string,
    options: ValidationOptions = {}
  ): ValidationResult {
    const startTime = Date.now();

    // Resolve schema if string
    const resolvedSchema = typeof schema === 'string'
      ? this.schemas.get(schema)
      : schema;

    if (!resolvedSchema) {
      return {
        isValid: false,
        issues: [{
          severity: 'error',
          code: 'SCHEMA_NOT_FOUND',
          message: `Schema not found: ${schema}`,
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
    const issues: ValidationIssue[] = [];

    // Built-in validation
    const validator = builtInValidators[resolvedSchema.type];
    const builtInIssues = validator(output, resolvedSchema);
    issues.push(...builtInIssues);

    // Custom schema validator
    if (resolvedSchema.customValidator) {
      issues.push(...resolvedSchema.customValidator(output));
    }

    // Custom validators from options
    if (options.customValidators) {
      for (const customValidator of options.customValidators) {
        issues.push(...customValidator(output, resolvedSchema));
      }
    }

    // Filter and count issues
    let filteredIssues = issues;
    if (!options.includeWarnings) {
      filteredIssues = issues.filter(i => i.severity === 'error');
    }

    // In strict mode, warnings become errors
    if (options.strict) {
      filteredIssues = filteredIssues.map(i =>
        i.severity === 'warning' ? { ...i, severity: 'error' as IssueSeverity } : i
      );
    }

    const errorCount = filteredIssues.filter(i => i.severity === 'error').length;
    const warningCount = filteredIssues.filter(i => i.severity === 'warning').length;

    // Sanitize output if requested
    let sanitizedOutput = output;
    if (options.sanitize && resolvedSchema.type === 'object' && resolvedSchema.properties) {
      sanitizedOutput = this.sanitizeObject(
        output as Record<string, unknown>,
        resolvedSchema
      );
    }

    return {
      isValid: errorCount === 0,
      issues: filteredIssues,
      errorCount,
      warningCount,
      sanitizedOutput,
      validatedAt: new Date(),
      validationTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Sanitize object by removing invalid/unknown fields
   */
  private sanitizeObject(
    obj: Record<string, unknown>,
    schema: OutputSchema
  ): Record<string, unknown> {
    if (!schema.properties) return obj;

    const sanitized: Record<string, unknown> = {};

    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const value = obj[key];
      if (value === undefined) continue;

      // Recursively sanitize nested objects
      if (propSchema.type === 'object' && propSchema.properties) {
        sanitized[key] = this.sanitizeObject(
          value as Record<string, unknown>,
          propSchema
        );
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Quick validation check (returns boolean only)
   */
  isValid(output: unknown, schema: OutputSchema | string): boolean {
    return this.validate(output, schema).isValid;
  }

  /**
   * Validate multiple outputs
   */
  validateMany(
    outputs: Array<{ output: unknown; schema: OutputSchema | string }>,
    options: ValidationOptions = {}
  ): ValidationResult[] {
    return outputs.map(({ output, schema }) =>
      this.validate(output, schema, options)
    );
  }

  /**
   * Create a common schema for DAG node outputs
   */
  static createNodeOutputSchema(config: {
    expectedType: ValidationType;
    description?: string;
    properties?: Record<string, OutputSchema>;
  }): OutputSchema {
    return {
      id: `dag-node-output-${Date.now()}`,
      name: 'DAG Node Output',
      type: config.expectedType,
      required: true,
      description: config.description,
      properties: config.properties,
    };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/** Global output validator instance */
export const outputValidator = new OutputValidator();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Validate output against schema
 */
export function validateOutput(
  output: unknown,
  schema: OutputSchema | string,
  options?: ValidationOptions
): ValidationResult {
  return outputValidator.validate(output, schema, options);
}

/**
 * Quick validation check
 */
export function isValidOutput(
  output: unknown,
  schema: OutputSchema | string
): boolean {
  return outputValidator.isValid(output, schema);
}

/**
 * Register a reusable schema
 */
export function registerOutputSchema(schema: OutputSchema): void {
  outputValidator.registerSchema(schema);
}

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

/** Schema for code output */
export const CODE_OUTPUT_SCHEMA: OutputSchema = {
  id: 'code-output',
  name: 'Code Output',
  type: 'code',
  required: true,
  min: 1,
  description: 'Valid code output',
};

/** Schema for markdown output */
export const MARKDOWN_OUTPUT_SCHEMA: OutputSchema = {
  id: 'markdown-output',
  name: 'Markdown Output',
  type: 'markdown',
  required: true,
  min: 1,
  description: 'Valid markdown content',
};

/** Schema for JSON output */
export const JSON_OUTPUT_SCHEMA: OutputSchema = {
  id: 'json-output',
  name: 'JSON Output',
  type: 'json',
  required: true,
  description: 'Valid JSON data',
};

/** Schema for file path output */
export const FILE_PATH_OUTPUT_SCHEMA: OutputSchema = {
  id: 'file-path-output',
  name: 'File Path Output',
  type: 'file-path',
  required: true,
  description: 'Valid file path',
};

// Register common schemas
outputValidator.registerSchema(CODE_OUTPUT_SCHEMA);
outputValidator.registerSchema(MARKDOWN_OUTPUT_SCHEMA);
outputValidator.registerSchema(JSON_OUTPUT_SCHEMA);
outputValidator.registerSchema(FILE_PATH_OUTPUT_SCHEMA);
