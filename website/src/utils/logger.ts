/**
 * Centralized logger utility
 *
 * Provides namespaced logging with different levels (debug, info, warn, error).
 * In production, only warn and error are logged.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '#888',
  info: '#0066cc',
  warn: '#ff9900',
  error: '#cc0000',
};

const LEVEL_EMOJIS: Record<LogLevel, string> = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
};

// Get minimum log level from environment
const getMinLogLevel = (): LogLevel => {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return 'warn';
  }
  return 'debug';
};

const MIN_LEVEL = LOG_LEVELS[getMinLogLevel()];

/**
 * Create a namespaced logger
 *
 * @param namespace - Logger namespace (e.g., 'OnboardingModal')
 * @returns Logger instance with debug/info/warn/error methods
 *
 * @example
 * ```typescript
 * const log = createLogger('ComponentName');
 * log.debug('Detailed info for dev');
 * log.info('User action occurred');
 * log.warn('Recoverable issue');
 * log.error('Unrecoverable failure');
 * ```
 */
export const createLogger = (namespace: string): Logger => {
  const shouldLog = (level: LogLevel): boolean => {
    return LOG_LEVELS[level] >= MIN_LEVEL;
  };

  const log = (level: LogLevel, message: string, ...args: unknown[]): void => {
    if (!shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const color = LEVEL_COLORS[level];
    const emoji = LEVEL_EMOJIS[level];
    const prefix = `[${timestamp}] ${emoji} [${namespace}]`;

    const consoleMethod = level === 'debug' ? 'log' : level;

    // Use styled console output
    console[consoleMethod](
      `%c${prefix}%c ${message}`,
      `color: ${color}; font-weight: bold;`,
      'color: inherit;',
      ...args
    );
  };

  return {
    debug: (message: string, ...args: unknown[]) => log('debug', message, ...args),
    info: (message: string, ...args: unknown[]) => log('info', message, ...args),
    warn: (message: string, ...args: unknown[]) => log('warn', message, ...args),
    error: (message: string, ...args: unknown[]) => log('error', message, ...args),
  };
};
