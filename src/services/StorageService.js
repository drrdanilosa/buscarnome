/**
 * Storage Service - Manages extension data using browser.storage.local
 * Includes caching functionality with TTL.
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';

const logger = new Logger({ level: 'info' }); // Or inject logger if DI is implemented

export class StorageService {
  constructor(options = {}) {
    this.cachePrefix = options.cachePrefix || 'cache_';
    this.defaultTTL = options.defaultTTL || (24 * 60 * 60 * 1000); // 24 hours in milliseconds
    logger.info('StorageService initialized');
  }

  /**
   * Get data from local storage.
   * @param {string | string[]} keys - A single key or an array of keys to retrieve.
   * @param {any} [defaultValue=null] - Default value if key is not found (only for single key).
   * @returns {Promise<any>} - The retrieved data.
   */
  async get(keys, defaultValue = null) {
    try {
      const result = await browser.storage.local.get(keys);
      if (typeof keys === 'string') {
        return result[keys] !== undefined ? result[keys] : defaultValue;
      }
      return result;
    } catch (error) {
      logger.error('StorageService: Failed to get data', error, { keys });
      // For multiple keys, returning default is complex, return empty object
      return typeof keys === 'string' ? defaultValue : {};
    }
  }

  /**
   * Set data in local storage.
   * @param {object} data - An object with key-value pairs to store.
   * @returns {Promise<boolean>} - True if successful, false otherwise.
   */
  async set(data) {
    try {
      await browser.storage.local.set(data);
      logger.debug('StorageService: Data set successfully', data);
      return true;
    } catch (error) {
      logger.error('StorageService: Failed to set data', error, { data });
      return false;
    }
  }

  /**
   * Remove data from local storage.
   * @param {string | string[]} keys - A single key or an array of keys to remove.
   * @returns {Promise<boolean>} - True if successful, false otherwise.
   */
  async remove(keys) {
    try {
      await browser.storage.local.remove(keys);
      logger.debug('StorageService: Data removed successfully', { keys });
      return true;
    } catch (error) {
      logger.error('StorageService: Failed to remove data', error, { keys });
      return false;
    }
  }

  /**
   * Clear all data from local storage.
   * @returns {Promise<boolean>} - True if successful, false otherwise.
   */
  async clearAll() {
    try {
      await browser.storage.local.clear();
      logger.info('StorageService: All data cleared');
      return true;
    } catch (error) {
      logger.error('StorageService: Failed to clear all data', error);
      return false;
    }
  }

  // --- Caching Methods ---

  /**
   * Get a cached result if it exists and is not expired.
   * @param {string} cacheKey - The unique key for the cached item.
   * @returns {Promise<any | null>} - The cached data or null if not found/expired.
   */
  async getCachedResult(cacheKey) {
    const storageKey = `${this.cachePrefix}${cacheKey}`;
    try {
      const cachedItem = await this.get(storageKey);
      if (cachedItem && (Date.now() - cachedItem.timestamp < cachedItem.ttl)) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        return cachedItem.result;
      }
      if (cachedItem) {
          logger.debug(`Cache expired for key: ${cacheKey}`);
          await this.remove(storageKey); // Clean up expired entry
      } else {
          logger.debug(`Cache miss for key: ${cacheKey}`);
      }
    } catch (error) {
      logger.error('StorageService: Failed to get cached result', error, { cacheKey });
    }
    return null;
  }

  /**
   * Cache a result with a specific TTL.
   * @param {string} cacheKey - The unique key for the cached item.
   * @param {any} result - The data to cache.
   * @param {number} [ttl=this.defaultTTL] - Time-to-live in milliseconds.
   * @returns {Promise<boolean>} - True if successful, false otherwise.
   */
  async cacheResult(cacheKey, result, ttl = this.defaultTTL) {
    const storageKey = `${this.cachePrefix}${cacheKey}`;
    const cacheItem = {
      result,
      timestamp: Date.now(),
      ttl
    };
    logger.debug(`Caching result for key: ${cacheKey} with TTL: ${ttl}ms`);
    return this.set({ [storageKey]: cacheItem });
  }

  /**
   * Clear expired cache entries.
   * Note: This might be resource-intensive if called frequently with many keys.
   * Consider running this periodically (e.g., using alarms API).
   * @returns {Promise<void>}
   */
  async clearExpiredCache() {
    logger.info('StorageService: Starting expired cache cleanup...');
    try {
      const allData = await browser.storage.local.get(null); // Get all items
      const keysToRemove = [];
      const now = Date.now();

      for (const key in allData) {
        if (key.startsWith(this.cachePrefix)) {
          const cachedItem = allData[key];
          if (cachedItem && cachedItem.timestamp && cachedItem.ttl && (now - cachedItem.timestamp >= cachedItem.ttl)) {
            keysToRemove.push(key);
          }
        }
      }

      if (keysToRemove.length > 0) {
        await this.remove(keysToRemove);
        logger.info(`StorageService: Cleared ${keysToRemove.length} expired cache entries.`);
      } else {
        logger.info('StorageService: No expired cache entries found.');
      }
    } catch (error) {
      logger.error('StorageService: Failed during expired cache cleanup', error);
    }
  }
}

