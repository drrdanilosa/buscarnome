/**
 * DeepAlias Hunter Pro - Background Script Principal
 * @author drrdanilosa
 * @version 5.0.0
 * @date 2025-06-04 04:04:59
 * @updated_by drrdanilosa
 */

// ========================================
// 1. EVITAR REDECLARAÇÃO - VERIFICAR SE JÁ EXISTE
// ========================================

// Verificar se variáveis já foram declaradas pelo background_simple.js
if (typeof window.deepAliasBackground === 'undefined') {
  window.deepAliasBackground = {};
}

// Usar namespace para evitar conflitos
const DeepAliasBackground = window.deepAliasBackground;

// ========================================
// 2. VARIÁVEIS GLOBAIS (SEM REDECLARAÇÃO)
// ========================================

// Inicializar apenas se não existir
if (!DeepAliasBackground.initialized) {
  DeepAliasBackground.instanceId = `bg_${Math.random().toString(36).substring(2, 16)}_${Date.now()}`;
  DeepAliasBackground.isMainInstance = false;
  DeepAliasBackground.lockAcquired = false;
  DeepAliasBackground.lockCheckInterval = null;
  DeepAliasBackground.isInitialized = false;
  DeepAliasBackground.initializationPromise = null;
  DeepAliasBackground.activeSearches = new Map();
  DeepAliasBackground.messageQueue = new Map();
  
  // Referências para serviços
  DeepAliasBackground.dataAnalyzer = null;
  DeepAliasBackground.platformService = null;
  DeepAliasBackground.searchEngine = null;
  
  DeepAliasBackground.initialized = true;
  
  console.log('[BACKGROUND] Namespace inicializado com instanceId:', DeepAliasBackground.instanceId);
}

// ========================================
// 3. FUNÇÕES DE CONTROLE DE INSTÂNCIA
// ========================================

/**
 * Verifica e tenta adquirir o lock para ser a instância principal
 */
function checkAndAcquireLock() {
  try {
    const currentLock = localStorage.getItem('deepalias_instance_lock');
    
    if (currentLock) {
      const lockData = JSON.parse(currentLock);
      const now = Date.now();
      
      if (now - lockData.timestamp > 10000) {
        console.log('[BACKGROUND] Lock expirado detectado, assumindo controle.');
        acquireLock();
      } else if (lockData.instanceId === DeepAliasBackground.instanceId) {
        acquireLock();
      } else {
        DeepAliasBackground.isMainInstance = false;
        console.log(`[BACKGROUND] Instância secundária - Principal: ${lockData.instanceId}`);
      }
    } else {
      acquireLock();
    }
  } catch (error) {
    console.error('[BACKGROUND] Erro ao verificar lock:', error);
  }
}

/**
 * Adquire o lock para ser a instância principal
 */
function acquireLock() {
  try {
    const lockData = {
      instanceId: DeepAliasBackground.instanceId,
      timestamp: Date.now()
    };
    
    localStorage.setItem('deepalias_instance_lock', JSON.stringify(lockData));
    
    if (!DeepAliasBackground.lockAcquired) {
      console.log('[BACKGROUND] Lock adquirido para instância', DeepAliasBackground.instanceId);
      DeepAliasBackground.lockAcquired = true;
      DeepAliasBackground.isMainInstance = true;
      
      if (!DeepAliasBackground.isInitialized) {
        initializeServices();
      }
    }
  } catch (error) {
    console.error('[BACKGROUND] Erro ao adquirir lock:', error);
  }
}

/**
 * Libera o lock ao fechar a instância
 */
function releaseLock() {
  try {
    const currentLock = localStorage.getItem('deepalias_instance_lock');
    
    if (currentLock) {
      const lockData = JSON.parse(currentLock);
      
      if (lockData.instanceId === DeepAliasBackground.instanceId) {
        localStorage.removeItem('deepalias_instance_lock');
        console.log('[BACKGROUND] Lock liberado para instância', DeepAliasBackground.instanceId);
      }
    }
  } catch (error) {
    console.error('[BACKGROUND] Erro ao liberar lock:', error);
  }
}

// ========================================
// 4. INICIALIZAÇÃO DE SERVIÇOS MOCK
// ========================================

/**
 * Inicializa os serviços da extensão (versão mock para teste)
 */
async function initializeServices() {
  if (DeepAliasBackground.isInitialized || DeepAliasBackground.initializationPromise) {
    return DeepAliasBackground.initializationPromise || Promise.resolve();
  }
  
  console.log('[BACKGROUND] Inicializando DeepAlias Hunter Pro v5.0.0...');
  
  DeepAliasBackground.initializationPromise = new Promise(async (resolve, reject) => {
    try {
      // Mock dos serviços para teste
      DeepAliasBackground.platformService = {
        getStats: () => ({
          total: 400,
          categories: 15,
          isComplete: true,
          lastLoaded: new Date().toISOString(),
          source: 'mock'
        }),
        reloadPlatforms: async () => {
          console.log('[BACKGROUND] Mock: Recarregando plataformas...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return {
            total: 420,
            categories: 16,
            isComplete: true,
            lastLoaded: new Date().toISOString()
          };
        },
        getPlatforms: (options = {}) => {
          const mockPlatforms = [
            { name: 'GitHub', category: 'developer', domain: 'github.com' },
            { name: 'LinkedIn', category: 'professional', domain: 'linkedin.com' },
            { name: 'Twitter', category: 'social', domain: 'twitter.com' },
            { name: 'Instagram', category: 'social', domain: 'instagram.com' },
            { name: 'Facebook', category: 'social', domain: 'facebook.com' },
            { name: 'YouTube', category: 'social', domain: 'youtube.com' },
            { name: 'TikTok', category: 'social', domain: 'tiktok.com' },
            { name: 'Reddit', category: 'social', domain: 'reddit.com' },
            { name: 'Discord', category: 'gaming', domain: 'discord.com' },
            { name: 'Telegram', category: 'messaging', domain: 'telegram.org' }
          ];
          return mockPlatforms.slice(0, options.limit || mockPlatforms.length);
        }
      };
      
      DeepAliasBackground.searchEngine = {
        searchMultiplePlatforms: async (username, platforms, options) => {
          console.log(`[BACKGROUND] Mock: Buscando '${username}' em ${platforms.length} plataformas`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          return platforms.map((platform, index) => ({
            platform: platform.name,
            username: username,
            url: `https://${platform.domain}/${username}`,
            status: index % 3 === 0 ? 'found' : 'not_found',
            favicon: `https://www.google.com/s2/favicons?domain=${platform.domain}&sz=32`,
            domain: platform.domain
          }));
        },
        clearCache: () => {
          console.log('[BACKGROUND] Mock: Cache limpo');
        },
        getStats: () => ({
          totalSearches: 42,
          cacheHits: 15,
          averageTime: 2500
        })
      };
      
      DeepAliasBackground.dataAnalyzer = {
        getAllTabsData: () => ({
          'tab1': { sensitiveContent: [] },
          'tab2': { sensitiveContent: ['email', 'phone'] }
        })
      };
      
      DeepAliasBackground.isInitialized = true;
      console.log('[BACKGROUND] Serviços mock inicializados com sucesso');
      resolve();
      
    } catch (error) {
      console.error('[BACKGROUND] Erro durante inicialização de serviços:', error);
      reject(error);
    }
  });
  
  return DeepAliasBackground.initializationPromise;
}

// ========================================
// 5. FUNÇÕES DE TRATAMENTO DE MENSAGENS
// ========================================

/**
 * Processa solicitação de busca
 */
async function handleSearchRequest(message) {
  try {
    console.log('[BACKGROUND] Processando solicitação de busca:', message);
    
    if (!DeepAliasBackground.isMainInstance) {
      throw new Error('SECONDARY_INSTANCE');
    }
    
    await initializeServices();
    
    if (!DeepAliasBackground.searchEngine) {
      throw new Error('Motor de busca não inicializado');
    }
    
    const { username, options = {} } = message;
    
    if (!username || username.length < 2) {
      throw new Error('Username inválido');
    }
    
    const searchKey = `${username}_${JSON.stringify(options)}`;
    if (DeepAliasBackground.activeSearches.has(searchKey)) {
      console.log('[BACKGROUND] Busca já em andamento para:', username);
      return DeepAliasBackground.activeSearches.get(searchKey);
    }
    
    const searchPromise = performSearch(username, options);
    DeepAliasBackground.activeSearches.set(searchKey, searchPromise);
    
    searchPromise.finally(() => {
      DeepAliasBackground.activeSearches.delete(searchKey);
    });
    
    return await searchPromise;
    
  } catch (error) {
    console.error('[BACKGROUND] Erro na solicitação de busca:', error);
    throw error;
  }
}

/**
 * Executa a busca propriamente dita
 */
async function performSearch(username, options = {}) {
  try {
    console.log(`[BACKGROUND] Iniciando busca para '${username}' com opções:`, options);
    
    const startTime = Date.now();
    
    const searchOptions = {
      maxResults: options.maxResults || 50,
      timeout: options.timeout || 30000,
      searchAll: options.searchAll || false,
      advancedSearch: options.advancedSearch || false,
      forceCompleteSearch: options.forceCompleteSearch || false,
      ...options
    };
    
    const platforms = DeepAliasBackground.platformService.getPlatforms({ 
      limit: searchOptions.forceCompleteSearch ? undefined : searchOptions.maxResults 
    });
    
    if (platforms.length === 0) {
      throw new Error('Nenhuma plataforma disponível para busca');
    }
    
    const results = await DeepAliasBackground.searchEngine.searchMultiplePlatforms(username, platforms, searchOptions);
    
    const searchTime = Date.now() - startTime;
    console.log(`[BACKGROUND] Busca concluída em ${searchTime}ms. Encontrados ${results.length} resultados`);
    
    try {
      await browser.storage.local.set({
        [`search_${username}_${Date.now()}`]: {
          username,
          results,
          timestamp: new Date().toISOString(),
          searchTime,
          options: searchOptions
        }
      });
    } catch (storageError) {
      console.warn('[BACKGROUND] Erro ao salvar resultados no storage:', storageError);
    }
    
    return {
      results,
      searchTime,
      instanceId: DeepAliasBackground.instanceId,
      username,
      options: searchOptions,
      platformsSearched: platforms.length
    };
    
  } catch (error) {
    console.error('[BACKGROUND] Erro durante execução da busca:', error);
    throw error;
  }
}

/**
 * Trata solicitações de estatísticas de plataformas
 */
function handlePlatformStatsRequest() {
  try {
    if (!DeepAliasBackground.platformService) {
      return {
        status: 'error',
        message: 'Serviço de plataformas não inicializado',
        stats: { total: 0, categories: 0, isComplete: false }
      };
    }
    
    const stats = DeepAliasBackground.platformService.getStats();
    console.log('[BACKGROUND] Estatísticas de plataformas solicitadas:', stats);
    
    return {
      status: 'success',
      stats: {
        total: stats.total || 0,
        categories: stats.categories || 0,
        isComplete: stats.isComplete || false,
        lastLoaded: stats.lastLoaded || null,
        source: stats.source || 'unknown'
      }
    };
  } catch (error) {
    console.error('[BACKGROUND] Erro ao obter estatísticas de plataformas:', error);
    return {
      status: 'error',
      message: error.message,
      stats: { total: 0, categories: 0, isComplete: false }
    };
  }
}

/**
 * Trata solicitações de recarga de plataformas
 */
async function handleReloadPlatformsRequest() {
  try {
    console.log('[BACKGROUND] Solicitação de recarga de plataformas');
    
    if (!DeepAliasBackground.platformService) {
      throw new Error('Serviço de plataformas não inicializado');
    }
    
    const newStats = await DeepAliasBackground.platformService.reloadPlatforms();
    
    console.log('[BACKGROUND] Plataformas recarregadas:', newStats);
    
    return {
      status: 'success',
      message: 'Plataformas recarregadas com sucesso',
      stats: {
        total: newStats.total || 0,
        categories: newStats.categories || 0,
        isComplete: newStats.isComplete || false,
        lastLoaded: newStats.lastLoaded || null
      }
    };
  } catch (error) {
    console.error('[BACKGROUND] Erro ao recarregar plataformas:', error);
    return {
      status: 'error',
      message: error.message,
      stats: { total: 0, categories: 0, isComplete: false }
    };
  }
}

/**
 * Trata solicitações de favicon com bypass de CORS
 */
async function handleFaviconRequest(message) {
  try {
    const domain = message.url || message.domain;
    
    if (!domain) {
      throw new Error('URL ou domain não fornecido');
    }
    
    // Lista de tentativas de favicon em ordem de prioridade
    const faviconUrls = [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      `https://favicon.yandex.net/favicon/${domain}`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
      `https://${domain}/favicon.ico`,
      `https://www.${domain}/favicon.ico`
    ];
    
    // Tentar cada URL até encontrar uma que funcione
    for (const faviconUrl of faviconUrls) {
      try {
        console.log(`[BACKGROUND] Tentando favicon: ${faviconUrl}`);
        
        // Usar fetch com modo no-cors para evitar problemas de CORS
        const response = await fetch(faviconUrl, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'force-cache'
        });
        
        // Se chegou até aqui, a URL é válida
        return {
          status: 'success',
          faviconUrl: faviconUrl,
          domain: domain,
          method: 'external_service'
        };
        
      } catch (error) {
        console.warn(`[BACKGROUND] Favicon falhou para ${faviconUrl}:`, error.message);
        continue;
      }
    }
    
    // Se todas falharam, retornar ícone padrão
    return {
      status: 'fallback',
      faviconUrl: browser.runtime.getURL('src/assets/icons/globe.png'),
      domain: domain,
      method: 'fallback'
    };
    
  } catch (error) {
    console.error('[BACKGROUND] Erro geral no handleFaviconRequest:', error);
    throw error;
  }
}

/**
 * Abre a visualização de dados
 */
function openDataView() {
  try {
    console.log('[BACKGROUND] Abrindo visualização de dados');
    
    browser.tabs.query({ url: browser.runtime.getURL('src/data_view/*') })
      .then(tabs => {
        if (tabs.length > 0) {
          browser.tabs.update(tabs[0].id, { active: true });
          browser.windows.update(tabs[0].windowId, { focused: true });
        } else {
          browser.tabs.create({
            url: browser.runtime.getURL('src/data_view/data_view.html')
          });
        }
      })
      .catch(error => {
        console.error('[BACKGROUND] Erro ao abrir visualização de dados:', error);
      });
  } catch (error) {
    console.error('[BACKGROUND] Erro ao processar abertura de visualização:', error);
  }
}

/**
 * Realiza busca rápida com texto selecionado
 */
async function performQuickSearch() {
  try {
    console.log('[BACKGROUND] Executando busca rápida');
    
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    
    if (tabs.length === 0) {
      throw new Error('Nenhuma aba ativa encontrada');
    }
    
    const activeTab = tabs[0];
    
    const results = await browser.tabs.executeScript(activeTab.id, {
      code: 'window.getSelection().toString().trim();'
    });
    
    const selectedText = results[0];
    
    if (!selectedText || selectedText.length < 2) {
      browser.notifications.create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('src/assets/icons/icon48.png'),
        title: 'DeepAlias Hunter Pro',
        message: 'Selecione um nome de usuário para buscar rapidamente'
      });
      return;
    }
    
    const username = selectedText.replace(/[^a-zA-Z0-9_.-]/g, '').substring(0, 50);
    
    if (username.length < 2) {
      browser.notifications.create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('src/assets/icons/icon48.png'),
        title: 'DeepAlias Hunter Pro',
        message: 'Texto selecionado não é um nome de usuário válido'
      });
      return;
    }
    
    await browser.storage.local.set({ lastSearchUsername: username });
    
    browser.browserAction.openPopup();
    
    console.log(`[BACKGROUND] Busca rápida configurada para: ${username}`);
    
  } catch (error) {
    console.error('[BACKGROUND] Erro na busca rápida:', error);
    
    browser.notifications.create({
      type: 'basic',
      iconUrl: browser.runtime.getURL('src/assets/icons/icon48.png'),
      title: 'DeepAlias Hunter Pro',
      message: 'Erro ao executar busca rápida: ' + error.message
    });
  }
}

// ========================================
// 6. CONFIGURAÇÃO DE EVENT LISTENERS PRINCIPAIS
// ========================================

/**
 * Configura os listeners principais de eventos
 */
function setupEventListeners() {
  console.log('[BACKGROUND] Configurando event listeners...');
  
  // Listener para comandos de teclado
  if (browser.commands && browser.commands.onCommand) {
    browser.commands.onCommand.addListener(command => {
      console.log(`[BACKGROUND] Comando recebido: ${command}`);
      
      if (command === 'open-data-view') {
        openDataView();
      } else if (command === 'quick-search') {
        performQuickSearch();
      }
    });
  }
  
  // Listener para instalação/atualização da extensão
  if (browser.runtime.onInstalled) {
    browser.runtime.onInstalled.addListener(details => {
      console.log('[BACKGROUND] Extensão instalada/atualizada:', details);
      
      if (details.reason === 'install') {
        showWelcomeMessage();
      } else if (details.reason === 'update') {
        showUpdateMessage(details.previousVersion);
      }
    });
  }
  
  // ✅ LISTENER PRINCIPAL PARA MENSAGENS (EXPANDIDO COM NOVOS HANDLERS)
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[BACKGROUND] Mensagem recebida:', {
      message: message,
      sender: sender,
      timestamp: new Date().toISOString()
    });
    
    const messageType = message.type || message.action || message;
    
    try {
      switch (messageType) {
        // ✅ NOVOS HANDLERS ADICIONADOS
        case 'content:loaded':
        case 'contentLoaded':
          console.log('[BACKGROUND] Content script carregado no tab:', sender.tab?.id);
          sendResponse({
            status: 'acknowledged',
            message: 'Background recebeu notificação de content loaded',
            instanceId: DeepAliasBackground.instanceId,
            timestamp: Date.now()
          });
          return true;
          
        case 'optionsUpdated':
        case 'options:updated':
          console.log('[BACKGROUND] Configurações atualizadas:', message.data || message.settings);
          if (message.data || message.settings) {
            const newSettings = message.data || message.settings;
            browser.storage.local.set({ deepaliasSettings: newSettings })
              .then(() => {
                console.log('[BACKGROUND] Configurações atualizadas no storage:', newSettings);
                sendResponse({
                  status: 'success',
                  message: 'Configurações atualizadas com sucesso',
                  settings: newSettings
                });
              })
              .catch(error => {
                console.error('[BACKGROUND] Erro ao atualizar configurações:', error);
                sendResponse({
                  status: 'error',
                  message: error.message
                });
              });
          } else {
            sendResponse({
              status: 'acknowledged',
              message: 'Notificação de atualização recebida'
            });
          }
          return true;
          
        case 'ping':
        case 'check-connection':
          console.log('[BACKGROUND] Ping recebido, respondendo...');
          sendResponse({
            status: 'ok',
            isMainInstance: DeepAliasBackground.isMainInstance,
            instanceId: DeepAliasBackground.instanceId,
            primaryInstanceId: DeepAliasBackground.isMainInstance ? DeepAliasBackground.instanceId : null,
            timestamp: Date.now(),
            initialized: DeepAliasBackground.isInitialized
          });
          return true;
          
        case 'startSearch':
        case 'start-search':
          console.log('[BACKGROUND] Processando busca...');
          handleSearchRequest(message)
            .then(results => {
              console.log('[BACKGROUND] Busca concluída, enviando resposta');
              sendResponse(results);
            })
            .catch(error => {
              console.error('[BACKGROUND] Erro na busca:', error);
              sendResponse({ 
                error: error.message,
                instanceId: DeepAliasBackground.instanceId,
                isMainInstance: DeepAliasBackground.isMainInstance
              });
            });
          return true;
          
        case 'getPlatformStats':
        case 'get-platform-stats':
          console.log('[BACKGROUND] Enviando estatísticas de plataformas...');
          const statsResponse = handlePlatformStatsRequest();
          sendResponse(statsResponse);
          return true;
          
        case 'reloadPlatforms':
        case 'reload-platforms':
          console.log('[BACKGROUND] Recarregando plataformas...');
          handleReloadPlatformsRequest()
            .then(result => {
              console.log('[BACKGROUND] Recarga de plataformas concluída');
              sendResponse(result);
            })
            .catch(error => {
              console.error('[BACKGROUND] Erro ao recarregar plataformas:', error);
              sendResponse({
                status: 'error',
                message: error.message,
                stats: { total: 0, categories: 0, isComplete: false }
              });
            });
          return true;
          
        case 'openDataView':
        case 'open-data-view':
          console.log('[BACKGROUND] Abrindo visualização de dados...');
          openDataView();
          sendResponse({ status: 'success', message: 'Visualização de dados aberta' });
          return true;
          
        case 'getSettings':
        case 'get-settings':
          console.log('[BACKGROUND] Carregando configurações...');
          browser.storage.local.get('deepaliasSettings')
            .then(data => {
              const settings = data.deepaliasSettings || {
                maxResults: 50,
                timeout: 30000,
                advancedSearch: false,
                searchAll: true,
                enableNotifications: true
              };
              sendResponse({ 
                status: 'success', 
                settings: settings,
                source: 'storage'
              });
            })
            .catch(error => {
              console.error('[BACKGROUND] Erro ao carregar configurações:', error);
              sendResponse({ 
                status: 'error', 
                message: error.message,
                settings: {
                  maxResults: 50,
                  timeout: 30000,
                  advancedSearch: false,
                  searchAll: true,
                  enableNotifications: true
                }
              });
            });
          return true;
          
        case 'saveSettings':
        case 'save-settings':
          console.log('[BACKGROUND] Salvando configurações:', message.data);
          browser.storage.local.set({ deepaliasSettings: message.data })
            .then(() => {
              console.log('[BACKGROUND] Configurações salvas com sucesso');
              sendResponse({ status: 'success', message: 'Configurações salvas' });
            })
            .catch(error => {
              console.error('[BACKGROUND] Erro ao salvar configurações:', error);
              sendResponse({ status: 'error', message: error.message });
            });
          return true;
          
        case 'getFavicon':
        case 'get-favicon':
          console.log('[BACKGROUND] Solicitação de favicon para:', message.url || message.domain);
          handleFaviconRequest(message)
            .then(result => {
              sendResponse(result);
            })
            .catch(error => {
              console.error('[BACKGROUND] Erro ao obter favicon:', error);
              sendResponse({
                status: 'error',
                message: error.message,
                fallbackIcon: browser.runtime.getURL('src/assets/icons/globe.png')
              });
            });
          return true;
          
        case 'contentScript:ready':
        case 'contentScriptReady':
          console.log('[BACKGROUND] Content script pronto no tab:', sender.tab?.id);
          sendResponse({
            status: 'acknowledged',
            extensionId: browser.runtime.id,
            backgroundReady: true
          });
          return true;
          
        case 'clearCache':
        case 'clear-cache':
          console.log('[BACKGROUND] Limpando cache...');
          if (DeepAliasBackground.searchEngine) {
            DeepAliasBackground.searchEngine.clearCache();
            sendResponse({ status: 'success', message: 'Cache limpo' });
          } else {
            sendResponse({ status: 'error', message: 'Motor de busca não inicializado' });
          }
          return true;
          
        case 'getSearchStats':
        case 'get-search-stats':
          console.log('[BACKGROUND] Solicitando estatísticas de busca...');
          if (DeepAliasBackground.searchEngine) {
            const searchStats = DeepAliasBackground.searchEngine.getStats();
            sendResponse({ 
              status: 'success', 
              stats: searchStats || { totalSearches: 0, cacheHits: 0, averageTime: 0 }
            });
          } else {
            sendResponse({ 
              status: 'error', 
              message: 'Motor de busca não inicializado',
              stats: { totalSearches: 0, cacheHits: 0, averageTime: 0 }
            });
          }
          return true;
          
        default:
          console.warn(`[BACKGROUND] Tipo de mensagem desconhecido: ${messageType}`);
          sendResponse({ 
            status: 'warning', 
            message: `Tipo de mensagem não reconhecido: ${messageType}`,
            receivedMessage: message,
            sender: {
              tab: sender.tab?.id,
              url: sender.tab?.url,
              frameId: sender.frameId
            },
            availableTypes: [
              'ping', 'startSearch', 'getPlatformStats', 'reloadPlatforms',
              'openDataView', 'getSettings', 'saveSettings', 'content:loaded',
              'optionsUpdated', 'getFavicon', 'contentScript:ready', 'clearCache',
              'getSearchStats'
            ],
            timestamp: new Date().toISOString()
          });
          return true;
      }
    } catch (error) {
      console.error('[BACKGROUND] Erro ao processar mensagem:', error);
      sendResponse({ 
        status: 'error', 
        message: error.message,
        instanceId: DeepAliasBackground.instanceId,
        isMainInstance: DeepAliasBackground.isMainInstance
      });
      return true;
    }
  });
  
  // Listener para conexões port
  browser.runtime.onConnect.addListener(port => {
    if (port.name === "popup") {
      console.log("[BACKGROUND] Conexão port estabelecida com popup");
      
      port.postMessage({
        type: "connected",
        status: "ok",
        isMainInstance: DeepAliasBackground.isMainInstance,
        instanceId: DeepAliasBackground.instanceId,
        timestamp: Date.now(),
        initialized: DeepAliasBackground.isInitialized
      });
      
      port.onMessage.addListener(message => {
        console.log("[BACKGROUND] Mensagem recebida do popup via port:", message);
        
        if (message.type === "ping") {
          port.postMessage({
            type: "pong",
            status: DeepAliasBackground.isMainInstance ? "primary" : "secondary",
            isMainInstance: DeepAliasBackground.isMainInstance,
            instanceId: DeepAliasBackground.instanceId,
            timestamp: Date.now(),
            initialized: DeepAliasBackground.isInitialized
          });
        } else if (message.type === "init") {
          port.postMessage({
            type: "connected",
            status: "ok",
            isMainInstance: DeepAliasBackground.isMainInstance,
            instanceId: DeepAliasBackground.instanceId,
            timestamp: Date.now(),
            initialized: DeepAliasBackground.isInitialized
          });
        }
      });
      
      port.onDisconnect.addListener(() => {
        console.log("[BACKGROUND] Popup desconectado via port");
      });
    }
  });
  
  console.log('[BACKGROUND] Event listeners configurados com sucesso');
}

// ========================================
// 7. FUNÇÕES DE NOTIFICAÇÃO
// ========================================

function showWelcomeMessage() {
  try {
    if (browser.notifications) {
      browser.notifications.create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('src/assets/icons/icon48.png'),
        title: 'DeepAlias Hunter Pro',
        message: 'Bem-vindo! Extensão instalada com sucesso. Clique no ícone para começar.'
      });
    }
    
    setTimeout(() => {
      browser.tabs.create({
        url: browser.runtime.getURL('src/options/options.html')
      });
    }, 2000);
  } catch (error) {
    console.error('[BACKGROUND] Erro ao mostrar mensagem de boas-vindas:', error);
  }
}

function showUpdateMessage(previousVersion) {
  try {
    if (browser.notifications) {
      browser.notifications.create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('src/assets/icons/icon48.png'),
        title: 'DeepAlias Hunter Pro',
        message: `Atualizado para v5.0.0 (anterior: ${previousVersion}). Novas funcionalidades disponíveis!`
      });
    }
  } catch (error) {
    console.error('[BACKGROUND] Erro ao mostrar mensagem de atualização:', error);
  }
}

// ========================================
// 8. INICIALIZAÇÃO PRINCIPAL
// ========================================

/**
 * Inicializa o script de background
 */
function initializeBackgroundScript() {
  try {
    console.log('[BACKGROUND] Background script iniciando...', {
      browser: 'Firefox',
      timestamp: new Date().toISOString(),
      version: '5.0.0',
      instanceId: DeepAliasBackground.instanceId
    });
    
    setupEventListeners();
    
    checkAndAcquireLock();
    DeepAliasBackground.lockCheckInterval = setInterval(checkAndAcquireLock, 5000);
    
    window.addEventListener('beforeunload', releaseLock);
    
    window.isMainInstance = DeepAliasBackground.isMainInstance;
    window.instanceId = DeepAliasBackground.instanceId;
    window.platformService = DeepAliasBackground.platformService;
    window.dataAnalyzer = DeepAliasBackground.dataAnalyzer;
    window.searchEngine = DeepAliasBackground.searchEngine;
    
    console.log('[BACKGROUND] ✅ Background script inicializado com sucesso!');
    
  } catch (error) {
    console.error('[BACKGROUND] ❌ Erro durante inicialização:', error);
  }
}

// ========================================
// 9. INICIALIZAÇÃO AUTOMÁTICA
// ========================================

if (!DeepAliasBackground.scriptInitialized) {
  DeepAliasBackground.scriptInitialized = true;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBackgroundScript);
  } else {
    initializeBackgroundScript();
  }
}

console.log('[BACKGROUND] Script carregado - instanceId:', DeepAliasBackground.instanceId);

// Exportar para uso externo
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleSearchRequest,
    handlePlatformStatsRequest,
    handleReloadPlatformsRequest,
    handleFaviconRequest,
    openDataView,
    performQuickSearch
  };
}