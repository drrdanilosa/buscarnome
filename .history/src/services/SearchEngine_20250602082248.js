/**
 * SearchEngine - Motor de busca principal com suporte a múltiplas plataformas e análise de termos
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';

const logger = new Logger({ level: 'info' });

/**
 * Generate a simple UUID v4
 * @returns {string} UUID string
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class SearchEngine {
  constructor(platformService, platformChecker, usernameVariator, riskScoreCalculator, falsePositiveReducer, keywordAnalyzer) {
    this.platformService = platformService;
    this.platformChecker = platformChecker;
    this.usernameVariator = usernameVariator;
    this.riskScoreCalculator = riskScoreCalculator;
    this.falsePositiveReducer = falsePositiveReducer;
    this.keywordAnalyzer = keywordAnalyzer;
    this.activeSearches = new Map();
    
    logger.info('SearchEngine inicializado');
  }

  /**
   * Inicia uma busca por username em múltiplas plataformas
   * @param {string} username - Username a ser buscado
   * @param {object} options - Opções de busca
   * @returns {Promise<object>} - Resultados da busca
   */
  async search(username, options = {}) {
    const searchId = uuidv4();
    const startTime = Date.now();
    
    logger.info(`Iniciando busca para "${username}" (ID: ${searchId})`, { options });
    
    // Configurações padrão
    const defaultOptions = {
      includeAdult: true,
      includeTor: false,
      priorityOnly: false,
      categories: [], // Vazio = todas as categorias
      maxVariations: 50,
      maxPlatforms: 100,
      timeout: 120000, // 2 minutos
      includeKeywords: true,
      keywordThreshold: 50 // Pontuação mínima para considerar correspondência de palavras-chave
    };
    
    // Mesclar opções padrão com as fornecidas
    const searchOptions = { ...defaultOptions, ...options };
    
    // Criar objeto de status da busca
    const searchStatus = {
      id: searchId,
      username,
      options: searchOptions,
      status: 'running',
      startTime,
      endTime: null,
      progress: 0,
      platformsChecked: 0,
      platformsTotal: 0,
      variationsGenerated: 0,
      results: [],
      errors: []
    };
    
    // Armazenar status da busca
    this.activeSearches.set(searchId, searchStatus);
    
    try {
      // Gerar variações do username
      const variations = await this.usernameVariator.generateVariations(username, searchOptions.maxVariations);
      searchStatus.variationsGenerated = variations.length;
      
      // Obter plataformas para verificação
      let platforms = this.platformService.getAllPlatforms();
      
      // Filtrar plataformas adultas se necessário
      if (!searchOptions.includeAdult) {
        platforms = platforms.filter(platform => !platform.adult);
      }
      
      // Filtrar plataformas Tor se necessário
      if (!searchOptions.includeTor) {
        platforms = platforms.filter(platform => !platform.requiresTor);
      }
      
      // Filtrar por categorias se especificado
      if (searchOptions.categories && searchOptions.categories.length > 0) {
        platforms = platforms.filter(platform => 
          searchOptions.categories.includes(platform.category)
        );
      }
      
      // Filtrar por prioridade se solicitado
      if (searchOptions.priorityOnly) {
        platforms = platforms.filter(platform => 
          platform.priority === 'critical' || platform.priority === 'high'
        );
      }
      
      // Limitar número de plataformas
      if (platforms.length > searchOptions.maxPlatforms) {
        // Ordenar por prioridade antes de limitar
        platforms.sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        
        platforms = platforms.slice(0, searchOptions.maxPlatforms);
      }
      
      searchStatus.platformsTotal = platforms.length;
      
      // Criar array de promessas para verificação paralela
      const checkPromises = [];
      
      // Para cada plataforma, verificar cada variação
      for (const platform of platforms) {
        // Verificar se a busca foi cancelada
        if (searchStatus.status === 'cancelled') {
          break;
        }
        
        // Determinar quais variações usar para esta plataforma
        let platformVariations = [username]; // Sempre incluir o username original
        
        // Para plataformas de alta prioridade, usar mais variações
        if (platform.priority === 'critical' || platform.priority === 'high') {
          platformVariations = platformVariations.concat(variations.slice(0, 20));
        } else if (platform.priority === 'medium') {
          platformVariations = platformVariations.concat(variations.slice(0, 10));
        } else {
          platformVariations = platformVariations.concat(variations.slice(0, 5));
        }
        
        // Remover duplicatas
        platformVariations = [...new Set(platformVariations)];
        
        for (const variation of platformVariations) {
          // Verificar se a busca foi cancelada
          if (searchStatus.status === 'cancelled') {
            break;
          }
          
          // Criar promessa para verificação
          const checkPromise = this.platformChecker.check(variation, platform)
            .then(result => {
              // Verificar se a busca foi cancelada
              if (searchStatus.status === 'cancelled') {
                return null;
              }
              
              // Processar resultado
              if (result.exists) {
                // Calcular pontuação de risco
                const riskScore = this.riskScoreCalculator.calculateScore(result, platform);
                
                // Verificar falsos positivos
                const isFalsePositive = this.falsePositiveReducer.isFalsePositive(result, platform, variation);
                
                if (!isFalsePositive) {
                  // Adicionar resultado
                  searchStatus.results.push({
                    platform: platform.name,
                    platformUrl: result.url,
                    username: variation,
                    originalUsername: username,
                    isVariation: variation !== username,
                    risk: riskScore.risk,
                    riskScore: riskScore.score,
                    confidence: result.confidence || 'high',
                    category: platform.category,
                    adult: platform.adult || false,
                    message: result.message,
                    timestamp: Date.now()
                  });
                }
              }
              
              // Atualizar progresso
              searchStatus.platformsChecked++;
              searchStatus.progress = Math.round((searchStatus.platformsChecked / searchStatus.platformsTotal) * 100);
              
              return result;
            })
            .catch(error => {
              // Registrar erro
              logger.error(`Erro ao verificar ${variation} em ${platform.name}`, error);
              
              searchStatus.errors.push({
                platform: platform.name,
                username: variation,
                error: error.message || 'Erro desconhecido'
              });
              
              // Atualizar progresso mesmo em caso de erro
              searchStatus.platformsChecked++;
              searchStatus.progress = Math.round((searchStatus.platformsChecked / searchStatus.platformsTotal) * 100);
              
              return null;
            });
          
          checkPromises.push(checkPromise);
        }
      }
      
      // Adicionar busca por palavras-chave se habilitado
      if (searchOptions.includeKeywords) {
        const keywordPromise = this._searchKeywords(username, variations, searchOptions)
          .then(keywordResults => {
            // Verificar se a busca foi cancelada
            if (searchStatus.status === 'cancelled') {
              return null;
            }
            
            // Adicionar resultados de palavras-chave
            searchStatus.results = searchStatus.results.concat(keywordResults);
            
            return keywordResults;
          })
          .catch(error => {
            logger.error(`Erro na busca por palavras-chave para ${username}`, error);
            return null;
          });
        
        checkPromises.push(keywordPromise);
      }
      
      // Aguardar todas as verificações ou timeout
      const timeoutPromise = new Promise(resolve => {
        setTimeout(() => {
          if (searchStatus.status === 'running') {
            logger.warn(`Timeout da busca para "${username}" após ${searchOptions.timeout}ms`);
            resolve(null);
          }
        }, searchOptions.timeout);
      });
      
      await Promise.race([
        Promise.all(checkPromises),
        timeoutPromise
      ]);
      
      // Finalizar busca
      searchStatus.endTime = Date.now();
      searchStatus.status = searchStatus.status === 'cancelled' ? 'cancelled' : 'completed';
      searchStatus.duration = searchStatus.endTime - searchStatus.startTime;
      
      // Ordenar resultados por risco (do mais alto para o mais baixo)
      searchStatus.results.sort((a, b) => b.riskScore - a.riskScore);
      
      logger.info(`Busca para "${username}" concluída em ${searchStatus.duration}ms com ${searchStatus.results.length} resultados`);
      
      return {
        searchId,
        username,
        status: searchStatus.status,
        progress: searchStatus.progress,
        platformsChecked: searchStatus.platformsChecked,
        platformsTotal: searchStatus.platformsTotal,
        variationsGenerated: searchStatus.variationsGenerated,
        resultsCount: searchStatus.results.length,
        highRiskCount: searchStatus.results.filter(r => r.risk === 'high').length,
        mediumRiskCount: searchStatus.results.filter(r => r.risk === 'medium').length,
        lowRiskCount: searchStatus.results.filter(r => r.risk === 'low').length,
        duration: searchStatus.duration,
        results: searchStatus.results,
        errors: searchStatus.errors
      };
    } catch (error) {
      logger.error(`Erro fatal na busca para "${username}"`, error);
      
      searchStatus.endTime = Date.now();
      searchStatus.status = 'error';
      searchStatus.duration = searchStatus.endTime - searchStatus.startTime;
      
      return {
        searchId,
        username,
        status: 'error',
        error: error.message || 'Erro desconhecido',
        duration: searchStatus.duration
      };
    }
  }
  
  /**
   * Realiza busca por palavras-chave associadas ao username
   * @param {string} username - Username principal
   * @param {Array<string>} variations - Variações do username
   * @param {object} options - Opções de busca
   * @returns {Promise<Array>} - Resultados da busca por palavras-chave
   * @private
   */
  async _searchKeywords(username, variations, options) {
    // Obter todas as palavras-chave disponíveis
    const allKeywords = this.platformService.getAllKeywords();
    
    // Criar array para armazenar resultados
    const keywordResults = [];
    
    try {
      // Simular busca em fontes genéricas (fóruns, blogs, etc.)
      const genericSources = [
        { name: 'Fóruns Gerais', category: 'forum', risk: 'medium', confidence: 'medium' },
        { name: 'Blogs e Comentários', category: 'blog', risk: 'low', confidence: 'medium' },
        { name: 'Redes Sociais', category: 'social', risk: 'medium', confidence: 'medium' },
        { name: 'Comunidades Adultas', category: 'adult', risk: 'high', confidence: 'medium', adult: true }
      ];
      
      // Filtrar fontes adultas se necessário
      const sources = options.includeAdult 
        ? genericSources 
        : genericSources.filter(source => !source.adult);
      
      // Para cada fonte, simular análise de conteúdo
      for (const source of sources) {
        // Simular texto contendo o username e algumas palavras-chave
        const simulatedText = this._generateSimulatedText(username, variations, allKeywords);
        
        // Analisar texto em busca de palavras-chave
        const keywordAnalysis = this.keywordAnalyzer.analyzeText(simulatedText, allKeywords);
        
        // Verificar se a pontuação atinge o limiar
        if (keywordAnalysis.score >= options.keywordThreshold) {
          // Verificar menções ao username
          const mentionAnalysis = this.keywordAnalyzer.findUsernameMentions(
            simulatedText, 
            username, 
            variations
          );
          
          if (mentionAnalysis.found) {
            // Adicionar resultado
            keywordResults.push({
              platform: source.name,
              platformUrl: `https://example.com/search?q=${encodeURIComponent(username)}`,
              username: username,
              originalUsername: username,
              isVariation: false,
              risk: source.risk,
              riskScore: keywordAnalysis.score,
              confidence: source.confidence,
              category: source.category,
              adult: source.adult || false,
              message: `Menções encontradas com ${mentionAnalysis.mentions.length} termos associados`,
              keywords: keywordAnalysis.terms,
              timestamp: Date.now()
            });
          }
        }
      }
      
      return keywordResults;
    } catch (error) {
      logger.error(`Erro na busca por palavras-chave para ${username}`, error);
      return [];
    }
  }
  
  /**
   * Gera texto simulado para análise de palavras-chave
   * @param {string} username - Username principal
   * @param {Array<string>} variations - Variações do username
   * @param {Array<string>} keywords - Lista de palavras-chave
   * @returns {string} - Texto simulado
   * @private
   */
  _generateSimulatedText(username, variations, keywords) {
    // Selecionar aleatoriamente algumas variações
    const selectedVariations = [username];
    if (variations.length > 0) {
      const randomVariations = variations
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(3, variations.length));
      
      selectedVariations.push(...randomVariations);
    }
    
    // Selecionar aleatoriamente algumas palavras-chave
    const selectedKeywords = keywords
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(10, keywords.length));
    
    // Gerar texto simulado
    const templates = [
      `Perfil de ${username} com conteúdo exclusivo. ${selectedKeywords.slice(0, 3).join(', ')}`,
      `Encontrei ${username} em um site de ${selectedKeywords.slice(0, 2).join(' e ')}`,
      `${username} (também conhecido como ${selectedVariations[1] || username}) oferece ${selectedKeywords.slice(0, 2).join(' e ')}`,
      `Novo conteúdo de ${username}: ${selectedKeywords.slice(0, 4).join(', ')}`,
      `${selectedKeywords.slice(0, 2).join(' ')} disponível no perfil de ${username}`,
      `${username} está oferecendo ${selectedKeywords.slice(0, 3).join(', ')}`,
      `Vazamento de conteúdo de ${username} (${selectedVariations[1] || username}) com ${selectedKeywords.slice(0, 2).join(' e ')}`
    ];
    
    // Selecionar aleatoriamente um template
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    return randomTemplate;
  }

  /**
   * Obtém o status atual de uma busca
   * @param {string} searchId - ID da busca
   * @returns {object} - Status da busca
   */
  getSearchStatus(searchId) {
    if (!this.activeSearches.has(searchId)) {
      return { error: 'Busca não encontrada' };
    }
    
    const searchStatus = this.activeSearches.get(searchId);
    
    return {
      searchId,
      username: searchStatus.username,
      status: searchStatus.status,
      progress: searchStatus.progress,
      platformsChecked: searchStatus.platformsChecked,
      platformsTotal: searchStatus.platformsTotal,
      variationsGenerated: searchStatus.variationsGenerated,
      resultsCount: searchStatus.results.length,
      highRiskCount: searchStatus.results.filter(r => r.risk === 'high').length,
      mediumRiskCount: searchStatus.results.filter(r => r.risk === 'medium').length,
      lowRiskCount: searchStatus.results.filter(r => r.risk === 'low').length,
      startTime: searchStatus.startTime,
      endTime: searchStatus.endTime,
      duration: searchStatus.endTime ? searchStatus.endTime - searchStatus.startTime : Date.now() - searchStatus.startTime
    };
  }

  /**
   * Cancela uma busca em andamento
   * @param {string} searchId - ID da busca
   * @returns {boolean} - Indica se a busca foi cancelada com sucesso
   */
  cancelSearch(searchId) {
    if (!this.activeSearches.has(searchId)) {
      return false;
    }
    
    const searchStatus = this.activeSearches.get(searchId);
    
    if (searchStatus.status === 'running') {
      searchStatus.status = 'cancelled';
      searchStatus.endTime = Date.now();
      searchStatus.duration = searchStatus.endTime - searchStatus.startTime;
      
      logger.info(`Busca ${searchId} cancelada após ${searchStatus.duration}ms`);
      
      return true;
    }
    
    return false;
  }

  /**
   * Limpa buscas antigas da memória
   * @param {number} maxAge - Idade máxima em milissegundos
   */
  clearOldSearches(maxAge = 3600000) { // 1 hora por padrão
    const now = Date.now();
    
    for (const [searchId, searchStatus] of this.activeSearches.entries()) {
      if (searchStatus.endTime && now - searchStatus.endTime > maxAge) {
        this.activeSearches.delete(searchId);
      }
    }
  }
}
