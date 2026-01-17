"use strict";
/**
 * useTutorialProgress Hook
 *
 * Tracks tutorial completion progress with localStorage persistence.
 * Supports step-by-step tracking, resume functionality, and analytics.
 *
 * @module hooks/useTutorialProgress
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
exports.useTutorialProgress = useTutorialProgress;
exports.estimateReadingTime = estimateReadingTime;
exports.formatProgress = formatProgress;
var react_1 = require("react");
var STORAGE_KEY = 'claude-skills-tutorial-progress';
// =============================================================================
// CONSTANTS
// =============================================================================
var CURRENT_VERSION = 1;
var createEmptyProgress = function () { return ({
    version: CURRENT_VERSION,
    tutorials: {},
    lastUpdated: new Date().toISOString(),
}); };
// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================
function useTutorialProgress() {
    var _a = (0, react_1.useState)(createEmptyProgress), progress = _a[0], setProgress = _a[1];
    var _b = (0, react_1.useState)(false), isLoaded = _b[0], setIsLoaded = _b[1];
    // Load from localStorage on mount
    (0, react_1.useEffect)(function () {
        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                var parsed = JSON.parse(stored);
                // Version check for future migrations
                if (parsed.version === CURRENT_VERSION && parsed.tutorials) {
                    setProgress(parsed);
                }
                else {
                    // Handle migration if needed in future
                    console.info('Tutorial progress version mismatch, using defaults');
                }
            }
        }
        catch (e) {
            console.warn('Failed to load tutorial progress from localStorage', e);
        }
        setIsLoaded(true);
    }, []);
    // Save to localStorage when progress changes
    (0, react_1.useEffect)(function () {
        if (isLoaded) {
            try {
                var toStore = __assign(__assign({}, progress), { lastUpdated: new Date().toISOString() });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
            }
            catch (e) {
                console.warn('Failed to save tutorial progress to localStorage', e);
            }
        }
    }, [progress, isLoaded]);
    // ---------------------------------------------------------------------------
    // Public API
    // ---------------------------------------------------------------------------
    var completeStep = (0, react_1.useCallback)(function (tutorialId, stepId, totalSteps) {
        setProgress(function (prev) {
            var _a;
            // Get existing tutorial from prev state, not closure
            var existing = prev.tutorials[tutorialId];
            var tutorial = existing
                ? __assign(__assign({}, existing), { totalSteps: totalSteps }) : {
                tutorialId: tutorialId,
                completedSteps: [],
                lastStepId: null,
                startedAt: new Date().toISOString(),
                completedAt: null,
                totalSteps: totalSteps,
            };
            var completedSteps = tutorial.completedSteps.includes(stepId)
                ? tutorial.completedSteps
                : __spreadArray(__spreadArray([], tutorial.completedSteps, true), [stepId], false);
            var isNowComplete = completedSteps.length >= totalSteps;
            return __assign(__assign({}, prev), { tutorials: __assign(__assign({}, prev.tutorials), (_a = {}, _a[tutorialId] = __assign(__assign({}, tutorial), { completedSteps: completedSteps, lastStepId: stepId, completedAt: isNowComplete && !tutorial.completedAt
                        ? new Date().toISOString()
                        : tutorial.completedAt }), _a)) });
        });
    }, []);
    var isStepCompleted = (0, react_1.useCallback)(function (tutorialId, stepId) {
        var _a;
        var tutorial = progress.tutorials[tutorialId];
        return (_a = tutorial === null || tutorial === void 0 ? void 0 : tutorial.completedSteps.includes(stepId)) !== null && _a !== void 0 ? _a : false;
    }, [progress.tutorials]);
    var isTutorialCompleted = (0, react_1.useCallback)(function (tutorialId) {
        var tutorial = progress.tutorials[tutorialId];
        return (tutorial === null || tutorial === void 0 ? void 0 : tutorial.completedAt) !== null && (tutorial === null || tutorial === void 0 ? void 0 : tutorial.completedAt) !== undefined;
    }, [progress.tutorials]);
    var getProgress = (0, react_1.useCallback)(function (tutorialId) {
        var tutorial = progress.tutorials[tutorialId];
        if (!tutorial || tutorial.totalSteps === 0) {
            return 0;
        }
        return Math.round((tutorial.completedSteps.length / tutorial.totalSteps) * 100);
    }, [progress.tutorials]);
    var getResumePoint = (0, react_1.useCallback)(function (tutorialId) {
        var _a, _b;
        return (_b = (_a = progress.tutorials[tutorialId]) === null || _a === void 0 ? void 0 : _a.lastStepId) !== null && _b !== void 0 ? _b : null;
    }, [progress.tutorials]);
    var setResumePoint = (0, react_1.useCallback)(function (tutorialId, stepId, totalSteps) {
        setProgress(function (prev) {
            var _a;
            // Get existing tutorial from prev state, not closure
            var existing = prev.tutorials[tutorialId];
            var tutorial = existing
                ? __assign(__assign({}, existing), { totalSteps: totalSteps }) : {
                tutorialId: tutorialId,
                completedSteps: [],
                lastStepId: null,
                startedAt: new Date().toISOString(),
                completedAt: null,
                totalSteps: totalSteps,
            };
            return __assign(__assign({}, prev), { tutorials: __assign(__assign({}, prev.tutorials), (_a = {}, _a[tutorialId] = __assign(__assign({}, tutorial), { lastStepId: stepId }), _a)) });
        });
    }, []);
    var resetTutorial = (0, react_1.useCallback)(function (tutorialId) {
        setProgress(function (prev) {
            var _a = prev.tutorials, _b = tutorialId, removed = _a[_b], rest = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
            return __assign(__assign({}, prev), { tutorials: rest });
        });
    }, []);
    var resetAll = (0, react_1.useCallback)(function () {
        setProgress(createEmptyProgress());
    }, []);
    var getCompletedCount = (0, react_1.useCallback)(function () {
        return Object.values(progress.tutorials).filter(function (t) { return t.completedAt !== null; }).length;
    }, [progress.tutorials]);
    var getStartedTutorials = (0, react_1.useCallback)(function () {
        return Object.keys(progress.tutorials);
    }, [progress.tutorials]);
    var getTutorialProgress = (0, react_1.useCallback)(function (tutorialId) {
        var _a;
        return (_a = progress.tutorials[tutorialId]) !== null && _a !== void 0 ? _a : null;
    }, [progress.tutorials]);
    return {
        completeStep: completeStep,
        isStepCompleted: isStepCompleted,
        isTutorialCompleted: isTutorialCompleted,
        getProgress: getProgress,
        getResumePoint: getResumePoint,
        setResumePoint: setResumePoint,
        resetTutorial: resetTutorial,
        resetAll: resetAll,
        getCompletedCount: getCompletedCount,
        getStartedTutorials: getStartedTutorials,
        getTutorialProgress: getTutorialProgress,
        isLoaded: isLoaded,
    };
}
// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
/**
 * Calculate estimated reading time for tutorial content
 */
function estimateReadingTime(wordCount) {
    var wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
}
/**
 * Format progress as a human-readable string
 */
function formatProgress(completed, total) {
    if (total === 0)
        return 'Not started';
    if (completed >= total)
        return 'Completed!';
    return "".concat(completed, " of ").concat(total, " steps");
}
