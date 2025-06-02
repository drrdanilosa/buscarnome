/**
 * Platform Checker - Manages checking usernames across platforms.
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';
import { PlatformCheckStrategyFactory } from '../strategies/PlatformCheckStrategyFactory.js';

const logger = new Logger({ level: 'info' });

export class PlatformChecker {
  constructor(storageService, eventBus) {
    this.storageService = storageService;
    this.eventBus = eventBus;
    this.strategyFactory = new PlatformCheckStrategyFactory();
    logger.info('PlatformChecker initialized');
  }

  /**
   * Check a username variation on a specific platform.
   * @param {object} platform - The platform definition object.
   * @param {string} variation - The username variation to check.
   * @param {string} originalUsername - The original username (for reference).
   * @param {object} [options={}] - Additional options (proxy, userAgent, etc.).
   * @returns {Promise<object>} - Result object with platform, variation, and check results.
   */
  async checkPlatform(platform, variation, originalUsername, options = {}) {
    logger.debug(`Checking ${variation} on ${platform.name}`, { originalUsername });
    
    // Try to get from cache first
    const cacheKey = `check_${platform.name}_${variation}`;
    const cachedResult = await this.storageService.getCachedResult(cacheKey);
    if (cachedResult) {
      logger.debug(`Using cached result for ${variation} on ${platform.name}`);
      return {
        ...cachedResult,
        fromCache: true,
        platform: platform,
        variationUsed: variation,
        originalUsername: originalUsername
      };
    }

    // Get the appropriate strategy for this platform
    const strategy = this.strategyFactory.getStrategy(platform);
    
    // Perform the check
    try {
      const result = await strategy.check(platform, variation, options);
      
      // Add additional information to the result
      const enhancedResult = {
        ...result,
        platform: platform,
        variationUsed: variation,
        originalUsername: originalUsername,
        category: platform.category,
        fromCache: false,
        timestamp: Date.now()
      };
      
      // Calculate confidence based on strategy result and additional factors
      enhancedResult.confidence = this._calculateConfidence(enhancedResult);
      
      // Cache the result (excluding platform object to avoid circular references)
      const cacheResult = { ...enhancedResult };
      delete cacheResult.platform; // Remove circular reference
      
      // Cache for different durations based on result
      const cacheTTL = enhancedResult.found ? 
        (24 * 60 * 60 * 1000) : // 24 hours for found results
        (7 * 24 * 60 * 60 * 1000); // 7 days for not found results
      
      await this.storageService.cacheResult(cacheKey, cacheResult, cacheTTL);
      
      // Emit event for result
      this.eventBus.emit('platformCheck:result', enhancedResult);
      
      return enhancedResult;
    } catch (error) {
      logger.error(`Error checking ${variation} on ${platform.name}`, error);
      
      const errorResult = {
        found: false,
        url: platform.url.replace('{username}', encodeURIComponent(variation)),
        confidence: 0,
        error: error.message || 'Unknown error',
        platform: platform,
        variationUsed: variation,
        originalUsername: originalUsername,
        category: platform.category,
        fromCache: false,
        timestamp: Date.now()
      };
      
      // Emit error event
      this.eventBus.emit('platformCheck:error', errorResult);
      
      return errorResult;
    }
  }

  /**
   * Calculate confidence score based on multiple factors.
   * @param {object} result - The check result.
   * @returns {number} - Confidence score (0-100).
   */
  _calculateConfidence(result) {
    // Start with the base confidence from the strategy
    let confidence = result.confidence || 0;
    
    // Adjust based on additional factors
    
    // 1. Exact username match bonus
    if (result.variationUsed === result.originalUsername) {
      confidence = Math.min(100, confidence + 10);
    }
    
    // 2. Platform category risk adjustment
    if (result.platform.risk === 'high' && result.found) {
      confidence = Math.min(100, confidence + 5);
    }
    
    // 3. Content match quality (if available)
    if (result.matchedPatterns && result.matchedPatterns.length > 0) {
      // More matches = higher confidence
      confidence = Math.min(100, confidence + Math.min(result.matchedPatterns.length * 2, 10));
    }
    
    // 4. Penalty for errors or ambiguous results
    if (result.error) {
      confidence = Math.max(0, confidence - 20);
    }
    
    return Math.round(confidence);
  }
}
