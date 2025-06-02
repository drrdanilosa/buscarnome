/**
 * Image Analyzer - Analyzes images for content detection
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';
import { EventBus } from '../utils/EventBus.js';

const logger = new Logger({ level: 'info' });

export class ImageAnalyzer {
  constructor(storageService, eventBus) {
    this.storageService = storageService;
    this.eventBus = eventBus || new EventBus();
    this.enabled = false;
    this.apiKey = '';
    this.apiEndpoint = '';
    this.apiProvider = 'none'; // 'none', 'custom', 'sightengine', etc.
    
    logger.info('ImageAnalyzer initialized');
  }

  /**
   * Initialize the image analyzer
   * @param {object} options - Configuration options
   */
  async initialize(options = {}) {
    // Set options
    this.apiKey = options.apiKey || '';
    this.apiEndpoint = options.apiEndpoint || '';
    this.apiProvider = options.apiProvider || 'none';
    this.enabled = options.enabled || false;
    
    // Try to load saved configuration from storage
    try {
      const savedConfig = await this.storageService.get('image_analyzer_config');
      if (savedConfig) {
        this.apiKey = savedConfig.apiKey || this.apiKey;
        this.apiEndpoint = savedConfig.apiEndpoint || this.apiEndpoint;
        this.apiProvider = savedConfig.apiProvider || this.apiProvider;
        this.enabled = savedConfig.enabled !== undefined ? savedConfig.enabled : this.enabled;
      }
    } catch (error) {
      logger.error('Failed to load image analyzer configuration from storage', error);
    }
    
    logger.info(`ImageAnalyzer initialized with provider: ${this.apiProvider}, enabled: ${this.enabled}`);
    
    // Emit initialization event
    this.eventBus.emit('imageAnalyzer:initialized', {
      enabled: this.enabled,
      apiProvider: this.apiProvider
    });
    
    return {
      enabled: this.enabled,
      apiProvider: this.apiProvider
    };
  }

  /**
   * Enable or disable image analysis
   * @param {boolean} enabled - Whether to enable image analysis
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    // Save configuration
    this._saveConfig();
    
    logger.info(`Image analysis ${this.enabled ? 'enabled' : 'disabled'}`);
    
    // Emit event
    this.eventBus.emit('imageAnalyzer:status', { enabled: this.enabled });
    
    return this.enabled;
  }

  /**
   * Set API configuration
   * @param {object} config - API configuration
   */
  setApiConfig(config) {
    if (!config) {
      logger.error('Invalid API configuration');
      throw new Error('Invalid API configuration');
    }
    
    this.apiKey = config.apiKey || this.apiKey;
    this.apiEndpoint = config.apiEndpoint || this.apiEndpoint;
    this.apiProvider = config.apiProvider || this.apiProvider;
    
    // Save configuration
    this._saveConfig();
    
    logger.info(`Set image analyzer API config: ${this.apiProvider}`);
    
    // Emit event
    this.eventBus.emit('imageAnalyzer:config', { 
      apiProvider: this.apiProvider
    });
    
    return {
      apiProvider: this.apiProvider
    };
  }

  /**
   * Extract image URLs from HTML content
   * @param {string} html - HTML content
   * @param {string} baseUrl - Base URL for resolving relative URLs
   * @returns {Array<string>} Array of image URLs
   */
  extractImageUrls(html, baseUrl) {
    if (!html) {
      return [];
    }
    
    try {
      // Create a DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Get all image elements
      const imgElements = doc.querySelectorAll('img');
      
      // Extract and resolve URLs
      const imageUrls = Array.from(imgElements)
        .map(img => {
          const src = img.getAttribute('src');
          if (!src) return null;
          
          try {
            // Resolve relative URLs
            return new URL(src, baseUrl).href;
          } catch (e) {
            return null;
          }
        })
        .filter(url => url !== null);
      
      logger.debug(`Extracted ${imageUrls.length} image URLs from HTML`);
      
      return imageUrls;
    } catch (error) {
      logger.error('Failed to extract image URLs from HTML', error);
      return [];
    }
  }

  /**
   * Analyze an image for content detection
   * @param {string} imageUrl - URL of the image to analyze
   * @returns {Promise<object>} Analysis results
   */
  async analyzeImage(imageUrl) {
    if (!this.enabled) {
      logger.warn('Image analysis attempted while disabled');
      throw new Error('Image analysis is disabled');
    }
    
    // Comprehensive URL validation
    if (!imageUrl || typeof imageUrl !== 'string') {
      logger.error('Invalid image URL provided');
      throw new Error('Invalid image URL provided');
    }
    
    // Sanitize and validate URL
    const sanitizedUrl = imageUrl.trim();
    if (sanitizedUrl.length === 0 || sanitizedUrl.length > 2048) {
      logger.error('Image URL length invalid');
      throw new Error('Image URL length must be between 1 and 2048 characters');
    }
    
    // Validate URL format and protocol
    try {
      const urlObj = new URL(sanitizedUrl);
      const allowedProtocols = ['http:', 'https:'];
      if (!allowedProtocols.includes(urlObj.protocol)) {
        throw new Error('Invalid URL protocol. Only HTTP and HTTPS are allowed.');
      }
      
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
        /file:/i,
        /<.*>/,
        /[<>"'&]/
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(sanitizedUrl)) {
          throw new Error('URL contains suspicious content');
        }
      }
      
      // Validate image file extension
      const imagePath = urlObj.pathname.toLowerCase();
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      const hasValidExtension = validExtensions.some(ext => imagePath.endsWith(ext));
      
      if (!hasValidExtension && !imagePath.includes('image') && !urlObj.search.includes('image')) {
        logger.warn('URL may not point to an image file', { url: sanitizedUrl.substring(0, 50) + '...' });
      }
      
    } catch (error) {
      logger.error('Invalid image URL format', { error: error.message });
      throw new Error(`Invalid image URL format: ${error.message}`);
    }
    
    // Check cache first
    const cacheKey = `image_analysis_${btoa(sanitizedUrl.substring(0, 100))}`;
    try {
      const cachedResult = await this.storageService.get(cacheKey);
      if (cachedResult && cachedResult.timestamp && 
          (Date.now() - cachedResult.timestamp) < 7 * 24 * 60 * 60 * 1000) { // 7 days
        logger.debug('Returning cached image analysis result');
        return cachedResult;
      }
    } catch (error) {
      logger.warn('Failed to check cache for image analysis', error);
    }
    
    logger.info(`Analyzing image: ${sanitizedUrl.substring(0, 50)}...`);
    
    try {
      // Emit event for analysis start
      this.eventBus.emit('imageAnalyzer:analyzing', { imageUrl: sanitizedUrl.substring(0, 50) + '...' });
      
      let result;
      
      // Add timeout for all analysis operations
      const analysisPromise = (async () => {
        // Choose API provider
        switch (this.apiProvider) {
          case 'custom':
            return await this._analyzeWithCustomApi(sanitizedUrl);
          case 'sightengine':
            return await this._analyzeWithSightengine(sanitizedUrl);
          case 'local':
            return await this._analyzeLocally(sanitizedUrl);
          case 'none':
          default:
            // Simulate analysis with basic results
            return this._simulateAnalysis(sanitizedUrl);
        }
      })();
      
      // Apply 30-second timeout to prevent hanging
      result = await Promise.race([
        analysisPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Image analysis timeout')), 30000)
        )
      ]);
      
      // Validate result structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid analysis result format');
      }
      
      // Add metadata
      result.timestamp = Date.now();
      result.imageUrl = sanitizedUrl.substring(0, 100) + '...';
      
      // Cache result with error handling
      try {
        await this.storageService.set({ [cacheKey]: result });
      } catch (error) {
        logger.warn('Failed to cache image analysis result', error);
      }
      
      // Emit event for analysis complete
      this.eventBus.emit('imageAnalyzer:result', { 
        imageUrl: sanitizedUrl.substring(0, 50) + '...', 
        result: { ...result, imageUrl: undefined } // Don't emit full URL
      });
      
      logger.info(`Image analysis complete: ${sanitizedUrl.substring(0, 50)}...`);
      
      return result;
    } catch (error) {
      logger.error(`Image analysis error: ${sanitizedUrl.substring(0, 50)}...`, error);
      
      // Emit event for analysis error
      this.eventBus.emit('imageAnalyzer:error', { 
        imageUrl: sanitizedUrl.substring(0, 50) + '...', 
        error: error.message || 'Analysis failed'
      });
      
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze multiple images
   * @param {Array<string>} imageUrls - URLs of images to analyze
   * @returns {Promise<Array<object>>} Analysis results
   */
  async analyzeMultipleImages(imageUrls) {
    if (!this.enabled) {
      logger.warn('Multiple image analysis attempted while disabled');
      throw new Error('Image analysis is disabled');
    }
    
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      logger.error('Invalid image URLs array');
      throw new Error('Invalid image URLs array');
    }
    
    logger.info(`Analyzing ${imageUrls.length} images`);
    
    // Analyze images sequentially to avoid rate limiting
    const results = [];
    
    for (const imageUrl of imageUrls) {
      try {
        const result = await this.analyzeImage(imageUrl);
        results.push({ imageUrl, result, success: true });
      } catch (error) {
        results.push({ 
          imageUrl, 
          error: error.message || 'Analysis failed',
          success: false
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  }

  /**
   * Analyze image with custom API
   * @param {string} imageUrl - URL of the image to analyze
   * @returns {Promise<object>} Analysis results
   */
  async _analyzeWithCustomApi(imageUrl) {
    if (!this.apiEndpoint || !this.apiKey) {
      throw new Error('Custom API configuration is incomplete');
    }
    
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ url: imageUrl })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        provider: 'custom',
        timestamp: Date.now(),
        ...data
      };
    } catch (error) {
      logger.error('Custom API analysis error', error);
      throw error;
    }
  }

  /**
   * Analyze image with Sightengine API
   * @param {string} imageUrl - URL of the image to analyze
   * @returns {Promise<object>} Analysis results
   */
  async _analyzeWithSightengine(imageUrl) {
    if (!this.apiKey) {
      throw new Error('Sightengine API key is missing');
    }
    
    try {
      // This is a simplified example. In a real implementation,
      // you would need to follow Sightengine's API documentation.
      const apiUrl = 'https://api.sightengine.com/1.0/check.json';
      const url = new URL(apiUrl);
      
      // Add query parameters
      url.searchParams.append('url', imageUrl);
      url.searchParams.append('models', 'nudity,wad,offensive,face');
      url.searchParams.append('api_user', this.apiKey.split(':')[0]);
      url.searchParams.append('api_secret', this.apiKey.split(':')[1]);
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Sightengine API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        provider: 'sightengine',
        timestamp: Date.now(),
        ...data
      };
    } catch (error) {
      logger.error('Sightengine API analysis error', error);
      throw error;
    }
  }

  /**
   * Analyze image locally (placeholder)
   * @param {string} imageUrl - URL of the image to analyze
   * @returns {Promise<object>} Analysis results
   */
  async _analyzeLocally(imageUrl) {
    // This is a placeholder. In a real implementation,
    // you would use a local ML model or other analysis method.
    logger.warn('Local image analysis is not implemented');
    
    // Return simulated results
    return this._simulateAnalysis(imageUrl);
  }

  /**
   * Simulate image analysis (for testing/placeholder)
   * @param {string} imageUrl - URL of the image to analyze
   * @returns {object} Simulated analysis results
   */
  _simulateAnalysis(imageUrl) {
    // Generate random scores for demonstration
    const nudityScore = Math.random() * 0.5; // 0-0.5 range
    const weaponScore = Math.random() * 0.3; // 0-0.3 range
    const alcoholScore = Math.random() * 0.4; // 0-0.4 range
    const drugsScore = Math.random() * 0.2; // 0-0.2 range
    const offensiveScore = Math.random() * 0.3; // 0-0.3 range
    
    // Determine if faces are detected (50% chance)
    const hasFaces = Math.random() > 0.5;
    
    return {
      provider: 'simulation',
      timestamp: Date.now(),
      imageUrl: imageUrl,
      nudity: {
        raw: nudityScore,
        safe: 1 - nudityScore,
        partial: nudityScore * 0.7,
        explicit: nudityScore * 0.3
      },
      weapon: weaponScore,
      alcohol: alcoholScore,
      drugs: drugsScore,
      offensive: offensiveScore,
      faces: hasFaces ? [
        {
          x: Math.random() * 0.8,
          y: Math.random() * 0.8,
          width: Math.random() * 0.2 + 0.1,
          height: Math.random() * 0.2 + 0.1,
          confidence: Math.random() * 0.3 + 0.7
        }
      ] : [],
      summary: {
        adult_content: nudityScore > 0.3,
        sensitive_content: nudityScore > 0.3 || weaponScore > 0.2 || alcoholScore > 0.3 || drugsScore > 0.15 || offensiveScore > 0.2,
        has_faces: hasFaces
      }
    };
  }

  /**
   * Save configuration to storage
   */
  async _saveConfig() {
    try {
      await this.storageService.set({
        'image_analyzer_config': {
          apiKey: this.apiKey,
          apiEndpoint: this.apiEndpoint,
          apiProvider: this.apiProvider,
          enabled: this.enabled
        }
      });
    } catch (error) {
      logger.error('Failed to save image analyzer configuration', error);
    }
  }
}
