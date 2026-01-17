"use strict";
/**
 * Feedback & Learning Layer
 *
 * Provides iteration detection, feedback synthesis, and convergence monitoring
 * for ensuring DAG execution progressively improves toward goal states.
 *
 * @module dag/feedback
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRecoveryManager = exports.attemptRecovery = exports.recoveryManager = exports.RecoveryManager = exports.endConvergenceSession = exports.getConvergenceState = exports.hasConverged = exports.analyzeConvergence = exports.recordIteration = exports.startConvergenceSession = exports.convergenceMonitor = exports.ConvergenceMonitor = exports.getRevisionPrompt = exports.quickSynthesizeFeedback = exports.synthesizeFeedback = exports.feedbackSynthesizer = exports.FeedbackSynthesizer = exports.recommendedIterations = exports.needsIteration = exports.analyzeIteration = exports.iterationDetector = exports.IterationDetector = void 0;
// Iteration Detector - Determines when iteration is needed
var iteration_detector_1 = require("./iteration-detector");
Object.defineProperty(exports, "IterationDetector", { enumerable: true, get: function () { return iteration_detector_1.IterationDetector; } });
Object.defineProperty(exports, "iterationDetector", { enumerable: true, get: function () { return iteration_detector_1.iterationDetector; } });
Object.defineProperty(exports, "analyzeIteration", { enumerable: true, get: function () { return iteration_detector_1.analyzeIteration; } });
Object.defineProperty(exports, "needsIteration", { enumerable: true, get: function () { return iteration_detector_1.needsIteration; } });
Object.defineProperty(exports, "recommendedIterations", { enumerable: true, get: function () { return iteration_detector_1.recommendedIterations; } });
// Feedback Synthesizer - Creates actionable feedback
var feedback_synthesizer_1 = require("./feedback-synthesizer");
Object.defineProperty(exports, "FeedbackSynthesizer", { enumerable: true, get: function () { return feedback_synthesizer_1.FeedbackSynthesizer; } });
Object.defineProperty(exports, "feedbackSynthesizer", { enumerable: true, get: function () { return feedback_synthesizer_1.feedbackSynthesizer; } });
Object.defineProperty(exports, "synthesizeFeedback", { enumerable: true, get: function () { return feedback_synthesizer_1.synthesizeFeedback; } });
Object.defineProperty(exports, "quickSynthesizeFeedback", { enumerable: true, get: function () { return feedback_synthesizer_1.quickSynthesizeFeedback; } });
Object.defineProperty(exports, "getRevisionPrompt", { enumerable: true, get: function () { return feedback_synthesizer_1.getRevisionPrompt; } });
// Convergence Monitor - Tracks progress toward goals
var convergence_monitor_1 = require("./convergence-monitor");
Object.defineProperty(exports, "ConvergenceMonitor", { enumerable: true, get: function () { return convergence_monitor_1.ConvergenceMonitor; } });
Object.defineProperty(exports, "convergenceMonitor", { enumerable: true, get: function () { return convergence_monitor_1.convergenceMonitor; } });
Object.defineProperty(exports, "startConvergenceSession", { enumerable: true, get: function () { return convergence_monitor_1.startConvergenceSession; } });
Object.defineProperty(exports, "recordIteration", { enumerable: true, get: function () { return convergence_monitor_1.recordIteration; } });
Object.defineProperty(exports, "analyzeConvergence", { enumerable: true, get: function () { return convergence_monitor_1.analyzeConvergence; } });
Object.defineProperty(exports, "hasConverged", { enumerable: true, get: function () { return convergence_monitor_1.hasConverged; } });
Object.defineProperty(exports, "getConvergenceState", { enumerable: true, get: function () { return convergence_monitor_1.getConvergenceState; } });
Object.defineProperty(exports, "endConvergenceSession", { enumerable: true, get: function () { return convergence_monitor_1.endConvergenceSession; } });
// Recovery Manager - Handles failed task recovery
var recovery_manager_1 = require("./recovery-manager");
Object.defineProperty(exports, "RecoveryManager", { enumerable: true, get: function () { return recovery_manager_1.RecoveryManager; } });
Object.defineProperty(exports, "recoveryManager", { enumerable: true, get: function () { return recovery_manager_1.recoveryManager; } });
Object.defineProperty(exports, "attemptRecovery", { enumerable: true, get: function () { return recovery_manager_1.attemptRecovery; } });
Object.defineProperty(exports, "createRecoveryManager", { enumerable: true, get: function () { return recovery_manager_1.createRecoveryManager; } });
