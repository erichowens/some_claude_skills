import React, { useState, useMemo } from 'react';
import { diffLines, Change } from 'diff';
import styles from './styles.module.css';

interface BeforeAfterComparisonProps {
  beforeContent: string;
  afterContent: string;
  beforeLabel?: string;
  afterLabel?: string;
  language?: string;
  fileName?: string;
}

type ViewMode = 'diff' | 'split';

export default function BeforeAfterComparison({
  beforeContent,
  afterContent,
  beforeLabel = 'Before',
  afterLabel = 'After',
  language = 'markdown',
  fileName
}: BeforeAfterComparisonProps): JSX.Element {
  const [viewMode, setViewMode] = useState<ViewMode>('diff');

  // Compute diff with context
  const diffResult = useMemo(() => {
    return diffLines(beforeContent, afterContent);
  }, [beforeContent, afterContent]);

  // Count additions and deletions
  const stats = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    diffResult.forEach((part: Change) => {
      const lines = part.value.split('\n').filter(line => line !== '');
      if (part.added) additions += lines.length;
      if (part.removed) deletions += lines.length;
    });
    return { additions, deletions };
  }, [diffResult]);

  return (
    <div className={styles.comparison}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.badge}>
            <span className={styles.addIcon}>+{stats.additions}</span>
            <span className={styles.removeIcon}>−{stats.deletions}</span>
          </span>
        </div>
        <div className={styles.viewModeToggle}>
          <button
            className={`${styles.viewModeButton} ${viewMode === 'diff' ? styles.active : ''}`}
            onClick={() => setViewMode('diff')}
          >
            Diff View
          </button>
          <button
            className={`${styles.viewModeButton} ${viewMode === 'split' ? styles.active : ''}`}
            onClick={() => setViewMode('split')}
          >
            Full Files
          </button>
        </div>
      </div>

      {viewMode === 'diff' ? (
        <div className={styles.diffView}>
          {diffResult.map((part: Change, index: number) => {
            const lines = part.value.split('\n').filter(line => line !== '');
            if (lines.length === 0) return null;

            return (
              <div key={index}>
                {lines.map((line, lineIndex) => {
                  let className = styles.contextLine;
                  let prefix = ' ';

                  if (part.added) {
                    className = styles.addedLine;
                    prefix = '+';
                  } else if (part.removed) {
                    className = styles.removedLine;
                    prefix = '−';
                  }

                  return (
                    <div key={`${index}-${lineIndex}`} className={className}>
                      <span className={styles.linePrefix}>{prefix}</span>
                      <span className={styles.lineContent}>{line}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.splitView}>
          <div className={styles.pane}>
            <div className={styles.paneHeader}>
              <span className={styles.paneLabel}>
                <span className={styles.beforeIcon}>−</span>
                {beforeLabel}
              </span>
              <span className={styles.lineCount}>
                {beforeContent.split('\n').length} lines
              </span>
            </div>
            <div className={styles.codeContainer}>
              <pre className={styles.codeBlock}>
                {beforeContent.split('\n').map((line, i) => (
                  <div key={i} className={styles.codeLine}>
                    <span className={styles.lineNumber}>{i + 1}</span>
                    <span className={styles.lineText}>{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>

          <div className={styles.pane}>
            <div className={styles.paneHeader}>
              <span className={styles.paneLabel}>
                <span className={styles.afterIcon}>+</span>
                {afterLabel}
              </span>
              <span className={styles.lineCount}>
                {afterContent.split('\n').length} lines
              </span>
            </div>
            <div className={styles.codeContainer}>
              <pre className={styles.codeBlock}>
                {afterContent.split('\n').map((line, i) => (
                  <div key={i} className={styles.codeLine}>
                    <span className={styles.lineNumber}>{i + 1}</span>
                    <span className={styles.lineText}>{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
