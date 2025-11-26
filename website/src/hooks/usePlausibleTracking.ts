import { useEffect, useCallback, useRef } from 'react';

// Declare plausible function on window
declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

export function usePlausibleTracking() {
  const track = useCallback((eventName: string, props?: Record<string, string | number>) => {
    if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
      try {
        window.plausible(eventName, { props });
      } catch (error) {
        // Silently fail in development when Plausible isn't loaded
        console.debug('Plausible tracking skipped:', eventName);
      }
    }
  }, []);

  return { track };
}

// Hook for tracking time spent on a section
export function useTimeTracking(sectionName: string) {
  const startTimeRef = useRef<number>(Date.now());
  const { track } = usePlausibleTracking();

  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000); // seconds
      if (timeSpent > 2) { // Only track if spent more than 2 seconds
        track('Time Spent', {
          section: sectionName,
          duration: timeSpent,
        });
      }
    };
  }, [sectionName, track]);
}

// Hook for tracking scroll depth
export function useScrollTracking(pageName: string) {
  const { track } = usePlausibleTracking();
  const maxScrollRef = useRef(0);
  const trackedMilestonesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      maxScrollRef.current = Math.max(maxScrollRef.current, scrollPercent);

      // Track milestones: 25%, 50%, 75%, 100%
      const milestones = [25, 50, 75, 100];
      milestones.forEach((milestone) => {
        if (
          scrollPercent >= milestone &&
          !trackedMilestonesRef.current.has(milestone)
        ) {
          trackedMilestonesRef.current.add(milestone);
          track('Scroll Depth', {
            page: pageName,
            depth: milestone,
          });
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pageName, track]);
}

// Hook for tracking skill navigation patterns
export function useSkillNavigationTracking() {
  const { track } = usePlausibleTracking();
  const lastSkillRef = useRef<string | null>(null);

  const trackSkillView = useCallback((skillId: string, source: 'marquee' | 'gallery' | 'modal' | 'direct') => {
    const previousSkill = lastSkillRef.current;

    // Track skill view
    track('Skill Viewed', {
      skill: skillId,
      source: source,
    });

    // Track skill-to-skill navigation if there was a previous skill
    if (previousSkill && previousSkill !== skillId) {
      track('Skill Navigation', {
        from: previousSkill,
        to: skillId,
      });
    }

    lastSkillRef.current = skillId;
  }, [track]);

  return { trackSkillView };
}
