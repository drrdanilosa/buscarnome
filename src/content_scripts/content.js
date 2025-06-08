/**
 * DeepAlias Hunter Pro - Content Script
 * @author drrdanilosa
 * @version 5.0.0
 * @date 2025-06-03
 */

// Configurações
const CONFIG = {
  // Padrões de regex para detectar usernames
  usernamePatterns: [
    // URLs comuns contendo usernames
    /(?:github\.com\/|twitter\.com\/|instagram\.com\/|facebook\.com\/|linkedin\.com\/in\/)([a-zA-Z0-9_\.-]{3,30})(?:\/|$)/g,
    
    // @menções em texto
    /\B@([a-zA-Z0-9_]{3,30})\b/g,
    
    // Textos comuns com padrão de username
    /\b(?:user|username|author|profile|account)[:=\s]+['"]*([a-zA-Z0-9_\.-]{3,30})['"]*\b/gi,
  ],
  
  // Padrões para detectar possível conteúdo sensível
  sensitivePatterns: [
    // Conteúdo adulto
    { pattern: /\b(?:porn|adult|xxx|naked|nude|sex|escort|onlyfans)\b/gi, category: 'adult', level: 'medium' },
    
    // Dados financeiros
    { pattern: /\b(?:bitcoin|wallet|crypto|password|credit\s*card|bank\s*account)\b/gi, category: 'financial', level: 'high' },
    
    // Dados pessoais
    { pattern: /\b(?:ssn|social\s*security|passport|license|id\s*number)\b/gi, category: 'personal', level: 'high' }
  ],
  
  // Intervalo mínimo entre análises (ms)
  analysisInterval: 5000,
  
  // Debug mode
  debug: false
};

// Estado global
let state = {
  lastAnalysis: 0,
  analyzedUrls: new Set(),
  detectedUsernames: new Set(),
  pageLoaded: false,
  observer: null
};

/**
 * Inicialização do content script
 */
function initialize() {
  // Registrar a carregamento do content script
  sendMessageToBackground({
    type: 'content:loaded',
    sender: 'deepalias-hunter-pro@enhanced.extension',
    data: {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    }
  }).catch(error => {
    logDebug('Erro ao registrar carregamento:', error);
  });
  
  // Aguardar carregamento completo
  if (document.readyState === 'complete') {
    onPageFullyLoaded();
  } else {
    window.addEventListener('load', onPageFullyLoaded);
  }
  
  // Monitorar mudanças na URL (SPA)
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    if (lastUrl !== window.location.href) {
      lastUrl = window.location.href;
      onUrlChanged();
    }
  }).observe(document, { subtree: true, childList: true });
  
  logDebug('Content script inicializado');
}

/**
 * Ações quando a página estiver completamente carregada
 */
function onPageFullyLoaded() {
  state.pageLoaded = true;
  
  // Analisar a página inicial
  analyzePage();
  
  // Configurar observer para mudanças significativas na página
  setupMutationObserver();
  
  logDebug('Página completamente carregada');
}

/**
 * Ações quando a URL mudar (para SPAs)
 */
function onUrlChanged() {
  logDebug('URL alterada para:', window.location.href);
  
  // Resetar estado parcial
  state.detectedUsernames.clear();
  
  // Analisar a nova página
  setTimeout(analyzePage, 500);
}

/**
 * Configura observer para detectar mudanças significativas na página
 */
function setupMutationObserver() {
  // Remover observer existente se houver
  if (state.observer) {
    state.observer.disconnect();
  }
  
  // Configurar novo observer
  state.observer = new MutationObserver(mutations => {
    // Verificar se as mudanças são significativas
    let significantChanges = mutations.some(mutation => {
      // Adição ou remoção de muitos nós
      if (mutation.addedNodes.length > 5 || mutation.removedNodes.length > 5) {
        return true;
      }
      
      // Mudanças em elementos significativos
      if (mutation.target.tagName === 'MAIN' || 
          mutation.target.tagName === 'ARTICLE' ||
          mutation.target.id === 'content' ||
          mutation.target.id === 'main') {
        return true;
      }
      
      return false;
    });
    
    if (significantChanges) {
      // Evitar análises muito frequentes
      const now = Date.now();
      if (now - state.lastAnalysis > CONFIG.analysisInterval) {
        state.lastAnalysis = now;
        analyzePage();
      }
    }
  });
  
  // Iniciar observação
  state.observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });
}

/**
 * Analisa a página atual
 */
function analyzePage() {
  // Verificar se a página já foi analisada
  if (state.analyzedUrls.has(window.location.href)) {
    logDebug('Página já analisada anteriormente:', window.location.href);
    return;
  }
  
  logDebug('Iniciando análise da página:', window.location.href);
  
  // Coletar dados básicos da página
  const pageData = {
    url: window.location.href,
    title: document.title,
    domain: window.location.hostname,
    path: window.location.pathname,
    timestamp: new Date().toISOString()
  };
  
  // Detectar usernames
  const detectedUsernames = detectUsernames();
  pageData.usernameCount = detectedUsernames.length;
  pageData.usernames = detectedUsernames;
  
  // Detectar conteúdo sensível
  const sensitiveContent = detectSensitiveContent();
  pageData.hasSensitiveContent = sensitiveContent.isSensitive;
  pageData.sensitiveCategories = sensitiveContent.categories;
  pageData.sensitiveLevel = sensitiveContent.level;
  
  // Contar imagens
  const images = document.querySelectorAll('img');
  pageData.imageCount = images.length;
  
  // Enviar dados coletados para o background
  sendMessageToBackground({
    type: 'content:pageData',
    sender: 'deepalias-hunter-pro@enhanced.extension',
    data: pageData
  }).then(response => {
    logDebug('Dados enviados com sucesso:', response);
    
    // Marcar como analisada
    state.analyzedUrls.add(window.location.href);
  }).catch(error => {
    logDebug('Erro ao enviar dados:', error);
  });
}

/**
 * Detecta usernames na página
 * @returns {Array} Lista de usernames detectados
 */
function detectUsernames() {
  // Obter texto da página
  const pageText = document.body.innerText;
  const pageUrl = window.location.href;
  
  // Lista para armazenar usernames encontrados
  const usernames = [];
  
  // Aplicar cada padrão
  CONFIG.usernamePatterns.forEach(pattern => {
    let match;
    // Reset do lastIndex para garantir que todas as ocorrências sejam encontradas
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(pageText)) !== null || (match = pattern.exec(pageUrl)) !== null) {
      if (match && match[1] && match[1].length >= 3) {
        const username = match[1].toLowerCase();
        
        // Filtrar usernames comuns e irrelevantes
        if (!isCommonWord(username) && !state.detectedUsernames.has(username)) {
          usernames.push(username);
          state.detectedUsernames.add(username);
        }
      }
    }
  });
  
  // Verificar também em elementos específicos
  const userElements = document.querySelectorAll('[class*="user"], [class*="author"], [data-username], [id*="username"]');
  userElements.forEach(el => {
    // Verificar atributos que podem conter usernames
    ['data-username', 'data-author', 'data-user'].forEach(attr => {
      if (el.hasAttribute(attr)) {
        const value = el.getAttribute(attr);
        if (value && value.length >= 3 && !isCommonWord(value)) {
          const username = value.toLowerCase();
          if (!state.detectedUsernames.has(username)) {
            usernames.push(username);
            state.detectedUsernames.add(username);
          }
        }
      }
    });
    
    // Verificar conteúdo textual se for pequeno (provável username)
    const text = el.innerText?.trim();
    if (text && text.length >= 3 && text.length <= 30 && !text.includes(' ')) {
      const username = text.toLowerCase();
      if (!isCommonWord(username) && !state.detectedUsernames.has(username)) {
        usernames.push(username);
        state.detectedUsernames.add(username);
      }
    }
  });
  
  return [...new Set(usernames)]; // Remover duplicatas
}

/**
 * Verifica se uma string é uma palavra comum (não um username)
 * @param {string} word - Palavra a verificar
 * @returns {boolean} Verdadeiro se for uma palavra comum
 */
function isCommonWord(word) {
  const commonWords = [
    'about', 'home', 'contact', 'privacy', 'terms', 'help', 'support',
    'login', 'logout', 'signup', 'register', 'account', 'profile',
    'search', 'explore', 'discover', 'settings', 'admin', 'moderator',
    'username', 'password', 'email', 'user', 'author', 'page', 'post',
    'comment', 'reply', 'share', 'like', 'follow', 'message', 'notification'
  ];
  
  return commonWords.includes(word.toLowerCase());
}

/**
 * Detecta possível conteúdo sensível na página
 * @returns {Object} Informações sobre o conteúdo sensível
 */
function detectSensitiveContent() {
  // Obter texto da página
  const pageText = document.body.innerText + ' ' + document.title + ' ' + window.location.href;
  
  const result = {
    isSensitive: false,
    categories: [],
    level: 'none',
    matches: []
  };
  
  // Aplicar cada padrão
  CONFIG.sensitivePatterns.forEach(({ pattern, category, level }) => {
    pattern.lastIndex = 0;
    
    if (pattern.test(pageText)) {
      result.isSensitive = true;
      
      if (!result.categories.includes(category)) {
        result.categories.push(category);
      }
      
      // Atualizar nível (high > medium > low)
      if (level === 'high' || (level === 'medium' && result.level !== 'high')) {
        result.level = level;
      }
      
      // Registrar correspondências
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(pageText)) !== null) {
        if (match[0]) {
          result.matches.push(match[0]);
        }
      }
    }
  });
  
  return result;
}

/**
 * Envia mensagem para o background script
 * @param {Object} message - Mensagem a enviar
 * @returns {Promise} Promessa com a resposta
 */
function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    try {
      browser.runtime.sendMessage(message)
        .then(response => {
          if (response && response.status === 'success') {
            resolve(response);
          } else if (response && response.status === 'error') {
            reject(new Error(response.error || 'Erro desconhecido'));
          } else {
            resolve(response);
          }
        })
        .catch(error => {
          // Ignorar erros de conexão - podem ocorrer quando o background não está pronto
          logDebug('Erro ao enviar mensagem:', error);
          resolve({ status: 'error', error: error.message });
        });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Log condicional (apenas em modo debug)
 */
function logDebug(...args) {
  if (CONFIG.debug) {
    console.log('[DeepAlias Content]', ...args);
  }
}

// Iniciar o content script
initialize();