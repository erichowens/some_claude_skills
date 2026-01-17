#!/usr/bin/env npx tsx
"use strict";
/**
 * Sync Skill Subpages
 *
 * For skills with references/, templates/, examples/, or guides/ folders,
 * converts the flat doc file to a category folder with:
 * - index.md (main skill page)
 * - references/*.md (subpages for each reference)
 *
 * Run: npx tsx scripts/syncSkillSubpages.ts
 * Or: npm run sync:subpages
 */
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var SKILLS_DIR = path.resolve(__dirname, '../../.claude/skills');
var DOCS_DIR = path.resolve(__dirname, '../docs/skills');
// Subfolders to sync as documentation subpages
var SUBFOLDERS = ['references', 'templates', 'examples', 'guides'];
function getDocFilename(skillId) {
    return skillId.replace(/-/g, '_');
}
function titleCase(str) {
    return str
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
}
function escapeAngleBrackets(content) {
    // Escape angle brackets and curly braces that could be interpreted as JSX
    // MDX interprets {variable} as JSX expressions even in code blocks without language specifiers
    var lines = content.split('\n');
    var result = [];
    var inCodeBlock = false;
    var inFrontmatter = false;
    var frontmatterCount = 0;
    // Only track frontmatter if file actually starts with ---
    // Otherwise, all --- are horizontal rules and should be ignored
    var hasFrontmatter = lines[0] === '---';
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        if (line.startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            result.push(line);
            continue;
        }
        // Only track frontmatter delimiters if file has frontmatter
        if (hasFrontmatter && line === '---' && !inCodeBlock && frontmatterCount < 2) {
            frontmatterCount++;
            if (frontmatterCount === 1) {
                inFrontmatter = true;
            }
            else if (frontmatterCount === 2) {
                inFrontmatter = false;
            }
            result.push(line);
            continue;
        }
        // Skip frontmatter entirely
        if (inFrontmatter) {
            result.push(line);
            continue;
        }
        var escapedLine = line;
        // Only escape angle brackets outside code blocks
        if (!inCodeBlock) {
            // Escape < that isn't part of a valid HTML/JSX tag or code fence
            // Match < followed by anything that isn't a letter or / (valid tag start)
            escapedLine = escapedLine.replace(/<(?![a-zA-Z\/!])/g, '\\<');
            // Escape > followed by digits (e.g., >30, >100ms) which MDX interprets as JSX
            escapedLine = escapedLine.replace(/>(\d)/g, '\\>$1');
        }
        // Escape curly braces that look like placeholders EVERYWHERE (including code blocks)
        // MDX interprets {variable} as JSX expressions even in code blocks without language specifiers
        // Use negative lookbehind to skip already-escaped braces: (?<!\\)
        // Patterns: {Customer Name}, {first_name}, {Name}, etc.
        escapedLine = escapedLine.replace(/(?<!\\)\{([A-Z][^}]*)\}/g, '\\{$1\\}'); // {Customer Name}, {Name}
        escapedLine = escapedLine.replace(/(?<!\\)\{([a-z_][a-z0-9_]*)\}/gi, '\\{$1\\}'); // {first_name}, {name}
        result.push(escapedLine);
    }
    return result.join('\n');
}
function escapeYamlValue(value) {
    // Quote values that contain special YAML characters
    if (value.includes(':') || value.includes('#') || value.includes("'") || value.includes('"') ||
        value.startsWith(' ') || value.endsWith(' ') || value.includes('\n')) {
        // Escape double quotes and wrap in double quotes
        return "\"".concat(value.replace(/"/g, '\\"'), "\"");
    }
    return value;
}
function generateFrontmatter(title, sidebarLabel, sidebarPosition) {
    var lines = [
        '---',
        "title: ".concat(escapeYamlValue(title)),
        "sidebar_label: ".concat(escapeYamlValue(sidebarLabel)),
    ];
    if (sidebarPosition !== undefined) {
        lines.push("sidebar_position: ".concat(sidebarPosition));
    }
    lines.push('---', '');
    return lines.join('\n');
}
function generateCategoryJson(label, position, collapsed) {
    if (collapsed === void 0) { collapsed = true; }
    return JSON.stringify({
        label: label,
        position: position,
        collapsed: collapsed,
        collapsible: true,
    }, null, 2);
}
function findSubfolders(skillId) {
    var skillDir = path.join(SKILLS_DIR, skillId);
    var results = [];
    for (var _i = 0, SUBFOLDERS_1 = SUBFOLDERS; _i < SUBFOLDERS_1.length; _i++) {
        var subfolder = SUBFOLDERS_1[_i];
        var subfolderPath = path.join(skillDir, subfolder);
        if (fs.existsSync(subfolderPath) && fs.statSync(subfolderPath).isDirectory()) {
            var files = fs.readdirSync(subfolderPath)
                .filter(function (f) { return f.endsWith('.md'); })
                .sort();
            if (files.length > 0) {
                results.push({ skillId: skillId, subfolder: subfolder, files: files });
            }
        }
    }
    return results;
}
function convertToFolderStructure(skillId, subpages) {
    var docBase = getDocFilename(skillId);
    var flatDocPath = path.join(DOCS_DIR, "".concat(docBase, ".md"));
    var folderDocPath = path.join(DOCS_DIR, docBase);
    // Check if already converted
    if (fs.existsSync(folderDocPath) && fs.statSync(folderDocPath).isDirectory()) {
        // Already a folder - just sync subpages
        return syncSubpagesToFolder(skillId, folderDocPath, subpages);
    }
    // Check if flat doc exists
    if (!fs.existsSync(flatDocPath)) {
        return { converted: false, message: 'No doc file exists' };
    }
    // Read the flat doc
    var flatContent = fs.readFileSync(flatDocPath, 'utf-8');
    // Create the folder
    fs.mkdirSync(folderDocPath, { recursive: true });
    // Move flat doc to index.md with slug to preserve doc ID
    var indexPath = path.join(folderDocPath, 'index.md');
    // Add slug to preserve the original doc ID if not already present
    var finalContent = flatContent;
    if (flatContent.startsWith('---')) {
        // Has frontmatter - add slug if not present
        var endOfFrontmatter = flatContent.indexOf('---', 3);
        if (endOfFrontmatter !== -1 && !flatContent.includes('slug:')) {
            var frontmatter = flatContent.substring(0, endOfFrontmatter);
            var rest = flatContent.substring(endOfFrontmatter);
            finalContent = "".concat(frontmatter, "slug: /skills/").concat(docBase, "\n").concat(rest);
        }
    }
    else {
        // No frontmatter - add one with slug
        finalContent = "---\nslug: /skills/".concat(docBase, "\n---\n").concat(flatContent);
    }
    fs.writeFileSync(indexPath, finalContent);
    // Delete the flat file
    fs.unlinkSync(flatDocPath);
    // Sync subpages
    var syncResult = syncSubpagesToFolder(skillId, folderDocPath, subpages);
    return {
        converted: true,
        message: "Converted to folder, ".concat(syncResult.message)
    };
}
function syncSubpagesToFolder(skillId, folderPath, subpages) {
    var totalSynced = 0;
    for (var _i = 0, subpages_1 = subpages; _i < subpages_1.length; _i++) {
        var subpage = subpages_1[_i];
        var subfolderPath = path.join(folderPath, subpage.subfolder);
        // Create subfolder if needed
        if (!fs.existsSync(subfolderPath)) {
            fs.mkdirSync(subfolderPath, { recursive: true });
        }
        // Create _category_.json for the subfolder
        var categoryJsonPath = path.join(subfolderPath, '_category_.json');
        var categoryLabel = titleCase(subpage.subfolder);
        fs.writeFileSync(categoryJsonPath, generateCategoryJson(categoryLabel, 2));
        // Sync each markdown file
        for (var i = 0; i < subpage.files.length; i++) {
            var fileName = subpage.files[i];
            var sourcePath = path.join(SKILLS_DIR, skillId, subpage.subfolder, fileName);
            var destPath = path.join(subfolderPath, fileName);
            var sourceContent = fs.readFileSync(sourcePath, 'utf-8');
            // Check if file already has frontmatter
            var hasFrontmatter = sourceContent.startsWith('---');
            var finalContent = void 0;
            if (hasFrontmatter) {
                // Use existing content as-is, but escape angle brackets
                finalContent = escapeAngleBrackets(sourceContent);
            }
            else {
                // Extract title from first heading or filename
                var headingMatch = sourceContent.match(/^#\s+(.+)$/m);
                var title = headingMatch ? headingMatch[1] : titleCase(fileName.replace('.md', ''));
                var sidebarLabel = title.length > 30 ? title.substring(0, 27) + '...' : title;
                finalContent = generateFrontmatter(title, sidebarLabel, i + 1) + escapeAngleBrackets(sourceContent);
            }
            // Write or update
            var existingContent = fs.existsSync(destPath) ? fs.readFileSync(destPath, 'utf-8') : '';
            if (existingContent !== finalContent) {
                fs.writeFileSync(destPath, finalContent);
                totalSynced++;
            }
        }
    }
    return {
        converted: false,
        message: "synced ".concat(totalSynced, " subpages")
    };
}
function main() {
    console.log('🔄 Syncing skill subpages...\n');
    var skillDirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
        .filter(function (dirent) { return dirent.isDirectory(); })
        .map(function (dirent) { return dirent.name; });
    var convertedCount = 0;
    var syncedCount = 0;
    var skippedCount = 0;
    var details = [];
    for (var _i = 0, skillDirs_1 = skillDirs; _i < skillDirs_1.length; _i++) {
        var skillId = skillDirs_1[_i];
        var subpages = findSubfolders(skillId);
        if (subpages.length === 0) {
            skippedCount++;
            continue;
        }
        var totalFiles = subpages.reduce(function (sum, sp) { return sum + sp.files.length; }, 0);
        var result = convertToFolderStructure(skillId, subpages);
        if (result.converted) {
            console.log("\uD83D\uDCC1 ".concat(skillId, ": Converted to folder (").concat(totalFiles, " subpages)"));
            convertedCount++;
            details.push("".concat(skillId, ": ").concat(result.message));
        }
        else if (result.message.includes('synced')) {
            var match = result.message.match(/synced (\d+)/);
            var count = match ? parseInt(match[1]) : 0;
            if (count > 0) {
                console.log("\u2705 ".concat(skillId, ": ").concat(result.message));
                syncedCount++;
            }
        }
    }
    console.log("\n\uD83D\uDCCA Summary:");
    console.log("   Converted to folders: ".concat(convertedCount));
    console.log("   Updated subpages: ".concat(syncedCount));
    console.log("   Skills without subpages: ".concat(skippedCount));
    if (details.length > 0) {
        console.log("\n\uD83D\uDCDD Details:");
        details.forEach(function (d) { return console.log("   - ".concat(d)); });
    }
    console.log('\n✨ Subpage sync complete!');
}
main();
