/**
 * Tests for useTutorialProgress Hook
 *
 * Tests localStorage persistence, step completion tracking,
 * progress calculation, and resume functionality.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useTutorialProgress,
  estimateReadingTime,
  formatProgress,
} from './useTutorialProgress';

// =============================================================================
// Mock localStorage
// =============================================================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
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

describe('useTutorialProgress', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('loads empty state when localStorage is empty', () => {
      const { result } = renderHook(() => useTutorialProgress());

      expect(result.current.isLoaded).toBe(true);
      expect(result.current.getCompletedCount()).toBe(0);
      expect(result.current.getStartedTutorials()).toEqual([]);
    });

    it('loads existing progress from localStorage', () => {
      const existingData = {
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
      localStorageMock.setItem(
        'claude-skills-tutorial-progress',
        JSON.stringify(existingData)
      );

      const { result } = renderHook(() => useTutorialProgress());

      expect(result.current.isLoaded).toBe(true);
      expect(result.current.getStartedTutorials()).toContain('tutorial-1');
      expect(result.current.isStepCompleted('tutorial-1', 'step-1')).toBe(true);
      expect(result.current.isStepCompleted('tutorial-1', 'step-2')).toBe(true);
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorageMock.setItem('claude-skills-tutorial-progress', 'not-json');

      const { result } = renderHook(() => useTutorialProgress());

      expect(result.current.isLoaded).toBe(true);
      expect(result.current.getCompletedCount()).toBe(0);
    });

    it('handles version mismatch by using defaults', () => {
      const oldVersionData = {
        version: 0,
        tutorials: {},
        lastUpdated: '2025-01-15T10:00:00Z',
      };
      localStorageMock.setItem(
        'claude-skills-tutorial-progress',
        JSON.stringify(oldVersionData)
      );

      const { result } = renderHook(() => useTutorialProgress());

      expect(result.current.isLoaded).toBe(true);
      expect(result.current.getCompletedCount()).toBe(0);
    });
  });

  describe('completeStep', () => {
    it('marks a step as completed', () => {
      const { result } = renderHook(() => useTutorialProgress());

      act(() => {
        result.current.completeStep('tutorial-1', 'step-1', 5);
      });

      expect(result.current.isStepCompleted('tutorial-1', 'step-1')).toBe(true);
      expect(result.current.isStepCompleted('tutorial-1', 'step-2')).toBe(false);
    });

    it('does not duplicate completed steps', () => {
      const { result } = renderHook(() => useTutorialProgress());

      act(() => {
        result.current.completeStep('tutorial-1', 'step-1', 5);
        result.current.completeStep('tutorial-1', 'step-1', 5);
      });

      const progress = result.current.getTutorialProgress('tutorial-1');
      expect(progress?.completedSteps).toHaveLength(1);
    });

    it('updates lastStepId when completing a step', () => {
      const { result } = renderHook(() => useTutorialProgress());

      act(() => {
        result.current.completeStep('tutorial-1', 'step-1', 5);
      });

      expect(result.current.getResumePoint('tutorial-1')).toBe('step-1');

      act(() => {
        result.current.completeStep('tutorial-1', 'step-2', 5);
      });

      expect(result.current.getResumePoint('tutorial-1')).toBe('step-2');
    });

    it('marks tutorial as completed when all steps done', () => {
      const { result } = renderHook(() => useTutorialProgress());

      act(() => {
        result.current.completeStep('tutorial-1', 'step-1', 2);
        result.current.completeStep('tutorial-1', 'step-2', 2);
      });

      expect(result.current.isTutorialCompleted('tutorial-1')).toBe(true);
      expect(result.current.getCompletedCount()).toBe(1);
    });

    it('persists to localStorage after completing step', () => {
      const { result } = renderHook(() => useTutorialProgress());

      act(() => {
        result.current.completeStep('tutorial-1', 'step-1', 5);
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(
        localStorageMock._store['claude-skills-tutorial-progress']
      );
      expect(savedData.tutorials['tutorial-1']).toBeDefined();
    });
  });

  describe('getProgress', () => {
    it('returns 0 for non-existent tutorial', () => {
      const { result } = renderHook(() => useTutorialProgress());

      expect(result.current.getProgress('nonexistent')).toBe(0);
    });

    it('calculates correct progress percentage', () => {
      const { result } = renderHook(() => useTutorialProgress());

      act(() => {
        result.current.completeStep('tutorial-1', 'step-1', 4);
      });

      expect(result.current.getProgress('tutorial-1')).toBe(25);

      act(() => {
        result.current.completeStep('tutorial-1', 'step-2', 4);
      });

      expect(result.current.getProgress('tutorial-1')).toBe(50);
    });

    it('returns 100 when all steps completed', () => {
      const { result } = renderHook(() => useTutorialProgress());

      act(() => {
        result.current.completeStep('tutorial-1', 'step-1', 2);
        result.current.completeStep('tutorial-1', 'step-2', 2);
      });

      expect(result.current.getProgress('tutorial-1')).toBe(100);
    });

    it('rounds progress to nearest integer', () => {
      const { result } = renderHook(() => useTutorialProgress());

      act(() => {
        result.current.completeStep('tutorial-1', 'step-1', 3);
      });

      expect(result.current.getProgress('tutorial-1')).toBe(33); // 33.33... → 33
    });
  });

  describe('setResumePoint', () => {
    it('sets resume point without completing step', () => {
      const { result } = renderHook(() => useTutorialProgress());

      act(() => {
        result.current.setResumePoint('tutorial-1', 'step-3', 5);
      });

      expect(result.current.getResumePoint('tutorial-1')).toBe('step-3');
      expect(result.current.isStepCompleted('tutorial-1', 'step-3')).toBe(false);
    });

    it('creates tutorial entry if not exists', () => {
      const { result } = renderHook(() => useTutorialProgress());

      act(() => {
        result.current.setResumePoint('new-tutorial', 'step-1', 5);
      });

      expect(result.current.getStartedTutorials()).toContain('new-tutorial');
    });
  });

  describe('resetTutorial', () => {
    it('removes progress for specific tutorial', () => {
      const { result } = renderHook(() => useTutorialProgress());

      act(() => {
        result.current.completeStep('tutorial-1', 'step-1', 5);
        result.current.completeStep('tutorial-2', 'step-1', 5);
      });

      act(() => {
        result.current.resetTutorial('tutorial-1');
      });

      expect(result.current.getStartedTutorials()).not.toContain('tutorial-1');
      expect(result.current.getStartedTutorials()).toContain('tutorial-2');
    });

    it('handles resetting non-existent tutorial gracefully', () => {
      const { result } = renderHook(() => useTutorialProgress());

      act(() => {
        result.current.resetTutorial('nonexistent');
      });

      // Should not throw
      expect(result.current.getStartedTutorials()).toEqual([]);
    });
  });

  describe('resetAll', () => {
    it('clears all tutorial progress', () => {
      const { result } = renderHook(() => useTutorialProgress());

      act(() => {
        result.current.completeStep('tutorial-1', 'step-1', 5);
        result.current.completeStep('tutorial-2', 'step-1', 5);
      });

      act(() => {
        result.current.resetAll();
      });

      expect(result.current.getStartedTutorials()).toEqual([]);
      expect(result.current.getCompletedCount()).toBe(0);
    });
  });

  describe('getTutorialProgress', () => {
    it('returns null for non-existent tutorial', () => {
      const { result } = renderHook(() => useTutorialProgress());

      expect(result.current.getTutorialProgress('nonexistent')).toBeNull();
    });

    it('returns full progress data for existing tutorial', () => {
      const { result } = renderHook(() => useTutorialProgress());

      act(() => {
        result.current.completeStep('tutorial-1', 'step-1', 5);
      });

      const progress = result.current.getTutorialProgress('tutorial-1');

      expect(progress).not.toBeNull();
      expect(progress?.tutorialId).toBe('tutorial-1');
      expect(progress?.completedSteps).toContain('step-1');
      expect(progress?.totalSteps).toBe(5);
      expect(progress?.startedAt).toBeDefined();
    });
  });
});

// =============================================================================
// Utility Function Tests
// =============================================================================

describe('estimateReadingTime', () => {
  it('calculates reading time at 200 wpm', () => {
    expect(estimateReadingTime(200)).toBe(1);
    expect(estimateReadingTime(400)).toBe(2);
    expect(estimateReadingTime(600)).toBe(3);
  });

  it('rounds up partial minutes', () => {
    expect(estimateReadingTime(250)).toBe(2);
    expect(estimateReadingTime(201)).toBe(2);
  });

  it('handles zero words', () => {
    expect(estimateReadingTime(0)).toBe(0);
  });
});

describe('formatProgress', () => {
  it('shows "Not started" for 0 total', () => {
    expect(formatProgress(0, 0)).toBe('Not started');
  });

  it('shows completion message when done', () => {
    expect(formatProgress(5, 5)).toBe('Completed!');
    expect(formatProgress(6, 5)).toBe('Completed!');
  });

  it('shows step count for in-progress', () => {
    expect(formatProgress(2, 5)).toBe('2 of 5 steps');
    expect(formatProgress(0, 5)).toBe('0 of 5 steps');
  });
});
