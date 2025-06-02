/**
 * Content Check Strategy - Checks platform presence based on page content analysis.
 * @version 4.0.0
 */
import { PlatformCheckStrategy } from './PlatformCheckStrategy.js';
import { Logger } from '../utils/Logger.js';

const logger = new Logger({ level: 'info' });

export class ContentCheckStrategy extends PlatformCheckStrategy {
  /**
   * Check platform by analyzing page content for specific patterns.
   * @param {object} platform - The platform definition object.
   * @param {string} username - The username (or variation) to check.
   * @param {object} [options={}] - Additional options (timeout, proxy, userAgent).
   * @returns {Promise<object>} - Result object.
   */
  async check(platform, username, options = {}) {
    const url = platform.url.replace('{username}', encodeURIComponent(username));
    const result = {
      found: false,
      url: url,
      confidence: 0,
      status: null,
      contentSample: null,
      matchedPatterns: [],
      error: null
    };

    try {
      // Always use GET for content analysis
      const response = await this._fetch(url, { method: 'GET' }, options);
      result.status = response.status;

      // If not OK status, return early with low confidence
      if (!response.ok) {
        if (response.status === 404) {
          result.found = false;
          result.confidence = 90; // High confidence for 404
          logger.info(`[${platform.name}] Not Found (HTTP 404) for ${username} at ${url}`);
          return result;
        } else {
          result.found = false;
          result.confidence = 10; // Low confidence for other errors
          result.error = `HTTP Error: ${response.status}`;
          logger.warn(`[${platform.name}] Error status (HTTP ${response.status}) for ${username} at ${url}`);
          return result;
        }
      }

      // Get page content
      const html = await response.text();
      
      // Store a small sample of the content for debugging/verification
      result.contentSample = html.substring(0, 200).replace(/\s+/g, ' ').trim();
      
      // Check for "not found" patterns first
      const notFoundPatterns = platform.notFoundPatterns || [
        'not found', 'doesn\'t exist', 'no user', '404', 'page not found',
        'não encontrado', 'não existe', 'usuário não encontrado'
      ];
      
      const hasNotFoundPattern = notFoundPatterns.some(pattern => 
        html.toLowerCase().includes(pattern.toLowerCase())
      );
      
      // Check for "found" patterns
      const foundPatterns = platform.foundPatterns || [
        'profile', 'user', 'account', 'posts', 'followers', 'following',
        'perfil', 'usuário', 'conta', 'publicações', 'seguidores', 'seguindo'
      ];
      
      // Also check for the username itself in the content
      foundPatterns.push(username);
      
      const matchedFoundPatterns = foundPatterns.filter(pattern => 
        html.toLowerCase().includes(pattern.toLowerCase())
      );
      
      result.matchedPatterns = matchedFoundPatterns;
      
      // Calculate confidence and determine if found
      if (hasNotFoundPattern && matchedFoundPatterns.length === 0) {
        // Clear "not found" message with no positive indicators
        result.found = false;
        result.confidence = 85;
        logger.info(`[${platform.name}] Not Found (content analysis) for ${username} at ${url}`);
      } else if (!hasNotFoundPattern && matchedFoundPatterns.length > 0) {
        // No "not found" message and positive indicators
        result.found = true;
        result.confidence = 80 + Math.min(matchedFoundPatterns.length * 2, 15); // Up to 95% confidence
        logger.info(`[${platform.name}] Found (content analysis) for ${username} at ${url} - Matched patterns: ${matchedFoundPatterns.join(', ')}`);
      } else if (hasNotFoundPattern && matchedFoundPatterns.length > 0) {
        // Mixed signals - "not found" message but some positive indicators
        result.found = false;
        result.confidence = 60;
        logger.warn(`[${platform.name}] Ambiguous content for ${username} at ${url} - Has not found pattern but also matched: ${matchedFoundPatterns.join(', ')}`);
      } else {
        // No clear indicators either way
        result.found = response.status === 200; // Default to HTTP status
        result.confidence = 40; // Low confidence
        logger.warn(`[${platform.name}] Unclear content for ${username} at ${url} - No definitive patterns found`);
      }

    } catch (error) {
      logger.error(`[${platform.name}] Error checking content for ${username} at ${url}`, error);
      result.found = false;
      result.confidence = 0;
      result.error = error.message || 'Content fetch failed';
    }

    return result;
  }
}
