"use strict";
/**
 * Centralized logger utility
 *
 * Provides namespaced logging with different levels (debug, info, warn, error).
 * In production, only warn and error are logged.
 */
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
exports.createLogger = void 0;
var LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
var LEVEL_COLORS = {
    debug: '#888',
    info: '#0066cc',
    warn: '#ff9900',
    error: '#cc0000',
};
var LEVEL_EMOJIS = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
};
// Get minimum log level from environment
var getMinLogLevel = function () {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
        return 'warn';
    }
    return 'debug';
};
var MIN_LEVEL = LOG_LEVELS[getMinLogLevel()];
/**
 * Create a namespaced logger
 *
 * @param namespace - Logger namespace (e.g., 'OnboardingModal')
 * @returns Logger instance with debug/info/warn/error methods
 *
 * @example
 * ```typescript
 * const log = createLogger('ComponentName');
 * log.debug('Detailed info for dev');
 * log.info('User action occurred');
 * log.warn('Recoverable issue');
 * log.error('Unrecoverable failure');
 * ```
 */
var createLogger = function (namespace) {
    var shouldLog = function (level) {
        return LOG_LEVELS[level] >= MIN_LEVEL;
    };
    var log = function (level, message) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (!shouldLog(level)) {
            return;
        }
        var timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        var color = LEVEL_COLORS[level];
        var emoji = LEVEL_EMOJIS[level];
        var prefix = "[".concat(timestamp, "] ").concat(emoji, " [").concat(namespace, "]");
        var consoleMethod = level === 'debug' ? 'log' : level;
        // Use styled console output
        console[consoleMethod].apply(console, __spreadArray(["%c".concat(prefix, "%c ").concat(message), "color: ".concat(color, "; font-weight: bold;"), 'color: inherit;'], args, false));
    };
    return {
        debug: function (message) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return log.apply(void 0, __spreadArray(['debug', message], args, false));
        },
        info: function (message) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return log.apply(void 0, __spreadArray(['info', message], args, false));
        },
        warn: function (message) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return log.apply(void 0, __spreadArray(['warn', message], args, false));
        },
        error: function (message) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return log.apply(void 0, __spreadArray(['error', message], args, false));
        },
    };
};
exports.createLogger = createLogger;
