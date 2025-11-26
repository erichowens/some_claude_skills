import { useState, useEffect } from 'react';
import plausibleStatsData from '../data/plausibleStats.json';

export interface SkillStats {
  skillId: string;
  views: number;
  lastUpdated: string;
}

export interface PlausibleStatsResponse {
  results: Array<{
    dimensions: string[];
    metrics: number[];
  }>;
}

/**
 * Hook to fetch skill view statistics from Plausible Analytics
 *
 * This hook fetches aggregated "Skill Viewed" events from Plausible's Stats API.
 *
 * Note: For production, you'll need to:
 * 1. Set up a serverless function or API route to proxy Plausible API calls
 * 2. Store your Plausible API key in environment variables
 * 3. Never expose the API key in client-side code
 *
 * For now, this returns mock data for development.
 */
export function usePlausibleStats() {
  const [stats, setStats] = useState<Map<string, SkillStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadStats = () => {
      try {
        setLoading(true);

        // Load stats from JSON file (generated at build time)
        const statsMap = new Map<string, SkillStats>();
        (plausibleStatsData as SkillStats[]).forEach(stat => {
          statsMap.set(stat.skillId, stat);
        });

        setStats(statsMap);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load stats'));
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return { stats, loading, error };
}

/**
 * Get stats for a specific skill
 */
export function useSkillStats(skillId: string) {
  const { stats, loading, error } = usePlausibleStats();
  const skillStats = stats.get(skillId);

  return {
    views: skillStats?.views ?? 0,
    lastUpdated: skillStats?.lastUpdated ?? new Date().toISOString(),
    loading,
    error,
  };
}

