import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'claude-skills-starred';

export function useStarredSkills() {
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setStarred(new Set(parsed));
        }
      }
    } catch (e) {
      console.warn('Failed to load starred skills from localStorage', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when starred changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...starred]));
      } catch (e) {
        console.warn('Failed to save starred skills to localStorage', e);
      }
    }
  }, [starred, isLoaded]);

  const toggleStar = useCallback((skillId: string) => {
    setStarred(prev => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  }, []);

  const isStarred = useCallback((skillId: string) => {
    return starred.has(skillId);
  }, [starred]);

  const getStarredCount = useCallback(() => {
    return starred.size;
  }, [starred]);

  const getStarredIds = useCallback(() => {
    return [...starred];
  }, [starred]);

  return {
    starred,
    toggleStar,
    isStarred,
    getStarredCount,
    getStarredIds,
    isLoaded,
  };
}

// Utility function to share a skill
export function shareSkill(skillId: string, skillTitle: string): Promise<void> {
  const url = `${window.location.origin}/docs/skills/${skillId.replace(/-/g, '_')}`;

  // Try native share API first (mobile)
  if (navigator.share) {
    return navigator.share({
      title: `${skillTitle} - Claude Skill`,
      text: `Check out the ${skillTitle} skill for Claude Code!`,
      url,
    }).catch(() => {
      // Fall back to clipboard
      return copyToClipboard(url);
    });
  }

  // Fall back to clipboard
  return copyToClipboard(url);
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
