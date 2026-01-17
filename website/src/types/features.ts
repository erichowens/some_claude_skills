/**
 * TypeScript type definitions for new features
 *
 * - Tutorial system
 * - Skill bundles
 * - Video walkthroughs
 * - Onboarding
 */

// ============================================================================
// Tutorial System
// ============================================================================

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  code?: string;
  language?: string;
  filePath?: string;
  allowCopy?: boolean;
}

export interface TutorialMetadata {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'advanced' | 'integration';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  prerequisites: string[];
  steps: TutorialStep[];
  tags: string[];
}

export interface TutorialProgress {
  tutorialId: string;
  completedSteps: string[];
  startedAt: Date;
  lastUpdated: Date;
  completed: boolean;
}

// ============================================================================
// Skill Bundles
// ============================================================================

export interface BundleConfig {
  id: string;
  name: string;
  description: string;
  category: 'startup' | 'code-review' | 'documentation' | 'devops' | 'ai-development';
  skills: string[];
  installation: {
    command: string;
    steps: string[];
  };
  useCases: string[];
  prerequisites?: string[];
}

export interface BundleMetadata extends BundleConfig {
  skillCount: number;
  totalDownloads?: number;
  featured?: boolean;
}

// ============================================================================
// Video Walkthroughs
// ============================================================================

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'skill-building' | 'bundles' | 'advanced';
  duration: number;
  thumbnailUrl: string;
  videoUrl: string;
  platform: 'youtube' | 'loom' | 'vimeo';
  relatedSkills?: string[];
  relatedBundles?: string[];
  transcript?: string;
}

export interface VideoProgress {
  videoId: string;
  watchedSeconds: number;
  completed: boolean;
  lastWatched: Date;
}

// ============================================================================
// Onboarding
// ============================================================================

export type OnboardingPath =
  | 'beginner'
  | 'experienced'
  | 'specific-skill';

export interface OnboardingChoice {
  path: OnboardingPath;
  label: string;
  description: string;
  nextStep: 'tutorials' | 'bundles' | 'skills';
}

export interface OnboardingState {
  completed: boolean;
  selectedPath?: OnboardingPath;
  dismissedAt?: Date;
  viewedAt: Date;
}

// ============================================================================
// Feature Flags
// ============================================================================

export interface FeatureFlags {
  onboardingModal: boolean;
  tutorialSystem: boolean;
  skillBundles: boolean;
  videoWalkthroughs: boolean;
}

// ============================================================================
// User Preferences
// ============================================================================

export interface UserPreferences {
  theme?: 'win31' | 'modern';
  dismissedOnboarding: boolean;
  tutorialProgress: Record<string, TutorialProgress>;
  videoProgress: Record<string, VideoProgress>;
  favoriteSkills: string[];
  favoriteBundles: string[];
}

// ============================================================================
// Analytics Events
// ============================================================================

export type TutorialEvent =
  | 'tutorial_started'
  | 'tutorial_step_completed'
  | 'tutorial_completed'
  | 'tutorial_abandoned'
  | 'code_copied';

export type BundleEvent =
  | 'bundle_viewed'
  | 'bundle_install_copied'
  | 'bundle_skill_clicked';

export type VideoEvent =
  | 'video_started'
  | 'video_paused'
  | 'video_completed'
  | 'video_seeked';

export type OnboardingEvent =
  | 'onboarding_viewed'
  | 'onboarding_path_selected'
  | 'onboarding_dismissed'
  | 'onboarding_completed';

export type AnalyticsEvent =
  | TutorialEvent
  | BundleEvent
  | VideoEvent
  | OnboardingEvent;

export interface AnalyticsEventData {
  event: AnalyticsEvent;
  properties?: Record<string, string | number | boolean>;
  timestamp: Date;
}
