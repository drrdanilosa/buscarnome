/**
 * Background Script - Main background script for the extension
 * @version 4.0.0 (Manifest V2 Compatible)
 */

// Polyfill para compatibilidade entre Chrome e Firefox
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Logger simples
class SimpleLogger {
  constructor(level = 'info') {
    this.level = level;
    this.levels = { error: 0, warn: 1, info: 2, debug: 3 };
  }
  
  log(level, message, ...args) {
    if (this.levels[level] <= this.levels[this.level]) {
      console[level](`[DeepAlias] ${message}`, ...args);
    }
  }
  
  error(message, ...args) { this.log('error', message, ...args); }
  warn(message, ...args) { this.log('warn', message, ...args); }
  info(message, ...args) { this.log('info', message, ...args); }
  debug(message, ...args) { this.log('debug', message, ...args); }
}

const logger = new SimpleLogger('info');

// Storage service simples
class SimpleStorageService {
  async get(key, defaultValue = null) {
    return new Promise((resolve) => {
      browserAPI.storage.local.get([key], (result) => {
        if (browserAPI.runtime.lastError) {
          logger.error('Storage get error:', browserAPI.runtime.lastError);
          resolve(defaultValue);
        } else {
          resolve(result[key] !== undefined ? result[key] : defaultValue);
        }
      });
    });
  }
  
  async set(data) {
    return new Promise((resolve, reject) => {
      browserAPI.storage.local.set(data, () => {
        if (browserAPI.runtime.lastError) {
          logger.error('Storage set error:', browserAPI.runtime.lastError);
          reject(new Error(browserAPI.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }
  
  async clearExpiredCache() {
    // Implementação simples de limpeza de cache
    logger.debug('Cache cleanup triggered');
  }
}

// Instância global do storage service
const storageService = new SimpleStorageService();

/**
 * Initialize the extension
 */
async function initialize() {
  logger.info('Initializing DeepAlias Hunter Pro (Enhanced)...');
  
  try {
    // Register message listeners
    browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
      handleMessage(message, sender)
        .then(response => sendResponse(response))
        .catch(error => {
          logger.error('Message handler error', error);
          sendResponse({ success: false, error: error.message || 'Unknown error' });
        });
      return true; // Indica que a resposta será enviada de forma assíncrona
    });
    
    // Set up alarm for cache cleanup
    browserAPI.alarms.create('cacheCleanup', { periodInMinutes: 60 });
    browserAPI.alarms.onAlarm.addListener(handleAlarm);
    
    logger.info('DeepAlias Hunter Pro (Enhanced) initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize extension', error);
  }
}

/**
 * Handle messages from content scripts and popup
 * @param {object} message - Message object
 * @param {object} sender - Sender information
 * @returns {Promise<any>} - Response
 */
async function handleMessage(message, sender) {
  logger.debug('Received message', { type: message.type, sender: sender.id });
  
  try {
    switch (message.type) {
      case 'search':
        return handleSearch(message.data);
      
      case 'getStatus':
        return handleGetStatus(message.data);
      
      case 'cancelSearch':
        return handleCancelSearch(message.data);
      
      case 'getSettings':
        return handleGetSettings();
      
      case 'saveSettings':
        return handleSaveSettings(message.data);
      
      case 'content:loaded':
        return handleContentLoaded(message.data, sender);
      
      case 'content:pageData':
        return handleContentPageData(message.data, sender);
      
      case 'testTorConnection':
        return handleTestTorConnection(message.data);
      
      case 'testApiKey':
        return handleTestApiKey(message.data);
      
      default:
        logger.warn('Unknown message type', { type: message.type });
        return { success: false, error: 'Unknown message type' };
    }
  } catch (error) {
    logger.error('Error handling message', error, { type: message.type });
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Handle content:loaded message from content script
 */
async function handleContentLoaded(data, sender) {
  logger.debug('Content script loaded', { 
    url: data.url, 
    tabId: sender.tab ? sender.tab.id : 'unknown' 
  });
  
  try {
    const tabId = sender.tab ? sender.tab.id : null;
    if (tabId) {
      const activeContentScripts = await storageService.get('activeContentScripts', {});
      
      activeContentScripts[tabId] = {
        url: data.url,
        title: data.title,
        timestamp: Date.now()
      };
      
      await storageService.set({ 'activeContentScripts': activeContentScripts });
    }
    
    return { success: true };
  } catch (error) {
    logger.error('Error handling content:loaded', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle content:pageData message from content script
 */
async function handleContentPageData(data, sender) {
  logger.debug('Received page data from content script', { 
    url: data.url,
    tabId: sender.tab ? sender.tab.id : 'unknown',
    imageCount: data.imageUrls ? data.imageUrls.length : 0,
    usernameCount: data.detectedUsernames ? data.detectedUsernames.length : 0
  });
  
  try {
    const tabId = sender.tab ? sender.tab.id : null;
    
    if (tabId && data.detectedUsernames && data.detectedUsernames.length > 0) {
      const detectedUsernames = await storageService.get('detectedUsernames', {});
      
      detectedUsernames[data.url] = {
        usernames: data.detectedUsernames,
        timestamp: Date.now()
      };
      
      await storageService.set({ 'detectedUsernames': detectedUsernames });
    }
    
    return { success: true };
  } catch (error) {
    logger.error('Error handling content:pageData', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle test Tor connection request
 */
async function handleTestTorConnection(data) {
  logger.info('Testing Tor connection', { proxy: data.torProxyUrl });
  
  try {
    // Simulação de teste de conexão Tor
    // Em uma implementação real, isso faria uma verificação de conectividade
    const isValidProxy = data.torProxyUrl && data.torProxyUrl.includes('127.0.0.1');
    
    return {
      success: true,
      status: isValidProxy ? 'connected' : 'disconnected'
    };
  } catch (error) {
    logger.error('Tor connection test error', error);
    return {
      success: false,
      error: error.message || 'Failed to test Tor connection'
    };
  }
}

/**
 * Handle test API key request
 */
async function handleTestApiKey(data) {
  logger.info('Testing API key', { service: data.service });
  
  try {
    // Simulação de teste de API key
    // Em uma implementação real, isso faria uma verificação com a API
    const isValid = data.apiKey && data.apiKey.length > 10;
    
    return {
      success: true,
      isValid
    };
  } catch (error) {
    logger.error('API key test error', error);
    return {
      success: false,
      error: error.message || 'Failed to test API key'
    };
  }
}

/**
 * Handle search request
 */
async function handleSearch(data) {
  logger.info('Handling search request', { username: data.username });
  
  try {
    // Simulação de busca
    // Em uma implementação real, isso integraria com o SearchEngine
    const searchId = 'search_' + Date.now();
    
    // Simular alguns resultados
    const results = {
      searchId: searchId,
      username: data.username,
      results: [
        {
          platform: 'Example Platform',
          url: `https://example.com/user/${data.username}`,
          confidence: 0.8,
          status: 'found'
        }
      ],
      status: 'completed',
      timestamp: Date.now()
    };
    
    return {
      success: true,
      searchId: searchId,
      results
    };
  } catch (error) {
    logger.error('Search error', error);
    return {
      success: false,
      error: error.message || 'Search failed'
    };
  }
}

/**
 * Handle get status request
 */
async function handleGetStatus(data) {
  logger.debug('Handling get status request', { searchId: data.searchId });
  
  try {
    // Simulação de status
    const status = {
      searchId: data.searchId,
      status: 'completed',
      progress: 100,
      resultsCount: 1
    };
    
    return {
      success: true,
      status
    };
  } catch (error) {
    logger.error('Get status error', error);
    return {
      success: false,
      error: error.message || 'Failed to get status'
    };
  }
}

/**
 * Handle cancel search request
 */
async function handleCancelSearch(data) {
  logger.info('Handling cancel search request', { searchId: data.searchId });
  
  try {
    return {
      success: true,
      cancelled: true
    };
  } catch (error) {
    logger.error('Cancel search error', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel search'
    };
  }
}

/**
 * Handle get settings request
 */
async function handleGetSettings() {
  logger.debug('Handling get settings request');
  
  try {
    const defaultSettings = {
      maxConcurrentRequests: 5,
      cacheTTL: 24 * 60 * 60 * 1000,
      logLevel: 'info',
      includeAdult: true,
      includeTor: false,
      maxVariationsPerPlatform: 3,
      priorityCategories: ['adult', 'social', 'forum'],
      proxyEnabled: false,
      proxyList: [],
      userAgentRotation: true,
      torEnabled: false,
      torProxyUrl: 'socks5://127.0.0.1:9050',
      imageAnalysisEnabled: false,
      imageApiProvider: 'none',
      imageApiKey: '',
      imageApiEndpoint: '',
      osintEnabled: false,
      osintApiKeys: {
        haveibeenpwned: '',
        dehashed: '',
        intelx: ''
      }
    };
    
    const settings = await storageService.get('settings', defaultSettings);
    
    return {
      success: true,
      settings
    };
  } catch (error) {
    logger.error('Get settings error', error);
    return {
      success: false,
      error: error.message || 'Failed to get settings'
    };
  }
}

/**
 * Handle save settings request
 */
async function handleSaveSettings(data) {
  logger.info('Handling save settings request');
  
  try {
    await storageService.set({ 'settings': data.settings });
    
    return {
      success: true
    };
  } catch (error) {
    logger.error('Save settings error', error);
    return {
      success: false,
      error: error.message || 'Failed to save settings'
    };
  }
}

/**
 * Handle alarms
 */
async function handleAlarm(alarm) {
  logger.debug('Handling alarm', { name: alarm.name });
  
  try {
    if (alarm.name === 'cacheCleanup') {
      await storageService.clearExpiredCache();
    }
  } catch (error) {
    logger.error('Alarm handler error', error, { name: alarm.name });
  }
}

// Initialize the extension
initialize();
