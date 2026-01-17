"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TOCWrapper;
var react_1 = require("react");
var TOC_1 = require("@theme-original/TOC");
var router_1 = require("@docusaurus/router");
// Storage key prefix for visited references
var VISITED_KEY_PREFIX = 'skill-refs-visited-';
/**
 * Get visited references for a skill from localStorage
 */
function getVisitedRefs(skillName) {
    if (typeof window === 'undefined')
        return new Set();
    try {
        var stored = localStorage.getItem(VISITED_KEY_PREFIX + skillName);
        if (stored) {
            return new Set(JSON.parse(stored));
        }
    }
    catch (e) {
        console.error('Failed to load visited refs:', e);
    }
    return new Set();
}
/**
 * Mark a reference as visited in localStorage
 */
function markRefVisited(skillName, refPath) {
    if (typeof window === 'undefined')
        return;
    try {
        var visited = getVisitedRefs(skillName);
        visited.add(refPath);
        localStorage.setItem(VISITED_KEY_PREFIX + skillName, JSON.stringify(__spreadArray([], visited, true)));
    }
    catch (e) {
        console.error('Failed to save visited ref:', e);
    }
}
/**
 * Extract first meaningful sentence from markdown content
 */
function extractDescription(content) {
    if (!content)
        return '';
    // Remove frontmatter
    var withoutFrontmatter = content.replace(/^---[\s\S]*?---\n*/m, '');
    // Remove the first heading (title)
    var withoutTitle = withoutFrontmatter.replace(/^#[^\n]+\n*/m, '');
    // Find first paragraph that isn't a heading or code block
    var lines = withoutTitle.split('\n');
    var description = '';
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        var trimmed = line.trim();
        // Skip empty lines, headings, code blocks, tables, lists
        if (!trimmed ||
            trimmed.startsWith('#') ||
            trimmed.startsWith('```') ||
            trimmed.startsWith('|') ||
            trimmed.startsWith('-') ||
            trimmed.startsWith('*') ||
            trimmed.startsWith('>')) {
            continue;
        }
        // Found a paragraph line
        description = trimmed;
        break;
    }
    // Truncate to first sentence or 100 chars
    if (description.length > 100) {
        var sentenceEnd = description.indexOf('. ');
        if (sentenceEnd > 0 && sentenceEnd < 100) {
            return description.substring(0, sentenceEnd + 1);
        }
        return description.substring(0, 97) + '...';
    }
    return description;
}
/**
 * Extract title from markdown content (first H1)
 */
function extractTitle(content, filename) {
    if (!content)
        return formatFilename(filename);
    // Remove frontmatter
    var withoutFrontmatter = content.replace(/^---[\s\S]*?---\n*/m, '');
    // Find first heading
    var match = withoutFrontmatter.match(/^#\s+(.+)$/m);
    if (match) {
        return match[1].trim();
    }
    return formatFilename(filename);
}
/**
 * Convert filename to readable title
 */
function formatFilename(filename) {
    return filename
        .replace(/\.md$/, '')
        .split('-')
        .map(function (word) { return word.charAt(0).toUpperCase() + word.slice(1); })
        .join(' ');
}
/**
 * Count lines in content
 */
function countLines(content) {
    if (!content)
        return 0;
    return content.split('\n').length;
}
/**
 * Process file nodes to extract reference info
 */
function extractReferences(children, parentCategory) {
    if (parentCategory === void 0) { parentCategory = ''; }
    var references = [];
    for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
        var node = children_1[_i];
        if (node.type === 'folder') {
            // Process subfolders (references, guides, etc.)
            if (node.children) {
                var folderRefs = extractReferences(node.children, node.name);
                references.push.apply(references, folderRefs);
            }
        }
        else if (node.type === 'file' && node.name.endsWith('.md')) {
            // Skip SKILL.md, CHANGELOG.md, index.md, _category_.json
            if (node.name === 'SKILL.md' ||
                node.name === 'CHANGELOG.md' ||
                node.name === 'index.md' ||
                node.name.startsWith('_')) {
                continue;
            }
            // Determine category - root level files get special categories
            var category = parentCategory;
            if (!parentCategory) {
                // Root level files - categorize by name
                var lowerName = node.name.toLowerCase();
                if (lowerName === 'overview.md' || lowerName === 'readme.md') {
                    category = 'overview';
                }
                else {
                    category = 'other';
                }
            }
            references.push({
                name: node.name,
                path: node.path,
                title: extractTitle(node.content || '', node.name),
                description: extractDescription(node.content || ''),
                lineCount: countLines(node.content || ''),
                size: node.size || 0,
                category: category,
            });
        }
    }
    return references;
}
/**
 * Format line count with color indicator
 */
function getLineBadgeClass(lineCount) {
    if (lineCount > 400)
        return 'skill-ref-badge-large';
    if (lineCount > 150)
        return 'skill-ref-badge-medium';
    return 'skill-ref-badge-small';
}
/**
 * SkillReferences component - Shows above TOC for skill pages and subpages
 */
function SkillReferences(_a) {
    var skillName = _a.skillName, currentPath = _a.currentPath;
    var _b = (0, react_1.useState)([]), references = _b[0], setReferences = _b[1];
    var _c = (0, react_1.useState)(new Set()), visitedRefs = _c[0], setVisitedRefs = _c[1];
    var _d = (0, react_1.useState)(true), loading = _d[0], setLoading = _d[1];
    var _e = (0, react_1.useState)(null), error = _e[0], setError = _e[1];
    // Convert underscore to dash for URL paths and JSON filename
    var urlSkillName = skillName.replace(/_/g, '-');
    (0, react_1.useEffect)(function () {
        function loadSkillData() {
            return __awaiter(this, void 0, void 0, function () {
                var jsonSkillName, module_1, data, refs, err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            jsonSkillName = skillName.replace(/_/g, '-');
                            return [4 /*yield*/, Promise.resolve("".concat("../../data/skillFolders/".concat(jsonSkillName, ".json"))).then(function (s) { return require(s); })];
                        case 1:
                            module_1 = _a.sent();
                            data = module_1.default;
                            if (data && data.children) {
                                refs = extractReferences(data.children);
                                setReferences(refs);
                            }
                            // Load visited refs from localStorage
                            setVisitedRefs(getVisitedRefs(skillName));
                            setLoading(false);
                            return [3 /*break*/, 3];
                        case 2:
                            err_1 = _a.sent();
                            console.error('Failed to load skill references:', err_1);
                            setError('Could not load references');
                            setLoading(false);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        }
        loadSkillData();
    }, [skillName]);
    // Mark current page as visited when it changes
    (0, react_1.useEffect)(function () {
        if (currentPath && skillName) {
            markRefVisited(skillName, currentPath);
            setVisitedRefs(function (prev) { return new Set(__spreadArray(__spreadArray([], prev, true), [currentPath], false)); });
        }
    }, [currentPath, skillName]);
    if (loading || error || references.length === 0) {
        return null;
    }
    // Group references by category
    var grouped = references.reduce(function (acc, ref) {
        var cat = ref.category || 'other';
        if (!acc[cat])
            acc[cat] = [];
        acc[cat].push(ref);
        return acc;
    }, {});
    // Sort categories: overview first, then alphabetically, 'other' last
    var categoryOrder = function (cat) {
        if (cat === 'overview')
            return 0;
        if (cat === 'other')
            return 999;
        return 1;
    };
    var sortedCategories = Object.keys(grouped).sort(function (a, b) {
        var orderDiff = categoryOrder(a) - categoryOrder(b);
        if (orderDiff !== 0)
            return orderDiff;
        return a.localeCompare(b);
    });
    // Check if we're on the main skill page or a subpage
    var isMainPage = currentPath === "/docs/skills/".concat(skillName) ||
        currentPath === "/docs/skills/".concat(skillName, "/");
    return (<div className="skill-references-toc">
      <div className="skill-references-header">
        <span className="skill-references-icon">📚</span>
        <span>Skill References</span>
        {!isMainPage && (<a href={"/docs/skills/".concat(skillName)} className="skill-references-back" title="Back to skill overview">
            ← Overview
          </a>)}
      </div>
      <div className="skill-references-list">
        {sortedCategories.map(function (category) { return (<div key={category} className="skill-references-category">
            {sortedCategories.length > 1 && (<div className="skill-references-category-label">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </div>)}
            {grouped[category].map(function (ref) {
                // Build the doc URL - convert filename to doc path
                var docPath = ref.path
                    .replace(/\.md$/, '')
                    .replace(urlSkillName + '/', '');
                var href = "/docs/skills/".concat(skillName, "/").concat(docPath);
                // Check if this is the current page
                var isCurrent = currentPath.includes(docPath.replace(/\//g, '/'));
                // Check if visited (but not current)
                var isVisited = visitedRefs.has(href) && !isCurrent;
                return (<a key={ref.path} href={href} className={"skill-reference-item ".concat(isCurrent ? 'skill-reference-current' : '', " ").concat(isVisited ? 'skill-reference-visited' : '', " ").concat(!isVisited && !isCurrent ? 'skill-reference-new' : '')}>
                  <div className="skill-reference-title">
                    {isCurrent && <span className="skill-reference-indicator">▶</span>}
                    {ref.title}
                    {!isVisited && !isCurrent && (<span className="skill-reference-new-badge">NEW</span>)}
                  </div>
                  <div className="skill-reference-meta">
                    <span className={"skill-ref-badge ".concat(getLineBadgeClass(ref.lineCount))}>
                      {ref.lineCount} lines
                    </span>
                  </div>
                  {ref.description && (<div className="skill-reference-desc">
                      {ref.description}
                    </div>)}
                </a>);
            })}
          </div>); })}
      </div>
    </div>);
}
function TOCWrapper(props) {
    var location = (0, router_1.useLocation)();
    // Check if we're on any skill page (main or subpage)
    // Match: /docs/skills/{skill-name} or /docs/skills/{skill-name}/...
    var skillMatch = location.pathname.match(/^\/docs\/skills\/([^/]+)/);
    var isSkillPage = !!skillMatch;
    var skillName = skillMatch ? skillMatch[1] : null;
    return (<div className="toc-wrapper-with-references">
      {isSkillPage && skillName && (<SkillReferences skillName={skillName} currentPath={location.pathname}/>)}
      <TOC_1.default {...props}/>
    </div>);
}
