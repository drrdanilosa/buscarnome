/**
 * Utilidade para gerenciar conexões persistentes entre scripts
 * @author drrdanilosa
 * @date 2025-06-03
 */

class ConnectionManager {
    constructor() {
        this.connections = new Map();
        this.isBackground = (browser.runtime.getBackgroundPage !== undefined);
        
        // No background script, configurar listener para conexões
        if (this.isBackground) {
            this.setupConnectionListener();
        }
    }
    
    // Configurar listener no background script
    setupConnectionListener() {
        browser.runtime.onConnect.addListener(port => {
            console.log(`[Connection] Nova conexão estabelecida: ${port.name}`);
            
            // Armazenar a conexão
            this.connections.set(port.name, port);
            
            // Configurar listener para mensagens
            port.onMessage.addListener(message => {
                this.handlePortMessage(port, message);
            });
            
            // Configurar listener para desconexão
            port.onDisconnect.addListener(() => {
                console.log(`[Connection] Conexão encerrada: ${port.name}`);
                this.connections.delete(port.name);
            });
        });
    }
    
    // Estabelecer conexão a partir do content script
    connect(name) {
        if (this.isBackground) {
            console.warn('[Connection] Background não pode iniciar conexões');
            return null;
        }
        
        try {
            const port = browser.runtime.connect({ name });
            
            // Configurar handlers para eventos de conexão
            port.onDisconnect.addListener(() => {
                console.log(`[Connection] Desconectado de ${name}`);
                
                // Tentar reconectar automaticamente após desconexão
                setTimeout(() => this.connect(name), 1000);
            });
            
            return port;
        } catch (error) {
            console.error('[Connection] Erro ao estabelecer conexão:', error);
            return null;
        }
    }
    
    // Enviar mensagem através de uma conexão
    sendMessage(portOrName, message) {
        try {
            let port;
            
            if (typeof portOrName === 'string') {
                // Se for uma string, buscar a conexão pelo nome
                port = this.isBackground ? 
                    this.connections.get(portOrName) : 
                    this.connect(portOrName);
            } else {
                // Se não for string, assumir que é o objeto port
                port = portOrName;
            }
            
            if (!port) {
                throw new Error(`Conexão não encontrada: ${portOrName}`);
            }
            
            port.postMessage(message);
            return true;
        } catch (error) {
            console.error('[Connection] Erro ao enviar mensagem:', error);
            return false;
        }
    }
    
    // Manipular mensagens recebidas via port
    handlePortMessage(port, message) {
        console.log(`[Connection] Mensagem recebida via port ${port.name}:`, message);
        
        // Implementar lógica de processamento de mensagens aqui
        // Exemplo: encaminhar para o handler principal de mensagens
        
        // Enviar confirmação
        try {
            port.postMessage({ 
                type: 'ack',
                originalMessageType: message.type,
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            console.warn('[Connection] Não foi possível enviar confirmação:', e);
        }
    }
}

// Exportar para uso em outros scripts
const connectionManager = new ConnectionManager();

// Para uso no contexto global
if (typeof window !== 'undefined') {
    window.ConnectionManager = connectionManager;
}