"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SubmitSkill;
var react_1 = require("react");
var Layout_1 = require("@theme/Layout");
var Link_1 = require("@docusaurus/Link");
require("../css/win31.css");
// Categories from types.ts
var SKILL_CATEGORIES = [
    'AI & Machine Learning',
    'Code Quality & Testing',
    'Content & Writing',
    'Data & Analytics',
    'Design & Creative',
    'DevOps & Site Reliability',
    'Business & Monetization',
    'Research & Analysis',
    'Productivity & Meta',
    'Lifestyle & Personal',
];
var initialFormData = {
    name: '',
    title: '',
    description: '',
    category: '',
    tags: '',
    allowedTools: 'Read, Write, Edit, Bash, WebSearch',
    useCases: '',
    antiPatterns: '',
    pairsWith: '',
    submitterName: '',
    submitterGithub: '',
};
function toKebabCase(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}
function toTitleCase(str) {
    return str
        .split(/[-_\s]+/)
        .map(function (word) { return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); })
        .join(' ');
}
function SubmitSkill() {
    var _this = this;
    var _a = (0, react_1.useState)(initialFormData), formData = _a[0], setFormData = _a[1];
    var _b = (0, react_1.useState)({}), errors = _b[0], setErrors = _b[1];
    var _c = (0, react_1.useState)(false), showPreview = _c[0], setShowPreview = _c[1];
    var _d = (0, react_1.useState)(false), copied = _d[0], setCopied = _d[1];
    var _e = (0, react_1.useState)(false), submitted = _e[0], setSubmitted = _e[1];
    var handleChange = (0, react_1.useCallback)(function (e) {
        var _a = e.target, name = _a.name, value = _a.value;
        setFormData(function (prev) {
            var _a;
            var updated = __assign(__assign({}, prev), (_a = {}, _a[name] = value, _a));
            // Auto-generate title from name
            if (name === 'name') {
                updated.title = toTitleCase(value);
            }
            return updated;
        });
        // Clear error when field is edited
        if (errors[name]) {
            setErrors(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = '', _a)));
            });
        }
    }, [errors]);
    var validate = (0, react_1.useCallback)(function () {
        var newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Skill name is required';
        }
        else if (!/^[a-zA-Z0-9\s-]+$/.test(formData.name)) {
            newErrors.name = 'Name can only contain letters, numbers, spaces, and hyphens';
        }
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }
        else if (formData.description.length < 50) {
            newErrors.description = 'Description should be at least 50 characters';
        }
        if (!formData.category) {
            newErrors.category = 'Please select a category';
        }
        if (!formData.tags.trim()) {
            newErrors.tags = 'At least one tag is required';
        }
        if (!formData.useCases.trim()) {
            newErrors.useCases = 'Please describe when to use this skill';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);
    var generateSkillYaml = (0, react_1.useCallback)(function () {
        var skillId = toKebabCase(formData.name);
        var tags = formData.tags.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
        var tools = formData.allowedTools.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
        var yaml = "---\nname: ".concat(skillId, "\ndescription: ").concat(formData.description.replace(/\n/g, ' ').trim(), "\nallowed-tools: ").concat(tools.join(', '), "\ncategory: ").concat(formData.category, "\ntags:\n").concat(tags.map(function (t) { return "  - ".concat(t); }).join('\n'), "\n---\n\n# ").concat(formData.title, "\n\n").concat(formData.description, "\n\n## When to Use\n\n").concat(formData.useCases, "\n");
        if (formData.antiPatterns.trim()) {
            yaml += "\n## When NOT to Use\n\n".concat(formData.antiPatterns, "\n");
        }
        if (formData.pairsWith.trim()) {
            yaml += "\n## Works Well With\n\n".concat(formData.pairsWith, "\n");
        }
        return yaml;
    }, [formData]);
    var generateGitHubIssueUrl = (0, react_1.useCallback)(function () {
        var skillId = toKebabCase(formData.name);
        var yaml = generateSkillYaml();
        var title = encodeURIComponent("[Skill Submission] ".concat(formData.title));
        var body = encodeURIComponent("## Skill Submission\n\n**Skill Name:** ".concat(formData.title, "\n**Skill ID:** ").concat(skillId, "\n**Category:** ").concat(formData.category, "\n**Tags:** ").concat(formData.tags, "\n\n").concat(formData.submitterName ? "**Submitted by:** ".concat(formData.submitterName) : '', "\n").concat(formData.submitterGithub ? "**GitHub:** @".concat(formData.submitterGithub.replace('@', '')) : '', "\n\n---\n\n## SKILL.md Content\n\n```yaml\n").concat(yaml, "\n```\n\n---\n\n## Additional Context\n\n_Add any additional context, examples, or references here._\n"));
        return "https://github.com/erichowens/some_claude_skills/issues/new?title=".concat(title, "&body=").concat(body, "&labels=skill-submission");
    }, [formData, generateSkillYaml]);
    var handlePreview = (0, react_1.useCallback)(function () {
        if (validate()) {
            setShowPreview(true);
        }
    }, [validate]);
    var handleCopyYaml = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var yaml, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    yaml = generateSkillYaml();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, navigator.clipboard.writeText(yaml)];
                case 2:
                    _a.sent();
                    setCopied(true);
                    setTimeout(function () { return setCopied(false); }, 2000);
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.error('Failed to copy:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [generateSkillYaml]);
    var handleSubmitToGitHub = (0, react_1.useCallback)(function () {
        var url = generateGitHubIssueUrl();
        window.open(url, '_blank');
        setSubmitted(true);
    }, [generateGitHubIssueUrl]);
    var handleReset = (0, react_1.useCallback)(function () {
        setFormData(initialFormData);
        setErrors({});
        setShowPreview(false);
        setSubmitted(false);
        setCopied(false);
    }, []);
    var inputStyle = {
        width: '100%',
        padding: '8px 12px',
        fontSize: '14px',
        fontFamily: 'var(--font-code)',
        border: '2px inset #808080',
        background: 'white',
        boxSizing: 'border-box',
    };
    var labelStyle = {
        display: 'block',
        marginBottom: '6px',
        fontWeight: 'bold',
        fontSize: '13px',
        color: '#000080',
    };
    var errorStyle = {
        color: '#c00',
        fontSize: '12px',
        marginTop: '4px',
    };
    var fieldGroupStyle = {
        marginBottom: '16px',
    };
    if (submitted) {
        return (<Layout_1.default title="Skill Submitted" description="Thank you for submitting a skill idea">
        <div className="skills-page-bg page-backsplash page-backsplash--submit-skill page-backsplash--medium">
          <div className="skills-container" style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
            <div className="win31-window">
              <div className="win31-titlebar">
                <div className="win31-titlebar__left">
                  <div className="win31-btn-3d win31-btn-3d--small">-</div>
                </div>
                <span className="win31-title-text">SUBMISSION_SUCCESS.EXE</span>
                <div className="win31-titlebar__right">
                  <div className="win31-btn-3d win31-btn-3d--small">[]</div>
                </div>
              </div>
              <div style={{ padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                <h1 style={{ marginTop: 0, fontSize: '28px', color: '#000080' }}>
                  Skill Submitted!
                </h1>
                <p style={{ fontSize: '15px', color: '#333', marginBottom: '24px', lineHeight: '1.6' }}>
                  Your skill idea has been submitted as a GitHub Issue.
                  The maintainers will review it and may reach out for clarification.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="win31-btn-3d" onClick={handleReset} style={{ padding: '12px 24px', fontWeight: 'bold' }}>
                    Submit Another
                  </button>
                  <Link_1.default to="/skills" className="win31-btn-3d" style={{ padding: '12px 24px', fontWeight: 'bold', textDecoration: 'none' }}>
                    Browse Skills
                  </Link_1.default>
                  <a href="https://github.com/erichowens/some_claude_skills/issues?q=is%3Aissue+label%3Askill-submission" target="_blank" rel="noopener noreferrer" className="win31-btn-3d" style={{ padding: '12px 24px', fontWeight: 'bold', textDecoration: 'none' }}>
                    View All Submissions
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout_1.default>);
    }
    return (<Layout_1.default title="Submit a Skill" description="Submit your Claude skill idea to the community collection">
      <div className="skills-page-bg page-backsplash page-backsplash--submit-skill page-backsplash--medium">
        <div className="skills-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>

          {/* Header */}
          <div className="win31-window">
            <div className="win31-titlebar">
              <div className="win31-titlebar__left">
                <div className="win31-btn-3d win31-btn-3d--small">-</div>
              </div>
              <span className="win31-title-text">SUBMIT_SKILL.EXE</span>
              <div className="win31-titlebar__right">
                <div className="win31-btn-3d win31-btn-3d--small">[]</div>
              </div>
            </div>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <h1 style={{ marginTop: 0, fontSize: '28px', marginBottom: '12px', color: '#000080' }}>
                Submit a Skill Idea
              </h1>
              <p style={{ fontSize: '14px', color: '#555', marginBottom: 0, lineHeight: '1.6' }}>
                Have an idea for a useful Claude skill? Submit it here and we'll review it for inclusion
                in the collection. Good skills are specific, actionable, and help Claude do something it
                couldn't do well without guidance.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="win31-window" style={{ marginTop: '24px' }}>
            <div className="win31-titlebar">
              <div className="win31-titlebar__left">
                <div className="win31-btn-3d win31-btn-3d--small">-</div>
              </div>
              <span className="win31-title-text">SKILL_DETAILS.FRM</span>
              <div className="win31-titlebar__right">
                <div className="win31-btn-3d win31-btn-3d--small">[]</div>
              </div>
            </div>
            <div style={{ padding: '24px' }}>

              {/* Skill Name */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>
                  Skill Name <span style={{ color: '#c00' }}>*</span>
                </label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., api-architect, code-necromancer" style={inputStyle}/>
                {errors.name && <div style={errorStyle}>{errors.name}</div>}
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Will become: <code>{toKebabCase(formData.name) || 'skill-name'}</code>
                </div>
              </div>

              {/* Title (auto-generated) */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Display Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Human-readable title" style={inputStyle}/>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Auto-generated from name, but you can customize it
                </div>
              </div>

              {/* Category */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>
                  Category <span style={{ color: '#c00' }}>*</span>
                </label>
                <select name="category" value={formData.category} onChange={handleChange} style={__assign(__assign({}, inputStyle), { cursor: 'pointer' })}>
                  <option value="">-- Select a category --</option>
                  {SKILL_CATEGORIES.map(function (cat) { return (<option key={cat} value={cat}>{cat}</option>); })}
                </select>
                {errors.category && <div style={errorStyle}>{errors.category}</div>}
              </div>

              {/* Description */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>
                  Description <span style={{ color: '#c00' }}>*</span>
                </label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="A concise description of what this skill does. Include activation phrases like 'Activate on: X, Y, Z' and clarify what it's NOT for." style={__assign(__assign({}, inputStyle), { resize: 'vertical' })}/>
                {errors.description && <div style={errorStyle}>{errors.description}</div>}
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {formData.description.length} characters (min 50)
                </div>
              </div>

              {/* Tags */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>
                  Tags <span style={{ color: '#c00' }}>*</span>
                </label>
                <input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="api, rest, graphql, microservices" style={inputStyle}/>
                {errors.tags && <div style={errorStyle}>{errors.tags}</div>}
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Comma-separated list of relevant tags (aim for 3-5)
                </div>
              </div>

              {/* Allowed Tools */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Allowed Tools</label>
                <input type="text" name="allowedTools" value={formData.allowedTools} onChange={handleChange} placeholder="Read, Write, Edit, Bash, WebSearch" style={inputStyle}/>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Comma-separated Claude tools this skill needs access to
                </div>
              </div>

              {/* Use Cases */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>
                  When to Use <span style={{ color: '#c00' }}>*</span>
                </label>
                <textarea name="useCases" value={formData.useCases} onChange={handleChange} rows={4} placeholder="Describe specific scenarios when this skill should be activated. Include example user prompts or situations." style={__assign(__assign({}, inputStyle), { resize: 'vertical' })}/>
                {errors.useCases && <div style={errorStyle}>{errors.useCases}</div>}
              </div>

              {/* Anti-patterns */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>When NOT to Use (Optional)</label>
                <textarea name="antiPatterns" value={formData.antiPatterns} onChange={handleChange} rows={3} placeholder="Describe situations where this skill should NOT be used, or common mistakes to avoid." style={__assign(__assign({}, inputStyle), { resize: 'vertical' })}/>
              </div>

              {/* Pairs With */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Works Well With (Optional)</label>
                <textarea name="pairsWith" value={formData.pairsWith} onChange={handleChange} rows={2} placeholder="Other skills this pairs well with, e.g., 'career-biographer for data, competitive-cartographer for positioning'" style={__assign(__assign({}, inputStyle), { resize: 'vertical' })}/>
              </div>

              {/* Submitter Info */}
              <div style={{
            background: '#f5f5f5',
            border: '1px solid #ddd',
            padding: '16px',
            marginTop: '24px',
        }}>
                <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#000080', fontSize: '14px' }}>
                  Submitter Info (Optional)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={__assign(__assign({}, labelStyle), { color: '#555' })}>Your Name</label>
                    <input type="text" name="submitterName" value={formData.submitterName} onChange={handleChange} placeholder="Jane Doe" style={inputStyle}/>
                  </div>
                  <div>
                    <label style={__assign(__assign({}, labelStyle), { color: '#555' })}>GitHub Username</label>
                    <input type="text" name="submitterGithub" value={formData.submitterGithub} onChange={handleChange} placeholder="@janedoe" style={inputStyle}/>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '2px groove #ccc',
        }}>
                <button type="button" className="win31-btn-3d" onClick={handleReset} style={{ padding: '10px 20px' }}>
                  Reset Form
                </button>
                <button type="button" className="win31-btn-3d" onClick={handlePreview} style={{ padding: '10px 20px', background: '#000080', color: 'white', fontWeight: 'bold' }}>
                  Preview & Submit →
                </button>
              </div>
            </div>
          </div>

          {/* Preview Modal */}
          {showPreview && (<div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '20px',
            }} onClick={function () { return setShowPreview(false); }}>
              <div className="win31-window" style={{
                maxWidth: '700px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
            }} onClick={function (e) { return e.stopPropagation(); }}>
                <div className="win31-titlebar">
                  <div className="win31-titlebar__left">
                    <div className="win31-btn-3d win31-btn-3d--small">-</div>
                  </div>
                  <span className="win31-title-text">SKILL_PREVIEW.MD</span>
                  <div className="win31-titlebar__right">
                    <button className="win31-btn-3d win31-btn-3d--small" onClick={function () { return setShowPreview(false); }} style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                      X
                    </button>
                  </div>
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ marginTop: 0, color: '#000080' }}>Generated SKILL.md Preview</h3>
                  <pre style={{
                background: '#1a1a2e',
                color: '#0f0',
                padding: '16px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '400px',
                border: '2px inset #000',
                fontFamily: 'Consolas, Monaco, monospace',
                lineHeight: '1.4',
            }}>
                    {generateSkillYaml()}
                  </pre>

                  <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                marginTop: '20px',
                flexWrap: 'wrap',
            }}>
                    <button className="win31-btn-3d" onClick={handleCopyYaml} style={{ padding: '12px 24px' }}>
                      {copied ? '✓ Copied!' : '📋 Copy YAML'}
                    </button>
                    <button className="win31-btn-3d" onClick={handleSubmitToGitHub} style={{
                padding: '12px 24px',
                background: '#000080',
                color: 'white',
                fontWeight: 'bold',
            }}>
                      🚀 Submit to GitHub
                    </button>
                    <button className="win31-btn-3d" onClick={function () { return setShowPreview(false); }} style={{ padding: '12px 24px' }}>
                      ← Back to Edit
                    </button>
                  </div>

                  <p style={{
                fontSize: '12px',
                color: '#666',
                textAlign: 'center',
                marginTop: '16px',
                marginBottom: 0,
            }}>
                    Clicking "Submit to GitHub" will open a new issue with your skill pre-filled.
                    You'll need a GitHub account to complete the submission.
                  </p>
                </div>
              </div>
            </div>)}

          {/* Guidelines */}
          <div className="win31-window" style={{ marginTop: '24px' }}>
            <div className="win31-titlebar">
              <div className="win31-titlebar__left">
                <div className="win31-btn-3d win31-btn-3d--small">-</div>
              </div>
              <span className="win31-title-text">GUIDELINES.TXT</span>
              <div className="win31-titlebar__right">
                <div className="win31-btn-3d win31-btn-3d--small">[]</div>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              <h3 style={{ marginTop: 0, fontSize: '16px', color: '#000080' }}>What Makes a Good Skill?</h3>
              <ul style={{ lineHeight: '1.7', marginBottom: 0 }}>
                <li><strong>Specific:</strong> Targets a particular domain or task type</li>
                <li><strong>Actionable:</strong> Provides clear guidance Claude can follow</li>
                <li><strong>Bounded:</strong> Knows what it's NOT for (avoids scope creep)</li>
                <li><strong>Unique:</strong> Doesn't duplicate existing skills</li>
                <li><strong>Tested:</strong> You've tried the approach and it works</li>
              </ul>

              <h3 style={{ fontSize: '16px', color: '#000080', marginTop: '20px' }}>Examples of Good Skills</h3>
              <ul style={{ lineHeight: '1.7', marginBottom: 0 }}>
                <li><Link_1.default to="/docs/skills/cv_creator">cv-creator</Link_1.default> - Specific (resumes), bounded (not cover letters), has anti-patterns</li>
                <li><Link_1.default to="/docs/skills/drone_cv_expert">drone-cv-expert</Link_1.default> - Domain expertise, pairs with inspection specialist</li>
                <li><Link_1.default to="/docs/skills/diagramming_expert">diagramming-expert</Link_1.default> - Clear activation triggers, output format guidance</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </Layout_1.default>);
}
