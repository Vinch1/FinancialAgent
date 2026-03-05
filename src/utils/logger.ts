/**
 * Logger utility - writes to console and file
 */

import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'api.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ANSI color codes for console
const colors = {
  reset: '\x1b[0m',
  info: '\x1b[36m',   // cyan
  debug: '\x1b[35m',  // magenta
  error: '\x1b[31m',  // red
};

type LogLevel = 'info' | 'debug' | 'error';

function formatTimestamp(): string {
  return new Date().toISOString();
}

function writeToFile(message: string): void {
  fs.appendFileSync(LOG_FILE, message + '\n');
}

function log(level: LogLevel, context: string, message: string, data?: object): void {
  const timestamp = formatTimestamp();
  const levelUpper = level.toUpperCase();
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';

  // File format (no colors)
  const fileMessage = `${timestamp} [${levelUpper}] [${context}] ${message}${dataStr}`;
  writeToFile(fileMessage);

  // Console format (with colors)
  const consoleMessage = `${colors[level]}${timestamp} [${levelUpper}] [${context}]${colors.reset} ${message}${dataStr}`;
  console.log(consoleMessage);
}

export const logger = {
  info: (context: string, message: string, data?: object) => log('info', context, message, data),
  debug: (context: string, message: string, data?: object) => log('debug', context, message, data),
  error: (context: string, message: string, error?: Error | unknown) => {
    const data = error instanceof Error
      ? { error: error.message, stack: error.stack }
      : { error: String(error) };
    log('error', context, message, data);
  },
};
