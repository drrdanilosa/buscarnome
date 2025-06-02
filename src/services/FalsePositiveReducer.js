/**
 * Estratégias avançadas para redução de falsos positivos
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';

const logger = new Logger({ level: 'info' });

export class FalsePositiveReducer {
  constructor(storageService, eventBus) {
    this.storageService = storageService;
    this.eventBus = eventBus;
    this.confidenceThreshold = 40; // Limiar padrão de confiança (%)
    this.contextSize = 100; // Tamanho do contexto em caracteres
    this.sensitiveTerms = this._loadSensitiveTerms();
    this.commonUsernames = this._loadCommonUsernames();
    
    logger.info('FalsePositiveReducer inicializado');
  }

  /**
   * Analisa um resultado para determinar se é um falso positivo
   * @param {object} result - Resultado a ser analisado
   * @returns {object} - Resultado com pontuação de confiança atualizada
   */
  analyzeResult(result) {
    if (!result) return null;
    
    // Clonar o resultado para não modificar o original
    const analyzedResult = { ...result };
    
    // Calcular pontuação base de confiança
    let confidenceScore = result.confidence || 50;
    
    // Aplicar análises para ajustar a pontuação
    confidenceScore = this._analyzeUrl(analyzedResult, confidenceScore);
    confidenceScore = this._analyzeContent(analyzedResult, confidenceScore);
    confidenceScore = this._analyzeUsername(analyzedResult, confidenceScore);
    confidenceScore = this._analyzeContext(analyzedResult, confidenceScore);
    
    // Limitar a pontuação entre 0 e 100
    confidenceScore = Math.max(0, Math.min(100, confidenceScore));
    
    // Atualizar a pontuação de confiança
    analyzedResult.confidence = Math.round(confidenceScore);
    
    // Determinar se é um falso positivo com base no limiar
    analyzedResult.isFalsePositive = confidenceScore < this.confidenceThreshold;
    
    // Registrar análise
    if (analyzedResult.isFalsePositive) {
      logger.debug(`Resultado marcado como falso positivo: ${analyzedResult.url}`, { confidence: confidenceScore });
    } else {
      logger.debug(`Resultado validado: ${analyzedResult.url}`, { confidence: confidenceScore });
    }
    
    return analyzedResult;
  }

  /**
   * Analisa múltiplos resultados para filtrar falsos positivos
   * @param {Array<object>} results - Lista de resultados
   * @returns {Array<object>} - Lista filtrada de resultados
   */
  filterResults(results) {
    if (!Array.isArray(results) || results.length === 0) {
      return [];
    }
    
    // Analisar cada resultado
    const analyzedResults = results.map(result => this.analyzeResult(result));
    
    // Filtrar falsos positivos
    const filteredResults = analyzedResults.filter(result => !result.isFalsePositive);
    
    logger.info(`Filtrados ${results.length - filteredResults.length} falsos positivos de ${results.length} resultados`);
    
    return filteredResults;
  }

  /**
   * Analisa a URL para ajustar a pontuação de confiança
   * @param {object} result - Resultado a ser analisado
   * @param {number} confidenceScore - Pontuação atual de confiança
   * @returns {number} - Pontuação de confiança ajustada
   */
  _analyzeUrl(result, confidenceScore) {
    const url = result.url || '';
    
    // Verificar se a URL contém o username exato
    if (result.originalUsername && url.includes(result.originalUsername)) {
      confidenceScore += 15;
    }
    
    // Verificar se a URL contém a variação usada
    if (result.variationUsed && url.includes(result.variationUsed)) {
      confidenceScore += 10;
    }
    
    // Verificar padrões de URL de perfil
    const profilePatterns = [
      /\/profile\//, /\/user\//, /\/u\//, /\/member\//, /\/author\//, 
      /\/models\//, /\/profile\.php/, /\/members\//, /\/account\//
    ];
    
    for (const pattern of profilePatterns) {
      if (pattern.test(url)) {
        confidenceScore += 10;
        break;
      }
    }
    
    // Verificar se é uma página genérica (reduz confiança)
    const genericPatterns = [
      /\/search\?/, /\/results\//, /\/find\//, /\/tag\//, /\/category\//,
      /\/explore\//, /\/discover\//, /\/trending\//, /\/popular\//
    ];
    
    for (const pattern of genericPatterns) {
      if (pattern.test(url)) {
        confidenceScore -= 15;
        break;
      }
    }
    
    // Verificar se é uma página de login ou registro (reduz confiança)
    if (/\/(login|register|signup|signin)/.test(url)) {
      confidenceScore -= 25;
    }
    
    // Verificar se é uma página de erro ou não encontrada (reduz confiança)
    if (/\/(error|404|not-found)/.test(url)) {
      confidenceScore -= 40;
    }
    
    return confidenceScore;
  }

  /**
   * Analisa o conteúdo para ajustar a pontuação de confiança
   * @param {object} result - Resultado a ser analisado
   * @param {number} confidenceScore - Pontuação atual de confiança
   * @returns {number} - Pontuação de confiança ajustada
   */
  _analyzeContent(result, confidenceScore) {
    const content = result.content || '';
    
    // Se não há conteúdo, reduzir confiança
    if (!content) {
      return confidenceScore - 20;
    }
    
    // Verificar se o conteúdo contém o username exato
    if (result.originalUsername && content.includes(result.originalUsername)) {
      confidenceScore += 15;
      
      // Verificar se o username aparece em contextos relevantes
      const usernameContexts = this._extractContexts(content, result.originalUsername);
      for (const context of usernameContexts) {
        // Verificar termos relevantes no contexto
        for (const term of this.sensitiveTerms) {
          if (context.toLowerCase().includes(term.toLowerCase())) {
            confidenceScore += 5;
            break;
          }
        }
      }
    }
    
    // Verificar se o conteúdo contém a variação usada
    if (result.variationUsed && result.variationUsed !== result.originalUsername && 
        content.includes(result.variationUsed)) {
      confidenceScore += 10;
    }
    
    // Verificar padrões de conteúdo de perfil
    const profilePatterns = [
      /profile/i, /member since/i, /joined/i, /bio/i, /about me/i,
      /followers/i, /following/i, /posts/i, /uploads/i, /gallery/i
    ];
    
    let profilePatternsFound = 0;
    for (const pattern of profilePatterns) {
      if (pattern.test(content)) {
        profilePatternsFound++;
      }
    }
    
    // Adicionar pontuação com base no número de padrões encontrados
    if (profilePatternsFound >= 3) {
      confidenceScore += 15;
    } else if (profilePatternsFound > 0) {
      confidenceScore += 5;
    }
    
    // Verificar termos sensíveis no conteúdo
    let sensitivePatternsFound = 0;
    for (const term of this.sensitiveTerms) {
      if (content.toLowerCase().includes(term.toLowerCase())) {
        sensitivePatternsFound++;
      }
    }
    
    // Adicionar pontuação com base no número de termos sensíveis encontrados
    if (sensitivePatternsFound >= 3) {
      confidenceScore += 20;
    } else if (sensitivePatternsFound > 0) {
      confidenceScore += 10;
    }
    
    // Verificar se é uma página genérica ou de erro (reduz confiança)
    const genericErrorPatterns = [
      /page not found/i, /404/i, /error/i, /does not exist/i,
      /no results/i, /no matches/i, /try again/i, /invalid/i
    ];
    
    for (const pattern of genericErrorPatterns) {
      if (pattern.test(content)) {
        confidenceScore -= 25;
        break;
      }
    }
    
    return confidenceScore;
  }

  /**
   * Analisa o username para ajustar a pontuação de confiança
   * @param {object} result - Resultado a ser analisado
   * @param {number} confidenceScore - Pontuação atual de confiança
   * @returns {number} - Pontuação de confiança ajustada
   */
  _analyzeUsername(result, confidenceScore) {
    const username = result.variationUsed || result.originalUsername || '';
    
    // Se não há username, reduzir confiança
    if (!username) {
      return confidenceScore - 20;
    }
    
    // Verificar se é um username comum (reduz confiança)
    if (this.commonUsernames.includes(username.toLowerCase())) {
      confidenceScore -= 25;
    }
    
    // Verificar se o username é muito curto (reduz confiança)
    if (username.length < 4) {
      confidenceScore -= 15;
    }
    
    // Verificar se o username é muito genérico (reduz confiança)
    const genericUsernamePatterns = [
      /^admin$/i, /^user$/i, /^guest$/i, /^test$/i, /^demo$/i,
      /^anonymous$/i, /^username$/i, /^default$/i, /^unknown$/i
    ];
    
    for (const pattern of genericUsernamePatterns) {
      if (pattern.test(username)) {
        confidenceScore -= 30;
        break;
      }
    }
    
    // Verificar se o username contém termos sensíveis (aumenta confiança)
    for (const term of this.sensitiveTerms) {
      if (username.toLowerCase().includes(term.toLowerCase())) {
        confidenceScore += 10;
        break;
      }
    }
    
    return confidenceScore;
  }

  /**
   * Analisa o contexto para ajustar a pontuação de confiança
   * @param {object} result - Resultado a ser analisado
   * @param {number} confidenceScore - Pontuação atual de confiança
   * @returns {number} - Pontuação de confiança ajustada
   */
  _analyzeContext(result, confidenceScore) {
    // Verificar o tipo de plataforma
    if (result.platform && result.platform.category) {
      const category = result.platform.category.toLowerCase();
      
      // Categorias de alta relevância
      const highRelevanceCategories = ['adult', 'cam', 'escort', 'forum', 'leak'];
      if (highRelevanceCategories.includes(category)) {
        confidenceScore += 15;
      }
      
      // Categorias de média relevância
      const mediumRelevanceCategories = ['social', 'portfolio', 'images', 'linkinbio'];
      if (mediumRelevanceCategories.includes(category)) {
        confidenceScore += 5;
      }
      
      // Categorias de baixa relevância (reduz confiança)
      const lowRelevanceCategories = ['general', 'news', 'blog', 'shopping'];
      if (lowRelevanceCategories.includes(category)) {
        confidenceScore -= 10;
      }
    }
    
    // Verificar a prioridade da plataforma
    if (result.platform && result.platform.priority) {
      const priority = result.platform.priority.toLowerCase();
      
      if (priority === 'critical') {
        confidenceScore += 20;
      } else if (priority === 'high') {
        confidenceScore += 10;
      } else if (priority === 'low') {
        confidenceScore -= 5;
      }
    }
    
    // Verificar se há correspondência exata de username
    if (result.originalUsername && result.variationUsed) {
      if (result.originalUsername === result.variationUsed) {
        confidenceScore += 15;
      } else {
        // Calcular similaridade entre username original e variação
        const similarity = this._calculateStringSimilarity(
          result.originalUsername.toLowerCase(),
          result.variationUsed.toLowerCase()
        );
        
        if (similarity > 0.8) {
          confidenceScore += 10;
        } else if (similarity > 0.5) {
          confidenceScore += 5;
        } else {
          confidenceScore -= 5;
        }
      }
    }
    
    return confidenceScore;
  }

  /**
   * Extrai contextos em torno de um termo em um texto
   * @param {string} text - Texto a ser analisado
   * @param {string} term - Termo para extrair contextos
   * @returns {Array<string>} - Lista de contextos
   */
  _extractContexts(text, term) {
    const contexts = [];
    let index = text.indexOf(term);
    
    while (index !== -1) {
      const start = Math.max(0, index - this.contextSize);
      const end = Math.min(text.length, index + term.length + this.contextSize);
      contexts.push(text.substring(start, end));
      
      index = text.indexOf(term, index + 1);
    }
    
    return contexts;
  }

  /**
   * Calcula a similaridade entre duas strings (coeficiente de Dice)
   * @param {string} str1 - Primeira string
   * @param {string} str2 - Segunda string
   * @returns {number} - Coeficiente de similaridade (0-1)
   */
  _calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;
    
    // Extrair bigramas
    const getBigrams = str => {
      const bigrams = new Set();
      for (let i = 0; i < str.length - 1; i++) {
        bigrams.add(str.substring(i, i + 2));
      }
      return bigrams;
    };
    
    const bigrams1 = getBigrams(str1);
    const bigrams2 = getBigrams(str2);
    
    // Calcular interseção
    let intersection = 0;
    for (const bigram of bigrams1) {
      if (bigrams2.has(bigram)) {
        intersection++;
      }
    }
    
    // Calcular coeficiente de Dice
    return (2 * intersection) / (bigrams1.size + bigrams2.size);
  }

  /**
   * Carrega lista de termos sensíveis
   * @returns {Array<string>} - Lista de termos sensíveis
   */
  _loadSensitiveTerms() {
    return [
      // Termos relacionados a conteúdo adulto
      'onlyfans', 'ofans', 'fansly', 'privacy', 'nudes', 'leaked', 'content creator',
      'camgirl', 'camboy', 'camming', 'tip menu', 'escort', 'acompanhantes',
      'sugar baby', 'sugar daddy', 'elite model', 'casting', 'portfolio', 'portfolio link',
      'booking', 'hire me', 'snap', 'snapcode', 'tiktok viral', 'instagram model',
      'reels', 'hot', 'leak', 'patreon', 'feetpics', 'feetfinder', 'custom content',
      'nsfw', 'explicit', '18+', 'xxx', 'videos', 'dms open', 'payperview', 'sub4sub',
      'content menu', 'buy my content', 'dm for prices', 'model profile', 'art nude',
      'erotic photography', 'implied nude', 'cosplay lewd', 'femboy', 'furry nsfw',
      'hentai', 'r34', 'boudoir', 'fine art nude', 'adult content', 'premium content',
      'private content', 'exclusive content', 'subscription', 'membership', 'vip access',
      'premium access', 'adult model', 'cam model', 'webcam model', 'adult performer',
      'adult entertainer', 'adult content creator', 'adult influencer', 'adult star',
      'porn star', 'porn actress', 'porn actor', 'adult actress', 'adult actor',
      'adult film', 'adult video', 'adult photo', 'adult image', 'adult gallery',
      'adult portfolio', 'adult work', 'adult service', 'adult entertainment',
      'adult industry', 'adult business', 'adult career', 'adult job', 'adult gig',
      'adult side hustle', 'adult side job', 'adult side gig', 'adult side business',
      'adult side career', 'adult side work', 'adult side income', 'adult side money',
      
      // Termos relacionados a vazamentos
      'leak', 'leaked', 'leaks', 'leaked content', 'leaked photos', 'leaked videos',
      'leaked images', 'leaked pictures', 'leaked nudes', 'leaked onlyfans',
      'leaked fansly', 'leaked privacy', 'leaked snapchat', 'leaked telegram',
      'leaked discord', 'leaked dropbox', 'leaked google drive', 'leaked mega',
      'leaked cloud', 'leaked icloud', 'leaked collection', 'leaked folder',
      'leaked archive', 'leaked zip', 'leaked pack', 'leaked set', 'leaked album',
      'leaked gallery', 'leaked dump', 'leaked compilation', 'leaked compilation',
      
      // Termos relacionados a fóruns e comunidades
      'forum', 'community', 'board', 'thread', 'post', 'topic', 'discussion',
      'comment', 'reply', 'message', 'chat', 'conversation', 'group', 'channel',
      'server', 'room', 'lounge', 'hub', 'space', 'zone', 'area', 'section',
      'category', 'subforum', 'subboard', 'subthread', 'subtopic', 'subdiscussion',
      'subpost', 'subcomment', 'subreply', 'submessage', 'subchat', 'subconversation',
      'subgroup', 'subchannel', 'subserver', 'subroom', 'sublounge', 'subhub',
      'subspace', 'subzone', 'subarea', 'subsection', 'subcategory'
    ];
  }

  /**
   * Carrega lista de usernames comuns
   * @returns {Array<string>} - Lista de usernames comuns
   */
  _loadCommonUsernames() {
    return [
      'admin', 'administrator', 'user', 'guest', 'test', 'demo', 'anonymous',
      'username', 'default', 'unknown', 'system', 'root', 'webmaster', 'info',
      'support', 'contact', 'help', 'service', 'staff', 'team', 'official',
      'moderator', 'mod', 'admin1', 'admin2', 'admin3', 'user1', 'user2', 'user3',
      'guest1', 'guest2', 'guest3', 'test1', 'test2', 'test3', 'demo1', 'demo2',
      'demo3', 'anonymous1', 'anonymous2', 'anonymous3', 'username1', 'username2',
      'username3', 'default1', 'default2', 'default3', 'unknown1', 'unknown2',
      'unknown3', 'system1', 'system2', 'system3', 'root1', 'root2', 'root3',
      'webmaster1', 'webmaster2', 'webmaster3', 'info1', 'info2', 'info3',
      'support1', 'support2', 'support3', 'contact1', 'contact2', 'contact3',
      'help1', 'help2', 'help3', 'service1', 'service2', 'service3', 'staff1',
      'staff2', 'staff3', 'team1', 'team2', 'team3', 'official1', 'official2',
      'official3', 'moderator1', 'moderator2', 'moderator3', 'mod1', 'mod2', 'mod3'
    ];
  }
}
