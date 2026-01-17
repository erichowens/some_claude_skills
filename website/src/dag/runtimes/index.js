"use strict";
/**
 * DAG Runtimes Module Exports
 *
 * Runtime implementations for different execution environments.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockClient = exports.createSDKRuntime = exports.SDKTypescriptRuntime = exports.generateParallelTaskMessage = exports.formatTaskCall = exports.createClaudeCodeRuntime = exports.ClaudeCodeRuntime = void 0;
// Claude Code CLI Runtime
var claude_code_cli_1 = require("./claude-code-cli");
Object.defineProperty(exports, "ClaudeCodeRuntime", { enumerable: true, get: function () { return claude_code_cli_1.ClaudeCodeRuntime; } });
Object.defineProperty(exports, "createClaudeCodeRuntime", { enumerable: true, get: function () { return claude_code_cli_1.createClaudeCodeRuntime; } });
Object.defineProperty(exports, "formatTaskCall", { enumerable: true, get: function () { return claude_code_cli_1.formatTaskCall; } });
Object.defineProperty(exports, "generateParallelTaskMessage", { enumerable: true, get: function () { return claude_code_cli_1.generateParallelTaskMessage; } });
// SDK TypeScript Runtime
var sdk_typescript_1 = require("./sdk-typescript");
Object.defineProperty(exports, "SDKTypescriptRuntime", { enumerable: true, get: function () { return sdk_typescript_1.SDKTypescriptRuntime; } });
Object.defineProperty(exports, "createSDKRuntime", { enumerable: true, get: function () { return sdk_typescript_1.createSDKRuntime; } });
Object.defineProperty(exports, "createMockClient", { enumerable: true, get: function () { return sdk_typescript_1.createMockClient; } });
