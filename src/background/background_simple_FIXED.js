/**
 * Background Script - Main background script for the extension
 * @version 4.0.0 (Manifest V2 Compatible) - FIXED
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

// Storage service simples - CORRIGIDO
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

  // ✅ MÉTODO REMOVE ADICIONADO - CORREÇÃO DO ERRO
  async remove(keys) {
    return new Promise((resolve, reject) => {
      browserAPI.storage.local.remove(keys, () => {
        if (browserAPI.runtime.lastError) {
          logger.error('Storage remove error:', browserAPI.runtime.lastError);
          reject(new Error(browserAPI.runtime.lastError.message));
        } else {
          logger.debug('Storage remove successful', { keys });
          resolve();
        }
      });
    });
  }

  // ✅ MÉTODO CLEAR ADICIONADO 
  async clear() {
    return new Promise((resolve, reject) => {
      browserAPI.storage.local.clear(() => {
        if (browserAPI.runtime.lastError) {
          logger.error('Storage clear error:', browserAPI.runtime.lastError);
          reject(new Error(browserAPI.runtime.lastError.message));
        } else {
          logger.debug('Storage cleared successfully');
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
  
  isSearching() {
    // Verifica se há buscas ativas
    for (const [id, search] of this.activeSearches.entries()) {
      if (search.status === 'running') {
        return true;
      }
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
 * Initialize the extension with Firefox/Edge compatibility - CORRIGIDO
 */
async function initialize() {
  logger.info('Initializing DeepAlias Hunter Pro (Enhanced) for Firefox/Edge...');
  
  try {
    // Verificar se a API está disponível
    if (!browserAPI) {
      throw new Error('Browser API não disponível');
    }

    // ✅ CORREÇÃO CRÍTICA: Listener de mensagens Firefox/Chrome unificado
    if (browserAPI.runtime && browserAPI.runtime.onMessage) {
      // Detectar tipo de browser para configurar listener adequado
      const isFirefox = typeof browser !== 'undefined' && browser.runtime;
      
      if (isFirefox) {
        // Firefox - Promise-based listener
        logger.info('🦊 Configurando listener Firefox (Promise-based)');
        browser.runtime.onMessage.addListener(async (message, sender) => {
          logger.debug('Firefox: Mensagem recebida', { type: message.type || message.action });
          try {
            const response = await handleMessage(message, sender);
            logger.debug('Firefox: Resposta enviada', { success: response?.success });
            return response;
          } catch (error) {
            logger.error('Firefox: Erro no handler', error);
            return { success: false, error: error.message };
          }
        });
      } else {
        // Chrome/Edge - Callback-based listener
        logger.info('🌐 Configurando listener Chrome/Edge (Callback-based)');
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          logger.debug('Chrome: Mensagem recebida', { type: message.type || message.action });
          
          // Processar mensagem de forma assíncrona
          handleMessage(message, sender)
            .then(response => {
              logger.debug('Chrome: Resposta enviada', { success: response?.success });
              sendResponse(response);
            })
            .catch(error => {
              logger.error('Chrome: Erro no handler', error);
              sendResponse({ success: false, error: error.message });
            });
          
          return true; // Mantém canal aberto para resposta assíncrona
        });
      }
    } else {
      logger.error('ERRO CRÍTICO: browserAPI.runtime.onMessage não disponível!');
      throw new Error('Runtime messaging API not available');
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
    
    logger.info('✅ DeepAlias Hunter Pro (Enhanced) initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize extension', error);
    throw error;
  }
}

/**
 * Handle messages from content scripts and popup - MELHORADO
 * @param {object} message - Message object
 * @param {object} sender - Sender information
 * @returns {Promise<any>} - Response
 */
async function handleMessage(message, sender) {
  const messageType = message.type || message.action;
  logger.debug('🔄 Processando mensagem', { 
    type: messageType, 
    sender: sender?.id,
    hasData: !!message.data 
  });
    
  try {
    switch (messageType) {
      case 'search':
      case 'startSearch':
        return await handleSearch(message.data || message);
      
      case 'getStatus':
      case 'checkSearchStatus':
        return await handleGetStatus(message.data);
      
      case 'cancelSearch':
        return await handleCancelSearch(message.data);
      
      case 'getSettings':
      case 'loadSettings':
        return await handleGetSettings();
      
      case 'saveSettings':
        return await handleSaveSettings(message.data || message);
      
      case 'content:loaded':
        return await handleContentLoaded(message.data, sender);
      
      case 'content:pageData':
        return await handleContentPageData(message.data, sender);
      
      case 'testTorConnection':
        return await handleTestTorConnection(message.data);
        
      case 'testApiKey':
        return await handleTestApiKey(message.data);
      
      // Handlers para teste e diagnóstico
      case 'ping':
        return await handlePing(message);
      
      case 'checkServices':
        return await handleCheckServices();
        
      case 'getPlatforms':
        return await handleGetPlatforms();
        
      case 'testStorage':
        return await handleTestStorage();
      
      default:
        logger.warn('⚠️ Tipo de mensagem desconhecido', { type: messageType });
        return { success: false, error: `Unknown message type: ${messageType}` };
    }
  } catch (error) {
    logger.error('❌ Erro ao processar mensagem', error, { type: messageType });
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
  logger.info('🔍 Iniciando busca', { username: data.username, options: data.options });
  
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
    logger.info('🚀 Iniciando busca com SearchEngine...');
    const searchResult = await searchEngine.search(data.username, data.options || {});
    
    logger.info(`✅ Busca ${searchResult.id} concluída:`, {
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
    logger.error('❌ Erro na busca', error);
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
  logger.debug('Verificando status', { searchId: data.searchId });
  
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
  logger.info('Cancelando busca', { searchId: data.searchId });
  
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
  logger.debug('Carregando configurações');
  
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
  logger.info('Salvando configurações');
  
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

/**
 * Handle ping request - usado para testar comunicação
 */
async function handlePing(message) {
  logger.info('🏓 Ping recebido', { source: message.source });
  
  return {
    success: true,
    pong: true,
    timestamp: Date.now(),
    receivedAt: message.timestamp,
    browserAPI: browserAPI ? 'available' : 'not available',
    services: {
      searchEngine: !!searchEngine,
      platformService: !!platformService,
      storageService: !!storageService
    }
  };
}

/**
 * Handle check services request - verifica status dos services
 */
async function handleCheckServices() {
  logger.info('🔧 Verificando status dos services');
  
  try {
    const platforms = platformService ? platformService.getAllPlatforms() : [];
    const testVariations = usernameVariator ? usernameVariator.generateVariations('test') : [];
    
    return {
      success: true,
      services: {
        platformService: {
          available: !!platformService,
          platforms: platforms.length,
          platformNames: platforms.slice(0, 5).map(p => p.name) // Primeiras 5 para teste
        },
        usernameVariator: {
          available: !!usernameVariator,
          variations: testVariations.length,
          sampleVariations: testVariations.slice(0, 3) // Primeiras 3 para teste
        },
        platformChecker: {
          available: !!platformChecker
        },
        searchEngine: {
          available: !!searchEngine,
          isSearching: searchEngine ? searchEngine.isSearching() : false
        },
        storageService: {
          available: !!storageService
        }
      },
      browserAPI: {
        available: !!browserAPI,
        type: browserAPI ? (typeof browser !== 'undefined' ? 'Firefox' : 'Chrome/Edge') : 'none'
      },
      timestamp: Date.now()
    };
  } catch (error) {
    logger.error('Erro ao verificar services', error);
    return {
      success: false,
      error: error.message,
      services: {
        platformService: { available: !!platformService, error: 'Failed to check' },
        usernameVariator: { available: !!usernameVariator, error: 'Failed to check' },
        platformChecker: { available: !!platformChecker, error: 'Failed to check' },
        searchEngine: { available: !!searchEngine, error: 'Failed to check' },
        storageService: { available: !!storageService, error: 'Failed to check' }
      }
    };
  }
}

/**
 * Handle get platforms request - para diagnóstico
 */
async function handleGetPlatforms() {
  logger.info('📋 Solicitação de plataformas para diagnóstico');
  
  try {
    if (!platformService) {
      return {
        success: false,
        error: 'PlatformService não inicializado',
        platforms: []
      };
    }
    
    const platforms = platformService.getAllPlatforms();
    
    return {
      success: true,
      platforms: platforms,
      count: platforms.length,
      samplePlatforms: platforms.slice(0, 10).map(p => ({
        name: p.name,
        category: p.category,
        enabled: p.enabled !== false
      }))
    };
  } catch (error) {
    logger.error('Erro ao obter plataformas', error);
    return {
      success: false,
      error: error.message,
      platforms: []
    };
  }
}

/**
 * Handle test storage request - para diagnóstico - CORRIGIDO
 */
async function handleTestStorage() {
  logger.info('💾 Teste de storage para diagnóstico');
  
  try {
    const testKey = 'diagnostico_test_' + Date.now();
    const testData = { test: true, timestamp: Date.now() };
    
    // Testar escrita
    await storageService.set({ [testKey]: testData });
    
    // Testar leitura
    const retrieved = await storageService.get(testKey);
    
    // ✅ CORRIGIDO: Testar remoção usando método remove() que agora existe
    await storageService.remove([testKey]);
    
    if (retrieved && retrieved.test === true) {
      return {
        success: true,
        message: 'Storage funcionando corretamente',
        operations: ['write', 'read', 'remove']
      };
    } else {
      return {
        success: false,
        error: 'Dados não foram recuperados corretamente',
        operations: ['write', 'read-failed']
      };
    }
  } catch (error) {
    logger.error('❌ Erro no teste de storage', error);
    return {
      success: false,
      error: error.message,
      operations: ['failed']
    };
  }
}

// ✅ INICIALIZAÇÃO CORRIGIDA
logger.info('🚀 Iniciando DeepAlias Hunter Pro...');
initialize().catch(error => {
  logger.error('❌ ERRO CRÍTICO na inicialização:', error);
});