/**
 * Bypass Manager - Gerencia técnicas para contornar restrições
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';

const logger = new Logger({ level: 'info' });

export class BypassManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.activeBypassTechniques = new Set();
    this.userAgents = this._loadUserAgents();
    this.proxyList = [];
    this.rotationInterval = 5 * 60 * 1000; // 5 minutos
    this.lastRotation = Date.now();
    this.bypassHeaders = this._getDefaultBypassHeaders();
    this.cookieBypassEnabled = true;
    this.webRTCProtectionEnabled = true;
    this.canvasProtectionEnabled = true;
    this.referrerSpoofingEnabled = true;
    
    // Inicializar
    this._setupEventListeners();
    
    logger.info('BypassManager inicializado');
  }

  /**
   * Configura listeners de eventos
   */
  _setupEventListeners() {
    if (this.eventBus) {
      this.eventBus.subscribe('request:beforeSend', this.onBeforeRequest.bind(this));
      this.eventBus.subscribe('settings:updated', this.onSettingsUpdated.bind(this));
    }
  }

  /**
   * Manipula evento antes de enviar requisição
   * @param {object} data - Dados da requisição
   * @returns {object} - Dados da requisição modificados
   */
  onBeforeRequest(data) {
    if (!data || !data.request) return data;
    
    // Validate request data to prevent injection
    if (!this._isValidRequestData(data)) {
      logger.warn('Invalid request data detected, skipping bypass techniques');
      return data;
    }
    
    const request = data.request;
    
    // Verificar se é hora de rotacionar
    this._checkRotation();
    
    // Apply bypass techniques with safety checks
    try {
      // Aplicar rotação de user-agent
      this._applyUserAgentRotation(request);
      
      // Aplicar rotação de proxy
      this._applyProxyRotation(request);
      
      // Aplicar cabeçalhos de bypass
      this._applyBypassHeaders(request);
      
      // Aplicar spoofing de referrer
      this._applyReferrerSpoofing(request);
      
      logger.debug('Bypass techniques applied successfully');
    } catch (error) {
      logger.error('Error applying bypass techniques', error);
      // Continue without bypass techniques if there's an error
    }
    
    return data;
  }

  /**
   * Validates request data for security
   * @param {object} data - Request data to validate
   * @returns {boolean} - Whether the data is valid
   */
  _isValidRequestData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.request || typeof data.request !== 'object') return false;
    
    // Check for suspicious properties
    const request = data.request;
    if (request.url && typeof request.url === 'string') {
      // Validate URL format
      try {
        new URL(request.url);
      } catch {
        return false;
      }
      
      // Check for suspicious protocols
      const suspiciousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
      if (suspiciousProtocols.some(protocol => request.url.toLowerCase().startsWith(protocol))) {
        return false;
      }
    }
    
    return true;
  }
    
    // Aplicar técnicas de bypass
    this._applyUserAgentRotation(request);
    this._applyProxyRotation(request);
    this._applyHeaderManipulation(request);
    this._applyCookieManipulation(request);
    
    return { ...data, request };
  }

  /**
   * Manipula evento de atualização de configurações
   * @param {object} settings - Novas configurações
   */
  onSettingsUpdated(settings) {
    if (!settings) return;
    
    // Atualizar configurações de proxy
    if (settings.proxyEnabled !== undefined) {
      if (settings.proxyEnabled) {
        this.enableTechnique('proxy');
      } else {
        this.disableTechnique('proxy');
      }
    }
    
    if (settings.proxyList && Array.isArray(settings.proxyList)) {
      this.proxyList = settings.proxyList;
    }
    
    // Atualizar configurações de user-agent
    if (settings.userAgentRotation !== undefined) {
      if (settings.userAgentRotation) {
        this.enableTechnique('userAgent');
      } else {
        this.disableTechnique('userAgent');
      }
    }
    
    // Atualizar configurações de proteção WebRTC
    if (settings.webRTCProtection !== undefined) {
      this.webRTCProtectionEnabled = settings.webRTCProtection;
      
      if (settings.webRTCProtection) {
        this.enableTechnique('webRTC');
      } else {
        this.disableTechnique('webRTC');
      }
    }
    
    // Atualizar configurações de proteção Canvas
    if (settings.canvasProtection !== undefined) {
      this.canvasProtectionEnabled = settings.canvasProtection;
      
      if (settings.canvasProtection) {
        this.enableTechnique('canvas');
      } else {
        this.disableTechnique('canvas');
      }
    }
    
    // Atualizar configurações de spoofing de referrer
    if (settings.referrerSpoofing !== undefined) {
      this.referrerSpoofingEnabled = settings.referrerSpoofing;
      
      if (settings.referrerSpoofing) {
        this.enableTechnique('referrer');
      } else {
        this.disableTechnique('referrer');
      }
    }
    
    // Atualizar configurações de bypass de cookies
    if (settings.cookieBypass !== undefined) {
      this.cookieBypassEnabled = settings.cookieBypass;
      
      if (settings.cookieBypass) {
        this.enableTechnique('cookie');
      } else {
        this.disableTechnique('cookie');
      }
    }
    
    // Atualizar intervalo de rotação
    if (settings.rotationInterval) {
      this.rotationInterval = settings.rotationInterval * 60 * 1000; // Converter minutos para ms
    }
    
    logger.info('Configurações de bypass atualizadas', {
      activeTechniques: Array.from(this.activeBypassTechniques)
    });
  }

  /**
   * Habilita uma técnica de bypass
   * @param {string} technique - Nome da técnica
   */
  enableTechnique(technique) {
    if (!technique) return;
    
    this.activeBypassTechniques.add(technique);
    logger.info(`Técnica de bypass habilitada: ${technique}`);
    
    // Notificar content scripts se necessário
    if (['webRTC', 'canvas', 'fingerprint'].includes(technique)) {
      this._notifyContentScripts({ technique, enabled: true });
    }
  }

  /**
   * Desabilita uma técnica de bypass
   * @param {string} technique - Nome da técnica
   */
  disableTechnique(technique) {
    if (!technique) return;
    
    this.activeBypassTechniques.delete(technique);
    logger.info(`Técnica de bypass desabilitada: ${technique}`);
    
    // Notificar content scripts se necessário
    if (['webRTC', 'canvas', 'fingerprint'].includes(technique)) {
      this._notifyContentScripts({ technique, enabled: false });
    }
  }

  /**
   * Verifica se uma técnica está habilitada
   * @param {string} technique - Nome da técnica
   * @returns {boolean} - Se a técnica está habilitada
   */
  isTechniqueEnabled(technique) {
    return this.activeBypassTechniques.has(technique);
  }

  /**
   * Aplica todas as técnicas de bypass a uma requisição
   * @param {object} request - Objeto de requisição
   * @returns {object} - Requisição modificada
   */
  applyAllTechniques(request) {
    if (!request) return request;
    
    // Clonar a requisição
    const modifiedRequest = { ...request };
    
    // Aplicar técnicas
    this._applyUserAgentRotation(modifiedRequest);
    this._applyProxyRotation(modifiedRequest);
    this._applyHeaderManipulation(modifiedRequest);
    this._applyCookieManipulation(modifiedRequest);
    
    return modifiedRequest;
  }

  /**
   * Verifica se é hora de rotacionar e faz a rotação se necessário
   */
  _checkRotation() {
    const now = Date.now();
    
    if (now - this.lastRotation >= this.rotationInterval) {
      this._rotateAll();
      this.lastRotation = now;
    }
  }

  /**
   * Rotaciona todos os recursos
   */
  _rotateAll() {
    // Rotacionar user-agent
    if (this.isTechniqueEnabled('userAgent')) {
      this._rotateUserAgent();
    }
    
    // Rotacionar proxy
    if (this.isTechniqueEnabled('proxy')) {
      this._rotateProxy();
    }
    
    logger.debug('Recursos rotacionados');
  }

  /**
   * Rotaciona o user-agent
   * @returns {string} - Novo user-agent
   */
  _rotateUserAgent() {
    if (!this.userAgents || this.userAgents.length === 0) {
      return null;
    }
    
    const index = Math.floor(Math.random() * this.userAgents.length);
    const userAgent = this.userAgents[index];
    
    logger.debug(`User-Agent rotacionado: ${userAgent}`);
    
    return userAgent;
  }

  /**
   * Rotaciona o proxy
   * @returns {object|null} - Novo proxy ou null se não houver proxies disponíveis
   */
  _rotateProxy() {
    if (!this.proxyList || this.proxyList.length === 0) {
      return null;
    }
    
    const index = Math.floor(Math.random() * this.proxyList.length);
    const proxy = this.proxyList[index];
    
    logger.debug(`Proxy rotacionado: ${proxy.host}:${proxy.port}`);
    
    return proxy;
  }

  /**
   * Aplica rotação de user-agent à requisição
   * @param {object} request - Objeto de requisição
   */
  _applyUserAgentRotation(request) {
    if (!this.isTechniqueEnabled('userAgent') || !request) {
      return;
    }
    
    const userAgent = this._rotateUserAgent();
    
    if (userAgent) {
      if (!request.headers) {
        request.headers = {};
      }
      
      request.headers['User-Agent'] = userAgent;
    }
  }

  /**
   * Aplica rotação de proxy à requisição
   * @param {object} request - Objeto de requisição
   */
  _applyProxyRotation(request) {
    if (!this.isTechniqueEnabled('proxy') || !request) {
      return;
    }
    
    const proxy = this._rotateProxy();
    
    if (proxy) {
      request.proxy = proxy;
    }
  }

  /**
   * Aplica manipulação de cabeçalhos à requisição
   * @param {object} request - Objeto de requisição
   */
  _applyHeaderManipulation(request) {
    if (!request || !this.bypassHeaders) {
      return;
    }
    
    if (!request.headers) {
      request.headers = {};
    }
    
    // Aplicar cabeçalhos de bypass
    for (const [header, value] of Object.entries(this.bypassHeaders)) {
      request.headers[header] = value;
    }
    
    // Aplicar spoofing de referrer
    if (this.isTechniqueEnabled('referrer')) {
      request.headers['Referer'] = this._generateFakeReferrer(request.url);
    }
  }

  /**
   * Aplica manipulação de cookies à requisição
   * @param {object} request - Objeto de requisição
   */
  _applyCookieManipulation(request) {
    if (!this.isTechniqueEnabled('cookie') || !request) {
      return;
    }
    
    // Adicionar cookies que podem ajudar a contornar restrições
    if (!request.cookies) {
      request.cookies = {};
    }
    
    // Cookies comuns para bypass de detecção
    request.cookies['euconsent'] = 'true';
    request.cookies['gdpr'] = 'accepted';
    request.cookies['cookieconsent_status'] = 'dismiss';
    request.cookies['cc_cookie_accept'] = '1';
    request.cookies['_ga'] = this._generateRandomGAID();
    request.cookies['_gid'] = this._generateRandomGAID();
  }

  /**
   * Notifica content scripts sobre mudanças nas técnicas de bypass
   * @param {object} data - Dados a serem enviados
   */
  _notifyContentScripts(data) {
    if (!this.eventBus) return;
    
    this.eventBus.publish('bypass:update', data);
  }

  /**
   * Gera um referrer falso com base na URL de destino
   * @param {string} targetUrl - URL de destino
   * @returns {string} - Referrer falso
   */
  _generateFakeReferrer(targetUrl) {
    if (!targetUrl) {
      return 'https://www.google.com/';
    }
    
    try {
      const url = new URL(targetUrl);
      const domain = url.hostname;
      
      // Lista de possíveis referrers
      const referrers = [
        `https://www.google.com/search?q=${domain}`,
        `https://www.bing.com/search?q=${domain}`,
        `https://duckduckgo.com/?q=${domain}`,
        `https://www.reddit.com/search/?q=${domain}`,
        `https://twitter.com/search?q=${domain}`,
        `https://www.facebook.com/search/top/?q=${domain}`,
        `https://www.linkedin.com/search/results/all/?keywords=${domain}`,
        `https://www.instagram.com/explore/tags/${domain.replace(/\./g, '')}/`,
        `https://www.youtube.com/results?search_query=${domain}`
      ];
      
      // Escolher um referrer aleatório
      const index = Math.floor(Math.random() * referrers.length);
      return referrers[index];
    } catch (error) {
      return 'https://www.google.com/';
    }
  }

  /**
   * Gera um ID aleatório do Google Analytics
   * @returns {string} - ID do GA
   */
  _generateRandomGAID() {
    const timestamp = Math.floor(Date.now() / 1000);
    const random = Math.floor(Math.random() * 1000000000);
    return `GA1.2.${random}.${timestamp}`;
  }

  /**
   * Obtém cabeçalhos padrão para bypass
   * @returns {object} - Cabeçalhos padrão
   */
  _getDefaultBypassHeaders() {
    return {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'DNT': '1'
    };
  }

  /**
   * Carrega lista de user-agents
   * @returns {Array<string>} - Lista de user-agents
   */
  _loadUserAgents() {
    return [
      // Chrome em Windows
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36',
      
      // Firefox em Windows
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:93.0) Gecko/20100101 Firefox/93.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:94.0) Gecko/20100101 Firefox/94.0',
      
      // Edge em Windows
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36 Edg/92.0.902.62',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36 Edg/93.0.961.38',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36 Edg/94.0.992.31',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36 Edg/95.0.1020.30',
      
      // Chrome em macOS
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36',
      
      // Firefox em macOS
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:90.0) Gecko/20100101 Firefox/90.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:91.0) Gecko/20100101 Firefox/91.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:92.0) Gecko/20100101 Firefox/92.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:93.0) Gecko/20100101 Firefox/93.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:94.0) Gecko/20100101 Firefox/94.0',
      
      // Safari em macOS
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15',
      
      // Chrome em Linux
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36',
      
      // Firefox em Linux
      'Mozilla/5.0 (X11; Linux x86_64; rv:90.0) Gecko/20100101 Firefox/90.0',
      'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
      'Mozilla/5.0 (X11; Linux x86_64; rv:92.0) Gecko/20100101 Firefox/92.0',
      'Mozilla/5.0 (X11; Linux x86_64; rv:93.0) Gecko/20100101 Firefox/93.0',
      'Mozilla/5.0 (X11; Linux x86_64; rv:94.0) Gecko/20100101 Firefox/94.0',
      
      // Chrome em Android
      'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.115 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.62 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.50 Mobile Safari/537.36',
      
      // Firefox em Android
      'Mozilla/5.0 (Android 10; Mobile; rv:90.0) Gecko/90.0 Firefox/90.0',
      'Mozilla/5.0 (Android 10; Mobile; rv:91.0) Gecko/91.0 Firefox/91.0',
      'Mozilla/5.0 (Android 10; Mobile; rv:92.0) Gecko/92.0 Firefox/92.0',
      'Mozilla/5.0 (Android 10; Mobile; rv:93.0) Gecko/93.0 Firefox/93.0',
      'Mozilla/5.0 (Android 10; Mobile; rv:94.0) Gecko/94.0 Firefox/94.0',
      
      // Safari em iOS
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Mobile/15E148 Safari/604.1'
    ];
  }
}
