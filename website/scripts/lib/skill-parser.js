"use strict";
/**
 * SKILL.md Parser
 *
 * Parses SKILL.md files with YAML frontmatter and extracts all skill metadata.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFrontmatter = parseFrontmatter;
exports.parseSkillFile = parseSkillFile;
exports.findReferences = findReferences;
exports.findScripts = findScripts;
exports.validateSkill = validateSkill;
exports.parseAllSkills = parseAllSkills;
var fs = require("fs");
var path = require("path");
var yaml = require("yaml");
var types_1 = require("./types");
function parseFrontmatter(fileContent) {
    var frontmatterRegex = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
    var match = fileContent.match(frontmatterRegex);
    if (!match) {
        return null;
    }
    try {
        var frontmatter = yaml.parse(match[1]);
        return {
            frontmatter: frontmatter,
            content: match[2].trim(),
            raw: match[1],
        };
    }
    catch (error) {
        console.error('Failed to parse YAML frontmatter:', error);
        return null;
    }
}
// =============================================================================
// SKILL PARSING
// =============================================================================
function parseSkillFile(skillPath, source) {
    var skillMdPath = path.join(skillPath, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) {
        console.error("SKILL.md not found: ".concat(skillMdPath));
        return null;
    }
    var fileContent = fs.readFileSync(skillMdPath, 'utf-8');
    var parsed = parseFrontmatter(fileContent);
    if (!parsed) {
        console.error("Failed to parse frontmatter: ".concat(skillMdPath));
        return null;
    }
    var frontmatter = parsed.frontmatter, content = parsed.content;
    // Derive ID from folder name
    var folderName = path.basename(skillPath);
    var id = folderName;
    // Parse allowed tools (handle both comma-separated string and YAML list)
    var allowedTools = [];
    if (frontmatter['allowed-tools']) {
        if (Array.isArray(frontmatter['allowed-tools'])) {
            // YAML list format: ["Read", "Write", "Edit"]
            allowedTools = frontmatter['allowed-tools'].map(function (t) { return t.trim(); });
        }
        else {
            // Comma-separated string format: "Read,Write,Edit"
            allowedTools = frontmatter['allowed-tools'].split(',').map(function (t) { return t.trim(); });
        }
    }
    // Generate title from name if not provided
    var title = frontmatter.title || toTitleCase(frontmatter.name || id);
    // Truncate description for cards
    var shortDescription = truncateDescription(frontmatter.description, 200);
    // Determine category
    var category = normalizeCategory(frontmatter.category);
    // Parse tags
    var tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
    // Parse skill pairings
    var pairsWith = Array.isArray(frontmatter['pairs-with'])
        ? frontmatter['pairs-with']
        : [];
    // Find references and scripts
    var references = findReferences(skillPath);
    var scripts = findScripts(skillPath);
    // Generate paths
    var docPath = "docs/skills/".concat(id.replace(/-/g, '_'));
    var urlPath = "/docs/skills/".concat(id.replace(/-/g, '_'));
    return {
        id: id,
        name: frontmatter.name || id,
        title: title,
        description: frontmatter.description || '',
        shortDescription: shortDescription,
        content: content,
        category: category,
        tags: tags,
        badge: frontmatter.badge,
        pairsWith: pairsWith,
        allowedTools: allowedTools,
        sourcePath: skillMdPath,
        docPath: docPath,
        urlPath: urlPath,
        source: source,
        lastUpdated: frontmatter.lastUpdated,
        references: references,
        scripts: scripts,
    };
}
// =============================================================================
// DIRECTORY SCANNING
// =============================================================================
function findReferences(skillPath) {
    var referencesPath = path.join(skillPath, 'references');
    if (!fs.existsSync(referencesPath)) {
        return [];
    }
    var references = [];
    var files = fs.readdirSync(referencesPath);
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        if (file.endsWith('.md')) {
            var filePath = path.join(referencesPath, file);
            var name_1 = path.basename(file, '.md');
            // Try to extract title from file
            var title = extractTitleFromMd(filePath) || toTitleCase(name_1);
            references.push({
                name: name_1,
                path: filePath,
                title: title,
            });
        }
    }
    return references;
}
function findScripts(skillPath) {
    var scriptsPath = path.join(skillPath, 'scripts');
    if (!fs.existsSync(scriptsPath)) {
        return [];
    }
    var scripts = [];
    var files = fs.readdirSync(scriptsPath);
    for (var _i = 0, files_2 = files; _i < files_2.length; _i++) {
        var file = files_2[_i];
        if (file.endsWith('.sh') || file.endsWith('.ts') || file.endsWith('.js')) {
            var filePath = path.join(scriptsPath, file);
            var name_2 = path.basename(file);
            scripts.push({
                name: name_2,
                path: filePath,
                description: extractScriptDescription(filePath),
            });
        }
    }
    return scripts;
}
function extractTitleFromMd(filePath) {
    try {
        var content = fs.readFileSync(filePath, 'utf-8');
        // Check for title in frontmatter
        var parsed = parseFrontmatter(content);
        if ((parsed === null || parsed === void 0 ? void 0 : parsed.frontmatter) && 'title' in parsed.frontmatter) {
            return parsed.frontmatter.title || null;
        }
        // Check for first H1
        var h1Match = content.match(/^#\s+(.+)$/m);
        if (h1Match) {
            return h1Match[1].trim();
        }
        return null;
    }
    catch (_a) {
        return null;
    }
}
function extractScriptDescription(filePath) {
    try {
        var content = fs.readFileSync(filePath, 'utf-8');
        var lines = content.split('\n').slice(0, 10);
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            // Look for description comment
            var match = line.match(/^#\s*(?:Description:|@desc)\s*(.+)$/i);
            if (match) {
                return match[1].trim();
            }
        }
        return undefined;
    }
    catch (_a) {
        return undefined;
    }
}
// =============================================================================
// VALIDATION
// =============================================================================
function validateSkill(skill) {
    var errors = [];
    var warnings = [];
    // Required fields
    if (!skill.name) {
        errors.push({ field: 'name', message: 'Name is required' });
    }
    else if (!/^[a-z0-9-]+$/.test(skill.name)) {
        errors.push({
            field: 'name',
            message: 'Name must be kebab-case (lowercase letters, numbers, hyphens)',
            value: skill.name,
        });
    }
    if (!skill.description) {
        errors.push({ field: 'description', message: 'Description is required' });
    }
    else if (skill.description.length > 1000) {
        warnings.push({
            field: 'description',
            message: "Description is very long (".concat(skill.description.length, " chars)"),
            suggestion: 'Consider shortening to under 500 characters',
        });
    }
    if (skill.allowedTools.length === 0) {
        warnings.push({
            field: 'allowed-tools',
            message: 'No allowed tools specified',
            suggestion: 'Add allowed-tools to frontmatter',
        });
    }
    // Category validation
    if (!skill.category || skill.category === 'Uncategorized') {
        warnings.push({
            field: 'category',
            message: 'No category specified',
            suggestion: "Valid categories: ".concat(Object.keys(types_1.SKILL_CATEGORIES).join(', ')),
        });
    }
    else if (!types_1.SKILL_CATEGORIES[skill.category]) {
        warnings.push({
            field: 'category',
            message: "Unknown category: ".concat(skill.category),
            suggestion: "Valid categories: ".concat(Object.keys(types_1.SKILL_CATEGORIES).join(', ')),
        });
    }
    // Tags validation
    if (skill.tags.length === 0) {
        warnings.push({
            field: 'tags',
            message: 'No tags specified',
            suggestion: 'Add tags for better discoverability',
        });
    }
    // Badge validation
    var validBadges = ['NEW', 'HOT', 'ADVANCED', 'EXPERIMENTAL'];
    if (skill.badge && !validBadges.includes(skill.badge)) {
        errors.push({
            field: 'badge',
            message: "Invalid badge: ".concat(skill.badge),
            value: skill.badge,
        });
    }
    // Content validation
    if (!skill.content || skill.content.length < 100) {
        warnings.push({
            field: 'content',
            message: 'Skill content is minimal',
            suggestion: 'Add more documentation, examples, and guidance',
        });
    }
    return {
        valid: errors.length === 0,
        errors: errors,
        warnings: warnings,
    };
}
// =============================================================================
// BATCH PARSING
// =============================================================================
function parseAllSkills(skillsDir) {
    if (!fs.existsSync(skillsDir)) {
        console.error("Skills directory not found: ".concat(skillsDir));
        return [];
    }
    var skills = [];
    var entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
        var entry = entries_1[_i];
        if (!entry.isDirectory())
            continue;
        var skillPath = path.join(skillsDir, entry.name);
        var skillMdPath = path.join(skillPath, 'SKILL.md');
        if (!fs.existsSync(skillMdPath)) {
            console.warn("Skipping ".concat(entry.name, ": no SKILL.md found"));
            continue;
        }
        var source = { type: 'local', path: skillPath };
        var skill = parseSkillFile(skillPath, source);
        if (skill) {
            skills.push(skill);
        }
    }
    return skills;
}
// =============================================================================
// UTILITIES
// =============================================================================
function toTitleCase(str) {
    return str
        .split('-')
        .map(function (word) { return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); })
        .join(' ');
}
function truncateDescription(description, maxLength) {
    if (!description)
        return '';
    if (description.length <= maxLength)
        return description;
    // Find last space before maxLength
    var truncated = description.slice(0, maxLength);
    var lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
        return truncated.slice(0, lastSpace) + '...';
    }
    return truncated + '...';
}
function normalizeCategory(category) {
    if (!category)
        return 'Uncategorized';
    // Try exact match first
    if (types_1.SKILL_CATEGORIES[category]) {
        return category;
    }
    // Try case-insensitive match
    var lowerCategory = category.toLowerCase();
    for (var _i = 0, _a = Object.keys(types_1.SKILL_CATEGORIES); _i < _a.length; _i++) {
        var validCategory = _a[_i];
        if (validCategory.toLowerCase() === lowerCategory) {
            return validCategory;
        }
    }
    // Try partial match
    for (var _b = 0, _c = Object.keys(types_1.SKILL_CATEGORIES); _b < _c.length; _b++) {
        var validCategory = _c[_b];
        if (validCategory.toLowerCase().includes(lowerCategory) ||
            lowerCategory.includes(validCategory.toLowerCase())) {
            return validCategory;
        }
    }
    return category; // Return as-is, will trigger warning
}
