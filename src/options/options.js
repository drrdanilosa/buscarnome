/**
 * DeepAlias Hunter Pro - Options Script
 * @author drrdanilosa
 * @version 5.0.0
 * @date 2025-06-04 04:14:47
 * @updated_by drrdanilosa
 */

// Configurações padrão
const defaultSettings = {
  maxResults: 50,
  timeout: 30000,
  advancedSearch: false,
  searchAll: true,
  enableNotifications: true,
  autoSave: true,
  darkMode: false,
  exportFormat: 'json',
  cacheEnabled: true,
  lastUpdated: new Date().toISOString()
};

// Estado atual das configurações
let currentSettings = { ...defaultSettings };

document.addEventListener('DOMContentLoaded', () => {
  console.log('[OPTIONS] Página de opções carregada');
  
  // Inicializar interface
  initializeUI();
  
  // Carregar configurações salvas
  loadSettings();
  
  // Configurar event listeners
  setupEventListeners();
  
  // Carregar estatísticas
  loadStatistics();
});

/**
 * Inicializa a interface de usuário
 */
function initializeUI() {
  try {
    console.log('[OPTIONS] Inicializando interface...');
    
    // Configurar elementos da interface
    const versionElement = document.getElementById('version-number');
    if (versionElement) {
      versionElement.textContent = '5.0.0';
    }
    
    const lastUpdateElement = document.getElementById('last-update-date');
    if (lastUpdateElement) {
      lastUpdateElement.textContent = new Date().toLocaleDateString('pt-BR');
    }
    
    // Mostrar data de última atualização das configurações
    updateLastSavedInfo();
    
  } catch (error) {
    console.error('[OPTIONS] Erro ao inicializar interface:', error);
  }
}

/**
 * Configura todos os event listeners
 */
function setupEventListeners() {
  try {
    console.log('[OPTIONS] Configurando event listeners...');
    
    // Botão salvar
    const saveButton = document.getElementById('save-settings');
    if (saveButton) {
      saveButton.addEventListener('click', saveSettings);
    }
    
    // Botão restaurar padrões
    const resetButton = document.getElementById('reset-settings');
    if (resetButton) {
      resetButton.addEventListener('click', resetToDefaults);
    }
    
    // Botão exportar configurações
    const exportButton = document.getElementById('export-settings');
    if (exportButton) {
      exportButton.addEventListener('click', exportSettings);
    }
    
    // Botão importar configurações
    const importButton = document.getElementById('import-settings');
    const importInput = document.getElementById('import-file');
    if (importButton && importInput) {
      importButton.addEventListener('click', () => importInput.click());
      importInput.addEventListener('change', importSettings);
    }
    
    // Botão limpar cache
    const clearCacheButton = document.getElementById('clear-cache');
    if (clearCacheButton) {
      clearCacheButton.addEventListener('click', clearCache);
    }
    
    // Botão testar notificações
    const testNotificationButton = document.getElementById('test-notification');
    if (testNotificationButton) {
      testNotificationButton.addEventListener('click', testNotification);
    }
    
    // Auto-save quando configurações mudarem
    const autoSaveCheckbox = document.getElementById('auto-save');
    if (autoSaveCheckbox) {
      autoSaveCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          setupAutoSave();
        } else {
          removeAutoSave();
        }
      });
    }
    
    // Dark mode toggle
    const darkModeCheckbox = document.getElementById('dark-mode');
    if (darkModeCheckbox) {
      darkModeCheckbox.addEventListener('change', toggleDarkMode);
    }
    
    // Validação em tempo real
    setupRealTimeValidation();
    
  } catch (error) {
    console.error('[OPTIONS] Erro ao configurar event listeners:', error);
  }
}

/**
 * Carrega configurações salvas
 */
async function loadSettings() {
  try {
    console.log('[OPTIONS] Carregando configurações...');
    
    // Tentar carregar do storage do browser
    const result = await browser.storage.local.get('deepaliasSettings');
    
    if (result.deepaliasSettings) {
      currentSettings = { ...defaultSettings, ...result.deepaliasSettings };
      console.log('[OPTIONS] Configurações carregadas do storage:', currentSettings);
    } else {
      console.log('[OPTIONS] Nenhuma configuração encontrada, usando padrões');
      currentSettings = { ...defaultSettings };
    }
    
    // Aplicar configurações à interface
    applySettingsToUI();
    
    // Notificar background sobre carregamento
    notifyBackgroundOptionsLoaded();
    
  } catch (error) {
    console.error('[OPTIONS] Erro ao carregar configurações:', error);
    
    // Tentar carregar do localStorage como fallback
    try {
      const settingsStr = localStorage.getItem('deepaliasSettings');
      if (settingsStr) {
        currentSettings = { ...defaultSettings, ...JSON.parse(settingsStr) };
        console.log('[OPTIONS] Configurações carregadas do localStorage como fallback');
        applySettingsToUI();
      }
    } catch (fallbackError) {
      console.error('[OPTIONS] Erro no fallback do localStorage:', fallbackError);
      showMessage('Erro ao carregar configurações. Usando configurações padrão.', 'error');
    }
  }
}

/**
 * Aplica configurações à interface
 */
function applySettingsToUI() {
  try {
    console.log('[OPTIONS] Aplicando configurações à interface...');
    
    // Aplicar valores aos campos
    const maxResultsInput = document.getElementById('max-results');
    if (maxResultsInput) {
      maxResultsInput.value = currentSettings.maxResults;
    }
    
    const timeoutInput = document.getElementById('timeout');
    if (timeoutInput) {
      timeoutInput.value = currentSettings.timeout;
    }
    
    const advancedSearchCheckbox = document.getElementById('advanced-search');
    if (advancedSearchCheckbox) {
      advancedSearchCheckbox.checked = currentSettings.advancedSearch;
    }
    
    const searchAllCheckbox = document.getElementById('search-all');
    if (searchAllCheckbox) {
      searchAllCheckbox.checked = currentSettings.searchAll;
    }
    
    const enableNotificationsCheckbox = document.getElementById('enable-notifications');
    if (enableNotificationsCheckbox) {
      enableNotificationsCheckbox.checked = currentSettings.enableNotifications;
    }
    
    const autoSaveCheckbox = document.getElementById('auto-save');
    if (autoSaveCheckbox) {
      autoSaveCheckbox.checked = currentSettings.autoSave;
      if (currentSettings.autoSave) {
        setupAutoSave();
      }
    }
    
    const darkModeCheckbox = document.getElementById('dark-mode');
    if (darkModeCheckbox) {
      darkModeCheckbox.checked = currentSettings.darkMode;
      if (currentSettings.darkMode) {
        document.body.classList.add('dark-mode');
      }
    }
    
    const exportFormatSelect = document.getElementById('export-format');
    if (exportFormatSelect) {
      exportFormatSelect.value = currentSettings.exportFormat;
    }
    
    const cacheEnabledCheckbox = document.getElementById('cache-enabled');
    if (cacheEnabledCheckbox) {
      cacheEnabledCheckbox.checked = currentSettings.cacheEnabled;
    }
    
    updateLastSavedInfo();
    
  } catch (error) {
    console.error('[OPTIONS] Erro ao aplicar configurações à interface:', error);
  }
}

/**
 * Salva configurações
 */
async function saveSettings() {
  try {
    console.log('[OPTIONS] Salvando configurações...');
    
    // Coletar valores da interface
    const settings = collectSettingsFromUI();
    
    // Validar configurações
    const validation = validateSettings(settings);
    if (!validation.valid) {
      showMessage(validation.message, 'error');
      return;
    }
    
    // Atualizar configurações atuais
    currentSettings = { ...settings, lastUpdated: new Date().toISOString() };
    
    // Salvar no storage do browser
    await browser.storage.local.set({ deepaliasSettings: currentSettings });
    
    // Salvar no localStorage como backup
    localStorage.setItem('deepaliasSettings', JSON.stringify(currentSettings));
    
    console.log('[OPTIONS] Configurações salvas:', currentSettings);
    
    // Notificar background sobre atualização
    const response = await browser.runtime.sendMessage({
      type: 'optionsUpdated',
      data: currentSettings,
      timestamp: Date.now()
    });
    
    console.log('[OPTIONS] Background notificado:', response);
    
    // Atualizar interface
    updateLastSavedInfo();
    showMessage('Configurações salvas com sucesso!', 'success');
    
  } catch (error) {
    console.error('[OPTIONS] Erro ao salvar configurações:', error);
    showMessage('Erro ao salvar configurações: ' + error.message, 'error');
  }
}

/**
 * Coleta configurações da interface
 */
function collectSettingsFromUI() {
  const settings = {
    maxResults: parseInt(document.getElementById('max-results')?.value || '50'),
    timeout: parseInt(document.getElementById('timeout')?.value || '30000'),
    advancedSearch: document.getElementById('advanced-search')?.checked || false,
    searchAll: document.getElementById('search-all')?.checked || true,
    enableNotifications: document.getElementById('enable-notifications')?.checked || true,
    autoSave: document.getElementById('auto-save')?.checked || true,
    darkMode: document.getElementById('dark-mode')?.checked || false,
    exportFormat: document.getElementById('export-format')?.value || 'json',
    cacheEnabled: document.getElementById('cache-enabled')?.checked || true
  };
  
  console.log('[OPTIONS] Configurações coletadas da interface:', settings);
  return settings;
}

/**
 * Valida configurações
 */
function validateSettings(settings) {
  // Validar maxResults
  if (settings.maxResults < 1 || settings.maxResults > 100) {
    return {
      valid: false,
      message: 'O número máximo de resultados deve estar entre 1 e 100'
    };
  }
  
  // Validar timeout
  if (settings.timeout < 5000 || settings.timeout > 120000) {
    return {
      valid: false,
      message: 'O timeout deve estar entre 5 e 120 segundos'
    };
  }
  
  // Validar formato de exportação
  const validFormats = ['json', 'csv', 'xml'];
  if (!validFormats.includes(settings.exportFormat)) {
    return {
      valid: false,
      message: 'Formato de exportação inválido'
    };
  }
  
  return { valid: true };
}

/**
 * Restaura configurações padrão
 */
async function resetToDefaults() {
  try {
    const confirmed = confirm('Tem certeza que deseja restaurar todas as configurações para os valores padrão? Esta ação não pode ser desfeita.');
    
    if (!confirmed) return;
    
    console.log('[OPTIONS] Restaurando configurações padrão...');
    
    currentSettings = { ...defaultSettings, lastUpdated: new Date().toISOString() };
    
    // Aplicar à interface
    applySettingsToUI();
    
    // Salvar
    await saveSettings();
    
    showMessage('Configurações restauradas para os valores padrão', 'success');
    
  } catch (error) {
    console.error('[OPTIONS] Erro ao restaurar configurações padrão:', error);
    showMessage('Erro ao restaurar configurações padrão: ' + error.message, 'error');
  }
}

/**
 * Exporta configurações
 */
function exportSettings() {
  try {
    console.log('[OPTIONS] Exportando configurações...');
    
    const exportData = {
      version: '5.0.0',
      exported: new Date().toISOString(),
      settings: currentSettings,
      metadata: {
        browser: navigator.userAgent,
        exportedBy: 'DeepAlias Hunter Pro Options Page'
      }
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepalias_settings_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('Configurações exportadas com sucesso!', 'success');
    
  } catch (error) {
    console.error('[OPTIONS] Erro ao exportar configurações:', error);
    showMessage('Erro ao exportar configurações: ' + error.message, 'error');
  }
}

/**
 * Importa configurações
 */
function importSettings(event) {
  try {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('[OPTIONS] Importando configurações do arquivo:', file.name);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        
        // Validar estrutura do arquivo
        if (!importData.settings) {
          throw new Error('Arquivo de configurações inválido');
        }
        
        // Validar configurações importadas
        const validation = validateSettings(importData.settings);
        if (!validation.valid) {
          throw new Error(validation.message);
        }
        
        // Confirmar importação
        const confirmed = confirm('Tem certeza que deseja importar estas configurações? As configurações atuais serão substituídas.');
        
        if (!confirmed) return;
        
        // Aplicar configurações importadas
        currentSettings = { ...defaultSettings, ...importData.settings, lastUpdated: new Date().toISOString() };
        
        // Aplicar à interface
        applySettingsToUI();
        
        // Salvar
        await saveSettings();
        
        showMessage('Configurações importadas com sucesso!', 'success');
        
      } catch (error) {
        console.error('[OPTIONS] Erro ao processar arquivo importado:', error);
        showMessage('Erro ao importar configurações: ' + error.message, 'error');
      }
    };
    
    reader.readAsText(file);
    
    // Limpar input
    event.target.value = '';
    
  } catch (error) {
    console.error('[OPTIONS] Erro ao importar configurações:', error);
    showMessage('Erro ao importar configurações: ' + error.message, 'error');
  }
}

/**
 * Limpa cache
 */
async function clearCache() {
  try {
    console.log('[OPTIONS] Limpando cache...');
    
    const confirmed = confirm('Tem certeza que deseja limpar todo o cache? Isso pode afetar o desempenho temporariamente.');
    
    if (!confirmed) return;
    
    // Limpar cache do browser storage
    const keys = await browser.storage.local.get();
    const cacheKeys = Object.keys(keys).filter(key => key.startsWith('search_') || key.includes('cache'));
    
    if (cacheKeys.length > 0) {
      await browser.storage.local.remove(cacheKeys);
    }
    
    // Limpar cache do localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('cache') || key.includes('search') || key.includes('deepalias')) {
        if (key !== 'deepaliasSettings') { // Preservar configurações
          localStorage.removeItem(key);
        }
      }
    });
    
    // Notificar background para limpar cache
    await browser.runtime.sendMessage({
      type: 'clearCache',
      timestamp: Date.now()
    });
    
    showMessage('Cache limpo com sucesso!', 'success');
    
    // Atualizar estatísticas
    loadStatistics();
    
  } catch (error) {
    console.error('[OPTIONS] Erro ao limpar cache:', error);
    showMessage('Erro ao limpar cache: ' + error.message, 'error');
  }
}

/**
 * Testa notificações
 */
function testNotification() {
  try {
    console.log('[OPTIONS] Testando notificação...');
    
    if (!('Notification' in window)) {
      showMessage('Notificações não são suportadas neste navegador', 'error');
      return;
    }
    
    if (Notification.permission === 'denied') {
      showMessage('Notificações foram negadas. Ative nas configurações do navegador.', 'error');
      return;
    }
    
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showTestNotification();
        } else {
          showMessage('Permissão para notificações negada', 'error');
        }
      });
    } else {
      showTestNotification();
    }
    
  } catch (error) {
    console.error('[OPTIONS] Erro ao testar notificação:', error);
    showMessage('Erro ao testar notificação: ' + error.message, 'error');
  }
}

/**
 * Mostra notificação de teste
 */
function showTestNotification() {
  try {
    browser.notifications.create({
      type: 'basic',
      iconUrl: browser.runtime.getURL('src/assets/icons/icon48.png'),
      title: 'DeepAlias Hunter Pro',
      message: 'Teste de notificação realizado com sucesso! 🎉'
    });
    
    showMessage('Notificação de teste enviada!', 'success');
    
  } catch (error) {
    console.error('[OPTIONS] Erro ao mostrar notificação de teste:', error);
    
    // Fallback para notificação do browser
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('DeepAlias Hunter Pro', {
        body: 'Teste de notificação realizado com sucesso! 🎉',
        icon: browser.runtime.getURL('src/assets/icons/icon48.png')
      });
      
      showMessage('Notificação de teste enviada!', 'success');
    } else {
      showMessage('Erro ao enviar notificação de teste', 'error');
    }
  }
}

/**
 * Configura auto-save
 */
function setupAutoSave() {
  console.log('[OPTIONS] Configurando auto-save...');
  
  // Remover listeners existentes
  removeAutoSave();
  
  // Adicionar listeners para mudanças
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    if (input.id !== 'auto-save') { // Não auto-salvar a própria configuração de auto-save
      input.addEventListener('change', autoSaveHandler);
      if (input.type === 'text' || input.type === 'number') {
        input.addEventListener('input', debounce(autoSaveHandler, 1000));
      }
    }
  });
}

/**
 * Remove auto-save
 */
function removeAutoSave() {
  console.log('[OPTIONS] Removendo auto-save...');
  
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    input.removeEventListener('change', autoSaveHandler);
    input.removeEventListener('input', autoSaveHandler);
  });
}

/**
 * Handler para auto-save
 */
function autoSaveHandler() {
  console.log('[OPTIONS] Auto-save acionado');
  saveSettings();
}

/**
 * Função debounce para evitar muitas chamadas
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Configura validação em tempo real
 */
function setupRealTimeValidation() {
  const maxResultsInput = document.getElementById('max-results');
  if (maxResultsInput) {
    maxResultsInput.addEventListener('input', () => {
      const value = parseInt(maxResultsInput.value);
      const feedback = document.getElementById('max-results-feedback');
      
      if (feedback) {
        if (value < 1 || value > 100) {
          feedback.textContent = 'Deve estar entre 1 e 100';
          feedback.className = 'feedback error';
          maxResultsInput.classList.add('invalid');
        } else {
          feedback.textContent = 'Válido';
          feedback.className = 'feedback success';
          maxResultsInput.classList.remove('invalid');
        }
      }
    });
  }
  
  const timeoutInput = document.getElementById('timeout');
  if (timeoutInput) {
    timeoutInput.addEventListener('input', () => {
      const value = parseInt(timeoutInput.value);
      const feedback = document.getElementById('timeout-feedback');
      
      if (feedback) {
        if (value < 5000 || value > 120000) {
          feedback.textContent = 'Deve estar entre 5000 e 120000 ms';
          feedback.className = 'feedback error';
          timeoutInput.classList.add('invalid');
        } else {
          feedback.textContent = `${value/1000} segundos`;
          feedback.className = 'feedback success';
          timeoutInput.classList.remove('invalid');
        }
      }
    });
  }
}

/**
 * Alterna modo escuro
 */
function toggleDarkMode(event) {
  const isDarkMode = event.target.checked;
  
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  
  console.log('[OPTIONS] Modo escuro:', isDarkMode ? 'ativado' : 'desativado');
}

/**
 * Carrega estatísticas
 */
async function loadStatistics() {
  try {
    console.log('[OPTIONS] Carregando estatísticas...');
    
    // Obter estatísticas do background
    const response = await browser.runtime.sendMessage({
      type: 'getSearchStats',
      timestamp: Date.now()
    });
    
    if (response && response.stats) {
      updateStatisticsUI(response.stats);
    }
    
    // Obter estatísticas do storage
    const storageStats = await getStorageStatistics();
    updateStorageStatisticsUI(storageStats);
    
  } catch (error) {
    console.error('[OPTIONS] Erro ao carregar estatísticas:', error);
  }
}

/**
 * Obtém estatísticas do storage
 */
async function getStorageStatistics() {
  try {
    const keys = await browser.storage.local.get();
    const totalKeys = Object.keys(keys).length;
    const searchKeys = Object.keys(keys).filter(key => key.startsWith('search_')).length;
    const cacheKeys = Object.keys(keys).filter(key => key.includes('cache')).length;
    
    return {
      totalKeys,
      searchKeys,
      cacheKeys,
      totalSize: JSON.stringify(keys).length
    };
  } catch (error) {
    console.error('[OPTIONS] Erro ao obter estatísticas do storage:', error);
    return { totalKeys: 0, searchKeys: 0, cacheKeys: 0, totalSize: 0 };
  }
}

/**
 * Atualiza UI com estatísticas
 */
function updateStatisticsUI(stats) {
  const totalSearchesElement = document.getElementById('total-searches');
  if (totalSearchesElement) {
    totalSearchesElement.textContent = stats.totalSearches || 0;
  }
  
  const cacheHitsElement = document.getElementById('cache-hits');
  if (cacheHitsElement) {
    cacheHitsElement.textContent = stats.cacheHits || 0;
  }
  
  const averageTimeElement = document.getElementById('average-time');
  if (averageTimeElement) {
    averageTimeElement.textContent = stats.averageTime ? `${stats.averageTime}ms` : '0ms';
  }
}

/**
 * Atualiza UI com estatísticas do storage
 */
function updateStorageStatisticsUI(stats) {
  const storageKeysElement = document.getElementById('storage-keys');
  if (storageKeysElement) {
    storageKeysElement.textContent = stats.totalKeys;
  }
  
  const searchCacheElement = document.getElementById('search-cache');
  if (searchCacheElement) {
    searchCacheElement.textContent = stats.searchKeys;
  }
  
  const storageSizeElement = document.getElementById('storage-size');
  if (storageSizeElement) {
    const sizeKB = (stats.totalSize / 1024).toFixed(2);
    storageSizeElement.textContent = `${sizeKB} KB`;
  }
}

/**
 * Atualiza informações de última salvação
 */
function updateLastSavedInfo() {
  const lastSavedElement = document.getElementById('last-saved');
  if (lastSavedElement && currentSettings.lastUpdated) {
    const lastSaved = new Date(currentSettings.lastUpdated);
    lastSavedElement.textContent = lastSaved.toLocaleString('pt-BR');
  }
}

/**
 * Notifica background sobre carregamento das opções
 */
async function notifyBackgroundOptionsLoaded() {
  try {
    await browser.runtime.sendMessage({
      type: 'optionsPageLoaded',
      timestamp: Date.now()
    });
  } catch (error) {
    console.warn('[OPTIONS] Erro ao notificar background sobre carregamento:', error);
  }
}

/**
 * Mostra mensagem para o usuário
 */
function showMessage(message, type = 'info') {
  const messageContainer = document.getElementById('message-container');
  if (!messageContainer) {
    console.log(`[OPTIONS] ${type.toUpperCase()}: ${message}`);
    return;
  }
  
  messageContainer.textContent = message;
  messageContainer.className = `message ${type}`;
  messageContainer.style.display = 'block';
  
  // Esconder após 5 segundos
  setTimeout(() => {
    messageContainer.style.display = 'none';
  }, 5000);
  
  console.log(`[OPTIONS] ${type.toUpperCase()}: ${message}`);
}

// Adicionar estilos para a página de opções
const optionsStyle = document.createElement('style');
optionsStyle.textContent = `
  .message {
    padding: 10px;
    border-radius: 4px;
    margin: 10px 0;
    display: none;
  }
  
  .message.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  .message.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  .message.info {
    background-color: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
  }
  
  .feedback {
    font-size: 12px;
    margin-top: 4px;
  }
  
  .feedback.success {
    color: #28a745;
  }
  
  .feedback.error {
    color: #dc3545;
  }
  
  .invalid {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
  }
  
  .dark-mode {
    background-color: #121212;
    color: #ffffff;
  }
  
  .dark-mode input,
  .dark-mode select,
  .dark-mode textarea {
    background-color: #2d2d2d;
    color: #ffffff;
    border-color: #444444;
  }
  
  .dark-mode .message.success {
    background-color: #1e4d28;
    color: #a5d6a7;
    border-color: #2e7d32;
  }
  
  .dark-mode .message.error {
    background-color: #4d1e1e;
    color: #ef9a9a;
    border-color: #d32f2f;
  }
  
  .dark-mode .message.info {
    background-color: #1e3a4d;
    color: #81d4fa;
    border-color: #0277bd;
  }
`;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    document.head.appendChild(optionsStyle);
  });
} else {
  document.head.appendChild(optionsStyle);
}

console.log('[OPTIONS] ✅ Script de opções carregado e configurado');