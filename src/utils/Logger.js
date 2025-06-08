/**
 * Sistema de log para DeepAlias Hunter Pro
 * @author drrdanilosa
 * @version 1.0.0
 * @date 2025-06-03
 */

const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

// Configuração do nível de log (ajustar para produção)
const currentLogLevel = LogLevel.DEBUG;

// Prefixos para diferentes contextos
const CONTEXTS = {
    INIT: 'INIT',
    STORAGE: 'STORAGE',
    PLATFORM: 'PLATFORM',
    SEARCH: 'SEARCH',
    API: 'API',
    LISTENERS: 'LISTENERS',
    DEBUG: 'DEBUG',
    FIREFOX: 'FIREFOX'
};

/**
 * Log com formatação consistente
 * @param {string} context - Contexto do log
 * @param {number} level - Nível do log (LogLevel)
 * @param {string} message - Mensagem a ser registrada
 * @param {object} [data] - Dados adicionais (opcional)
 */
function logMessage(context, level, message, data = null) {
    if (level >= currentLogLevel) {
        const timestamp = new Date().toISOString();
        const prefix = `[${context}]`;
        
        const logData = data ? data : '';
        
        switch (level) {
            case LogLevel.DEBUG:
                console.log(prefix, message, logData);
                break;
            case LogLevel.INFO:
                console.info(prefix, message, logData);
                break;
            case LogLevel.WARN:
                console.warn(prefix, message, logData);
                break;
            case LogLevel.ERROR:
                console.error(prefix, message, logData);
                break;
        }
    }
}

// Wrapper para o formato DeepAlias
function logDeepAlias(level, message, data = null) {
    if (level >= currentLogLevel) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [DeepAlias]`;
        
        const logData = data ? data : '';
        
        switch (level) {
            case LogLevel.DEBUG:
                console.log(prefix, message, logData);
                break;
            case LogLevel.INFO:
                console.info(prefix, message, logData);
                break;
            case LogLevel.WARN:
                console.warn(prefix, message, logData);
                break;
            case LogLevel.ERROR:
                console.error(prefix, message, logData);
                break;
        }
    }
}

// Exportação para uso em outros arquivos
const Logger = {
    debug: (context, message, data) => logMessage(context, LogLevel.DEBUG, message, data),
    info: (context, message, data) => logMessage(context, LogLevel.INFO, message, data),
    warn: (context, message, data) => logMessage(context, LogLevel.WARN, message, data),
    error: (context, message, data) => logMessage(context, LogLevel.ERROR, message, data),
    
    deepAlias: {
        debug: (message, data) => logDeepAlias(LogLevel.DEBUG, message, data),
        info: (message, data) => logDeepAlias(LogLevel.INFO, message, data),
        warn: (message, data) => logDeepAlias(LogLevel.WARN, message, data),
        error: (message, data) => logDeepAlias(LogLevel.ERROR, message, data)
    },
    
    CONTEXTS: CONTEXTS,
    LogLevel: LogLevel
};

// Para uso no contexto global do background script
if (typeof window !== 'undefined') {
    window.Logger = Logger;
}