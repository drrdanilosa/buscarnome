/**
 * Background Script - Main background script for the extension
 * @version 4.0.0
 */
import container from '../utils/DependencyContainer.js';
import { Logger } from '../utils/Logger.js';

const logger = new Logger({ level: 'info' });

// Polyfill para compatibilidade entre Chrome e Firefox
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

/**
 * Initialize the extension
 */
async function initialize() {
  logger.info('Initializing DeepAlias Hunter Pro (Enhanced)...');
  
  try {
    // Initialize dependency container
    await container.initialize();
    
    // Get services
    const eventBus = container.get('eventBus');
    const storageService = container.get('storageService');
    
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
    
    // Emit initialization event
    eventBus.emit('extension:initialized', {
      version: browserAPI.runtime.getManifest().version,
      timestamp: Date.now()
    });
    
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
      
      // Adicionado tratamento para mensagens do content script
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
 * @param {object} data - Content data
 * @param {object} sender - Sender information
 * @returns {Promise<object>} - Response
 */
async function handleContentLoaded(data, sender) {
  logger.debug('Content script loaded', { 
    url: data.url, 
    tabId: sender.tab ? sender.tab.id : 'unknown' 
  });
  
  // Registrar que o content script foi carregado para esta aba
  try {
    const tabId = sender.tab ? sender.tab.id : null;
    if (tabId) {
      // Opcionalmente, armazenar informações sobre tabs com content script ativo
      const storageService = container.get('storageService');
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
 * @param {object} data - Page data
 * @param {object} sender - Sender information
 * @returns {Promise<object>} - Response
 */
async function handleContentPageData(data, sender) {
  logger.debug('Received page data from content script', { 
    url: data.url,
    tabId: sender.tab ? sender.tab.id : 'unknown',
    imageCount: data.imageUrls ? data.imageUrls.length : 0,
    usernameCount: data.detectedUsernames ? data.detectedUsernames.length : 0
  });
  
  try {
    // Processar dados da página conforme necessário
    const tabId = sender.tab ? sender.tab.id : null;
    
    if (tabId && data.detectedUsernames && data.detectedUsernames.length > 0) {
      // Armazenar usernames detectados para uso futuro
      const storageService = container.get('storageService');
      const detectedUsernames = await storageService.get('detectedUsernames', {});
      
      detectedUsernames[data.url] = {
        usernames: data.detectedUsernames,
        timestamp: Date.now()
      };
      
      await storageService.set({ 'detectedUsernames': detectedUsernames });
      
      // Opcionalmente, analisar imagens se habilitado
      if (data.imageUrls && data.imageUrls.length > 0) {
        const settings = await storageService.get('settings', {});
        
        if (settings.imageAnalysisEnabled) {
          const imageAnalyzer = container.get('imageAnalyzer');
          // Processar apenas as primeiras 5 imagens para evitar sobrecarga
          const imagesToAnalyze = data.imageUrls.slice(0, 5);
          
          for (const imageUrl of imagesToAnalyze) {
            imageAnalyzer.queueImageForAnalysis(imageUrl, data.url);
          }
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    logger.error('Error handling content:pageData', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle test Tor connection request
 * @param {object} data - Connection parameters
 * @returns {Promise<object>} - Connection status
 */
async function handleTestTorConnection(data) {
  logger.info('Testing Tor connection', { proxy: data.torProxyUrl });
  
  try {
    // Verificar se o serviço está disponível
    if (!container.has('torConnector')) {
      logger.warn('TorConnector service not available');
      return {
        success: false,
        error: 'TorConnector service not available'
      };
    }
    
    const torConnector = container.get('torConnector');
    const status = await torConnector.testConnection(data.torProxyUrl);
    
    return {
      success: true,
      status: status ? 'connected' : 'disconnected'
    };
  } catch (error) {
    logger.error('Tor connection test error', error);
    return {
      success: false,
      error: error.message || 'Failed to test Tor connection'
    };
  }
}
    };
  }
}

/**
 * Handle test API key request
 * @param {object} data - API key parameters
 * @returns {Promise<object>} - API key validity
 */
async function handleTestApiKey(data) {
  logger.info('Testing API key', { service: data.service });
  
  try {
    const osintConnector = container.get('osintConnector');
    const isValid = await osintConnector.testApiKey(data.service, data.apiKey);
    
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
 * @param {object} data - Search parameters
 * @returns {Promise<object>} - Search results
 */
async function handleSearch(data) {
  logger.info('Handling search request', { username: data.username });
  
  try {
    const searchEngine = container.get('searchEngine');
    const results = await searchEngine.search(data.username, data.options);
    
    return {
      success: true,
      searchId: results.searchId,
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
 * @param {object} data - Status parameters
 * @returns {Promise<object>} - Search status
 */
async function handleGetStatus(data) {
  logger.debug('Handling get status request', { searchId: data.searchId });
  
  try {
    const searchEngine = container.get('searchEngine');
    const status = searchEngine.getSearchStatus(data.searchId);
    
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
 * @param {object} data - Cancel parameters
 * @returns {Promise<object>} - Cancel result
 */
async function handleCancelSearch(data) {
  logger.info('Handling cancel search request', { searchId: data.searchId });
  
  try {
    const searchEngine = container.get('searchEngine');
    const cancelled = searchEngine.cancelSearch(data.searchId);
    
    return {
      success: true,
      cancelled
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
 * @returns {Promise<object>} - Settings
 */
async function handleGetSettings() {
  logger.debug('Handling get settings request');
  
  try {
    const storageService = container.get('storageService');
    const settings = await storageService.get('settings', {});
    
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
 * @param {object} data - Settings to save
 * @returns {Promise<object>} - Save result
 */
async function handleSaveSettings(data) {
  logger.info('Handling save settings request');
  
  try {
    const storageService = container.get('storageService');
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
 * @param {object} alarm - Alarm information
 */
async function handleAlarm(alarm) {
  logger.debug('Handling alarm', { name: alarm.name });
  
  try {
    if (alarm.name === 'cacheCleanup') {
      const storageService = container.get('storageService');
      await storageService.clearExpiredCache();
    }
  } catch (error) {
    logger.error('Alarm handler error', error, { name: alarm.name });
  }
}

// Initialize the extension
initialize();
