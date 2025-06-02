/**
 * Integração de Termos e Palavras-chave - Serviço para análise contextual de termos
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';

const logger = new Logger({ level: 'info' });

export class KeywordAnalyzer {
  constructor() {
    // Categorias de termos para análise contextual
    this.keywordCategories = {
      // Categorias de conteúdo adulto
      adult: [
        "18+", "conteúdo adulto", "explicit", "nsfw", "xxx", "nudes", "lewd", 
        "ahegao", "hentai", "ecchi", "art nude", "sensual", "lingerie"
      ],
      
      // Categorias de monetização
      monetization: [
        "buy my content", "paid content", "premium content", "vip content", 
        "exclusive content", "subscription", "tip menu", "ppv", "payperview",
        "sell nudes", "custom content", "monetize seu conteúdo", "renda extra"
      ],
      
      // Categorias de serviços
      services: [
        "escort", "acompanhantes", "acompanhante de luxo", "acompanhante executiva",
        "massagem", "massage", "atendimento vip", "atendimento a domicílio", 
        "atendimento com local", "com local", "faz programa", "garota programa", "gp"
      ],
      
      // Categorias de plataformas
      platforms: [
        "onlyfans", "ofans", "fansly", "privacy", "justforfans", "manyvids",
        "chaturbate", "cam4", "bongacams", "myfreecams", "camsoda", "livejasmin"
      ],
      
      // Categorias de perfis
      profiles: [
        "verified", "verificado", "selo azul", "blue check", "official",
        "modelo", "model profile", "portfolio", "portfolio link", "instagram model"
      ],
      
      // Categorias de vazamentos
      leaks: [
        "leak", "leaked", "leaked content", "conteúdo vazado", "privacy leak",
        "mega folder", "mega link"
      ],
      
      // Categorias de comunicação
      communication: [
        "dm for prices", "dms open", "link in bio", "linkinbio", "check bio",
        "telegram channel", "discord server", "sigam", "snapcode", "snap"
      ],
      
      // Categorias de características regionais
      regional: [
        "carioca", "gaúcha", "mineira", "paulista", "nordestina",
        "brasileira", "brasil", "br"
      ]
    };
    
    logger.info(`KeywordAnalyzer inicializado com ${Object.keys(this.keywordCategories).length} categorias de palavras-chave`);
  }
   /**
   * Analisa um texto em busca de termos e palavras-chave relevantes
   * @param {string} text - Texto a ser analisado
   * @param {Array<string>} keywords - Lista de palavras-chave para busca
   * @returns {object} - Resultado da análise com termos encontrados e pontuação
   */
  analyzeText(text, keywords) {
    if (!text || typeof text !== 'string') {
      return { 
        found: false, 
        terms: [], 
        categories: {}, 
        score: 0 
      };
    }
    
    // Validate and sanitize inputs
    if (!this._isValidText(text)) {
      logger.warn('Invalid text provided for analysis');
      return { found: false, terms: [], categories: {}, score: 0 };
    }
    
    if (!Array.isArray(keywords)) {
      keywords = [];
    }
    
    // Sanitize keywords
    const sanitizedKeywords = keywords
      .filter(k => typeof k === 'string' && k.length > 0 && k.length <= 100)
      .map(k => this._sanitizeKeyword(k))
      .filter(k => k.length > 0);
    
    const lowerText = text.toLowerCase();
    const foundTerms = [];
    const categoryMatches = {};
    
    // Inicializar contadores de categoria
    Object.keys(this.keywordCategories).forEach(category => {
      categoryMatches[category] = 0;
    });
    
    // Verificar palavras-chave fornecidas
    sanitizedKeywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      if (lowerText.includes(lowerKeyword)) {
        foundTerms.push(keyword);
        
        // Incrementar contadores de categoria
        Object.keys(this.keywordCategories).forEach(category => {
          if (this.keywordCategories[category].some(term => 
            term.toLowerCase() === lowerKeyword ||
            lowerKeyword.includes(term.toLowerCase())
          )) {
            categoryMatches[category]++;
          }
        });
      }
    });
    
    // Calcular pontuação baseada em categorias e número de termos
    let score = 0;
    const categoryWeights = {
      adult: 3,
      monetization: 2.5,
      services: 3,
      platforms: 2,
      profiles: 1,
      leaks: 3,
      communication: 1.5,
      regional: 1
    };
    
    Object.keys(categoryMatches).forEach(category => {
      if (categoryMatches[category] > 0) {
        score += categoryMatches[category] * (categoryWeights[category] || 1);
      }
    });
    
    // Normalizar pontuação (0-100)
    const normalizedScore = Math.min(100, Math.round((score / 10) * 100));
    
    return {
      found: foundTerms.length > 0,
      terms: foundTerms,
      categories: categoryMatches,
      score: normalizedScore
    };
  }
  
  /**
   * Analisa um URL em busca de padrões de plataformas conhecidas
   * @param {string} url - URL a ser analisado
   * @returns {object} - Resultado da análise com plataforma identificada e confiança
   */
  analyzeUrl(url) {
    if (!url || typeof url !== 'string') {
      return { 
        identified: false, 
        platform: null, 
        confidence: 0 
      };
    }
    
    const lowerUrl = url.toLowerCase();
    
    // Padrões de URL para plataformas conhecidas
    const platformPatterns = [
      { name: 'OnlyFans', pattern: /onlyfans\.com\/([^\/\?]+)/, confidence: 90 },
      { name: 'Fansly', pattern: /fansly\.com\/([^\/\?]+)/, confidence: 90 },
      { name: 'Privacy', pattern: /privacy\.com\.br\/([^\/\?]+)/, confidence: 90 },
      { name: 'Chaturbate', pattern: /chaturbate\.com\/([^\/\?]+)/, confidence: 85 },
      { name: 'Instagram', pattern: /instagram\.com\/([^\/\?]+)/, confidence: 80 },
      { name: 'Twitter/X', pattern: /(twitter\.com|x\.com)\/([^\/\?]+)/, confidence: 80 },
      { name: 'TikTok', pattern: /tiktok\.com\/@([^\/\?]+)/, confidence: 80 },
      { name: 'Reddit', pattern: /reddit\.com\/user\/([^\/\?]+)/, confidence: 75 },
      { name: 'Telegram', pattern: /t\.me\/([^\/\?]+)/, confidence: 75 },
      { name: 'Discord', pattern: /discord\.(com|gg)\/([^\/\?]+)/, confidence: 70 },
      { name: 'Linktree', pattern: /linktr\.ee\/([^\/\?]+)/, confidence: 70 },
      { name: 'Mega', pattern: /mega\.nz\/(file|folder)\/([^\/\?]+)/, confidence: 65 },
      { name: 'FatalModel', pattern: /fatalmodel\.com\/([^\/\?]+)/, confidence: 85 },
      { name: 'Skokka', pattern: /skokka\.com\/([^\/\?]+)/, confidence: 85 }
    ];
    
    // Verificar cada padrão
    for (const platform of platformPatterns) {
      const match = lowerUrl.match(platform.pattern);
      if (match) {
        return {
          identified: true,
          platform: platform.name,
          username: match[1] || match[2],
          confidence: platform.confidence
        };
      }
    }
    
    // Verificação genérica para outros domínios
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const path = urlObj.pathname;
      
      // Se o caminho tem formato de perfil
      if (path.match(/\/(profile|user|u|perfil|model|models)\/[^\/\?]+/)) {
        return {
          identified: true,
          platform: domain.replace(/^www\./, ''),
          confidence: 60
        };
      }
      
      // Se o caminho parece ser um username direto
      if (path.match(/^\/[@]?[a-zA-Z0-9_\-.]+\/?$/)) {
        return {
          identified: true,
          platform: domain.replace(/^www\./, ''),
          confidence: 50
        };
      }
    } catch (e) {
      // URL inválida
      logger.warn(`URL inválida para análise: ${url}`);
    }
    
    return {
      identified: false,
      platform: null,
      confidence: 0
    };
  }
  
  /**
   * Verifica se um texto contém menções a um username específico
   * @param {string} text - Texto a ser analisado
   * @param {string} username - Username a ser buscado
   * @param {Array<string>} variations - Variações do username
   * @returns {object} - Resultado da análise com menções encontradas
   */
  findUsernameMentions(text, username, variations = []) {
    if (!text || typeof text !== 'string' || !username) {
      return { 
        found: false, 
        mentions: [], 
        confidence: 0 
      };
    }
    
    const lowerText = text.toLowerCase();
    const lowerUsername = username.toLowerCase();
    const mentions = [];
    let confidence = 0;
    
    // Verificar username exato
    if (lowerText.includes(lowerUsername)) {
      mentions.push({
        term: username,
        type: 'exact',
        confidence: 90
      });
      confidence = Math.max(confidence, 90);
    }
    
    // Verificar variações
    variations.forEach(variation => {
      const lowerVariation = variation.toLowerCase();
      if (lowerText.includes(lowerVariation)) {
        mentions.push({
          term: variation,
          type: 'variation',
          confidence: 75
        });
        confidence = Math.max(confidence, 75);
      }
    });
    
    // Verificar padrões comuns de menção
    const mentionPatterns = [
      { pattern: new RegExp(`@${lowerUsername}\\b`, 'i'), type: 'mention', confidence: 85 },
      { pattern: new RegExp(`\\b${lowerUsername}\\b`, 'i'), type: 'word', confidence: 80 },
      { pattern: new RegExp(`perfil\\s+de\\s+${lowerUsername}`, 'i'), type: 'profile', confidence: 85 },
      { pattern: new RegExp(`usuário\\s+${lowerUsername}`, 'i'), type: 'user', confidence: 85 },
      { pattern: new RegExp(`conta\\s+de\\s+${lowerUsername}`, 'i'), type: 'account', confidence: 85 }
    ];
    
    mentionPatterns.forEach(({ pattern, type, confidence: patternConfidence }) => {
      if (pattern.test(lowerText)) {
        mentions.push({
          term: username,
          type,
          confidence: patternConfidence
        });
        confidence = Math.max(confidence, patternConfidence);
      }
    });
    
    return {
      found: mentions.length > 0,
      mentions,
      confidence
    };
  }
}
