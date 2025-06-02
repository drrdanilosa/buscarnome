/**
 * Platform Check Strategy Factory - Creates appropriate check strategies for platforms.
 * @version 4.0.0
 */
import { HttpStatusCheckStrategy } from './HttpStatusCheckStrategy.js';
import { ContentCheckStrategy } from './ContentCheckStrategy.js';
import { Logger } from '../utils/Logger.js';

const logger = new Logger({ level: 'info' });

/**
 * Manual Check Strategy - Strategy for platforms requiring manual verification
 */
class ManualCheckStrategy {
  /**
   * Check if a username exists on a platform
   * @param {string} username - Username to check
   * @param {object} platform - Platform definition
   * @param {object} options - Additional options
   * @returns {Promise<object>} - Check result
   */
  async check(username, platform, options = {}) {
    logger.debug(`Manual check for ${username} on ${platform.name}`);
    
    try {
      const url = this._buildProfileUrl(username, platform);
      
      // For manual check, we use a more robust approach with proper headers and longer timeout
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 30000, // 30 seconds timeout for slow sites
        redirect: 'follow'
      });
      
      // Check if the response is valid
      if (response.ok) {
        // For manual check, we need to analyze the content
        const content = await response.text();
        
        // Check if the content contains error messages or indicators of non-existence
        const errorPatterns = [
          'not found', 'doesn\'t exist', 'no user', 'no profile', 
          'no results', '404', 'error', 'invalid', 'deleted'
        ];
        
        const hasErrorPattern = errorPatterns.some(pattern => 
          content.toLowerCase().includes(pattern)
        );
        
        if (hasErrorPattern) {
          return {
            exists: false,
            url,
            message: 'Profile likely does not exist (error pattern detected)'
          };
        }
        
        // Check for success indicators
        const successPatterns = platform.successPatterns || [
          'profile', 'account', 'user', 'member', 'joined'
        ];
        
        const hasSuccessPattern = successPatterns.some(pattern => 
          content.toLowerCase().includes(pattern)
        );
        
        if (hasSuccessPattern) {
          return {
            exists: true,
            url,
            message: 'Profile likely exists (success pattern detected)',
            content: content.substring(0, 1000) // Store a snippet of content
          };
        }
        
        // If no clear indicators, return uncertain result
        return {
          exists: true, // Assume it exists if the page loads without errors
          confidence: 'medium',
          url,
          message: 'Profile might exist (no clear indicators)'
        };
      } else {
        // Handle different HTTP status codes
        if (response.status === 404) {
          return {
            exists: false,
            url,
            message: 'Profile does not exist (404)'
          };
        } else if (response.status === 403) {
          return {
            exists: true, // Assume it exists if access is forbidden
            confidence: 'medium',
            url,
            message: 'Access forbidden, but profile might exist (403)'
          };
        } else {
          return {
            exists: false,
            url,
            message: `Unexpected status code: ${response.status}`
          };
        }
      }
    } catch (error) {
      logger.warn(`Manual check error for ${username} on ${platform.name}`, error);
      
      // Handle timeout errors specifically
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return {
          exists: false,
          url: this._buildProfileUrl(username, platform),
          message: 'Request timed out, platform may be blocking automated checks'
        };
      }
      
      return {
        exists: false,
        url: this._buildProfileUrl(username, platform),
        message: `Error: ${error.message}`
      };
    }
  }
  
  /**
   * Build profile URL for the platform
   * @param {string} username - Username to check
   * @param {object} platform - Platform definition
   * @returns {string} - Profile URL
   */
  _buildProfileUrl(username, platform) {
    if (!platform.urlFormat) {
      throw new Error(`No URL format defined for platform: ${platform.name}`);
    }
    
    return platform.urlFormat.replace('{username}', encodeURIComponent(username));
  }
}

export class PlatformCheckStrategyFactory {
  constructor() {
    // Initialize strategy instances
    this.strategies = {
      http: new HttpStatusCheckStrategy(),
      content: new ContentCheckStrategy(),
      manual: new ManualCheckStrategy(), // Added manual check strategy
      // Other strategies can be added here (API, etc.)
    };
    
    logger.info('PlatformCheckStrategyFactory initialized');
  }

  /**
   * Get the appropriate strategy for a platform.
   * @param {object} platform - The platform definition object.
   * @returns {PlatformCheckStrategy} - The appropriate strategy instance.
   */
  getStrategy(platform) {
    const checkType = platform.checkType || 'http'; // Default to HTTP check
    
    if (!this.strategies[checkType]) {
      logger.warn(`No strategy found for check type: ${checkType}, falling back to HTTP check`);
      return this.strategies.http;
    }
    
    return this.strategies[checkType];
  }

  /**
   * Register a new strategy.
   * @param {string} name - The name/type of the strategy.
   * @param {PlatformCheckStrategy} strategy - The strategy instance.
   */
  registerStrategy(name, strategy) {
    this.strategies[name] = strategy;
    logger.info(`Registered new strategy: ${name}`);
  }
}
