/**
 * DeepAlias Hunter Pro - Gerenciador de Abas
 * @author drrdanilosa
 * @version 5.0.0
 * @date 2025-06-03
 */

class TabManager {
  constructor() {
    this.activeTabs = new Map();
    this.tabSettings = new Map();
    
    // Inicializar
    this.initialize();
  }
  
  /**
   * Inicializa o gerenciador de abas
   */
  initialize() {
    // Carregar dados existentes do storage
    this.loadStoredData();
    
    // Configurar listeners de eventos de abas
    this.setupTabEventListeners();
    
    console.log('[TabManager] Gerenciador de abas inicializado');
  }
  
  /**
   * Configura listeners para eventos de abas
   */
  setupTabEventListeners() {
    // Quando uma aba é criada
    browser.tabs.onCreated.addListener(tab => {
      this.registerTab(tab);
    });
    
    // Quando uma aba é fechada
    browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
      this.unregisterTab(tabId);
    });
    
    // Quando uma aba é atualizada
    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete') {
        this.updateTab(tabId, tab);
      }
    });
    
    // Quando a aba ativa muda
    browser.tabs.onActivated.addListener(activeInfo => {
      this.setActiveTab(activeInfo.tabId);
    });
    
    // Coletar todas as abas existentes ao iniciar
    browser.tabs.query({}).then(tabs => {
      tabs.forEach(tab => {
        this.registerTab(tab);
      });
    });
  }
  
  /**
   * Carrega dados armazenados
   */
  async loadStoredData() {
    try {
      const data = await browser.storage.local.get('tabData');
      
      if (data.tabData) {
        // Converter o objeto em um Map
        Object.entries(data.tabData).forEach(([tabId, tabInfo]) => {
          this.tabSettings.set(parseInt(tabId), tabInfo);
        });
        
        console.log(`[TabManager] Carregados dados de ${this.tabSettings.size} abas do storage`);
      }
    } catch (error) {
      console.error('[TabManager] Erro ao carregar dados de abas:', error);
    }
  }
  
  /**
   * Salva dados no storage
   */
  async saveData() {
    try {
      // Converter o Map em um objeto para armazenamento
      const tabDataObj = {};
      
      for (const [tabId, tabInfo] of this.tabSettings.entries()) {
        tabDataObj[tabId] = tabInfo;
      }
      
      await browser.storage.local.set({ 
        tabData: tabDataObj,
        lastTabUpdate: new Date().toISOString()
      });
      
      console.log(`[TabManager] Dados de ${this.tabSettings.size} abas salvos no storage`);
    } catch (error) {
      console.error('[TabManager] Erro ao salvar dados de abas:', error);
    }
  }
  
  /**
   * Registra uma nova aba
   * @param {Object} tab - Objeto da aba do browser
   */
  registerTab(tab) {
    if (!tab || !tab.id) return;
    
    // Adicionar à lista de abas ativas
    this.activeTabs.set(tab.id, {
      url: tab.url,
      title: tab.title,
      favIconUrl: tab.favIconUrl,
      lastUpdated: new Date().toISOString()
    });
    
    // Se não existir nas configurações, criar
    if (!this.tabSettings.has(tab.id)) {
      this.tabSettings.set(tab.id, {
        created: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        settings: {},
        history: []
      });
      
      // Salvar dados
      this.saveData();
    }
    
    console.log(`[TabManager] Aba registrada: ${tab.id} - ${tab.title}`);
  }
  
  /**
   * Remove o registro de uma aba
   * @param {number} tabId - ID da aba
   */
  unregisterTab(tabId) {
    // Remover da lista de abas ativas
    if (this.activeTabs.has(tabId)) {
      this.activeTabs.delete(tabId);
      console.log(`[TabManager] Aba desregistrada: ${tabId}`);
    }
    
    // Nota: Não removemos dos settings para manter o histórico
  }
  
  /**
   * Atualiza informações de uma aba
   * @param {number} tabId - ID da aba
   * @param {Object} tab - Objeto da aba do browser
   */
  updateTab(tabId, tab) {
    // Verificar se a aba existe
    if (!tab || !tab.id) return;
    
    // Atualizar na lista de abas ativas
    this.activeTabs.set(tabId, {
      url: tab.url,
      title: tab.title,
      favIconUrl: tab.favIconUrl,
      lastUpdated: new Date().toISOString()
    });
    
    // Atualizar nas configurações
    if (this.tabSettings.has(tabId)) {
      const tabInfo = this.tabSettings.get(tabId);
      
      // Adicionar ao histórico se for uma URL diferente
      if (!tabInfo.history.some(h => h.url === tab.url)) {
        tabInfo.history.push({
          url: tab.url,
          title: tab.title,
          timestamp: new Date().toISOString()
        });
        
        // Limitar o histórico a 50 entradas
        if (tabInfo.history.length > 50) {
          tabInfo.history = tabInfo.history.slice(-50);
        }
      }
      
      // Atualizar última visita
      tabInfo.lastVisit = new Date().toISOString();
      
      // Salvar
      this.tabSettings.set(tabId, tabInfo);
      this.saveData();
    }
  }
  
  /**
   * Define a aba ativa atual
   * @param {number} tabId - ID da aba
   */
  setActiveTab(tabId) {
    // Apenas registrar para referência
    console.log(`[TabManager] Aba ativa alterada para: ${tabId}`);
  }
  
  /**
   * Obtém dados de uma aba específica
   * @param {number} tabId - ID da aba
   * @returns {Object|null} - Dados da aba ou null se não encontrada
   */
  getTabData(tabId) {
    // Verificar se a aba existe nos settings
    if (this.tabSettings.has(tabId)) {
      return this.tabSettings.get(tabId);
    }
    
    return null;
  }
  
  /**
   * Obtém dados de todas as abas
   * @returns {Object} - Objeto com dados de todas as abas
   */
  getAllTabsData() {
    const result = {};
    
    for (const [tabId, tabInfo] of this.tabSettings.entries()) {
      result[tabId] = tabInfo;
    }
    
    return result;
  }
  
  /**
   * Obtém todas as abas ativas
   * @returns {Array} - Lista de abas ativas
   */
  getActiveTabs() {
    return Array.from(this.activeTabs.entries()).map(([tabId, tabInfo]) => ({
      id: tabId,
      ...tabInfo
    }));
  }
  
  /**
   * Salva configurações específicas para uma aba
   * @param {number} tabId - ID da aba
   * @param {Object} settings - Configurações a salvar
   */
  async saveTabSettings(tabId, settings) {
    // Verificar se a aba existe
    if (!this.tabSettings.has(tabId)) {
      this.tabSettings.set(tabId, {
        created: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        settings: {},
        history: []
      });
    }
    
    // Atualizar configurações
    const tabInfo = this.tabSettings.get(tabId);
    tabInfo.settings = {
      ...tabInfo.settings,
      ...settings,
      lastUpdated: new Date().toISOString()
    };
    
    // Salvar
    this.tabSettings.set(tabId, tabInfo);
    await this.saveData();
    
    return tabInfo;
  }
  
  /**
   * Adiciona uma entrada ao histórico de uma aba
   * @param {number} tabId - ID da aba
   * @param {Object} entry - Entrada a adicionar
   */
  async addToTabHistory(tabId, entry) {
    // Verificar se a aba existe
    if (!this.tabSettings.has(tabId)) {
      this.tabSettings.set(tabId, {
        created: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        settings: {},
        history: []
      });
    }
    
    // Adicionar ao histórico
    const tabInfo = this.tabSettings.get(tabId);
    
    tabInfo.history.push({
      ...entry,
      timestamp: new Date().toISOString()
    });
    
    // Limitar o histórico a 50 entradas
    if (tabInfo.history.length > 50) {
      tabInfo.history = tabInfo.history.slice(-50);
    }
    
    // Atualizar última visita
    tabInfo.lastVisit = new Date().toISOString();
    
    // Salvar
    this.tabSettings.set(tabId, tabInfo);
    await this.saveData();
    
    return tabInfo;
  }
  
  /**
   * Limpa dados de uma aba específica
   * @param {number} tabId - ID da aba
   */
  async clearTabData(tabId) {
    if (this.tabSettings.has(tabId)) {
      this.tabSettings.delete(tabId);
      await this.saveData();
      console.log(`[TabManager] Dados da aba ${tabId} limpos`);
    }
  }
  
  /**
   * Limpa dados de todas as abas
   */
  async clearAllTabsData() {
    this.tabSettings.clear();
    await this.saveData();
    console.log('[TabManager] Dados de todas as abas limpos');
  }
}

// Exportar a classe
if (typeof module !== 'undefined') {
  module.exports = TabManager;
} else {
  window.TabManager = TabManager;
}

// Inicializar se estiver no contexto do background
if (typeof browser !== 'undefined' && browser.extension) {
  window.tabManager = new TabManager();
}