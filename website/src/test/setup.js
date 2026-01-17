"use strict";
/**
 * Vitest setup file
 *
 * Global test setup for React Testing Library
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
require("@testing-library/jest-dom");
var react_1 = require("@testing-library/react");
var vitest_1 = require("vitest");
// Cleanup after each test
(0, vitest_1.afterEach)(function () {
    (0, react_1.cleanup)();
});
// Mock window.matchMedia (used by many components)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vitest_1.vi.fn().mockImplementation(function (query) { return ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vitest_1.vi.fn(),
        removeListener: vitest_1.vi.fn(),
        addEventListener: vitest_1.vi.fn(),
        removeEventListener: vitest_1.vi.fn(),
        dispatchEvent: vitest_1.vi.fn(),
    }); }),
});
// Mock IntersectionObserver (used by lazy loading)
global.IntersectionObserver = /** @class */ (function () {
    function IntersectionObserver() {
    }
    IntersectionObserver.prototype.disconnect = function () { };
    IntersectionObserver.prototype.observe = function () { };
    IntersectionObserver.prototype.takeRecords = function () {
        return [];
    };
    IntersectionObserver.prototype.unobserve = function () { };
    return IntersectionObserver;
}());
// Mock ResizeObserver (used by responsive components)
global.ResizeObserver = /** @class */ (function () {
    function ResizeObserver() {
    }
    ResizeObserver.prototype.disconnect = function () { };
    ResizeObserver.prototype.observe = function () { };
    ResizeObserver.prototype.unobserve = function () { };
    return ResizeObserver;
}());
// Suppress console errors in tests (unless debugging)
var originalError = console.error;
beforeEach(function () {
    console.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (typeof args[0] === 'string' &&
            args[0].includes('Warning: ReactDOM.render')) {
            return;
        }
        originalError.call.apply(originalError, __spreadArray([console], args, false));
    };
});
(0, vitest_1.afterEach)(function () {
    console.error = originalError;
});
