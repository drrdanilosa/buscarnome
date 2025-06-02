/**
 * Integração Cross-Browser - Gerencia compatibilidade entre navegadores
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';

const logger = new Logger({ level: 'info' });

export class BrowserAdapter {
  constructor() {
    this.browserInfo = this._detectBrowser();
    this.isFirefox = this.browserInfo.name === 'firefox';
    this.isEdge = this.browserInfo.name === 'edge';
    this.isChrome = this.browserInfo.name === 'chrome';
    this.manifestVersion = this._detectManifestVersion();
    
    logger.info('BrowserAdapter inicializado', {
      browser: this.browserInfo.name,
      version: this.browserInfo.version,
      manifestVersion: this.manifestVersion
    });
  }

  /**
   * Detecta o navegador atual
   * @returns {object} - Informações do navegador
   */
  _detectBrowser() {
    const userAgent = navigator.userAgent;
    let name = 'unknown';
    let version = 'unknown';
    
    // Detectar Firefox
    if (userAgent.includes('Firefox/')) {
      name = 'firefox';
      const match = /Firefox\/([0-9.]+)/.exec(userAgent);
      if (match) {
        version = match[1];
      }
    }
    // Detectar Edge
    else if (userAgent.includes('Edg/')) {
      name = 'edge';
      const match = /Edg\/([0-9.]+)/.exec(userAgent);
      if (match) {
        version = match[1];
      }
    }
    // Detectar Chrome
    else if (userAgent.includes('Chrome/')) {
      name = 'chrome';
      const match = /Chrome\/([0-9.]+)/.exec(userAgent);
      if (match) {
        version = match[1];
      }
    }
    
    return { name, version };
  }

  /**
   * Detecta a versão do manifest
   * @returns {number} - Versão do manifest (2 ou 3)
   */
  _detectManifestVersion() {
    // Tentar obter a versão do manifest do objeto browser.runtime
    try {
      if (browser && browser.runtime && browser.runtime.getManifest) {
        const manifest = browser.runtime.getManifest();
        return manifest.manifest_version || 3;
      }
    } catch (e) {
      // Ignorar erro
    }
    
    // Tentar obter a versão do manifest usando a API apropriada
    try {
      // Usar detecção segura de browser
      const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : 
                        (typeof chrome !== 'undefined' && chrome.runtime) ? chrome : null;
      
      if (browserAPI && browserAPI.runtime && browserAPI.runtime.getManifest) {
        const manifest = browserAPI.runtime.getManifest();
        return manifest.manifest_version || 3;
      }
    } catch (e) {
      // Ignorar erro
    }
    
    // Inferir com base no navegador
    if (this.isFirefox) {
      return 2; // Firefox ainda suporta MV2 por padrão
    }
    
    return 3; // Padrão para Chrome e Edge
  }

  /**
   * Obtém o objeto de API do navegador (browser ou chrome)
   * @returns {object} - Objeto de API do navegador
   */
  getBrowserAPI() {
    // Verificar se o objeto browser está disponível (Firefox)
    if (typeof browser !== 'undefined') {
      return browser;
    }
    
    // Verificar se o objeto chrome está disponível (Chrome/Edge)
    if (typeof chrome !== 'undefined') {
      return chrome;
    }
    
    // Fallback para um objeto vazio
    logger.error('Nenhuma API de navegador detectada');
    return {};
  }

  /**
   * Envia uma mensagem de forma compatível com diferentes navegadores
   * @param {object} message - Mensagem a ser enviada
   * @returns {Promise} - Promessa com resposta
   */
  sendMessage(message) {
    const browserAPI = this.getBrowserAPI();
    
    if (!browserAPI.runtime) {
      return Promise.reject(new Error('API de runtime não disponível'));
    }
    
    // Firefox usa Promises nativamente
    if (this.isFirefox) {
      return browserAPI.runtime.sendMessage(message);
    }
    
    // Chrome/Edge requerem callback, converter para Promise
    return new Promise((resolve, reject) => {
      browserAPI.runtime.sendMessage(message, response => {
        const error = browserAPI.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Registra um listener de mensagens de forma compatível
   * @param {function} callback - Função de callback
   */
  addMessageListener(callback) {
    const browserAPI = this.getBrowserAPI();
    
    if (!browserAPI.runtime) {
      logger.error('API de runtime não disponível');
      return;
    }
    
    // Wrapper para garantir compatibilidade entre navegadores
    const wrappedCallback = (message, sender, sendResponse) => {
      // Firefox espera uma Promise
      if (this.isFirefox) {
        const response = callback(message, sender);
        return Promise.resolve(response);
      }
      
      // Chrome/Edge esperam que sendResponse seja chamado
      const response = callback(message, sender);
      sendResponse(response);
      return true; // Manter o canal de mensagem aberto
    };
    
    browserAPI.runtime.onMessage.addListener(wrappedCallback);
  }

  /**
   * Acessa o armazenamento de forma compatível
   * @param {string} area - Área de armazenamento ('local', 'sync', 'session')
   * @returns {object} - API de armazenamento
   */
  getStorage(area = 'local') {
    const browserAPI = this.getBrowserAPI();
    
    if (!browserAPI.storage) {
      logger.error('API de armazenamento não disponível');
      return {
        get: () => Promise.reject(new Error('API de armazenamento não disponível')),
        set: () => Promise.reject(new Error('API de armazenamento não disponível')),
        remove: () => Promise.reject(new Error('API de armazenamento não disponível'))
      };
    }
    
    const storage = browserAPI.storage[area];
    
    if (!storage) {
      logger.error(`Área de armazenamento '${area}' não disponível`);
      return {
        get: () => Promise.reject(new Error(`Área de armazenamento '${area}' não disponível`)),
        set: () => Promise.reject(new Error(`Área de armazenamento '${area}' não disponível`)),
        remove: () => Promise.reject(new Error(`Área de armazenamento '${area}' não disponível`))
      };
    }
    
    // Firefox usa Promises nativamente
    if (this.isFirefox) {
      return storage;
    }
    
    // Chrome/Edge requerem callback, converter para Promise
    return {
      get: keys => new Promise((resolve, reject) => {
        storage.get(keys, items => {
          const error = browserAPI.runtime.lastError;
          if (error) {
            reject(new Error(error.message));
          } else {
            resolve(items);
          }
        });
      }),
      
      set: items => new Promise((resolve, reject) => {
        storage.set(items, () => {
          const error = browserAPI.runtime.lastError;
          if (error) {
            reject(new Error(error.message));
          } else {
            resolve();
          }
        });
      }),
      
      remove: keys => new Promise((resolve, reject) => {
        storage.remove(keys, () => {
          const error = browserAPI.runtime.lastError;
          if (error) {
            reject(new Error(error.message));
          } else {
            resolve();
          }
        });
      })
    };
  }

  /**
   * Registra um listener de abas de forma compatível
   * @param {string} event - Nome do evento ('created', 'updated', 'removed', etc.)
   * @param {function} callback - Função de callback
   */
  addTabListener(event, callback) {
    const browserAPI = this.getBrowserAPI();
    
    if (!browserAPI.tabs) {
      logger.error('API de abas não disponível');
      return;
    }
    
    const eventName = `on${event.charAt(0).toUpperCase()}${event.slice(1)}`;
    
    if (!browserAPI.tabs[eventName]) {
      logger.error(`Evento de abas '${event}' não disponível`);
      return;
    }
    
    browserAPI.tabs[eventName].addListener(callback);
  }

  /**
   * Executa um script em uma aba de forma compatível
   * @param {number} tabId - ID da aba
   * @param {object} details - Detalhes do script
   * @returns {Promise} - Promessa com resultado
   */
  executeScript(tabId, details) {
    const browserAPI = this.getBrowserAPI();
    
    if (!browserAPI.tabs) {
      return Promise.reject(new Error('API de abas não disponível'));
    }
    
    // Manifest V3 usa scripting API
    if (this.manifestVersion >= 3 && browserAPI.scripting) {
      const scriptingDetails = {
        target: { tabId },
        files: details.file ? [details.file] : undefined,
        func: details.code ? new Function(details.code) : undefined
      };
      
      return browserAPI.scripting.executeScript(scriptingDetails);
    }
    
    // Manifest V2 usa tabs.executeScript
    if (this.isFirefox) {
      return browserAPI.tabs.executeScript(tabId, details);
    }
    
    // Chrome/Edge com MV2 requerem callback
    return new Promise((resolve, reject) => {
      browserAPI.tabs.executeScript(tabId, details, result => {
        const error = browserAPI.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Obtém informações sobre uma aba de forma compatível
   * @param {number} tabId - ID da aba
   * @returns {Promise} - Promessa com informações da aba
   */
  getTabInfo(tabId) {
    const browserAPI = this.getBrowserAPI();
    
    if (!browserAPI.tabs) {
      return Promise.reject(new Error('API de abas não disponível'));
    }
    
    if (this.isFirefox) {
      return browserAPI.tabs.get(tabId);
    }
    
    return new Promise((resolve, reject) => {
      browserAPI.tabs.get(tabId, tab => {
        const error = browserAPI.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
        } else {
          resolve(tab);
        }
      });
    });
  }

  /**
   * Cria uma notificação de forma compatível
   * @param {string} id - ID da notificação
   * @param {object} options - Opções da notificação
   * @returns {Promise} - Promessa com ID da notificação
   */
  createNotification(id, options) {
    const browserAPI = this.getBrowserAPI();
    
    if (!browserAPI.notifications) {
      return Promise.reject(new Error('API de notificações não disponível'));
    }
    
    if (this.isFirefox) {
      return browserAPI.notifications.create(id, options);
    }
    
    return new Promise((resolve, reject) => {
      browserAPI.notifications.create(id, options, notificationId => {
        const error = browserAPI.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
        } else {
          resolve(notificationId);
        }
      });
    });
  }

  /**
   * Obtém URL de um recurso da extensão de forma compatível
   * @param {string} path - Caminho do recurso
   * @returns {string} - URL do recurso
   */
  getExtensionURL(path) {
    const browserAPI = this.getBrowserAPI();
    
    if (browserAPI.runtime && browserAPI.runtime.getURL) {
      return browserAPI.runtime.getURL(path);
    }
    
    logger.error('Não foi possível obter URL da extensão');
    return path;
  }

  /**
   * Verifica se uma permissão está concedida de forma compatível
   * @param {string|Array<string>} permissions - Permissão ou lista de permissões
   * @returns {Promise<boolean>} - Promessa com resultado da verificação
   */
  hasPermission(permissions) {
    const browserAPI = this.getBrowserAPI();
    
    if (!browserAPI.permissions) {
      return Promise.reject(new Error('API de permissões não disponível'));
    }
    
    if (this.isFirefox) {
      return browserAPI.permissions.contains({ permissions });
    }
    
    return new Promise((resolve, reject) => {
      browserAPI.permissions.contains({ permissions }, result => {
        const error = browserAPI.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Solicita permissões adicionais de forma compatível
   * @param {string|Array<string>} permissions - Permissão ou lista de permissões
   * @returns {Promise<boolean>} - Promessa com resultado da solicitação
   */
  requestPermission(permissions) {
    const browserAPI = this.getBrowserAPI();
    
    if (!browserAPI.permissions) {
      return Promise.reject(new Error('API de permissões não disponível'));
    }
    
    if (this.isFirefox) {
      return browserAPI.permissions.request({ permissions });
    }
    
    return new Promise((resolve, reject) => {
      browserAPI.permissions.request({ permissions }, result => {
        const error = browserAPI.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Obtém informações sobre a extensão de forma compatível
   * @returns {object} - Informações da extensão
   */
  getExtensionInfo() {
    const browserAPI = this.getBrowserAPI();
    
    try {
      if (browserAPI.runtime && browserAPI.runtime.getManifest) {
        const manifest = browserAPI.runtime.getManifest();
        return {
          id: browserAPI.runtime.id,
          version: manifest.version,
          name: manifest.name,
          description: manifest.description,
          manifestVersion: manifest.manifest_version
        };
      }
    } catch (e) {
      logger.error('Erro ao obter informações da extensão', e);
    }
    
    return {
      id: 'unknown',
      version: 'unknown',
      name: 'DeepAlias Hunter Pro',
      description: 'Ferramenta de busca OSINT avançada',
      manifestVersion: this.manifestVersion
    };
  }
}
