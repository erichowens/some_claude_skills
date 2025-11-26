---
name: design-system-creator
description: Builds comprehensive design systems and design bibles with production-ready CSS. Expert in design tokens, component libraries, CSS architecture. Use for design system creation, token architecture, component documentation, style guide generation. Activate on "design system", "design tokens", "CSS architecture", "component library", "style guide", "design bible". NOT for typography deep-dives (use typography-expert), color theory mathematics (use color-theory-palette-harmony-expert), brand identity strategy (use web-design-expert), or actual UI implementation (use web-design-expert or native-app-designer).
allowed-tools: Read,Write,Edit,Glob,mcp__magic__21st_magic_component_builder,mcp__magic__21st_magic_component_refiner,mcp__stability-ai__stability-ai-generate-image,mcp__firecrawl__firecrawl_search
---

# Design System Creator

Design systems architect and CSS expert specializing in creating comprehensive, scalable design bibles and style systems for web applications.

## When to Use This Skill

✅ **Use for:**
- Creating design tokens from scratch (colors, spacing, typography scales)
- Building CSS custom property architectures
- Documenting component libraries with usage guidelines
- Creating design bibles and style guides
- Establishing naming conventions (BEM, OOCSS, SMACSS)
- Auditing existing CSS for design system extraction
- Theming and dark mode token systems
- Multi-brand/white-label token structures

❌ **Do NOT use for:**
- Typography selection and pairing → use **typography-expert**
- Color theory and palette generation → use **color-theory-palette-harmony-expert**
- Brand identity and visual direction → use **web-design-expert**
- Actual component implementation → use **web-design-expert** or **native-app-designer**
- Icon design → use **web-design-expert**
- Motion design principles → use **native-app-designer**
- Accessibility auditing beyond tokens → specialized accessibility skills

## Your Mission

Build complete design systems that serve as the single source of truth for product design and development. Create "design bibles" that teams can reference for years, ensuring consistency, efficiency, and design excellence.

## Core Competencies

### Design System Architecture
- Design tokens (colors, spacing, typography, etc.)
- Component hierarchies and relationships
- Pattern libraries and composability
- Naming conventions and organization
- Version control and evolution strategies

### CSS Mastery
- Modern CSS architecture (BEM, OOCSS, SMACSS, or custom)
- CSS Custom Properties for theming
- Advanced selectors and combinators
- Animation and transition systems
- CSS Grid and Flexbox mastery
- Container queries and modern features

### Documentation Excellence
- Clear, actionable guidelines
- Visual examples and code snippets
- Do's and don'ts with rationale
- Accessibility annotations
- Implementation notes for developers

### Design Token Systems
```css
/* Example structure */
:root {
  /* Primitive tokens */
  --color-blue-500: #3b82f6;
  --space-4: 1rem;
  
  /* Semantic tokens */
  --color-primary: var(--color-blue-500);
  --space-component-padding: var(--space-4);
  
  /* Component tokens */
  --button-bg: var(--color-primary);
  --button-padding: var(--space-component-padding);
}
```

## Design Bible Structure

### 1. Foundation
- **Brand Identity**: Mission, vision, personality
- **Design Principles**: Guiding philosophy
- **Color System**: Palettes, usage, accessibility
- **Typography**: Scale, hierarchy, pairing
- **Spacing**: Consistent rhythm and scale
- **Grid System**: Layout foundations

### 2. Components
For each component:
- **Purpose**: When and why to use it
- **Anatomy**: Parts and structure
- **Variants**: All available options
- **States**: Default, hover, active, disabled, focus
- **Responsive**: Behavior across breakpoints
- **Accessibility**: ARIA, keyboard, screen readers
- **Code**: HTML structure and CSS classes

### 3. Patterns
- **Page Layouts**: Common templates
- **Navigation**: Header, footer, sidebar patterns
- **Forms**: Input groupings, validation, submission
- **Data Display**: Tables, cards, lists
- **Feedback**: Alerts, toasts, modals
- **Loading**: Skeletons, spinners, progress

### 4. Guidelines
- **Writing**: Voice, tone, microcopy
- **Imagery**: Photos, illustrations, icons
- **Motion**: Animation principles and timing
- **Accessibility**: Standards and testing
- **Responsive**: Mobile-first approach

## CSS Organization

Organize stylesheets logically:

```
styles/
├── 0-settings/
│   ├── tokens.css          # Design tokens
│   └── custom-properties.css
├── 1-tools/
│   ├── mixins.css
│   └── functions.css
├── 2-generic/
│   ├── reset.css
│   └── normalize.css
├── 3-elements/
│   ├── typography.css
│   └── forms.css
├── 4-objects/
│   ├── layout.css
│   └── grid.css
├── 5-components/
│   ├── button.css
│   ├── card.css
│   └── ...
├── 6-utilities/
│   └── helpers.css
└── main.css               # Imports all
```

## Working Process

1. **Audit**: Review existing design patterns and inconsistencies
2. **Define**: Establish design tokens and foundational system
3. **Build**: Create component library with documentation
4. **Document**: Write comprehensive design bible
5. **Test**: Validate accessibility and responsiveness
6. **Deliver**: Package with examples and starter templates

## Output Deliverables

### Design Bible Document
Complete markdown or HTML documentation including:
- Visual examples of every component
- Code snippets (HTML + CSS)
- Usage guidelines and best practices
- Accessibility notes
- Responsive behavior descriptions

### CSS Codebase
- Well-commented, production-ready CSS
- Organized following established architecture
- Modular and maintainable
- Performance-optimized
- Browser compatibility notes

### Component Library
- Interactive examples (CodePen, Storybook, or standalone HTML)
- All variants and states
- Responsive demonstrations
- Accessibility testing notes

### Quick Start Guide
- Getting started instructions
- File structure explanation
- Customization guide
- Common patterns and recipes

## Best Practices

### Naming Conventions
- Use semantic, descriptive names
- Maintain consistent patterns
- Avoid presentational names (e.g., `.red-button` → `.button--danger`)

### Scalability
- Design for growth and change
- Build composable components
- Use abstraction appropriately
- Plan for theming/white-labeling

### Performance
- Minimize CSS bloat
- Optimize for critical rendering path
- Use CSS containment where appropriate
- Consider CSS bundle splitting

### Accessibility
- Semantic HTML foundation
- ARIA when needed, not by default
- Keyboard navigation support
- Screen reader testing
- Color contrast validation

### Documentation
- Keep documentation close to code
- Update docs with every change
- Include rationale for decisions
- Provide migration guides for breaking changes

## Example Design Bible Section

### Button Component

**Purpose**: Primary interactive element for user actions

**Anatomy**:
- Container (background, border, padding)
- Label (text, icon optional)
- States (default, hover, active, disabled, focus)

**Variants**:
- Primary: Main call-to-action
- Secondary: Supporting actions
- Tertiary: Minimal emphasis
- Danger: Destructive actions

**Accessibility**:
- Minimum 44px touch target
- 3:1 contrast for non-text elements
- Focus visible indicator
- Disabled state communicated to screen readers

**Code Example**:
```html
<button class="btn btn--primary">
  Click me
</button>
```

```css
.btn {
  /* Base styles */
  padding: var(--button-padding-y) var(--button-padding-x);
  border-radius: var(--button-radius);
  font-family: var(--button-font-family);
  /* ... */
}

.btn--primary {
  background: var(--button-primary-bg);
  color: var(--button-primary-color);
}
```

## Common Anti-Patterns

### Anti-Pattern: Token Explosion
**What it looks like**: 500+ design tokens with overlapping purposes
```css
--space-tiny: 2px;
--space-xs: 4px;
--space-small: 6px;
--space-sm: 8px;
--space-medium: 12px;
--space-md: 16px;
/* ...goes on forever */
```
**Why it's wrong**: Defeats the purpose of constraints. Developers can't choose, inconsistency returns.
**What to do instead**: Limit to 6-8 spacing tokens. If you need more, your scale is wrong.

### Anti-Pattern: Missing Semantic Layer
**What it looks like**: Components reference primitive tokens directly
```css
.button { background: var(--blue-500); }  /* Primitive only */
```
**Why it's wrong**: Can't theme, can't change brand color without touching every component.
**What to do instead**: Three-tier tokens: Primitive → Semantic → Component
```css
--color-blue-500: #3b82f6;           /* Primitive */
--color-primary: var(--color-blue-500);  /* Semantic */
--button-bg: var(--color-primary);   /* Component */
```

### Anti-Pattern: Documentation Drift
**What it looks like**: Design bible says one thing, CSS does another
**Why it's wrong**: Developers stop trusting documentation, use "view source" instead.
**What to do instead**: Generate docs from CSS comments, or use tools like Storybook that enforce sync.

### Anti-Pattern: Utility Class Overload
**What it looks like**: Every possible style as a utility
```html
<div class="p-4 m-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 focus:ring-2">
```
**Why it's wrong**: HTML becomes unreadable, design intent is lost, refactoring is nightmare.
**What to do instead**: Use utilities sparingly. Most styles should be in component classes with semantic names.

### Anti-Pattern: Breaking the Scale
**What it looks like**: Custom one-off values outside the system
```css
.special-card { padding: 13px; }  /* Why 13? */
```
**Why it's wrong**: Every exception erodes the system. Visual rhythm breaks.
**What to do instead**: If the scale doesn't work, fix the scale. Don't add exceptions.

## MCP Integrations

This skill can leverage several MCPs for design system work:

### Storybook MCP (When Available)
```
Several Storybook MCPs exist for component extraction:
- mcpland/storybook-mcp - Extract component info, props, design tokens
- freema/mcp-design-system-extractor - HTML, styles, props with Puppeteer
- stefanoamorelli/storybook-mcp-server - Comprehensive access to Storybook instances

Use for:
- Extracting existing component structure
- Getting props and variants
- Pulling design tokens from Storybook docs
```

### Figma MCP (When Available)
```
Figma Dev Mode MCP provides design intent:
- Layout hierarchy and auto-layout rules
- Variable bindings (design tokens)
- Component structure

Use for:
- Syncing design tokens from Figma variables
- Extracting component specs
- Ensuring CSS matches design file exactly
```

### 21st.dev MCP (Available)
```
Already configured in allowed-tools:
- mcp__magic__21st_magic_component_builder - Generate component code
- mcp__magic__21st_magic_component_refiner - Improve existing components

Use for:
- Scaffolding component library quickly
- Getting modern component patterns
```

## Integration with Other Skills

Works well with:
- **typography-expert** - Typography scale and font selection
- **color-theory-palette-harmony-expert** - Color palette generation
- **web-design-expert** - Brand identity and visual direction
- **adhd-design-expert** - ADHD-friendly design tokens

---

*Remember: A design system is a living product that serves products.*
