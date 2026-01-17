"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_BADGE_CONFIG = exports.AGENT_STATUS_CONFIG = exports.AGENT_ROLES = void 0;
/**
 * Agent categories for filtering
 */
exports.AGENT_ROLES = [
    'all',
    'Orchestration',
    'Infrastructure',
    'Knowledge',
    'Intelligence',
    'Communication',
    'Visualization',
];
/**
 * Status configuration for display
 */
exports.AGENT_STATUS_CONFIG = {
    active: { label: 'Active', color: '#166534', bg: '#dcfce7', glow: '#22c55e' },
    idle: { label: 'Idle', color: '#6b7280', bg: '#f3f4f6', glow: '#9ca3af' },
    creating: { label: 'Creating...', color: '#7c3aed', bg: '#ede9fe', glow: '#a78bfa' },
};
/**
 * Badge configuration for display
 */
exports.AGENT_BADGE_CONFIG = {
    FOUNDING: { label: 'Founding Council', color: '#92400e', bg: '#fef3c7' },
    NEW: { label: 'New', color: '#166534', bg: '#dcfce7' },
    ACTIVE: { label: 'Active', color: '#1d4ed8', bg: '#dbeafe' },
};
