/**
 * Username Variator - Generates username variations for searching.
 * Includes expanded variation logic based on recommendations.
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';

const logger = new Logger({ level: 'info' });

export class UsernameVariator {
  constructor(options = {}) {
    // Placeholder for adaptive learning (can be implemented later)
    this.successPatterns = options.successPatterns || {}; 
    logger.info('UsernameVariator initialized');
  }

  /**
   * Generate variations for a given username.
   * @param {string} username - The original username.
   * @returns {string[]} - An array of username variations, sorted by relevance.
   */
  generateVariations(username) {
    if (!username || typeof username !== 'string' || username.trim() === '') {
        logger.warn('UsernameVariator: Invalid or empty username provided.');
        return [];
    }
    const variations = new Set();
    const originalUsername = username.trim();

    // Add original username
    variations.add(originalUsername);

    // Basic variations
    this._addBasicVariations(originalUsername, variations);

    // Numeric variations
    this._addNumericVariations(originalUsername, variations);

    // Platform-specific variations
    this._addPlatformSpecificVariations(originalUsername, variations);

    // Adult context variations
    this._addAdultContextVariations(originalUsername, variations);

    // Cleaning variations
    this._addCleanVariations(originalUsername, variations);

    const variationArray = [...variations];
    logger.info(`Generated ${variationArray.length} unique variations for "${originalUsername}"`);

    // Sort by relevance (adaptive sorting can be added here later)
    return this._sortByRelevance(variationArray, originalUsername);
  }

  /** Add basic variations (case, symbols, common affixes) */
  _addBasicVariations(username, variations) {
    variations.add(username.toLowerCase());
    variations.add(username.toUpperCase());
    // Common symbols
    variations.add(`${username}_`);
    variations.add(`_${username}`);
    variations.add(`${username}-`);
    variations.add(`-${username}`);
    variations.add(`.${username}`);
    variations.add(`${username}.`);
    // Common affixes
    const affixes = ['real', 'official', 'vip', 'pro', 'hd', 'tv', 'live', 'app', 'site', 'online'];
    affixes.forEach(affix => {
      variations.add(`${username}${affix}`);
      variations.add(`${affix}${username}`);
      variations.add(`${username}_${affix}`);
      variations.add(`${affix}_${username}`);
      variations.add(`${username}.${affix}`);
      variations.add(`${affix}.${username}`);
    });
  }

  /** Add numeric variations (common numbers, years, regional codes) */
  _addNumericVariations(username, variations) {
    const commonNumbers = ['1', '2', '3', '01', '123', '69', '18', '21', '420', '666', '777', '888', '999'];
    const brNumbers = ['10', '11', '13', '15', '21', '27', '31', '41', '43', '47', '48', '51', '55', '61', '62', '67', '71', '81', '83', '85', '91', '92', '96', '98'];
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear - 1, currentYear + 1].map(String);
    const recentYearsShort = ['20', '21', '22', '23', '24', '25']; // Example, adjust as needed
    const birthYears = Array.from({ length: 35 }, (_, i) => String(currentYear - 18 - i)); // 18-52 years old approx

    [...commonNumbers, ...brNumbers, ...years, ...recentYearsShort, ...birthYears].forEach(num => {
      variations.add(`${username}${num}`);
      variations.add(`${num}${username}`);
      variations.add(`${username}_${num}`);
      variations.add(`${num}_${username}`);
      variations.add(`${username}.${num}`);
      variations.add(`${num}.${username}`);
    });

    // Remove existing numbers
    const withoutNumbers = username.replace(/\d+/g, '');
    if (withoutNumbers !== username && withoutNumbers.length > 2) { // Avoid empty/too short results
      variations.add(withoutNumbers);
    }
  }

  /** Add platform-specific and contextual variations */
  _addPlatformSpecificVariations(username, variations) {
    const platformSuffixes = [
      // Cam/Adult
      'onlyfans', 'of', 'fansly', 'cam', 'chaturbate', 'cb', 'priv', 'privacy', 'privado', 'privada', 'privé', 'model', 'vip', 'premium', 'exclusive', 'private', 'content', 'quarentena', 'hot', 'topcontent', 'top',
      // Professional/Official
      'oficial', 'official', 'real', 'verificado', 'verified', 'media', 'assessoria', 'work', 'job', 'pro', 'business', 'contato', 'contact', 'management', 'casting', 'agency', 'team', 'press', 'global', 'br',
      // Backup/Alternatives
      'backup', 'alt', '2', 'reserva', 'extra', 'new', 'novo', 'nova', 'atual', 'perfil2', 'conta2', 'second', 'alternative', 'outro', 'outra', 'fechado', 'fechada', 'aberto', 'aberta', 'temporario', 'temporaria', 'temp', 'main', 'principal', 'store', 'loja',
      // Platform Names/Abbreviations
      'insta', 'instagram', 'ig', 'fb', 'face', 'tt', 'tweet', 'tiktok', 'tk', 'yt', 'snap', 'sc', 'snpchat', 'twitch', 'live', 'discord', 'reddit',
      // Regional BR
      'brasil', 'brazil', 'br', 'sp', 'rj', 'mg', 'rs', 'pr', 'bh', 'sampa', 'rio', 'poa', 'nordeste', 'sul', 'sudeste', 'carioca', 'paulista', 'gaucho', 'mineiro', 'baiano', 'nordestino',
      // Occupations/Niche
      'modelo', 'model', 'atriz', 'ator', 'actress', 'actor', 'photo', 'foto', 'sexy', 'hot', 'gamer', 'games', 'stream', 'dev', 'coach', 'creator', 'influencer', 'digital', 'fit', 'fitness', 'musica', 'music', 'tattoo', 'ink', 'dance', 'danca'
    ];
    platformSuffixes.forEach(suffix => {
      variations.add(`${username}${suffix}`);
      variations.add(`${username}_${suffix}`);
      variations.add(`${username}.${suffix}`);
      // Less common, but possible
      // variations.add(`${suffix}${username}`);
      // variations.add(`${suffix}_${username}`);
      // variations.add(`${suffix}.${username}`);
    });
  }

  /** Add variations related to adult contexts */
  _addAdultContextVariations(username, variations) {
    const adultSuffixes = [
      // English
      'babe', 'baby', 'girl', 'boy', 'hot', 'sexy', 'angel', 'goddess', 'princess', 'queen', 'king', 'adult', 'nudes', 'xxx', 'nsfw', 'lover', 'kink', 'fetish', 'dom', 'sub', 'feet', 'paws', 'bdsm', 'lewd', 'only', 'fans', 'fansly', 'priv', 'pvt',
      // Portuguese
      'sensual', 'safada', 'safado', 'gostosa', 'gostoso', 'delicia', 'linda', 'lindo', 'tesuda', 'tesudo', 'provocante', 'picante', 'musa', 'amor', 'prazer', 'segredo', 'sigilo', 'privado', 'privacidade', 'especial', 'conteudo', 'privacy', 'contato', 'atendimento', 'vip'
    ];
    adultSuffixes.forEach(suffix => {
      variations.add(`${username}${suffix}`);
      variations.add(`${suffix}${username}`);
      variations.add(`${username}_${suffix}`);
      variations.add(`${suffix}_${username}`);
      variations.add(`${username}.${suffix}`);
      variations.add(`${suffix}.${username}`);
    });
  }

  /** Add variations based on cleaning/transforming the username */
  _addCleanVariations(username, variations) {
    // Remove special chars
    const cleaned = username.replace(/[^a-zA-Z0-9]/g, '');
    if (cleaned !== username && cleaned.length > 2) {
      variations.add(cleaned);
    }

    // Replace separators
    if (username.includes('_') || username.includes('-') || username.includes('.')) {
        variations.add(username.replace(/[_-]/g, '.'));
        variations.add(username.replace(/[._]/g, '-'));
        variations.add(username.replace(/[.-]/g, '_'));
    }

    // Leet speak (simple)
    const leetMap = { 'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7', 'l': '1' };
    let leetUsername = username.toLowerCase();
    for (const char in leetMap) {
        leetUsername = leetUsername.replace(new RegExp(char, 'g'), leetMap[char]);
    }
    if (leetUsername !== username.toLowerCase()) {
      variations.add(leetUsername);
    }

    // Remove accents
    const accentMap = { 'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e', 'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i', 'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u', 'ç': 'c', 'ñ': 'n' };
    let withoutAccents = username.toLowerCase();
     for (const char in accentMap) {
        withoutAccents = withoutAccents.replace(new RegExp(char, 'g'), accentMap[char]);
    }
    if (withoutAccents !== username.toLowerCase()) {
      variations.add(withoutAccents);
    }

    // Reverse (less common, but sometimes used)
    // variations.add(username.split('').reverse().join(''));
  }

  /**
   * Sort variations by relevance (simple implementation).
   * Adaptive sorting based on successPatterns can be added later.
   */
  _sortByRelevance(variations, original) {
    return variations.sort((a, b) => {
      // 1. Original username first
      if (a === original) return -1;
      if (b === original) return 1;

      // 2. Case variations of original
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const originalLower = original.toLowerCase();
      if (aLower === originalLower && bLower !== originalLower) return -1;
      if (aLower !== originalLower && bLower === originalLower) return 1;

      // 3. Variations containing the original (prefer shorter additions)
      const aContains = aLower.includes(originalLower);
      const bContains = bLower.includes(originalLower);
      if (aContains && !bContains) return -1;
      if (!aContains && bContains) return 1;
      if (aContains && bContains) {
          const aDiff = a.length - original.length;
          const bDiff = b.length - original.length;
          if (aDiff !== bDiff) return aDiff - bDiff; // Shorter additions first
      }

      // 4. Shorter variations first
      if (a.length !== b.length) return a.length - b.length;

      // 5. Alphabetical as last resort
      return a.localeCompare(b);
    });
  }

  // Placeholder for adaptive learning methods
  registerSuccessfulVariation(original, variation) {
      // TODO: Implement logic to store successful patterns
      logger.debug(`Placeholder: Registering successful variation: ${original} -> ${variation}`);
  }

  _extractPattern(original, variation) {
      // TODO: Implement logic to identify the transformation pattern
      return null;
  }
}

