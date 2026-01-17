#!/usr/bin/env npx tsx
"use strict";
/**
 * Sync Skill Documentation
 *
 * Reads each skill's SKILL.md and updates the corresponding website doc.
 * Extracts: name, description, tools, triggers from frontmatter
 * Updates: SkillHeader component props in the doc file
 *
 * Run: npx tsx scripts/syncSkillDocs.ts
 * Or: npm run sync:skills
 */
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var SKILLS_DIR = path.resolve(__dirname, '../../.claude/skills');
var DOCS_DIR = path.resolve(__dirname, '../docs/skills');
function parseYamlFrontmatter(content) {
    var match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match)
        return null;
    var yaml = match[1];
    var result = { name: '', description: '' };
    // Parse name
    var nameMatch = yaml.match(/^name:\s*(.+)$/m);
    if (nameMatch)
        result.name = nameMatch[1].trim();
    // Parse description (may be multi-line)
    var descMatch = yaml.match(/^description:\s*(.+)$/m);
    if (descMatch)
        result.description = descMatch[1].trim();
    // Parse tools array
    var toolsSection = yaml.match(/^tools:\n((?:\s+-\s+.+\n?)+)/m);
    if (toolsSection) {
        result.tools = toolsSection[1]
            .split('\n')
            .map(function (line) { return line.replace(/^\s+-\s+/, '').split('#')[0].trim(); })
            .filter(Boolean);
    }
    // Parse triggers array
    var triggersSection = yaml.match(/^triggers:\n((?:\s+-\s+.+\n?)+)/m);
    if (triggersSection) {
        result.triggers = triggersSection[1]
            .split('\n')
            .map(function (line) { return line.replace(/^\s+-\s+/, '').replace(/['"]/g, '').trim(); })
            .filter(Boolean);
    }
    return result;
}
function getDocFilename(skillId) {
    return skillId.replace(/-/g, '_') + '.md';
}
function createDocFile(skillId, skillMdPath) {
    var docFilename = getDocFilename(skillId);
    var docPath = path.join(DOCS_DIR, docFilename);
    // Read the SKILL.md content
    var content = fs.readFileSync(skillMdPath, 'utf-8');
    // Transform YAML array tools to comma-separated format for Docusaurus frontmatter
    // Convert:
    //   allowed-tools:
    //     - Read
    //     - Write
    // To:
    //   allowed-tools: Read,Write,Edit
    var transformedContent = content.replace(/^(allowed-tools:)\n((?:\s+-\s+.+\n?)+)/m, function (match, prefix, toolsBlock) {
        var tools = toolsBlock
            .split('\n')
            .map(function (line) { return line.replace(/^\s+-\s+/, '').trim(); })
            .filter(Boolean)
            .join(',');
        return "".concat(prefix, " ").concat(tools, "\n");
    });
    // Ensure the docs/skills directory exists
    if (!fs.existsSync(DOCS_DIR)) {
        fs.mkdirSync(DOCS_DIR, { recursive: true });
    }
    fs.writeFileSync(docPath, transformedContent);
    return { created: true };
}
function updateDocFile(skillId, frontmatter, skillMdPath) {
    var docFilename = getDocFilename(skillId);
    var docPath = path.join(DOCS_DIR, docFilename);
    // If doc file doesn't exist, create it from SKILL.md
    if (!fs.existsSync(docPath)) {
        return createDocFile(skillId, skillMdPath);
    }
    var content = fs.readFileSync(docPath, 'utf-8');
    var modified = false;
    // Escape quotes in description for JSX
    var escapedDesc = frontmatter.description.replace(/"/g, '\\"');
    // Update description in SkillHeader - use JSX expression syntax with curly braces
    // Match description={" or description=" followed by content until closing
    var descRegex = /(<SkillHeader[\s\S]*?description=\{?")([^]*?)("\}?\s*\n)/;
    var descMatch = content.match(descRegex);
    if (descMatch) {
        var currentDesc = descMatch[2];
        if (currentDesc !== escapedDesc) {
            // Use curly braces syntax: description={"..."} for proper JSX escaping
            content = content.replace(descRegex, "$1".concat(escapedDesc, "\"}\n"));
            // Ensure we have the opening brace
            content = content.replace(/description="([^]*?)"}/g, 'description={"$1"}');
            modified = true;
        }
    }
    // Update skillName in SkillHeader if different from name
    var nameRegex = /(<SkillHeader[\s\S]*?skillName=")([^"]*?)(")/;
    var nameMatch = content.match(nameRegex);
    var displayName = frontmatter.name
        .split('-')
        .map(function (word) { return word.charAt(0).toUpperCase() + word.slice(1); })
        .join(' ');
    if (nameMatch && nameMatch[2] !== displayName) {
        content = content.replace(nameRegex, "$1".concat(displayName, "$3"));
        modified = true;
    }
    if (modified) {
        fs.writeFileSync(docPath, content);
        return { updated: true };
    }
    return { updated: false, reason: 'No changes needed' };
}
function main() {
    console.log('🔄 Syncing skill documentation...\n');
    var skillDirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
        .filter(function (dirent) { return dirent.isDirectory(); })
        .map(function (dirent) { return dirent.name; });
    var syncedCount = 0;
    var skippedCount = 0;
    var issues = [];
    for (var _i = 0, skillDirs_1 = skillDirs; _i < skillDirs_1.length; _i++) {
        var skillId = skillDirs_1[_i];
        var skillMdPath = path.join(SKILLS_DIR, skillId, 'SKILL.md');
        if (!fs.existsSync(skillMdPath)) {
            issues.push("".concat(skillId, ": Missing SKILL.md"));
            continue;
        }
        var content = fs.readFileSync(skillMdPath, 'utf-8');
        var frontmatter = parseYamlFrontmatter(content);
        if (!frontmatter || !frontmatter.name) {
            issues.push("".concat(skillId, ": Invalid or missing frontmatter"));
            continue;
        }
        var result = updateDocFile(skillId, frontmatter, skillMdPath);
        if (result.created) {
            console.log("\uD83C\uDD95 ".concat(skillId, ": Created doc file"));
            syncedCount++;
        }
        else if (result.updated) {
            console.log("\u2705 ".concat(skillId, ": Synced"));
            syncedCount++;
        }
        else {
            skippedCount++;
        }
    }
    console.log("\n\uD83D\uDCCA Summary:");
    console.log("   Synced: ".concat(syncedCount));
    console.log("   Unchanged: ".concat(skippedCount));
    if (issues.length > 0) {
        console.log("\n\u26A0\uFE0F  Issues (".concat(issues.length, "):"));
        issues.forEach(function (issue) { return console.log("   - ".concat(issue)); });
    }
    console.log('\n✨ Sync complete!');
}
main();
