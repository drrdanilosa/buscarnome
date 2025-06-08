/**
 * 🎯 TESTE FINAL COMPLETO - DEEPALIAS HUNTER PRO
 * Script de validação final para confirmar que a extensão está 100% funcional
 */

console.log('🎉 TESTE FINAL COMPLETO - DEEPALIAS HUNTER PRO');
console.log('=============================================');
console.log('Data:', new Date().toLocaleString('pt-BR'));

// Configurações do teste
const TESTE_CONFIG = {
    timeout: 8000,
    retries: 3,
    username_teste: 'admin', // Username para teste de busca
    delay_entre_testes: 500
};

// Contador de resultados
let resultados = {
    total: 0,
    sucesso: 0,
    falha: 0,
    detalhes: []
};

// Função auxiliar para delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função de log colorido
function logTeste(mensagem, tipo = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}]`;
    
    switch(tipo) {
        case 'success':
            console.log(`✅ ${prefix} ${mensagem}`);
            break;
        case 'error':
            console.error(`❌ ${prefix} ${mensagem}`);
            break;
        case 'warning':
            console.warn(`⚠️ ${prefix} ${mensagem}`);
            break;
        case 'info':
        default:
            console.log(`ℹ️ ${prefix} ${mensagem}`);
            break;
    }
}

// Função para registrar resultado
function registrarResultado(teste, sucesso, detalhes, tempo = 0) {
    resultados.total++;
    if (sucesso) {
        resultados.sucesso++;
        logTeste(`${teste} - SUCESSO (${tempo}ms): ${detalhes}`, 'success');
    } else {
        resultados.falha++;
        logTeste(`${teste} - FALHA: ${detalhes}`, 'error');
    }
    
    resultados.detalhes.push({
        teste,
        sucesso,
        detalhes,
        tempo: tempo || 0,
        timestamp: new Date().toISOString()
    });
}

// Função principal de teste
async function executarTestesCompletos() {
    logTeste('Iniciando bateria completa de testes...', 'info');
    
    try {
        // 1. TESTE DE CONTEXTO
        logTeste('📍 1/8 - Testando contexto...', 'info');
        await testeContexto();
        
        await delay(TESTE_CONFIG.delay_entre_testes);
        
        // 2. TESTE DE APIS
        logTeste('📡 2/8 - Testando APIs...', 'info');
        await testeAPIs();
        
        await delay(TESTE_CONFIG.delay_entre_testes);
        
        // 3. TESTE DE COMUNICAÇÃO BÁSICA
        logTeste('📞 3/8 - Testando comunicação básica...', 'info');
        await testeComunicacaoBasica();
        
        await delay(TESTE_CONFIG.delay_entre_testes);
        
        // 4. TESTE DE HEALTH CHECK
        logTeste('🏥 4/8 - Testando health check...', 'info');
        await testeHealthCheck();
        
        await delay(TESTE_CONFIG.delay_entre_testes);
        
        // 5. TESTE DE STORAGE
        logTeste('💾 5/8 - Testando storage...', 'info');
        await testeStorage();
        
        await delay(TESTE_CONFIG.delay_entre_testes);
        
        // 6. TESTE DE CONFIGURAÇÕES
        logTeste('⚙️ 6/8 - Testando configurações...', 'info');
        await testeConfiguracoes();
        
        await delay(TESTE_CONFIG.delay_entre_testes);
        
        // 7. TESTE DE PLATAFORMAS
        logTeste('🌐 7/8 - Testando plataformas...', 'info');
        await testePlataformas();
        
        await delay(TESTE_CONFIG.delay_entre_testes);
        
        // 8. TESTE DE BUSCA REAL
        logTeste('🔍 8/8 - Testando busca real...', 'info');
        await testeBuscaReal();
        
    } catch (error) {
        registrarResultado('ERRO GERAL', false, error.message);
    }
    
    // Exibir relatório final
    exibirRelatorioFinal();
}

// Testes individuais
async function testeContexto() {
    const inicio = performance.now();
    
    try {
        const url = window.location.href;
        const protocol = window.location.protocol;
        const contextoCorreto = protocol === 'moz-extension:' || protocol === 'chrome-extension:';
        
        if (contextoCorreto) {
            const tempo = Math.round(performance.now() - inicio);
            registrarResultado('Contexto', true, `Protocolo: ${protocol}`, tempo);
        } else {
            registrarResultado('Contexto', false, `Protocolo incorreto: ${protocol}. Use moz-extension://`);
        }
        
    } catch (error) {
        registrarResultado('Contexto', false, error.message);
    }
}

async function testeAPIs() {
    const inicio = performance.now();
    
    try {
        const browserAPI = typeof browser !== 'undefined' ? browser : 
                          typeof chrome !== 'undefined' ? chrome : null;
        
        if (!browserAPI) {
            registrarResultado('APIs', false, 'Browser APIs não disponíveis');
            return;
        }
        
        const apis = {
            runtime: !!browserAPI.runtime,
            storage: !!browserAPI.storage,
            tabs: !!browserAPI.tabs
        };
        
        const apisDisponiveis = Object.values(apis).filter(Boolean).length;
        const tempo = Math.round(performance.now() - inicio);
        
        if (apisDisponiveis >= 2) {
            registrarResultado('APIs', true, `${apisDisponiveis}/3 APIs disponíveis`, tempo);
        } else {
            registrarResultado('APIs', false, `Apenas ${apisDisponiveis}/3 APIs disponíveis`);
        }
        
    } catch (error) {
        registrarResultado('APIs', false, error.message);
    }
}

async function testeComunicacaoBasica() {
    const inicio = performance.now();
    
    try {
        const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
        
        const response = await Promise.race([
            browserAPI.runtime.sendMessage({ 
                type: 'ping', 
                timestamp: Date.now(),
                source: 'teste-final'
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), TESTE_CONFIG.timeout)
            )
        ]);
        
        const tempo = Math.round(performance.now() - inicio);
        
        if (response && response.pong) {
            registrarResultado('Comunicação Básica', true, `PONG recebido: ${response.pong}`, tempo);
        } else {
            registrarResultado('Comunicação Básica', false, 'Resposta inválida do background');
        }
        
    } catch (error) {
        registrarResultado('Comunicação Básica', false, error.message);
    }
}

async function testeHealthCheck() {
    const inicio = performance.now();
    
    try {
        const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
        
        const response = await browserAPI.runtime.sendMessage({ type: 'health-check' });
        const tempo = Math.round(performance.now() - inicio);
        
        if (response && response.status === 'healthy') {
            const services = response.services || {};
            const servicesAtivos = Object.values(services).filter(Boolean).length;
            registrarResultado('Health Check', true, `Status: ${response.status}, ${servicesAtivos} serviços ativos`, tempo);
        } else {
            registrarResultado('Health Check', false, 'Status não healthy ou resposta inválida');
        }
        
    } catch (error) {
        registrarResultado('Health Check', false, error.message);
    }
}

async function testeStorage() {
    const inicio = performance.now();
    
    try {
        const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
        
        // Teste de escrita
        const testData = { 
            testFlag: true, 
            timestamp: Date.now(),
            testId: 'final-validation'
        };
        
        const saveResponse = await browserAPI.runtime.sendMessage({ 
            type: 'saveSettings', 
            settings: testData 
        });
        
        if (!saveResponse || !saveResponse.success) {
            registrarResultado('Storage', false, 'Falha ao salvar configurações de teste');
            return;
        }
        
        // Teste de leitura
        const loadResponse = await browserAPI.runtime.sendMessage({ type: 'getSettings' });
        const tempo = Math.round(performance.now() - inicio);
        
        if (loadResponse && loadResponse.success && loadResponse.settings) {
            const configsCount = Object.keys(loadResponse.settings).length;
            registrarResultado('Storage', true, `${configsCount} configurações carregadas`, tempo);
        } else {
            registrarResultado('Storage', false, 'Falha ao carregar configurações');
        }
        
    } catch (error) {
        registrarResultado('Storage', false, error.message);
    }
}

async function testeConfiguracoes() {
    const inicio = performance.now();
    
    try {
        const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
        
        const response = await browserAPI.runtime.sendMessage({ type: 'getSettings' });
        const tempo = Math.round(performance.now() - inicio);
        
        if (response && response.success && response.settings) {
            const settings = response.settings;
            const hasRequired = 'includeAdult' in settings && 'includeTor' in settings;
            
            if (hasRequired) {
                registrarResultado('Configurações', true, 'Configurações essenciais presentes', tempo);
            } else {
                registrarResultado('Configurações', false, 'Configurações essenciais ausentes');
            }
        } else {
            registrarResultado('Configurações', false, 'Falha ao acessar configurações');
        }
        
    } catch (error) {
        registrarResultado('Configurações', false, error.message);
    }
}

async function testePlataformas() {
    const inicio = performance.now();
    
    try {
        const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
        
        const response = await browserAPI.runtime.sendMessage({ type: 'debug-info' });
        const tempo = Math.round(performance.now() - inicio);
        
        if (response && response.debug) {
            const debug = response.debug;
            const platformsLoaded = debug.platformsLoaded || 0;
            const keywordsLoaded = debug.keywordsLoaded || 0;
            
            if (platformsLoaded >= 15 && keywordsLoaded >= 30) {
                registrarResultado('Plataformas', true, `${platformsLoaded} plataformas, ${keywordsLoaded} palavras-chave`, tempo);
            } else {
                registrarResultado('Plataformas', false, `Poucos dados: ${platformsLoaded} plataformas, ${keywordsLoaded} palavras-chave`);
            }
        } else {
            registrarResultado('Plataformas', false, 'Informações de debug não disponíveis');
        }
        
    } catch (error) {
        registrarResultado('Plataformas', false, error.message);
    }
}

async function testeBuscaReal() {
    const inicio = performance.now();
    
    try {
        const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
        
        // Simular busca por username
        const response = await browserAPI.runtime.sendMessage({ 
            type: 'search-username',
            username: TESTE_CONFIG.username_teste,
            options: {
                includeAdult: false,
                includeTor: false,
                maxVariations: 3
            }
        });
        
        const tempo = Math.round(performance.now() - inicio);
        
        if (response && response.success) {
            const results = response.results || [];
            registrarResultado('Busca Real', true, `Busca iniciada, ${results.length} resultados iniciais`, tempo);
        } else if (response && response.message && response.message.includes('iniciada')) {
            registrarResultado('Busca Real', true, 'Busca iniciada com sucesso (assíncrona)', tempo);
        } else {
            registrarResultado('Busca Real', false, 'Falha ao iniciar busca');
        }
        
    } catch (error) {
        registrarResultado('Busca Real', false, error.message);
    }
}

// Relatório final
function exibirRelatorioFinal() {
    const porcentagem = resultados.total > 0 ? Math.round((resultados.sucesso / resultados.total) * 100) : 0;
    
    console.log('\n🎯 RELATÓRIO FINAL DE TESTES');
    console.log('============================');
    console.log(`📊 Total de testes: ${resultados.total}`);
    console.log(`✅ Sucessos: ${resultados.sucesso}`);
    console.log(`❌ Falhas: ${resultados.falha}`);
    console.log(`📈 Taxa de sucesso: ${porcentagem}%`);
    console.log('');
    
    if (porcentagem >= 90) {
        console.log('🎉 EXTENSÃO 100% FUNCIONAL!');
        console.log('✅ Todos os sistemas operacionais');
        console.log('🚀 Pronta para uso em produção');
    } else if (porcentagem >= 70) {
        console.log('⚠️ EXTENSÃO FUNCIONAL COM RESSALVAS');
        console.log('💡 Alguns problemas menores detectados');
        console.log('📋 Revisão recomendada');
    } else {
        console.log('❌ EXTENSÃO COM PROBLEMAS GRAVES');
        console.log('🔧 Correções urgentes necessárias');
        console.log('📋 Consulte documentação');
    }
    
    console.log('\n📋 DETALHES DOS TESTES:');
    resultados.detalhes.forEach((resultado, index) => {
        const status = resultado.sucesso ? '✅' : '❌';
        console.log(`${status} ${index + 1}. ${resultado.teste}: ${resultado.detalhes} (${resultado.tempo}ms)`);
    });
    
    console.log('\n🏁 Teste finalizado:', new Date().toLocaleString('pt-BR'));
    
    return {
        porcentagem,
        detalhes: resultados.detalhes,
        sucesso: porcentagem >= 90
    };
}

// Executar testes automaticamente quando o script for carregado
if (typeof window !== 'undefined') {
    // Ambiente browser
    window.executarTestesCompletos = executarTestesCompletos;
    
    // Auto-executar se estivermos no contexto correto
    document.addEventListener('DOMContentLoaded', () => {
        const isCorrectContext = window.location.protocol === 'moz-extension:' || 
                                window.location.protocol === 'chrome-extension:';
        
        if (isCorrectContext) {
            logTeste('Contexto correto detectado, iniciando testes em 2 segundos...', 'info');
            setTimeout(executarTestesCompletos, 2000);
        } else {
            logTeste('Contexto incorreto detectado. Use: await executarTestesCompletos() manualmente', 'warning');
        }
    });
} else {
    // Ambiente Node.js
    console.log('💡 Para executar no browser: await executarTestesCompletos()');
}

console.log('✅ Script de teste final carregado');
console.log('💡 Função disponível: executarTestesCompletos()');
