/**
 * Input Validation Schemas
 *
 * Zod schemas for all tool inputs following mcp-creator security guidelines.
 */

import { z } from 'zod';

// ============================================================================
// Tool Input Schemas
// ============================================================================

export const MatchSkillsInputSchema = z.object({
  prompt: z.string()
    .min(1, 'Prompt is required')
    .max(10000, 'Prompt too long (max 10000 chars)'),
  maxResults: z.number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(5),
  includeGapAnalysis: z.boolean()
    .optional()
    .default(true),
});

export const SearchExternalInputSchema = z.object({
  query: z.string()
    .min(1, 'Query is required')
    .max(500, 'Query too long (max 500 chars)'),
  sources: z.array(
    z.enum(['mcp-registry', 'awesome-mcp', 'smithery', 'glama', 'github-topics'])
  )
    .min(1)
    .max(5)
    .optional(),
  maxResults: z.number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .default(5),
});

export const AnalyzeGapInputSchema = z.object({
  prompt: z.string()
    .min(1, 'Prompt is required')
    .max(10000, 'Prompt too long (max 10000 chars)'),
});

export const GetSkillInputSchema = z.object({
  id: z.string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Invalid skill ID format (use kebab-case)'),
});

export const ListSkillsInputSchema = z.object({
  category: z.string()
    .max(100)
    .optional(),
  type: z.enum(['skill', 'agent', 'mcp', 'all'])
    .optional()
    .default('all'),
});

export const BuildIndexInputSchema = z.object({
  force: z.boolean()
    .optional()
    .default(false),
});

// ============================================================================
// Type Exports
// ============================================================================

export type MatchSkillsInput = z.infer<typeof MatchSkillsInputSchema>;
export type SearchExternalInput = z.infer<typeof SearchExternalInputSchema>;
export type AnalyzeGapInput = z.infer<typeof AnalyzeGapInputSchema>;
export type GetSkillInput = z.infer<typeof GetSkillInputSchema>;
export type ListSkillsInput = z.infer<typeof ListSkillsInputSchema>;
export type BuildIndexInput = z.infer<typeof BuildIndexInputSchema>;
