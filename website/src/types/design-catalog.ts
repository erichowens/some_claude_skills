/**
 * Design Catalog Type Definitions
 *
 * Type-safe interfaces for the design catalog data files.
 * Used by Session 4: Design System Generator.
 */

// =============================================================================
// Color Palette Types
// =============================================================================

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface Color {
  name: string;
  hex: string;
  rgb: RGB;
  hsl: HSL;
  usage: string[];
}

export interface WCAGLevel {
  normalText: boolean;
  largeText: boolean;
}

export interface ContrastCombination {
  foreground: string;
  background: string;
  ratio: number;
  aa: WCAGLevel;
  aaa: WCAGLevel;
}

export interface ContrastAgainst {
  ratio: number;
  aa: WCAGLevel;
  aaa: WCAGLevel;
}

export interface WCAGInfo {
  contrastAgainstWhite: ContrastAgainst;
  contrastAgainstBlack: ContrastAgainst;
  combinations: ContrastCombination[];
}

export interface SemanticColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  trend: string;
  description: string;
  colors: Color[];
  wcag: WCAGInfo;
  semantic: SemanticColors;
}

export interface ColorPalettesFile {
  $schema: string;
  version: string;
  lastUpdated: string;
  palettes: ColorPalette[];
}

// =============================================================================
// Typography System Types
// =============================================================================

export interface FontDefinition {
  family: string;
  weight: number;
  fallback: string;
  letterSpacing?: string;
}

export interface Fonts {
  display: FontDefinition;
  heading: FontDefinition;
  body: FontDefinition;
  label: FontDefinition;
  monospace: FontDefinition;
}

export interface LineHeights {
  tight: number;
  normal: number;
  relaxed: number;
  loose: number;
}

export interface TypeScaleEntry {
  size: string;
  computed: string;
  lineHeight: number;
  use: string;
}

export interface TypeScale {
  xs: TypeScaleEntry;
  sm: TypeScaleEntry;
  base: TypeScaleEntry;
  lg: TypeScaleEntry;
  xl: TypeScaleEntry;
  '2xl': TypeScaleEntry;
  '3xl': TypeScaleEntry;
  '4xl': TypeScaleEntry;
  '5xl': TypeScaleEntry;
}

export interface TypographyExample {
  element: string;
  scale: string;
  font: string;
  sample: string;
}

export interface CSSVariables {
  [key: string]: string;
}

export interface TypographySystem {
  id: string;
  name: string;
  trend: string;
  description: string;
  baseFontSize: number;
  scaleRatio: number;
  scaleRatioName: string;
  fonts: Fonts;
  lineHeights: LineHeights;
  typeScale: TypeScale;
  readabilityScore: number;
  readabilityNotes: string;
  examples: TypographyExample[];
  cssVariables: CSSVariables;
}

export interface TypographySystemsFile {
  $schema: string;
  version: string;
  lastUpdated: string;
  systems: TypographySystem[];
}

// =============================================================================
// Component Types
// =============================================================================

export interface StateStyle {
  background?: string;
  border?: string;
  color?: string;
  transform?: string;
  boxShadow?: string;
  outline?: string;
  outlineOffset?: string;
  opacity?: number;
  cursor?: string;
}

export interface ComponentStates {
  default: StateStyle;
  hover: StateStyle;
  active: StateStyle;
  focus: StateStyle;
  disabled: StateStyle;
}

export interface ComponentAccessibility {
  role: string;
  ariaRequired: string[];
  keyboardSupport: string[];
  focusIndicator: string;
  minTouchTarget: string;
  screenReaderText?: string;
}

export interface ComponentVariant {
  name: string;
  description: string;
  cssModifier: string;
}

export interface Component {
  id: string;
  name: string;
  category: ComponentCategory;
  trend: string;
  description: string;
  html: string;
  css: string;
  states: ComponentStates;
  accessibility: ComponentAccessibility;
  variants: ComponentVariant[];
  usageNotes: string[];
}

export type ComponentCategory =
  | 'buttons'
  | 'cards'
  | 'navigation'
  | 'heroes'
  | 'ctas'
  | 'testimonials'
  | 'forms';

export interface ComponentsFile {
  $schema: string;
  version: string;
  lastUpdated: string;
  categories: ComponentCategory[];
  components: Component[];
}

// =============================================================================
// Main Catalog Index Types
// =============================================================================

export interface CatalogMetadata {
  title: string;
  description: string;
  author: string;
  license: string;
  repository: string;
}

export interface CatalogStatistics {
  trends: number;
  colorPalettes: number;
  typographySystems: number;
  components: number;
  wcagCompliant: {
    aa: number;
    aaa: number;
  };
}

export interface TrendSummary {
  id: string;
  name: string;
  era: string;
  popularity: 'high' | 'medium' | 'rising' | 'niche';
}

export interface CatalogFiles {
  colorPalettes: string;
  typographySystems: string;
  components: string;
  documentation: string;
}

export interface AccessibilityStandards {
  wcag: string;
  level: 'A' | 'AA' | 'AAA';
  contrastRequirements: {
    normalText: number;
    largeText: number;
    uiComponents: number;
  };
  touchTargetMinimum: string;
  focusIndicatorRequirement: string;
}

export interface CategorySummary {
  id: ComponentCategory;
  name: string;
  count: number;
  description: string;
}

export interface CatalogUsage {
  installation: string;
  import: string;
  typescript: string;
}

export interface DesignCatalog {
  $schema: string;
  version: string;
  lastUpdated: string;
  metadata: CatalogMetadata;
  statistics: CatalogStatistics;
  trends: TrendSummary[];
  files: CatalogFiles;
  accessibilityStandards: AccessibilityStandards;
  componentCategories: CategorySummary[];
  usage: CatalogUsage;
}

// =============================================================================
// Utility Types
// =============================================================================

/** Get palettes by trend */
export type PalettesByTrend<T extends string> = ColorPalette & { trend: T };

/** Get components by category */
export type ComponentsByCategory<C extends ComponentCategory> = Component & { category: C };

/** WCAG compliance check result */
export interface WCAGComplianceResult {
  palette: string;
  combination: string;
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
}

/** Typography readability check */
export interface ReadabilityCheck {
  system: string;
  score: number;
  grade: 'excellent' | 'good' | 'acceptable' | 'poor';
}

// =============================================================================
// Helper Functions (type guards)
// =============================================================================

export function isColorPalette(obj: unknown): obj is ColorPalette {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'colors' in obj &&
    'wcag' in obj
  );
}

export function isTypographySystem(obj: unknown): obj is TypographySystem {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'baseFontSize' in obj &&
    'typeScale' in obj
  );
}

export function isComponent(obj: unknown): obj is Component {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'category' in obj &&
    'accessibility' in obj
  );
}

export function getReadabilityGrade(score: number): ReadabilityCheck['grade'] {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'acceptable';
  return 'poor';
}
