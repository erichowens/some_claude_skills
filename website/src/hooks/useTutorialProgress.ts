/**
 * useTutorialProgress Hook
 *
 * Tracks tutorial completion progress with localStorage persistence.
 * Supports step-by-step tracking, resume functionality, and analytics.
 *
 * @module hooks/useTutorialProgress
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'claude-skills-tutorial-progress';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Progress data for a single tutorial
 */
export interface TutorialProgress {
  /** Tutorial identifier */
  tutorialId: string;

  /** Set of completed step IDs */
  completedSteps: string[];

  /** Last visited step ID (for resume) */
  lastStepId: string | null;

  /** When the tutorial was started */
  startedAt: string;

  /** When the tutorial was completed (if finished) */
  completedAt: string | null;

  /** Total number of steps in this tutorial */
  totalSteps: number;
}

/**
 * Serializable storage format
 */
interface StoredProgress {
  version: number;
  tutorials: Record<string, TutorialProgress>;
  lastUpdated: string;
}

/**
 * Hook return type
 */
export interface TutorialProgressHook {
  /** Mark a step as completed */
  completeStep: (tutorialId: string, stepId: string, totalSteps: number) => void;

  /** Check if a specific step is completed */
  isStepCompleted: (tutorialId: string, stepId: string) => boolean;

  /** Check if an entire tutorial is completed */
  isTutorialCompleted: (tutorialId: string) => boolean;

  /** Get progress percentage for a tutorial (0-100) */
  getProgress: (tutorialId: string) => number;

  /** Get the last visited step for resuming */
  getResumePoint: (tutorialId: string) => string | null;

  /** Update the last visited step */
  setResumePoint: (tutorialId: string, stepId: string, totalSteps: number) => void;

  /** Reset progress for a specific tutorial */
  resetTutorial: (tutorialId: string) => void;

  /** Reset all progress */
  resetAll: () => void;

  /** Get count of completed tutorials */
  getCompletedCount: () => number;

  /** Get all tutorial IDs with progress */
  getStartedTutorials: () => string[];

  /** Get full progress data for a tutorial */
  getTutorialProgress: (tutorialId: string) => TutorialProgress | null;

  /** Whether localStorage has been loaded */
  isLoaded: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const CURRENT_VERSION = 1;

const createEmptyProgress = (): StoredProgress => ({
  version: CURRENT_VERSION,
  tutorials: {},
  lastUpdated: new Date().toISOString(),
});

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useTutorialProgress(): TutorialProgressHook {
  const [progress, setProgress] = useState<StoredProgress>(createEmptyProgress);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredProgress;

        // Version check for future migrations
        if (parsed.version === CURRENT_VERSION && parsed.tutorials) {
          setProgress(parsed);
        } else {
          // Handle migration if needed in future
          console.info('Tutorial progress version mismatch, using defaults');
        }
      }
    } catch (e) {
      console.warn('Failed to load tutorial progress from localStorage', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when progress changes
  useEffect(() => {
    if (isLoaded) {
      try {
        const toStore: StoredProgress = {
          ...progress,
          lastUpdated: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      } catch (e) {
        console.warn('Failed to save tutorial progress to localStorage', e);
      }
    }
  }, [progress, isLoaded]);

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  const completeStep = useCallback(
    (tutorialId: string, stepId: string, totalSteps: number) => {
      setProgress((prev) => {
        // Get existing tutorial from prev state, not closure
        const existing = prev.tutorials[tutorialId];
        const tutorial: TutorialProgress = existing
          ? { ...existing, totalSteps }
          : {
              tutorialId,
              completedSteps: [],
              lastStepId: null,
              startedAt: new Date().toISOString(),
              completedAt: null,
              totalSteps,
            };

        const completedSteps = tutorial.completedSteps.includes(stepId)
          ? tutorial.completedSteps
          : [...tutorial.completedSteps, stepId];

        const isNowComplete = completedSteps.length >= totalSteps;

        return {
          ...prev,
          tutorials: {
            ...prev.tutorials,
            [tutorialId]: {
              ...tutorial,
              completedSteps,
              lastStepId: stepId,
              completedAt: isNowComplete && !tutorial.completedAt
                ? new Date().toISOString()
                : tutorial.completedAt,
            },
          },
        };
      });
    },
    []
  );

  const isStepCompleted = useCallback(
    (tutorialId: string, stepId: string): boolean => {
      const tutorial = progress.tutorials[tutorialId];
      return tutorial?.completedSteps.includes(stepId) ?? false;
    },
    [progress.tutorials]
  );

  const isTutorialCompleted = useCallback(
    (tutorialId: string): boolean => {
      const tutorial = progress.tutorials[tutorialId];
      return tutorial?.completedAt !== null && tutorial?.completedAt !== undefined;
    },
    [progress.tutorials]
  );

  const getProgress = useCallback(
    (tutorialId: string): number => {
      const tutorial = progress.tutorials[tutorialId];
      if (!tutorial || tutorial.totalSteps === 0) {
        return 0;
      }
      return Math.round((tutorial.completedSteps.length / tutorial.totalSteps) * 100);
    },
    [progress.tutorials]
  );

  const getResumePoint = useCallback(
    (tutorialId: string): string | null => {
      return progress.tutorials[tutorialId]?.lastStepId ?? null;
    },
    [progress.tutorials]
  );

  const setResumePoint = useCallback(
    (tutorialId: string, stepId: string, totalSteps: number) => {
      setProgress((prev) => {
        // Get existing tutorial from prev state, not closure
        const existing = prev.tutorials[tutorialId];
        const tutorial: TutorialProgress = existing
          ? { ...existing, totalSteps }
          : {
              tutorialId,
              completedSteps: [],
              lastStepId: null,
              startedAt: new Date().toISOString(),
              completedAt: null,
              totalSteps,
            };

        return {
          ...prev,
          tutorials: {
            ...prev.tutorials,
            [tutorialId]: {
              ...tutorial,
              lastStepId: stepId,
            },
          },
        };
      });
    },
    []
  );

  const resetTutorial = useCallback((tutorialId: string) => {
    setProgress((prev) => {
      const { [tutorialId]: removed, ...rest } = prev.tutorials;
      return {
        ...prev,
        tutorials: rest,
      };
    });
  }, []);

  const resetAll = useCallback(() => {
    setProgress(createEmptyProgress());
  }, []);

  const getCompletedCount = useCallback((): number => {
    return Object.values(progress.tutorials).filter(
      (t) => t.completedAt !== null
    ).length;
  }, [progress.tutorials]);

  const getStartedTutorials = useCallback((): string[] => {
    return Object.keys(progress.tutorials);
  }, [progress.tutorials]);

  const getTutorialProgress = useCallback(
    (tutorialId: string): TutorialProgress | null => {
      return progress.tutorials[tutorialId] ?? null;
    },
    [progress.tutorials]
  );

  return {
    completeStep,
    isStepCompleted,
    isTutorialCompleted,
    getProgress,
    getResumePoint,
    setResumePoint,
    resetTutorial,
    resetAll,
    getCompletedCount,
    getStartedTutorials,
    getTutorialProgress,
    isLoaded,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate estimated reading time for tutorial content
 */
export function estimateReadingTime(wordCount: number): number {
  const wordsPerMinute = 200;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Format progress as a human-readable string
 */
export function formatProgress(completed: number, total: number): string {
  if (total === 0) return 'Not started';
  if (completed >= total) return 'Completed!';
  return `${completed} of ${total} steps`;
}
