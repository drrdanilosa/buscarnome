/**
 * DeepAlias Hunter Pro - Options Script
 * @author drrdanilosa
 * @version 4.0.1
 * @date 2025-06-03
 */

// Função para enviar mensagens para o background com retry
function sendMessageToBackground(message, timeout = 5000) {
    return new Promise((resolve, reject) => {
        try {
            // Adicionar metadados à mensagem
            const enhancedMessage = {
                ...message,
                _timestamp: Date.now(),
                _source: 'options'
            };
            
            // Configurar timeout
            const timeoutId = setTimeout(() => {
                console.error('Timeout excedido ao enviar mensagem para background');
                reject(new Error('Timeout ao comunicar com background script'));
            }, timeout);
            
            // Enviar mensagem
            browser.runtime.sendMessage(enhancedMessage)
                .then(response => {
                    clearTimeout(timeoutId);
                    
                    if (!response) {
                        reject(new Error('Resposta vazia do background'));
                        return;
                    }
                    
                    if (response.status === 'error') {
                        reject(new Error(response.error || 'Erro desconhecido'));
                        return;
                    }
                    
                    resolve(response);
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    
                    // Tentar via localStorage como fallback
                    if (message.type === 'getSettings') {
                        try {
                            const settings = JSON.parse(localStorage.getItem('deepaliasSettings') || '{}');
                            if (Object.keys(settings).length > 0) {
                                console.log('Usando configurações do localStorage como fallback');
                                resolve({ status: 'success', settings });
                                return;
                            }
                        } catch (e) {
                            console.warn('Erro ao ler configurações do localStorage:', e);
                        }
                    }
                    
                    reject(error);
                });
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            reject(error);
        }
    });
}

// Inicialização da página de opções
document.addEventListener('DOMContentLoaded', initialize);

/**
 * Inicializa a página de opções
 */
function initialize() {
    console.log('Inicializando página de configurações...');
    
    // Recuperar elementos da UI
    const saveButton = document.getElementById('save-button');
    const resetButton = document.getElementById('reset-button');
    
    // Configurar event listeners
    if (saveButton) {
        saveButton.addEventListener('click', saveSettings);
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', resetSettings);
    }
    
    // Carregar configurações existentes
    loadSettings().catch(error => {
        console.error('Erro ao carregar configurações:', error);
        
        // Usar configurações padrão
        applyDefaultSettings();
    });
    
    console.log('Página de configurações inicializada');
}

/**
 * Carrega as configurações do usuário
 */
async function loadSettings() {
    try {
        const response = await sendMessageToBackground({ type: 'getSettings' });
        
        if (response && response.settings) {
            applySettings(response.settings);
            return response.settings;
        } else {
            throw new Error('Resposta inválida');
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        
        // Tentar via localStorage
        try {
            const settings = JSON.parse(localStorage.getItem('deepaliasSettings') || '{}');
            if (Object.keys(settings).length > 0) {
                console.log('Usando configurações do localStorage como fallback');
                applySettings(settings);
                return settings;
            }
        } catch (e) {
            console.warn('Erro ao ler configurações do localStorage:', e);
        }
        
        throw error;
    }
}

/**
 * Aplica as configurações aos elementos da UI
 */
function applySettings(settings) {
    // Implementar a lógica para aplicar as configurações aos elementos da UI
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
    
    // Outros campos...
}

/**
 * Aplica configurações padrão
 */
function applyDefaultSettings() {
    const defaultSettings = {
        maxResults: 50,
        timeout: 30000,
        advancedSearch: false,
        searchAll: true,
        enableNotifications: true
    };
    
    applySettings(defaultSettings);
    
    // Salvar no localStorage para uso futuro
    try {
        localStorage.setItem('deepaliasSettings', JSON.stringify(defaultSettings));
    } catch (e) {
        console.warn('Erro ao salvar configurações padrão no localStorage:', e);
    }
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
            enableNotifications: document.getElementById('enable-notifications')?.checked || true,
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
            console.warn('Erro ao salvar configurações no localStorage:', e);
        }
        
        // Enviar para o background
        const response = await sendMessageToBackground({
            type: 'saveSettings',
            data: settings
        });
        
        showMessage('Configurações salvas com sucesso!', 'success');
        
        return response;
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        showMessage('Erro ao salvar configurações: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Restaura as configurações padrão
 */
function resetSettings() {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
        applyDefaultSettings();
        showMessage('Configurações padrão restauradas. Clique em Salvar para confirmar.', 'info');
    }
}

/**
 * Exibe uma mensagem na UI
 */
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('message-container');
    if (!messageContainer) return;
    
    messageContainer.textContent = message;
    messageContainer.className = `message ${type}`;
    messageContainer.style.display = 'block';
    
    // Auto-esconder após 5 segundos
    setTimeout(() => {
        messageContainer.style.display = 'none';
    }, 5000);
}