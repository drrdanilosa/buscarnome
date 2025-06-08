/**
 * DeepAlias Hunter Pro - Interface de Visualização de Dados
 * @author drrdanilosa
 * @version 5.0.0
 * @date 2025-06-03
 */

document.addEventListener('DOMContentLoaded', initialize);

// Referência para o analisador de dados
let dataAnalyzer = null;

// Tab atual
let currentTabId = null;

// Dados carregados
let loadedData = null;

/**
 * Inicializa a interface
 */
async function initialize() {
    console.log('[DataView] Inicializando interface de visualização...');
    
    // Obter referência para o analisador de dados
    if (browser.extension.getBackgroundPage() && browser.extension.getBackgroundPage().dataAnalyzer) {
        dataAnalyzer = browser.extension.getBackgroundPage().dataAnalyzer;
    } else {
        // Criar instância local se não estiver disponível no background
        dataAnalyzer = new DataAnalyzer();
        await new Promise(resolve => setTimeout(resolve, 500)); // Tempo para inicializar
    }
    
    // Obter ID da aba atual
    try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs && tabs.length > 0) {
            currentTabId = tabs[0].id;
        }
    } catch (error) {
        console.error('[DataView] Erro ao obter aba atual:', error);
    }
    
    // Carregar dados
    loadData();
    
    // Configurar navegação por abas
    setupTabs();
    
    // Configurar handlers de eventos
    setupEventHandlers();
    
    console.log('[DataView] Interface inicializada');
}

/**
 * Carrega os dados do analisador
 */
function loadData() {
    try {
        // Carregar todos os dados
        loadedData = dataAnalyzer.getAllTabsData();
        
        // Atualizar a interface com os dados
        updateSummaryPanel();
        updateUsernamesPanel();
        updateSensitivePanel();
        updateExportPanel();
        
        console.log('[DataView] Dados carregados:', loadedData);
    } catch (error) {
        console.error('[DataView] Erro ao carregar dados:', error);
        showError('Erro ao carregar dados. Por favor, tente novamente.');
    }
}

/**
 * Configura a navegação por abas
 */
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const panels = document.querySelectorAll('.panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover classe ativa de todos os botões e painéis
            tabButtons.forEach(btn => btn.classList.remove('active'));
            panels.forEach(panel => panel.classList.remove('active'));
            
            // Adicionar classe ativa ao botão clicado
            button.classList.add('active');
            
            // Mostrar o painel correspondente
            const panelId = `panel-${button.id.split('-')[1]}`;
            document.getElementById(panelId).classList.add('active');
        });
    });
}

/**
 * Configura handlers de eventos
 */
function setupEventHandlers() {
    // Filtro de usernames
    const usernameFilter = document.getElementById('username-filter');
    if (usernameFilter) {
        usernameFilter.addEventListener('input', updateUsernamesPanel);
    }
    
    // Ordenação de usernames
    const usernameSort = document.getElementById('username-sort');
    if (usernameSort) {
        usernameSort.addEventListener('change', updateUsernamesPanel);
    }
    
    // Filtros de conteúdo sensível
    const sensitiveCategory = document.getElementById('sensitive-category');
    const sensitiveLevel = document.getElementById('sensitive-level');
    
    if (sensitiveCategory) {
        sensitiveCategory.addEventListener('change', updateSensitivePanel);
    }
    
    if (sensitiveLevel) {
        sensitiveLevel.addEventListener('change', updateSensitivePanel);
    }
    
    // Botão de exportação
    const exportButton = document.getElementById('export-button');
    if (exportButton) {
        exportButton.addEventListener('click', exportData);
    }
    
    // Opções de exportação (para atualizar preview)
    const exportOptions = document.querySelectorAll('input[name="export-format"], input[name="export-scope"]');
    exportOptions.forEach(option => {
        option.addEventListener('change', updateExportPreview);
    });
    
    // Botão de limpar dados
    const clearDataButton = document.getElementById('clear-data-button');
    if (clearDataButton) {
        clearDataButton.addEventListener('click', confirmClearData);
    }
    
    // Botão de voltar
    const backButton = document.getElementById('back-to-main');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.href = 'popup.html';
        });
    }
}

/**
 * Atualiza o painel de resumo
 */
function updateSummaryPanel() {
    if (!loadedData) return;
    
    // Calcular estatísticas gerais
    let totalPages = 0;
    let totalUsernames = 0;
    let totalImages = 0;
    let totalSensitive = 0;
    let recentVisits = [];
    
    // Processar dados de todas as abas
    for (const [tabId, tabInfo] of Object.entries(loadedData)) {
        totalPages += tabInfo.stats.uniqueUrls;
        totalUsernames += tabInfo.usernames.length;
        totalImages += tabInfo.stats.imagesAnalyzed;
        totalSensitive += tabInfo.sensitiveContent.length;
        
        // Coletar visitas recentes
        tabInfo.visits.forEach(visit => {
            recentVisits.push({
                ...visit,
                tabId
            });
        });
    }
    
    // Atualizar elementos da interface
    document.getElementById('total-pages').textContent = totalPages;
    document.getElementById('total-usernames').textContent = totalUsernames;
    document.getElementById('total-images').textContent = totalImages;
    document.getElementById('total-sensitive').textContent = totalSensitive;
    
    // Ordenar visitas por data (mais recentes primeiro)
    recentVisits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limitar a 10 visitas mais recentes
    recentVisits = recentVisits.slice(0, 10);
    
    // Exibir lista de atividades recentes
    const recentList = document.getElementById('recent-list');
    
    if (recentVisits.length === 0) {
        recentList.innerHTML = '<div class="empty-state">Nenhuma atividade registrada</div>';
        return;
    }
    
    let html = '';
    recentVisits.forEach(visit => {
        const date = new Date(visit.timestamp);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        const isSensitive = Object.values(loadedData).some(tabInfo => 
            tabInfo.sensitiveContent.some(content => content.url === visit.url)
        );
        
        html += `
            <div class="recent-item ${isSensitive ? 'sensitive' : ''}">
                <div class="recent-header">
                    <span class="recent-date">${formattedDate}</span>
                    ${isSensitive ? '<span class="sensitive-tag">Conteúdo Sensível</span>' : ''}
                </div>
                <div class="recent-title" title="${visit.url}">${visit.title || 'Sem título'}</div>
                <div class="recent-meta">
                    <span>${visit.imageCount || 0} imagens</span>
                    <span>${visit.usernameCount || 0} usernames</span>
                </div>
            </div>
        `;
    });
    
    recentList.innerHTML = html;
}

/**
 * Atualiza o painel de usernames
 */
function updateUsernamesPanel() {
    if (!loadedData) return;
    
    const filterValue = document.getElementById('username-filter').value.toLowerCase();
    const sortValue = document.getElementById('username-sort').value;
    
    // Coletar todos os usernames de todas as abas
    let allUsernames = [];
    
    for (const [tabId, tabInfo] of Object.entries(loadedData)) {
        tabInfo.usernames.forEach(username => {
            // Verificar se já existe este username na lista
            const existing = allUsernames.find(u => u.username === username);
            
            if (existing) {
                // Atualizar fontes existentes
                existing.tabIds.add(tabId);
                tabInfo.visits.forEach(visit => {
                    if (!existing.sources.includes(visit.url)) {
                        existing.sources.push(visit.url);
                    }
                });
            } else {
                // Adicionar novo username
                allUsernames.push({
                    username,
                    tabIds: new Set([tabId]),
                    sources: tabInfo.visits.map(v => v.url).filter((v, i, a) => a.indexOf(v) === i),
                    lastSeen: tabInfo.visits.length > 0 ? tabInfo.visits[tabInfo.visits.length - 1].timestamp : null
                });
            }
        });
    }
    
    // Aplicar filtro
    if (filterValue) {
        allUsernames = allUsernames.filter(item => 
            item.username.toLowerCase().includes(filterValue)
        );
    }
    
    // Aplicar ordenação
    switch (sortValue) {
        case 'recent':
            allUsernames.sort((a, b) => new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0));
            break;
        case 'sources':
            allUsernames.sort((a, b) => b.sources.length - a.sources.length);
            break;
        case 'alpha':
            allUsernames.sort((a, b) => a.username.localeCompare(b.username));
            break;
    }
    
    // Exibir lista de usernames
    const usernameList = document.getElementById('username-list');
    
    if (allUsernames.length === 0) {
        usernameList.innerHTML = '<div class="empty-state">Nenhum username detectado</div>';
        return;
    }
    
    let html = '';
    allUsernames.forEach(item => {
        const date = item.lastSeen ? new Date(item.lastSeen) : null;
        const formattedDate = date ? `${date.toLocaleDateString()} ${date.toLocaleTimeString()}` : 'N/A';
        
        html += `
            <div class="username-item">
                <div class="username-header">
                    <span class="username">${item.username}</span>
                    <span class="source-count">${item.sources.length} fontes</span>
                </div>
                <div class="username-meta">
                    <span>Última detecção: ${formattedDate}</span>
                </div>
                <div class="username-sources">
                    ${item.sources.slice(0, 3).map(source => `
                        <a href="${source}" target="_blank" class="source-link" title="${source}">
                            ${new URL(source).hostname}
                        </a>
                    `).join('')}
                    ${item.sources.length > 3 ? `<span class="more-sources">+${item.sources.length - 3} mais</span>` : ''}
                </div>
                <div class="username-actions">
                    <button class="action-button search-button" data-username="${item.username}">
                        Buscar
                    </button>
                    <button class="action-button copy-button" data-username="${item.username}">
                        Copiar
                    </button>
                </div>
            </div>
        `;
    });
    
    usernameList.innerHTML = html;
    
    // Adicionar handlers para botões
    const searchButtons = usernameList.querySelectorAll('.search-button');
    searchButtons.forEach(button => {
        button.addEventListener('click', () => {
            const username = button.getAttribute('data-username');
            searchUsername(username);
        });
    });
    
    const copyButtons = usernameList.querySelectorAll('.copy-button');
    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const username = button.getAttribute('data-username');
            navigator.clipboard.writeText(username).then(() => {
                button.textContent = 'Copiado!';
                setTimeout(() => {
                    button.textContent = 'Copiar';
                }, 1500);
            });
        });
    });
}

/**
 * Inicia uma busca para um username
 * @param {string} username - Username para buscar
 */
function searchUsername(username) {
    // Redirecionar para a página principal com o username preenchido
    browser.runtime.sendMessage({
        type: 'presetUsername',
        username
    }).then(() => {
        window.location.href = 'popup.html';
    });
}

/**
 * Atualiza o painel de conteúdo sensível
 */
function updateSensitivePanel() {
    if (!loadedData) return;
    
    const categoryFilter = document.getElementById('sensitive-category').value;
    const levelFilter = document.getElementById('sensitive-level').value;
    
    // Coletar todos os alertas de conteúdo sensível
    let allSensitiveContent = [];
    
    for (const [tabId, tabInfo] of Object.entries(loadedData)) {
        tabInfo.sensitiveContent.forEach(content => {
            allSensitiveContent.push({
                ...content,
                tabId,
                title: tabInfo.visits.find(v => v.url === content.url)?.title || 'Sem título'
            });
        });
    }
    
    // Aplicar filtros
    if (categoryFilter !== 'all') {
        allSensitiveContent = allSensitiveContent.filter(item => 
            item.categories.includes(categoryFilter)
        );
    }
    
    if (levelFilter !== 'all') {
        allSensitiveContent = allSensitiveContent.filter(item => 
            item.level === levelFilter
        );
    }
    
    // Ordenar por data (mais recentes primeiro)
    allSensitiveContent.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Exibir lista de conteúdo sensível
    const sensitiveList = document.getElementById('sensitive-list');
    
    if (allSensitiveContent.length === 0) {
        sensitiveList.innerHTML = '<div class="empty-state">Nenhum conteúdo sensível detectado</div>';
        return;
    }
    
    let html = '';
    allSensitiveContent.forEach(item => {
        const date = new Date(item.timestamp);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        html += `
            <div class="sensitive-item level-${item.level}">
                <div class="sensitive-header">
                    <span class="sensitive-date">${formattedDate}</span>
                    <span class="sensitive-level ${item.level}">Nível: ${item.level}</span>
                </div>
                <div class="sensitive-title" title="${item.url}">${item.title}</div>
                <div class="sensitive-categories">
                    ${item.categories.map(category => `
                        <span class="category-tag category-${category}">${category}</span>
                    `).join('')}
                </div>
                <div class="sensitive-actions">
                    <a href="${item.url}" target="_blank" class="action-button">Abrir</a>
                    <button class="action-button ignore-button" data-url="${item.url}">Ignorar</button>
                </div>
            </div>
        `;
    });
    
    sensitiveList.innerHTML = html;
    
    // Adicionar handlers para botões de ignorar
    const ignoreButtons = sensitiveList.querySelectorAll('.ignore-button');
    ignoreButtons.forEach(button => {
        button.addEventListener('click', () => {
            const url = button.getAttribute('data-url');
            ignoreSensitiveContent(url);
        });
    });
}

/**
 * Ignora um alerta de conteúdo sensível
 * @param {string} url - URL do conteúdo a ignorar
 */
async function ignoreSensitiveContent(url) {
    try {
        // Para cada aba, remover alertas com esta URL
        for (const [tabId, tabInfo] of Object.entries(loadedData)) {
            loadedData[tabId].sensitiveContent = tabInfo.sensitiveContent.filter(item => item.url !== url);
        }
        
        // Atualizar storage
        await browser.storage.local.set({ tabData: loadedData });
        
        // Atualizar interface
        updateSensitivePanel();
        updateSummaryPanel();
        
        showMessage('Alerta ignorado com sucesso');
    } catch (error) {
        console.error('[DataView] Erro ao ignorar conteúdo:', error);
        showError('Erro ao ignorar alerta');
    }
}

/**
 * Atualiza o painel de exportação
 */
function updateExportPanel() {
    // Atualizar a pré-visualização da exportação
    updateExportPreview();
}

/**
 * Atualiza a pré-visualização da exportação
 */
function updateExportPreview() {
    const format = document.querySelector('input[name="export-format"]:checked').value;
    const scope = document.querySelector('input[name="export-scope"]:checked').value;
    
    const previewElement = document.getElementById('export-preview');
    
    try {
        let exportData;
        const tabId = scope === 'current' ? currentTabId : null;
        
        if (format === 'json') {
            exportData = dataAnalyzer.exportToJson(tabId);
            
            // Limitar tamanho para preview
            if (exportData.length > 2000) {
                exportData = exportData.substring(0, 2000) + '...\n(truncado para preview)';
            }
        } else {
            exportData = dataAnalyzer.exportToCsv(tabId);
            
            // Limitar linhas para preview
            const lines = exportData.split('\n');
            if (lines.length > 20) {
                exportData = lines.slice(0, 20).join('\n') + '\n...\n(truncado para preview)';
            }
        }
        
        previewElement.textContent = exportData;
    } catch (error) {
        console.error('[DataView] Erro ao gerar preview:', error);
        previewElement.textContent = 'Erro ao gerar pré-visualização';
    }
}

/**
 * Exporta os dados
 */
async function exportData() {
    try {
        const format = document.querySelector('input[name="export-format"]:checked').value;
        const scope = document.querySelector('input[name="export-scope"]:checked').value;
        
        // Determinar o escopo
        const tabId = scope === 'current' ? currentTabId : null;
        
        // Gerar dados conforme formato selecionado
        let data, filename, mimeType;
        
        if (format === 'json') {
            data = dataAnalyzer.exportToJson(tabId);
            filename = `deepalias_export_${new Date().toISOString().replace(/:/g, '-')}.json`;
            mimeType = 'application/json';
        } else {
            data = dataAnalyzer.exportToCsv(tabId);
            filename = `deepalias_export_${new Date().toISOString().replace(/:/g, '-')}.csv`;
            mimeType = 'text/csv';
        }
        
        // Criar Blob
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        // Iniciar download
        const downloadOptions = {
            url: url,
            filename: filename,
            saveAs: true
        };
        
        await browser.downloads.download(downloadOptions);
        showMessage('Exportação iniciada');
    } catch (error) {
        console.error('[DataView] Erro ao exportar dados:', error);
        showError('Erro ao exportar dados: ' + error.message);
    }
}

/**
 * Confirma a limpeza de dados
 */
function confirmClearData() {
    const scope = document.querySelector('input[name="export-scope"]:checked').value;
    const scopeText = scope === 'current' ? 'aba atual' : 'todas as abas';
    
    if (confirm(`Tem certeza que deseja limpar os dados da ${scopeText}? Esta ação não pode ser desfeita.`)) {
        const tabId = scope === 'current' ? currentTabId : null;
        clearData(tabId);
    }
}

/**
 * Limpa os dados
 * @param {number} [tabId] - ID da aba específica (opcional)
 */
async function clearData(tabId = null) {
    try {
        await dataAnalyzer.clearData(tabId);
        
        // Recarregar dados
        loadData();
        
        showMessage('Dados limpos com sucesso');
    } catch (error) {
        console.error('[DataView] Erro ao limpar dados:', error);
        showError('Erro ao limpar dados: ' + error.message);
    }
}

/**
 * Exibe uma mensagem de erro
 * @param {string} message - Mensagem de erro
 */
function showError(message) {
    // Implementar exibição de erro (ex: toast, alerta, etc)
    console.error('[DataView]', message);
    alert(message);
}

/**
 * Exibe uma mensagem de sucesso
 * @param {string} message - Mensagem de sucesso
 */
function showMessage(message) {
    // Implementar exibição de mensagem (ex: toast, alerta, etc)
    console.log('[DataView]', message);
    alert(message);
}