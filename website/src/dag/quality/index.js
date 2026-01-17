"use strict";
/**
 * Quality Assurance Layer
 *
 * Provides output validation, confidence scoring, and hallucination detection
 * for ensuring high-quality DAG node outputs.
 *
 * @module dag/quality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHallucinationRisk = exports.hasHallucinations = exports.detectHallucinations = exports.hallucinationDetector = exports.HallucinationDetector = exports.scoreConfidenceMany = exports.quickConfidenceScore = exports.scoreConfidence = exports.confidenceScorer = exports.ConfidenceScorer = exports.FILE_PATH_OUTPUT_SCHEMA = exports.JSON_OUTPUT_SCHEMA = exports.MARKDOWN_OUTPUT_SCHEMA = exports.CODE_OUTPUT_SCHEMA = exports.registerOutputSchema = exports.isValidOutput = exports.validateOutput = exports.outputValidator = exports.OutputValidator = void 0;
// Output Validator - Schema-based validation
var output_validator_1 = require("./output-validator");
Object.defineProperty(exports, "OutputValidator", { enumerable: true, get: function () { return output_validator_1.OutputValidator; } });
Object.defineProperty(exports, "outputValidator", { enumerable: true, get: function () { return output_validator_1.outputValidator; } });
Object.defineProperty(exports, "validateOutput", { enumerable: true, get: function () { return output_validator_1.validateOutput; } });
Object.defineProperty(exports, "isValidOutput", { enumerable: true, get: function () { return output_validator_1.isValidOutput; } });
Object.defineProperty(exports, "registerOutputSchema", { enumerable: true, get: function () { return output_validator_1.registerOutputSchema; } });
Object.defineProperty(exports, "CODE_OUTPUT_SCHEMA", { enumerable: true, get: function () { return output_validator_1.CODE_OUTPUT_SCHEMA; } });
Object.defineProperty(exports, "MARKDOWN_OUTPUT_SCHEMA", { enumerable: true, get: function () { return output_validator_1.MARKDOWN_OUTPUT_SCHEMA; } });
Object.defineProperty(exports, "JSON_OUTPUT_SCHEMA", { enumerable: true, get: function () { return output_validator_1.JSON_OUTPUT_SCHEMA; } });
Object.defineProperty(exports, "FILE_PATH_OUTPUT_SCHEMA", { enumerable: true, get: function () { return output_validator_1.FILE_PATH_OUTPUT_SCHEMA; } });
// Confidence Scorer - Output confidence assessment
var confidence_scorer_1 = require("./confidence-scorer");
Object.defineProperty(exports, "ConfidenceScorer", { enumerable: true, get: function () { return confidence_scorer_1.ConfidenceScorer; } });
Object.defineProperty(exports, "confidenceScorer", { enumerable: true, get: function () { return confidence_scorer_1.confidenceScorer; } });
Object.defineProperty(exports, "scoreConfidence", { enumerable: true, get: function () { return confidence_scorer_1.scoreConfidence; } });
Object.defineProperty(exports, "quickConfidenceScore", { enumerable: true, get: function () { return confidence_scorer_1.quickConfidenceScore; } });
Object.defineProperty(exports, "scoreConfidenceMany", { enumerable: true, get: function () { return confidence_scorer_1.scoreConfidenceMany; } });
// Hallucination Detector - Fabrication detection
var hallucination_detector_1 = require("./hallucination-detector");
Object.defineProperty(exports, "HallucinationDetector", { enumerable: true, get: function () { return hallucination_detector_1.HallucinationDetector; } });
Object.defineProperty(exports, "hallucinationDetector", { enumerable: true, get: function () { return hallucination_detector_1.hallucinationDetector; } });
Object.defineProperty(exports, "detectHallucinations", { enumerable: true, get: function () { return hallucination_detector_1.detectHallucinations; } });
Object.defineProperty(exports, "hasHallucinations", { enumerable: true, get: function () { return hallucination_detector_1.hasHallucinations; } });
Object.defineProperty(exports, "getHallucinationRisk", { enumerable: true, get: function () { return hallucination_detector_1.getHallucinationRisk; } });
