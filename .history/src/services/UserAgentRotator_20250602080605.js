/**
 * User Agent Rotator - Manages user agent rotation for network requests
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';
import { EventBus } from '../utils/EventBus.js';

const logger = new Logger({ level: 'info' });

export class UserAgentRotator {
  constructor(storageService, eventBus) {
    this.storageService = storageService;
    this.eventBus = eventBus || new EventBus();
    this.userAgents = this._getDefaultUserAgents();
    this.currentIndex = 0;
    this.enabled = false;
    
    logger.info('UserAgentRotator initialized');
  }

  /**
   * Initialize the user agent rotator
   * @param {Array<string>} userAgents - List of user agent strings
   * @param {boolean} enabled - Whether to enable rotation
   */
  async initialize(userAgents = [], enabled = false) {
    // Use provided user agents or defaults
    this.userAgents = userAgents.length > 0 ? userAgents : this.userAgents;
    this.enabled = enabled;
    
    // Try to load saved configuration from storage
    try {
      const savedConfig = await this.storageService.get('useragent_config');
      if (savedConfig) {
        this.userAgents = savedConfig.userAgents || this.userAgents;
        this.enabled = savedConfig.enabled !== undefined ? savedConfig.enabled : this.enabled;
      }
    } catch (error) {
      logger.error('Failed to load user agent configuration from storage', error);
    }
    
    logger.info(`UserAgentRotator initialized with ${this.userAgents.length} user agents, enabled: ${this.enabled}`);
    
    // Emit initialization event
    this.eventBus.emit('useragent:initialized', {
      enabled: this.enabled,
      count: this.userAgents.length
    });
    
    return {
      enabled: this.enabled,
      count: this.userAgents.length
    };
  }

  /**
   * Enable or disable user agent rotation
   * @param {boolean} enabled - Whether to enable rotation
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    // Save configuration
    this._saveConfig();
    
    logger.info(`User agent rotation ${this.enabled ? 'enabled' : 'disabled'}`);
    
    // Emit event
    this.eventBus.emit('useragent:status', { enabled: this.enabled });
    
    return this.enabled;
  }

  /**
   * Add a new user agent to the list
   * @param {string} userAgent - User agent string
   */
  addUserAgent(userAgent) {
    // Comprehensive validation
    if (!userAgent || typeof userAgent !== 'string' || userAgent.trim() === '') {
      logger.error('Invalid user agent string', { userAgent: userAgent?.substring(0, 30) });
      throw new Error('Invalid user agent string');
    }
    
    const trimmed = userAgent.trim();
    
    // Security validation - check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /<.*>/,
      /[\x00-\x1f\x7f-\x9f]/, // Control characters
      /[<>"'&]/ // HTML/XML characters
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(trimmed)) {
        logger.error('User agent contains suspicious content', { userAgent: trimmed.substring(0, 30) });
        throw new Error('User agent contains invalid characters');
      }
    }
    
    // Length validation
    if (trimmed.length < 10 || trimmed.length > 500) {
      logger.error('User agent length invalid', { length: trimmed.length });
      throw new Error('User agent length must be between 10 and 500 characters');
    }
    
    // Check for duplicates
    if (this.userAgents.includes(trimmed)) {
      logger.warn('User agent already exists', { userAgent: trimmed.substring(0, 30) });
      return this.userAgents.length;
    }
    
    // Validate user agent format (basic browser detection)
    const validPatterns = [
      /Mozilla\/\d+\.\d+/,
      /Chrome\/\d+\.\d+/,
      /Firefox\/\d+\.\d+/,
      /Safari\/\d+\.\d+/,
      /Edge\/\d+\.\d+/,
      /Opera\/\d+\.\d+/
    ];
    
    const isValidFormat = validPatterns.some(pattern => pattern.test(trimmed));
    if (!isValidFormat) {
      logger.warn('User agent format may be invalid', { userAgent: trimmed.substring(0, 30) });
    }
    
    this.userAgents.push(trimmed);
    
    // Limit total user agents to prevent memory issues
    const maxUserAgents = 100;
    if (this.userAgents.length > maxUserAgents) {
      this.userAgents = this.userAgents.slice(-maxUserAgents);
      logger.info(`User agent list trimmed to ${maxUserAgents} entries`);
    }
    
    // Save configuration
    this._saveConfig();
    
    logger.info(`Added user agent: ${trimmed.substring(0, 30)}...`);
    
    // Emit event
    this.eventBus.emit('useragent:added', { 
      userAgent: trimmed.substring(0, 50), 
      count: this.userAgents.length 
    });
    
    return this.userAgents.length;
  }

  /**
   * Remove a user agent from the list
   * @param {number} index - Index of the user agent to remove
   */
  removeUserAgent(index) {
    if (index < 0 || index >= this.userAgents.length) {
      logger.error(`Invalid user agent index: ${index}`);
      throw new Error('Invalid user agent index');
    }
    
    const removed = this.userAgents.splice(index, 1)[0];
    
    // Adjust current index if needed
    if (this.currentIndex >= this.userAgents.length) {
      this.currentIndex = 0;
    }
    
    // Save configuration
    this._saveConfig();
    
    logger.info(`Removed user agent: ${removed.substring(0, 30)}...`);
    
    // Emit event
    this.eventBus.emit('useragent:removed', { userAgent: removed, count: this.userAgents.length });
    
    return this.userAgents.length;
  }

  /**
   * Get the current user agent
   * @returns {string|null} Current user agent or null if disabled/empty
   */
  getCurrentUserAgent() {
    if (!this.enabled || this.userAgents.length === 0) {
      return null;
    }
    
    return this.userAgents[this.currentIndex];
  }

  /**
   * Get a random user agent
   * @returns {string|null} Random user agent or null if disabled/empty
   */
  getRandomUserAgent() {
    if (!this.enabled || this.userAgents.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * this.userAgents.length);
    return this.userAgents[randomIndex];
  }

  /**
   * Rotate to the next user agent
   * @returns {string|null} New current user agent or null if disabled/empty
   */
  rotateUserAgent() {
    if (!this.enabled || this.userAgents.length === 0) {
      return null;
    }
    
    this.currentIndex = (this.currentIndex + 1) % this.userAgents.length;
    const userAgent = this.userAgents[this.currentIndex];
    
    logger.debug(`Rotated to user agent: ${userAgent.substring(0, 30)}...`);
    
    // Emit event
    this.eventBus.emit('useragent:rotated', { userAgent, index: this.currentIndex });
    
    return userAgent;
  }

  /**
   * Get default user agents
   * @returns {Array<string>} List of default user agent strings
   */
  _getDefaultUserAgents() {
    return [
      // Chrome - Windows
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36',
      
      // Chrome - Mac
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36',
      
      // Firefox - Windows
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0',
      
      // Firefox - Mac
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:90.0) Gecko/20100101 Firefox/90.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:91.0) Gecko/20100101 Firefox/91.0',
      
      // Safari
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
      
      // Edge
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36 Edg/92.0.902.55',
      
      // Mobile - iOS
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      
      // Mobile - Android
      'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Mobile Safari/537.36'
    ];
  }

  /**
   * Save configuration to storage
   */
  async _saveConfig() {
    try {
      await this.storageService.set({
        'useragent_config': {
          userAgents: this.userAgents,
          enabled: this.enabled
        }
      });
    } catch (error) {
      logger.error('Failed to save user agent configuration', error);
    }
  }
}
