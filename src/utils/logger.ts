/**
 * Simple structured logger for the MCP server
 */
export class Logger {
  private level: 'debug' | 'info' | 'warn' | 'error';
  private levels = { debug: 0, info: 1, warn: 2, error: 3 };

  constructor(level: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.level = level;
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    return this.levels[level] >= this.levels[this.level];
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    // Write to stderr to keep stdout clean for MCP protocol
    console.error(JSON.stringify(logEntry));
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.log('error', message, meta);
  }
}

function resolveLogLevel(level?: string): 'debug' | 'info' | 'warn' | 'error' {
  if (!level) {
    return 'info';
  }

  if (level === 'debug' || level === 'info' || level === 'warn' || level === 'error') {
    return level;
  }

  console.error(`Invalid LOG_LEVEL "${level}". Falling back to "info". Allowed values: debug, info, warn, error`);
  return 'info';
}

// Global logger instance
export const logger = new Logger(
  resolveLogLevel(process.env.LOG_LEVEL)
);
