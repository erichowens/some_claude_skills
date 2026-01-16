/**
 * Quality Assurance Layer
 *
 * Provides output validation, confidence scoring, and hallucination detection
 * for ensuring high-quality DAG node outputs.
 *
 * @module dag/quality
 */

// Output Validator - Schema-based validation
export {
  OutputValidator,
  outputValidator,
  validateOutput,
  isValidOutput,
  registerOutputSchema,
  CODE_OUTPUT_SCHEMA,
  MARKDOWN_OUTPUT_SCHEMA,
  JSON_OUTPUT_SCHEMA,
  FILE_PATH_OUTPUT_SCHEMA,
  type OutputSchema,
  type ValidationType,
  type ValidationIssue,
  type ValidationResult,
  type ValidationOptions,
  type IssueSeverity,
} from './output-validator';

// Confidence Scorer - Output confidence assessment
export {
  ConfidenceScorer,
  confidenceScorer,
  scoreConfidence,
  quickConfidenceScore,
  scoreConfidenceMany,
  type ConfidenceFactors,
  type ConfidenceWeights,
  type ConfidenceLevel,
  type ConfidenceScore,
  type ScoringInput,
  type ScoringOptions,
} from './confidence-scorer';

// Hallucination Detector - Fabrication detection
export {
  HallucinationDetector,
  hallucinationDetector,
  detectHallucinations,
  hasHallucinations,
  getHallucinationRisk,
  type HallucinationType,
  type RiskLevel,
  type HallucinationDetection,
  type DetectionResult,
  type DetectionOptions,
  type GroundTruth,
  type CustomDetector,
} from './hallucination-detector';
