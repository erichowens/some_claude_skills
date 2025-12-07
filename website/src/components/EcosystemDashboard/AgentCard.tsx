import React from 'react';
import styles from './styles.module.css';

interface Agent {
  name: string;
  role: string;
  description: string;
  tools: string[];
  coordinates_with: string[];
}

interface AgentCardProps {
  agent: Agent;
  onClick: () => void;
  isSelected: boolean;
}

export default function AgentCard({ agent, onClick, isSelected }: AgentCardProps): JSX.Element {
  return (
    <div
      className={`${styles.agentCard} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
    >
      <div className={styles.agentIcon}>
        {agent.name.charAt(0).toUpperCase()}
      </div>

      <div className={styles.agentContent}>
        <h3 className={styles.agentName}>{agent.name}</h3>
        <div className={styles.agentRole}>{agent.role}</div>

        <p className={styles.agentDescription}>
          {agent.description.slice(0, 150)}...
        </p>

        <div className={styles.agentMeta}>
          <span className={styles.metaBadge}>
            {agent.tools.length} tools
          </span>
          <span className={styles.metaBadge}>
            {agent.coordinates_with.length} connections
          </span>
        </div>
      </div>
    </div>
  );
}
