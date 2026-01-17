"use strict";
/**
 * Bundle Type Definitions
 *
 * Bundles are curated collections of skills designed for specific
 * workflows or user personas.
 *
 * @module types/bundle
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.yamlToBundle = yamlToBundle;
/**
 * Convert YAML bundle to TypeScript Bundle
 */
function yamlToBundle(yaml) {
    return {
        id: yaml.name,
        title: yaml.title,
        description: yaml.description,
        audience: yaml.audience,
        difficulty: yaml.difficulty,
        skills: yaml.skills.map(function (s) { return ({
            id: s.id,
            role: s.role,
            optional: s.optional,
        }); }),
        installCommand: yaml.install_command,
        estimatedCost: {
            tokens: yaml.estimated_cost.tokens,
            usd: yaml.estimated_cost.usd,
        },
        useCases: yaml.use_cases,
        tags: yaml.tags,
        heroImage: yaml.hero_image,
        featured: yaml.featured,
        relatedBundles: yaml.related_bundles,
    };
}
