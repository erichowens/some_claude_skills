/**
 * DAG Runtimes Module Exports
 *
 * Runtime implementations for different execution environments.
 */

// Claude Code CLI Runtime
export {
  ClaudeCodeRuntime,
  createClaudeCodeRuntime,
  formatTaskCall,
  generateParallelTaskMessage,
} from './claude-code-cli';

export type {
  TaskToolCall,
  TaskToolResult,
  ExecutionContext,
  ClaudeCodeRuntimeConfig,
  ExecutionPlan,
  WavePlan,
} from './claude-code-cli';

// SDK TypeScript Runtime
export {
  SDKTypescriptRuntime,
  createSDKRuntime,
  createMockClient,
} from './sdk-typescript';

export type {
  AnthropicClient,
  CreateMessageParams,
  APIResponse,
  Message,
  ToolDefinition,
  TextBlock,
  ToolUseBlock,
  ToolResultBlock,
  ContentBlock,
  SDKExecutionContext,
  SDKRuntimeConfig,
  SDKExecutionPlan,
  SDKWavePlan,
  SDKNodePlan,
} from './sdk-typescript';
