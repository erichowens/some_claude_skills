"use strict";
/**
 * Permission Enforcer - Runtime enforcement of permissions
 *
 * Intercepts tool calls and file operations to ensure they comply
 * with the active permission matrix. Acts as a security boundary.
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
exports.PermissionDeniedError = exports.PermissionEnforcer = void 0;
exports.createEnforcer = createEnforcer;
exports.createStrictEnforcer = createStrictEnforcer;
exports.createPermissiveEnforcer = createPermissiveEnforcer;
/**
 * Permission Enforcer class
 */
var PermissionEnforcer = /** @class */ (function () {
    function PermissionEnforcer(permissions, options) {
        if (options === void 0) { options = {}; }
        this.auditLog = [];
        this.permissions = permissions;
        this.isolationLevel = options.isolationLevel || 'moderate';
        this.maxAuditEntries = options.maxAuditEntries || 1000;
    }
    /**
     * Check if a request is allowed
     */
    PermissionEnforcer.prototype.check = function (request) {
        var startTime = Date.now();
        var result;
        switch (request.type) {
            case 'tool':
                result = this.checkToolPermission(request.resource);
                break;
            case 'file_read':
                result = this.checkFileReadPermission(request.resource);
                break;
            case 'file_write':
                result = this.checkFileWritePermission(request.resource);
                break;
            case 'bash':
                result = this.checkBashPermission(request.resource);
                break;
            case 'mcp':
                result = this.checkMcpPermission(request.resource);
                break;
            case 'network':
                result = this.checkNetworkPermission(request.resource);
                break;
            case 'model':
                result = this.checkModelPermission(request.resource);
                break;
            default:
                result = {
                    allowed: false,
                    reason: "Unknown request type: ".concat(request.type),
                    violations: [{
                            type: 'tool_denied',
                            resource: request.resource,
                            permission: request.type,
                            message: 'Unknown request type',
                            severity: 'error',
                        }],
                };
        }
        // Log the check
        this.audit({
            timestamp: new Date(),
            request: request,
            result: result,
            durationMs: Date.now() - startTime,
        });
        return result;
    };
    /**
     * Enforce permission (throws if denied)
     */
    PermissionEnforcer.prototype.enforce = function (request) {
        var result = this.check(request);
        if (!result.allowed) {
            throw new PermissionDeniedError(result.reason || 'Permission denied', result.violations);
        }
    };
    /**
     * Check multiple requests at once
     */
    PermissionEnforcer.prototype.checkAll = function (requests) {
        var results = new Map();
        for (var _i = 0, requests_1 = requests; _i < requests_1.length; _i++) {
            var request = requests_1[_i];
            results.set(request, this.check(request));
        }
        return results;
    };
    /**
     * Update permissions (for dynamic permission changes)
     */
    PermissionEnforcer.prototype.updatePermissions = function (permissions) {
        this.permissions = permissions;
        this.audit({
            timestamp: new Date(),
            request: { type: 'tool', resource: 'permissions_update' },
            result: { allowed: true, violations: [] },
            durationMs: 0,
            metadata: { action: 'permissions_updated' },
        });
    };
    /**
     * Get current permissions
     */
    PermissionEnforcer.prototype.getPermissions = function () {
        return __assign({}, this.permissions);
    };
    /**
     * Get audit log
     */
    PermissionEnforcer.prototype.getAuditLog = function (options) {
        var log = __spreadArray([], this.auditLog, true);
        if (options === null || options === void 0 ? void 0 : options.filter) {
            log = log.filter(options.filter);
        }
        if (options === null || options === void 0 ? void 0 : options.limit) {
            log = log.slice(-options.limit);
        }
        return log;
    };
    /**
     * Clear audit log
     */
    PermissionEnforcer.prototype.clearAuditLog = function () {
        this.auditLog = [];
    };
    // ==================== Private Check Methods ====================
    PermissionEnforcer.prototype.checkToolPermission = function (tool) {
        var violations = [];
        var toolMap = {
            'Read': 'read',
            'Write': 'write',
            'Edit': 'edit',
            'Glob': 'glob',
            'Grep': 'grep',
            'Task': 'task',
            'WebFetch': 'webFetch',
            'WebSearch': 'webSearch',
            'TodoWrite': 'todoWrite',
            'Ls': 'ls',
            'NotebookEdit': 'notebookEdit',
        };
        var permissionKey = toolMap[tool];
        if (permissionKey && !this.permissions.coreTools[permissionKey]) {
            violations.push({
                type: 'tool_denied',
                resource: tool,
                permission: "coreTools.".concat(permissionKey),
                message: "Tool \"".concat(tool, "\" is not allowed"),
                severity: 'error',
            });
        }
        return {
            allowed: violations.length === 0,
            reason: violations.length > 0 ? violations[0].message : undefined,
            violations: violations,
        };
    };
    PermissionEnforcer.prototype.checkFileReadPermission = function (path) {
        var _this = this;
        var violations = [];
        var suggestions = [];
        // Check deny patterns first (they take precedence)
        if (this.permissions.fileSystem.denyPatterns) {
            for (var _i = 0, _a = this.permissions.fileSystem.denyPatterns; _i < _a.length; _i++) {
                var pattern = _a[_i];
                if (this.matchesGlob(path, pattern)) {
                    violations.push({
                        type: 'file_read_denied',
                        resource: path,
                        permission: 'fileSystem.denyPatterns',
                        message: "Path \"".concat(path, "\" matches deny pattern \"").concat(pattern, "\""),
                        severity: 'error',
                    });
                    return { allowed: false, reason: violations[0].message, violations: violations };
                }
            }
        }
        // Check if path matches any allowed pattern
        var readPatterns = this.permissions.fileSystem.readPatterns || [];
        var isAllowed = readPatterns.length === 0 ||
            readPatterns.some(function (pattern) { return _this.matchesGlob(path, pattern); });
        if (!isAllowed) {
            violations.push({
                type: 'file_read_denied',
                resource: path,
                permission: 'fileSystem.readPatterns',
                message: "Path \"".concat(path, "\" does not match any allowed read pattern"),
                severity: 'error',
            });
            // Suggest similar allowed patterns
            var similar = this.findSimilarPatterns(path, readPatterns);
            if (similar.length > 0) {
                suggestions.push("Similar allowed patterns: ".concat(similar.join(', ')));
            }
        }
        return {
            allowed: violations.length === 0,
            reason: violations.length > 0 ? violations[0].message : undefined,
            violations: violations,
            suggestions: suggestions.length > 0 ? suggestions : undefined,
        };
    };
    PermissionEnforcer.prototype.checkFileWritePermission = function (path) {
        var _this = this;
        var violations = [];
        // Check deny patterns first
        if (this.permissions.fileSystem.denyPatterns) {
            for (var _i = 0, _a = this.permissions.fileSystem.denyPatterns; _i < _a.length; _i++) {
                var pattern = _a[_i];
                if (this.matchesGlob(path, pattern)) {
                    violations.push({
                        type: 'file_write_denied',
                        resource: path,
                        permission: 'fileSystem.denyPatterns',
                        message: "Path \"".concat(path, "\" matches deny pattern \"").concat(pattern, "\""),
                        severity: 'error',
                    });
                    return { allowed: false, reason: violations[0].message, violations: violations };
                }
            }
        }
        // Check write tool permission
        if (!this.permissions.coreTools.write && !this.permissions.coreTools.edit) {
            violations.push({
                type: 'file_write_denied',
                resource: path,
                permission: 'coreTools.write',
                message: 'Write operations are not allowed',
                severity: 'error',
            });
            return { allowed: false, reason: violations[0].message, violations: violations };
        }
        // Check if path matches any allowed write pattern
        var writePatterns = this.permissions.fileSystem.writePatterns || [];
        var isAllowed = writePatterns.length === 0 ||
            writePatterns.some(function (pattern) { return _this.matchesGlob(path, pattern); });
        if (!isAllowed) {
            violations.push({
                type: 'file_write_denied',
                resource: path,
                permission: 'fileSystem.writePatterns',
                message: "Path \"".concat(path, "\" does not match any allowed write pattern"),
                severity: 'error',
            });
        }
        return {
            allowed: violations.length === 0,
            reason: violations.length > 0 ? violations[0].message : undefined,
            violations: violations,
        };
    };
    PermissionEnforcer.prototype.checkBashPermission = function (command) {
        var _this = this;
        var violations = [];
        // Check if bash is enabled
        if (!this.permissions.bash.enabled) {
            violations.push({
                type: 'bash_denied',
                resource: command,
                permission: 'bash.enabled',
                message: 'Bash commands are not allowed',
                severity: 'error',
            });
            return { allowed: false, reason: violations[0].message, violations: violations };
        }
        // Check denied patterns first
        if (this.permissions.bash.deniedPatterns) {
            for (var _i = 0, _a = this.permissions.bash.deniedPatterns; _i < _a.length; _i++) {
                var pattern = _a[_i];
                if (this.matchesRegex(command, pattern)) {
                    violations.push({
                        type: 'bash_pattern_denied',
                        resource: command,
                        permission: 'bash.deniedPatterns',
                        message: "Command matches denied pattern \"".concat(pattern, "\""),
                        severity: 'error',
                    });
                    return { allowed: false, reason: violations[0].message, violations: violations };
                }
            }
        }
        // Check if command matches any allowed pattern
        var allowedPatterns = this.permissions.bash.allowedPatterns || [];
        if (allowedPatterns.length > 0) {
            var isAllowed = allowedPatterns.some(function (pattern) {
                return _this.matchesRegex(command, pattern);
            });
            if (!isAllowed) {
                violations.push({
                    type: 'bash_pattern_denied',
                    resource: command,
                    permission: 'bash.allowedPatterns',
                    message: 'Command does not match any allowed pattern',
                    severity: 'error',
                });
            }
        }
        // Apply isolation level restrictions
        if (this.isolationLevel === 'strict') {
            var dangerousPatterns = [
                /rm\s+-rf/,
                /sudo/,
                /chmod\s+777/,
                />\s*\/dev\//,
                /mkfs/,
                /dd\s+if=/,
            ];
            for (var _b = 0, dangerousPatterns_1 = dangerousPatterns; _b < dangerousPatterns_1.length; _b++) {
                var pattern = dangerousPatterns_1[_b];
                if (pattern.test(command)) {
                    violations.push({
                        type: 'isolation_violation',
                        resource: command,
                        permission: 'isolationLevel',
                        message: "Command contains dangerous pattern in strict isolation mode",
                        severity: 'error',
                    });
                    break;
                }
            }
        }
        return {
            allowed: violations.length === 0,
            reason: violations.length > 0 ? violations[0].message : undefined,
            violations: violations,
        };
    };
    PermissionEnforcer.prototype.checkMcpPermission = function (toolSpec) {
        var _this = this;
        var violations = [];
        // toolSpec format: "server:tool" or just "tool"
        var _a = toolSpec.includes(':')
            ? toolSpec.split(':')
            : ['*', toolSpec], server = _a[0], tool = _a[1];
        // Check denied list first
        if (this.permissions.mcpTools.denied) {
            for (var _i = 0, _b = this.permissions.mcpTools.denied; _i < _b.length; _i++) {
                var denied = _b[_i];
                if (this.matchesMcpSpec(toolSpec, denied)) {
                    violations.push({
                        type: 'mcp_denied',
                        resource: toolSpec,
                        permission: 'mcpTools.denied',
                        message: "MCP tool \"".concat(toolSpec, "\" is explicitly denied"),
                        severity: 'error',
                    });
                    return { allowed: false, reason: violations[0].message, violations: violations };
                }
            }
        }
        // Check allowed list
        var allowed = this.permissions.mcpTools.allowed || [];
        if (allowed.length > 0 && !allowed.includes('*')) {
            var isAllowed = allowed.some(function (a) { return _this.matchesMcpSpec(toolSpec, a); });
            if (!isAllowed) {
                violations.push({
                    type: 'mcp_denied',
                    resource: toolSpec,
                    permission: 'mcpTools.allowed',
                    message: "MCP tool \"".concat(toolSpec, "\" is not in allowed list"),
                    severity: 'error',
                });
            }
        }
        return {
            allowed: violations.length === 0,
            reason: violations.length > 0 ? violations[0].message : undefined,
            violations: violations,
        };
    };
    PermissionEnforcer.prototype.checkNetworkPermission = function (url) {
        var _this = this;
        var violations = [];
        // Check if network is enabled
        if (!this.permissions.network.enabled) {
            violations.push({
                type: 'network_denied',
                resource: url,
                permission: 'network.enabled',
                message: 'Network access is not allowed',
                severity: 'error',
            });
            return { allowed: false, reason: violations[0].message, violations: violations };
        }
        // Extract domain from URL
        var domain;
        try {
            var urlObj = new URL(url);
            domain = urlObj.hostname;
        }
        catch (_a) {
            domain = url; // Assume it's just a domain
        }
        // Check denied domains first
        if (this.permissions.network.deniedDomains) {
            for (var _i = 0, _b = this.permissions.network.deniedDomains; _i < _b.length; _i++) {
                var denied = _b[_i];
                if (this.matchesDomain(domain, denied)) {
                    violations.push({
                        type: 'network_denied',
                        resource: url,
                        permission: 'network.deniedDomains',
                        message: "Domain \"".concat(domain, "\" is explicitly denied"),
                        severity: 'error',
                    });
                    return { allowed: false, reason: violations[0].message, violations: violations };
                }
            }
        }
        // Check allowed domains
        var allowedDomains = this.permissions.network.allowedDomains || [];
        if (allowedDomains.length > 0) {
            var isAllowed = allowedDomains.some(function (a) { return _this.matchesDomain(domain, a); });
            if (!isAllowed) {
                violations.push({
                    type: 'network_denied',
                    resource: url,
                    permission: 'network.allowedDomains',
                    message: "Domain \"".concat(domain, "\" is not in allowed list"),
                    severity: 'error',
                });
            }
        }
        return {
            allowed: violations.length === 0,
            reason: violations.length > 0 ? violations[0].message : undefined,
            violations: violations,
        };
    };
    PermissionEnforcer.prototype.checkModelPermission = function (model) {
        var violations = [];
        var allowed = this.permissions.models.allowed || ['haiku', 'sonnet', 'opus'];
        if (!allowed.includes(model)) {
            violations.push({
                type: 'model_denied',
                resource: model,
                permission: 'models.allowed',
                message: "Model \"".concat(model, "\" is not allowed. Allowed: ").concat(allowed.join(', ')),
                severity: 'error',
            });
        }
        return {
            allowed: violations.length === 0,
            reason: violations.length > 0 ? violations[0].message : undefined,
            violations: violations,
            suggestions: violations.length > 0
                ? ["Consider using: ".concat(allowed.join(', '))]
                : undefined,
        };
    };
    // ==================== Helper Methods ====================
    PermissionEnforcer.prototype.matchesGlob = function (path, pattern) {
        // Convert glob to regex
        var regexPattern = pattern
            .replace(/\*\*/g, '{{DOUBLE_STAR}}')
            .replace(/\*/g, '[^/]*')
            .replace(/{{DOUBLE_STAR}}/g, '.*')
            .replace(/\?/g, '.')
            .replace(/\//g, '\\/');
        try {
            var regex = new RegExp("^".concat(regexPattern, "$"));
            return regex.test(path);
        }
        catch (_a) {
            return path === pattern;
        }
    };
    PermissionEnforcer.prototype.matchesRegex = function (text, pattern) {
        try {
            var regex = new RegExp(pattern);
            return regex.test(text);
        }
        catch (_a) {
            return text.includes(pattern);
        }
    };
    PermissionEnforcer.prototype.matchesMcpSpec = function (toolSpec, pattern) {
        if (pattern === '*')
            return true;
        if (pattern === toolSpec)
            return true;
        // Handle wildcards like "server:*" or "*:tool"
        if (pattern.includes('*')) {
            var regexPattern = pattern.replace(/\*/g, '.*');
            try {
                return new RegExp("^".concat(regexPattern, "$")).test(toolSpec);
            }
            catch (_a) {
                return false;
            }
        }
        return false;
    };
    PermissionEnforcer.prototype.matchesDomain = function (domain, pattern) {
        if (pattern === domain)
            return true;
        // Handle wildcard subdomains like "*.example.com"
        if (pattern.startsWith('*.')) {
            var baseDomain = pattern.slice(2);
            return domain === baseDomain || domain.endsWith(".".concat(baseDomain));
        }
        return false;
    };
    PermissionEnforcer.prototype.findSimilarPatterns = function (path, patterns) {
        // Find patterns that share a common prefix with the path
        var pathParts = path.split('/');
        return patterns.filter(function (pattern) {
            var patternParts = pattern.split('/');
            return patternParts[0] === pathParts[0] || patternParts[1] === pathParts[1];
        }).slice(0, 3);
    };
    PermissionEnforcer.prototype.audit = function (entry) {
        this.auditLog.push(entry);
        // Trim log if too large
        if (this.auditLog.length > this.maxAuditEntries) {
            this.auditLog = this.auditLog.slice(-this.maxAuditEntries);
        }
    };
    return PermissionEnforcer;
}());
exports.PermissionEnforcer = PermissionEnforcer;
/**
 * Error thrown when permission is denied
 */
var PermissionDeniedError = /** @class */ (function (_super) {
    __extends(PermissionDeniedError, _super);
    function PermissionDeniedError(message, violations) {
        var _this = _super.call(this, message) || this;
        _this.violations = violations;
        _this.name = 'PermissionDeniedError';
        return _this;
    }
    return PermissionDeniedError;
}(Error));
exports.PermissionDeniedError = PermissionDeniedError;
/**
 * Create a permission enforcer with default options
 */
function createEnforcer(permissions, options) {
    return new PermissionEnforcer(permissions, options);
}
/**
 * Create a strict enforcer (highest security)
 */
function createStrictEnforcer(permissions) {
    return new PermissionEnforcer(permissions, { isolationLevel: 'strict' });
}
/**
 * Create a permissive enforcer (lowest security, for development)
 */
function createPermissiveEnforcer(permissions) {
    return new PermissionEnforcer(permissions, { isolationLevel: 'permissive' });
}
