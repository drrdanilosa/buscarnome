/**
 * DeepAlias Hunter Pro - Módulo de Análise de Dados
 * @author drrdanilosa
 * @version 5.0.0
 * @date 2025-06-03
 */

class DataAnalyzer {
    constructor() {
        this.tabData = new Map();
        this.sensitivePatterns = [
            { pattern: /onlyfans|porn|adult|xxx/i, level: 'high', category: 'adult' },
            { pattern: /naked|nude|sensual|sex/i, level: 'medium', category: 'suggestive' },
            { pattern: /bitcoin|wallet|crypto|password|login/i, level: 'high', category: 'financial' },
            { pattern: /ssn|social security|passport|license/i, level: 'high', category: 'personal' }
        ];
        
        // Cache para usernames detectados
        this.usernameCache = new Map();
        
        // Inicializar
        this.initialize();
    }
    
    /**
     * Inicializa o módulo de análise
     */
    initialize() {
        // Registrar ouvinte para mensagens do content script
        browser.runtime.onMessage.addListener((message, sender) => {
            if (message.type === 'content:pageData' && sender.tab) {
                this.processTabData(sender.tab.id, message.data);
                return true;
            }
        });
        
        // Carregar dados do storage na inicialização
        this.loadStoredData();
        
        console.log('[DataAnalyzer] Módulo de análise inicializado');
    }
    
    /**
     * Carrega dados armazenados anteriormente
     */
    async loadStoredData() {
        try {
            const data = await browser.storage.local.get('tabData');
            if (data.tabData) {
                // Converter o objeto em um Map
                Object.entries(data.tabData).forEach(([tabId, tabInfo]) => {
                    this.tabData.set(parseInt(tabId), tabInfo);
                });
                console.log(`[DataAnalyzer] Carregados dados de ${this.tabData.size} abas`);
            }
        } catch (error) {
            console.error('[DataAnalyzer] Erro ao carregar dados:', error);
        }
    }
    
    /**
     * Processa dados de uma aba
     * @param {number} tabId - ID da aba
     * @param {Object} data - Dados da página
     */
    processTabData(tabId, data) {
        if (!tabId || !data) return;
        
        // Verificar dados sensíveis
        const sensitiveContent = this.detectSensitiveContent(data);
        
        // Extrair usernames
        const usernames = this.extractUsernames(data);
        
        // Criar ou atualizar registro da aba
        const tabInfo = this.tabData.get(tabId) || {
            visits: [],
            usernames: new Set(),
            sensitiveContent: []
        };
        
        // Adicionar nova visita
        tabInfo.visits.push({
            url: data.url,
            title: data.title || '',
            timestamp: new Date().toISOString(),
            imageCount: data.imageCount || 0,
            usernameCount: data.usernameCount || 0
        });
        
        // Limitar o número de visitas armazenadas (manter as 50 mais recentes)
        if (tabInfo.visits.length > 50) {
            tabInfo.visits = tabInfo.visits.slice(-50);
        }
        
        // Adicionar usernames detectados
        if (usernames.length > 0) {
            usernames.forEach(username => {
                tabInfo.usernames.add(username);
            });
        }
        
        // Adicionar conteúdo sensível detectado
        if (sensitiveContent.isSensitive) {
            tabInfo.sensitiveContent.push({
                url: data.url,
                timestamp: new Date().toISOString(),
                categories: sensitiveContent.categories,
                level: sensitiveContent.level
            });
            
            // Gerar alerta se for conteúdo de alta sensibilidade
            if (sensitiveContent.level === 'high') {
                this.triggerSensitiveContentAlert(tabId, data.url, sensitiveContent);
            }
        }
        
        // Atualizar o registro da aba
        this.tabData.set(tabId, tabInfo);
        
        // Salvar dados no storage
        this.saveData();
        
        return sensitiveContent;
    }
    
    /**
     * Detecta conteúdo sensível nos dados da página
     * @param {Object} data - Dados da página
     * @returns {Object} Informações sobre conteúdo sensível
     */
    detectSensitiveContent(data) {
        const result = {
            isSensitive: false,
            categories: [],
            level: 'none',
            matches: []
        };
        
        // Texto a ser analisado (url + título)
        const text = `${data.url || ''} ${data.title || ''}`.toLowerCase();
        
        // Verificar padrões sensíveis
        for (const pattern of this.sensitivePatterns) {
            if (pattern.pattern.test(text)) {
                result.isSensitive = true;
                result.categories.push(pattern.category);
                
                // Atualizar nível de sensibilidade (high sobrescreve medium, medium sobrescreve low)
                if (pattern.level === 'high' || (pattern.level === 'medium' && result.level !== 'high')) {
                    result.level = pattern.level;
                }
                
                // Registrar correspondências
                const matches = text.match(pattern.pattern);
                if (matches) {
                    result.matches.push(...matches);
                }
            }
        }
        
        // Remover duplicatas de categorias
        result.categories = [...new Set(result.categories)];
        
        return result;
    }
    
    /**
     * Extrai possíveis usernames dos dados da página
     * @param {Object} data - Dados da página
     * @returns {Array} Lista de usernames detectados
     */
    extractUsernames(data) {
        const usernames = [];
        
        // Implementação básica - extrair de URLs comuns
        if (data.url) {
            // Verificar padrões comuns de URLs com username
            const urlPatterns = [
                // GitHub: github.com/username
                /github\.com\/([a-zA-Z0-9_-]{1,39})(?:\/|$)/g,
                // Twitter: twitter.com/username
                /twitter\.com\/([a-zA-Z0-9_]{1,15})(?:\/|$)/g,
                // Instagram: instagram.com/username
                /instagram\.com\/([a-zA-Z0-9_\.]{1,30})(?:\/|$)/g,
                // Facebook: facebook.com/username
                /facebook\.com\/([a-zA-Z0-9\._]{5,50})(?:\/|$)/g,
                // LinkedIn: linkedin.com/in/username
                /linkedin\.com\/in\/([a-zA-Z0-9_-]{5,100})(?:\/|$)/g
            ];
            
            for (const pattern of urlPatterns) {
                let match;
                // Reset do lastIndex para garantir que todas as ocorrências sejam encontradas
                pattern.lastIndex = 0;
                
                while ((match = pattern.exec(data.url)) !== null) {
                    if (match && match[1] && match[1].length >= 3) {
                        const username = match[1].toLowerCase();
                        
                        // Filtrar usernames comuns e irrelevantes
                        if (!this.isCommonUrlPath(username) && !usernames.includes(username)) {
                            usernames.push(username);
                            
                            // Adicionar ao cache global de usernames
                            this.cacheUsername(username, data.url);
                        }
                    }
                }
            }
        }
        
        return usernames;
    }
    
    /**
     * Verifica se é um caminho de URL comum (não um username)
     * @param {string} path - Caminho a verificar
     * @returns {boolean} Verdadeiro se for um caminho comum
     */
    isCommonUrlPath(path) {
        const commonPaths = [
            'settings', 'search', 'explore', 'about', 'contact', 
            'help', 'login', 'signup', 'register', 'profile',
            'home', 'trending', 'popular', 'news', 'messages',
            'notifications', 'privacy', 'terms', 'support'
        ];
        
        return commonPaths.includes(path.toLowerCase());
    }
    
    /**
     * Adiciona um username ao cache global com a origem
     * @param {string} username - Username detectado
     * @param {string} sourceUrl - URL de origem
     */
    cacheUsername(username, sourceUrl) {
        if (!this.usernameCache.has(username)) {
            this.usernameCache.set(username, { 
                sources: [],
                firstSeen: new Date().toISOString(),
                lastSeen: new Date().toISOString()
            });
        }
        
        const userData = this.usernameCache.get(username);
        userData.lastSeen = new Date().toISOString();
        
        // Adicionar fonte se ainda não existir
        if (!userData.sources.includes(sourceUrl)) {
            userData.sources.push(sourceUrl);
            
            // Limitar número de fontes
            if (userData.sources.length > 10) {
                userData.sources = userData.sources.slice(-10);
            }
        }
    }
    
    /**
     * Gera um alerta para conteúdo sensível
     * @param {number} tabId - ID da aba
     * @param {string} url - URL da página
     * @param {Object} sensitiveInfo - Informações sobre o conteúdo sensível
     */
    triggerSensitiveContentAlert(tabId, url, sensitiveInfo) {
        try {
            const categories = sensitiveInfo.categories.join(', ');
            
            // Enviar notificação
            browser.notifications.create(`sensitive-${tabId}-${Date.now()}`, {
                type: 'basic',
                iconUrl: browser.runtime.getURL('src/assets/icons/icon48.png'),
                title: 'Conteúdo Sensível Detectado',
                message: `Categoria(s): ${categories}\nURL: ${url}`
            });
            
            // Atualizar badge na aba
            browser.browserAction.setBadgeText({
                text: '!',
                tabId: tabId
            });
            
            browser.browserAction.setBadgeBackgroundColor({
                color: '#ff0000',
                tabId: tabId
            });
            
            console.log(`[DataAnalyzer] Alerta de conteúdo sensível gerado para aba ${tabId}`);
        } catch (error) {
            console.error('[DataAnalyzer] Erro ao gerar alerta:', error);
        }
    }
    
    /**
     * Salva os dados no storage local
     */
    async saveData() {
        try {
            // Converter o Map em um objeto para armazenamento
            const tabDataObj = {};
            for (const [tabId, tabInfo] of this.tabData.entries()) {
                // Converter Set de usernames para array
                const usernames = tabInfo.usernames ? [...tabInfo.usernames] : [];
                
                tabDataObj[tabId] = {
                    ...tabInfo,
                    usernames
                };
            }
            
            await browser.storage.local.set({ 
                tabData: tabDataObj,
                lastUpdate: new Date().toISOString()
            });
        } catch (error) {
            console.error('[DataAnalyzer] Erro ao salvar dados:', error);
        }
    }
    
    /**
     * Obtém dados de todas as abas
     * @returns {Object} Dados formatados de todas as abas
     */
    getAllTabsData() {
        const result = {};
        
        for (const [tabId, tabInfo] of this.tabData.entries()) {
            result[tabId] = {
                visits: tabInfo.visits || [],
                usernames: [...(tabInfo.usernames || [])], // Corrigido para evitar o erro TypeError
                sensitiveContent: tabInfo.sensitiveContent || [],
                stats: this.calculateTabStats(tabInfo)
            };
        }
        
        return result;
    }
    
    /**
     * Obtém dados de uma aba específica
     * @param {number} tabId - ID da aba
     * @returns {Object|null} Dados da aba ou null se não encontrada
     */
    getTabData(tabId) {
        const tabInfo = this.tabData.get(tabId);
        if (!tabInfo) return null;
        
        return {
            visits: tabInfo.visits || [],
            usernames: [...(tabInfo.usernames || [])], // Corrigido para evitar o erro TypeError
            sensitiveContent: tabInfo.sensitiveContent || [],
            stats: this.calculateTabStats(tabInfo)
        };
    }
    
    /**
     * Calcula estatísticas para uma aba
     * @param {Object} tabInfo - Informações da aba
     * @returns {Object} Estatísticas calculadas
     */
    calculateTabStats(tabInfo) {
        if (!tabInfo) return {
            totalVisits: 0,
            uniqueUrls: 0,
            usernamesFound: 0,
            imagesAnalyzed: 0,
            sensitiveContentCount: 0,
            lastVisit: null
        };
        
        return {
            totalVisits: (tabInfo.visits || []).length,
            uniqueUrls: new Set((tabInfo.visits || []).map(v => v.url)).size,
            usernamesFound: (tabInfo.usernames || []).size || 0,
            imagesAnalyzed: (tabInfo.visits || []).reduce((sum, v) => sum + (v.imageCount || 0), 0),
            sensitiveContentCount: (tabInfo.sensitiveContent || []).length || 0,
            lastVisit: tabInfo.visits && tabInfo.visits.length > 0 ? tabInfo.visits[tabInfo.visits.length - 1].timestamp : null
        };
    }
    
    /**
     * Exporta dados para formato JSON
     * @param {number} [tabId] - ID da aba específica (opcional)
     * @returns {string} Dados em formato JSON
     */
    exportToJson(tabId = null) {
        const data = tabId ? this.getTabData(tabId) : this.getAllTabsData();
        
        const exportData = {
            data,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '5.0.0',
                generator: 'DeepAlias Hunter Pro'
            }
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    /**
     * Exporta dados para formato CSV
     * @param {number} [tabId] - ID da aba específica (opcional)
     * @returns {string} Dados em formato CSV
     */
    exportToCsv(tabId = null) {
        const tabsData = tabId ? { [tabId]: this.getTabData(tabId) } : this.getAllTabsData();
        
        // Cabeçalhos CSV
        const headers = [
            'Tab ID', 'URL', 'Title', 'Timestamp', 
            'Image Count', 'Username Count', 
            'Sensitive Content', 'Usernames Found'
        ].join(',');
        
        const rows = [];
        
        // Gerar linhas para cada visita em cada aba
        for (const [currentTabId, tabInfo] of Object.entries(tabsData)) {
            if (!tabInfo || !tabInfo.visits) continue;
            
            for (const visit of tabInfo.visits) {
                const sensitiveForUrl = (tabInfo.sensitiveContent || []).filter(s => s.url === visit.url);
                const hasSensitiveContent = sensitiveForUrl.length > 0;
                
                const row = [
                    currentTabId,
                    `"${visit.url ? visit.url.replace(/"/g, '""') : ''}"`,
                    `"${(visit.title || '').replace(/"/g, '""')}"`,
                    visit.timestamp || '',
                    visit.imageCount || 0,
                    visit.usernameCount || 0,
                    hasSensitiveContent ? 'Sim' : 'Não',
                    `"${[...(tabInfo.usernames || [])].join(', ')}"`
                ].join(',');
                
                rows.push(row);
            }
        }
        
        return [headers, ...rows].join('\n');
    }
    
    /**
     * Limpa dados de uma aba específica ou de todas as abas
     * @param {number} [tabId] - ID da aba específica (opcional)
     */
    async clearData(tabId = null) {
        if (tabId) {
            this.tabData.delete(tabId);
        } else {
            this.tabData.clear();
        }
        
        await this.saveData();
    }
}

// Exportar a classe
if (typeof module !== 'undefined') {
    module.exports = DataAnalyzer;
} else {
    window.DataAnalyzer = DataAnalyzer;
}

// Inicializar se estiver no contexto do background
if (typeof browser !== 'undefined' && browser.extension) {
    window.dataAnalyzer = new DataAnalyzer();
}