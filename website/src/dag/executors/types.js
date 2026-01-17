"use strict";
/**
 * Pluggable Executor System for DAG Framework
 *
 * This module defines the abstraction layer that allows the DAG framework
 * to execute tasks via different mechanisms:
 * - Task tool (current, in-session)
 * - Git worktrees (parallel isolated sessions)
 * - claude -p processes (parallel stateless)
 * - MCP coordinators (future, lightweight)
 *
 * The key insight: All executors take prompts and produce results.
 * The differences are in isolation, overhead, and coordination.
 */
Object.defineProperty(exports, "__esModule", { value: true });
