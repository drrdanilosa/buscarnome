// ✅ DEBUG INTERNO COM DETECÇÃO DE CONTEXTO
// Verifica automaticamente se estamos no contexto privilegiado da extensão

console.log('🔧 Debug interno carregando...');
console.log('URL atual:', window.location.href);
console.log('Contexto:', window.location.protocol);

// Verificação de contexto privilegiado
const isPrivilegedContext = window.location.protocol === 'moz-extension:' || 
                          window.location.protocol === 'chrome-extension:';

if (!isPrivilegedContext) {
    console.error('❌ CONTEXTO INCORRETO DETECTADO!');
    console.error('URL atual:', window.location.href);
    console.error('Protocolo:', window.location.protocol);
    console.error('⚠️ As APIs da extensão não estarão disponíveis neste contexto');
    
    // Mostrar aviso na página
    document.addEventListener('DOMContentLoaded', () => {
        const body = document.body;
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff4444;
            color: white;
            padding: 15px;
            font-weight: bold;
            text-align: center;
            z-index: 9999;
            border-bottom: 3px solid #cc0000;
        `;
        warning.innerHTML = `
            ❌ CONTEXTO INCORRETO! Esta página deve ser acessada via moz-extension:// 
            <br>📋 Siga o GUIA_CONTEXTO_CORRETO.md para resolver este problema
        `;
        body.insertBefore(warning, body.firstChild);
    });
}

// Acesso direto às APIs do browser (contexto privilegiado)
const browserAPI = (typeof browser !== 'undefined' ? browser : 
                   typeof chrome !== 'undefined' ? chrome : null);
const isFirefox = typeof browser !== 'undefined';

const logsContainer = document.getElementById('logs');
const resultsContainer = document.getElementById('test-results');
let testCounter = 0;

// Sistema de logging
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.style.marginBottom = '8px';
    logEntry.style.padding = '5px';
    logEntry.style.borderLeft = '3px solid';
    
    const colors = {
        'error': { text: '#ff6b6b', border: '#ff1744' },
        'success': { text: '#51cf66', border: '#00e676' },
        'warning': { text: '#ffd43b', border: '#ffc107' },
        'info': { text: '#74c0fc', border: '#2196f3' },
        'debug': { text: '#a78bfa', border: '#7c4dff' }
    };
    
    const color = colors[type] || colors.info;
    logEntry.style.color = color.text;
    logEntry.style.borderColor = color.border;
    
    logEntry.innerHTML = `<strong>[${timestamp}]</strong> ${message}`;
    logsContainer.appendChild(logEntry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
    
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Adicionar resultado de teste
function addTestResult(title, success, details, duration) {
    testCounter++;
    const result = document.createElement('div');
    result.className = `test-result ${success ? 'success' : 'error'}`;
    result.innerHTML = `
        <div class="test-result-header">
            <strong>#${testCounter} ${title}</strong>
            <span class="test-duration">${duration}ms</span>
        </div>
        <div class="test-result-details">${details}</div>
    `;
    resultsContainer.appendChild(result);
}

// Função de comunicação aprimorada para contexto privilegiado
async function sendInternalMessage(message, timeout = 8000) {
    // Verificar se estamos no contexto correto
    if (!isPrivilegedContext) {
        throw new Error('Contexto incorreto: deve estar em moz-extension:// ou chrome-extension://');
    }
    
    // Verificar se as APIs estão disponíveis
    if (!browserAPI) {
        throw new Error('API do browser não disponível - verifique o contexto da página');
    }
    
    log(`📤 Enviando mensagem interna: ${JSON.stringify(message)}`, 'info');
    
    const start = performance.now();
    
    try {
        let response;
        
        if (isFirefox) {
            // Firefox - Promise nativo
            response = await Promise.race([
                browserAPI.runtime.sendMessage(message),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout interno (Firefox)')), timeout)
                )
            ]);
        } else {
            // Chrome/Edge - Callback
            response = await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error('Timeout interno (Chrome/Edge)'));
                }, timeout);
                
                browserAPI.runtime.sendMessage(message, (response) => {
                    clearTimeout(timeoutId);
                    if (browserAPI.runtime.lastError) {
                        reject(new Error(browserAPI.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                });
            });
        }
        
        const duration = Math.round(performance.now() - start);
        log(`📥 Resposta recebida em ${duration}ms: ${JSON.stringify(response)}`, 'success');
        
        return { response, duration };
        
    } catch (error) {
        const duration = Math.round(performance.now() - start);
        log(`❌ Erro na comunicação interna: ${error.message}`, 'error');
        throw { error, duration };
    }
}

// Testes específicos
async function testarPing() {
    log('🔄 Teste de ping interno...', 'info');
    
    try {
        const { response, duration } = await sendInternalMessage({ 
            type: 'ping', 
            timestamp: Date.now(),
            source: 'internal-debug'
        });
        
        addTestResult('Ping Interno', true, `PONG: ${response.pong} | Browser: ${response.browser}`, duration);
    } catch ({ error, duration }) {
        addTestResult('Ping Interno', false, `Erro: ${error.message}`, duration);
    }
}

async function testarHealthCheck() {
    log('🔄 Health check interno...', 'info');
    
    try {
        const { response, duration } = await sendInternalMessage({ type: 'health-check' });
        
        const services = response.services || {};
        const servicesList = Object.entries(services).map(([k, v]) => `${k}: ${v ? '✅' : '❌'}`).join(', ');
        addTestResult('Health Check', true, `Status: ${response.status} | Serviços: ${servicesList}`, duration);
    } catch ({ error, duration }) {
        addTestResult('Health Check', false, `Erro: ${error.message}`, duration);
    }
}

async function testarGetSettings() {
    log('🔄 Teste getSettings interno...', 'info');
    
    try {
        const { response, duration } = await sendInternalMessage({ type: 'getSettings' });
        
        const settingsCount = Object.keys(response.settings || {}).length;
        addTestResult('GetSettings', true, `Success: ${response.success} | ${settingsCount} configurações carregadas`, duration);
    } catch ({ error, duration }) {
        addTestResult('GetSettings', false, `Erro: ${error.message}`, duration);
    }
}

async function testarSaveSettings() {
    log('🔄 Teste saveSettings interno...', 'info');
    
    const testSettings = {
        includeAdult: false,
        includeTor: true,
        maxVariations: 3,
        priorityCategories: ['social', 'gaming'],
        testFlag: true,
        debugMode: true
    };
    
    try {
        const { response, duration } = await sendInternalMessage({ 
            type: 'saveSettings', 
            settings: testSettings 
        });
        
        addTestResult('SaveSettings', true, `Configurações salvas: ${response.success}`, duration);
    } catch ({ error, duration }) {
        addTestResult('SaveSettings', false, `Erro: ${error.message}`, duration);
    }
}

async function testarDebugInfo() {
    log('🔄 Teste debug info interno...', 'info');
    
    try {
        const { response, duration } = await sendInternalMessage({ type: 'debug-info' });
        
        const debug = response.debug || {};
        addTestResult('Debug Info', true, `Browser: ${debug.browser} | Services: ${debug.servicesInitialized ? '✅' : '❌'} | Runtime: ${debug.runtimeId}`, duration);
    } catch ({ error, duration }) {
        addTestResult('Debug Info', false, `Erro: ${error.message}`, duration);
    }
}

async function testarStatus() {
    log('🔄 Teste status interno...', 'info');
    
    try {
        const { response, duration } = await sendInternalMessage({ type: 'status' });
        
        addTestResult('Status', true, `Status: ${response.status} | Versão: ${response.version}`, duration);
    } catch ({ error, duration }) {
        addTestResult('Status', false, `Erro: ${error.message}`, duration);
    }
}

async function testarCarga() {
    log('🔄 Teste de carga interno (5 mensagens simultâneas)...', 'info');
    
    try {
        const mensagens = Array.from({ length: 5 }, (_, i) => ({
            type: 'ping',
            id: i + 1,
            batch: 'internal-load-test'
        }));
        
        const start = performance.now();
        const promises = mensagens.map(msg => sendInternalMessage(msg));
        const results = await Promise.all(promises);
        const duration = Math.round(performance.now() - start);
        
        addTestResult('Teste de Carga', true, `${results.length}/5 mensagens processadas com sucesso`, duration);
    } catch (error) {
        addTestResult('Teste de Carga', false, `Erro: ${error.message}`, 0);
    }
}

async function testarTudo() {
    log('🚀 Executando bateria completa de testes internos...', 'info');
    limparResultados();
    
    const testes = [
        testarPing,
        testarHealthCheck,
        testarGetSettings,
        testarSaveSettings,
        testarDebugInfo,
        testarStatus,
        testarCarga
    ];
    
    for (let i = 0; i < testes.length; i++) {
        await testes[i]();
        if (i < testes.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
    
    log('✅ Bateria completa de testes concluída!', 'success');
}

function limparResultados() {
    resultsContainer.innerHTML = '';
    logsContainer.innerHTML = '<span class="log-init">🗑️ Logs limpos...</span>';
    testCounter = 0;
    log('Resultados limpos', 'info');
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    const environmentInfo = document.getElementById('environment-info');
    
    try {
        const url = window.location.href;
        const protocol = window.location.protocol;
        
        // Verificação detalhada de contexto
        const contextCheck = {
            isPrivileged: isPrivilegedContext,
            protocol: protocol,
            apiAvailable: !!browserAPI,
            browserType: isFirefox ? 'Firefox' : 'Chrome/Edge'
        };
        
        if (browserAPI && isPrivilegedContext) {
            const manifest = browserAPI.runtime.getManifest();
            const runtimeId = browserAPI.runtime.id;
            
            environmentInfo.innerHTML = `
                <strong>🌐 Ambiente:</strong> ${contextCheck.browserType}<br>
                <strong>📍 URL:</strong> ${url}<br>
                <strong>🔧 Protocolo:</strong> ${protocol}<br>
                <strong>🆔 Runtime ID:</strong> ${runtimeId}<br>
                <strong>📋 Manifest:</strong> v${manifest.manifest_version}<br>
                <strong>🔢 Versão da Extensão:</strong> ${manifest.version}<br>
                <strong>📡 APIs Disponíveis:</strong> ${browserAPI.runtime ? '✅' : '❌'} Runtime, ${browserAPI.storage ? '✅' : '❌'} Storage<br>
                <strong>🔧 Contexto:</strong> ${contextCheck.isPrivileged ? 'Privilegiado ✅' : 'Limitado ❌'}<br>
                <strong>💾 Storage API:</strong> ${browserAPI.storage ? '✅ Disponível' : '❌ Indisponível'}
            `;
            environmentInfo.className = 'test-result success';
            
            log(`✅ Ambiente carregado: ${manifest.name} v${manifest.version}`, 'success');
            log(`🔧 Contexto privilegiado: SIM`, 'success');
            
        } else {
            // APIs não disponíveis ou contexto incorreto
            environmentInfo.innerHTML = `
                <strong>❌ CONTEXTO INCORRETO DETECTADO!</strong><br>
                <strong>📍 URL Atual:</strong> ${url}<br>
                <strong>🔧 Protocolo:</strong> ${protocol}<br>
                <strong>📡 APIs da Extensão:</strong> ❌ ${browserAPI ? 'Disponíveis mas limitadas' : 'Não disponíveis'}<br>
                <strong>🌐 Contexto:</strong> ❌ Não privilegiado<br>
                <br>
                <strong>💡 SOLUÇÃO:</strong><br>
                1. Vá para <code>about:debugging#/runtime/this-firefox</code><br>
                2. Encontre "DeepAlias Hunter Pro"<br>
                3. Clique em "Inspecionar"<br>
                4. Modifique a URL para: <code>moz-extension://[ID]/src/debug/debug_interno.html</code><br>
                <br>
                <strong>📋 Consulte:</strong> GUIA_CONTEXTO_CORRETO.md
            `;
            environmentInfo.className = 'test-result error';
            
            log('❌ Contexto incorreto ou APIs limitadas', 'error');
            log(`📍 URL atual: ${url}`, 'error');
            log(`🔧 Protocolo: ${protocol}`, 'error');
            log('💡 Solução: Acesse via moz-extension:// (consulte GUIA_CONTEXTO_CORRETO.md)', 'warning');
        }
        
    } catch (error) {
        environmentInfo.innerHTML = `
            <strong>❌ Erro ao carregar informações do ambiente:</strong><br>
            ${error.message}<br>
            <br>
            <strong>💡 Possíveis causas:</strong><br>
            • Contexto incorreto (não moz-extension://)<br>
            • APIs da extensão não disponíveis<br>
            • Extensão não carregada corretamente<br>
            <br>
            <strong>📋 Consulte:</strong> GUIA_CONTEXTO_CORRETO.md
        `;
        environmentInfo.className = 'test-result error';
        log(`❌ Erro na inicialização: ${error.message}`, 'error');
    }

    // Adicionar event listeners para todos os botões de teste
    if (browserAPI && isPrivilegedContext) {
        // Event listeners só funcionam no contexto correto
        document.getElementById('btn-ping').addEventListener('click', testarPing);
        document.getElementById('btn-health').addEventListener('click', testarHealthCheck);
        document.getElementById('btn-settings').addEventListener('click', testarGetSettings);
        document.getElementById('btn-save').addEventListener('click', testarSaveSettings);
        document.getElementById('btn-debug').addEventListener('click', testarDebugInfo);
        document.getElementById('btn-status').addEventListener('click', testarStatus);
        document.getElementById('btn-carga').addEventListener('click', testarCarga);
        document.getElementById('btn-todos').addEventListener('click', testarTudo);
        document.getElementById('btn-limpar').addEventListener('click', limparResultados);
        
        log('🎯 Event listeners configurados para todos os botões', 'success');
    } else {
        // Desabilitar botões no contexto incorreto
        const buttons = ['btn-ping', 'btn-health', 'btn-settings', 'btn-save', 'btn-debug', 'btn-status', 'btn-carga', 'btn-todos'];
        buttons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = true;
                button.title = 'Indisponível - contexto incorreto';
                button.style.opacity = '0.5';
                button.addEventListener('click', () => {
                    alert('❌ Este botão não funciona fora do contexto moz-extension://\n\n📋 Consulte GUIA_CONTEXTO_CORRETO.md');
                });
            }
        });
        
        log('⚠️ Botões desabilitados devido ao contexto incorreto', 'warning');
    }
});
