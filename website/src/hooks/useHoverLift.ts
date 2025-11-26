import { useCallback } from 'react';

interface HoverLiftConfig {
  translateY?: number;
  boxShadow?: string;
  defaultBoxShadow?: string;
}

const DEFAULT_CONFIG: HoverLiftConfig = {
  translateY: 4,
  boxShadow: '10px 10px 0 rgba(0,0,0,0.5)',
  defaultBoxShadow: '6px 6px 0 rgba(0,0,0,0.4)',
};

/**
 * Reusable hook for hover lift effects
 * Eliminates duplicate onMouseEnter/onMouseLeave handlers
 */
export function useHoverLift(config: HoverLiftConfig = {}) {
  const { translateY, boxShadow, defaultBoxShadow } = { ...DEFAULT_CONFIG, ...config };

  const onMouseEnter = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = `translateY(-${translateY}px)`;
    e.currentTarget.style.boxShadow = boxShadow!;
  }, [translateY, boxShadow]);

  const onMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = defaultBoxShadow!;
  }, [defaultBoxShadow]);

  return { onMouseEnter, onMouseLeave };
}

/**
 * Pre-configured hover configs for common use cases
 */
export const HOVER_CONFIGS = {
  card: {
    translateY: 4,
    boxShadow: '10px 10px 0 rgba(0,0,0,0.5)',
    defaultBoxShadow: '6px 6px 0 rgba(0,0,0,0.4)',
  },
  button: {
    translateY: 4,
    boxShadow: '8px 8px 0 var(--win31-lime)',
    defaultBoxShadow: 'none',
  },
  featuredCard: {
    translateY: 4,
    boxShadow: '6px 6px 0 rgba(0,0,0,0.3)',
    defaultBoxShadow: 'none',
  },
} as const;
