/**
 * Risk Score Calculator - Calculates risk scores for search results.
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';

const logger = new Logger({ level: 'info' });

export class RiskScoreCalculator {
  constructor(options = {}) {
    // Default weights for different factors
    this.weights = {
      platformRisk: options.platformRiskWeight || 30,
      confidence: options.confidenceWeight || 25,
      contentMatch: options.contentMatchWeight || 20,
      usernameMatch: options.usernameMatchWeight || 15,
      categoryRisk: options.categoryRiskWeight || 10
    };
    
    // Category risk levels
    this.categoryRiskLevels = {
      adult: 1.0,
      cam: 1.0,
      escort: 1.0,
      darkweb: 0.9,
      forum: 0.7,
      images: 0.6,
      linkinbio: 0.5,
      social: 0.4,
      portfolio: 0.3,
      professional: 0.2,
      default: 0.2
    };
    
    logger.info('RiskScoreCalculator initialized');
  }

  /**
   * Calculate risk score for a search result.
   * @param {object} result - The platform check result.
   * @returns {number} - Risk score (0-100).
   */
  calculateRisk(result) {
    // Validate input
    if (!this._isValidResult(result)) {
      logger.warn('Invalid result provided for risk calculation');
      return 0;
    }
    
    if (!result.found) {
      return 0; // No risk if not found
    }
    
    try {
      // Base score components
      let score = 0;
      
      // 1. Platform risk (from platform definition)
      const platformRiskFactor = this._getPlatformRiskFactor(result.platform);
      score += platformRiskFactor * this.weights.platformRisk;
      
      // 2. Confidence of the result
      const confidenceFactor = this._normalizeConfidence(result.confidence) / 100;
      score += confidenceFactor * this.weights.confidence;
      
      // 3. Content match quality (if available)
      const contentMatchFactor = this._getContentMatchFactor(result);
      score += contentMatchFactor * this.weights.contentMatch;
      
      // 4. Username match quality
      const usernameMatchFactor = this._getUsernameMatchFactor(result);
      score += usernameMatchFactor * this.weights.usernameMatch;
      
      // 5. Category risk
      const categoryRiskFactor = this._getCategoryRiskFactor(result.platform);
      score += categoryRiskFactor * this.weights.categoryRisk;
      
      // Normalize to 0-100 range
      score = Math.min(100, Math.max(0, Math.round(score)));
      
      const platformName = this._sanitizePlatformName(result.platform?.name);
      const variationUsed = this._sanitizeUsername(result.variationUsed);
      
      logger.debug(`Calculated risk score ${score} for ${variationUsed} on ${platformName}`, {
        platformRisk: platformRiskFactor,
        confidence: confidenceFactor,
        contentMatch: contentMatchFactor,
        usernameMatch: usernameMatchFactor,
        categoryRisk: categoryRiskFactor
      });
      
      return score;
    } catch (error) {
      logger.error('Error calculating risk score', error);
      return 0;
    }
  }

  /**
   * Get platform risk factor.
   * @param {object} platform - The platform definition.
   * @returns {number} - Risk factor (0-1).
   */
  _getPlatformRiskFactor(platform) {
    if (!platform) return 0.5; // Default if platform info is missing
    
    // Map risk levels to factors
    const riskFactors = {
      high: 1.0,
      medium: 0.6,
      low: 0.3,
      default: 0.5
    };
    
    // Urgent flag overrides risk level
    if (platform.urgent) {
      return 1.0;
    }
    
    return riskFactors[platform.risk] || riskFactors.default;
  }

  /**
   * Get content match quality factor.
   * @param {object} result - The platform check result.
   * @returns {number} - Content match factor (0-1).
   */
  _getContentMatchFactor(result) {
    // If no content analysis was performed
    if (!result.matchedPatterns) {
      return 0.5; // Neutral
    }
    
    // More matches = higher factor
    const matchCount = result.matchedPatterns.length;
    return Math.min(1.0, 0.3 + (matchCount * 0.1));
  }

  /**
   * Get username match quality factor.
   * @param {object} result - The platform check result.
   * @returns {number} - Username match factor (0-1).
   */
  _getUsernameMatchFactor(result) {
    // Validate inputs
    if (!result || !result.variationUsed || !result.originalUsername) {
      return 0.5; // Neutral when data is missing
    }
    
    const variation = this._sanitizeUsername(result.variationUsed);
    const original = this._sanitizeUsername(result.originalUsername);
    
    if (!variation || !original) {
      return 0.5;
    }
    
    // Exact match gets highest factor
    if (variation.toLowerCase() === original.toLowerCase()) {
      return 1.0;
    }
    
    try {
      // Simple similarity measure based on length difference
      const lengthDiff = Math.abs(variation.length - original.length);
      const lengthFactor = Math.max(0, 1 - (lengthDiff / Math.max(1, original.length)));
      
      // Check if variation contains original
      const containsOriginal = variation.toLowerCase().includes(original.toLowerCase());
      
      return containsOriginal ? Math.max(0.7, lengthFactor) : lengthFactor * 0.8;
    } catch (error) {
      logger.warn('Error calculating username match factor', error);
      return 0.5;
    }
  }

  /**
   * Get category risk factor.
   * @param {object} platform - The platform definition.
   * @returns {number} - Category risk factor (0-1).
   */
  _getCategoryRiskFactor(platform) {
    if (!platform || !platform.category) {
      return this.categoryRiskLevels.default;
    }
    
    return this.categoryRiskLevels[platform.category] || this.categoryRiskLevels.default;
  }

  /**
   * Validate result object
   * @param {object} result - Result to validate
   * @returns {boolean} Is valid result
   */
  _isValidResult(result) {
    if (!result || typeof result !== 'object') return false;
    
    // Must have basic properties
    if (typeof result.found !== 'boolean') return false;
    
    if (result.found) {
      // When found, must have platform info
      if (!result.platform || typeof result.platform !== 'object') return false;
      if (!result.platform.name || typeof result.platform.name !== 'string') return false;
    }
    
    return true;
  }

  /**
   * Normalize confidence value
   * @param {number} confidence - Confidence value
   * @returns {number} Normalized confidence (0-100)
   */
  _normalizeConfidence(confidence) {
    if (typeof confidence !== 'number' || isNaN(confidence)) return 50;
    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Sanitize platform name for logging
   * @param {string} name - Platform name
   * @returns {string} Sanitized name
   */
  _sanitizePlatformName(name) {
    if (!name || typeof name !== 'string') return '[unknown-platform]';
    return name.replace(/[<>'"&]/g, '_').substring(0, 50);
  }

  /**
   * Sanitize username for logging
   * @param {string} username - Username
   * @returns {string} Sanitized username
   */
  _sanitizeUsername(username) {
    if (!username || typeof username !== 'string') return '[unknown-username]';
    return username.replace(/[<>'"&]/g, '_').substring(0, 50);
  }
}
