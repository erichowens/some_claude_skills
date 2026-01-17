"use strict";
/**
 * Tests for useTutorialProgress Hook
 *
 * Tests localStorage persistence, step completion tracking,
 * progress calculation, and resume functionality.
 *
 * @vitest-environment jsdom
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var react_1 = require("@testing-library/react");
var useTutorialProgress_1 = require("./useTutorialProgress");
// =============================================================================
// Mock localStorage
// =============================================================================
var localStorageMock = (function () {
    var store = {};
    return {
        getItem: vitest_1.vi.fn(function (key) { var _a; return (_a = store[key]) !== null && _a !== void 0 ? _a : null; }),
        setItem: vitest_1.vi.fn(function (key, value) {
            store[key] = value;
        }),
        removeItem: vitest_1.vi.fn(function (key) {
            delete store[key];
        }),
        clear: vitest_1.vi.fn(function () {
            store = {};
        }),
        get _store() {
            return store;
        },
    };
})();
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});
// =============================================================================
// Tests
// =============================================================================
(0, vitest_1.describe)('useTutorialProgress', function () {
    (0, vitest_1.beforeEach)(function () {
        localStorageMock.clear();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.afterEach)(function () {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('initialization', function () {
        (0, vitest_1.it)('loads empty state when localStorage is empty', function () {
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, vitest_1.expect)(result.current.isLoaded).toBe(true);
            (0, vitest_1.expect)(result.current.getCompletedCount()).toBe(0);
            (0, vitest_1.expect)(result.current.getStartedTutorials()).toEqual([]);
        });
        (0, vitest_1.it)('loads existing progress from localStorage', function () {
            var existingData = {
                version: 1,
                tutorials: {
                    'tutorial-1': {
                        tutorialId: 'tutorial-1',
                        completedSteps: ['step-1', 'step-2'],
                        lastStepId: 'step-2',
                        startedAt: '2025-01-15T10:00:00Z',
                        completedAt: null,
                        totalSteps: 5,
                    },
                },
                lastUpdated: '2025-01-15T10:00:00Z',
            };
            localStorageMock.setItem('claude-skills-tutorial-progress', JSON.stringify(existingData));
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, vitest_1.expect)(result.current.isLoaded).toBe(true);
            (0, vitest_1.expect)(result.current.getStartedTutorials()).toContain('tutorial-1');
            (0, vitest_1.expect)(result.current.isStepCompleted('tutorial-1', 'step-1')).toBe(true);
            (0, vitest_1.expect)(result.current.isStepCompleted('tutorial-1', 'step-2')).toBe(true);
        });
        (0, vitest_1.it)('handles corrupted localStorage gracefully', function () {
            localStorageMock.setItem('claude-skills-tutorial-progress', 'not-json');
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, vitest_1.expect)(result.current.isLoaded).toBe(true);
            (0, vitest_1.expect)(result.current.getCompletedCount()).toBe(0);
        });
        (0, vitest_1.it)('handles version mismatch by using defaults', function () {
            var oldVersionData = {
                version: 0,
                tutorials: {},
                lastUpdated: '2025-01-15T10:00:00Z',
            };
            localStorageMock.setItem('claude-skills-tutorial-progress', JSON.stringify(oldVersionData));
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, vitest_1.expect)(result.current.isLoaded).toBe(true);
            (0, vitest_1.expect)(result.current.getCompletedCount()).toBe(0);
        });
    });
    (0, vitest_1.describe)('completeStep', function () {
        (0, vitest_1.it)('marks a step as completed', function () {
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, react_1.act)(function () {
                result.current.completeStep('tutorial-1', 'step-1', 5);
            });
            (0, vitest_1.expect)(result.current.isStepCompleted('tutorial-1', 'step-1')).toBe(true);
            (0, vitest_1.expect)(result.current.isStepCompleted('tutorial-1', 'step-2')).toBe(false);
        });
        (0, vitest_1.it)('does not duplicate completed steps', function () {
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, react_1.act)(function () {
                result.current.completeStep('tutorial-1', 'step-1', 5);
                result.current.completeStep('tutorial-1', 'step-1', 5);
            });
            var progress = result.current.getTutorialProgress('tutorial-1');
            (0, vitest_1.expect)(progress === null || progress === void 0 ? void 0 : progress.completedSteps).toHaveLength(1);
        });
        (0, vitest_1.it)('updates lastStepId when completing a step', function () {
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, react_1.act)(function () {
                result.current.completeStep('tutorial-1', 'step-1', 5);
            });
            (0, vitest_1.expect)(result.current.getResumePoint('tutorial-1')).toBe('step-1');
            (0, react_1.act)(function () {
                result.current.completeStep('tutorial-1', 'step-2', 5);
            });
            (0, vitest_1.expect)(result.current.getResumePoint('tutorial-1')).toBe('step-2');
        });
        (0, vitest_1.it)('marks tutorial as completed when all steps done', function () {
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, react_1.act)(function () {
                result.current.completeStep('tutorial-1', 'step-1', 2);
                result.current.completeStep('tutorial-1', 'step-2', 2);
            });
            (0, vitest_1.expect)(result.current.isTutorialCompleted('tutorial-1')).toBe(true);
            (0, vitest_1.expect)(result.current.getCompletedCount()).toBe(1);
        });
        (0, vitest_1.it)('persists to localStorage after completing step', function () {
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, react_1.act)(function () {
                result.current.completeStep('tutorial-1', 'step-1', 5);
            });
            (0, vitest_1.expect)(localStorageMock.setItem).toHaveBeenCalled();
            var savedData = JSON.parse(localStorageMock._store['claude-skills-tutorial-progress']);
            (0, vitest_1.expect)(savedData.tutorials['tutorial-1']).toBeDefined();
        });
    });
    (0, vitest_1.describe)('getProgress', function () {
        (0, vitest_1.it)('returns 0 for non-existent tutorial', function () {
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, vitest_1.expect)(result.current.getProgress('nonexistent')).toBe(0);
        });
        (0, vitest_1.it)('calculates correct progress percentage', function () {
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, react_1.act)(function () {
                result.current.completeStep('tutorial-1', 'step-1', 4);
            });
            (0, vitest_1.expect)(result.current.getProgress('tutorial-1')).toBe(25);
            (0, react_1.act)(function () {
                result.current.completeStep('tutorial-1', 'step-2', 4);
            });
            (0, vitest_1.expect)(result.current.getProgress('tutorial-1')).toBe(50);
        });
        (0, vitest_1.it)('returns 100 when all steps completed', function () {
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, react_1.act)(function () {
                result.current.completeStep('tutorial-1', 'step-1', 2);
                result.current.completeStep('tutorial-1', 'step-2', 2);
            });
            (0, vitest_1.expect)(result.current.getProgress('tutorial-1')).toBe(100);
        });
        (0, vitest_1.it)('rounds progress to nearest integer', function () {
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, react_1.act)(function () {
                result.current.completeStep('tutorial-1', 'step-1', 3);
            });
            (0, vitest_1.expect)(result.current.getProgress('tutorial-1')).toBe(33); // 33.33... → 33
        });
    });
    (0, vitest_1.describe)('setResumePoint', function () {
        (0, vitest_1.it)('sets resume point without completing step', function () {
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, react_1.act)(function () {
                result.current.setResumePoint('tutorial-1', 'step-3', 5);
            });
            (0, vitest_1.expect)(result.current.getResumePoint('tutorial-1')).toBe('step-3');
            (0, vitest_1.expect)(result.current.isStepCompleted('tutorial-1', 'step-3')).toBe(false);
        });
        (0, vitest_1.it)('creates tutorial entry if not exists', function () {
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, react_1.act)(function () {
                result.current.setResumePoint('new-tutorial', 'step-1', 5);
            });
            (0, vitest_1.expect)(result.current.getStartedTutorials()).toContain('new-tutorial');
        });
    });
    (0, vitest_1.describe)('resetTutorial', function () {
        (0, vitest_1.it)('removes progress for specific tutorial', function () {
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, react_1.act)(function () {
                result.current.completeStep('tutorial-1', 'step-1', 5);
                result.current.completeStep('tutorial-2', 'step-1', 5);
            });
            (0, react_1.act)(function () {
                result.current.resetTutorial('tutorial-1');
            });
            (0, vitest_1.expect)(result.current.getStartedTutorials()).not.toContain('tutorial-1');
            (0, vitest_1.expect)(result.current.getStartedTutorials()).toContain('tutorial-2');
        });
        (0, vitest_1.it)('handles resetting non-existent tutorial gracefully', function () {
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, react_1.act)(function () {
                result.current.resetTutorial('nonexistent');
            });
            // Should not throw
            (0, vitest_1.expect)(result.current.getStartedTutorials()).toEqual([]);
        });
    });
    (0, vitest_1.describe)('resetAll', function () {
        (0, vitest_1.it)('clears all tutorial progress', function () {
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, react_1.act)(function () {
                result.current.completeStep('tutorial-1', 'step-1', 5);
                result.current.completeStep('tutorial-2', 'step-1', 5);
            });
            (0, react_1.act)(function () {
                result.current.resetAll();
            });
            (0, vitest_1.expect)(result.current.getStartedTutorials()).toEqual([]);
            (0, vitest_1.expect)(result.current.getCompletedCount()).toBe(0);
        });
    });
    (0, vitest_1.describe)('getTutorialProgress', function () {
        (0, vitest_1.it)('returns null for non-existent tutorial', function () {
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, vitest_1.expect)(result.current.getTutorialProgress('nonexistent')).toBeNull();
        });
        (0, vitest_1.it)('returns full progress data for existing tutorial', function () {
            var result = (0, react_1.renderHook)(function () { return (0, useTutorialProgress_1.useTutorialProgress)(); }).result;
            (0, react_1.act)(function () {
                result.current.completeStep('tutorial-1', 'step-1', 5);
            });
            var progress = result.current.getTutorialProgress('tutorial-1');
            (0, vitest_1.expect)(progress).not.toBeNull();
            (0, vitest_1.expect)(progress === null || progress === void 0 ? void 0 : progress.tutorialId).toBe('tutorial-1');
            (0, vitest_1.expect)(progress === null || progress === void 0 ? void 0 : progress.completedSteps).toContain('step-1');
            (0, vitest_1.expect)(progress === null || progress === void 0 ? void 0 : progress.totalSteps).toBe(5);
            (0, vitest_1.expect)(progress === null || progress === void 0 ? void 0 : progress.startedAt).toBeDefined();
        });
    });
});
// =============================================================================
// Utility Function Tests
// =============================================================================
(0, vitest_1.describe)('estimateReadingTime', function () {
    (0, vitest_1.it)('calculates reading time at 200 wpm', function () {
        (0, vitest_1.expect)((0, useTutorialProgress_1.estimateReadingTime)(200)).toBe(1);
        (0, vitest_1.expect)((0, useTutorialProgress_1.estimateReadingTime)(400)).toBe(2);
        (0, vitest_1.expect)((0, useTutorialProgress_1.estimateReadingTime)(600)).toBe(3);
    });
    (0, vitest_1.it)('rounds up partial minutes', function () {
        (0, vitest_1.expect)((0, useTutorialProgress_1.estimateReadingTime)(250)).toBe(2);
        (0, vitest_1.expect)((0, useTutorialProgress_1.estimateReadingTime)(201)).toBe(2);
    });
    (0, vitest_1.it)('handles zero words', function () {
        (0, vitest_1.expect)((0, useTutorialProgress_1.estimateReadingTime)(0)).toBe(0);
    });
});
(0, vitest_1.describe)('formatProgress', function () {
    (0, vitest_1.it)('shows "Not started" for 0 total', function () {
        (0, vitest_1.expect)((0, useTutorialProgress_1.formatProgress)(0, 0)).toBe('Not started');
    });
    (0, vitest_1.it)('shows completion message when done', function () {
        (0, vitest_1.expect)((0, useTutorialProgress_1.formatProgress)(5, 5)).toBe('Completed!');
        (0, vitest_1.expect)((0, useTutorialProgress_1.formatProgress)(6, 5)).toBe('Completed!');
    });
    (0, vitest_1.it)('shows step count for in-progress', function () {
        (0, vitest_1.expect)((0, useTutorialProgress_1.formatProgress)(2, 5)).toBe('2 of 5 steps');
        (0, vitest_1.expect)((0, useTutorialProgress_1.formatProgress)(0, 5)).toBe('0 of 5 steps');
    });
});
