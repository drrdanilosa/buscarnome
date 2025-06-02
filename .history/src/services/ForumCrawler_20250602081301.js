/**
 * Forum Crawler - Specialized crawler for forums and community sites
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';
import { EventBus } from '../utils/EventBus.js';

const logger = new Logger({ level: 'info' });

export class ForumCrawler {
  constructor(storageService, eventBus) {
    this.storageService = storageService;
    this.eventBus = eventBus || new EventBus();
    this.enabled = false;
    this.maxDepth = 2; // Default max crawl depth
    this.maxPages = 10; // Default max pages to crawl
    this.delayBetweenRequests = 2000; // Default delay in ms
    
    // Forum platform adapters
    this.adapters = {
      'vbulletin': {
        userProfilePattern: '/member.php?u={userId}',
        userSearchPattern: '/search.php?do=finduser&u={username}',
        postSearchPattern: '/search.php?do=process&query={username}',
        selectors: {
          userProfile: '.memberinfo',
          posts: '.postcontainer',
          pagination: '.pagination'
        }
      },
      'phpbb': {
        userProfilePattern: '/memberlist.php?mode=viewprofile&u={userId}',
        userSearchPattern: '/memberlist.php?mode=searchuser&username={username}',
        postSearchPattern: '/search.php?keywords={username}&terms=all&author={username}',
        selectors: {
          userProfile: '.profile',
          posts: '.post',
          pagination: '.pagination'
        }
      },
      'xenforo': {
        userProfilePattern: '/members/{username}.{userId}/',
        userSearchPattern: '/search/member?user={username}',
        postSearchPattern: '/search/search?keywords={username}&users={username}',
        selectors: {
          userProfile: '.memberHeader',
          posts: '.message',
          pagination: '.pageNav'
        }
      },
      'discourse': {
        userProfilePattern: '/u/{username}',
        userSearchPattern: '/u/{username}',
        postSearchPattern: '/search?q=@{username}',
        selectors: {
          userProfile: '.user-profile',
          posts: '.topic-post',
          pagination: '.topic-list-bottom'
        }
      },
      'generic': {
        // Generic patterns and selectors as fallback
        userProfilePattern: '/user/{username}',
        userSearchPattern: '/search?q={username}',
        postSearchPattern: '/search?q={username}',
        selectors: {
          userProfile: '.profile, .user, .member',
          posts: '.post, .message, .comment',
          pagination: '.pagination, .pager, .pages'
        }
      }
    };
    
    logger.info('ForumCrawler initialized');
  }

  /**
   * Initialize the forum crawler
   * @param {object} options - Configuration options
   */
  async initialize(options = {}) {
    // Set options
    this.maxDepth = options.maxDepth || this.maxDepth;
    this.maxPages = options.maxPages || this.maxPages;
    this.delayBetweenRequests = options.delayBetweenRequests || this.delayBetweenRequests;
    this.enabled = options.enabled || false;
    
    // Try to load saved configuration from storage
    try {
      const savedConfig = await this.storageService.get('forum_crawler_config');
      if (savedConfig) {
        this.maxDepth = savedConfig.maxDepth || this.maxDepth;
        this.maxPages = savedConfig.maxPages || this.maxPages;
        this.delayBetweenRequests = savedConfig.delayBetweenRequests || this.delayBetweenRequests;
        this.enabled = savedConfig.enabled !== undefined ? savedConfig.enabled : this.enabled;
      }
    } catch (error) {
      logger.error('Failed to load forum crawler configuration from storage', error);
    }
    
    logger.info(`ForumCrawler initialized with maxDepth: ${this.maxDepth}, maxPages: ${this.maxPages}, enabled: ${this.enabled}`);
    
    // Emit initialization event
    this.eventBus.emit('forumCrawler:initialized', {
      enabled: this.enabled,
      maxDepth: this.maxDepth,
      maxPages: this.maxPages
    });
    
    return {
      enabled: this.enabled,
      maxDepth: this.maxDepth,
      maxPages: this.maxPages
    };
  }

  /**
   * Enable or disable forum crawling
   * @param {boolean} enabled - Whether to enable forum crawling
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    // Save configuration
    this._saveConfig();
    
    logger.info(`Forum crawling ${this.enabled ? 'enabled' : 'disabled'}`);
    
    // Emit event
    this.eventBus.emit('forumCrawler:status', { enabled: this.enabled });
    
    return this.enabled;
  }

  /**
   * Set crawler configuration
   * @param {object} config - Crawler configuration
   */
  setConfig(config) {
    if (!config) {
      logger.error('Invalid crawler configuration');
      throw new Error('Invalid crawler configuration');
    }
    
    this.maxDepth = config.maxDepth || this.maxDepth;
    this.maxPages = config.maxPages || this.maxPages;
    this.delayBetweenRequests = config.delayBetweenRequests || this.delayBetweenRequests;
    
    // Save configuration
    this._saveConfig();
    
    logger.info(`Set forum crawler config: maxDepth=${this.maxDepth}, maxPages=${this.maxPages}`);
    
    // Emit event
    this.eventBus.emit('forumCrawler:config', { 
      maxDepth: this.maxDepth,
      maxPages: this.maxPages,
      delayBetweenRequests: this.delayBetweenRequests
    });
    
    return {
      maxDepth: this.maxDepth,
      maxPages: this.maxPages,
      delayBetweenRequests: this.delayBetweenRequests
    };
  }

  /**
   * Detect forum platform type from URL and HTML
   * @param {string} url - Forum URL
   * @param {string} html - Forum HTML content
   * @returns {string} Platform type ('vbulletin', 'phpbb', 'xenforo', 'discourse', 'generic')
   */
  detectPlatformType(url, html) {
    if (!url || !html) {
      return 'generic';
    }
    
    try {
      // Validate and sanitize URL
      if (!this._isValidUrl(url)) {
        logger.warn('Invalid URL provided for platform detection', { url: url.substring(0, 100) });
        return 'generic';
      }
      
      // Validate HTML size (prevent DoS)
      if (html.length > 5000000) { // 5MB limit
        logger.warn('HTML content too large for platform detection');
        return 'generic';
      }
      
      // Sanitize HTML for safe pattern matching
      const sanitizedHtml = this._sanitizeHtmlForDetection(html);
      
      // Check URL patterns
      if (url.includes('vbulletin') || url.includes('forum/member.php') || sanitizedHtml.includes('vbulletin')) {
        return 'vbulletin';
      }
      
      if (url.includes('phpbb') || url.includes('memberlist.php?mode=') || sanitizedHtml.includes('phpbb')) {
        return 'phpbb';
      }
      
      if (url.includes('xenforo') || url.includes('/members/') || sanitizedHtml.includes('xenforo') || sanitizedHtml.includes('XenForo')) {
        return 'xenforo';
      }
      
      if (url.includes('discourse') || url.includes('/u/') || sanitizedHtml.includes('discourse')) {
        return 'discourse';
      }
      
      // Check HTML signatures safely
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(sanitizedHtml, 'text/html');
        
        if (doc.querySelector('.vbmenu_control')) {
          return 'vbulletin';
        }
        
        if (doc.querySelector('.phpbb')) {
          return 'phpbb';
        }
        
        if (doc.querySelector('.p-body-pageContent')) {
          return 'xenforo';
        }
        
        if (doc.querySelector('#ember-basic-dropdown-wormhole')) {
          return 'discourse';
        }
      } catch (parseError) {
        logger.warn('Error parsing HTML for platform detection', parseError);
      }
      
      // Default to generic
      return 'generic';
    } catch (error) {
      logger.error('Error detecting forum platform type', error);
      return 'generic';
    }
  }

  /**
   * Search for a username on a forum
   * @param {string} forumUrl - Base URL of the forum
   * @param {string} username - Username to search for
   * @param {object} options - Search options
   * @returns {Promise<object>} Search results
   */
  async searchForum(forumUrl, username, options = {}) {
    if (!this.enabled) {
      logger.warn('Forum search attempted while disabled', { forumUrl: this._sanitizeUrl(forumUrl), username: this._sanitizeUsername(username) });
      throw new Error('Forum crawling is disabled');
    }
    
    if (!forumUrl || !username) {
      logger.error('Invalid forum URL or username');
      throw new Error('Invalid forum URL or username');
    }
    
    // Validate and sanitize inputs
    if (!this._isValidUrl(forumUrl)) {
      throw new Error('Invalid forum URL format');
    }
    
    if (!this._isValidUsername(username)) {
      throw new Error('Invalid username format');
    }
    
    // Normalize forum URL (remove trailing slash)
    const baseUrl = forumUrl.endsWith('/') ? forumUrl.slice(0, -1) : forumUrl;
    
    logger.info(`Searching forum ${this._sanitizeUrl(baseUrl)} for username: ${this._sanitizeUsername(username)}`);
    
    const searchTimeout = setTimeout(() => {
      throw new Error('Forum search timeout');
    }, 60000); // 60 second timeout
    
    try {
      // Emit event for search start
      this.eventBus.emit('forumCrawler:searching', { 
        forumUrl: this._sanitizeUrl(baseUrl), 
        username: this._sanitizeUsername(username) 
      });
      
      // First, try to fetch the forum homepage to detect platform
      const homepageResponse = await fetch(baseUrl, {
        headers: {
          'User-Agent': options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!homepageResponse.ok) {
        throw new Error(`Failed to access forum: ${homepageResponse.status} ${homepageResponse.statusText}`);
      }
      
      const homepageHtml = await homepageResponse.text();
      
      // Detect platform type
      const platformType = this.detectPlatformType(baseUrl, homepageHtml);
      logger.debug(`Detected forum platform: ${platformType}`);
      
      // Get adapter for this platform
      const adapter = this.adapters[platformType] || this.adapters.generic;
      
      // Search for user profile
      const profileUrl = this._buildUrl(baseUrl, adapter.userProfilePattern, { username });
      const profileResults = await this._crawlPage(profileUrl, adapter, { username, ...options });
      
      // Search for user posts
      const postsUrl = this._buildUrl(baseUrl, adapter.postSearchPattern, { username });
      const postsResults = await this._crawlPage(postsUrl, adapter, { username, ...options });
      
      // Combine results
      const results = {
        forumUrl: baseUrl,
        username: username,
        platformType: platformType,
        profileFound: profileResults.found,
        profileUrl: profileUrl,
        profileData: profileResults.data,
        postsFound: postsResults.found,
        postsUrl: postsUrl,
        postsData: postsResults.data,
        crawledPages: profileResults.crawledPages + postsResults.crawledPages,
        timestamp: Date.now()
      };
      
      // Cache results
      const cacheKey = `forum_search_${btoa(baseUrl)}_${username}`;
      await this.storageService.cacheResult(cacheKey, results, 24 * 60 * 60 * 1000); // 24 hours
      
      // Emit event for search complete
      this.eventBus.emit('forumCrawler:result', { 
        forumUrl: baseUrl, 
        username,
        results
      });
      
      logger.info(`Forum search complete: ${baseUrl} for ${username}, profile found: ${results.profileFound}, posts found: ${results.postsFound}`);
      
      clearTimeout(searchTimeout);
      return results;
    } catch (error) {
      clearTimeout(searchTimeout);
      logger.error(`Forum search error: ${baseUrl} for ${username}`, error);
      
      // Emit event for search error
      this.eventBus.emit('forumCrawler:error', { 
        forumUrl: baseUrl, 
        username,
        error: error.message || 'Search failed'
      });
      
      throw error;
    }
  }

  /**
   * Crawl a forum page and extract data
   * @param {string} url - Page URL
   * @param {object} adapter - Platform adapter
   * @param {object} options - Crawl options
   * @returns {Promise<object>} Crawl results
   */
  async _crawlPage(url, adapter, options = {}) {
    const { username, depth = 0, visited = new Set() } = options;
    
    // Check if we've reached max depth or max pages
    if (depth >= this.maxDepth || visited.size >= this.maxPages) {
      return {
        found: false,
        data: [],
        crawledPages: 0
      };
    }
    
    // Check if we've already visited this URL
    if (visited.has(url)) {
      return {
        found: false,
        data: [],
        crawledPages: 0
      };
    }
    
    // Add to visited set
    visited.add(url);
    
    try {
      logger.debug(`Crawling forum page: ${url}`);
      
      // Fetch page
      const response = await fetch(url, {
        headers: {
          'User-Agent': options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        logger.warn(`Failed to fetch forum page: ${url}, status: ${response.status}`);
        return {
          found: false,
          data: [],
          crawledPages: 1
        };
      }
      
      const html = await response.text();
      
      // Parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract data based on platform type
      const data = [];
      
      // Check for user profile
      const profileElements = doc.querySelectorAll(adapter.selectors.userProfile);
      if (profileElements.length > 0) {
        data.push({
          type: 'profile',
          url: url,
          content: profileElements[0].textContent.trim(),
          html: profileElements[0].outerHTML
        });
      }
      
      // Check for posts
      const postElements = doc.querySelectorAll(adapter.selectors.posts);
      postElements.forEach(post => {
        // Check if post contains username
        if (post.textContent.toLowerCase().includes(username.toLowerCase())) {
          data.push({
            type: 'post',
            url: url,
            content: post.textContent.trim(),
            html: post.outerHTML
          });
        }
      });
      
      // Check if we found anything
      const found = data.length > 0;
      
      // If we're not at max depth, check for pagination links
      let crawledPages = 1;
      
      if (depth < this.maxDepth - 1 && visited.size < this.maxPages) {
        const paginationElements = doc.querySelectorAll(adapter.selectors.pagination + ' a');
        const nextPageUrls = [];
        
        // Extract pagination URLs
        paginationElements.forEach(link => {
          const href = link.getAttribute('href');
          if (href && !href.includes('#') && !visited.has(href)) {
            // Resolve relative URLs
            try {
              const nextUrl = new URL(href, url).href;
              if (!visited.has(nextUrl)) {
                nextPageUrls.push(nextUrl);
              }
            } catch (e) {
              // Invalid URL, skip
            }
          }
        });
        
        // Crawl next pages (up to maxPages limit)
        for (const nextUrl of nextPageUrls) {
          if (visited.size >= this.maxPages) {
            break;
          }
          
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests));
          
          const nextResults = await this._crawlPage(nextUrl, adapter, {
            ...options,
            depth: depth + 1,
            visited
          });
          
          // Add results
          if (nextResults.found) {
            data.push(...nextResults.data);
          }
          
          crawledPages += nextResults.crawledPages;
        }
      }
      
      return {
        found,
        data,
        crawledPages
      };
    } catch (error) {
      logger.error(`Error crawling forum page: ${url}`, error);
      return {
        found: false,
        data: [],
        crawledPages: 1,
        error: error.message
      };
    }
  }

  /**
   * Build a URL from a pattern and parameters
   * @param {string} baseUrl - Base URL
   * @param {string} pattern - URL pattern
   * @param {object} params - Parameters to replace in pattern
   * @returns {string} Built URL
   */
  _buildUrl(baseUrl, pattern, params) {
    let url = pattern;
    
    // Replace parameters in pattern
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`{${key}}`, encodeURIComponent(value));
    }
    
    // Resolve relative URL
    try {
      return new URL(url, baseUrl).href;
    } catch (e) {
      // If URL is invalid, just concatenate
      return baseUrl + url;
    }
  }

  /**
   * Save configuration to storage
   */
  async _saveConfig() {
    try {
      await this.storageService.set({
        'forum_crawler_config': {
          maxDepth: this.maxDepth,
          maxPages: this.maxPages,
          delayBetweenRequests: this.delayBetweenRequests,
          enabled: this.enabled
        }
      });
    } catch (error) {
      logger.error('Failed to save forum crawler configuration', error);
    }
  }

  /**
   * Validate URL format and security
   * @param {string} url - URL to validate
   * @returns {boolean} Is valid URL
   */
  _isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
      const urlObj = new URL(url);
      
      // Check protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      
      // Check for suspicious patterns
      const suspiciousPatterns = [
        'javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'
      ];
      
      if (suspiciousPatterns.some(pattern => url.toLowerCase().includes(pattern))) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate username format
   * @param {string} username - Username to validate
   * @returns {boolean} Is valid username
   */
  _isValidUsername(username) {
    if (!username || typeof username !== 'string') return false;
    
    // Length check
    if (username.length < 1 || username.length > 100) return false;
    
    // Check for script injection patterns
    const dangerousPatterns = [
      '<script', '</script>', 'javascript:', 'data:', 'vbscript:', 
      'onload=', 'onerror=', 'onclick=', 'eval(', 'alert('
    ];
    
    const lowerUsername = username.toLowerCase();
    if (dangerousPatterns.some(pattern => lowerUsername.includes(pattern))) {
      return false;
    }
    
    return true;
  }

  /**
   * Sanitize URL for logging
   * @param {string} url - URL to sanitize
   * @returns {string} Sanitized URL
   */
  _sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '[invalid-url]';
    
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    } catch (error) {
      return url.substring(0, 100) + (url.length > 100 ? '...' : '');
    }
  }

  /**
   * Sanitize username for logging
   * @param {string} username - Username to sanitize
   * @returns {string} Sanitized username
   */
  _sanitizeUsername(username) {
    if (!username || typeof username !== 'string') return '[invalid-username]';
    
    // Remove potentially dangerous characters for logging
    return username.replace(/[<>'"&]/g, '_').substring(0, 50);
  }

  /**
   * Sanitize HTML content for safe pattern detection
   * @param {string} html - HTML content to sanitize
   * @returns {string} Sanitized HTML
   */
  _sanitizeHtmlForDetection(html) {
    if (!html || typeof html !== 'string') return '';
    
    // Remove script tags and their content
    let sanitized = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    
    // Remove style tags and their content
    sanitized = sanitized.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Limit length for safe processing
    return sanitized.substring(0, 100000); // 100KB limit
  }
}
