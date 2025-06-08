/**
 * DeepAlias Hunter Pro - Motor de Busca
 * @author drrdanilosa
 * @version 5.0.0
 * @date 2025-06-03
 */

class SearchEngine {
  constructor(platformService) {
    this.platformService = platformService;
    this.cache = new Map();
    this.activeTasks = new Map();
    this.cacheOnly = false;
    this.stats = {
      totalSearches: 0,
      cacheHits: 0,
      totalPlatformsChecked: 0,
      averageResponseTime: 0
    };
  }
  
  /**
   * Define modo de busca somente em cache
   * @param {boolean} enabled - Se o modo cache deve ser ativado
   */
  setCacheOnlyMode(enabled) {
    this.cacheOnly = enabled;
    console.log(`[SearchEngine] Modo somente cache ${enabled ? 'ativado' : 'desativado'}`);
  }
  
  /**
   * Inicia uma busca por username
   * @param {string} username - Username a ser pesquisado
   * @param {Object} options - Opções de busca
   * @returns {Promise<Array>} Resultados da busca
   */
  async search(username, options = {}) {
    if (!username || username.length < 2) {
      throw new Error('Username inválido ou muito curto');
    }
    
    console.log(`[SearchEngine] Iniciando busca para "${username}" com opções:`, options);
    
    // Normalizar username
    const normalizedUsername = username.toLowerCase().trim();
    
    // Incrementar contador de buscas
    this.stats.totalSearches++;
    
    // Verificar cache primeiro
    const cacheKey = this.getCacheKey(normalizedUsername, options);
    const cachedResults = this.getFromCache(cacheKey);
    
    if (cachedResults) {
      console.log(`[SearchEngine] Resultados encontrados em cache para "${normalizedUsername}"`);
      this.stats.cacheHits++;
      
      // Se forçar busca completa não estiver ativado, usar cache
      if (!options.forceCompleteSearch) {
        return this.processCachedResults(cachedResults, options);
      }
      
      console.log(`[SearchEngine] Forçar busca completa ativado, ignorando cache para "${normalizedUsername}"`);
    }
    
    // Se modo somente cache estiver ativado e não forçar busca completa, retornar erro
    if (this.cacheOnly && !options.forceCompleteSearch) {
      console.log(`[SearchEngine] Modo somente cache ativado, recusando busca para "${normalizedUsername}"`);
      throw new Error('Busca recusada: modo somente cache ativado');
    }
    
    // Busca real em todas as plataformas
    return this.performSearch(normalizedUsername, options);
  }
  
  /**
   * Realiza a busca em todas as plataformas
   * @param {string} username - Username normalizado
   * @param {Object} options - Opções de busca
   * @returns {Promise<Array>} Resultados da busca
   */
  async performSearch(username, options) {
    const startTime = Date.now();
    
    // Obter plataformas baseado em opções
    let platforms = [];
    
    if (options.searchAll || options.forceCompleteSearch) {
      // Buscar em todas as plataformas
      platforms = this.platformService.getPlatforms();
      console.log(`[SearchEngine] Buscando em todas as ${platforms.length} plataformas`);
    } else if (options.categories && Array.isArray(options.categories)) {
      // Buscar em categorias específicas
      platforms = this.platformService.getPlatforms({ categories: options.categories });
      console.log(`[SearchEngine] Buscando em ${platforms.length} plataformas das categorias: ${options.categories.join(', ')}`);
    } else {
      // Buscar em plataformas prioritárias
      platforms = this.platformService.getPlatforms({ limit: 20 });
      console.log(`[SearchEngine] Buscando em ${platforms.length} plataformas prioritárias`);
    }
    
    // Verificar se há plataformas para buscar
    if (platforms.length === 0) {
      console.warn('[SearchEngine] Nenhuma plataforma disponível para busca');
      return [];
    }
    
    this.stats.totalPlatformsChecked += platforms.length;
    
    // Determinar o número de buscas simultâneas baseado nas opções
    const concurrentLimit = options.advancedSearch ? 5 : 10;
    
    // Registrar tarefa ativa
    const taskId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.activeTasks.set(taskId, {
      username,
      startTime,
      total: platforms.length,
      completed: 0,
      results: []
    });
    
    try {
      // Realizar busca em todas as plataformas com limite de concorrência
      const results = await this.searchWithConcurrencyLimit(platforms, username, concurrentLimit, taskId);
      
      // Calcular tempo de resposta
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Atualizar estatísticas
      this.updateResponseTimeStats(responseTime);
      
      // Salvar resultados no cache
      this.saveToCache(this.getCacheKey(username, options), results);
      
      console.log(`[SearchEngine] Busca concluída para "${username}" em ${responseTime}ms. Encontrados ${results.length} resultados.`);
      
      return results;
    } finally {
      // Remover tarefa ativa
      this.activeTasks.delete(taskId);
    }
  }
  
  /**
   * Realiza busca com limite de concorrência
   * @param {Array} platforms - Plataformas para buscar
   * @param {string} username - Username a buscar
   * @param {number} concurrentLimit - Limite de concorrência
   * @param {string} taskId - ID da tarefa
   * @returns {Promise<Array>} Resultados da busca
   */
  async searchWithConcurrencyLimit(platforms, username, concurrentLimit, taskId) {
    const results = [];
    const chunks = this.chunkArray(platforms, concurrentLimit);
    
    // Atualizar status da tarefa
    const taskStatus = this.activeTasks.get(taskId);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Log do progresso
      console.log(`[SearchEngine] Processando lote ${i + 1}/${chunks.length} (${chunk.length} plataformas)`);
      
      // Executar buscas neste lote em paralelo
      const chunkPromises = chunk.map(platform => this.checkPlatform(platform, username));
      const chunkResults = await Promise.all(chunkPromises);
      
      // Filtrar resultados válidos e adicionar aos resultados finais
      const validResults = chunkResults.filter(Boolean);
      results.push(...validResults);
      
      // Atualizar status da tarefa
      if (taskStatus) {
        taskStatus.completed += chunk.length;
        taskStatus.results = [...results];
        this.activeTasks.set(taskId, taskStatus);
      }
    }
    
    return results;
  }
  
  /**
   * Verifica um username em uma plataforma específica
   * @param {Object} platform - Plataforma a verificar
   * @param {string} username - Username a verificar
   * @returns {Promise<Object|null>} Resultado da verificação
   */
  async checkPlatform(platform, username) {
    try {
      // Substituir {username} na URL
      const url = platform.url_format.replace(/{username}/g, username);
      const checkUrl = platform.check_uri.replace(/{username}/g, username);
      
      // Nesta implementação simplificada, apenas retornamos informações da plataforma
      // Em uma implementação real, faria uma requisição HEAD ou similar para verificar existência
      
      // Simulação de resultado
      // Em uma implementação real, isso seria baseado na resposta HTTP
      const status = Math.random() > 0.3 ? 'found' : 'not_found';
      
      return {
        platform: platform.name,
        username: username,
        status: status,
        url: url,
        favicon: `https://${new URL(url).hostname}/favicon.ico`,
        category: platform.category
      };
    } catch (error) {
      console.error(`[SearchEngine] Erro ao verificar ${platform.name}:`, error);
      return null;
    }
  }
  
  /**
   * Processa resultados do cache
   * @param {Array} cachedResults - Resultados em cache
   * @param {Object} options - Opções de busca
   * @returns {Array} Resultados processados
   */
  processCachedResults(cachedResults, options) {
    // Se houver filtragem por categoria no cache
    if (options.categories && Array.isArray(options.categories)) {
      return cachedResults.filter(result => 
        options.categories.includes(result.category)
      );
    }
    
    return cachedResults;
  }
  
  /**
   * Obtém chave de cache para um username e opções
   * @param {string} username - Username
   * @param {Object} options - Opções de busca
   * @returns {string} Chave de cache
   */
  getCacheKey(username, options) {
    const key = `${username}`;
    return key;
  }
  
  /**
   * Obtém resultados do cache
   * @param {string} key - Chave de cache
   * @returns {Array|null} Resultados ou null se não encontrado
   */
  getFromCache(key) {
    if (this.cache.has(key)) {
      const cacheEntry = this.cache.get(key);
      
      // Verificar validade do cache (1 hora)
      if (Date.now() - cacheEntry.timestamp < 3600000) {
        return cacheEntry.results;
      }
    }
    
    return null;
  }
  
  /**
   * Salva resultados no cache
   * @param {string} key - Chave de cache
   * @param {Array} results - Resultados a salvar
   */
  saveToCache(key, results) {
    this.cache.set(key, {
      results: results,
      timestamp: Date.now()
    });
    
    // Limitar tamanho do cache (máximo 100 entradas)
    if (this.cache.size > 100) {
      // Remover entrada mais antiga
      const oldestKey = [...this.cache.keys()][0];
      this.cache.delete(oldestKey);
    }
  }
  
  /**
   * Atualiza estatísticas de tempo de resposta
   * @param {number} responseTime - Tempo de resposta em ms
   */
  updateResponseTimeStats(responseTime) {
    // Atualizar média de tempo de resposta
    const oldAvg = this.stats.averageResponseTime;
    const totalSearches = this.stats.totalSearches;
    
    // Fórmula para atualizar média: newAvg = oldAvg + (newValue - oldAvg) / newCount
    this.stats.averageResponseTime = oldAvg + (responseTime - oldAvg) / totalSearches;
  }
  
  /**
   * Divide um array em pedaços menores
   * @param {Array} array - Array a dividir
   * @param {number} size - Tamanho de cada pedaço
   * @returns {Array} Array de pedaços
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  /**
   * Obtém estatísticas do motor de busca
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      ...this.stats,
      activeTasks: this.activeTasks.size,
      cacheSize: this.cache.size,
      cacheHitRate: this.stats.totalSearches > 0 
        ? (this.stats.cacheHits / this.stats.totalSearches * 100).toFixed(2) + '%'
        : '0%'
    };
  }
  
  /**
   * Limpa o cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[SearchEngine] Cache limpo');
  }
}

// Exportar a classe
if (typeof module !== 'undefined') {
  module.exports = SearchEngine;
} else {
  window.SearchEngine = SearchEngine;
}