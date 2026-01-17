#!/usr/bin/env ts-node
"use strict";
/**
 * Skill-Specific OG Image Generator
 *
 * Generates social media preview images for individual skills, artifacts, and pages.
 * Creates a split layout: skill hero image (left) + vaporwave gradient with text (right).
 *
 * Usage:
 *   npx ts-node scripts/generateSkillOgImage.ts --skill wedding-immortalist
 *   npx ts-node scripts/generateSkillOgImage.ts --artifact recovery-communication-stack
 *   npx ts-node scripts/generateSkillOgImage.ts --all
 *
 * Requires:
 *   - ImageMagick installed (brew install imagemagick)
 *   - Press Start 2P font installed
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOgImage = generateOgImage;
exports.generateAllSkillOgImages = generateAllSkillOgImages;
var child_process_1 = require("child_process");
var fs = require("fs");
var path = require("path");
// Configuration
var PROJECT_ROOT = path.resolve(__dirname, '..');
var SKILLS_DIR = path.resolve(PROJECT_ROOT, '../.claude/skills');
var HERO_IMAGES_DIR = path.resolve(PROJECT_ROOT, 'static/img/skills');
var OUTPUT_DIR = path.resolve(PROJECT_ROOT, 'static/img/og-skills');
var FONT_NAME = 'Press-Start-2P-Regular';
// Gradient presets by category
var GRADIENTS = {
    design: ['#ff6b9d', '#c44569', '#6b2d5c'], // Pink to deep magenta
    recovery: ['#ffd700', '#ff8c00', '#9b4dca'], // Gold sunrise to purple
    tech: ['#00d4ff', '#0099cc', '#1a1a2e'], // Cyan to deep blue
    lifestyle: ['#50C878', '#228B22', '#1a1a2e'], // Green gradient
    mystery: ['#9b59b6', '#6c3483', '#1a1a2e'], // Purple mystery
    default: ['#ff6b9d', '#9b4dca', '#1a1a2e'], // Default vaporwave
};
// Skill category mappings
var SKILL_CATEGORIES = {
    // Lifestyle skills
    'wedding-immortalist': 'design',
    'fancy-yard-landscaper': 'lifestyle',
    'maximalist-wall-decorator': 'design',
    'panic-room-finder': 'mystery',
    'interior-design-expert': 'design',
    // Recovery skills
    'modern-drug-rehab-computer': 'recovery',
    'sober-addict-protector': 'recovery',
    'grief-companion': 'recovery',
    'pet-memorial-creator': 'recovery',
    // Tech skills
    'skill-logger': 'tech',
    'digital-estate-planner': 'tech',
    // Personal skills
    'partner-text-coach': 'lifestyle',
    'adhd-daily-planner': 'lifestyle',
    // Design skills
    'vaporwave-glassomorphic-ui-designer': 'design',
    'collage-layout-expert': 'design',
    'photo-composition-critic': 'design',
    // AI/ML skills
    'drone-cv-expert': 'tech',
    'drone-inspection-specialist': 'tech',
    'clip-aware-embeddings': 'tech',
    // Meta skills
    'skill-coach': 'default',
    'agent-creator': 'default',
};
function kebabToTitle(str) {
    return str
        .split('-')
        .map(function (word) { return word.charAt(0).toUpperCase() + word.slice(1); })
        .join(' ');
}
function truncateDescription(desc, maxLength) {
    if (maxLength === void 0) { maxLength = 50; }
    if (desc.length <= maxLength)
        return desc;
    return desc.slice(0, maxLength - 3) + '...';
}
function getGradient(category) {
    return GRADIENTS[category] || GRADIENTS.default;
}
function generateOgImage(config) {
    var skillName = config.skillName, displayName = config.displayName, description = config.description, heroImagePath = config.heroImagePath, _a = config.category, category = _a === void 0 ? 'default' : _a;
    var outputPath = path.join(OUTPUT_DIR, "".concat(skillName, "-og.png"));
    var gradient = getGradient(category);
    var truncatedDesc = truncateDescription(description);
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    // Check if hero image exists
    var heroPath = heroImagePath || path.join(HERO_IMAGES_DIR, "".concat(skillName, "-hero.png"));
    var hasHeroImage = fs.existsSync(heroPath);
    // Build ImageMagick command
    var command;
    if (hasHeroImage) {
        // With hero image: split layout
        command = "\n      magick -size 1200x630 xc:none \\\n        \\( \"".concat(heroPath, "\" -resize 600x630^ -gravity center -extent 600x630 \\) \\\n        -gravity west -composite \\\n        \\( -size 600x630 \\\n           xc:'").concat(gradient[0], "' \\\n           -colorize 0 \\\n           \\( -size 600x630 gradient:'").concat(gradient[1], "'-'").concat(gradient[2], "' \\) \\\n           -compose over -composite \\\n        \\) \\\n        -gravity east -composite \\\n        -gravity east \\\n        -fill white \\\n        -font \"").concat(FONT_NAME, "\" \\\n        -pointsize 18 \\\n        -annotate +30+250 \"").concat(displayName, "\" \\\n        -fill '#B0B0C0' \\\n        -pointsize 10 \\\n        -annotate +30+285 \"").concat(truncatedDesc, "\" \\\n        \\( -size 1200x50 xc:'rgba(20,20,40,0.92)' \\) \\\n        -gravity south -composite \\\n        -fill white \\\n        -pointsize 12 \\\n        -gravity south \\\n        -annotate +0+18 \"SOME CLAUDE SKILLS  \u2022  someclaudeskills.com\" \\\n        \"").concat(outputPath, "\"\n    ").replace(/\n\s*/g, ' ');
    }
    else {
        // Without hero image: full gradient with centered text
        command = "\n      magick -size 1200x630 \\\n        gradient:'".concat(gradient[0], "'-'").concat(gradient[2], "' \\\n        -rotate 45 \\\n        -gravity center -extent 1200x630 \\\n        -fill white \\\n        -font \"").concat(FONT_NAME, "\" \\\n        -pointsize 28 \\\n        -gravity center \\\n        -annotate +0-30 \"").concat(displayName, "\" \\\n        -fill '#B0B0C0' \\\n        -pointsize 12 \\\n        -annotate +0+30 \"").concat(truncatedDesc, "\" \\\n        \\( -size 1200x50 xc:'rgba(20,20,40,0.92)' \\) \\\n        -gravity south -composite \\\n        -fill white \\\n        -pointsize 12 \\\n        -gravity south \\\n        -annotate +0+18 \"SOME CLAUDE SKILLS  \u2022  someclaudeskills.com\" \\\n        \"").concat(outputPath, "\"\n    ").replace(/\n\s*/g, ' ');
    }
    try {
        (0, child_process_1.execSync)(command, { stdio: 'inherit' });
        console.log("\u2705 Generated: ".concat(outputPath));
        return outputPath;
    }
    catch (error) {
        console.error("\u274C Failed to generate OG image for ".concat(skillName, ":"), error);
        throw error;
    }
}
function getSkillDescription(skillDir) {
    var skillMdPath = path.join(skillDir, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) {
        return 'AI-powered skill for Claude Code';
    }
    var content = fs.readFileSync(skillMdPath, 'utf-8');
    // Extract description from frontmatter
    var frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
        var descMatch = frontmatterMatch[1].match(/description:\s*["']?([^"'\n]+)/);
        if (descMatch) {
            // Get first sentence or first 100 chars
            var desc = descMatch[1];
            var firstSentence = desc.split('.')[0];
            return firstSentence.slice(0, 80);
        }
    }
    return 'AI-powered skill for Claude Code';
}
function generateAllSkillOgImages() {
    if (!fs.existsSync(SKILLS_DIR)) {
        console.error("Skills directory not found: ".concat(SKILLS_DIR));
        return;
    }
    var skills = fs.readdirSync(SKILLS_DIR).filter(function (name) {
        var stat = fs.statSync(path.join(SKILLS_DIR, name));
        return stat.isDirectory() && !name.startsWith('.');
    });
    console.log("Found ".concat(skills.length, " skills. Generating OG images..."));
    for (var _i = 0, skills_1 = skills; _i < skills_1.length; _i++) {
        var skillName = skills_1[_i];
        var skillDir = path.join(SKILLS_DIR, skillName);
        var description = getSkillDescription(skillDir);
        var category = SKILL_CATEGORIES[skillName] || 'default';
        try {
            generateOgImage({
                skillName: skillName,
                displayName: kebabToTitle(skillName),
                description: description,
                category: category,
            });
        }
        catch (error) {
            console.error("Skipping ".concat(skillName, " due to error"));
        }
    }
    console.log('Done!');
}
// CLI handling
var args = process.argv.slice(2);
if (args.includes('--all')) {
    generateAllSkillOgImages();
}
else if (args.includes('--skill')) {
    var skillIndex = args.indexOf('--skill');
    var skillName = args[skillIndex + 1];
    if (!skillName) {
        console.error('Please provide a skill name: --skill <skill-name>');
        process.exit(1);
    }
    var skillDir = path.join(SKILLS_DIR, skillName);
    var description = getSkillDescription(skillDir);
    var category = SKILL_CATEGORIES[skillName] || 'default';
    generateOgImage({
        skillName: skillName,
        displayName: kebabToTitle(skillName),
        description: description,
        category: category,
    });
}
else {
    console.log("\nSkill OG Image Generator\n\nUsage:\n  npx ts-node scripts/generateSkillOgImage.ts --skill <skill-name>\n  npx ts-node scripts/generateSkillOgImage.ts --all\n\nOptions:\n  --skill <name>  Generate OG image for specific skill\n  --all           Generate OG images for all skills\n\nExamples:\n  npx ts-node scripts/generateSkillOgImage.ts --skill wedding-immortalist\n  npx ts-node scripts/generateSkillOgImage.ts --all\n  ");
}
