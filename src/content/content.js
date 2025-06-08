/**
 * DeepAlias Hunter Pro - Content Script
 * @author drrdanilosa
 * @version 5.0.0
 * @date 2025-06-04 04:09:35
 * @updated_by drrdanilosa
 */

// Evitar múltiplas inicializações
if (!window.deepAliasContentLoaded) {
  window.deepAliasContentLoaded = true;
  
  console.log('[CONTENT] DeepAlias Content Script carregado em:', window.location.href);
  
  // Notificar background que content script foi carregado
  browser.runtime.sendMessage({
    type: 'content:loaded',
    url: window.location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    domain: window.location.hostname
  }).then(response => {
    console.log('[CONTENT] Background respondeu:', response);
  }).catch(error => {
    console.warn('[CONTENT] Erro ao comunicar com background:', error);
  });
  
  // Listener para mensagens do background
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[CONTENT] Mensagem recebida do background:', message);
    
    try {
      switch (message.type || message.action) {
        case 'getSelectedText':
          const selectedText = window.getSelection().toString().trim();
          sendResponse({ 
            selectedText,
            url: window.location.href,
            title: document.title
          });
          break;
          
        case 'highlightText':
          if (message.text) {
            highlightTextOnPage(message.text);
            sendResponse({ status: 'highlighted', text: message.text });
          }
          break;
          
        case 'extractUsernames':
          const usernames = extractUsernamesFromPage();
          sendResponse({ 
            usernames,
            url: window.location.href,
            count: usernames.length
          });
          break;
          
        case 'ping':
          sendResponse({ 
            status: 'alive',
            url: window.location.href,
            timestamp: Date.now()
          });
          break;
          
        default:
          sendResponse({ 
            status: 'unknown_message',
            receivedType: message.type || message.action
          });
      }
    } catch (error) {
      console.error('[CONTENT] Erro ao processar mensagem:', error);
      sendResponse({ 
        status: 'error',
        message: error.message
      });
    }
    
    return true;
  });
  
  // Funções auxiliares
  
  /**
   * Destaca texto na página
   * @param {string} text - Texto a ser destacado
   */
  function highlightTextOnPage(text) {
    try {
      // Remover destaques anteriores
      removeHighlights();
      
      if (!text || text.length < 2) return;
      
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      const textNodes = [];
      let node;
      
      while (node = walker.nextNode()) {
        if (node.textContent.toLowerCase().includes(text.toLowerCase())) {
          textNodes.push(node);
        }
      }
      
      textNodes.forEach(textNode => {
        const parent = textNode.parentNode;
        if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') return;
        
        const regex = new RegExp(`(${text})`, 'gi');
        const highlightedText = textNode.textContent.replace(regex, '<mark class="deepalias-highlight">$1</mark>');
        
        if (highlightedText !== textNode.textContent) {
          const wrapper = document.createElement('span');
          wrapper.innerHTML = highlightedText;
          parent.replaceChild(wrapper, textNode);
        }
      });
      
      // Adicionar estilos para destaque
      addHighlightStyles();
      
    } catch (error) {
      console.error('[CONTENT] Erro ao destacar texto:', error);
    }
  }
  
  /**
   * Remove destaques da página
   */
  function removeHighlights() {
    const highlights = document.querySelectorAll('.deepalias-highlight');
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize();
    });
  }
  
  /**
   * Adiciona estilos para destaque
   */
  function addHighlightStyles() {
    if (document.getElementById('deepalias-highlight-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'deepalias-highlight-styles';
    style.textContent = `
      .deepalias-highlight {
        background-color: #ffff00 !important;
        color: #000 !important;
        padding: 2px 4px !important;
        border-radius: 2px !important;
        font-weight: bold !important;
        animation: deepalias-pulse 2s ease-in-out infinite alternate;
      }
      
      @keyframes deepalias-pulse {
        0% { background-color: #ffff00; }
        100% { background-color: #ffcc00; }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Extrai possíveis usernames da página
   * @returns {Array} Array de usernames encontrados
   */
  function extractUsernamesFromPage() {
    try {
      const usernames = new Set();
      
      // Padrões comuns de username
      const usernamePatterns = [
        /@([a-zA-Z0-9_.-]+)/g,           // @username
        /\/([a-zA-Z0-9_.-]{3,})\/?$/g,   // /username no final de URLs
        /user[\/=]([a-zA-Z0-9_.-]+)/gi,  // user/username ou user=username
        /profile[\/=]([a-zA-Z0-9_.-]+)/gi // profile/username
      ];
      
      const text = document.body.textContent;
      const links = document.querySelectorAll('a[href]');
      
      // Extrair de texto
      usernamePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const username = match[1];
          if (username && username.length >= 3 && username.length <= 30) {
            usernames.add(username);
          }
        }
      });
      
      // Extrair de links
      links.forEach(link => {
        const href = link.href;
        usernamePatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(href)) !== null) {
            const username = match[1];
            if (username && username.length >= 3 && username.length <= 30) {
              usernames.add(username);
            }
          }
        });
      });
      
      return Array.from(usernames).slice(0, 20); // Limitar a 20 usernames
      
    } catch (error) {
      console.error('[CONTENT] Erro ao extrair usernames:', error);
      return [];
    }
  }
  
  // Notificar que o content script está pronto
  setTimeout(() => {
    browser.runtime.sendMessage({
      type: 'contentScript:ready',
      url: window.location.href,
      timestamp: Date.now()
    }).catch(error => {
      console.warn('[CONTENT] Erro ao notificar que está pronto:', error);
    });
  }, 1000);
  
  console.log('[CONTENT] ✅ Content script inicializado com sucesso');
}