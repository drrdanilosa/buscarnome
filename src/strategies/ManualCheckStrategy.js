/**
 * Manual Check Strategy - Estratégia para verificação manual de plataformas
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';

const logger = new Logger({ level: 'info' });

export class ManualCheckStrategy {
  /**
   * Verifica se um username existe em uma plataforma
   * @param {string} username - Username a verificar
   * @param {object} platform - Definição da plataforma
   * @param {object} options - Opções adicionais
   * @returns {Promise<object>} - Resultado da verificação
   */
  async check(username, platform, options = {}) {
    logger.debug(`Verificação manual para ${username} em ${platform.name}`);
    
    try {
      const url = this._buildProfileUrl(username, platform);
      
      // Para verificação manual, usamos uma abordagem mais robusta com headers adequados e timeout maior
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': 'https://www.google.com/'
        },
        timeout: 30000, // 30 segundos de timeout para sites lentos
        redirect: 'follow'
      });
      
      // Verificar se a resposta é válida
      if (response.ok) {
        // Para verificação manual, precisamos analisar o conteúdo
        const content = await response.text();
        
        // Verificar se o conteúdo contém mensagens de erro ou indicadores de não existência
        const errorPatterns = [
          'not found', 'doesn\'t exist', 'no user', 'no profile', 
          'no results', '404', 'error', 'invalid', 'deleted',
          'não encontrado', 'não existe', 'sem resultados'
        ];
        
        const hasErrorPattern = errorPatterns.some(pattern => 
          content.toLowerCase().includes(pattern)
        );
        
        if (hasErrorPattern) {
          return {
            exists: false,
            url,
            message: 'Perfil provavelmente não existe (padrão de erro detectado)'
          };
        }
        
        // Verificar indicadores de sucesso
        const successPatterns = platform.successPatterns || [
          'profile', 'account', 'user', 'member', 'joined',
          'perfil', 'conta', 'usuário', 'membro', 'entrou'
        ];
        
        const hasSuccessPattern = successPatterns.some(pattern => 
          content.toLowerCase().includes(pattern)
        );
        
        if (hasSuccessPattern) {
          return {
            exists: true,
            url,
            message: 'Perfil provavelmente existe (padrão de sucesso detectado)',
            content: content.substring(0, 1000) // Armazenar um trecho do conteúdo
          };
        }
        
        // Se não houver indicadores claros, retornar resultado incerto
        return {
          exists: true, // Assumir que existe se a página carrega sem erros
          confidence: 'medium',
          url,
          message: 'Perfil pode existir (sem indicadores claros)'
        };
      } else {
        // Tratar diferentes códigos de status HTTP
        if (response.status === 404) {
          return {
            exists: false,
            url,
            message: 'Perfil não existe (404)'
          };
        } else if (response.status === 403) {
          return {
            exists: true, // Assumir que existe se o acesso é proibido
            confidence: 'medium',
            url,
            message: 'Acesso proibido, mas o perfil pode existir (403)'
          };
        } else {
          return {
            exists: false,
            url,
            message: `Código de status inesperado: ${response.status}`
          };
        }
      }
    } catch (error) {
      logger.warn(`Erro na verificação manual para ${username} em ${platform.name}`, error);
      
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
