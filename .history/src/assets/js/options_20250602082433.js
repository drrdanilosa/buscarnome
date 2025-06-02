/**
 * Options.js - Script para a página de configurações da extensão
 * @version 4.0.0
 */

// Polyfill para compatibilidade entre Chrome e Firefox
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Elementos da interface
const maxConcurrent = document.getElementById('max-concurrent');
const cacheTTL = document.getElementById('cache-ttl');
const logLevel = document.getElementById('log-level');
const includeAdult = document.getElementById('include-adult');
const includeTor = document.getElementById('include-tor');
const priorityCategories = document.querySelectorAll('input[name="priority-category"]');
const maxVariations = document.getElementById('max-variations');
const enableProxy = document.getElementById('enable-proxy');
const proxyList = document.getElementById('proxy-list');
const enableUseragent = document.getElementById('enable-useragent');
const enableTor = document.getElementById('enable-tor');
const torProxy = document.getElementById('tor-proxy');
const testTor = document.getElementById('test-tor');
const torStatus = document.getElementById('tor-status');
const enableImageAnalysis = document.getElementById('enable-image-analysis');
const imageApiProvider = document.getElementById('image-api-provider');
const imageApiKey = document.getElementById('image-api-key');
const imageApiEndpoint = document.getElementById('image-api-endpoint');
const enableOsint = document.getElementById('enable-osint');
const haveibeenpwnedKey = document.getElementById('haveibeenpwned-key');
const testHaveibeenpwned = document.getElementById('test-haveibeenpwned');
const dehashedKey = document.getElementById('dehashed-key');
const testDehashed = document.getElementById('test-dehashed');
const intelxKey = document.getElementById('intelx-key');
const testIntelx = document.getElementById('test-intelx');
const resetButton = document.getElementById('reset-button');
const saveButton = document.getElementById('save-button');
const successMessage = document.getElementById('success-message');
const errorMessage = document.getElementById('error-message');

// Inicialização
document.addEventListener('DOMContentLoaded', initialize);

/**
 * Inicializa a página de configurações
 */
async function initialize() {
  console.log('Inicializando página de configurações...');
  
  // Configurar event listeners
  saveButton.addEventListener('click', saveSettings);
  resetButton.addEventListener('click', resetSettings);
  testTor.addEventListener('click', testTorConnection);
  testHaveibeenpwned.addEventListener('click', () => testApiKey('haveibeenpwned'));
  testDehashed.addEventListener('click', () => testApiKey('dehashed'));
  testIntelx.addEventListener('click', () => testApiKey('intelx'));
  
  // Carregar configurações salvas
  await loadSettings();
  
  console.log('Página de configurações inicializada');
}

/**
 * Carrega configurações salvas
 */
async function loadSettings() {
  try {
    // Obter configurações do background script
    const response = await new Promise((resolve, reject) => {
      browserAPI.runtime.sendMessage({
        type: 'getSettings'
      }, (response) => {
        if (browserAPI.runtime.lastError) {
          reject(new Error(browserAPI.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    if (!response || !response.success) {
      console.error('Erro ao carregar configurações:', response?.error || 'Resposta inválida');
      showError('Erro ao carregar configurações: ' + (response?.error || 'Resposta inválida'));
      return;
    }
    
    const settings = response.settings;
    
    // Aplicar configurações à interface
    maxConcurrent.value = settings.maxConcurrentRequests || 5;
    cacheTTL.value = (settings.cacheTTL || 24 * 60 * 60 * 1000) / (60 * 60 * 1000); // Converter de ms para horas
    logLevel.value = settings.logLevel || 'info';
    includeAdult.checked = settings.includeAdult !== false;
    includeTor.checked = settings.includeTor === true;
    
    if (settings.maxVariationsPerPlatform) {
      maxVariations.value = settings.maxVariationsPerPlatform;
    }
    
    if (settings.priorityCategories && Array.isArray(settings.priorityCategories)) {
      priorityCategories.forEach(checkbox => {
        checkbox.checked = settings.priorityCategories.includes(checkbox.value);
      });
    }
    
    // Configurações de proxy
    enableProxy.checked = settings.proxyEnabled === true;
    if (settings.proxyList && Array.isArray(settings.proxyList)) {
      proxyList.value = settings.proxyList.map(proxy => {
        if (proxy.username && proxy.password) {
          return `${proxy.host}:${proxy.port}:${proxy.username}:${proxy.password}`;
        }
        return `${proxy.host}:${proxy.port}`;
      }).join('\n');
    }
    
    // Configurações de user-agent
    enableUseragent.checked = settings.userAgentRotation !== false;
    
    // Configurações de Tor
    enableTor.checked = settings.torEnabled === true;
    if (settings.torProxyUrl) {
      torProxy.value = settings.torProxyUrl;
    }
    
    // Configurações de análise de imagem
    enableImageAnalysis.checked = settings.imageAnalysisEnabled === true;
    if (settings.imageApiProvider) {
      imageApiProvider.value = settings.imageApiProvider;
    }
    if (settings.imageApiKey) {
      imageApiKey.value = settings.imageApiKey;
    }
    if (settings.imageApiEndpoint) {
      imageApiEndpoint.value = settings.imageApiEndpoint;
    }
    
    // Configurações de OSINT
    enableOsint.checked = settings.osintEnabled === true;
    if (settings.osintApiKeys) {
      if (settings.osintApiKeys.haveibeenpwned) {
        haveibeenpwnedKey.value = settings.osintApiKeys.haveibeenpwned;
      }
      if (settings.osintApiKeys.dehashed) {
        dehashedKey.value = settings.osintApiKeys.dehashed;
      }
      if (settings.osintApiKeys.intelx) {
        intelxKey.value = settings.osintApiKeys.intelx;
      }
    }
    
    console.log('Configurações carregadas com sucesso');
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    showError('Erro ao carregar configurações: ' + (error.message || 'Erro desconhecido'));
  }
}

/**
 * Salva as configurações
 */
async function saveSettings() {
  try {
    // Coletar configurações da interface
    const settings = {
      // Configurações gerais
      maxConcurrentRequests: parseInt(maxConcurrent.value, 10),
      cacheTTL: parseInt(cacheTTL.value, 10) * 60 * 60 * 1000, // Converter horas para ms
      logLevel: logLevel.value,
      
      // Configurações de busca
      includeAdult: includeAdult.checked,
      includeTor: includeTor.checked,
      maxVariationsPerPlatform: parseInt(maxVariations.value, 10),
      priorityCategories: Array.from(priorityCategories)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value),
      
      // Configurações de proxy
      proxyEnabled: enableProxy.checked,
      proxyList: parseProxyList(proxyList.value),
      
      // Configurações de user-agent
      userAgentRotation: enableUseragent.checked,
      
      // Configurações de Tor
      torEnabled: enableTor.checked,
      torProxyUrl: torProxy.value,
      
      // Configurações de análise de imagem
      imageAnalysisEnabled: enableImageAnalysis.checked,
      imageApiProvider: imageApiProvider.value,
      imageApiKey: imageApiKey.value,
      imageApiEndpoint: imageApiEndpoint.value,
      
      // Configurações de OSINT
      osintEnabled: enableOsint.checked,
      osintApiKeys: {
        haveibeenpwned: haveibeenpwnedKey.value,
        dehashed: dehashedKey.value,
        intelx: intelxKey.value
      }
    };
    
    // Enviar configurações para o background script
    const response = await browser.runtime.sendMessage({
      type: 'saveSettings',
      data: {
        settings
      }
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Erro desconhecido ao salvar configurações');
    }
    
    console.log('Configurações salvas com sucesso');
    showSuccess('Configurações salvas com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    showError('Erro ao salvar configurações: ' + (error.message || 'Erro desconhecido'));
  }
}

/**
 * Reseta as configurações para os valores padrão
 */
function resetSettings() {
  if (!confirm('Tem certeza que deseja restaurar todas as configurações para os valores padrão?')) {
    return;
  }
  
  // Configurações gerais
  maxConcurrent.value = 5;
  cacheTTL.value = 24;
  logLevel.value = 'info';
  
  // Configurações de busca
  includeAdult.checked = true;
  includeTor.checked = false;
  maxVariations.value = 3;
  
  // Resetar categorias prioritárias
  priorityCategories.forEach(checkbox => {
    checkbox.checked = ['adult', 'social', 'forum'].includes(checkbox.value);
  });
  
  // Configurações de proxy
  enableProxy.checked = false;
  proxyList.value = '';
  
  // Configurações de user-agent
  enableUseragent.checked = true;
  
  // Configurações de Tor
  enableTor.checked = false;
  torProxy.value = 'socks5://127.0.0.1:9050';
  
  // Configurações de análise de imagem
  enableImageAnalysis.checked = false;
  imageApiProvider.value = 'none';
  imageApiKey.value = '';
  imageApiEndpoint.value = '';
  
  // Configurações de OSINT
  enableOsint.checked = false;
  haveibeenpwnedKey.value = '';
  dehashedKey.value = '';
  intelxKey.value = '';
  
  showSuccess('Configurações restauradas para os valores padrão. Clique em Salvar para aplicar.');
}

/**
 * Testa a conexão Tor
 */
async function testTorConnection() {
  try {
    torStatus.textContent = 'Testando...';
    torStatus.style.color = '';
    
    // Enviar solicitação de teste para o background script
    const response = await browser.runtime.sendMessage({
      type: 'testTorConnection',
      data: {
        torProxyUrl: torProxy.value
      }
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Falha no teste de conexão');
    }
    
    if (response.status === 'connected') {
      torStatus.textContent = 'Conectado ✓';
      torStatus.style.color = 'green';
    } else {
      torStatus.textContent = 'Desconectado ✗';
      torStatus.style.color = 'red';
    }
  } catch (error) {
    console.error('Erro ao testar conexão Tor:', error);
    torStatus.textContent = 'Erro: ' + (error.message || 'Erro desconhecido');
    torStatus.style.color = 'red';
  }
}

/**
 * Testa uma chave de API
 * @param {string} service - Nome do serviço
 */
async function testApiKey(service) {
  let apiKey = '';
  let buttonElement = null;
  
  // Obter chave e botão correspondentes
  switch (service) {
    case 'haveibeenpwned':
      apiKey = haveibeenpwnedKey.value;
      buttonElement = testHaveibeenpwned;
      break;
    case 'dehashed':
      apiKey = dehashedKey.value;
      buttonElement = testDehashed;
      break;
    case 'intelx':
      apiKey = intelxKey.value;
      buttonElement = testIntelx;
      break;
    default:
      console.error('Serviço desconhecido:', service);
      return;
  }
  
  if (!apiKey) {
    alert('Por favor, insira uma chave de API para testar.');
    return;
  }
  
  try {
    // Atualizar botão
    const originalText = buttonElement.textContent;
    buttonElement.textContent = 'Testando...';
    buttonElement.disabled = true;
    
    // Enviar solicitação de teste para o background script
    const response = await browser.runtime.sendMessage({
      type: 'testApiKey',
      data: {
        service,
        apiKey
      }
    });
    
    // Restaurar botão
    buttonElement.disabled = false;
    
    if (!response.success) {
      throw new Error(response.error || 'Falha no teste da API');
    }
    
    // Mostrar resultado
    buttonElement.textContent = 'Válida ✓';
    setTimeout(() => {
      buttonElement.textContent = originalText;
    }, 3000);
  } catch (error) {
    console.error(`Erro ao testar API ${service}:`, error);
    buttonElement.textContent = 'Inválida ✗';
    setTimeout(() => {
      buttonElement.textContent = 'Testar';
      buttonElement.disabled = false;
    }, 3000);
  }
}

/**
 * Analisa a lista de proxies
 * @param {string} text - Texto com a lista de proxies
 * @returns {Array<object>} - Lista de objetos de proxy
 */
function parseProxyList(text) {
  if (!text) {
    return [];
  }
  
  const lines = text.split('\n').filter(line => line.trim());
  const proxies = [];
  
  for (const line of lines) {
    const parts = line.trim().split(':');
    
    if (parts.length >= 2) {
      const proxy = {
        host: parts[0],
        port: parseInt(parts[1], 10)
      };
      
      if (parts.length >= 4) {
        proxy.username = parts[2];
        proxy.password = parts[3];
      }
      
      proxies.push(proxy);
    }
  }
  
  return proxies;
}

/**
 * Mostra mensagem de sucesso
 * @param {string} message - Mensagem de sucesso
 */
function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.style.display = 'block';
  errorMessage.style.display = 'none';
  
  setTimeout(() => {
    successMessage.style.display = 'none';
  }, 3000);
}

/**
 * Mostra mensagem de erro
 * @param {string} message - Mensagem de erro
 */
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  successMessage.style.display = 'none';
  
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 5000);
}
