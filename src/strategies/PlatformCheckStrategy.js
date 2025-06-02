/**
 * Platform Check Strategy - Base class/interface for platform checking strategies.
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';

const logger = new Logger({ level: 'info' });

export class PlatformCheckStrategy {
  constructor() {
    if (this.constructor === PlatformCheckStrategy) {
      throw new Error("Abstract classes can't be instantiated.");
    }
  }

  /**
   * Check if a username exists on a given platform.
   * @param {object} platform - The platform definition object.
   * @param {string} username - The username (or variation) to check.
   * @param {object} [options={}] - Additional options (e.g., proxy, userAgent).
   * @returns {Promise<object>} - A result object containing { found: boolean, url: string, confidence: number, error?: string, ...otherData }.
   */
  async check(platform, username, options = {}) {
    // This method must be overridden by subclasses
    logger.error('PlatformCheckStrategy: check() method not implemented in subclass.', { platform: platform.name, username });
    throw new Error('Method \'check()\' must be implemented.');
  }

  /**
   * Helper function to make fetch requests, potentially with proxy/UA rotation.
   * This can be expanded later based on ProxyManager/UserAgentRotator implementation.
   * @param {string} url - The URL to fetch.
   * @param {object} [fetchOptions={}] - Standard fetch options (method, headers, etc.).
   * @param {object} [strategyOptions={}] - Options from the check method (proxy, userAgent).
   * @returns {Promise<Response>} - The fetch Response object.
   */
  async _fetch(url, fetchOptions = {}, strategyOptions = {}) {
    // TODO: Integrate ProxyManager and UserAgentRotator here when implemented.
    const headers = {
      ...(strategyOptions.userAgent ? { 'User-Agent': strategyOptions.userAgent } : {}),
      ...(fetchOptions.headers || {}),
    };

    // Basic timeout implementation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), strategyOptions.timeout || 15000); // Default 15s timeout

    try {
        logger.debug(`Fetching URL: ${url}`, { method: fetchOptions.method || 'GET' });
        const response = await fetch(url, {
            ...fetchOptions,
            headers,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            logger.warn(`Fetch timed out for URL: ${url}`);
            throw new Error(`Request timed out after ${strategyOptions.timeout || 15000}ms`);
        } else {
            logger.error(`Fetch error for URL: ${url}`, error);
            throw error; // Re-throw other errors
        }
    }
  }
}

