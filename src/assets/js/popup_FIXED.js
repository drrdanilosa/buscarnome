/**
 * Popup.js - Script principal para o popup da extensão
 * @version 4.0.0 - FIXED
 * @author drrdanilosa
 * @date 2025-06-03
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
    console.error('[DeepAlias Popup] Nenhuma API de browser detectada!');
    return null;
  }
})();

// Verificação de segurança
if (!browserAPI) {
  console.error('[DeepAlias Popup] ERRO CRÍTICO: API do browser não disponível!');
}

// ✅ CORREÇÃO CRÍTICA: Função de comunicação robusta com retry e melhor tratamento de erros
async function sendMessageToBackground(message, timeout = 8000, maxRetries = 3) {
  // Verificar se a API está disponível
  if (!browserAPI || !browserAPI.runtime) {
    throw new Error('API do browser não disponível');
  }
  
  // Detectar tipo de browser
  const isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[DeepAlias Popup] Tentativa ${attempt}/${maxRetries} - Enviando:`, message.type || message.action);
      
      if (isFirefox) {
        // Firefox: Promise-based com timeout melhorado
        const response = await Promise.race([
          browserAPI.runtime.sendMessage(message),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout na comunicação Firefox (tentativa ${attempt}/${maxRetries})`)), timeout)
          )
        ]);
        
        console.log(`[DeepAlias Popup] ✅ Firefox - Resposta recebida (tentativa ${attempt}):`, response?.success);
        return response;
        
      } else {
        // Chrome/Edge: Callback-based com timeout robusto
        const response = await new Promise((resolve, reject) => {
          let responseReceived = false;
          
          const timeoutId = setTimeout(() => {
            if (!responseReceived) {
              responseReceived = true;
              reject(new Error(`Timeout na comunicação Chrome/Edge (tentativa ${attempt}/${maxRetries})`));
            }
          }, timeout);
          
          browserAPI.runtime.sendMessage(message, (response) => {
            if (!responseReceived) {
              responseReceived = true;
              clearTimeout(timeoutId);
              
              if (browserAPI.runtime.lastError) {
                reject(new Error(`Chrome Runtime Error: ${browserAPI.runtime.lastError.message}`));
              } else {
                resolve(response);
              }
            }
          });
        });
        
        console.log(`[DeepAlias Popup] ✅ Chrome - Resposta recebida (tentativa ${attempt}):`, response?.success);
        return response;
      }
      
    } catch (error) {
      console.warn(`[DeepAlias Popup] ⚠️ Tentativa ${attempt} falhou:`, error.message);
      
      if (attempt === maxRetries) {
        // Última tentativa - lançar erro com contexto completo
        throw new Error(`Falha na comunicação após ${maxRetries} tentativas: ${error.message}`);
      }
      
      // Aguardar progressivamente mais tempo antes da próxima tentativa
      const delayMs = 1000 * attempt + Math.random() * 500; // 1s, 2s, 3s + jitter
      console.log(`[DeepAlias Popup] ⏳ Aguardando ${delayMs}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// Elementos da interface
const searchForm = document.getElementById('search-form');
const usernameInput = document.getElementById('username-input');
const searchButton = document.getElementById('search-button');
const toggleOptions = document.getElementById('toggle-options');
const advancedOptions = document.getElementById('advanced-options');
const includeAdult = document.getElementById('include-adult');
const includeTor = document.getElementById('include-tor');
const maxVariations = document.getElementById('max-variations');
const priorityCategories = document.querySelectorAll('input[name="priority-category"]');
const resultsContainer = document.getElementById('results-container');
const statusBar = document.getElementById('status-bar');
const progressBar = document.getElementById('progress-bar');
const statusText = document.getElementById('status-text');
const cancelButton = document.getElementById('cancel-button');
const resultsList = document.getElementById('results-list');
const noResults = document.getElementById('no-results');
const resultsSummary = document.getElementById('results-summary');
const foundCount = document.getElementById('found-count');
const highRiskCount = document.getElementById('high-risk-count');
const platformsCount = document.getElementById('platforms-count');
const exportOptions = document.getElementById('export-options');
const exportJson = document.getElementById('export-json');
const exportCsv = document.getElementById('export-csv');
const exportHtml = document.getElementById('export-html');
const openSettings = document.getElementById('open-settings');
const openHelp = document.getElementById('open-help');
const openAbout = document.getElementById('open-about');

// Estado da aplicação
let currentSearchId = null;
let searchResults = null;
let statusCheckInterval = null;
let communicationHealthy = false;

// Inicialização
document.addEventListener('DOMContentLoaded', initialize);

/**
 * Inicializa o popup - MELHORADO com verificação de saúde da comunicação
 */
async function initialize() {
  console.log('🚀 Inicializando popup DeepAlias v4.0.0...');
  
  try {
    // ✅ NOVO: Verificar saúde da comunicação primeiro
    await testCommunicationHealth();
    
    // Configurar event listeners
    setupEventListeners();
    
    // ✅ CORREÇÃO: Carregar configurações com tratamento de erro robusto
    await loadSettings();
    
    console.log('✅ Popup inicializado com sucesso');
    updateUIState('ready');
    
  } catch (error) {
    console.error('❌ Erro na inicialização do popup:', error);
    updateUIState('error', error.message);
  }
}

/**
 * ✅ NOVO: Testa a saúde da comunicação com background
 */
async function testCommunicationHealth() {
  try {
    console.log('🏥 Testando saúde da comunicação...');
    
    const pingResponse = await sendMessageToBackground({
      type: 'ping',
      timestamp: Date.now(),
      source: 'popup_health_check'
    }, 5000, 2);
    
    if (pingResponse?.success && pingResponse.pong) {
      communicationHealthy = true;
      console.log('✅ Comunicação saudável - Background respondeu em', Date.now() - pingResponse.receivedAt, 'ms');
    } else {
      throw new Error('Background não respondeu ao ping corretamente');
    }
    
  } catch (error) {
    communicationHealthy = false;
    console.error('❌ Comunicação com background não está saudável:', error.message);
    throw error;
  }
}

/**
 * ✅ NOVO: Configura todos os event listeners
 */
function setupEventListeners() {
  console.log('🔗 Configurando event listeners...');
  
  // Event listeners principais
  if (searchForm) searchForm.addEventListener('submit', handleSearch);
  if (toggleOptions) toggleOptions.addEventListener('click', toggleAdvancedOptions);
  if (cancelButton) cancelButton.addEventListener('click', cancelSearch);
  
  // Event listeners de exportação
  if (exportJson) exportJson.addEventListener('click', () => exportResults('json'));
  if (exportCsv) exportCsv.addEventListener('click', () => exportResults('csv'));
  if (exportHtml) exportHtml.addEventListener('click', () => exportResults('html'));
  
  // Event listeners de navegação
  if (openSettings) openSettings.addEventListener('click', openSettingsPage);
  if (openHelp) openHelp.addEventListener('click', openHelpPage);
  if (openAbout) openAbout.addEventListener('click', openAboutPage);
  
  // Diagnóstico Firefox
  const diagnosticoFirefox = document.getElementById('firefoxDiagnostic');
  if (diagnosticoFirefox) {
    diagnosticoFirefox.addEventListener('click', executarDiagnosticoFirefox);
  }
  
  console.log('✅ Event listeners configurados');
}

/**
 * ✅ NOVO: Atualiza estado da UI
 */
function updateUIState(state, message = '') {
  const states = {
    ready: { color: '#2ecc71', text: 'Pronto' },
    searching: { color: '#3498db', text: 'Buscando...' },
    error: { color: '#e74c3c', text: 'Erro' },
    loading: { color: '#f39c12', text: 'Carregando...' }
  };
  
  if (statusText && states[state]) {
    statusText.textContent = message || states[state].text;
    statusText.style.color = states[state].color;
  }
}

/**
 * Carrega configurações salvas - MELHORADO com fallback robusto
 */
async function loadSettings() {
  try {
    console.log('🔧 Carregando configurações...');
    updateUIState('loading', 'Carregando configurações...');
    
    // Usar função auxiliar com retry específico para configurações
    const response = await sendMessageToBackground({
      type: 'getSettings'
    }, 6000, 2); // timeout médio, poucas tentativas para configurações
    
    if (response?.success && response.settings) {
      const settings = response.settings;
      console.log('✅ Configurações carregadas:', Object.keys(settings).join(', '));
      
      // Aplicar configurações à interface de forma segura
      safelyApplySettings(settings);
      
    } else {
      console.warn('⚠️ Resposta inválida ao carregar configurações:', response);
      applyDefaultSettings();
    }
  } catch (error) {
    console.error('❌ Erro ao carregar configurações:', error);
    applyDefaultSettings();
  }
}

/**
 * ✅ NOVO: Aplica configurações de forma segura verificando elementos
 */
function safelyApplySettings(settings) {
  try {
    if (includeAdult) {
      includeAdult.checked = settings.includeAdult !== false;
    }
    
    if (includeTor) {
      includeTor.checked = settings.includeTor === true;
    }
    
    if (settings.maxVariations && maxVariations) {
      maxVariations.value = settings.maxVariations.toString();
    }
    
    if (settings.priorityCategories && Array.isArray(settings.priorityCategories) && priorityCategories) {
      priorityCategories.forEach(checkbox => {
        if (checkbox && checkbox.value) {
          checkbox.checked = settings.priorityCategories.includes(checkbox.value);
        }
      });
    }
    
    console.log('✅ Configurações aplicadas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao aplicar configurações:', error);
    applyDefaultSettings();
  }
}

/**
 * Aplica configurações padrão em caso de erro
 */
function applyDefaultSettings() {
  console.log('🔧 Aplicando configurações padrão...');
  
  try {
    if (includeAdult) includeAdult.checked = true;
    if (includeTor) includeTor.checked = false;
    if (maxVariations) maxVariations.value = '3';
    
    // Desmarcar todas as categorias de prioridade
    if (priorityCategories) {
      priorityCategories.forEach(checkbox => {
        if (checkbox) checkbox.checked = false;
      });
    }
    
    console.log('✅ Configurações padrão aplicadas');
  } catch (error) {
    console.error('❌ Erro ao aplicar configurações padrão:', error);
  }
}

/**
 * Manipula a submissão do formulário de busca
 * @param {Event} event - Evento de submissão
 */
async function handleSearch(event) {
  event.preventDefault();
  
  const username = usernameInput?.value?.trim();
  if (!username) {
    console.warn('⚠️ Username vazio');
    return;
  }
  
  // Verificar saúde da comunicação antes de iniciar busca
  if (!communicationHealthy) {
    try {
      await testCommunicationHealth();
    } catch (error) {
      handleSearchError('Falha na comunicação com background script. Tente recarregar a extensão.');
      return;
    }
  }
  
  // Obter opções avançadas de forma segura
  const options = gatherSearchOptions();
  
  console.log('🎯 Iniciando busca para:', username, 'com opções:', options);
  
  // Salvar configurações
  await saveSettings(options);
  
  // Iniciar busca
  await startSearch(username, options);
}

/**
 * ✅ NOVO: Coleta opções de busca de forma segura
 */
function gatherSearchOptions() {
  const options = {
    includeAdult: includeAdult?.checked ?? true,
    includeTor: includeTor?.checked ?? false,
    maxVariationsPerPlatform: parseInt(maxVariations?.value || '3', 10),
    priorityCategories: []
  };
  
  // Coletar categorias de prioridade selecionadas
  if (priorityCategories) {
    try {
      options.priorityCategories = Array.from(priorityCategories)
        .filter(checkbox => checkbox && checkbox.checked && checkbox.value)
        .map(checkbox => checkbox.value);
    } catch (error) {
      console.warn('⚠️ Erro ao coletar categorias de prioridade:', error);
      options.priorityCategories = [];
    }
  }
  
  return options;
}

/**
 * Inicia uma nova busca com comunicação robusta - MELHORADO
 * @param {string} username - Username a ser buscado
 * @param {object} options - Opções de busca
 */
async function startSearch(username, options) {
  console.log('🔍 Iniciando busca...', { username, optionsCount: Object.keys(options).length });
  
  // Resetar estado
  resetSearchState();
  
  // Atualizar interface
  updateSearchUI('starting');
  
  try {
    console.log('📤 Enviando requisição de busca...');
    updateUIState('searching', 'Enviando requisição...');
    
    const response = await sendMessageToBackground({
      type: 'search',
      data: {
        username,
        options
      }
    }, 15000, 3); // timeout maior, mais tentativas para busca
    
    if (response?.success) {
      currentSearchId = response.searchId;
      console.log('✅ Busca iniciada com ID:', currentSearchId);
      
      // Iniciar verificação de status com frequência otimizada
      statusCheckInterval = setInterval(checkSearchStatus, 1000); // verificar a cada 1 segundo
      
      updateUIState('searching', 'Busca em andamento...');
      
    } else {
      const errorMsg = response?.error || 'Erro desconhecido ao iniciar busca';
      console.error('❌ Erro na busca:', errorMsg);
      handleSearchError(errorMsg);
    }
  } catch (error) {
    console.error('❌ Exceção na busca:', error);
    handleSearchError(error.message || 'Erro ao comunicar com background script');
  }
}

/**
 * ✅ NOVO: Atualiza UI específica da busca
 */
function updateSearchUI(phase) {
  const phases = {
    starting: {
      searchButtonDisabled: true,
      cancelButtonVisible: true,
      progressWidth: '0%',
      clearResults: true
    },
    running: {
      searchButtonDisabled: true,
      cancelButtonVisible: true
    },
    completed: {
      searchButtonDisabled: false,
      cancelButtonVisible: false,
      progressWidth: '100%'
    },
    error: {
      searchButtonDisabled: false,
      cancelButtonVisible: false
    }
  };
  
  const config = phases[phase];
  if (!config) return;
  
  if (searchButton && 'searchButtonDisabled' in config) {
    searchButton.disabled = config.searchButtonDisabled;
  }
  
  if (cancelButton && 'cancelButtonVisible' in config) {
    cancelButton.style.display = config.cancelButtonVisible ? 'block' : 'none';
  }
  
  if (progressBar && 'progressWidth' in config) {
    progressBar.style.width = config.progressWidth;
  }
  
  if (config.clearResults) {
    if (resultsList) resultsList.innerHTML = '';
    if (noResults) noResults.style.display = 'none';
    if (resultsSummary) resultsSummary.style.display = 'none';
    if (exportOptions) exportOptions.style.display = 'none';
  }
}

/**
 * Verifica o status da busca atual - MELHORADO com detecção de falhas
 */
async function checkSearchStatus() {
  if (!currentSearchId) {
    clearInterval(statusCheckInterval);
    statusCheckInterval = null;
    return;
  }
  
  try {
    const response = await sendMessageToBackground({
      type: 'getStatus',
      data: {
        searchId: currentSearchId
      }
    }, 5000, 1); // timeout menor, uma tentativa apenas para status
    
    if (response?.success && response.status) {
      console.log('📊 Status atualizado:', response.status.progress + '%');
      updateSearchProgress(response.status);
      
      // Se a busca foi concluída ou cancelada
      if (['completed', 'cancelled', 'error'].includes(response.status.status)) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
        
        if (response.status.status === 'completed') {
          handleSearchComplete(response.status);
        } else if (response.status.status === 'error') {
          handleSearchError(response.status.error || 'Erro durante a busca');
        } else if (response.status.status === 'cancelled') {
          updateUIState('ready', 'Busca cancelada');
          updateSearchUI('completed');
        }
      }
    } else {
      console.warn('⚠️ Status não encontrado para busca:', currentSearchId);
      // Não cancelar ainda, pode ser temporal
    }
  } catch (error) {
    console.warn('⚠️ Erro ao verificar status (continuando...):', error.message);
    // Não cancelar imediatamente, pode ser um problema temporal
  }
}

/**
 * Atualiza o progresso da busca na interface
 * @param {object} status - Status da busca
 */
function updateSearchProgress(status) {
  const progress = status.progress || 0;
  if (progressBar) progressBar.style.width = `${progress}%`;
  
  if (status.status === 'running') {
    updateUIState('searching', `Buscando... ${progress}% (${status.platformsChecked || 0}/${status.platformsTotal || 0})`);
    
    // Atualizar resultados parciais se disponíveis
    if (status.results && status.results.length > 0) {
      updateResultsList(status.results);
    }
  }
}

/**
 * Manipula a conclusão da busca
 * @param {object} status - Status final da busca
 */
function handleSearchComplete(status) {
  console.log('✅ Busca concluída:', status);
  
  updateSearchUI('completed');
  updateUIState('ready', 'Busca concluída');
  
  // Salvar resultados
  searchResults = status.results || [];
  
  // Atualizar lista de resultados
  updateResultsList(searchResults);
  
  // Atualizar resumo
  const found = searchResults.filter(r => r.found).length;
  const highRisk = searchResults.filter(r => r.found && r.riskScore >= 70).length;
  
  if (foundCount) foundCount.textContent = found.toString();
  if (highRiskCount) highRiskCount.textContent = highRisk.toString();
  if (platformsCount) platformsCount.textContent = searchResults.length.toString();
  
  if (resultsSummary) resultsSummary.style.display = 'flex';
  
  // Mostrar opções de exportação se houver resultados
  if (found > 0 && exportOptions) {
    exportOptions.style.display = 'flex';
  }
  
  // Mostrar mensagem de nenhum resultado se necessário
  if (found === 0 && noResults) {
    noResults.style.display = 'block';
  }
}

/**
 * Manipula erros durante a busca - MELHORADO
 * @param {string} errorMessage - Mensagem de erro
 */
function handleSearchError(errorMessage) {
  console.error('❌ Erro na busca:', errorMessage);
  
  updateSearchUI('error');
  updateUIState('error', 'Erro na busca');
  
  // Mostrar mensagem de erro mais amigável
  if (resultsList) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.style.cssText = `
      padding: 15px;
      background-color: #fee;
      border: 1px solid #fcc;
      border-radius: 4px;
      color: #c33;
      text-align: center;
      margin: 10px 0;
    `;
    
    // Simplificar mensagem para o usuário
    let userFriendlyMessage = errorMessage;
    if (errorMessage.includes('Timeout')) {
      userFriendlyMessage = 'Tempo limite excedido. Tente novamente.';
    } else if (errorMessage.includes('não disponível')) {
      userFriendlyMessage = 'Serviço temporariamente indisponível.';
    } else if (errorMessage.includes('Failed to fetch')) {
      userFriendlyMessage = 'Erro de conexão. Verifique sua internet.';
    }
    
    errorElement.innerHTML = `
      <strong>❌ Erro:</strong> ${userFriendlyMessage}
      <br><small>Detalhes técnicos: ${errorMessage}</small>
    `;
    
    resultsList.innerHTML = '';
    resultsList.appendChild(errorElement);
  }
}

/**
 * Atualiza a lista de resultados na interface - MELHORADO
 * @param {Array} results - Resultados da busca
 */
function updateResultsList(results) {
  // Filtrar apenas resultados encontrados
  const foundResults = results.filter(r => r.found);
  
  if (foundResults.length === 0) {
    return;
  }
  
  // Limpar lista atual
  if (resultsList) resultsList.innerHTML = '';
  
  // Adicionar resultados com tratamento de erro
  foundResults.forEach((result, index) => {
    try {
      const resultItem = createResultItem(result, index);
      if (resultsList && resultItem) {
        resultsList.appendChild(resultItem);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao criar item de resultado:', error, result);
    }
  });
}

/**
 * ✅ NOVO: Cria um item de resultado de forma segura
 */
function createResultItem(result, index) {
  const resultItem = document.createElement('div');
  resultItem.className = 'result-item';
  
  // Determinar nível de risco de forma segura
  let riskLevel = 'low';
  const riskScore = result.riskScore || 0;
  if (riskScore >= 70) {
    riskLevel = 'high';
  } else if (riskScore >= 40) {
    riskLevel = 'medium';
  }
  
  // Dados seguros para template
  const safeData = {
    platformName: result.platform?.name || result.platformName || 'Desconhecido',
    platformIcon: result.platform?.icon || '🔍',
    url: result.url || result.platformUrl || '#',
    riskScore: riskScore,
    riskLevel: riskLevel,
    confidence: result.confidence || 'N/A',
    variation: result.variationUsed || result.username || 'Original'
  };
  
  resultItem.innerHTML = `
    <div class="result-header">
      <div class="platform-name">
        <span class="platform-icon">${safeData.platformIcon}</span>
        ${safeData.platformName}
      </div>
      <div class="risk-badge risk-${safeData.riskLevel}">${safeData.riskScore}% risco</div>
    </div>
    <a href="${safeData.url}" class="result-url" target="_blank" rel="noopener noreferrer">${safeData.url}</a>
    <div class="result-details">
      <span class="result-confidence">Confiança: ${safeData.confidence}%</span>
      <span class="result-variation">Variação: ${safeData.variation}</span>
    </div>
  `;
  
  // Adicionar evento de clique para abrir URL de forma segura
  const urlLink = resultItem.querySelector('.result-url');
  if (urlLink && browserAPI?.tabs && safeData.url !== '#') {
    urlLink.addEventListener('click', (event) => {
      event.preventDefault();
      try {
        browserAPI.tabs.create({ url: safeData.url });
      } catch (error) {
        console.error('❌ Erro ao abrir URL:', error);
        // Fallback para window.open
        window.open(safeData.url, '_blank', 'noopener,noreferrer');
      }
    });
  }
  
  return resultItem;
}

/**
 * Cancela a busca atual
 */
async function cancelSearch() {
  if (!currentSearchId) {
    return;
  }
  
  try {
    console.log('🛑 Cancelando busca...');
    updateUIState('loading', 'Cancelando...');
    
    await sendMessageToBackground({
      type: 'cancelSearch',
      data: {
        searchId: currentSearchId
      }
    }, 5000, 2);
    
    console.log('✅ Comando de cancelamento enviado');
    
  } catch (error) {
    console.error('❌ Erro ao cancelar busca:', error);
    updateUIState('error', 'Erro ao cancelar');
  }
}

/**
 * Alterna a exibição das opções avançadas
 * @param {Event} event - Evento de clique
 */
function toggleAdvancedOptions(event) {
  event.preventDefault();
  
  if (advancedOptions && toggleOptions) {
    const isVisible = advancedOptions.style.display === 'block';
    advancedOptions.style.display = isVisible ? 'none' : 'block';
    toggleOptions.textContent = isVisible ? 'Opções avançadas' : 'Ocultar opções';
  }
}

/**
 * Salva as configurações atuais
 * @param {object} options - Opções a serem salvas
 */
async function saveSettings(options) {
  try {
    await sendMessageToBackground({
      type: 'saveSettings',
      data: {
        settings: options
      }
    }, 5000, 1);
    console.log('💾 Configurações salvas');
  } catch (error) {
    console.error('❌ Erro ao salvar configurações:', error);
  }
}

/**
 * Exporta os resultados da busca
 * @param {string} format - Formato de exportação ('json', 'csv', 'html')
 */
function exportResults(format) {
  if (!searchResults || searchResults.length === 0) {
    console.warn('⚠️ Nenhum resultado para exportar');
    return;
  }
  
  try {
    let content = '';
    let filename = `deepalias_results_${new Date().toISOString().slice(0, 10)}`;
    let mimeType = '';
    
    // Filtrar apenas resultados encontrados
    const foundResults = searchResults.filter(r => r.found);
    
    switch (format) {
      case 'json':
        content = JSON.stringify(foundResults, null, 2);
        filename += '.json';
        mimeType = 'application/json';
        break;
        
      case 'csv':
        content = generateCSV(foundResults);
        filename += '.csv';
        mimeType = 'text/csv';
        break;
        
      case 'html':
        content = generateHTML(foundResults);
        filename += '.html';
        mimeType = 'text/html';
        break;
        
      default:
        throw new Error('Formato de exportação inválido');
    }
    
    // Criar e baixar arquivo
    downloadFile(content, filename, mimeType);
    console.log('✅ Exportação concluída:', filename);
    
  } catch (error) {
    console.error('❌ Erro na exportação:', error);
  }
}

/**
 * ✅ NOVO: Gera conteúdo CSV
 */
function generateCSV(results) {
  let content = 'Platform,URL,Username,Variation,Confidence,Risk Score\n';
  
  results.forEach(result => {
    const platformName = result.platform?.name || result.platformName || 'Unknown';
    const url = result.url || result.platformUrl || '';
    const username = result.originalUsername || result.username || '';
    const variation = result.variationUsed || username;
    const confidence = result.confidence || 0;
    const riskScore = result.riskScore || 0;
    
    content += `"${platformName}","${url}","${username}","${variation}",${confidence},${riskScore}\n`;
  });
  
  return content;
}

/**
 * ✅ NOVO: Gera conteúdo HTML
 */
function generateHTML(results) {
  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>DeepAlias Hunter Pro - Resultados</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #3a56e4; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f7ff; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .high-risk { background-color: #ffebee; }
        .medium-risk { background-color: #fff8e1; }
      </style>
    </head>
    <body>
      <h1>DeepAlias Hunter Pro - Resultados da Busca</h1>
      <p>Data: ${new Date().toLocaleString()}</p>
      <p>Username: ${results[0]?.originalUsername || results[0]?.username || 'N/A'}</p>
      <p>Total de resultados: ${results.length}</p>
      
      <table>
        <tr>
          <th>Plataforma</th>
          <th>URL</th>
          <th>Variação</th>
          <th>Confiança</th>
          <th>Risco</th>
        </tr>
        ${results.map(result => {
          const riskScore = result.riskScore || 0;
          let rowClass = '';
          if (riskScore >= 70) {
            rowClass = 'high-risk';
          } else if (riskScore >= 40) {
            rowClass = 'medium-risk';
          }
          
          return `
            <tr class="${rowClass}">
              <td>${result.platform?.name || result.platformName || 'Unknown'}</td>
              <td><a href="${result.url || result.platformUrl || '#'}" target="_blank">${result.url || result.platformUrl || 'N/A'}</a></td>
              <td>${result.variationUsed || result.username || 'Original'}</td>
              <td>${result.confidence || 0}%</td>
              <td>${riskScore}%</td>
            </tr>
          `;
        }).join('')}
      </table>
      <p><small>Gerado por DeepAlias Hunter Pro v4.0.0 em ${new Date().toLocaleString()}</small></p>
    </body>
    </html>
  `;
  
  return content;
}

/**
 * ✅ NOVO: Faz download de arquivo
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  
  // Limpar
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Abre a página de configurações
 * @param {Event} event - Evento de clique
 */
function openSettingsPage(event) {
  event.preventDefault();
  if (browserAPI?.runtime?.openOptionsPage) {
    browserAPI.runtime.openOptionsPage();
  }
}

/**
 * Abre a página de ajuda
 * @param {Event} event - Evento de clique
 */
function openHelpPage(event) {
  event.preventDefault();
  if (browserAPI?.tabs && browserAPI?.runtime?.getURL) {
    browserAPI.tabs.create({ url: browserAPI.runtime.getURL('src/help/help.html') });
  }
}

/**
 * Abre a página sobre
 * @param {Event} event - Evento de clique
 */
function openAboutPage(event) {
  event.preventDefault();
  if (browserAPI?.tabs && browserAPI?.runtime?.getURL) {
    browserAPI.tabs.create({ url: browserAPI.runtime.getURL('src/about/about.html') });
  }
}

/**
 * Reseta o estado da busca
 */
function resetSearchState() {
  // Limpar intervalo de verificação de status
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval);
    statusCheckInterval = null;
  }
  
  // Resetar ID de busca
  currentSearchId = null;
  
  // Resetar resultados
  searchResults = null;
}

/**
 * Executa diagnóstico completo da extensão no Firefox - MELHORADO
 * @param {Event} event - Evento de clique
 */
async function executarDiagnosticoFirefox(event) {
  event.preventDefault();
  
  console.log('🦊 Iniciando diagnóstico Firefox...');
  
  // Criar modal de diagnóstico
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 10px;
    padding: 20px;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  `;
  
  content.innerHTML = `
    <h2 style="color: #ff6b6b; margin-bottom: 20px;">🦊 Diagnóstico Firefox</h2>
    <div id="diagnostico-results" style="font-family: monospace; font-size: 12px;">
      <div style="background: #f0f0f0; padding: 10px; border-radius: 5px; margin: 10px 0;">
        ⏳ Executando testes...
      </div>
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <button id="fechar-diagnostico" style="
        background: #ff6b6b;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin-right: 10px;
      ">Fechar</button>
      <button id="copiar-diagnostico" style="
        background: #3498db;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
      ">Copiar Relatório</button>
    </div>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  // Eventos para controles
  const fecharBtn = content.querySelector('#fechar-diagnostico');
  const copiarBtn = content.querySelector('#copiar-diagnostico');
  
  fecharBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  let relatorioCompleto = '';
  
  copiarBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(relatorioCompleto).then(() => {
      copiarBtn.textContent = '✅ Copiado!';
      setTimeout(() => {
        copiarBtn.textContent = 'Copiar Relatório';
      }, 2000);
    });
  });
  
  const resultsDiv = content.querySelector('#diagnostico-results');
  
  function addResult(message, type = 'info') {
    const div = document.createElement('div');
    const colors = {
      success: '#2ecc71',
      error: '#e74c3c',
      warning: '#f39c12',
      info: '#3498db'
    };
    
    div.style.cssText = `
      background: ${colors[type]}20;
      border-left: 4px solid ${colors[type]};
      padding: 8px;
      margin: 5px 0;
      border-radius: 3px;
    `;
    div.textContent = message;
    resultsDiv.appendChild(div);
    
    relatorioCompleto += `[${type.toUpperCase()}] ${message}\n`;
  }
  
  try {
    // Cabeçalho do relatório
    const timestamp = new Date().toLocaleString();
    relatorioCompleto = `DIAGNÓSTICO DEEPALIAS FIREFOX - ${timestamp}\n${'='.repeat(50)}\n\n`;
    
    // Teste 1: Verificar API do navegador
    addResult('🔍 Testando API do navegador...', 'info');
    
    if (typeof browser !== 'undefined' && browser.runtime) {
      addResult('✅ API browser (Firefox) detectada', 'success');
      addResult(`📦 ID da extensão: ${browser.runtime.id}`, 'info');
    } else if (typeof chrome !== 'undefined' && chrome.runtime) {
      addResult('⚠️ API chrome detectada (modo compatibilidade)', 'warning');
      addResult(`📦 ID da extensão: ${chrome.runtime.id}`, 'info');
    } else {
      addResult('❌ Nenhuma API de extensão detectada', 'error');
    }
    
    // Teste 2: Verificar comunicação com background
    addResult('📨 Testando comunicação com background...', 'info');
    
    try {
      const pingResponse = await sendMessageToBackground({
        type: 'ping',
        timestamp: Date.now(),
        source: 'diagnostico_firefox'
      }, 3000, 1);
      
      if (pingResponse?.success) {
        addResult('✅ Comunicação com background funcionando', 'success');
        addResult(`📥 Latência: ${Date.now() - pingResponse.receivedAt}ms`, 'info');
        addResult(`🔧 Serviços: ${Object.entries(pingResponse.services || {}).map(([k,v]) => `${k}:${v?'✓':'✗'}`).join(', ')}`, 'info');
      } else {
        addResult('⚠️ Background respondeu com erro', 'warning');
      }
    } catch (error) {
      addResult(`❌ Erro na comunicação: ${error.message}`, 'error');
    }
    
    // Teste 3: Verificar plataformas
    addResult('🌐 Verificando carregamento de plataformas...', 'info');
    
    try {
      const platformsResponse = await sendMessageToBackground({
        type: 'getPlatforms'
      }, 3000, 1);
      
      if (platformsResponse?.success && platformsResponse.platforms) {
        const count = platformsResponse.platforms.length;
        if (count > 0) {
          addResult(`✅ ${count} plataformas carregadas`, 'success');
          const examples = platformsResponse.platforms.slice(0, 3).map(p => p.name || p).join(', ');
          addResult(`📋 Exemplos: ${examples}`, 'info');
        } else {
          addResult('❌ Nenhuma plataforma encontrada', 'error');
        }
      } else {
        addResult('⚠️ Resposta inválida para plataformas', 'warning');
      }
    } catch (error) {
      addResult(`❌ Erro ao verificar plataformas: ${error.message}`, 'error');
    }
    
    // Teste 4: Verificar manifest
    addResult('📋 Verificando manifest...', 'info');
    
    try {
      if (browserAPI?.runtime?.getManifest) {
        const manifest = browserAPI.runtime.getManifest();
        addResult(`✅ Nome: ${manifest.name}`, 'success');
        addResult(`🔢 Versão: ${manifest.version}`, 'success');
        addResult(`📊 Manifest: v${manifest.manifest_version}`, 'success');
      } else {
        addResult('❌ Não foi possível acessar o manifest', 'error');
      }
    } catch (error) {
      addResult(`❌ Erro ao acessar manifest: ${error.message}`, 'error');
    }
    
    // Teste 5: Verificar storage
    addResult('💾 Testando storage...', 'info');
    
    try {
      const storageResponse = await sendMessageToBackground({
        type: 'testStorage'
      }, 3000, 1);
      
      if (storageResponse?.success) {
        addResult('✅ Storage funcionando', 'success');
        addResult(`🔧 Operações: ${storageResponse.operations?.join(', ') || 'N/A'}`, 'info');
      } else {
        addResult(`⚠️ Storage com problemas: ${storageResponse?.error || 'Erro desconhecido'}`, 'warning');
      }
    } catch (error) {
      addResult(`❌ Erro no teste de storage: ${error.message}`, 'error');
    }
    
    // Teste 6: Verificar serviços
    addResult('🔧 Verificando serviços internos...', 'info');
    
    try {
      const servicesResponse = await sendMessageToBackground({
        type: 'checkServices'
      }, 3000, 1);
      
      if (servicesResponse?.success) {
        const services = servicesResponse.services || {};
        Object.entries(services).forEach(([name, status]) => {
          if (status.available) {
            addResult(`✅ ${name}: disponível`, 'success');
          } else {
            addResult(`❌ ${name}: indisponível`, 'error');
          }
        });
      } else {
        addResult('⚠️ Erro ao verificar serviços', 'warning');
      }
    } catch (error) {
      addResult(`❌ Erro na verificação de serviços: ${error.message}`, 'error');
    }
    
    addResult('🎯 Diagnóstico concluído!', 'info');
    addResult(`📊 Relatório gerado em ${timestamp}`, 'info');
    
  } catch (error) {
    addResult(`❌ Erro geral no diagnóstico: ${error.message}`, 'error');
  }
}