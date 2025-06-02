/**
 * OSINT Connector - Integrates with external OSINT services
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';
import { EventBus } from '../utils/EventBus.js';

const logger = new Logger({ level: 'info' });

export class OSINTConnector {
  constructor(storageService, eventBus) {
    this.storageService = storageService;
    this.eventBus = eventBus || new EventBus();
    this.enabled = false;
    this.apiKeys = {};
    
    // Available OSINT services
    this.services = {
      'haveibeenpwned': {
        name: 'Have I Been Pwned',
        url: 'https://haveibeenpwned.com/api/v3',
        requiresKey: true,
        endpoints: {
          breachedAccount: '/breachedaccount/{account}',
          breaches: '/breaches',
          breach: '/breach/{name}'
        }
      },
      'dehashed': {
        name: 'DeHashed',
        url: 'https://api.dehashed.com',
        requiresKey: true,
        endpoints: {
          search: '/search?query={query}'
        }
      },
      'intelx': {
        name: 'Intelligence X',
        url: 'https://2.intelx.io',
        requiresKey: true,
        endpoints: {
          search: '/intelligent/search',
          result: '/intelligent/search/result'
        }
      },
      'sherlock': {
        name: 'Sherlock (Local)',
        url: 'local',
        requiresKey: false,
        endpoints: {
          search: '/search/{username}'
        }
      }
    };
    
    logger.info('OSINTConnector initialized');
  }

  /**
   * Initialize the OSINT connector
   * @param {object} options - Configuration options
   */
  async initialize(options = {}) {
    // Set options
    this.enabled = options.enabled || false;
    this.apiKeys = options.apiKeys || {};
    
    // Try to load saved configuration from storage
    try {
      const savedConfig = await this.storageService.get('osint_connector_config');
      if (savedConfig) {
        this.enabled = savedConfig.enabled !== undefined ? savedConfig.enabled : this.enabled;
        this.apiKeys = savedConfig.apiKeys || this.apiKeys;
      }
    } catch (error) {
      logger.error('Failed to load OSINT connector configuration from storage', error);
    }
    
    logger.info(`OSINTConnector initialized with ${Object.keys(this.apiKeys).length} API keys, enabled: ${this.enabled}`);
    
    // Emit initialization event
    this.eventBus.emit('osintConnector:initialized', {
      enabled: this.enabled,
      services: Object.keys(this.services)
    });
    
    return {
      enabled: this.enabled,
      services: Object.keys(this.services)
    };
  }

  /**
   * Enable or disable OSINT integration
   * @param {boolean} enabled - Whether to enable OSINT integration
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    // Save configuration
    this._saveConfig();
    
    logger.info(`OSINT integration ${this.enabled ? 'enabled' : 'disabled'}`);
    
    // Emit event
    this.eventBus.emit('osintConnector:status', { enabled: this.enabled });
    
    return this.enabled;
  }

  /**
   * Set API key for a service
   * @param {string} service - Service name
   * @param {string} apiKey - API key
   */
  setApiKey(service, apiKey) {
    if (!this.services[service]) {
      logger.error(`Unknown OSINT service: ${service}`);
      throw new Error(`Unknown OSINT service: ${service}`);
    }
    
    this.apiKeys[service] = apiKey;
    
    // Save configuration
    this._saveConfig();
    
    logger.info(`Set API key for ${service}`);
    
    // Emit event
    this.eventBus.emit('osintConnector:apiKey', { service });
    
    return true;
  }

  /**
   * Check if a service is available (has API key if required)
   * @param {string} service - Service name
   * @returns {boolean} Whether the service is available
   */
  isServiceAvailable(service) {
    if (!this.services[service]) {
      return false;
    }
    
    if (this.services[service].requiresKey) {
      return !!this.apiKeys[service];
    }
    
    return true;
  }

  /**
   * Search for a username or email in data breach databases
   * @param {string} query - Username or email to search for
   * @returns {Promise<object>} Search results
   */
  async searchDataBreaches(query) {
    if (!this.enabled) {
      logger.warn('OSINT search attempted while disabled', { query: query?.substring(0, 20) + '...' });
      throw new Error('OSINT integration is disabled');
    }
    
    // Validate and sanitize query
    if (!query || typeof query !== 'string' || query.trim() === '') {
      logger.error('Invalid query provided');
      throw new Error('Invalid query provided');
    }
    
    // Sanitize query to prevent injection attacks
    const sanitizedQuery = query.trim().replace(/[<>;"']/g, '').substring(0, 100);
    if (sanitizedQuery !== query.trim()) {
      logger.warn('Query was sanitized', { original: query.substring(0, 20), sanitized: sanitizedQuery.substring(0, 20) });
    }
    
    // Rate limiting check
    const now = Date.now();
    const lastRequest = this.lastRequestTime || 0;
    const timeSinceLastRequest = now - lastRequest;
    const minInterval = 2000; // 2 seconds between requests
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      logger.info(`Rate limiting: waiting ${waitTime}ms before OSINT search`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    
    logger.info(`Searching data breaches for: ${sanitizedQuery.substring(0, 20)}...`);
    
    try {
      // Emit event for search start
      this.eventBus.emit('osintConnector:searching', { query: sanitizedQuery.substring(0, 20) + '...' });
      
      const results = {};
      const searchPromises = [];
      
      // Check Have I Been Pwned with timeout
      if (this.isServiceAvailable('haveibeenpwned')) {
        searchPromises.push(
          Promise.race([
            this._searchHaveIBeenPwned(sanitizedQuery).catch(error => ({ error: error.message })),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Have I Been Pwned timeout')), 15000))
          ]).then(result => ({ service: 'haveibeenpwned', result }))
        );
      }
      
      // Check DeHashed with timeout
      if (this.isServiceAvailable('dehashed')) {
        searchPromises.push(
          Promise.race([
            this._searchDeHashed(sanitizedQuery).catch(error => ({ error: error.message })),
            new Promise((_, reject) => setTimeout(() => reject(new Error('DeHashed timeout')), 15000))
          ]).then(result => ({ service: 'dehashed', result }))
        );
      }
      
      // Check Intelligence X with timeout
      if (this.isServiceAvailable('intelx')) {
        searchPromises.push(
          Promise.race([
            this._searchIntelX(sanitizedQuery).catch(error => ({ error: error.message })),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Intelligence X timeout')), 15000))
          ]).then(result => ({ service: 'intelx', result }))
        );
      }
      
      // Local Sherlock (if available) with timeout
      if (this.isServiceAvailable('sherlock')) {
        searchPromises.push(
          Promise.race([
            this._searchSherlock(sanitizedQuery).catch(error => ({ error: error.message })),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Sherlock timeout')), 10000))
          ]).then(result => ({ service: 'sherlock', result }))
        );
      }
      
      // Execute all searches with overall timeout
      const searchResults = await Promise.allSettled(searchPromises);
      
      // Process results
      searchResults.forEach(({ status, value, reason }) => {
        if (status === 'fulfilled' && value) {
          results[value.service] = value.result;
        } else if (status === 'rejected') {
          logger.error('OSINT search error', reason);
        }
      });
      
      // Combine results
      const combinedResults = {
        query: sanitizedQuery.substring(0, 20) + '...',
        timestamp: Date.now(),
        services: Object.keys(results),
        breachCount: this._countBreaches(results),
        results
      };
      
      // Cache results with expiration
      try {
        const cacheKey = `osint_cache_${btoa(sanitizedQuery).substring(0, 20)}`;
        const cacheData = {
          ...combinedResults,
          cachedAt: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        await this.storageService.set({ [cacheKey]: cacheData });
      } catch (error) {
        logger.warn('Failed to cache OSINT results', error);
      }
      
      // Emit event for search completion
      this.eventBus.emit('osintConnector:searchComplete', { 
        query: sanitizedQuery.substring(0, 20) + '...',
        breachCount: combinedResults.breachCount,
        services: combinedResults.services.length
      });
      
      return combinedResults;
    } catch (error) {
      logger.error('OSINT search failed', error);
      
      // Emit event for search error
      this.eventBus.emit('osintConnector:searchError', { 
        query: sanitizedQuery.substring(0, 20) + '...',
        error: error.message
      });
      
      throw new Error(`OSINT search failed: ${error.message}`);
    }
  }
      const cacheKey = `osint_search_${btoa(query)}`;
      await this.storageService.cacheResult(cacheKey, combinedResults, 24 * 60 * 60 * 1000); // 24 hours
      
      // Emit event for search complete
      this.eventBus.emit('osintConnector:result', { 
        query,
        results: combinedResults
      });
      
      logger.info(`Data breach search complete for: ${query}, found ${combinedResults.breachCount} breaches`);
      
      return combinedResults;
    } catch (error) {
      logger.error(`Data breach search error for: ${query}`, error);
      
      // Emit event for search error
      this.eventBus.emit('osintConnector:error', { 
        query,
        error: error.message || 'Search failed'
      });
      
      throw error;
    }
  }

  /**
   * Search Have I Been Pwned for breaches
   * @param {string} query - Email to search for
   * @returns {Promise<object>} Search results
   */
  async _searchHaveIBeenPwned(query) {
    // This is a simplified implementation. In a real extension,
    // you would use the actual Have I Been Pwned API.
    
    const apiKey = this.apiKeys.haveibeenpwned;
    if (!apiKey) {
      throw new Error('Have I Been Pwned API key not configured');
    }
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demonstration, return simulated results
      return {
        breaches: [
          {
            Name: 'Adobe',
            Title: 'Adobe',
            Domain: 'adobe.com',
            BreachDate: '2013-10-04',
            AddedDate: '2013-12-04',
            ModifiedDate: '2013-12-04',
            PwnCount: 152445165,
            Description: 'In October 2013, 153 million Adobe accounts were breached...',
            DataClasses: ['Email addresses', 'Password hints', 'Passwords', 'Usernames']
          },
          {
            Name: 'LinkedIn',
            Title: 'LinkedIn',
            Domain: 'linkedin.com',
            BreachDate: '2012-05-05',
            AddedDate: '2016-05-21',
            ModifiedDate: '2016-05-21',
            PwnCount: 164611595,
            Description: 'In May 2016, LinkedIn had 164 million email addresses and passwords exposed...',
            DataClasses: ['Email addresses', 'Passwords']
          }
        ],
        count: 2
      };
    } catch (error) {
      logger.error('Have I Been Pwned API error', error);
      throw error;
    }
  }

  /**
   * Search DeHashed for breaches
   * @param {string} query - Query to search for
   * @returns {Promise<object>} Search results
   */
  async _searchDeHashed(query) {
    // This is a simplified implementation. In a real extension,
    // you would use the actual DeHashed API.
    
    const apiKey = this.apiKeys.dehashed;
    if (!apiKey) {
      throw new Error('DeHashed API key not configured');
    }
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demonstration, return simulated results
      return {
        entries: [
          {
            id: '123456',
            email: 'example@example.com',
            username: 'exampleuser',
            password: 'REDACTED',
            hashed_password: 'REDACTED',
            name: 'John Doe',
            database_name: 'ExampleLeak'
          }
        ],
        total: 1
      };
    } catch (error) {
      logger.error('DeHashed API error', error);
      throw error;
    }
  }

  /**
   * Search Intelligence X for breaches
   * @param {string} query - Query to search for
   * @returns {Promise<object>} Search results
   */
  async _searchIntelX(query) {
    // This is a simplified implementation. In a real extension,
    // you would use the actual Intelligence X API.
    
    const apiKey = this.apiKeys.intelx;
    if (!apiKey) {
      throw new Error('Intelligence X API key not configured');
    }
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demonstration, return simulated results
      return {
        records: [
          {
            id: '123456',
            type: 'leak',
            date: '2021-01-01',
            name: 'ExampleLeak',
            description: 'Example leak description'
          }
        ],
        total: 1
      };
    } catch (error) {
      logger.error('Intelligence X API error', error);
      throw error;
    }
  }

  /**
   * Search Sherlock for username presence
   * @param {string} username - Username to search for
   * @returns {Promise<object>} Search results
   */
  async _searchSherlock(username) {
    // This is a simplified implementation. In a real extension,
    // you would use a local Sherlock implementation or API.
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demonstration, return simulated results
      return {
        found: [
          {
            site: 'GitHub',
            url: `https://github.com/${username}`,
            status: 'found'
          },
          {
            site: 'Twitter',
            url: `https://twitter.com/${username}`,
            status: 'found'
          }
        ],
        notFound: [
          {
            site: 'Instagram',
            url: `https://instagram.com/${username}`,
            status: 'not found'
          }
        ],
        total: 3,
        foundCount: 2
      };
    } catch (error) {
      logger.error('Sherlock search error', error);
      throw error;
    }
  }

  /**
   * Count total breaches in results
   * @param {object} results - Search results
   * @returns {number} Total breach count
   */
  _countBreaches(results) {
    let count = 0;
    
    if (results.haveibeenpwned && results.haveibeenpwned.breaches) {
      count += results.haveibeenpwned.breaches.length;
    }
    
    if (results.dehashed && results.dehashed.entries) {
      count += results.dehashed.entries.length;
    }
    
    if (results.intelx && results.intelx.records) {
      count += results.intelx.records.length;
    }
    
    if (results.sherlock && results.sherlock.found) {
      count += results.sherlock.found.length;
    }
    
    return count;
  }

  /**
   * Save configuration to storage
   */
  async _saveConfig() {
    try {
      await this.storageService.set({
        'osint_connector_config': {
          enabled: this.enabled,
          apiKeys: this.apiKeys
        }
      });
    } catch (error) {
      logger.error('Failed to save OSINT connector configuration', error);
    }
  }
}
