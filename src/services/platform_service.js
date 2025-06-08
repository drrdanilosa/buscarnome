/**
 * DeepAlias Hunter Pro - Serviço de Plataformas
 * @author drrdanilosa
 * @version 5.0.0
 * @date 2025-06-03
 */

class PlatformService {
  constructor() {
    this.platforms = [];
    this.isInitialized = false;
    this.lastLoadTime = 0;
    this.loadingPromise = null;
    this.totalPlatforms = 0;
    this.categories = new Set();
    this.loadAttempts = 0;
    
    // Carregar plataformas ao inicializar
    this.initialize();
  }
  
  /**
   * Inicializa o serviço de plataformas
   */
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('[PlatformService] Inicializando serviço de plataformas...');
    
    try {
      await this.loadPlatforms();
      this.isInitialized = true;
      console.log(`[PlatformService] Serviço inicializado com ${this.platforms.length} plataformas`);
    } catch (error) {
      console.error('[PlatformService] Erro ao inicializar serviço de plataformas:', error);
      // Tentar carregar plataformas de backup em caso de erro
      await this.loadFallbackPlatforms();
    }
  }
  
  /**
   * Carrega a lista completa de plataformas
   */
  async loadPlatforms() {
    // Evitar carregamentos simultâneos
    if (this.loadingPromise) {
      return this.loadingPromise;
    }
    
    this.loadingPromise = new Promise(async (resolve, reject) => {
      try {
        console.log('[PlatformService] Carregando plataformas...');
        
        // Carregar do storage local primeiro
        const stored = await browser.storage.local.get('platformsData');
        
        if (stored.platformsData && 
            stored.platformsData.timestamp &&
            stored.platformsData.platforms &&
            stored.platformsData.platforms.length > 0) {
          
          console.log(`[PlatformService] Carregadas ${stored.platformsData.platforms.length} plataformas do storage`);
          this.platforms = stored.platformsData.platforms;
          this.lastLoadTime = stored.platformsData.timestamp;
          this.processPlatformsData();
          resolve(this.platforms);
          return;
        }
        
        // Se não tiver cache válido, tentar carregar do arquivo completo
        try {
          console.log('[PlatformService] Tentando carregar arquivo platforms_complete.json...');
          const completeUrl = browser.runtime.getURL('data/platforms_complete.json');
          console.log('[PlatformService] URL do arquivo completo:', completeUrl);
          
          const response = await fetch(completeUrl);
          if (!response.ok) {
            throw new Error(`Falha ao carregar plataformas completas: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (!data || !Array.isArray(data)) {
            throw new Error('Dados de plataformas completas inválidos');
          }
          
          console.log(`[PlatformService] Carregadas ${data.length} plataformas do arquivo completo`);
          
          // Salvar no storage para acesso futuro
          this.platforms = data;
          this.lastLoadTime = Date.now();
          
          await browser.storage.local.set({
            platformsData: {
              platforms: this.platforms,
              timestamp: this.lastLoadTime
            }
          });
          
          this.processPlatformsData();
          resolve(this.platforms);
          return;
        } catch (completeError) {
          console.warn('[PlatformService] Erro ao carregar arquivo completo:', completeError);
          // Continuar para tentar o arquivo de fallback
        }
        
        // Tentar carregar o arquivo de fallback
        try {
          console.log('[PlatformService] Tentando carregar arquivo platforms_fallback.json...');
          const fallbackUrl = browser.runtime.getURL('data/platforms_fallback.json');
          console.log('[PlatformService] URL do arquivo fallback:', fallbackUrl);
          
          const response = await fetch(fallbackUrl);
          if (!response.ok) {
            throw new Error(`Falha ao carregar plataformas de fallback: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (!data || !Array.isArray(data)) {
            throw new Error('Dados de plataformas de fallback inválidos');
          }
          
          console.log(`[PlatformService] Carregadas ${data.length} plataformas do arquivo de fallback`);
          
          // Salvar no storage para acesso futuro
          this.platforms = data;
          this.lastLoadTime = Date.now();
          
          await browser.storage.local.set({
            platformsData: {
              platforms: this.platforms,
              timestamp: this.lastLoadTime
            }
          });
          
          this.processPlatformsData();
          resolve(this.platforms);
          return;
        } catch (fallbackError) {
          console.error('[PlatformService] Erro ao carregar arquivo de fallback:', fallbackError);
          // Usar plataformas hardcoded como último recurso
          this.useHardcodedPlatforms();
          resolve(this.platforms);
          return;
        }
      } catch (error) {
        console.error('[PlatformService] Erro ao carregar plataformas:', error);
        reject(error);
      } finally {
        this.loadingPromise = null;
      }
    });
    
    return this.loadingPromise;
  }
  
  /**
   * Carrega plataformas de backup em caso de falha
   */
  async loadFallbackPlatforms() {
    try {
      console.log('[PlatformService] Carregando plataformas de fallback...');
      
      // Usar plataformas hardcoded
      this.useHardcodedPlatforms();
      console.log(`[PlatformService] Usando ${this.platforms.length} plataformas hardcoded`);
      
      // Salvar no storage para acesso futuro
      await browser.storage.local.set({
        platformsData: {
          platforms: this.platforms,
          timestamp: this.lastLoadTime
        }
      });
      
      this.isInitialized = true;
      return this.platforms;
    } catch (error) {
      console.error('[PlatformService] Erro ao carregar plataformas de fallback:', error);
      
      // Como último recurso, usar um conjunto mínimo de plataformas
      this.useMinimalPlatforms();
      this.isInitialized = true;
      return this.platforms;
    }
  }
  
  /**
   * Usa plataformas hardcoded como último recurso
   */
  useHardcodedPlatforms() {
    console.log('[PlatformService] Usando plataformas hardcoded como último recurso');
    
    // Lista de plataformas essenciais
    this.platforms = [
      {
        name: "GitHub",
        url_format: "https://github.com/{username}",
        check_uri: "https://github.com/{username}",
        category: "developer"
      },
      {
        name: "Twitter",
        url_format: "https://twitter.com/{username}",
        check_uri: "https://twitter.com/{username}",
        category: "social"
      },
      {
        name: "Instagram",
        url_format: "https://instagram.com/{username}",
        check_uri: "https://instagram.com/{username}",
        category: "social"
      },
      {
        name: "Facebook",
        url_format: "https://facebook.com/{username}",
        check_uri: "https://facebook.com/{username}",
        category: "social"
      },
      {
        name: "LinkedIn",
        url_format: "https://linkedin.com/in/{username}",
        check_uri: "https://linkedin.com/in/{username}",
        category: "professional"
      },
      {
        name: "Reddit",
        url_format: "https://reddit.com/user/{username}",
        check_uri: "https://reddit.com/user/{username}",
        category: "social"
      },
      {
        name: "YouTube",
        url_format: "https://youtube.com/@{username}",
        check_uri: "https://youtube.com/@{username}",
        category: "social"
      },
      {
        name: "Medium",
        url_format: "https://medium.com/@{username}",
        check_uri: "https://medium.com/@{username}",
        category: "blog"
      },
      {
        name: "Pinterest",
        url_format: "https://pinterest.com/{username}",
        check_uri: "https://pinterest.com/{username}",
        category: "social"
      },
      {
        name: "TikTok",
        url_format: "https://tiktok.com/@{username}",
        check_uri: "https://tiktok.com/@{username}",
        category: "social"
      },
      {
        name: "Twitch",
        url_format: "https://twitch.tv/{username}",
        check_uri: "https://twitch.tv/{username}",
        category: "gaming"
      },
      {
        name: "Behance",
        url_format: "https://behance.net/{username}",
        check_uri: "https://behance.net/{username}",
        category: "design"
      },
      {
        name: "Dribbble",
        url_format: "https://dribbble.com/{username}",
        check_uri: "https://dribbble.com/{username}",
        category: "design"
      },
      {
        name: "Flickr",
        url_format: "https://flickr.com/people/{username}",
        check_uri: "https://flickr.com/people/{username}",
        category: "photography"
      },
      {
        name: "SoundCloud",
        url_format: "https://soundcloud.com/{username}",
        check_uri: "https://soundcloud.com/{username}",
        category: "music"
      },
      {
        name: "Spotify",
        url_format: "https://open.spotify.com/user/{username}",
        check_uri: "https://open.spotify.com/user/{username}",
        category: "music"
      },
      {
        name: "Steam",
        url_format: "https://steamcommunity.com/id/{username}",
        check_uri: "https://steamcommunity.com/id/{username}",
        category: "gaming"
      },
      {
        name: "DeviantArt",
        url_format: "https://{username}.deviantart.com",
        check_uri: "https://{username}.deviantart.com",
        category: "art"
      },
      {
        name: "Quora",
        url_format: "https://quora.com/profile/{username}",
        check_uri: "https://quora.com/profile/{username}",
        category: "knowledge"
      },
      {
        name: "Telegram",
        url_format: "https://t.me/{username}",
        check_uri: "https://t.me/{username}",
        category: "messaging"
      }
    ];
    
    this.lastLoadTime = Date.now();
    this.processPlatformsData();
  }
  
  /**
   * Usa um conjunto mínimo de plataformas como último recurso absoluto
   */
  useMinimalPlatforms() {
    console.log('[PlatformService] Usando conjunto mínimo de plataformas como último recurso absoluto');
    
    // Lista mínima de plataformas essenciais
    this.platforms = [
      {
        name: "GitHub",
        url_format: "https://github.com/{username}",
        check_uri: "https://github.com/{username}",
        category: "developer"
      },
      {
        name: "Twitter",
        url_format: "https://twitter.com/{username}",
        check_uri: "https://twitter.com/{username}",
        category: "social"
      },
      {
        name: "Instagram",
        url_format: "https://instagram.com/{username}",
        check_uri: "https://instagram.com/{username}",
        category: "social"
      },
      {
        name: "Facebook",
        url_format: "https://facebook.com/{username}",
        check_uri: "https://facebook.com/{username}",
        category: "social"
      },
      {
        name: "LinkedIn",
        url_format: "https://linkedin.com/in/{username}",
        check_uri: "https://linkedin.com/in/{username}",
        category: "professional"
      }
    ];
    
    this.lastLoadTime = Date.now();
    this.processPlatformsData();
  }
  
  /**
   * Processa os dados das plataformas após o carregamento
   */
  processPlatformsData() {
    this.totalPlatforms = this.platforms.length;
    this.categories = new Set(this.platforms.map(p => p.category).filter(Boolean));
    
    console.log(`[PlatformService] Processadas ${this.totalPlatforms} plataformas em ${this.categories.size} categorias`);
  }
  
  /**
   * Obtém todas as plataformas disponíveis
   * @param {Object} [options] - Opções de filtragem
   * @returns {Array} Lista de plataformas
   */
  getPlatforms(options = {}) {
    // Garantir que plataformas estejam carregadas
    if (!this.isInitialized || this.platforms.length === 0) {
      console.warn('[PlatformService] getPlatforms chamado antes da inicialização completa');
      
      // Se ainda não tiver tentado muitas vezes, tentar inicializar novamente
      if (this.loadAttempts < 3) {
        this.loadAttempts++;
        this.initialize();
      }
      
      // Retornar um conjunto mínimo em caso de falha
      if (this.platforms.length === 0) {
        this.useMinimalPlatforms();
      }
    }
    
    let result = [...this.platforms];
    
    // Aplicar filtros se necessário
    if (options.category) {
      result = result.filter(p => p.category === options.category);
    }
    
    if (options.categories && Array.isArray(options.categories)) {
      result = result.filter(p => options.categories.includes(p.category));
    }
    
    if (options.limit) {
      result = result.slice(0, options.limit);
    }
    
    console.log(`[PlatformService] Retornando ${result.length} plataformas${options.category ? ' da categoria ' + options.category : ''}${options.limit ? ' (limitado a ' + options.limit + ')' : ''}`);
    
    return result;
  }
  
  /**
   * Obtém categorias disponíveis
   * @returns {Array} Lista de categorias
   */
  getCategories() {
    return [...this.categories];
  }
  
  /**
   * Força o recarregamento das plataformas
   */
  async reloadPlatforms() {
    try {
      this.isInitialized = false;
      this.platforms = [];
      this.loadingPromise = null;
      this.loadAttempts = 0;
      
      // Limpar cache do storage
      await browser.storage.local.remove('platformsData');
      console.log('[PlatformService] Cache de plataformas limpo');
      
      await this.initialize();
      return this.platforms;
    } catch (error) {
      console.error('[PlatformService] Erro ao recarregar plataformas:', error);
      throw error;
    }
  }
  
  /**
   * Retorna estatísticas sobre plataformas
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      total: this.totalPlatforms,
      categories: this.categories.size,
      lastLoaded: this.lastLoadTime,
      isComplete: this.totalPlatforms > 20, // Considera completo se tiver mais de 20
      source: this.lastLoadSource || 'unknown'
    };
  }
}

// Exportar a classe
if (typeof module !== 'undefined') {
  module.exports = PlatformService;
} else {
  window.PlatformService = PlatformService;
}