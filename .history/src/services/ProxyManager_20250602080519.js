/**
 * Proxy Manager - Manages proxy connections for network requests
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';
import { EventBus } from '../utils/EventBus.js';

const logger = new Logger({ level: 'info' });

export class ProxyManager {
  constructor(storageService, eventBus) {
    this.storageService = storageService;
    this.eventBus = eventBus || new EventBus();
    this.proxies = [];
    this.currentProxyIndex = 0;
    this.enabled = false;
    
    // Bind methods
    this._wrapFetch = this._wrapFetch.bind(this);
    
    logger.info('ProxyManager initialized');
  }

  /**
   * Initialize the proxy manager with a list of proxies
   * @param {Array<object>} proxyList - List of proxy configurations
   * @param {boolean} enabled - Whether to enable proxy rotation
   */
  async initialize(proxyList = [], enabled = false) {
    this.proxies = proxyList;
    this.enabled = enabled && proxyList.length > 0;
    
    // Try to load saved proxies from storage
    try {
      const savedConfig = await this.storageService.get('proxy_config');
      if (savedConfig) {
        this.proxies = savedConfig.proxies || this.proxies;
        this.enabled = savedConfig.enabled !== undefined ? savedConfig.enabled : this.enabled;
      }
    } catch (error) {
      logger.error('Failed to load proxy configuration from storage', error);
    }
    
    logger.info(`ProxyManager initialized with ${this.proxies.length} proxies, enabled: ${this.enabled}`);
    
    // Emit initialization event
    this.eventBus.emit('proxy:initialized', {
      enabled: this.enabled,
      proxyCount: this.proxies.length
    });
    
    return {
      enabled: this.enabled,
      proxyCount: this.proxies.length
    };
  }

  /**
   * Enable or disable proxy rotation
   * @param {boolean} enabled - Whether to enable proxy rotation
   */
  setEnabled(enabled) {
    this.enabled = enabled && this.proxies.length > 0;
    
    // Save configuration
    this._saveConfig();
    
    logger.info(`Proxy rotation ${this.enabled ? 'enabled' : 'disabled'}`);
    
    // Emit event
    this.eventBus.emit('proxy:status', { enabled: this.enabled });
    
    return this.enabled;
  }

  /**
   * Add a new proxy to the list
   * @param {object} proxy - Proxy configuration
   */
  addProxy(proxy) {
    if (!proxy || !proxy.host || !proxy.port) {
      logger.error('Invalid proxy configuration', { proxy });
      throw new Error('Invalid proxy configuration');
    }
    
    this.proxies.push(proxy);
    
    // Save configuration
    this._saveConfig();
    
    logger.info(`Added proxy: ${proxy.host}:${proxy.port}`);
    
    // Emit event
    this.eventBus.emit('proxy:added', { proxy, count: this.proxies.length });
    
    return this.proxies.length;
  }

  /**
   * Remove a proxy from the list
   * @param {number} index - Index of the proxy to remove
   */
  removeProxy(index) {
    if (index < 0 || index >= this.proxies.length) {
      logger.error(`Invalid proxy index: ${index}`);
      throw new Error('Invalid proxy index');
    }
    
    const removed = this.proxies.splice(index, 1)[0];
    
    // Adjust current index if needed
    if (this.currentProxyIndex >= this.proxies.length) {
      this.currentProxyIndex = 0;
    }
    
    // Save configuration
    this._saveConfig();
    
    logger.info(`Removed proxy: ${removed.host}:${removed.port}`);
    
    // Emit event
    this.eventBus.emit('proxy:removed', { proxy: removed, count: this.proxies.length });
    
    return this.proxies.length;
  }

  /**
   * Get the current proxy configuration
   * @returns {object|null} Current proxy or null if disabled/empty
   */
  getCurrentProxy() {
    if (!this.enabled || this.proxies.length === 0) {
      return null;
    }
    
    return this.proxies[this.currentProxyIndex];
  }

  /**
   * Rotate to the next proxy
   * @returns {object|null} New current proxy or null if disabled/empty
   */
  rotateProxy() {
    if (!this.enabled || this.proxies.length === 0) {
      return null;
    }
    
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
    const proxy = this.proxies[this.currentProxyIndex];
    
    logger.debug(`Rotated to proxy: ${proxy.host}:${proxy.port}`);
    
    // Emit event
    this.eventBus.emit('proxy:rotated', { proxy, index: this.currentProxyIndex });
    
    return proxy;
  }

  /**
   * Wrap the fetch API to use proxies
   * Note: This is a simplified implementation as browser extensions
   * have limited proxy capabilities. In a real implementation, this would
   * use the browser.proxy API or similar.
   * 
   * @param {string} url - URL to fetch
   * @param {object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  async _wrapFetch(url, options = {}) {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided to proxy fetch');
    }

    // Sanitize URL to prevent injection attacks
    try {
      new URL(url);
    } catch (error) {
      throw new Error('Malformed URL provided to proxy fetch');
    }

    if (!this.enabled || this.proxies.length === 0) {
      // No proxy, use regular fetch
      return fetch(url, options);
    }
    
    const proxy = this.getCurrentProxy();
    if (!proxy) {
      logger.warn('No proxy available, falling back to direct fetch');
      return fetch(url, options);
    }
    
    // In a real implementation, we would configure the browser's proxy settings
    // or use the browser.proxy API. For now, we'll just log the proxy usage.
    logger.debug(`Using proxy for fetch: ${proxy.host}:${proxy.port}`, { url: url.substring(0, 100) + '...' });
    
    // Add proxy authorization header if credentials are provided
    const headers = { ...options.headers };
    if (proxy.username && proxy.password) {
      // Sanitize credentials
      const username = String(proxy.username).replace(/[^\w.-]/g, '');
      const password = String(proxy.password).replace(/[^\w.-]/g, '');
      const auth = btoa(`${username}:${password}`);
      headers['Proxy-Authorization'] = `Basic ${auth}`;
    }

    // Add timeout to prevent hanging requests
    const timeoutId = setTimeout(() => {
      throw new Error('Proxy request timeout');
    }, 30000);
    
    try {
      // In a real implementation, the proxy would be configured at the browser level
      // For now, we'll just use regular fetch with the additional headers
      const response = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || AbortSignal.timeout(25000) // 25s timeout
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      logger.error(`Fetch error with proxy ${proxy.host}:${proxy.port}`, error, { url: url.substring(0, 100) + '...' });
      
      // Rotate to next proxy on error
      this.rotateProxy();
      
      // Retry with next proxy with exponential backoff
      if (options._proxyRetries === undefined) {
        options._proxyRetries = 0;
      }
      
      if (options._proxyRetries < Math.min(this.proxies.length, 3)) { // Max 3 retries
        options._proxyRetries++;
        const backoffDelay = Math.pow(2, options._proxyRetries) * 1000; // Exponential backoff
        
        logger.debug(`Retrying with next proxy in ${backoffDelay}ms (attempt ${options._proxyRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return this._wrapFetch(url, options);
      }
      
      // All proxies failed, throw error
      throw new Error(`All proxies failed for URL: ${url.substring(0, 100)}... Original error: ${error.message}`);
    }
  }

  /**
   * Save proxy configuration to storage
   */
  async _saveConfig() {
    try {
      await this.storageService.set({
        'proxy_config': {
          proxies: this.proxies,
          enabled: this.enabled
        }
      });
    } catch (error) {
      logger.error('Failed to save proxy configuration', error);
    }
  }
}
