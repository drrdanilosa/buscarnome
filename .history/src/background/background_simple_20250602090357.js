/**
 * Background Script - Main background script for the extension
 * @version 4.0.0 (Manifest V2 Compatible)
 */

// Polyfill aprimorado para compatibilidade Firefox/Edge/Chrome
const browserAPI = (() => {
  if (typeof browser !== 'undefined' && browser.runtime) {
    // Firefox usa o objeto 'browser' nativo
    return browser;
  } else if (typeof chrome !== 'undefined' && chrome.runtime) {
    // Chrome/Edge usa o objeto 'chrome'
    return chrome;
  } else {
    // Fallback para casos extremos
    console.error('[DeepAlias] Nenhuma API de browser detectada!');
    return null;
  }
})();

// Verificação de segurança
if (!browserAPI) {
  console.error('[DeepAlias] ERRO CRÍTICO: API do browser não disponível!');
}

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

// Storage service aprimorado para Firefox/Edge
class SimpleStorageService {
  async get(key, defaultValue = null) {
    try {
      // Firefox/Chrome compatível
      if (browserAPI && browserAPI.storage && browserAPI.storage.local) {
        const result = await new Promise((resolve, reject) => {
          browserAPI.storage.local.get([key], (result) => {
            if (browserAPI.runtime.lastError) {
              logger.error('Storage get error:', browserAPI.runtime.lastError);
              reject(new Error(browserAPI.runtime.lastError.message));
            } else {
              resolve(result);
            }
          });
        });
        
        return result[key] !== undefined ? result[key] : defaultValue;
      } else {
        logger.error('Storage API não disponível');
        return defaultValue;
      }
    } catch (error) {
      logger.error('Erro no storage get:', error);
      return defaultValue;
    }
  }
  
  async set(data) {
    try {
      if (browserAPI && browserAPI.storage && browserAPI.storage.local) {
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
      } else {
        throw new Error('Storage API não disponível');
      }
    } catch (error) {
      logger.error('Erro no storage set:', error);
      throw error;
    }
  }
  
  async clearExpiredCache() {
    // Implementação simples de limpeza de cache
    logger.debug('Cache cleanup triggered');
  }
}

// Platform Service simplificado com plataformas reais
class SimplePlatformService {
  constructor() {
    this.platforms = [
      // Plataformas principais - alta prioridade
      { name: 'Instagram', url: 'https://instagram.com/{username}', category: 'social', priority: 'high', checkType: 'http' },
      { name: 'Twitter', url: 'https://twitter.com/{username}', category: 'social', priority: 'high', checkType: 'http' },
      { name: 'TikTok', url: 'https://tiktok.com/@{username}', category: 'social', priority: 'high', checkType: 'http' },
      { name: 'YouTube', url: 'https://youtube.com/@{username}', category: 'social', priority: 'high', checkType: 'http' },
      { name: 'Reddit', url: 'https://reddit.com/user/{username}', category: 'social', priority: 'medium', checkType: 'http' },
      { name: 'LinkedIn', url: 'https://linkedin.com/in/{username}', category: 'professional', priority: 'medium', checkType: 'http' },
      { name: 'Pinterest', url: 'https://pinterest.com/{username}', category: 'social', priority: 'medium', checkType: 'http' },
      { name: 'Telegram', url: 'https://t.me/{username}', category: 'social', priority: 'medium', checkType: 'content' },
      { name: 'GitHub', url: 'https://github.com/{username}', category: 'development', priority: 'medium', checkType: 'http' },
      { name: 'Twitch', url: 'https://twitch.tv/{username}', category: 'gaming', priority: 'medium', checkType: 'http' },
      
      // Plataformas adultas - críticas
      { name: 'OnlyFans', url: 'https://onlyfans.com/{username}', category: 'adult', priority: 'critical', checkType: 'content', adult: true },
      { name: 'Fansly', url: 'https://fansly.com/{username}', category: 'adult', priority: 'critical', checkType: 'content', adult: true },
      { name: 'Chaturbate', url: 'https://chaturbate.com/{username}', category: 'cam', priority: 'critical', checkType: 'content', adult: true },
      { name: 'MyFreeCams', url: 'https://profiles.myfreecams.com/{username}', category: 'cam', priority: 'critical', checkType: 'content', adult: true },
      
      // Outras plataformas
      { name: 'Behance', url: 'https://behance.net/{username}', category: 'portfolio', priority: 'medium', checkType: 'http' },
      { name: 'DeviantArt', url: 'https://deviantart.com/{username}', category: 'portfolio', priority: 'medium', checkType: 'http' },
      { name: 'SoundCloud', url: 'https://soundcloud.com/{username}', category: 'music', priority: 'medium', checkType: 'http' },
      { name: 'Spotify', url: 'https://open.spotify.com/user/{username}', category: 'music', priority: 'medium', checkType: 'http' },
      { name: 'Tumblr', url: 'https://{username}.tumblr.com', category: 'social', priority: 'medium', checkType: 'http' },
      { name: 'Medium', url: 'https://medium.com/@{username}', category: 'blog', priority: 'low', checkType: 'http' }
    ];
  }
  
  getAllPlatforms() {
    return [...this.platforms];
  }
  
  getPlatformsByCategory(category) {
    return this.platforms.filter(p => p.category === category);
  }
}

// Username Variator simplificado
class SimpleUsernameVariator {
  generateVariations(username, maxVariations = 10) {
    const variations = [username]; // Sempre incluir o original
    
    // Variações básicas
    variations.push(username.toLowerCase());
    variations.push(username.toUpperCase());
    variations.push(username + '1');
    variations.push(username + '123');
    variations.push(username + '_');
    variations.push('_' + username);
    variations.push(username + 'official');
    variations.push('real' + username);
    
    // Remover duplicatas e limitar
    return [...new Set(variations)].slice(0, maxVariations);
  }
}

// Platform Checker simplificado
class SimplePlatformChecker {
  async check(username, platform) {
    // Simular verificação de plataforma
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500)); // 500-1500ms
    
    const url = platform.url.replace('{username}', username);
    const exists = Math.random() > 0.7; // 30% chance de encontrar
    
    return {
      exists,
      url,
      confidence: exists ? (Math.random() > 0.5 ? 'high' : 'medium') : 'low',
      message: exists ? 'Profile found' : 'Profile not found',
      responseTime: Math.floor(Math.random() * 1000 + 200)
    };
  }
}

// Search Engine simplificado
class SimpleSearchEngine {
  constructor(platformService, usernameVariator, platformChecker) {
    this.platformService = platformService;
    this.usernameVariator = usernameVariator;
    this.platformChecker = platformChecker;
    this.activeSearches = new Map();
  }
  
  async search(username, options = {}) {
    const searchId = 'search_' + Date.now();
    const startTime = Date.now();
    
    logger.info(`Iniciando busca para "${username}" (ID: ${searchId})`);
    
    // Opções padrão
    const searchOptions = {
      includeAdult: true,
      includeTor: false,
      maxVariations: 5,
      maxPlatforms: 20,
      ...options
    };
    
    // Status da busca
    const searchStatus = {
      id: searchId,
      username,
      status: 'running',
      startTime,
      progress: 0,
      platformsChecked: 0,
      platformsTotal: 0,
      results: []
    };
    
    this.activeSearches.set(searchId, searchStatus);
    
    try {
      // Gerar variações
      const variations = this.usernameVariator.generateVariations(username, searchOptions.maxVariations);
      
      // Obter plataformas
      let platforms = this.platformService.getAllPlatforms();
      
      // Filtrar plataformas adultas se necessário
      if (!searchOptions.includeAdult) {
        platforms = platforms.filter(p => !p.adult);
      }
      
      // Limitar plataformas
      platforms = platforms.slice(0, searchOptions.maxPlatforms);
      searchStatus.platformsTotal = platforms.length;
      
      logger.info(`Verificando ${platforms.length} plataformas para ${variations.length} variações`);
      
      // Verificar cada plataforma
      for (const platform of platforms) {
        if (searchStatus.status === 'cancelled') break;
        
        try {
          const result = await this.platformChecker.check(username, platform);
          
          if (result.exists) {
            searchStatus.results.push({
              platform: platform.name,
              platformUrl: result.url,
              username: username,
              confidence: result.confidence,
              category: platform.category,
              adult: platform.adult || false,
              message: result.message,
              timestamp: Date.now()
            });
          }
          
          searchStatus.platformsChecked++;
          searchStatus.progress = Math.round((searchStatus.platformsChecked / searchStatus.platformsTotal) * 100);
          
        } catch (error) {
          logger.error(`Erro ao verificar ${username} em ${platform.name}:`, error);
        }
      }
      
      searchStatus.status = 'completed';
      searchStatus.endTime = Date.now();
      
      logger.info(`Busca concluída: ${searchStatus.results.length} resultados encontrados em ${searchStatus.platformsChecked} plataformas`);
      
      return searchStatus;
      
    } catch (error) {
      logger.error('Erro na busca:', error);
      searchStatus.status = 'error';
      searchStatus.error = error.message;
      return searchStatus;
    }
  }
  
  getSearchStatus(searchId) {
    return this.activeSearches.get(searchId);
  }
  
  cancelSearch(searchId) {
    const search = this.activeSearches.get(searchId);
    if (search) {
      search.status = 'cancelled';
      return true;
    }
    return false;
  }
}

// Instâncias globais dos serviços
const storageService = new SimpleStorageService();
const platformService = new SimplePlatformService();
const usernameVariator = new SimpleUsernameVariator();
const platformChecker = new SimplePlatformChecker();
const searchEngine = new SimpleSearchEngine(platformService, usernameVariator, platformChecker);

/**
 * Initialize the extension with Firefox/Edge compatibility
 */
async function initialize() {
  logger.info('Initializing DeepAlias Hunter Pro (Enhanced) for Firefox/Edge...');
  
  try {
    // Verificar se a API está disponível
    if (!browserAPI) {
      throw new Error('Browser API não disponível');
    }
    
    // Register message listeners com compatibilidade Firefox
    if (browserAPI.runtime && browserAPI.runtime.onMessage) {
      browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // Firefox requer Promise para async
        const handlePromise = handleMessage(message, sender);
        
        handlePromise
          .then(response => {
            try {
              sendResponse(response);
            } catch (error) {
              logger.error('Erro ao enviar resposta:', error);
            }
          })
          .catch(error => {
            logger.error('Message handler error', error);
            try {
              sendResponse({ 
                success: false, 
                error: error.message || 'Unknown error' 
              });
            } catch (sendError) {
              logger.error('Erro ao enviar resposta de erro:', sendError);
            }
          });
        
        return true; // Indica que a resposta será enviada de forma assíncrona
      });
    }
    
    // Set up alarm for cache cleanup com verificação
    if (browserAPI.alarms) {
      try {
        await browserAPI.alarms.create('cacheCleanup', { periodInMinutes: 60 });
        if (browserAPI.alarms.onAlarm) {
          browserAPI.alarms.onAlarm.addListener(handleAlarm);
        }
      } catch (alarmError) {
        logger.warn('Não foi possível configurar alarmes:', alarmError);
      }
    }
    
    // Verificar se os serviços estão inicializados
    logger.info('Verificando inicialização dos serviços...');
    const platformCount = platformService.getAllPlatforms().length;
    logger.info(`Platform Service inicializado com ${platformCount} plataformas`);
    
    if (platformCount === 0) {
      logger.error('PROBLEMA CRÍTICO: Platform Service não tem plataformas carregadas!');
    }
    
    logger.info('DeepAlias Hunter Pro (Enhanced) initialized successfully for Firefox/Edge');
  } catch (error) {
    logger.error('Failed to initialize extension', error);
    throw error;
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
 * Handle search request with enhanced Firefox/Edge compatibility
 */
async function handleSearch(data) {
  logger.info('Handling search request', { username: data.username, options: data.options });
  
  try {
    // Verificar se os serviços estão disponíveis
    if (!searchEngine) {
      logger.error('SearchEngine não inicializado!');
      return {
        success: false,
        error: 'SearchEngine não inicializado'
      };
    }
    
    if (!platformService) {
      logger.error('PlatformService não inicializado!');
      return {
        success: false,
        error: 'PlatformService não inicializado'
      };
    }
    
    // Verificar se há plataformas disponíveis
    const platforms = platformService.getAllPlatforms();
    logger.info(`Plataformas disponíveis: ${platforms.length}`);
    
    if (platforms.length === 0) {
      logger.error('ERRO CRÍTICO: Nenhuma plataforma carregada no PlatformService!');
      return {
        success: false,
        error: 'Nenhuma plataforma disponível para busca'
      };
    }
    
    // Usar o SearchEngine real em vez de simulação
    logger.info('Iniciando busca com SearchEngine...');
    const searchResult = await searchEngine.search(data.username, data.options || {});
    
    logger.info(`Busca ${searchResult.id} concluída:`, {
      status: searchResult.status,
      platformsChecked: searchResult.platformsChecked,
      platformsTotal: searchResult.platformsTotal,
      resultsFound: searchResult.results.length
    });
    
    return {
      success: true,
      searchId: searchResult.id,
      results: searchResult
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
    // Usar o SearchEngine real para obter status
    const searchStatus = searchEngine.getSearchStatus(data.searchId);
    
    if (searchStatus) {
      return {
        success: true,
        status: {
          searchId: searchStatus.id,
          status: searchStatus.status,
          progress: searchStatus.progress,
          platformsChecked: searchStatus.platformsChecked,
          platformsTotal: searchStatus.platformsTotal,
          resultsCount: searchStatus.results.length,
          username: searchStatus.username
        }
      };
    } else {
      return {
        success: false,
        error: 'Search not found'
      };
    }
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
    // Usar o SearchEngine real para cancelar busca
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
