/**
 * DeepAlias Hunter Pro - Service Worker Helper
 * @author drrdanilosa
 * @version 4.0.1
 * @date 2025-06-03
 */

// Este script funciona como uma ponte entre o page script e o service worker (futuro Manifest V3)

// Verificar se é possível registrar um service worker
function checkServiceWorkerSupport() {
    if ('serviceWorker' in navigator) {
        return true;
    }
    return false;
}

// Registrar o service worker
async function registerServiceWorker() {
    if (!checkServiceWorkerSupport()) {
        console.log('[ServiceWorker] Service Workers não são suportados neste navegador');
        return false;
    }
    
    try {
        const registration = await navigator.serviceWorker.register(
            '/src/background/sw.js', 
            { scope: '/src/background/' }
        );
        
        console.log('[ServiceWorker] Registrado com sucesso:', registration.scope);
        return true;
    } catch (error) {
        console.error('[ServiceWorker] Falha no registro:', error);
        return false;
    }
}

// Enviar mensagem para o service worker
function sendMessageToServiceWorker(message) {
    return new Promise((resolve, reject) => {
        if (!navigator.serviceWorker.controller) {
            reject(new Error('Service Worker não está controlando esta página'));
            return;
        }
        
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = event => {
            if (event.data.error) {
                reject(new Error(event.data.error));
            } else {
                resolve(event.data);
            }
        };
        
        navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
    });
}

// Inicializar quando o documento estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        registerServiceWorker();
    });
} else {
    registerServiceWorker();
}