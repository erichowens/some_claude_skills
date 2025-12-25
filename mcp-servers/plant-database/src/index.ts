#!/usr/bin/env node
/**
 * Plant Database MCP Server
 *
 * An MCP server providing plant information for landscaping and gardening.
 * Features:
 * - USDA Hardiness Zone lookup by ZIP code
 * - Plant search by characteristics (sun, water, height, etc.)
 * - Privacy screen plant recommendations
 * - Native plant suggestions by region
 * - Deer/pest resistance information
 * - Growth rate and mature size data
 *
 * Tools:
 * - lookup_zone: Get USDA hardiness zone for a ZIP code
 * - search_plants: Search plants by criteria
 * - get_plant: Get detailed plant information
 * - recommend_privacy_screen: Get privacy screening plant suggestions
 * - find_native_plants: Find native plants for a region
 * - check_compatibility: Check if a plant works in a specific zone
 *
 * Pairs with: fancy-yard-landscaper skill
 * Part of someclaudeskills.com
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { PLANTS_DATABASE, type Plant } from './plants.js';
import { ZIP_TO_ZONE, type ZoneInfo } from './zones.js';

// ============================================================================
// Input Schemas
// ============================================================================

const LookupZoneSchema = z.object({
  zip_code: z.string().regex(/^\d{5}$/, 'Must be a 5-digit ZIP code'),
});

const SearchPlantsSchema = z.object({
  zone: z.string().optional().describe('USDA hardiness zone (e.g., "6b", "7a")'),
  sun: z.enum(['full_sun', 'part_shade', 'full_shade', 'any']).optional(),
  water: z.enum(['low', 'medium', 'high', 'any']).optional(),
  type: z.enum(['tree', 'shrub', 'perennial', 'grass', 'vine', 'any']).optional(),
  evergreen: z.boolean().optional(),
  deer_resistant: z.boolean().optional(),
  native_region: z.string().optional(),
  max_height_ft: z.number().optional(),
  min_height_ft: z.number().optional(),
  growth_rate: z.enum(['slow', 'medium', 'fast', 'any']).optional(),
  limit: z.number().min(1).max(50).default(20),
});

const GetPlantSchema = z.object({
  plant_id: z.string().describe('Plant identifier (common name, slug format)'),
});

const RecommendPrivacyScreenSchema = z.object({
  zone: z.string().describe('USDA hardiness zone'),
  height_needed_ft: z.number().min(4).max(50).describe('Desired screening height in feet'),
  length_ft: z.number().min(1).describe('Length of area to screen in feet'),
  timeline: z.enum(['fast', 'medium', 'patient']).default('medium').describe('How quickly you need coverage'),
  avoid_arborvitae: z.boolean().default(true).describe('Avoid arborvitae (common problems)'),
  deer_pressure: z.enum(['none', 'low', 'high']).default('low'),
});

const FindNativePlantsSchema = z.object({
  region: z.enum([
    'northeast', 'southeast', 'midwest', 'southwest',
    'pacific_northwest', 'california', 'mountain_west', 'great_plains'
  ]),
  type: z.enum(['tree', 'shrub', 'perennial', 'grass', 'any']).default('any'),
  for_pollinators: z.boolean().default(false),
  limit: z.number().min(1).max(30).default(15),
});

const CheckCompatibilitySchema = z.object({
  plant_id: z.string(),
  zone: z.string(),
});

// ============================================================================
// Server Setup
// ============================================================================

const server = new Server(
  {
    name: 'plant-database',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ============================================================================
// Tool Definitions
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'lookup_zone',
        description: 'Get USDA hardiness zone for a ZIP code. Returns zone (e.g., "6b"), average minimum temperature, and first/last frost dates.',
        inputSchema: {
          type: 'object',
          properties: {
            zip_code: {
              type: 'string',
              description: '5-digit US ZIP code',
              pattern: '^\\d{5}$',
            },
          },
          required: ['zip_code'],
        },
      },
      {
        name: 'search_plants',
        description: 'Search plants by characteristics. Filter by zone compatibility, sun requirements, water needs, type, deer resistance, and more.',
        inputSchema: {
          type: 'object',
          properties: {
            zone: { type: 'string', description: 'USDA zone (e.g., "6b")' },
            sun: { type: 'string', enum: ['full_sun', 'part_shade', 'full_shade', 'any'] },
            water: { type: 'string', enum: ['low', 'medium', 'high', 'any'] },
            type: { type: 'string', enum: ['tree', 'shrub', 'perennial', 'grass', 'vine', 'any'] },
            evergreen: { type: 'boolean' },
            deer_resistant: { type: 'boolean' },
            native_region: { type: 'string' },
            max_height_ft: { type: 'number' },
            min_height_ft: { type: 'number' },
            growth_rate: { type: 'string', enum: ['slow', 'medium', 'fast', 'any'] },
            limit: { type: 'number', default: 20 },
          },
        },
      },
      {
        name: 'get_plant',
        description: 'Get detailed information about a specific plant including care requirements, mature size, growth rate, and potential problems.',
        inputSchema: {
          type: 'object',
          properties: {
            plant_id: {
              type: 'string',
              description: 'Plant identifier (slug format, e.g., "nellie-stevens-holly")',
            },
          },
          required: ['plant_id'],
        },
      },
      {
        name: 'recommend_privacy_screen',
        description: 'Get recommendations for privacy screening plants based on your zone, needed height, timeline, and conditions. Intelligently avoids common mistakes like arborvitae in deer-heavy areas.',
        inputSchema: {
          type: 'object',
          properties: {
            zone: { type: 'string', description: 'USDA zone' },
            height_needed_ft: { type: 'number', description: 'Desired height in feet' },
            length_ft: { type: 'number', description: 'Length to screen in feet' },
            timeline: { type: 'string', enum: ['fast', 'medium', 'patient'], default: 'medium' },
            avoid_arborvitae: { type: 'boolean', default: true },
            deer_pressure: { type: 'string', enum: ['none', 'low', 'high'], default: 'low' },
          },
          required: ['zone', 'height_needed_ft', 'length_ft'],
        },
      },
      {
        name: 'find_native_plants',
        description: 'Find native plants for a US region. Native plants support local ecosystems, require less maintenance, and are adapted to local conditions.',
        inputSchema: {
          type: 'object',
          properties: {
            region: {
              type: 'string',
              enum: ['northeast', 'southeast', 'midwest', 'southwest', 'pacific_northwest', 'california', 'mountain_west', 'great_plains'],
            },
            type: { type: 'string', enum: ['tree', 'shrub', 'perennial', 'grass', 'any'], default: 'any' },
            for_pollinators: { type: 'boolean', default: false },
            limit: { type: 'number', default: 15 },
          },
          required: ['region'],
        },
      },
      {
        name: 'check_compatibility',
        description: 'Check if a specific plant is compatible with a hardiness zone. Returns compatibility status and any warnings.',
        inputSchema: {
          type: 'object',
          properties: {
            plant_id: { type: 'string' },
            zone: { type: 'string' },
          },
          required: ['plant_id', 'zone'],
        },
      },
    ],
  };
});

// ============================================================================
// Tool Implementations
// ============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'lookup_zone': {
        const input = LookupZoneSchema.parse(args);
        const zoneInfo = ZIP_TO_ZONE[input.zip_code];

        if (!zoneInfo) {
          // Try to estimate from first 3 digits
          const prefix = input.zip_code.substring(0, 3);
          const estimated = estimateZoneFromPrefix(prefix);
          if (estimated) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  zip_code: input.zip_code,
                  zone: estimated.zone,
                  estimated: true,
                  note: 'Zone estimated from regional data. Check USDA map for precise zone.',
                  min_temp_f: estimated.min_temp_f,
                }, null, 2),
              }],
            };
          }
          throw new McpError(ErrorCode.InvalidParams, `Zone data not found for ZIP ${input.zip_code}`);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              zip_code: input.zip_code,
              ...zoneInfo,
            }, null, 2),
          }],
        };
      }

      case 'search_plants': {
        const input = SearchPlantsSchema.parse(args);
        const results = searchPlants(input);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              query: input,
              count: results.length,
              plants: results,
            }, null, 2),
          }],
        };
      }

      case 'get_plant': {
        const input = GetPlantSchema.parse(args);
        const plant = PLANTS_DATABASE[input.plant_id];

        if (!plant) {
          // Try fuzzy match
          const matches = Object.keys(PLANTS_DATABASE).filter(k =>
            k.includes(input.plant_id) || input.plant_id.includes(k)
          );
          if (matches.length > 0) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  error: 'Plant not found',
                  suggestions: matches.slice(0, 5),
                }, null, 2),
              }],
            };
          }
          throw new McpError(ErrorCode.InvalidParams, `Plant not found: ${input.plant_id}`);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(plant, null, 2),
          }],
        };
      }

      case 'recommend_privacy_screen': {
        const input = RecommendPrivacyScreenSchema.parse(args);
        const recommendations = recommendPrivacyScreen(input);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(recommendations, null, 2),
          }],
        };
      }

      case 'find_native_plants': {
        const input = FindNativePlantsSchema.parse(args);
        const natives = findNativePlants(input);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              region: input.region,
              count: natives.length,
              plants: natives,
            }, null, 2),
          }],
        };
      }

      case 'check_compatibility': {
        const input = CheckCompatibilitySchema.parse(args);
        const result = checkZoneCompatibility(input.plant_id, input.zone);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      );
    }
    throw error;
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

function parseZone(zone: string): { number: number; letter: string } {
  const match = zone.match(/^(\d+)([ab])?$/i);
  if (!match) throw new Error(`Invalid zone format: ${zone}`);
  return {
    number: parseInt(match[1], 10),
    letter: (match[2] || 'a').toLowerCase(),
  };
}

function isZoneCompatible(plantZones: string, targetZone: string): boolean {
  const [minZone, maxZone] = plantZones.split('-').map(z => parseZone(z.trim()));
  const target = parseZone(targetZone);

  const minNum = minZone.number + (minZone.letter === 'b' ? 0.5 : 0);
  const maxNum = maxZone ? maxZone.number + (maxZone.letter === 'b' ? 0.5 : 0) : 11;
  const targetNum = target.number + (target.letter === 'b' ? 0.5 : 0);

  return targetNum >= minNum && targetNum <= maxNum;
}

function searchPlants(criteria: z.infer<typeof SearchPlantsSchema>): Plant[] {
  let results = Object.values(PLANTS_DATABASE);

  if (criteria.zone) {
    results = results.filter(p => isZoneCompatible(p.hardiness_zones, criteria.zone!));
  }

  if (criteria.sun && criteria.sun !== 'any') {
    results = results.filter(p => p.sun.includes(criteria.sun!) || p.sun.includes('part_shade'));
  }

  if (criteria.water && criteria.water !== 'any') {
    results = results.filter(p => p.water === criteria.water);
  }

  if (criteria.type && criteria.type !== 'any') {
    results = results.filter(p => p.type === criteria.type);
  }

  if (criteria.evergreen !== undefined) {
    results = results.filter(p => p.evergreen === criteria.evergreen);
  }

  if (criteria.deer_resistant) {
    results = results.filter(p => p.deer_resistant);
  }

  if (criteria.native_region) {
    results = results.filter(p =>
      p.native_regions?.includes(criteria.native_region!)
    );
  }

  if (criteria.max_height_ft) {
    results = results.filter(p => p.mature_height_ft <= criteria.max_height_ft!);
  }

  if (criteria.min_height_ft) {
    results = results.filter(p => p.mature_height_ft >= criteria.min_height_ft!);
  }

  if (criteria.growth_rate && criteria.growth_rate !== 'any') {
    results = results.filter(p => p.growth_rate === criteria.growth_rate);
  }

  return results.slice(0, criteria.limit);
}

function recommendPrivacyScreen(criteria: z.infer<typeof RecommendPrivacyScreenSchema>) {
  const warnings: string[] = [];
  let candidates = Object.values(PLANTS_DATABASE).filter(p =>
    (p.type === 'tree' || p.type === 'shrub') &&
    p.evergreen &&
    isZoneCompatible(p.hardiness_zones, criteria.zone)
  );

  // Filter by height
  candidates = candidates.filter(p =>
    p.mature_height_ft >= criteria.height_needed_ft * 0.8
  );

  // Avoid arborvitae if requested
  if (criteria.avoid_arborvitae) {
    const arborvitaeCount = candidates.filter(p =>
      p.common_name.toLowerCase().includes('arborvitae')
    ).length;
    candidates = candidates.filter(p =>
      !p.common_name.toLowerCase().includes('arborvitae')
    );
    if (arborvitaeCount > 0) {
      warnings.push(
        'Excluded arborvitae varieties. Common issues include: bagworms, deer browsing, winter burn, and slow establishment. Consider hollies or skip laurel instead.'
      );
    }
  }

  // Filter by deer pressure
  if (criteria.deer_pressure === 'high') {
    candidates = candidates.filter(p => p.deer_resistant);
    warnings.push('Filtered for deer-resistant plants only due to high deer pressure.');
  }

  // Sort by growth rate based on timeline
  const growthOrder = criteria.timeline === 'fast'
    ? { fast: 0, medium: 1, slow: 2 }
    : criteria.timeline === 'patient'
    ? { slow: 0, medium: 1, fast: 2 }
    : { medium: 0, fast: 1, slow: 2 };

  candidates.sort((a, b) => growthOrder[a.growth_rate] - growthOrder[b.growth_rate]);

  // Calculate spacing
  const recommendations = candidates.slice(0, 5).map(plant => {
    const spacingFt = plant.mature_width_ft * 0.7; // Overlap for density
    const plantsNeeded = Math.ceil(criteria.length_ft / spacingFt);
    const yearsToPrivacy = plant.growth_rate === 'fast' ? 2 :
                          plant.growth_rate === 'medium' ? 4 : 7;

    return {
      plant,
      spacing_ft: Math.round(spacingFt * 10) / 10,
      plants_needed: plantsNeeded,
      estimated_years_to_privacy: yearsToPrivacy,
    };
  });

  return {
    criteria,
    warnings,
    recommendations,
    tip: 'For fastest privacy, consider staggered double rows with different species for visual interest and disease resistance.',
  };
}

function findNativePlants(criteria: z.infer<typeof FindNativePlantsSchema>): Plant[] {
  let results = Object.values(PLANTS_DATABASE).filter(p =>
    p.native_regions?.includes(criteria.region)
  );

  if (criteria.type !== 'any') {
    results = results.filter(p => p.type === criteria.type);
  }

  if (criteria.for_pollinators) {
    results = results.filter(p => p.pollinator_friendly);
  }

  return results.slice(0, criteria.limit);
}

function checkZoneCompatibility(plantId: string, zone: string) {
  const plant = PLANTS_DATABASE[plantId];
  if (!plant) {
    return { compatible: false, error: 'Plant not found' };
  }

  const compatible = isZoneCompatible(plant.hardiness_zones, zone);
  const targetZone = parseZone(zone);
  const [minZone] = plant.hardiness_zones.split('-').map(z => parseZone(z.trim()));

  const warnings: string[] = [];

  if (compatible) {
    if (targetZone.number === minZone.number) {
      warnings.push('This zone is at the cold edge of this plant\'s range. Consider winter protection.');
    }
  }

  return {
    plant_id: plantId,
    common_name: plant.common_name,
    zone_checked: zone,
    plant_zones: plant.hardiness_zones,
    compatible,
    warnings,
  };
}

function estimateZoneFromPrefix(prefix: string): ZoneInfo | null {
  // Simplified zone estimation by ZIP prefix regions
  const prefixZones: Record<string, ZoneInfo> = {
    '100': { zone: '7a', min_temp_f: 0 },  // NYC area
    '021': { zone: '6b', min_temp_f: -5 }, // Boston
    '606': { zone: '5b', min_temp_f: -15 }, // Chicago
    '900': { zone: '10a', min_temp_f: 30 }, // LA
    '331': { zone: '10a', min_temp_f: 30 }, // Miami
    '752': { zone: '8a', min_temp_f: 10 }, // Dallas
    '980': { zone: '8b', min_temp_f: 15 }, // Seattle
  };

  return prefixZones[prefix] || null;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Plant Database MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
