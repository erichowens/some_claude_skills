import React from 'react';
import styles from './WorkflowTimeline.module.css';

interface Phase {
  phase: number;
  skill: string;
  role: string;
  duration: string;
  outcome: string;
  actions: string[];
  metrics?: {
    filesModified?: number;
    filesCreated?: number;
    linesOfCode?: number;
    issuesFound?: number;
    issuesFixed?: number;
    errorsDetected?: number;
    filesValidated?: number;
  };
}

const phases: Phase[] = [
  {
    phase: 1,
    skill: 'skill-documentarian',
    role: 'Quality Assurance',
    duration: '~15 minutes',
    outcome: 'Reviewed cv-creator skill and found 3 critical issues',
    actions: [
      'Verified SkillHeader component usage',
      'Generated hero image via Ideogram (Windows 3.1/vaporwave, 16:9, 1.0MB)',
      'Created skill ZIP download (8.5KB)',
      'Added cv-creator to skills.ts registry line 65'
    ],
    metrics: {
      filesModified: 3,
      issuesFound: 3,
      issuesFixed: 3
    }
  },
  {
    phase: 2,
    skill: 'skill-coach',
    role: 'Skill Architect',
    duration: '~30 minutes',
    outcome: 'Built site-reliability-engineer skill with shibboleths and anti-patterns',
    actions: [
      'Designed skill with shibboleths encoding expert vs novice knowledge',
      'Created validate-liquid.js (detects unescaped {{ ... }} in MDX)',
      'Created validate-brackets.js (finds unescaped <digit and >digit)',
      'Created validate-skill-props.js (validates SkillHeader props)',
      'Wrote 789-line SKILL.md with decision trees and activation keywords',
      'Documented anti-patterns: full build validation, manual cache clearing'
    ],
    metrics: {
      filesCreated: 4,
      linesOfCode: 789
    }
  },
  {
    phase: 3,
    skill: 'site-reliability-engineer',
    role: 'Validation Guardian',
    duration: '~10 minutes',
    outcome: 'Integrated validation into git hooks and prebuild workflow',
    actions: [
      'Copied validation scripts to website/scripts/',
      'Updated package.json with validation scripts',
      'Created install-git-hooks.js script to generate pre-commit hook',
      'Installed pre-commit hook at .git/hooks/pre-commit',
      'Integrated validate:all into prebuild workflow',
      'Caught and fixed >10MB angle bracket in artifact-contribution-guide.md',
      'Validated all 45 skill documentation files successfully'
    ],
    metrics: {
      errorsDetected: 1,
      filesValidated: 45
    }
  }
];

export default function WorkflowTimeline(): JSX.Element {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleGradient}>Multi-Skill Orchestration</span>
        </h2>
        <p className={styles.subtitle}>
          Three skills working together to build reliable deployments
        </p>
      </div>

      <div className={styles.timeline}>
        {phases.map((phase, index) => (
          <div
            key={phase.phase}
            className={styles.phaseContainer}
          >
            {/* Connecting Line */}
            {index < phases.length - 1 && (
              <div className={styles.connector} />
            )}

            {/* Phase Card - Static, always expanded */}
            <div className={styles.phaseCard}>
              {/* Header */}
              <div className={styles.phaseHeader}>
                <div className={styles.phaseNumber}>
                  <span className={styles.phaseNumberText}>Phase {phase.phase}</span>
                </div>

                <div className={styles.phaseInfo}>
                  <div className={styles.skillName}>{phase.skill}</div>
                  <div className={styles.role}>{phase.role}</div>
                </div>

                <div className={styles.duration}>
                  <span className={styles.durationIcon}>⏱</span>
                  {phase.duration}
                </div>
              </div>

              {/* Outcome Summary */}
              <div className={styles.outcome}>
                <div className={styles.outcomeIcon}>✓</div>
                <div className={styles.outcomeText}>{phase.outcome}</div>
              </div>

              {/* Metrics */}
              {phase.metrics && (
                <div className={styles.metrics}>
                  {Object.entries(phase.metrics).map(([key, value]) => (
                    <div key={key} className={styles.metric}>
                      <div className={styles.metricValue}>{value}</div>
                      <div className={styles.metricLabel}>
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Details - Always shown */}
              <div className={styles.details}>
                <div className={styles.actionsHeader}>Actions Taken:</div>
                <ul className={styles.actionsList}>
                  {phase.actions.map((action, i) => (
                    <li key={i} className={styles.action}>
                      <span className={styles.actionBullet}>▸</span>
                      <span className={styles.actionText}>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryTitle}>Total Impact</div>
          <div className={styles.summaryStats}>
            <div className={styles.summaryStat}>
              <div className={styles.summaryStatValue}>~55 min</div>
              <div className={styles.summaryStatLabel}>Duration</div>
            </div>
            <div className={styles.summaryStat}>
              <div className={styles.summaryStatValue}>3</div>
              <div className={styles.summaryStatLabel}>Skills</div>
            </div>
            <div className={styles.summaryStat}>
              <div className={styles.summaryStatValue}>3</div>
              <div className={styles.summaryStatLabel}>Validators</div>
            </div>
            <div className={styles.summaryStat}>
              <div className={styles.summaryStatValue}>100%</div>
              <div className={styles.summaryStatLabel}>Prevention</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
