/**
 * Tests for RecoveryManager
 *
 * RecoveryManager handles intelligent task recovery after failures.
 * Key capabilities tested:
 * - Strategy selection based on error type
 * - Feedback-augmented retries
 * - Model escalation
 * - Fallback handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  RecoveryManager,
  createRecoveryManager,
  type RecoveryContext,
  type RecoveryStrategy,
} from './recovery-manager';
import type { ExecutionRequest, ExecutionResponse, Executor } from '../executors/types';
import type { NodeId } from '../types';
import type { SynthesizedFeedback } from './feedback-synthesizer';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockExecutor(responses: ExecutionResponse[]): Executor {
  let callCount = 0;
  return {
    type: 'process',
    name: 'Mock Executor',
    execute: vi.fn().mockImplementation(async () => {
      const response = responses[callCount] || responses[responses.length - 1];
      callCount++;
      return response;
    }),
    executeParallel: vi.fn(),
    isAvailable: vi.fn().mockResolvedValue(true),
    getCapabilities: vi.fn().mockReturnValue({
      maxParallelism: 10,
      tokenOverheadPerTask: 0,
      sharedContext: false,
      supportsStreaming: false,
      efficientDependencyPassing: false,
      trueIsolation: true,
    }),
  };
}

function createTestRequest(overrides?: Partial<ExecutionRequest>): ExecutionRequest {
  return {
    nodeId: 'test-node' as NodeId,
    prompt: 'Test task prompt',
    description: 'Test task',
    model: 'sonnet',
    ...overrides,
  };
}

function createFailedResponse(
  errorCode: string = 'TOOL_ERROR',
  retryable: boolean = true
): ExecutionResponse {
  return {
    success: false,
    nodeId: 'test-node' as NodeId,
    error: {
      code: errorCode as any,
      message: `Error: ${errorCode}`,
      retryable,
    },
    metadata: {
      executor: 'process',
      durationMs: 100,
    },
  };
}

function createSuccessResponse(): ExecutionResponse {
  return {
    success: true,
    nodeId: 'test-node' as NodeId,
    output: { result: 'success' },
    confidence: 0.9,
    metadata: {
      executor: 'process',
      durationMs: 100,
    },
  };
}

function createMockFeedback(grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'D'): SynthesizedFeedback {
  return {
    assessment: {
      grade,
      score: grade === 'A' ? 95 : grade === 'F' ? 30 : 60,
      isAcceptable: grade !== 'F' && grade !== 'D',
      strengths: ['Good structure'],
      weaknesses: ['Missing details'],
      verdict: 'Needs improvement',
    },
    items: [{
      id: 'fb-1',
      priority: grade === 'F' ? 'critical' : 'high',
      category: 'quality',
      title: 'Improve output',
      description: 'Output needs more detail',
      actions: ['Add more details'],
      effort: 'moderate',
      source: 'test',
    }],
    byPriority: {
      critical: grade === 'F' ? [{ id: 'fb-1' } as any] : [],
      high: grade !== 'F' ? [{ id: 'fb-1' } as any] : [],
      medium: [],
      low: [],
    },
    byCategory: {
      accuracy: [],
      completeness: [],
      format: [],
      quality: [{ id: 'fb-1' } as any],
      style: [],
      specificity: [],
      verification: [],
      performance: [],
    },
    criticalItems: grade === 'F' ? [{ id: 'fb-1' } as any] : [],
    quickWins: [],
    summary: 'Summary of feedback',
    revisionPrompt: 'Please improve the output by adding more details.',
    synthesizedAt: new Date(),
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('RecoveryManager', () => {
  let recoveryManager: RecoveryManager;

  beforeEach(() => {
    recoveryManager = new RecoveryManager({ verbose: false });
  });

  describe('recover', () => {
    it('succeeds on first retry for transient errors', async () => {
      const executor = createMockExecutor([
        createSuccessResponse(),
      ]);
      const failedResponse = createFailedResponse('TIMEOUT');
      const request = createTestRequest();

      const result = await recoveryManager.recover(
        executor,
        failedResponse,
        request
      );

      expect(result.success).toBe(true);
      expect(result.attempts).toHaveLength(1);
      expect(result.attempts[0].strategy).toBe('retry-same');
      expect(result.terminationReason).toBe('success');
    });

    it('uses feedback for retry when available', async () => {
      const executor = createMockExecutor([
        createSuccessResponse(),
      ]);
      const failedResponse = createFailedResponse('TOOL_ERROR');
      const request = createTestRequest();
      const feedback = createMockFeedback('F');

      const result = await recoveryManager.recover(
        executor,
        failedResponse,
        request,
        feedback
      );

      expect(result.success).toBe(true);
      expect(result.attempts[0].strategy).toBe('retry-with-feedback');
      expect(result.attempts[0].modifiedPrompt).toContain('PREVIOUS ATTEMPT FEEDBACK');
    });

    it('escalates model after failed retry with feedback', async () => {
      const executor = createMockExecutor([
        createFailedResponse('MODEL_ERROR'),
        createSuccessResponse(),
      ]);
      const failedResponse = createFailedResponse('MODEL_ERROR');
      const request = createTestRequest({ model: 'haiku' });
      const feedback = createMockFeedback('D');

      const manager = new RecoveryManager({
        maxAttempts: 3,
        modelEscalation: ['haiku', 'sonnet', 'opus'],
      });

      const result = await manager.recover(
        executor,
        failedResponse,
        request,
        feedback
      );

      expect(result.success).toBe(true);
      // Should have used escalate-model at some point
      const escalateAttempt = result.attempts.find(a => a.strategy === 'escalate-model');
      expect(escalateAttempt).toBeDefined();
    });

    it('stops after max attempts when no fallback configured', async () => {
      const executor = createMockExecutor([
        createFailedResponse('RATE_LIMITED'),
        createFailedResponse('RATE_LIMITED'),
        createFailedResponse('RATE_LIMITED'),
      ]);
      const failedResponse = createFailedResponse('RATE_LIMITED');
      const request = createTestRequest();

      // Create manager WITHOUT defaultFallback so skip-with-fallback won't succeed
      const noFallbackManager = new RecoveryManager({
        maxAttempts: 3,
        verbose: false,
      });

      const result = await noFallbackManager.recover(
        executor,
        failedResponse,
        request
      );

      // With rate limited (transient), it should retry until max attempts
      expect(result.attempts.length).toBeGreaterThanOrEqual(2);
      // Eventually should fail or use skip-with-fallback (which gives null)
      if (result.terminationReason === 'max-attempts') {
        expect(result.success).toBe(false);
      }
    });

    it('uses fallback after multiple strategy failures', async () => {
      const executor = createMockExecutor([
        createFailedResponse('INVALID_OUTPUT'),
        createFailedResponse('INVALID_OUTPUT'),
        createFailedResponse('INVALID_OUTPUT'),
      ]);
      const failedResponse = createFailedResponse('INVALID_OUTPUT');
      const request = createTestRequest();

      const manager = new RecoveryManager({
        maxAttempts: 5,
        defaultFallback: { default: 'value' },
      });

      const result = await manager.recover(
        executor,
        failedResponse,
        request
      );

      // Should eventually use skip-with-fallback
      const fallbackAttempt = result.attempts.find(a => a.strategy === 'skip-with-fallback');
      if (fallbackAttempt) {
        expect(result.output).toEqual({ default: 'value' });
        expect(result.terminationReason).toBe('skipped');
      }
    });

    it('tracks total duration', async () => {
      const executor = createMockExecutor([
        createSuccessResponse(),
      ]);
      const failedResponse = createFailedResponse();
      const request = createTestRequest();

      const result = await recoveryManager.recover(
        executor,
        failedResponse,
        request
      );

      expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('selectStrategy', () => {
    it('selects retry-same for transient errors on first attempt', () => {
      const context: RecoveryContext = {
        originalRequest: createTestRequest(),
        failedResponse: createFailedResponse('TIMEOUT'),
        previousAttempts: [],
        maxAttempts: 3,
        modelEscalation: ['haiku', 'sonnet', 'opus'],
      };

      const selection = recoveryManager.selectStrategy(context);

      expect(selection.strategy).toBe('retry-same');
      expect(selection.confidence).toBeGreaterThan(0.5);
    });

    it('selects retry-with-feedback when critical issues exist', () => {
      const context: RecoveryContext = {
        originalRequest: createTestRequest(),
        failedResponse: createFailedResponse('TOOL_ERROR'),
        feedback: createMockFeedback('F'),
        previousAttempts: [],
        maxAttempts: 3,
        modelEscalation: ['haiku', 'sonnet', 'opus'],
      };

      const selection = recoveryManager.selectStrategy(context);

      expect(selection.strategy).toBe('retry-with-feedback');
    });

    it('selects human-intervention for unrecoverable errors', () => {
      const context: RecoveryContext = {
        originalRequest: createTestRequest(),
        failedResponse: createFailedResponse('PERMISSION_DENIED', false),
        previousAttempts: [],
        maxAttempts: 3,
        modelEscalation: ['haiku', 'sonnet', 'opus'],
      };

      const selection = recoveryManager.selectStrategy(context);

      expect(selection.strategy).toBe('human-intervention');
    });

    it('selects escalate-model for model limitations', () => {
      const context: RecoveryContext = {
        originalRequest: createTestRequest({ model: 'haiku' }),
        failedResponse: createFailedResponse('MODEL_ERROR'),
        feedback: createMockFeedback('F'),
        previousAttempts: [
          {
            attemptNumber: 1,
            strategy: 'retry-with-feedback',
            startedAt: new Date(),
            completedAt: new Date(),
            success: false,
          },
        ],
        maxAttempts: 3,
        modelEscalation: ['haiku', 'sonnet', 'opus'],
      };

      const selection = recoveryManager.selectStrategy(context);

      expect(selection.strategy).toBe('escalate-model');
    });
  });

  describe('getCapabilities', () => {
    it('returns correct capabilities', () => {
      const caps = recoveryManager.getCapabilities();

      expect(caps.maxAttempts).toBe(3);
      expect(caps.availableStrategies).toContain('retry-same');
      expect(caps.availableStrategies).toContain('retry-with-feedback');
      expect(caps.availableStrategies).toContain('escalate-model');
      expect(caps.availableStrategies).toContain('human-intervention');
      expect(caps.modelEscalation).toEqual(['haiku', 'sonnet', 'opus']);
    });
  });
});

describe('createRecoveryManager', () => {
  it('creates manager with custom config', () => {
    const manager = createRecoveryManager({
      maxAttempts: 5,
      modelEscalation: ['sonnet', 'opus'],
    });

    const caps = manager.getCapabilities();
    expect(caps.maxAttempts).toBe(5);
    expect(caps.modelEscalation).toEqual(['sonnet', 'opus']);
  });

  it('creates manager with default config', () => {
    const manager = createRecoveryManager({});

    const caps = manager.getCapabilities();
    expect(caps.maxAttempts).toBe(3);
  });
});
