/**
 * Content Script - Executa no contexto das páginas web visitadas
 * @version 4.0.0
 */

// Configurações
const DEBUG = false; // Ativar logs de debug
const SCAN_DELAY = 500; // Delay em ms antes de iniciar a varredura da página

/**
 * Classe principal do Content Script
 */
class DeepAliasContentScript {
  constructor() {
    this.initialized = false;
    this.currentUrl = window.location.href;
    this.pageContent = '';
    this.imageUrls = [];
    this.detectedUsernames = new Set();
    this.searchTerms = [];
    this.bypassApplied = false;
    
    // Inicializar
    this.init();
  }
  
  /**
   * Inicializa o content script
   */
  async init() {
    if (this.initialized) return;
    
    this.log('Inicializando Content Script');
    
    // Registrar listener para mensagens da extensão
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Notificar background script que o content script foi carregado
    browser.runtime.sendMessage({
      type: 'content:loaded',
      data: {
        url: this.currentUrl,
        title: document.title
      }
    }).catch(error => this.log('Erro ao enviar mensagem de inicialização', error));
    
    // Aguardar um momento para a página carregar completamente
    setTimeout(() => {
      this.scanPage();
    }, SCAN_DELAY);
    
    // Observar mudanças no DOM
    this.setupMutationObserver();
    
    this.initialized = true;
    this.log('Content Script inicializado');
  }
  
  /**
   * Configura um observador de mutações para detectar mudanças no DOM
   */
  setupMutationObserver() {
    const observer = new MutationObserver(mutations => {
      // Verificar se houve mudanças significativas
      let significantChanges = false;
      
      for (const mutation of mutations) {
        // Ignorar mudanças em atributos ou texto
        if (mutation.type !== 'childList') continue;
        
        // Verificar se foram adicionados nós significativos
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            // Ignorar nós de texto e comentários
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            
            // Verificar se é um elemento significativo
            if (this.isSignificantElement(node)) {
              significantChanges = true;
              break;
            }
          }
        }
        
        if (significantChanges) break;
      }
      
      // Se houve mudanças significativas, escanear a página novamente
      if (significantChanges) {
        this.log('Detectadas mudanças significativas no DOM, escaneando novamente');
        this.scanPage();
      }
    });
    
    // Observar todo o documento
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  /**
   * Verifica se um elemento é significativo para re-escaneamento
   * @param {Element} element - Elemento a verificar
   * @returns {boolean} - Se o elemento é significativo
   */
  isSignificantElement(element) {
    // Elementos que geralmente contêm conteúdo importante
    const significantTags = ['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'IFRAME'];
    
    // Verificar tag
    if (significantTags.includes(element.tagName)) {
      // Verificar se tem tamanho significativo
      const rect = element.getBoundingClientRect();
      if (rect.width > 200 && rect.height > 100) {
        return true;
      }
    }
    
    // Verificar se é uma imagem significativa
    if (element.tagName === 'IMG') {
      const rect = element.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 100) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Escaneia a página em busca de conteúdo relevante
   */
  async scanPage() {
    this.log('Escaneando página');
    
    // Extrair conteúdo da página
    this.pageContent = document.body.innerText;
    
    // Extrair URLs de imagens
    this.imageUrls = this.extractImageUrls();
    
    // Detectar possíveis usernames
    this.detectUsernames();
    
    // Aplicar técnicas de bypass se necessário
    if (!this.bypassApplied) {
      this.applyBypassTechniques();
      this.bypassApplied = true;
    }
    
    // Enviar dados para o background script
    this.sendPageData();
  }
  
  /**
   * Extrai URLs de imagens da página
   * @returns {Array<string>} - Lista de URLs de imagens
   */
  extractImageUrls() {
    const images = document.querySelectorAll('img');
    const urls = [];
    
    for (const img of images) {
      // Ignorar imagens muito pequenas (provavelmente ícones)
      if (img.width < 100 || img.height < 100) continue;
      
      // Obter URL da imagem
      const src = img.src || img.dataset.src || img.getAttribute('src');
      if (src) {
        try {
          // Converter para URL absoluta
          const absoluteUrl = new URL(src, window.location.href).href;
          urls.push(absoluteUrl);
        } catch (error) {
          // Ignorar URLs inválidas
        }
      }
    }
    
    // Procurar por imagens em estilos de fundo
    const elementsWithBackground = document.querySelectorAll('[style*="background-image"]');
    for (const element of elementsWithBackground) {
      const style = window.getComputedStyle(element);
      const backgroundImage = style.backgroundImage;
      
      if (backgroundImage && backgroundImage !== 'none') {
        // Extrair URL da string de estilo
        const match = /url\(['"]?([^'"]+)['"]?\)/i.exec(backgroundImage);
        if (match && match[1]) {
          try {
            const absoluteUrl = new URL(match[1], window.location.href).href;
            urls.push(absoluteUrl);
          } catch (error) {
            // Ignorar URLs inválidas
          }
        }
      }
    }
    
    return [...new Set(urls)]; // Remover duplicatas
  }
  
  /**
   * Detecta possíveis usernames na página
   */
  detectUsernames() {
    // Padrões comuns de usernames
    const usernamePatterns = [
      /@([a-zA-Z0-9._]{3,30})\b/g, // @username
      /user(?:name)?[=:]\s*["']?([a-zA-Z0-9._]{3,30})["']?/gi, // username=value
      /(?:profile|account|user)\/([a-zA-Z0-9._]{3,30})\b/g, // profile/username
      /\b(?:by|from|author)[=:]\s*["']?([a-zA-Z0-9._]{3,30})["']?/gi // by=username
    ];
    
    // Procurar por padrões no conteúdo da página
    for (const pattern of usernamePatterns) {
      let match;
      while ((match = pattern.exec(this.pageContent)) !== null) {
        if (match[1] && match[1].length >= 3) {
          this.detectedUsernames.add(match[1]);
        }
      }
    }
    
    // Procurar por elementos que geralmente contêm usernames
    const usernameElements = document.querySelectorAll([
      '.username',
      '.user-name',
      '.profile-name',
      '.author',
      '[data-username]',
      '[data-author]'
    ].join(','));
    
    for (const element of usernameElements) {
      const username = element.textContent.trim() || 
                      element.getAttribute('data-username') || 
                      element.getAttribute('data-author');
      
      if (username && username.length >= 3 && username.length <= 30) {
        this.detectedUsernames.add(username);
      }
    }
  }
  
  /**
   * Aplica técnicas para contornar restrições
   */
  applyBypassTechniques() {
    this.log('Aplicando técnicas de bypass');
    
    // 1. Contornar detecção de headless browser
    this.bypassHeadlessDetection();
    
    // 2. Contornar bloqueios de scraping
    this.bypassScrapingBlocks();
    
    // 3. Contornar restrições de CORS
    this.bypassCorsRestrictions();
    
    // 4. Contornar limitações de rate
    this.bypassRateLimits();
  }
  
  /**
   * Contorna detecção de headless browser
   */
  bypassHeadlessDetection() {
    // Modificar propriedades do navigator para evitar detecção
    const navigatorHandler = {
      get: function(target, property) {
        // Simular valores realistas para propriedades comumente verificadas
        switch (property) {
          case 'webdriver':
            return undefined;
          case 'languages':
            return ['pt-BR', 'pt', 'en-US', 'en'];
          case 'plugins':
            return { length: 5 };
          default:
            return target[property];
        }
      }
    };
    
    // Aplicar proxy ao navigator
    try {
      window.navigator = new Proxy(window.navigator, navigatorHandler);
    } catch (error) {
      // Alguns navegadores não permitem substituir navigator
      this.log('Não foi possível aplicar proxy ao navigator', error);
    }
    
    // Simular movimentos de mouse
    this.simulateHumanBehavior();
  }
  
  /**
   * Contorna bloqueios de scraping
   */
  bypassScrapingBlocks() {
    // Remover scripts anti-scraping conhecidos
    const antiScrapingScripts = document.querySelectorAll([
      'script[src*="bot-detection"]',
      'script[src*="anti-scrape"]',
      'script[src*="captcha"]',
      'script[src*="cloudflare"]',
      'script[src*="distil"]',
      'script[src*="imperva"]',
      'script[src*="akamai"]'
    ].join(','));
    
    for (const script of antiScrapingScripts) {
      script.remove();
    }
    
    // Remover listeners de eventos que podem detectar automação
    const events = ['mousemove', 'mousedown', 'mouseup', 'keydown', 'keyup'];
    for (const event of events) {
      window.addEventListener(event, e => {
        e.stopImmediatePropagation();
      }, true);
    }
  }
  
  /**
   * Contorna restrições de CORS
   */
  bypassCorsRestrictions() {
    // Modificar cabeçalhos de solicitações XHR/fetch
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(...args) {
      const result = originalXhrOpen.apply(this, args);
      this.setRequestHeader('X-Requested-With', '');
      this.setRequestHeader('Origin', window.location.origin);
      this.setRequestHeader('Referer', window.location.href);
      return result;
    };
    
    // Modificar fetch
    const originalFetch = window.fetch;
    window.fetch = function(resource, init = {}) {
      if (!init.headers) {
        init.headers = {};
      }
      
      init.headers['X-Requested-With'] = '';
      init.headers['Origin'] = window.location.origin;
      init.headers['Referer'] = window.location.href;
      
      return originalFetch.call(this, resource, init);
    };
  }
  
  /**
   * Contorna limitações de rate
   */
  bypassRateLimits() {
    // Modificar User-Agent para um valor comum
    Object.defineProperty(navigator, 'userAgent', {
      get: function() {
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      }
    });
    
    // Adicionar delay aleatório entre ações
    this.addRandomDelay();
  }
  
  /**
   * Simula comportamento humano
   */
  simulateHumanBehavior() {
    // Simular movimentos de mouse aleatórios
    setInterval(() => {
      const event = new MouseEvent('mousemove', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: Math.floor(Math.random() * window.innerWidth),
        clientY: Math.floor(Math.random() * window.innerHeight)
      });
      
      document.dispatchEvent(event);
    }, 2000 + Math.random() * 3000);
    
    // Simular scroll ocasional
    setTimeout(() => {
      window.scrollTo({
        top: Math.random() * 500,
        behavior: 'smooth'
      });
    }, 3000 + Math.random() * 5000);
  }
  
  /**
   * Adiciona delay aleatório entre ações
   */
  addRandomDelay() {
    // Substituir setTimeout para adicionar variação aleatória
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function(callback, delay, ...args) {
      // Adicionar variação de ±20% ao delay
      const variation = delay * 0.2;
      const newDelay = delay + (Math.random() * variation * 2 - variation);
      
      return originalSetTimeout.call(this, callback, newDelay, ...args);
    };
  }
  
  /**
   * Envia dados da página para o background script
   */
  sendPageData() {
    browser.runtime.sendMessage({
      type: 'content:pageData',
      data: {
        url: this.currentUrl,
        title: document.title,
        content: this.pageContent.substring(0, 10000), // Limitar tamanho
        imageUrls: this.imageUrls.slice(0, 20), // Limitar número de imagens
        detectedUsernames: Array.from(this.detectedUsernames),
        metadata: this.extractMetadata()
      }
    }).catch(error => this.log('Erro ao enviar dados da página', error));
  }
  
  /**
   * Extrai metadados da página
   * @returns {object} - Metadados da página
   */
  extractMetadata() {
    const metadata = {
      description: '',
      keywords: [],
      author: '',
      ogTags: {}
    };
    
    // Descrição
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      metadata.description = descriptionMeta.getAttribute('content') || '';
    }
    
    // Palavras-chave
    const keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (keywordsMeta) {
      const keywords = keywordsMeta.getAttribute('content') || '';
      metadata.keywords = keywords.split(',').map(k => k.trim()).filter(Boolean);
    }
    
    // Autor
    const authorMeta = document.querySelector('meta[name="author"]');
    if (authorMeta) {
      metadata.author = authorMeta.getAttribute('content') || '';
    }
    
    // Open Graph tags
    const ogTags = document.querySelectorAll('meta[property^="og:"]');
    for (const tag of ogTags) {
      const property = tag.getAttribute('property');
      const content = tag.getAttribute('content');
      
      if (property && content) {
        const key = property.replace('og:', '');
        metadata.ogTags[key] = content;
      }
    }
    
    return metadata;
  }
  
  /**
   * Manipula mensagens do background script
   * @param {object} message - Mensagem recebida
   * @param {object} sender - Informações sobre o remetente
   * @returns {Promise} - Promessa com resposta
   */
  async handleMessage(message, sender) {
    this.log('Mensagem recebida', message);
    
    switch (message.type) {
      case 'content:scan':
        // Escanear a página novamente
        this.scanPage();
        return { success: true };
      
      case 'content:extract':
        // Extrair conteúdo específico
        return this.handleExtractRequest(message.data);
      
      case 'content:bypass':
        // Aplicar técnicas de bypass específicas
        this.applyBypassTechniques();
        return { success: true };
      
      case 'content:inject':
        // Injetar script ou estilo
        return this.handleInjectRequest(message.data);
      
      default:
        return { success: false, error: 'Tipo de mensagem desconhecido' };
    }
  }
  
  /**
   * Manipula solicitação de extração de conteúdo
   * @param {object} data - Dados da solicitação
   * @returns {object} - Resultado da extração
   */
  handleExtractRequest(data) {
    const { selector, attribute, type } = data || {};
    
    if (!selector) {
      return { success: false, error: 'Seletor não especificado' };
    }
    
    try {
      const elements = document.querySelectorAll(selector);
      const results = [];
      
      for (const element of elements) {
        let value;
        
        if (attribute) {
          // Extrair valor do atributo
          value = element.getAttribute(attribute);
        } else if (type === 'text') {
          // Extrair texto
          value = element.textContent;
        } else if (type === 'html') {
          // Extrair HTML
          value = element.outerHTML;
        } else {
          // Padrão: extrair texto
          value = element.textContent;
        }
        
        if (value) {
          results.push(value);
        }
      }
      
      return { success: true, results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Manipula solicitação de injeção de script ou estilo
   * @param {object} data - Dados da solicitação
   * @returns {object} - Resultado da injeção
   */
  handleInjectRequest(data) {
    const { type, content } = data || {};
    
    if (!type || !content) {
      return { success: false, error: 'Tipo ou conteúdo não especificado' };
    }
    
    try {
      if (type === 'script') {
        // SEGURANÇA: Validar e sanitizar conteúdo antes da injeção
        if (!this.isSecureContent(content)) {
          return { success: false, error: 'Conteúdo não é seguro para injeção' };
        }
        
        // Injetar script de forma segura
        const script = document.createElement('script');
        script.textContent = this.sanitizeScriptContent(content);
        document.head.appendChild(script);
      } else if (type === 'style') {
        // SEGURANÇA: Validar CSS antes da injeção
        if (!this.isSecureCSS(content)) {
          return { success: false, error: 'CSS não é seguro para injeção' };
        }
        
        // Injetar estilo de forma segura
        const style = document.createElement('style');
        style.textContent = this.sanitizeCSSContent(content);
        document.head.appendChild(style);
      } else {
        return { success: false, error: 'Tipo de injeção desconhecido' };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Registra mensagem de log
   * @param {string} message - Mensagem de log
   * @param {any} data - Dados adicionais
   */
  log(message, data) {
    if (!DEBUG) return;
    
    if (data) {
      console.log(`[DeepAlias] ${message}:`, data);
    } else {
      console.log(`[DeepAlias] ${message}`);
    }
  }
}

// Inicializar content script
const contentScript = new DeepAliasContentScript();
