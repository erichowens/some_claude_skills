import React from 'react';
import Link from '@docusaurus/Link';
import { Phase } from '@site/src/types/artifact';
import styles from './styles.module.css';

interface PhaseTimelineProps {
  phases: Phase[];
}

export default function PhaseTimeline({ phases }: PhaseTimelineProps): JSX.Element {
  return (
    <div className={styles.timeline}>
      {phases.map((phase, index) => (
        <div key={index} className={styles.phaseContainer}>
          <div className={styles.phase}>
            <div className={styles.phaseHeader}>
              <div className={styles.phaseNumber}>
                <span className={styles.number}>{index + 1}</span>
              </div>
              <div className={styles.phaseInfo}>
                <h3 className={styles.phaseName}>{phase.name}</h3>
                {phase.duration && (
                  <span className={styles.phaseDuration}>{phase.duration}</span>
                )}
              </div>
            </div>

            <div className={styles.phaseContent}>
              {phase.skills && phase.skills.length > 0 && (
                <div className={styles.skillsInvolved}>
                  <div className={styles.skillsLabel}>Skills Involved:</div>
                  <div className={styles.skillsList}>
                    {phase.skills.map((skillName, skillIndex) => {
                      // Most skill doc files use underscores, but some use dashes in their ID
                      const skillPath = skillName === 'site-reliability-engineer'
                        ? skillName  // Keep dashes for site-reliability-engineer (matches doc ID)
                        : skillName.replace(/-/g, '_');  // Convert to underscores for others
                      return (
                        <Link
                          key={skillIndex}
                          to={`/docs/skills/${skillPath}`}
                          className={styles.skillBadge}
                        >
                          {skillName}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={styles.phaseOutcome}>
                <div className={styles.outcomeLabel}>Outcome:</div>
                <p className={styles.outcomeText}>{phase.outcome}</p>
              </div>
            </div>
          </div>

          {index < phases.length - 1 && (
            <div className={styles.connector}>
              <div className={styles.connectorLine} />
              <div className={styles.connectorArrow}>↓</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
