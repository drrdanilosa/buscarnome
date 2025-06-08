/**
 * DeepAlias Hunter Pro - Popup Script
 * @author drrdanilosa
 * @version 5.0.0
 * @date 2025-06-04 04:09:35
 * @updated_by drrdanilosa
 */

// ========================================
// 1. VARIÁVEIS GLOBAIS
// ========================================

// Conexão port com o background script
let port = null;

// Cache para evitar chamadas duplicadas
const pendingRequests = new Map();
let retryCount = 0;
const MAX_RETRIES = 3;
let mainInstanceId = null;
let currentInstanceId = null;
let isProxyConnection = false;

// Configurações da busca
let searchConfig = {
  maxResults: 50,
  timeout: 30000,
  advancedSearch: false,
  searchAll: true,
  enableNotifications: true
};

// Status de conexão
let connectionStatus = 'connecting';

// Resultados da última busca
let lastSearchResults = [];

// ========================================
// 2. FUNÇÕES UTILITÁRIAS (DEFINIDAS PRIMEIRO)
// ========================================

/**
 * Obtém configurações do armazenamento local
 */
function getLocalSettings() {
  try {
    const settingsStr = localStorage.getItem('deepaliasSettings');
    if (settingsStr) {
      return JSON.parse(settingsStr);
    }
  } catch (e) {
    console.warn('[DeepAlias Popup] Erro ao ler configurações do localStorage:', e);
  }
  
  // Configurações padrão
  return {
    maxResults: 50,
    timeout: 30000,
    advancedSearch: false,
    searchAll: true,
    enableNotifications: true,
    lastUpdated: new Date().toISOString(),
    source: 'default'
  };
}

/**
 * Exibe ou esconde o indicador de carregamento
 * @param {boolean} show - Se deve mostrar ou esconder
 */
function showLoading(show) {
  const loadingIndicator = document.getElementById('loading-indicator');
  const searchButton = document.getElementById('search-button');
  
  if (loadingIndicator) {
    loadingIndicator.style.display = show ? 'block' : 'none';
  }
  
  if (searchButton) {
    searchButton.disabled = show;
    searchButton.textContent = show ? 'Buscando...' : '🔍 Buscar';
  }
}

/**
 * Exibe mensagem de erro
 * @param {string} message - Mensagem de erro
 */
function showError(message) {
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.className = 'error-container';
    errorContainer.style.display = 'block';
    
    // Esconder após 5 segundos
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 5000);
  }
  console.error('[DeepAlias Popup] Error:', message);
}

/**
 * Exibe mensagem de sucesso ou informação
 * @param {string} message - Mensagem a exibir
 * @param {string} type - Tipo da mensagem ('info', 'success', 'error')
 */
function showMessage(message, type = 'info') {
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.className = `error-container ${type}`;
    errorContainer.style.display = 'block';
    
    // Esconder após 5 segundos
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 5000);
  }
  console.log(`[DeepAlias Popup] ${type}:`, message);
}

/**
 * Gera URL de favicon com bypass de CORS
 * @param {string} platform - Nome da plataforma
 * @returns {string} - URL do favicon
 */
function getFaviconUrl(platform) {
  // Mapear plataformas conhecidas para domínios corretos
  const platformDomains = {
    'GitHub': 'github.com',
    'LinkedIn': 'linkedin.com',
    'Twitter': 'twitter.com',
    'Instagram': 'instagram.com',
    'Facebook': 'facebook.com',
    'YouTube': 'youtube.com',
    'TikTok': 'tiktok.com',
    'Reddit': 'reddit.com',
    'Discord': 'discord.com',
    'Telegram': 'telegram.org',
    'WhatsApp': 'whatsapp.com',
    'Snapchat': 'snapchat.com',
    'Pinterest': 'pinterest.com',
    'Tumblr': 'tumblr.com',
    'Twitch': 'twitch.tv',
    'Steam': 'steamcommunity.com',
    'Xbox': 'xbox.com',
    'PlayStation': 'playstation.com',
    'Epic Games': 'epicgames.com',
    'Origin': 'origin.com'
  };
  
  const domain = platformDomains[platform] || platform.toLowerCase().replace(/\s+/g, '') + '.com';
  
  // Usar serviço do Google para favicon com fallback
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

/**
 * Sistema para enviar mensagens para o background script
 * @param {Object} message - Mensagem a ser enviada
 * @param {number} [timeout=5000] - Timeout em ms
 * @returns {Promise} - Promessa com resposta ou erro
 */
function sendMessageToBackground(message, timeout = 5000) {
  console.log('[DeepAlias Popup] Enviando mensagem para background:', message);
  
  // Criar identificador único para esta mensagem
  const messageId = `${message.type || message.action}-${Date.now()}`;
  
  // Verificar se já existe uma requisição pendente similar
  const pendingKey = message.type || message.action;
  if (pendingRequests.has(pendingKey)) {
    console.log(`[DeepAlias Popup] Requisição pendente de tipo ${pendingKey} encontrada, aguardando...`);
    return pendingRequests.get(pendingKey);
  }
  
  // Criar promessa para esta requisição
  const requestPromise = new Promise((resolve, reject) => {
    try {
      console.log('[DeepAlias Popup] Detectado navegador: Firefox');
      
      // Adicionar timestamp e ID à mensagem
      const enhancedMessage = {
        ...message,
        _timestamp: Date.now(),
        _source: 'popup',
        _messageId: messageId
      };
      
      // Configurar timeout
      const timeoutId = setTimeout(() => {
        console.error('[DeepAlias Popup] Timeout excedido ao enviar mensagem para background');
        
        // Limpar do mapa de pendentes
        pendingRequests.delete(pendingKey);
        
        // Tentar novamente?
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`[DeepAlias Popup] Tentando novamente (${retryCount}/${MAX_RETRIES})...`);
          
          // Chamar novamente com atraso exponencial
          setTimeout(() => {
            sendMessageToBackground(message, timeout)
              .then(resolve)
              .catch(reject);
          }, 1000 * retryCount);
          
          return;
        }
        
        reject(new Error('Timeout ao comunicar com background script'));
      }, timeout);
      
      // Enviar mensagem usando API do navegador
      browser.runtime.sendMessage(enhancedMessage)
        .then(response => {
          clearTimeout(timeoutId);
          pendingRequests.delete(pendingKey);
          retryCount = 0;
          
          if (!response) {
            reject(new Error('Resposta vazia do background'));
            return;
          }
          
          // Se for resposta de ping com isMainInstance, armazenar o ID
          if (message.type === 'ping' || message.action === 'check-connection') {
            handleConnectionResponse(response);
          }
          
          // Para mensagens normais, apenas resolver com a resposta
          resolve(response);
        })
        .catch(error => {
          console.error('[DeepAlias Popup] Erro ao enviar mensagem:', error);
          clearTimeout(timeoutId);
          pendingRequests.delete(pendingKey);
          
          // Tentar usar localStorage como fallback para algumas operações
          if (message.type === 'getSettings' || message.action === 'get-settings') {
            const settings = getLocalSettings();
            if (settings && Object.keys(settings).length > 0) {
              console.log('[DeepAlias Popup] Usando configurações do localStorage como fallback');
              resolve({ status: 'success', settings, source: 'localStorage' });
              return;
            }
          }
          
          reject(error);
        });
        
    } catch (error) {
      console.error('[DeepAlias Popup] Erro geral ao enviar mensagem:', error);
      pendingRequests.delete(pendingKey);
      reject(error);
    }
  });
  
  // Armazenar promessa no mapa de pendentes
  pendingRequests.set(pendingKey, requestPromise);
  
  return requestPromise;
}

/**
 * Salva as configurações atuais
 */
async function saveSettings() {
  try {
    // Coletar valores da UI
    const settings = {
      maxResults: parseInt(document.getElementById('max-results')?.value || '50', 10),
      advancedSearch: document.getElementById('advanced-search')?.checked || false,
      searchAll: document.getElementById('search-all')?.checked || true,
      enableNotifications: true,
      lastSaved: new Date().toISOString()
    };
    
    // Validar configurações
    if (settings.maxResults < 1 || settings.maxResults > 100) {
      showMessage('O número máximo de resultados deve estar entre 1 e 100', 'error');
      return;
    }
    
    // Salvar no localStorage primeiro como backup
    try {
      localStorage.setItem('deepaliasSettings', JSON.stringify(settings));
    } catch (e) {
      console.warn('[DeepAlias Popup] Erro ao salvar configurações no localStorage:', e);
    }
    
    // Enviar para o background
    const response = await sendMessageToBackground({
      type: 'saveSettings',
      action: 'save-settings',
      data: settings
    });
    
    // Atualizar configurações locais
    searchConfig = {
      ...searchConfig,
      ...settings
    };
    
    return response;
  } catch (error) {
    console.error('[DeepAlias Popup] Erro ao salvar configurações:', error);
    
    // Se a comunicação falhar mas salvamos no localStorage, considerar parcialmente bem-sucedido
    if (localStorage.getItem('deepaliasSettings')) {
      return { 
        status: 'partial_success', 
        message: 'Configurações salvas localmente, mas não sincronizadas com o background',
        error: error.message
      };
    }
    
    throw error;
  }
}

/**
 * Obtém resultados recentes do localStorage
 * @param {string} username - Username a verificar
 * @returns {Object|null} Dados da busca ou null se não encontrado/válido
 */
function getRecentSearchResults(username) {
  try {
    const resultsStr = localStorage.getItem('deepaliasLastResults');
    if (resultsStr) {
      const results = JSON.parse(resultsStr);
      
      // Verificar se são para o mesmo username e recentes (menos de 5 minutos)
      const now = new Date();
      const resultTime = new Date(results.timestamp);
      const ageInMinutes = (now - resultTime) / 60000;
      
      if (results.username === username && ageInMinutes < 5) {
        return results;
      }
    }
  } catch (e) {
    console.warn('[DeepAlias Popup] Erro ao ler resultados do localStorage:', e);
  }
  
  return null;
}

/**
 * Salva resultados da busca no localStorage
 * @param {string} username - Username pesquisado
 * @param {Array} results - Resultados da busca
 * @param {Object} metadata - Metadados da busca
 */
function saveSearchResults(username, results, metadata) {
  try {
    const searchData = {
      username,
      results,
      instanceId: metadata.instanceId,
      timestamp: metadata.timestamp || new Date().toISOString(),
      options: searchConfig
    };
    
    localStorage.setItem('deepaliasLastResults', JSON.stringify(searchData));
    console.log('[DeepAlias Popup] Resultados salvos no localStorage');
  } catch (e) {
    console.warn('[DeepAlias Popup] Erro ao salvar resultados no localStorage:', e);
  }
}

// ========================================
// 3. FUNÇÕES PRINCIPAIS (DEFINIDAS ANTES DOS EVENT LISTENERS)
// ========================================

/**
 * Inicia a busca enviando mensagem para o background
 * @param {string} username - Username a ser pesquisado
 * @param {Object} options - Opções de busca
 */
async function startSearch(username, options) {
  try {
    console.log('[DeepAlias Popup] Enviando busca via API');
    
    // Verificar se temos resultados recentes no localStorage para esse username
    const recentResults = getRecentSearchResults(username);
    if (recentResults && !options.forceCompleteSearch) {
      console.log('[DeepAlias Popup] Encontrados resultados recentes no localStorage');
      processSearchResults(recentResults.results, {
        instanceId: recentResults.instanceId,
        searchTime: 0,
        fromCache: true
      });
      
      // Esconder loading
      showLoading(false);
      return;
    }
    
    // Tentar realizar a busca via background
    const response = await sendMessageToBackground({
      type: 'startSearch',
      action: 'start-search',
      username,
      options
    }, options.timeout || 30000);
    
    if (!response) {
      throw new Error('Resposta vazia do background script');
    }
    
    if (response.error) {
      // Se for erro de instância secundária, explicar ao usuário
      if (response.error === 'SECONDARY_INSTANCE') {
        showError('A busca não pôde ser realizada no momento porque você está conectado a uma instância secundária. Por favor, aguarde alguns segundos e tente novamente.');
      } else {
        throw new Error(response.error);
      }
      return;
    }
    
    // Processar resultados
    lastSearchResults = response.results || [];
    processSearchResults(lastSearchResults, {
      instanceId: response.instanceId,
      searchTime: response.searchTime
    });
    
    // Salvar os resultados no localStorage para acesso rápido futuro
    saveSearchResults(username, lastSearchResults, {
      instanceId: response.instanceId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[DeepAlias Popup] Exceção na busca:', error);
    showError('Erro na busca: ' + (error.message || 'Erro desconhecido ao iniciar busca'));
    throw error;
  } finally {
    // Esconder loading em qualquer caso
    showLoading(false);
  }
}

/**
 * Trata a busca por username
 * @param {string|Event} username - Username a ser pesquisado ou evento do form
 */
function handleSearch(username) {
  try {
    console.log('[DeepAlias Popup] handleSearch chamado com:', username);
    
    // Se o parâmetro for um evento, extrair o username do campo
    if (typeof username === 'object' && username.preventDefault) {
      username.preventDefault();
      username = document.getElementById('username-input')?.value?.trim();
    }
    
    // Recolher opções da interface
    const options = {
      maxResults: parseInt(document.getElementById('max-results')?.value || '50', 10),
      timeout: 30000,
      searchAll: document.getElementById('search-all')?.checked || false,
      advancedSearch: document.getElementById('advanced-search')?.checked || false,
      forceCompleteSearch: document.getElementById('force-complete-search')?.checked || false
    };
    
    // Validação básica
    if (!username || username.length < 2) {
      showError('Nome de usuário muito curto');
      return;
    }
    
    // Salvar configurações atuais
    saveSettings().catch(error => {
      console.warn('[DeepAlias Popup] Erro ao salvar configurações, continuando mesmo assim:', error);
    });
    
    // Mostrar loading
    showLoading(true);
    
    // Atualizar texto do loading se for busca completa
    if (options.forceCompleteSearch) {
      const loadingText = document.querySelector('#loading-indicator p');
      if (loadingText) {
        loadingText.textContent = 'Buscando em 400+ plataformas...';
      }
    }
    
    // Iniciar busca
    console.log('[DeepAlias Popup] Iniciando busca para:', username);
    startSearch(username, options).catch(error => {
      console.error('[DeepAlias Popup] Erro na busca:', error);
      showError('Erro ao realizar busca: ' + error.message);
      showLoading(false);
    });
    
  } catch (error) {
    console.error('[DeepAlias Popup] Erro na busca:', error);
    showError('Erro ao realizar busca: ' + error.message);
    showLoading(false);
  }
}

/**
 * Recarrega a lista de plataformas
 */
function reloadPlatforms() {
  try {
    console.log('[DeepAlias Popup] reloadPlatforms chamado');
    
    const platformStatsElement = document.getElementById('platform-stats');
    
    if (!platformStatsElement) {
      console.warn('[DeepAlias Popup] Elemento platform-stats não encontrado');
      return;
    }
    
    const platformCountElement = platformStatsElement.querySelector('.platform-count');
    const reloadButton = document.getElementById('reload-platforms');
    
    if (!platformCountElement || !reloadButton) {
      console.warn('[DeepAlias Popup] Elementos necessários não encontrados');
      return;
    }
    
    // Indicar que está recarregando
    platformCountElement.textContent = 'Recarregando plataformas...';
    reloadButton.disabled = true;
    reloadButton.textContent = '⏳';
    
    // Solicitar recarga de plataformas
    sendMessageToBackground({
      type: 'reloadPlatforms',
      action: 'reload-platforms'
    }).then(response => {
      if (response && response.status === 'success' && response.stats) {
        const total = response.stats.total || 0;
        const categories = response.stats.categories || 0;
        const isComplete = response.stats.isComplete || false;
        
        // Atualizar interface com fallback seguro
        platformCountElement.textContent = `${total} plataformas em ${categories} categorias`;
        
        // Destacar visualmente se tivermos a lista completa
        platformStatsElement.classList.remove('complete', 'incomplete');
        if (isComplete) {
          platformStatsElement.classList.add('complete');
          platformCountElement.textContent += ' ✓';
        } else {
          platformStatsElement.classList.add('incomplete');
          platformCountElement.textContent += ' ⚠️';
        }
        
        // Mostrar mensagem de sucesso
        showMessage('Plataformas recarregadas com sucesso', 'success');
      } else {
        platformCountElement.textContent = 'Erro ao recarregar plataformas';
        showError('Erro ao recarregar plataformas');
      }
      
      // Restaurar botão
      reloadButton.disabled = false;
      reloadButton.textContent = '↻';
    }).catch(error => {
      console.error('[DeepAlias Popup] Erro ao recarregar plataformas:', error);
      showError('Erro ao recarregar plataformas: ' + error.message);
      
      // Restaurar botão
      reloadButton.disabled = false;
      reloadButton.textContent = '↻';
      
      // Restaurar texto com valor seguro
      platformCountElement.textContent = 'Erro ao recarregar plataformas';
    });
  } catch (error) {
    console.error('[DeepAlias Popup] Erro ao recarregar plataformas:', error);
    showError('Erro ao recarregar plataformas: ' + error.message);
    
    // Tentar restaurar UI para um estado utilizável
    const reloadButton = document.getElementById('reload-platforms');
    if (reloadButton) {
      reloadButton.disabled = false;
      reloadButton.textContent = '↻';
    }
    
    const platformStatsElement = document.getElementById('platform-stats');
    if (platformStatsElement) {
      const platformCountElement = platformStatsElement.querySelector('.platform-count');
      if (platformCountElement) {
        platformCountElement.textContent = 'Erro ao recarregar plataformas';
      }
    }
  }
}

/**
 * Estabelece uma conexão port com o background script
 */
function connectToBackground() {
  try {
    // Criar a conexão
    port = browser.runtime.connect({ name: "popup" });
    
    // Configurar handlers para a conexão
    port.onMessage.addListener((message) => {
      console.log("[DeepAlias Popup] Mensagem recebida via port:", message);
      
      if (message.type === "connected") {
        handleConnectionResponse(message);
      } else if (message.type === "pong") {
        handleConnectionResponse(message);
      }
    });
    
    // Enviar mensagem inicial
    port.postMessage({ type: "init", message: "popup opened" });
    
    // Configurar heartbeat para manter a conexão viva
    setInterval(() => {
      if (port) {
        port.postMessage({ type: "ping", timestamp: Date.now() });
      }
    }, 5000);
    
  } catch (error) {
    console.error("[DeepAlias Popup] Erro ao conectar com o background:", error);
    updateConnectionStatus('error', {
      message: 'Falha na conexão',
      error: error.message
    });
  }
}

/**
 * Processa a resposta de verificação de conexão
 * @param {Object} response - Resposta do background
 */
function handleConnectionResponse(response) {
  const status = document.getElementById("connection-status");
  
  if (response && (response.status === 'ok' || response.status === 'connected')) {
    if (response.isMainInstance) {
      updateConnectionStatus('connected_primary', {
        instanceId: response.instanceId,
        isMainInstance: true,
        primaryInstanceId: response.instanceId
      });
    } else {
      updateConnectionStatus('connected_secondary', {
        instanceId: response.instanceId,
        isMainInstance: false,
        primaryInstanceId: response.primaryInstanceId,
        primaryActive: response.primaryActive
      });
    }
  } else if (response && response.status === 'secondary_instance') {
    updateConnectionStatus('connected_secondary', {
      instanceId: response.instanceId,
      isMainInstance: false
    });
  } else {
    updateConnectionStatus('error', {
      message: 'Erro de conexão',
      error: response?.error || 'Resposta inválida'
    });
  }
}

/**
 * Atualiza o status de conexão com detalhes
 * @param {string} status - Status da conexão
 * @param {Object} details - Detalhes adicionais
 */
function updateConnectionStatus(status, details = {}) {
  connectionStatus = status;
  
  const statusElement = document.getElementById('connection-status');
  if (!statusElement) return;
  
  let statusText = '';
  let statusClass = '';
  
  switch (status) {
    case 'connected_primary':
      statusText = 'Conectado (Principal)';
      statusClass = 'status connected primary';
      isProxyConnection = false;
      break;
    case 'connected_secondary':
      statusText = 'Conectado (Secundária)';
      statusClass = 'status connected secondary';
      isProxyConnection = true;
      break;
    case 'connecting':
      statusText = 'Conectando...';
      statusClass = 'status connecting';
      break;
    case 'error':
      statusText = details.message || 'Erro de Conexão';
      statusClass = 'status error';
      break;
    default:
      statusText = 'Desconhecido';
      statusClass = 'status unknown';
  }
  
  statusElement.textContent = statusText;
  statusElement.className = statusClass;
  
  // Adicionar tooltip com detalhes
  if (details.instanceId) {
    currentInstanceId = details.instanceId;
    
    let tooltip = `Instância: ${details.instanceId}\n`;
    if (details.primaryInstanceId && details.primaryInstanceId !== details.instanceId) {
      tooltip += `Instância principal: ${details.primaryInstanceId}\n`;
    }
    tooltip += `Última atualização: ${new Date().toLocaleTimeString()}`;
    
    statusElement.title = tooltip;
    
    if (details.isMainInstance) {
      mainInstanceId = details.instanceId;
    } else if (details.primaryInstanceId) {
      mainInstanceId = details.primaryInstanceId;
    }
  }
  
  // Atualizar UI conforme status
  updateUIBasedOnConnection();
}

/**
 * Atualiza elementos da UI com base no status de conexão
 */
function updateUIBasedOnConnection() {
  const searchButton = document.getElementById('search-button');
  const connectionInfoElement = document.getElementById('connection-info');
  
  if (!searchButton) return;
  
  // Atualizar botão de busca conforme o status
  if (connectionStatus === 'error') {
    searchButton.disabled = true;
    searchButton.title = 'Não é possível buscar: sem conexão com o background';
  } else if (isProxyConnection) {
    // Na conexão via proxy, ainda permitimos a busca, mas mostramos informação
    searchButton.disabled = false;
    searchButton.title = 'Busca disponível através da instância principal';
  } else {
    searchButton.disabled = false;
    searchButton.title = '';
  }
  
  // Mostrar informações detalhadas de conexão se houver o elemento
  if (connectionInfoElement) {
    if (isProxyConnection) {
      connectionInfoElement.style.display = 'flex';
      connectionInfoElement.innerHTML = `
        <span class="info-icon">🛰️</span>
        <span class="info-text">Conectado via instância secundária</span>
        <span class="more-info" title="A extensão está usando uma instância secundária para comunicação. Algumas operações podem depender da instância principal.">?</span>
      `;
    } else {
      connectionInfoElement.style.display = 'none';
    }
  }
}

/**
 * Verifica periodicamente a conexão com o background
 */
function checkBackgroundConnection() {
  // Verificar imediatamente
  sendPing();
  
  // Verificar a cada 2 segundos
  setInterval(sendPing, 2000);
}

/**
 * Envia ping para verificar conexão
 */
function sendPing() {
  sendMessageToBackground({ 
    type: 'ping',
    action: 'check-connection'
  }, 1000).catch(error => {
    console.warn('[DeepAlias Popup] Erro na verificação de conexão:', error);
    updateConnectionStatus('error', {
      message: 'Desconectado',
      error: error.message
    });
  });
}

/**
 * Carrega configurações do usuário
 */
async function loadSettings() {
  try {
    const response = await sendMessageToBackground({ 
      type: 'getSettings',
      action: 'get-settings'
    });
    
    if (response && response.settings) {
      applySettings(response.settings);
      
      // Se a resposta veio da instância secundária, mostre isso na UI
      if (response.source === 'localStorage') {
        console.log('[DeepAlias Popup] Configurações carregadas do localStorage');
        isProxyConnection = true;
        updateUIBasedOnConnection();
      }
      
      return response.settings;
    } else {
      throw new Error('Resposta inválida do background');
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    
    // Tentar obter do localStorage diretamente
    try {
      const settings = getLocalSettings();
      console.log('[DeepAlias Popup] Usando configurações do localStorage como fallback');
      applySettings(settings);
      return settings;
    } catch (e) {
      console.warn('[DeepAlias Popup] Erro ao ler configurações:', e);
    }
    
    // Se tudo falhar, usar configurações padrão
    applyDefaultSettings();
    return searchConfig;
  }
}

/**
 * Aplica configurações à interface
 * @param {Object} settings - Configurações a serem aplicadas
 */
function applySettings(settings) {
  // Atualizar objeto de configurações
  searchConfig = {
    ...searchConfig,
    ...settings
  };
  
  // Atualizar elementos da UI
  const maxResultsInput = document.getElementById('max-results');
  if (maxResultsInput && settings.maxResults) {
    maxResultsInput.value = settings.maxResults;
  }
  
  const advancedSearchCheckbox = document.getElementById('advanced-search');
  if (advancedSearchCheckbox && settings.advancedSearch !== undefined) {
    advancedSearchCheckbox.checked = settings.advancedSearch;
  }
  
  const searchAllCheckbox = document.getElementById('search-all');
  if (searchAllCheckbox && settings.searchAll !== undefined) {
    searchAllCheckbox.checked = settings.searchAll;
  }
  
  // Preencher o campo de usuário se houver um valor salvo
  if (settings.lastUsername) {
    const usernameInput = document.getElementById('username-input');
    if (usernameInput) {
      usernameInput.value = settings.lastUsername;
    }
  }
  
  console.log('[DeepAlias Popup] Configurações aplicadas:', searchConfig);
}

/**
 * Aplica configurações padrão
 */
function applyDefaultSettings() {
  const defaultSettings = getLocalSettings();
  applySettings(defaultSettings);
}

/**
 * Processa e exibe os resultados da busca
 * @param {Array} results - Resultados da busca
 * @param {Object} metadata - Metadados da busca
 */
function processSearchResults(results, metadata = {}) {
  const resultsContainer = document.getElementById('results-container');
  if (!resultsContainer) return;
  
  // Limpar resultados anteriores
  resultsContainer.innerHTML = '';
  
  // Salvar para referência
  lastSearchResults = results;
  
  if (!results || results.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.textContent = 'Nenhum resultado encontrado.';
    resultsContainer.appendChild(noResults);
    
    // Adicionar botão para exportar mesmo sem resultados
    addExportButton(resultsContainer, []);
    return;
  }
  
  // Adicionar header com informações da busca
  const resultsHeader = document.createElement('div');
  resultsHeader.className = 'results-info';
  
  let headerText = `${results.length} resultados encontrados`;
  if (metadata.searchTime) {
    headerText += ` em ${metadata.searchTime/1000}s`;
  }
  if (metadata.fromCache) {
    headerText += ' (cache)';
  }
  
  resultsHeader.textContent = headerText;
  resultsContainer.appendChild(resultsHeader);
  
  // Criar elemento para cada resultado
  results.forEach(result => {
    const resultElement = createResultElement(result);
    resultsContainer.appendChild(resultElement);
  });
  
  // Adicionar botão de exportação
  addExportButton(resultsContainer, results);
}

/**
 * Cria elemento HTML para um resultado
 * @param {Object} result - Resultado da busca
 * @returns {HTMLElement} - Elemento HTML do resultado
 */
function createResultElement(result) {
  const element = document.createElement('div');
  element.className = `result-item ${result.status}`;
  
  // Usar sistema de favicon com bypass de CORS
  const faviconUrl = result.favicon || getFaviconUrl(result.platform);
  
  // Criar conteúdo baseado nos dados do resultado
  element.innerHTML = `
    <div class="platform">
      <img src="${faviconUrl}" alt="${result.platform}" 
           class="platform-favicon"
           loading="lazy" />
      <span>${result.platform}</span>
    </div>
    <div class="username">${result.username}</div>
    <div class="status ${result.status}">
      ${result.status === 'found' ? '✓' : result.status === 'not_found' ? '✕' : '?'}
    </div>
    <div class="actions">
      <a href="${result.url}" target="_blank" rel="noopener noreferrer" class="action-button open-button">Abrir</a>
      <button class="action-button copy-button" data-url="${result.url}">Copiar</button>
    </div>
  `;
  
  // Adicionar event listener para botão de copiar
  const copyButton = element.querySelector('.copy-button');
  if (copyButton) {
    copyButton.addEventListener('click', () => {
      const url = copyButton.getAttribute('data-url');
      navigator.clipboard.writeText(url).then(() => {
        copyButton.textContent = 'Copiado!';
        setTimeout(() => {
          copyButton.textContent = 'Copiar';
        }, 1500);
      }).catch(error => {
        console.error('[DeepAlias Popup] Erro ao copiar URL:', error);
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        copyButton.textContent = 'Copiado!';
        setTimeout(() => {
          copyButton.textContent = 'Copiar';
        }, 1500);
      });
    });
  }
  
  return element;
}

/**
 * Adiciona botão de exportação aos resultados
 * @param {HTMLElement} container - Container onde adicionar o botão
 * @param {Array} results - Resultados para exportar
 */
function addExportButton(container, results) {
  const exportContainer = document.createElement('div');
  exportContainer.className = 'export-container';
  
  const exportButton = document.createElement('button');
  exportButton.className = 'export-button';
  exportButton.textContent = 'Exportar Resultados';
  exportButton.addEventListener('click', () => showExportOptions(results));
  
  exportContainer.appendChild(exportButton);
  container.appendChild(exportContainer);
}

/**
 * Exibe opções para exportação (implementação simplificada)
 * @param {Array} results - Resultados para exportar
 */
function showExportOptions(results) {
  try {
    // Formato JSON simplificado para exportação
    const exportData = {
      timestamp: new Date().toISOString(),
      totalResults: results.length,
      results: results.map(result => ({
        platform: result.platform,
        username: result.username,
        url: result.url,
        status: result.status
      })),
      exportedBy: 'DeepAlias Hunter Pro v5.0.0'
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Criar e baixar arquivo
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepalias_export_${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('Resultados exportados com sucesso!', 'success');
    
  } catch (error) {
    console.error('[DeepAlias Popup] Erro ao exportar resultados:', error);
    showError('Erro ao exportar resultados: ' + error.message);
  }
}

/**
 * Carrega estatísticas das plataformas
 */
async function loadPlatformStats() {
  try {
    const platformStatsElement = document.getElementById('platform-stats');
    
    if (!platformStatsElement) return;
    
    const platformCountElement = platformStatsElement.querySelector('.platform-count');
    
    if (!platformCountElement) return;
    
    // Solicitar estatísticas do serviço de plataformas
    const response = await sendMessageToBackground({
      type: 'getPlatformStats',
      action: 'get-platform-stats'
    });
    
    if (response && response.status === 'success' && response.stats) {
      // Usar valores seguros com fallback
      const total = response.stats.total || 0;
      const categories = response.stats.categories || 0;
      const isComplete = response.stats.isComplete || false;
      
      // Atualizar interface
      platformCountElement.textContent = `${total} plataformas em ${categories} categorias`;
      
      // Destacar visualmente se tivermos a lista completa
      if (isComplete) {
        platformStatsElement.classList.add('complete');
        platformCountElement.textContent += ' ✓';
      } else {
        platformStatsElement.classList.add('incomplete');
        platformCountElement.textContent += ' ⚠️';
      }
    } else {
      platformCountElement.textContent = 'Não foi possível carregar estatísticas';
    }
  } catch (error) {
    console.error('[DeepAlias Popup] Erro ao carregar estatísticas de plataformas:', error);
    
    const platformStatsElement = document.getElementById('platform-stats');
    if (platformStatsElement) {
      const platformCountElement = platformStatsElement.querySelector('.platform-count');
      if (platformCountElement) {
        platformCountElement.textContent = 'Erro ao carregar estatísticas';
      }
    }
  }
}

/**
 * Abre a visualização de dados
 */
function openDataView() {
  browser.runtime.sendMessage({ type: 'openDataView', action: 'open-data-view' })
    .catch(error => {
      console.error('[DeepAlias Popup] Erro ao abrir visualização de dados:', error);
    });
}

// ========================================
// 4. FUNÇÃO DE INICIALIZAÇÃO
// ========================================

/**
 * Inicializa a interface do popup
 */
function initialize() {
  console.log('[DeepAlias Popup] Inicializando popup...');
  
  try {
    // Estabelecer conexão port com o background script
    connectToBackground();
    
    // Verificar periodicamente a conexão com o background
    checkBackgroundConnection();
    
    // Carregar configurações
    loadSettings().catch(error => {
      console.error('Erro ao carregar configurações:', error);
      
      // Usar configurações padrão se houver erro
      applyDefaultSettings();
    });
    
    // Verificar se há um username pré-definido para busca
    browser.storage.local.get('lastSearchUsername')
      .then(data => {
        if (data.lastSearchUsername) {
          const usernameInput = document.getElementById('username-input');
          if (usernameInput) {
            usernameInput.value = data.lastSearchUsername;
            
            // Limpar o valor salvo
            browser.storage.local.remove('lastSearchUsername');
          }
        }
      })
      .catch(error => {
        console.error('[DeepAlias Popup] Erro ao verificar username pré-definido:', error);
      });
    
    // Carregar estatísticas de plataformas
    loadPlatformStats();
    
    // Atualizar timestamp no footer
    const lastUpdateElement = document.getElementById('last-update-time');
    if (lastUpdateElement) {
      lastUpdateElement.textContent = new Date().toISOString().split('T')[0];
    }
    
    console.log('[DeepAlias Popup] Popup inicializado');
  } catch (error) {
    console.error('[DeepAlias Popup] Erro durante inicialização do popup:', error);
    showError('Erro ao inicializar: ' + error.message);
  }
}

// ========================================
// 5. EVENT LISTENERS (CONFIGURADOS APÓS TODAS AS FUNÇÕES)
// ========================================

// Envolver todos os event listeners em DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('[DeepAlias Popup] DOM carregado, configurando event listeners...');
    
    // Recuperar elementos da UI
    const searchButton = document.getElementById('search-button');
    const usernameInput = document.getElementById('username-input');
    const reloadPlatformsButton = document.getElementById('reload-platforms');
    const dataViewButton = document.getElementById('data-view-button');
    const exportButton = document.getElementById('export-button');
    const settingsButton = document.getElementById('settings-button');
    
    // Configurar event listeners principais
    if (searchButton) {
      searchButton.addEventListener('click', handleSearch);
      console.log('[DeepAlias Popup] Event listener para search-button configurado');
    } else {
      console.warn('[DeepAlias Popup] search-button não encontrado');
    }
    
    // Permitir Enter no campo de username
    if (usernameInput) {
      usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && usernameInput.value.trim()) {
          handleSearch(e);
        }
      });
      console.log('[DeepAlias Popup] Event listener para username-input configurado');
    } else {
      console.warn('[DeepAlias Popup] username-input não encontrado');
    }
    
    // Configurar botão de recarregar plataformas
    if (reloadPlatformsButton) {
      reloadPlatformsButton.addEventListener('click', reloadPlatforms);
      console.log('[DeepAlias Popup] Event listener para reload-platforms configurado');
    } else {
      console.warn('[DeepAlias Popup] reload-platforms não encontrado');
    }
    
    // Configurar botão de visualização de dados
    if (dataViewButton) {
      dataViewButton.addEventListener('click', openDataView);
      console.log('[DeepAlias Popup] Event listener para data-view-button configurado');
    }
    
    // Configurar botão de exportação
    if (exportButton) {
      exportButton.addEventListener('click', () => {
        showExportOptions(lastSearchResults);
      });
      console.log('[DeepAlias Popup] Event listener para export-button configurado');
    }
    
    // Configurar botão de configurações
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        browser.runtime.openOptionsPage();
      });
      console.log('[DeepAlias Popup] Event listener para settings-button configurado');
    }
    
    // Inicializar o popup
    initialize();
    
  } catch (error) {
    console.error('[DeepAlias Popup] Erro ao configurar event listeners:', error);
    
    // Tentar mostrar erro na interface se possível
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
      errorContainer.textContent = 'Erro durante inicialização: ' + error.message;
      errorContainer.style.display = 'block';
    }
  }
});

// ========================================
// 6. ESTILOS EMBUTIDOS
// ========================================

// Adicionar estilos para o botão de visualização de dados e alertas
const style = document.createElement('style');
style.textContent = `
  .data-view-container {
    margin: 10px 0;
  }

  .data-view-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    background-color: #4a6cf7;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 12px;
    cursor: pointer;
    font-weight: bold;
    width: 100%;
    transition: background-color 0.2s;
  }

  .data-view-button:hover {
    background-color: #3a56c5;
  }

  .data-view-button .icon {
    font-size: 16px;
  }

  #alert-indicator {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: #dc3545;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .export-container {
    margin-top: 15px;
    text-align: center;
  }
  
  .export-button {
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 15px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
  }
  
  .export-button:hover {
    background-color: #5a6268;
  }
  
  .result-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #eee;
    transition: background-color 0.2s;
  }
  
  .result-item:hover {
    background-color: #f8f9fa;
  }
  
  .result-item.found {
    background-color: rgba(40, 167, 69, 0.05);
    border-left: 3px solid #28a745;
  }
  
  .result-item.not_found {
    background-color: rgba(220, 53, 69, 0.05);
    border-left: 3px solid #dc3545;
  }
  
  .platform {
    width: 30%;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .platform img {
    width: 16px;
    height: 16px;
    border-radius: 2px;
  }
  
  .username {
    width: 30%;
    font-weight: bold;
    font-family: 'Courier New', monospace;
    color: #0066cc;
  }
  
  .status {
    width: 10%;
    text-align: center;
    font-weight: bold;
    font-size: 18px;
  }
  
  .status.found {
    color: #28a745;
  }
  
  .status.not_found {
    color: #dc3545;
  }
  
  .actions {
    width: 30%;
    display: flex;
    gap: 5px;
    justify-content: flex-end;
  }
  
  .action-button {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    text-decoration: none;
    color: #212529;
    display: inline-block;
    transition: all 0.2s;
  }
  
  .action-button:hover {
    background-color: #e9ecef;
    transform: translateY(-1px);
  }
  
  .open-button {
    background-color: #4a6cf7;
    color: white;
    border: none;
  }
  
  .open-button:hover {
    background-color: #3a56c5;
    color: white;
  }
  
  .copy-button:hover {
    background-color: #6c757d;
    color: white;
  }
  
  .results-info {
    font-size: 12px;
    color: #6c757d;
    margin-bottom: 10px;
    text-align: right;
    font-style: italic;
  }
  
  .no-results {
    text-align: center;
    padding: 30px 20px;
    color: #6c757d;
    font-style: italic;
    font-size: 16px;
  }
  
  #error-container {
    background-color: #f8d7da;
    color: #721c24;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 10px;
    display: none;
    border-left: 4px solid #dc3545;
    font-size: 14px;
  }
  
  #error-container.info {
    background-color: #d1ecf1;
    color: #0c5460;
    border-left-color: #17a2b8;
  }
  
  #error-container.success {
    background-color: #d4edda;
    color: #155724;
    border-left-color: #28a745;
  }
  
  #loading-indicator {
    text-align: center;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 4px;
    margin: 10px 0;
  }
  
  .status.connecting {
    color: #ffc107;
  }
  
  .status.connected {
    color: #28a745;
  }
  
  .status.error {
    color: #dc3545;
  }
  
  .platform-count {
    font-weight: bold;
  }
  
  .complete .platform-count {
    color: #28a745;
  }
  
  .incomplete .platform-count {
    color: #ffc107;
  }
`;

// Adicionar ao head do documento quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    document.head.appendChild(style);
  });
} else {
  document.head.appendChild(style);
}

console.log('[DeepAlias Popup] Script carregado e configurado');
