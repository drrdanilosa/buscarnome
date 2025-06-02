/**
 * Popup.js - Script principal para o popup da extensão
 * @version 4.0.0
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

// Função auxiliar para comunicação padronizada Firefox/Chrome
async function sendMessageToBackground(message, timeout = 5000) {
  // Verificar se a API está disponível
  if (!browserAPI || !browserAPI.runtime) {
    throw new Error('API do browser não disponível');
  }
  
  // Detecção específica Firefox vs Chrome/Edge
  const isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage;
  
  if (isFirefox) {
    // Firefox: Promise-based
    return await Promise.race([
      browserAPI.runtime.sendMessage(message),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na comunicação com background script')), timeout)
      )
    ]);
  } else {
    // Chrome/Edge: Callback-based
    return await new Promise((resolve, reject) => {
      browserAPI.runtime.sendMessage(message, (response) => {
        if (browserAPI.runtime.lastError) {
          reject(new Error(browserAPI.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
      
      // Timeout
      setTimeout(() => {
        reject(new Error('Timeout na comunicação com background script'));
      }, timeout);
    });
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

// Inicialização
document.addEventListener('DOMContentLoaded', initialize);

/**
 * Inicializa o popup
 */
async function initialize() {
  console.log('Inicializando popup...');
  
  // Configurar event listeners
  searchForm.addEventListener('submit', handleSearch);
  toggleOptions.addEventListener('click', toggleAdvancedOptions);
  cancelButton.addEventListener('click', cancelSearch);
  exportJson.addEventListener('click', () => exportResults('json'));
  exportCsv.addEventListener('click', () => exportResults('csv'));
  exportHtml.addEventListener('click', () => exportResults('html'));
  openSettings.addEventListener('click', openSettingsPage);
  openHelp.addEventListener('click', openHelpPage);
  openAbout.addEventListener('click', openAboutPage);
  
  // Carregar configurações salvas
  loadSettings();
  
  console.log('Popup inicializado');
}

/**
 * Carrega configurações salvas
 */
async function loadSettings() {
  try {
    // Usar função auxiliar para comunicação
    const response = await sendMessageToBackground({
      type: 'getSettings'
    }, 5000);
    
    if (response.success && response.settings) {
      const settings = response.settings;
      
      // Aplicar configurações à interface
      includeAdult.checked = settings.includeAdult !== false;
      includeTor.checked = settings.includeTor === true;
      
      if (settings.maxVariations) {
        maxVariations.value = settings.maxVariations;
      }
      
      if (settings.priorityCategories && Array.isArray(settings.priorityCategories)) {
        priorityCategories.forEach(checkbox => {
          checkbox.checked = settings.priorityCategories.includes(checkbox.value);
        });
      }
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    // Aplicar configurações padrão em caso de erro
    includeAdult.checked = true;
    includeTor.checked = false;
    maxVariations.value = 3;
  }
}

/**
 * Manipula a submissão do formulário de busca
 * @param {Event} event - Evento de submissão
 */
async function handleSearch(event) {
  event.preventDefault();
  
  const username = usernameInput.value.trim();
  if (!username) {
    return;
  }
  
  // Obter opções avançadas
  const options = {
    includeAdult: includeAdult.checked,
    includeTor: includeTor.checked,
    maxVariationsPerPlatform: parseInt(maxVariations.value, 10),
    priorityCategories: Array.from(priorityCategories)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value)
  };
  
  // Salvar configurações
  saveSettings(options);
  
  // Iniciar busca
  startSearch(username, options);
}

/**
 * Inicia uma nova busca com compatibilidade Firefox/Edge
 * @param {string} username - Username a ser buscado
 * @param {object} options - Opções de busca
 */
async function startSearch(username, options) {
  // Resetar estado
  resetSearchState();
  
  // Atualizar interface
  searchButton.disabled = true;
  statusText.textContent = 'Iniciando busca...';
  progressBar.style.width = '0%';
  cancelButton.style.display = 'block';
  resultsList.innerHTML = '';
  noResults.style.display = 'none';
  resultsSummary.style.display = 'none';
  exportOptions.style.display = 'none';
  
  try {
    // Verificar se a API está disponível
    if (!browserAPI || !browserAPI.runtime) {
      throw new Error('API do browser não disponível');
    }
    
    console.log('[DeepAlias Popup] Enviando busca:', { username, options });
    
    // Detecção específica Firefox vs Chrome/Edge para comunicação
    const isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage;
    let response;
    
    if (isFirefox) {
      // Firefox: Promise-based
      console.log('[DeepAlias Popup] Usando comunicação Firefox (Promise-based)');
      response = await Promise.race([
        browserAPI.runtime.sendMessage({
          type: 'search',
          data: {
            username,
            options
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout na comunicação com background script')), 10000)
        )
      ]);
    } else {
      // Chrome/Edge: Callback-based
      console.log('[DeepAlias Popup] Usando comunicação Chrome/Edge (Callback-based)');
      response = await new Promise((resolve, reject) => {
        browserAPI.runtime.sendMessage({
          type: 'search',
          data: {
            username,
            options
          }
        }, (response) => {
          if (browserAPI.runtime.lastError) {
            console.error('[DeepAlias Popup] Erro na comunicação:', browserAPI.runtime.lastError);
            reject(new Error(browserAPI.runtime.lastError.message));
          } else {
            console.log('[DeepAlias Popup] Resposta recebida:', response);
            resolve(response);
          }
        });
        
        // Timeout para Chrome/Edge
        setTimeout(() => {
          reject(new Error('Timeout na comunicação com background script'));
        }, 10000);
      });
    }
    
    if (response && response.success) {
      currentSearchId = response.searchId;
      console.log('[DeepAlias Popup] Busca iniciada com ID:', currentSearchId);
      
      // Iniciar verificação de status
      statusCheckInterval = setInterval(checkSearchStatus, 500);
    } else {
      const errorMsg = response?.error || 'Erro desconhecido ao iniciar busca';
      console.error('[DeepAlias Popup] Erro na busca:', errorMsg);
      handleSearchError(errorMsg);
    }
  } catch (error) {
    console.error('[DeepAlias Popup] Exceção na busca:', error);
    handleSearchError(error.message || 'Erro ao comunicar com background script');
  }
}

/**
 * Verifica o status da busca atual com compatibilidade Firefox/Edge
 */
async function checkSearchStatus() {
  if (!currentSearchId) {
    clearInterval(statusCheckInterval);
    statusCheckInterval = null;
    return;
  }
  
  try {
    // Usar função auxiliar para comunicação
    const response = await sendMessageToBackground({
      type: 'getStatus',
      data: {
        searchId: currentSearchId
      }
    }, 5000);
    
    if (response && response.success && response.status) {
      console.log('[DeepAlias Popup] Status recebido:', response.status);
      updateSearchProgress(response.status);
      
      // Se a busca foi concluída ou cancelada
      if (['completed', 'cancelled', 'error'].includes(response.status.status)) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
        
        if (response.status.status === 'completed') {
          handleSearchComplete(response.status);
        } else if (response.status.status === 'error') {
          handleSearchError(response.status.error || 'Erro durante a busca');
        }
      }
    } else {
      // Status não encontrado, possivelmente busca concluída ou erro
      clearInterval(statusCheckInterval);
      statusCheckInterval = null;
      handleSearchError('Não foi possível obter o status da busca');
    }
  } catch (error) {
    clearInterval(statusCheckInterval);
    statusCheckInterval = null;
    handleSearchError(error.message || 'Erro ao verificar status da busca');
  }
}

/**
 * Atualiza o progresso da busca na interface
 * @param {object} status - Status da busca
 */
function updateSearchProgress(status) {
  const progress = status.progress || 0;
  progressBar.style.width = `${progress}%`;
  
  if (status.status === 'running') {
    statusText.textContent = `Buscando... ${progress}%`;
    
    // Atualizar resultados parciais se disponíveis
    if (status.results && status.results.length > 0) {
      updateResultsList(status.results);
    }
  } else if (status.status === 'cancelled') {
    statusText.textContent = 'Busca cancelada';
  }
}

/**
 * Manipula a conclusão da busca
 * @param {object} status - Status final da busca
 */
function handleSearchComplete(status) {
  searchButton.disabled = false;
  cancelButton.style.display = 'none';
  statusText.textContent = 'Busca concluída';
  progressBar.style.width = '100%';
  
  // Salvar resultados
  searchResults = status.results || [];
  
  // Atualizar lista de resultados
  updateResultsList(searchResults);
  
  // Atualizar resumo
  const found = searchResults.filter(r => r.found).length;
  const highRisk = searchResults.filter(r => r.found && r.riskScore >= 70).length;
  
  foundCount.textContent = found;
  highRiskCount.textContent = highRisk;
  platformsCount.textContent = searchResults.length;
  
  resultsSummary.style.display = 'flex';
  
  // Mostrar opções de exportação se houver resultados
  if (found > 0) {
    exportOptions.style.display = 'flex';
  }
  
  // Mostrar mensagem de nenhum resultado se necessário
  if (found === 0) {
    noResults.style.display = 'block';
  }
}

/**
 * Manipula erros durante a busca
 * @param {string} errorMessage - Mensagem de erro
 */
function handleSearchError(errorMessage) {
  searchButton.disabled = false;
  cancelButton.style.display = 'none';
  statusText.textContent = 'Erro na busca';
  
  // Mostrar mensagem de erro
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = `Erro: ${errorMessage}`;
  resultsList.innerHTML = '';
  resultsList.appendChild(errorElement);
}

/**
 * Atualiza a lista de resultados na interface
 * @param {Array} results - Resultados da busca
 */
function updateResultsList(results) {
  // Filtrar apenas resultados encontrados
  const foundResults = results.filter(r => r.found);
  
  if (foundResults.length === 0) {
    return;
  }
  
  // Limpar lista atual
  resultsList.innerHTML = '';
  
  // Adicionar resultados
  foundResults.forEach(result => {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    
    // Determinar nível de risco
    let riskLevel = 'low';
    if (result.riskScore >= 70) {
      riskLevel = 'high';
    } else if (result.riskScore >= 40) {
      riskLevel = 'medium';
    }
    
    resultItem.innerHTML = `
      <div class="result-header">
        <div class="platform-name">
          <span class="platform-icon">${result.platform.icon || '🔍'}</span>
          ${result.platform.name}
        </div>
        <div class="risk-badge risk-${riskLevel}">${result.riskScore}% risco</div>
      </div>
      <a href="${result.url}" class="result-url" target="_blank">${result.url}</a>
      <div class="result-details">
        <span class="result-confidence">Confiança: ${result.confidence}%</span>
        <span class="result-variation">Variação: ${result.variationUsed}</span>
      </div>
    `;
    
    // Adicionar evento de clique para abrir URL
    const urlLink = resultItem.querySelector('.result-url');
    urlLink.addEventListener('click', (event) => {
      event.preventDefault();
      browserAPI.tabs.create({ url: result.url });
    });
    
    resultsList.appendChild(resultItem);
  });
}

/**
 * Cancela a busca atual
 */
async function cancelSearch() {
  if (!currentSearchId) {
    return;
  }
  
  try {
    await sendMessageToBackground({
      type: 'cancelSearch',
      data: {
        searchId: currentSearchId
      }
    });
    
    statusText.textContent = 'Cancelando...';
  } catch (error) {
    console.error('Erro ao cancelar busca:', error);
  }
}

/**
 * Alterna a exibição das opções avançadas
 * @param {Event} event - Evento de clique
 */
function toggleAdvancedOptions(event) {
  event.preventDefault();
  
  const isVisible = advancedOptions.style.display === 'block';
  advancedOptions.style.display = isVisible ? 'none' : 'block';
  toggleOptions.textContent = isVisible ? 'Opções avançadas' : 'Ocultar opções';
}

/**
 * Salva as configurações atuais
 * @param {object} options - Opções a serem salvas
 */
async function saveSettings(options) {
  try {
    await browserAPI.runtime.sendMessage({
      type: 'saveSettings',
      data: {
        settings: options
      }
    });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
  }
}

/**
 * Exporta os resultados da busca
 * @param {string} format - Formato de exportação ('json', 'csv', 'html')
 */
function exportResults(format) {
  if (!searchResults || searchResults.length === 0) {
    return;
  }
  
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
      // Cabeçalho CSV
      content = 'Platform,URL,Username,Variation,Confidence,Risk Score\n';
      
      // Adicionar linhas
      foundResults.forEach(result => {
        content += `"${result.platform.name}","${result.url}","${result.originalUsername}","${result.variationUsed}",${result.confidence},${result.riskScore}\n`;
      });
      
      filename += '.csv';
      mimeType = 'text/csv';
      break;
      
    case 'html':
      // Criar HTML
      content = `
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
          <p>Username: ${foundResults[0]?.originalUsername || 'N/A'}</p>
          <p>Total de resultados: ${foundResults.length}</p>
          
          <table>
            <tr>
              <th>Plataforma</th>
              <th>URL</th>
              <th>Variação</th>
              <th>Confiança</th>
              <th>Risco</th>
            </tr>
      `;
      
      // Adicionar linhas
      foundResults.forEach(result => {
        let rowClass = '';
        if (result.riskScore >= 70) {
          rowClass = 'high-risk';
        } else if (result.riskScore >= 40) {
          rowClass = 'medium-risk';
        }
        
        content += `
          <tr class="${rowClass}">
            <td>${result.platform.name}</td>
            <td><a href="${result.url}" target="_blank">${result.url}</a></td>
            <td>${result.variationUsed}</td>
            <td>${result.confidence}%</td>
            <td>${result.riskScore}%</td>
          </tr>
        `;
      });
      
      content += `
          </table>
          <p><small>Gerado por DeepAlias Hunter Pro v4.0.0</small></p>
        </body>
        </html>
      `;
      
      filename += '.html';
      mimeType = 'text/html';
      break;
  }
  
  // Criar blob e link de download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  // Criar link e simular clique
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
  browserAPI.runtime.openOptionsPage();
}

/**
 * Abre a página de ajuda
 * @param {Event} event - Evento de clique
 */
function openHelpPage(event) {
  event.preventDefault();
  browserAPI.tabs.create({ url: browserAPI.runtime.getURL('src/help/help.html') });
}

/**
 * Abre a página sobre
 * @param {Event} event - Evento de clique
 */
function openAboutPage(event) {
  event.preventDefault();
  browserAPI.tabs.create({ url: browserAPI.runtime.getURL('src/about/about.html') });
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
