/**
 * HttpStatusCheckStrategy - Estratégia aprimorada para verificação via status HTTP
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';

const logger = new Logger({ level: 'info' });

export class HttpStatusCheckStrategy {
  /**
   * Verifica se um username existe em uma plataforma usando requisições HTTP
   * @param {string} username - Username a verificar
   * @param {object} platform - Definição da plataforma
   * @param {object} options - Opções adicionais
   * @returns {Promise<object>} - Resultado da verificação
   */
  async check(username, platform, options = {}) {
    logger.debug(`Verificação HTTP para ${username} em ${platform.name}`);
    
    try {
      const url = this._buildProfileUrl(username, platform);
      
      // Usar método HEAD primeiro para verificação rápida
      const headResponse = await this._makeRequest(url, 'HEAD', platform);
      
      // Se o HEAD for bem-sucedido, o perfil provavelmente existe
      if (headResponse.ok) {
        return {
          exists: true,
          url,
          message: `Perfil existe (${headResponse.status})`
        };
      }
      
      // Se o HEAD falhar com 404, o perfil provavelmente não existe
      if (headResponse.status === 404) {
        return {
          exists: false,
          url,
          message: 'Perfil não existe (404)'
        };
      }
      
      // Para outros códigos, tentar com GET para verificação mais completa
      logger.debug(`HEAD falhou com ${headResponse.status}, tentando GET para ${url}`);
      const getResponse = await this._makeRequest(url, 'GET', platform);
      
      if (getResponse.ok) {
        return {
          exists: true,
          url,
          message: `Perfil existe (${getResponse.status})`
        };
      } else if (getResponse.status === 404) {
        return {
          exists: false,
          url,
          message: 'Perfil não existe (404)'
        };
      } else if (getResponse.status === 403) {
        // Alguns sites retornam 403 quando o perfil existe mas o acesso é restrito
        return {
          exists: true,
          confidence: 'medium',
          url,
          message: 'Acesso proibido, mas o perfil pode existir (403)'
        };
      } else {
        return {
          exists: false,
          url,
          message: `Código de status inesperado: ${getResponse.status}`
        };
      }
    } catch (error) {
      logger.warn(`Erro na verificação HTTP para ${username} em ${platform.name}`, error);
      
      // Tratar erros de timeout especificamente
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return {
          exists: false,
          url: this._buildProfileUrl(username, platform),
          message: 'Requisição expirou, a plataforma pode estar bloqueando verificações automatizadas'
        };
      }
      
      return {
        exists: false,
        url: this._buildProfileUrl(username, platform),
        message: `Erro: ${error.message}`
      };
    }
  }
  
  /**
   * Faz uma requisição HTTP com configurações otimizadas
   * @param {string} url - URL para requisição
   * @param {string} method - Método HTTP (HEAD ou GET)
   * @param {object} platform - Definição da plataforma
   * @returns {Promise<Response>} - Resposta HTTP
   */
  async _makeRequest(url, method, platform) {
    // Determinar timeout com base na plataforma
    let timeout = 15000; // 15 segundos padrão
    
    // Aumentar timeout para plataformas conhecidas por serem lentas
    if (platform.name.toLowerCase().includes('mega') || 
        url.includes('mega.nz') || 
        platform.name.toLowerCase().includes('forum')) {
      timeout = 30000; // 30 segundos para plataformas lentas
    }
    
    // Configurar headers realistas
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
    
    // Adicionar referer para evitar bloqueios
    if (method === 'GET') {
      headers['Referer'] = 'https://www.google.com/';
    }
    
    // Fazer a requisição com as configurações otimizadas
    return fetch(url, {
      method,
      headers,
      timeout,
      redirect: 'follow'
    });
  }
  
  /**
   * Constrói a URL do perfil para a plataforma
   * @param {string} username - Username a verificar
   * @param {object} platform - Definição da plataforma
   * @returns {string} - URL do perfil
   */
  _buildProfileUrl(username, platform) {
    if (!platform.urlFormat) {
      throw new Error(`Nenhum formato de URL definido para a plataforma: ${platform.name}`);
    }
    
    return platform.urlFormat.replace('{username}', encodeURIComponent(username));
  }
}
