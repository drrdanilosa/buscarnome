/**
 * Logger - Structured logging utility
 * @version 4.0.0
 */
export class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info'; // Default level
    this.enableConsole = options.console !== false;
    // File logging is not practical in browser extensions, focus on console and potentially storage
    this.enableStorage = !!options.storageKey; 
    this.storageKey = options.storageKey;
    this.storageLimit = options.storageLimit || 100; // Max log entries in storage

    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    console.log(`Logger initialized with level: ${this.level}`);
  }

  _log(level, message, data = {}) {
    if (this.levels[level] < this.levels[this.level]) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };

    // Log to console
    if (this.enableConsole) {
      const consoleMethod = level === 'error' ? 'error' :
                           level === 'warn' ? 'warn' :
                           level === 'debug' ? 'debug' : 'info'; // Use info for debug too

      if (Object.keys(data).length > 0) {
          console[consoleMethod](`[${timestamp}] [${level.toUpperCase()}] ${message}`, data);
      } else {
          console[consoleMethod](`[${timestamp}] [${level.toUpperCase()}] ${message}`);
      }
    }

    // Log to browser storage (optional)
    if (this.enableStorage) {
      this._appendToStorage(logEntry);
    }

    return logEntry;
  }

  async _appendToStorage(logEntry) {
    try {
      const result = await browser.storage.local.get(this.storageKey);
      let logs = result[this.storageKey] || [];
      logs.push(logEntry);
      // Limit the number of stored logs
      if (logs.length > this.storageLimit) {
        logs = logs.slice(logs.length - this.storageLimit);
      }
      await browser.storage.local.set({ [this.storageKey]: logs });
    } catch (error) {
      console.error('Logger: Failed to write to storage:', error);
    }
  }

  debug(message, data) {
    return this._log('debug', message, data);
  }

  info(message, data) {
    return this._log('info', message, data);
  }

  warn(message, data) {
    return this._log('warn', message, data);
  }

  error(message, error, data = {}) {
      const errorData = {
          ...(error instanceof Error ? { error_message: error.message, stack: error.stack } : { error_details: error }),
          ...data
      };
      return this._log('error', message, errorData);
  }
}

