"use strict";
/**
 * Documentation Generator
 *
 * Generates docs/skills/*.md files from SKILL.md content.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSkillDocs = generateSkillDocs;
exports.cleanupOldDocs = cleanupOldDocs;
var fs = require("fs");
var path = require("path");
var types_1 = require("./types");
// =============================================================================
// DOC GENERATION
// =============================================================================
function generateSkillDocs(skills, outputDir, sourceSkillsDir) {
    var generated = [];
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    for (var _i = 0, skills_1 = skills; _i < skills_1.length; _i++) {
        var skill = skills_1[_i];
        var docs = generateSkillDocFiles(skill, outputDir, sourceSkillsDir);
        generated.push.apply(generated, docs);
    }
    // Generate category index
    var categoryIndex = generateCategoryIndex(skills, outputDir);
    generated.push(categoryIndex);
    return generated;
}
// =============================================================================
// SINGLE SKILL DOC GENERATION
// =============================================================================
function generateSkillDocFiles(skill, outputDir, sourceSkillsDir) {
    var generated = [];
    // Convert skill ID to doc folder name (hyphens to underscores)
    var docFolderName = skill.id.replace(/-/g, '_');
    var skillDocDir = path.join(outputDir, docFolderName);
    // Create skill doc directory
    if (!fs.existsSync(skillDocDir)) {
        fs.mkdirSync(skillDocDir, { recursive: true });
    }
    // Generate main skill doc - use skill name as filename (not index.md)
    // This matches the expected pattern: skills/skill_name/skill_name.md
    var mainDocPath = path.join(skillDocDir, "".concat(docFolderName, ".md"));
    var mainDocContent = buildMainSkillDoc(skill, docFolderName);
    fs.writeFileSync(mainDocPath, mainDocContent, 'utf-8');
    generated.push({ path: mainDocPath, skill: skill.id, type: 'main' });
    // Copy references if they exist
    var sourceRefsDir = path.join(sourceSkillsDir, skill.id, 'references');
    if (fs.existsSync(sourceRefsDir)) {
        var refsOutputDir = path.join(skillDocDir, 'references');
        if (!fs.existsSync(refsOutputDir)) {
            fs.mkdirSync(refsOutputDir, { recursive: true });
        }
        copyReferences(sourceRefsDir, refsOutputDir, skill.id, generated);
    }
    return generated;
}
function buildMainSkillDoc(skill, docFolderName) {
    var _a;
    var categoryIcon = ((_a = types_1.SKILL_CATEGORIES[skill.category]) === null || _a === void 0 ? void 0 : _a.icon) || '📦';
    var badgeStr = skill.badge ? " (".concat(skill.badge, ")") : '';
    // Build tools section
    var toolsSection = skill.allowedTools.length > 0
        ? "## Allowed Tools\n\n```\n".concat(skill.allowedTools.join(', '), "\n```\n\n")
        : '';
    // Build tags section
    var tagsSection = skill.tags.length > 0
        ? "## Tags\n\n".concat(skill.tags.map(function (t) { return "`".concat(t, "`"); }).join(' '), "\n\n")
        : '';
    // Build pairs with section
    var pairsWithSection = skill.pairsWith && skill.pairsWith.length > 0
        ? "## \uD83E\uDD1D Pairs Great With\n\n".concat(skill.pairsWith.map(function (p) { return "- **[".concat(toTitleCase(p.skill), "](/docs/skills/").concat(p.skill.replace(/-/g, '_'), ")**: ").concat(p.reason); }).join('\n'), "\n\n")
        : '';
    // Build references section
    var refsSection = skill.references.length > 0
        ? "## References\n\n".concat(skill.references.map(function (r) { return "- [".concat(r.title, "](./references/").concat(r.name, ")"); }).join('\n'), "\n\n")
        : '';
    return "---\nsidebar_label: ".concat(skill.title, "\nsidebar_position: 1\n---\n\n# ").concat(categoryIcon, " ").concat(skill.title).concat(badgeStr, "\n\n").concat(skill.description, "\n\n---\n\n").concat(toolsSection).concat(tagsSection).concat(pairsWithSection).concat(refsSection).concat(skill.content, "\n");
}
// =============================================================================
// REFERENCE COPYING
// =============================================================================
function copyReferences(sourceDir, outputDir, skillId, generated) {
    var files = fs.readdirSync(sourceDir);
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        var sourcePath = path.join(sourceDir, file);
        var destPath = path.join(outputDir, file);
        var stat = fs.statSync(sourcePath);
        if (stat.isDirectory()) {
            // Recursively copy subdirectories
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
            }
            copyReferences(sourcePath, destPath, skillId, generated);
        }
        else if (file.endsWith('.md')) {
            // Process markdown files
            var content = fs.readFileSync(sourcePath, 'utf-8');
            // Add frontmatter if missing
            if (!content.startsWith('---')) {
                var title = extractTitleOrDefault(content, file);
                content = "---\ntitle: ".concat(title, "\nsidebar_label: ").concat(title.substring(0, 30)).concat(title.length > 30 ? '...' : '', "\nsidebar_position: 2\n---\n").concat(content);
            }
            // Sanitize MDX-incompatible content
            content = sanitizeForMdx(content);
            fs.writeFileSync(destPath, content, 'utf-8');
            generated.push({ path: destPath, skill: skillId, type: 'reference' });
        }
        else {
            // Copy other files as-is
            fs.copyFileSync(sourcePath, destPath);
        }
    }
}
function extractTitleOrDefault(content, filename) {
    // Try to find H1
    var h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) {
        return h1Match[1].trim();
    }
    // Fall back to filename
    return toTitleCase(path.basename(filename, '.md'));
}
function sanitizeForMdx(content) {
    // Replace problematic HTML-like tags in markdown context
    // This handles cases like `<link>` that MDX interprets as JSX
    // Replace standalone <link> tags (not in code blocks)
    content = content.replace(/(?<!`)<link>(?!`)/gi, '[URL]');
    content = content.replace(/(?<!`)<\/link>(?!`)/gi, '');
    // Replace other problematic self-closing tags
    content = content.replace(/(?<!`)<br>(?!`)/gi, '<br />');
    content = content.replace(/(?<!`)<hr>(?!`)/gi, '<hr />');
    return content;
}
// =============================================================================
// CATEGORY INDEX
// =============================================================================
function generateCategoryIndex(skills, outputDir) {
    var indexPath = path.join(outputDir, '_category_.json');
    var categoryJson = {
        label: 'Skills',
        position: 3,
        link: {
            type: 'generated-index',
            description: 'Browse all available Claude Code skills.',
        },
    };
    fs.writeFileSync(indexPath, JSON.stringify(categoryJson, null, 2), 'utf-8');
    return { path: indexPath, skill: '_index_', type: 'index' };
}
// =============================================================================
// CLEANUP
// =============================================================================
function cleanupOldDocs(outputDir, currentSkills) {
    var removed = [];
    if (!fs.existsSync(outputDir)) {
        return removed;
    }
    var currentIds = new Set(currentSkills.map(function (s) { return s.id.replace(/-/g, '_'); }));
    var entries = fs.readdirSync(outputDir, { withFileTypes: true });
    for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
        var entry = entries_1[_i];
        if (!entry.isDirectory())
            continue;
        if (entry.name.startsWith('_'))
            continue; // Skip special directories
        if (!currentIds.has(entry.name)) {
            var dirPath = path.join(outputDir, entry.name);
            fs.rmSync(dirPath, { recursive: true });
            removed.push(entry.name);
        }
    }
    return removed;
}
// =============================================================================
// UTILITIES
// =============================================================================
function toTitleCase(str) {
    return str
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(function (word) { return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); })
        .join(' ');
}
