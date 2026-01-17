"use strict";
/**
 * Permission Validator - Validates permission inheritance and constraints
 *
 * Ensures child agents can only have permissions equal to or more restrictive
 * than their parent agents. Validates permission matrices against security policies.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionValidationError = exports.PermissionValidator = void 0;
exports.createValidator = createValidator;
exports.validatePermissions = validatePermissions;
exports.validateInheritance = validateInheritance;
/**
 * Permission Validator class
 */
var PermissionValidator = /** @class */ (function () {
    function PermissionValidator(options) {
        if (options === void 0) { options = {}; }
        var _a;
        this.strictMode = (_a = options.strictMode) !== null && _a !== void 0 ? _a : true;
    }
    /**
     * Validate that child permissions are a subset of parent permissions
     */
    PermissionValidator.prototype.validateInheritance = function (parent, child) {
        var errors = [];
        var warnings = [];
        // Validate core tools
        this.validateCoreToolInheritance(parent.coreTools, child.coreTools, errors);
        // Validate bash permissions
        this.validateBashInheritance(parent.bash, child.bash, errors, warnings);
        // Validate file system permissions
        this.validateFileSystemInheritance(parent.fileSystem, child.fileSystem, errors, warnings);
        // Validate MCP permissions
        this.validateMcpInheritance(parent.mcpTools, child.mcpTools, errors);
        // Validate network permissions
        this.validateNetworkInheritance(parent.network, child.network, errors);
        // Validate model permissions
        this.validateModelInheritance(parent.models, child.models, errors);
        // Calculate security score
        var securityScore = this.calculateSecurityScore(child);
        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            inheritanceValid: errors.filter(function (e) { return e.code === 'INHERITANCE_VIOLATION'; }).length === 0,
            securityScore: securityScore,
        };
    };
    /**
     * Validate a single permission matrix
     */
    PermissionValidator.prototype.validate = function (permissions) {
        var errors = [];
        var warnings = [];
        // Validate structure
        this.validateStructure(permissions, errors);
        // Validate patterns
        this.validatePatterns(permissions, errors, warnings);
        // Check for conflicts
        this.detectConflicts(permissions, errors, warnings);
        // Security recommendations
        this.addSecurityRecommendations(permissions, warnings);
        var securityScore = this.calculateSecurityScore(permissions);
        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            inheritanceValid: true, // No parent to compare
            securityScore: securityScore,
        };
    };
    /**
     * Check if child can inherit from parent
     */
    PermissionValidator.prototype.canInherit = function (parent, child) {
        var result = this.validateInheritance(parent, child);
        return result.inheritanceValid;
    };
    /**
     * Create a restricted child permission matrix
     */
    PermissionValidator.prototype.createRestrictedChild = function (parent, restrictions) {
        var child = {
            coreTools: this.intersectCoreTools(parent.coreTools, restrictions.coreTools || parent.coreTools),
            bash: this.restrictBash(parent.bash, restrictions.bash),
            fileSystem: this.restrictFileSystem(parent.fileSystem, restrictions.fileSystem),
            mcpTools: this.restrictMcp(parent.mcpTools, restrictions.mcpTools),
            network: this.restrictNetwork(parent.network, restrictions.network),
            models: this.restrictModels(parent.models, restrictions.models),
        };
        // Validate the result
        var validation = this.validateInheritance(parent, child);
        if (!validation.valid) {
            throw new PermissionValidationError('Failed to create valid restricted child', validation.errors);
        }
        return child;
    };
    // ==================== Private Validation Methods ====================
    PermissionValidator.prototype.validateCoreToolInheritance = function (parent, child, errors) {
        var tools = [
            'read',
            'write',
            'edit',
            'glob',
            'grep',
            'task',
            'webFetch',
            'webSearch',
            'todoWrite',
            'ls',
            'notebookEdit',
        ];
        for (var _i = 0, tools_1 = tools; _i < tools_1.length; _i++) {
            var tool = tools_1[_i];
            if (!parent[tool] && child[tool]) {
                errors.push({
                    code: 'INHERITANCE_VIOLATION',
                    message: "Child cannot have ".concat(tool, " permission when parent doesn't"),
                    field: "coreTools.".concat(tool),
                    parentValue: parent[tool],
                    childValue: child[tool],
                });
            }
        }
    };
    PermissionValidator.prototype.validateBashInheritance = function (parent, child, errors, warnings) {
        // Can't enable bash if parent disabled
        if (!parent.enabled && child.enabled) {
            errors.push({
                code: 'INHERITANCE_VIOLATION',
                message: 'Child cannot enable bash when parent has it disabled',
                field: 'bash.enabled',
                parentValue: false,
                childValue: true,
            });
        }
        // Can't disable sandbox if parent has it enabled
        if (parent.sandboxed && !child.sandboxed) {
            errors.push({
                code: 'INHERITANCE_VIOLATION',
                message: 'Child cannot disable sandbox when parent requires it',
                field: 'bash.sandboxed',
                parentValue: true,
                childValue: false,
            });
        }
        // Allowed patterns must be subset
        if (child.allowedPatterns) {
            for (var _i = 0, _a = child.allowedPatterns; _i < _a.length; _i++) {
                var pattern = _a[_i];
                if (!this.patternIsSubset(pattern, parent.allowedPatterns || [])) {
                    errors.push({
                        code: 'INHERITANCE_VIOLATION',
                        message: "Child bash pattern \"".concat(pattern, "\" not allowed by parent"),
                        field: 'bash.allowedPatterns',
                        parentValue: parent.allowedPatterns,
                        childValue: pattern,
                    });
                }
            }
        }
        // Warn about missing denied patterns
        if (parent.deniedPatterns && parent.deniedPatterns.length > 0) {
            var childDenied = new Set(child.deniedPatterns || []);
            for (var _b = 0, _c = parent.deniedPatterns; _b < _c.length; _b++) {
                var pattern = _c[_b];
                if (!childDenied.has(pattern)) {
                    warnings.push({
                        code: 'SECURITY_RECOMMENDATION',
                        message: "Parent denies pattern \"".concat(pattern, "\" but child doesn't explicitly deny it"),
                        field: 'bash.deniedPatterns',
                        recommendation: 'Consider explicitly denying this pattern in child',
                    });
                }
            }
        }
    };
    PermissionValidator.prototype.validateFileSystemInheritance = function (parent, child, errors, warnings) {
        // Read patterns must be subset
        if (child.readPatterns) {
            for (var _i = 0, _a = child.readPatterns; _i < _a.length; _i++) {
                var pattern = _a[_i];
                if (!this.globIsSubset(pattern, parent.readPatterns || [])) {
                    errors.push({
                        code: 'INHERITANCE_VIOLATION',
                        message: "Child read pattern \"".concat(pattern, "\" exceeds parent permissions"),
                        field: 'fileSystem.readPatterns',
                        parentValue: parent.readPatterns,
                        childValue: pattern,
                    });
                }
            }
        }
        // Write patterns must be subset
        if (child.writePatterns) {
            for (var _b = 0, _c = child.writePatterns; _b < _c.length; _b++) {
                var pattern = _c[_b];
                if (!this.globIsSubset(pattern, parent.writePatterns || [])) {
                    errors.push({
                        code: 'INHERITANCE_VIOLATION',
                        message: "Child write pattern \"".concat(pattern, "\" exceeds parent permissions"),
                        field: 'fileSystem.writePatterns',
                        parentValue: parent.writePatterns,
                        childValue: pattern,
                    });
                }
            }
        }
        // Child should inherit deny patterns
        if (parent.denyPatterns && parent.denyPatterns.length > 0) {
            var childDeny = new Set(child.denyPatterns || []);
            for (var _d = 0, _e = parent.denyPatterns; _d < _e.length; _d++) {
                var pattern = _e[_d];
                if (!childDeny.has(pattern)) {
                    warnings.push({
                        code: 'SECURITY_RECOMMENDATION',
                        message: "Parent denies path \"".concat(pattern, "\" but child doesn't"),
                        field: 'fileSystem.denyPatterns',
                        recommendation: 'Inherit deny patterns from parent',
                    });
                }
            }
        }
    };
    PermissionValidator.prototype.validateMcpInheritance = function (parent, child, errors) {
        var _a;
        // Child allowed tools must be subset of parent
        if (child.allowed) {
            var parentAllowed = new Set(parent.allowed || []);
            for (var _i = 0, _b = child.allowed; _i < _b.length; _i++) {
                var tool = _b[_i];
                if (!parentAllowed.has(tool) && !this.matchesWildcard(tool, parent.allowed || [])) {
                    errors.push({
                        code: 'INHERITANCE_VIOLATION',
                        message: "Child MCP tool \"".concat(tool, "\" not allowed by parent"),
                        field: 'mcpTools.allowed',
                        parentValue: parent.allowed,
                        childValue: tool,
                    });
                }
            }
        }
        // Child must inherit parent's denied tools
        if (parent.denied) {
            var childDenied = new Set(child.denied || []);
            for (var _c = 0, _d = parent.denied; _c < _d.length; _c++) {
                var tool = _d[_c];
                // Check if child allows a tool that parent denies
                if ((_a = child.allowed) === null || _a === void 0 ? void 0 : _a.includes(tool)) {
                    errors.push({
                        code: 'INHERITANCE_VIOLATION',
                        message: "Child allows MCP tool \"".concat(tool, "\" that parent denies"),
                        field: 'mcpTools.denied',
                        parentValue: parent.denied,
                        childValue: child.allowed,
                    });
                }
            }
        }
    };
    PermissionValidator.prototype.validateNetworkInheritance = function (parent, child, errors) {
        // Can't enable network if parent disabled
        if (!parent.enabled && child.enabled) {
            errors.push({
                code: 'INHERITANCE_VIOLATION',
                message: 'Child cannot enable network when parent has it disabled',
                field: 'network.enabled',
                parentValue: false,
                childValue: true,
            });
        }
        // Allowed domains must be subset
        if (child.allowedDomains) {
            for (var _i = 0, _a = child.allowedDomains; _i < _a.length; _i++) {
                var domain = _a[_i];
                if (!this.domainIsAllowed(domain, parent.allowedDomains || [])) {
                    errors.push({
                        code: 'INHERITANCE_VIOLATION',
                        message: "Child network domain \"".concat(domain, "\" not allowed by parent"),
                        field: 'network.allowedDomains',
                        parentValue: parent.allowedDomains,
                        childValue: domain,
                    });
                }
            }
        }
    };
    PermissionValidator.prototype.validateModelInheritance = function (parent, child, errors) {
        // Child allowed models must be subset
        if (child.allowed) {
            var parentAllowed = new Set(parent.allowed || ['haiku', 'sonnet', 'opus']);
            for (var _i = 0, _a = child.allowed; _i < _a.length; _i++) {
                var model = _a[_i];
                if (!parentAllowed.has(model)) {
                    errors.push({
                        code: 'INHERITANCE_VIOLATION',
                        message: "Child model \"".concat(model, "\" not allowed by parent"),
                        field: 'models.allowed',
                        parentValue: parent.allowed,
                        childValue: model,
                    });
                }
            }
        }
    };
    PermissionValidator.prototype.validateStructure = function (permissions, errors) {
        // Check required fields
        if (!permissions.coreTools) {
            errors.push({
                code: 'MISSING_REQUIRED',
                message: 'coreTools is required',
                field: 'coreTools',
            });
        }
        if (!permissions.bash) {
            errors.push({
                code: 'MISSING_REQUIRED',
                message: 'bash is required',
                field: 'bash',
            });
        }
        if (!permissions.fileSystem) {
            errors.push({
                code: 'MISSING_REQUIRED',
                message: 'fileSystem is required',
                field: 'fileSystem',
            });
        }
    };
    PermissionValidator.prototype.validatePatterns = function (permissions, errors, warnings) {
        var _a, _b;
        // Validate regex patterns in bash
        if ((_a = permissions.bash) === null || _a === void 0 ? void 0 : _a.allowedPatterns) {
            for (var _i = 0, _c = permissions.bash.allowedPatterns; _i < _c.length; _i++) {
                var pattern = _c[_i];
                try {
                    new RegExp(pattern);
                }
                catch (_d) {
                    errors.push({
                        code: 'INVALID_PATTERN',
                        message: "Invalid regex pattern in bash.allowedPatterns: ".concat(pattern),
                        field: 'bash.allowedPatterns',
                    });
                }
            }
        }
        // Validate glob patterns in fileSystem
        if ((_b = permissions.fileSystem) === null || _b === void 0 ? void 0 : _b.readPatterns) {
            for (var _e = 0, _f = permissions.fileSystem.readPatterns; _e < _f.length; _e++) {
                var pattern = _f[_e];
                if (!this.isValidGlob(pattern)) {
                    warnings.push({
                        code: 'DEPRECATED_PATTERN',
                        message: "Potentially invalid glob pattern: ".concat(pattern),
                        field: 'fileSystem.readPatterns',
                        recommendation: 'Use standard glob syntax',
                    });
                }
            }
        }
    };
    PermissionValidator.prototype.detectConflicts = function (permissions, errors, warnings) {
        var _a, _b, _c, _d, _e, _f;
        // Check if file read patterns conflict with deny patterns
        if (((_a = permissions.fileSystem) === null || _a === void 0 ? void 0 : _a.readPatterns) && ((_b = permissions.fileSystem) === null || _b === void 0 ? void 0 : _b.denyPatterns)) {
            for (var _i = 0, _g = permissions.fileSystem.readPatterns; _i < _g.length; _i++) {
                var readPattern = _g[_i];
                for (var _h = 0, _j = permissions.fileSystem.denyPatterns; _h < _j.length; _h++) {
                    var denyPattern = _j[_h];
                    if (this.patternsOverlap(readPattern, denyPattern)) {
                        warnings.push({
                            code: 'SECURITY_RECOMMENDATION',
                            message: "Read pattern \"".concat(readPattern, "\" may conflict with deny pattern \"").concat(denyPattern, "\""),
                            field: 'fileSystem',
                            recommendation: 'Review patterns to ensure deny takes precedence',
                        });
                    }
                }
            }
        }
        // Check for overly permissive patterns
        if ((_d = (_c = permissions.fileSystem) === null || _c === void 0 ? void 0 : _c.readPatterns) === null || _d === void 0 ? void 0 : _d.includes('**/*')) {
            warnings.push({
                code: 'OVERLY_PERMISSIVE',
                message: 'Read pattern "**/*" allows access to all files',
                field: 'fileSystem.readPatterns',
                recommendation: 'Consider restricting to specific directories',
            });
        }
        if ((_f = (_e = permissions.bash) === null || _e === void 0 ? void 0 : _e.allowedPatterns) === null || _f === void 0 ? void 0 : _f.includes('.*')) {
            warnings.push({
                code: 'OVERLY_PERMISSIVE',
                message: 'Bash pattern ".*" allows all commands',
                field: 'bash.allowedPatterns',
                recommendation: 'Consider restricting to specific commands',
            });
        }
    };
    PermissionValidator.prototype.addSecurityRecommendations = function (permissions, warnings) {
        var _a, _b, _c, _d, _e;
        // Recommend sandbox for bash
        if (((_a = permissions.bash) === null || _a === void 0 ? void 0 : _a.enabled) && !((_b = permissions.bash) === null || _b === void 0 ? void 0 : _b.sandboxed)) {
            warnings.push({
                code: 'SECURITY_RECOMMENDATION',
                message: 'Bash is enabled without sandbox',
                field: 'bash.sandboxed',
                recommendation: 'Consider enabling sandbox for bash commands',
            });
        }
        // Recommend network restrictions
        if (((_c = permissions.network) === null || _c === void 0 ? void 0 : _c.enabled) &&
            (!((_d = permissions.network) === null || _d === void 0 ? void 0 : _d.allowedDomains) ||
                permissions.network.allowedDomains.length === 0)) {
            warnings.push({
                code: 'SECURITY_RECOMMENDATION',
                message: 'Network enabled without domain restrictions',
                field: 'network.allowedDomains',
                recommendation: 'Consider restricting to specific domains',
            });
        }
        // Recommend MCP restrictions
        if (((_e = permissions.mcpTools) === null || _e === void 0 ? void 0 : _e.allowed) &&
            permissions.mcpTools.allowed.includes('*')) {
            warnings.push({
                code: 'OVERLY_PERMISSIVE',
                message: 'All MCP tools allowed with wildcard',
                field: 'mcpTools.allowed',
                recommendation: 'Consider listing specific allowed tools',
            });
        }
    };
    PermissionValidator.prototype.calculateSecurityScore = function (permissions) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
        var score = 100;
        // Deduct for enabled features
        if ((_a = permissions.bash) === null || _a === void 0 ? void 0 : _a.enabled)
            score -= 15;
        if (((_b = permissions.bash) === null || _b === void 0 ? void 0 : _b.enabled) && !((_c = permissions.bash) === null || _c === void 0 ? void 0 : _c.sandboxed))
            score -= 10;
        if ((_d = permissions.network) === null || _d === void 0 ? void 0 : _d.enabled)
            score -= 10;
        if ((_e = permissions.coreTools) === null || _e === void 0 ? void 0 : _e.write)
            score -= 5;
        if ((_f = permissions.coreTools) === null || _f === void 0 ? void 0 : _f.edit)
            score -= 5;
        if ((_g = permissions.coreTools) === null || _g === void 0 ? void 0 : _g.task)
            score -= 5;
        // Deduct for overly permissive patterns
        if ((_j = (_h = permissions.fileSystem) === null || _h === void 0 ? void 0 : _h.readPatterns) === null || _j === void 0 ? void 0 : _j.includes('**/*'))
            score -= 15;
        if ((_l = (_k = permissions.fileSystem) === null || _k === void 0 ? void 0 : _k.writePatterns) === null || _l === void 0 ? void 0 : _l.includes('**/*'))
            score -= 20;
        if ((_o = (_m = permissions.bash) === null || _m === void 0 ? void 0 : _m.allowedPatterns) === null || _o === void 0 ? void 0 : _o.includes('.*'))
            score -= 20;
        if ((_q = (_p = permissions.mcpTools) === null || _p === void 0 ? void 0 : _p.allowed) === null || _q === void 0 ? void 0 : _q.includes('*'))
            score -= 10;
        // Add for restrictions
        if ((_s = (_r = permissions.fileSystem) === null || _r === void 0 ? void 0 : _r.denyPatterns) === null || _s === void 0 ? void 0 : _s.length)
            score += 5;
        if ((_u = (_t = permissions.bash) === null || _t === void 0 ? void 0 : _t.deniedPatterns) === null || _u === void 0 ? void 0 : _u.length)
            score += 5;
        if ((_w = (_v = permissions.network) === null || _v === void 0 ? void 0 : _v.deniedDomains) === null || _w === void 0 ? void 0 : _w.length)
            score += 5;
        return Math.max(0, Math.min(100, score));
    };
    // ==================== Helper Methods ====================
    PermissionValidator.prototype.patternIsSubset = function (pattern, parentPatterns) {
        // Check if pattern is explicitly in parent patterns
        if (parentPatterns.includes(pattern))
            return true;
        // Check if any parent pattern is more permissive
        for (var _i = 0, parentPatterns_1 = parentPatterns; _i < parentPatterns_1.length; _i++) {
            var parentPattern = parentPatterns_1[_i];
            if (parentPattern === '.*')
                return true; // Parent allows everything
            try {
                var parentRegex = new RegExp("^".concat(parentPattern, "$"));
                if (parentRegex.test(pattern))
                    return true;
            }
            catch (_a) {
                // Invalid regex, skip
            }
        }
        return false;
    };
    PermissionValidator.prototype.globIsSubset = function (pattern, parentPatterns) {
        // Check if pattern is explicitly in parent patterns
        if (parentPatterns.includes(pattern))
            return true;
        // Check for wildcard patterns
        for (var _i = 0, parentPatterns_2 = parentPatterns; _i < parentPatterns_2.length; _i++) {
            var parentPattern = parentPatterns_2[_i];
            if (parentPattern === '**/*')
                return true; // Parent allows everything
            if (this.globMatches(parentPattern, pattern))
                return true;
        }
        return false;
    };
    PermissionValidator.prototype.globMatches = function (pattern, path) {
        // Simple glob matching (** matches any path, * matches single level)
        var regexPattern = pattern
            .replace(/\*\*/g, '{{DOUBLE_STAR}}')
            .replace(/\*/g, '[^/]*')
            .replace(/{{DOUBLE_STAR}}/g, '.*')
            .replace(/\//g, '\\/');
        try {
            var regex = new RegExp("^".concat(regexPattern, "$"));
            return regex.test(path);
        }
        catch (_a) {
            return pattern === path;
        }
    };
    PermissionValidator.prototype.domainIsAllowed = function (domain, allowedDomains) {
        if (allowedDomains.includes(domain))
            return true;
        // Check for wildcard subdomains
        for (var _i = 0, allowedDomains_1 = allowedDomains; _i < allowedDomains_1.length; _i++) {
            var allowed = allowedDomains_1[_i];
            if (allowed.startsWith('*.')) {
                var baseDomain = allowed.slice(2);
                if (domain === baseDomain || domain.endsWith(".".concat(baseDomain))) {
                    return true;
                }
            }
        }
        return false;
    };
    PermissionValidator.prototype.matchesWildcard = function (tool, allowedTools) {
        for (var _i = 0, allowedTools_1 = allowedTools; _i < allowedTools_1.length; _i++) {
            var allowed = allowedTools_1[_i];
            if (allowed === '*')
                return true;
            if (allowed.endsWith('*')) {
                var prefix = allowed.slice(0, -1);
                if (tool.startsWith(prefix))
                    return true;
            }
        }
        return false;
    };
    PermissionValidator.prototype.isValidGlob = function (pattern) {
        // Basic validation - check for common glob characters
        return /^[a-zA-Z0-9_\-./\*\?\[\]{}]+$/.test(pattern);
    };
    PermissionValidator.prototype.patternsOverlap = function (pattern1, pattern2) {
        // Simplified overlap detection
        if (pattern1 === pattern2)
            return true;
        if (pattern1.includes(pattern2) || pattern2.includes(pattern1))
            return true;
        return false;
    };
    PermissionValidator.prototype.intersectCoreTools = function (parent, child) {
        return {
            read: parent.read && child.read,
            write: parent.write && child.write,
            edit: parent.edit && child.edit,
            glob: parent.glob && child.glob,
            grep: parent.grep && child.grep,
            task: parent.task && child.task,
            webFetch: parent.webFetch && child.webFetch,
            webSearch: parent.webSearch && child.webSearch,
            todoWrite: parent.todoWrite && child.todoWrite,
            ls: parent.ls && child.ls,
            notebookEdit: parent.notebookEdit && child.notebookEdit,
        };
    };
    PermissionValidator.prototype.restrictBash = function (parent, child) {
        var _a, _b, _c, _d;
        return {
            enabled: parent.enabled && ((_a = child === null || child === void 0 ? void 0 : child.enabled) !== null && _a !== void 0 ? _a : parent.enabled),
            sandboxed: parent.sandboxed || ((_b = child === null || child === void 0 ? void 0 : child.sandboxed) !== null && _b !== void 0 ? _b : false),
            allowedPatterns: (child === null || child === void 0 ? void 0 : child.allowedPatterns) || parent.allowedPatterns,
            deniedPatterns: __spreadArray(__spreadArray([], (parent.deniedPatterns || []), true), ((child === null || child === void 0 ? void 0 : child.deniedPatterns) || []), true),
            maxExecutionTimeMs: Math.min(parent.maxExecutionTimeMs, (_c = child === null || child === void 0 ? void 0 : child.maxExecutionTimeMs) !== null && _c !== void 0 ? _c : parent.maxExecutionTimeMs),
            allowBackground: parent.allowBackground && ((_d = child === null || child === void 0 ? void 0 : child.allowBackground) !== null && _d !== void 0 ? _d : parent.allowBackground),
            environmentOverrides: __assign(__assign({}, parent.environmentOverrides), child === null || child === void 0 ? void 0 : child.environmentOverrides),
            workingDirectoryPattern: (child === null || child === void 0 ? void 0 : child.workingDirectoryPattern) || parent.workingDirectoryPattern,
        };
    };
    PermissionValidator.prototype.restrictFileSystem = function (parent, child) {
        var _a, _b, _c;
        return {
            readPatterns: (child === null || child === void 0 ? void 0 : child.readPatterns) || parent.readPatterns,
            writePatterns: (child === null || child === void 0 ? void 0 : child.writePatterns) || parent.writePatterns,
            denyPatterns: __spreadArray(__spreadArray([], (parent.denyPatterns || []), true), ((child === null || child === void 0 ? void 0 : child.denyPatterns) || []), true),
            maxReadSizeBytes: Math.min(parent.maxReadSizeBytes, (_a = child === null || child === void 0 ? void 0 : child.maxReadSizeBytes) !== null && _a !== void 0 ? _a : parent.maxReadSizeBytes),
            maxWriteSizeBytes: Math.min(parent.maxWriteSizeBytes, (_b = child === null || child === void 0 ? void 0 : child.maxWriteSizeBytes) !== null && _b !== void 0 ? _b : parent.maxWriteSizeBytes),
            maxTotalWriteBytes: Math.min(parent.maxTotalWriteBytes, (_c = child === null || child === void 0 ? void 0 : child.maxTotalWriteBytes) !== null && _c !== void 0 ? _c : parent.maxTotalWriteBytes),
            allowedReadExtensions: (child === null || child === void 0 ? void 0 : child.allowedReadExtensions) || parent.allowedReadExtensions,
            allowedWriteExtensions: (child === null || child === void 0 ? void 0 : child.allowedWriteExtensions) || parent.allowedWriteExtensions,
        };
    };
    PermissionValidator.prototype.restrictMcp = function (parent, child) {
        var _a, _b, _c, _d, _e, _f;
        // Merge rate limits, taking the more restrictive values
        var mergedRateLimits = {};
        var allTools = new Set(__spreadArray(__spreadArray([], Object.keys(parent.rateLimits || {}), true), Object.keys((child === null || child === void 0 ? void 0 : child.rateLimits) || {}), true));
        for (var _i = 0, allTools_1 = allTools; _i < allTools_1.length; _i++) {
            var tool = allTools_1[_i];
            var parentLimit = (_a = parent.rateLimits) === null || _a === void 0 ? void 0 : _a[tool];
            var childLimit = (_b = child === null || child === void 0 ? void 0 : child.rateLimits) === null || _b === void 0 ? void 0 : _b[tool];
            mergedRateLimits[tool] = {
                maxCallsPerMinute: Math.min((_c = parentLimit === null || parentLimit === void 0 ? void 0 : parentLimit.maxCallsPerMinute) !== null && _c !== void 0 ? _c : Infinity, (_d = childLimit === null || childLimit === void 0 ? void 0 : childLimit.maxCallsPerMinute) !== null && _d !== void 0 ? _d : Infinity),
                maxCallsPerHour: Math.min((_e = parentLimit === null || parentLimit === void 0 ? void 0 : parentLimit.maxCallsPerHour) !== null && _e !== void 0 ? _e : Infinity, (_f = childLimit === null || childLimit === void 0 ? void 0 : childLimit.maxCallsPerHour) !== null && _f !== void 0 ? _f : Infinity),
            };
        }
        return {
            allowed: (child === null || child === void 0 ? void 0 : child.allowed) || parent.allowed,
            denied: __spreadArray(__spreadArray([], (parent.denied || []), true), ((child === null || child === void 0 ? void 0 : child.denied) || []), true),
            rateLimits: Object.keys(mergedRateLimits).length > 0 ? mergedRateLimits : undefined,
        };
    };
    PermissionValidator.prototype.restrictNetwork = function (parent, child) {
        var _a, _b, _c, _d, _e;
        // Intersect allowed protocols (child can only use what parent allows)
        var parentProtocols = new Set(parent.allowedProtocols);
        var childProtocols = (child === null || child === void 0 ? void 0 : child.allowedProtocols) || parent.allowedProtocols;
        var allowedProtocols = childProtocols.filter(function (p) { return parentProtocols.has(p); });
        return {
            enabled: parent.enabled && ((_a = child === null || child === void 0 ? void 0 : child.enabled) !== null && _a !== void 0 ? _a : parent.enabled),
            allowedDomains: (child === null || child === void 0 ? void 0 : child.allowedDomains) || parent.allowedDomains,
            deniedDomains: __spreadArray(__spreadArray([], (parent.deniedDomains || []), true), ((child === null || child === void 0 ? void 0 : child.deniedDomains) || []), true),
            allowedProtocols: allowedProtocols,
            maxRequestSizeBytes: Math.min(parent.maxRequestSizeBytes, (_b = child === null || child === void 0 ? void 0 : child.maxRequestSizeBytes) !== null && _b !== void 0 ? _b : parent.maxRequestSizeBytes),
            maxResponseSizeBytes: Math.min(parent.maxResponseSizeBytes, (_c = child === null || child === void 0 ? void 0 : child.maxResponseSizeBytes) !== null && _c !== void 0 ? _c : parent.maxResponseSizeBytes),
            requestTimeoutMs: Math.min(parent.requestTimeoutMs, (_d = child === null || child === void 0 ? void 0 : child.requestTimeoutMs) !== null && _d !== void 0 ? _d : parent.requestTimeoutMs),
            maxConcurrentRequests: Math.min(parent.maxConcurrentRequests, (_e = child === null || child === void 0 ? void 0 : child.maxConcurrentRequests) !== null && _e !== void 0 ? _e : parent.maxConcurrentRequests),
        };
    };
    PermissionValidator.prototype.restrictModels = function (parent, child) {
        var _a, _b, _c;
        var parentAllowed = new Set(parent.allowed || ['haiku', 'sonnet', 'opus']);
        var childAllowed = (child === null || child === void 0 ? void 0 : child.allowed) || parent.allowed;
        // Merge maxTokensPerModel, taking minimum values
        var maxTokensPerModel = {};
        var models = ['haiku', 'sonnet', 'opus'];
        for (var _i = 0, models_1 = models; _i < models_1.length; _i++) {
            var model = models_1[_i];
            var parentMax = (_a = parent.maxTokensPerModel) === null || _a === void 0 ? void 0 : _a[model];
            var childMax = (_b = child === null || child === void 0 ? void 0 : child.maxTokensPerModel) === null || _b === void 0 ? void 0 : _b[model];
            if (parentMax !== undefined || childMax !== undefined) {
                maxTokensPerModel[model] = Math.min(parentMax !== null && parentMax !== void 0 ? parentMax : Infinity, childMax !== null && childMax !== void 0 ? childMax : Infinity);
                if (maxTokensPerModel[model] === Infinity) {
                    delete maxTokensPerModel[model];
                }
            }
        }
        return {
            allowed: (childAllowed === null || childAllowed === void 0 ? void 0 : childAllowed.filter(function (m) { return parentAllowed.has(m); })) || parent.allowed,
            preferredForSpawning: (child === null || child === void 0 ? void 0 : child.preferredForSpawning) || parent.preferredForSpawning,
            maxTokensPerModel: maxTokensPerModel,
            // Child can only escalate if parent allows it
            allowEscalation: parent.allowEscalation && ((_c = child === null || child === void 0 ? void 0 : child.allowEscalation) !== null && _c !== void 0 ? _c : parent.allowEscalation),
        };
    };
    return PermissionValidator;
}());
exports.PermissionValidator = PermissionValidator;
/**
 * Error thrown during permission validation
 */
var PermissionValidationError = /** @class */ (function (_super) {
    __extends(PermissionValidationError, _super);
    function PermissionValidationError(message, errors) {
        var _this = _super.call(this, message) || this;
        _this.errors = errors;
        _this.name = 'PermissionValidationError';
        return _this;
    }
    return PermissionValidationError;
}(Error));
exports.PermissionValidationError = PermissionValidationError;
/**
 * Convenience function to create a validator
 */
function createValidator(options) {
    return new PermissionValidator(options);
}
/**
 * Quick validation function
 */
function validatePermissions(permissions) {
    return new PermissionValidator().validate(permissions);
}
/**
 * Quick inheritance validation function
 */
function validateInheritance(parent, child) {
    return new PermissionValidator().validateInheritance(parent, child);
}
