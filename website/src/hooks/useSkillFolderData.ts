/**
 * Hook to dynamically load skill folder data for the Win31FileManager
 */

import { useState, useEffect } from 'react';
import { FileNode, skillFolderIndex } from '../data/skillFolders';

interface UseSkillFolderDataResult {
  folderData: FileNode | null;
  loading: boolean;
  error: string | null;
  hasContent: boolean;
  fileCount: number;
  folderCount: number;
}

/**
 * Check if a skill has content beyond just SKILL.md
 */
export function skillHasContent(skillId: string): boolean {
  const info = skillFolderIndex[skillId];
  return info?.hasContent ?? false;
}

/**
 * Get skill folder metadata
 */
export function getSkillFolderMeta(skillId: string): { hasContent: boolean; fileCount: number; folderCount: number } | null {
  return skillFolderIndex[skillId] ?? null;
}

/**
 * Hook to load skill folder data
 */
export function useSkillFolderData(skillId: string): UseSkillFolderDataResult {
  const [folderData, setFolderData] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const meta = getSkillFolderMeta(skillId);
  const hasContent = meta?.hasContent ?? false;

  useEffect(() => {
    // Reset state when skillId changes
    setFolderData(null);
    setLoading(true);
    setError(null);

    // If skill doesn't have content, skip loading
    if (!hasContent) {
      setLoading(false);
      return;
    }

    // Dynamically import the skill folder data
    const loadData = async () => {
      try {
        // Use dynamic import to load the JSON file
        const data = await import(`../data/skillFolders/${skillId}.json`);
        setFolderData(data.default || data);
        setError(null);
      } catch (err) {
        console.error(`Error loading skill folder data for ${skillId}:`, err);
        setError(`Could not load folder data for ${skillId}`);
        setFolderData(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [skillId, hasContent]);

  return {
    folderData,
    loading,
    error,
    hasContent,
    fileCount: meta?.fileCount ?? 0,
    folderCount: meta?.folderCount ?? 0,
  };
}

export default useSkillFolderData;
