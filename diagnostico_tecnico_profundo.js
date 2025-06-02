/**
 * DIAGNÓSTICO TÉCNICO PROFUNDO - DeepAlias Hunter Pro
 * Análise completa do problema de comunicação popup ↔ background
 * 
 * PROBLEMA IDENTIFICADO: "Plataformas verificadas: 0"
 * 
 * Este script testa todas as possíveis causas do problema:
 * 1. Inicialização do background script
 * 2. Instanciação dos serviços
 * 3. Comunicação popup ↔ background
 * 4. Execução do SimpleSearchEngine
 * 5. Funcionamento dos services (PlatformService, etc.)
 */

console.log('🔍 INICIANDO DIAGNÓSTICO TÉCNICO PROFUNDO');
console.log('===============================================');

// Função para testar comunicação direta com background
async function testBackgroundCommunication() {
    console.log('\n📡 TESTE 1: Comunicação com Background Script');
    console.log('---------------------------------------------');
    
    return new Promise((resolve) => {
        try {
            const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
            
            // Teste básico de ping
            browserAPI.runtime.sendMessage({
                type: 'ping'
            }, (response) => {
                if (browserAPI.runtime.lastError) {
                    console.error('❌ Erro na comunicação:', browserAPI.runtime.lastError);
                    resolve({ success: false, error: browserAPI.runtime.lastError.message });
                } else {
                    console.log('✅ Resposta do background:', response);
                    resolve({ success: true, response });
                }
            });
            
            // Timeout após 5 segundos
            setTimeout(() => {
                console.error('⏰ Timeout na comunicação com background');
                resolve({ success: false, error: 'Timeout' });
            }, 5000);
            
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            resolve({ success: false, error: error.message });
        }
    });
}

// Função para testar busca com logs detalhados
async function testSearchWithDetailedLogs() {
    console.log('\n🔍 TESTE 2: Busca com Logs Detalhados');
    console.log('------------------------------------');
    
    return new Promise((resolve) => {
        try {
            const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
            const testUsername = 'testuser123';
            
            console.log(`📝 Enviando busca para username: ${testUsername}`);
            
            browserAPI.runtime.sendMessage({
                type: 'search',
                username: testUsername,
                options: {
                    includeAdult: false,
                    maxPlatforms: 5
                }
            }, (response) => {
                if (browserAPI.runtime.lastError) {
                    console.error('❌ Erro na busca:', browserAPI.runtime.lastError);
                    resolve({ success: false, error: browserAPI.runtime.lastError.message });
                } else {
                    console.log('📊 Resposta da busca:', response);
                    
                    // Análise detalhada da resposta
                    if (response && response.success) {
                        console.log('✅ Busca iniciada com sucesso');
                        console.log('🆔 Search ID:', response.searchId);
                        console.log('📋 Dados da busca:', response.results);
                        
                        if (response.results) {
                            console.log('🏢 Plataformas Total:', response.results.platformsTotal);
                            console.log('✅ Plataformas Verificadas:', response.results.platformsChecked);
                            console.log('📈 Progresso:', response.results.progress);
                            console.log('🎯 Resultados:', response.results.results?.length || 0);
                        }
                    } else {
                        console.error('❌ Busca falhou:', response?.error || 'Erro desconhecido');
                    }
                    
                    resolve({ success: true, response });
                }
            });
            
            // Timeout após 10 segundos
            setTimeout(() => {
                console.error('⏰ Timeout na busca');
                resolve({ success: false, error: 'Timeout na busca' });
            }, 10000);
            
        } catch (error) {
            console.error('❌ Erro ao executar busca:', error);
            resolve({ success: false, error: error.message });
        }
    });
}

// Função para testar status da busca
async function testSearchStatus(searchId) {
    console.log('\n📊 TESTE 3: Status da Busca');
    console.log('---------------------------');
    
    if (!searchId) {
        console.log('⚠️ Sem Search ID para testar status');
        return { success: false, error: 'Sem Search ID' };
    }
    
    return new Promise((resolve) => {
        try {
            const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
            
            console.log(`🔍 Consultando status para Search ID: ${searchId}`);
            
            browserAPI.runtime.sendMessage({
                type: 'getStatus',
                searchId: searchId
            }, (response) => {
                if (browserAPI.runtime.lastError) {
                    console.error('❌ Erro ao obter status:', browserAPI.runtime.lastError);
                    resolve({ success: false, error: browserAPI.runtime.lastError.message });
                } else {
                    console.log('📊 Status da busca:', response);
                    
                    if (response && response.success && response.status) {
                        console.log('🆔 Search ID:', response.status.searchId);
                        console.log('📊 Status:', response.status.status);
                        console.log('📈 Progresso:', response.status.progress);
                        console.log('🏢 Plataformas Total:', response.status.platformsTotal);
                        console.log('✅ Plataformas Verificadas:', response.status.platformsChecked);
                        console.log('🎯 Resultados Encontrados:', response.status.resultsCount);
                        console.log('👤 Username:', response.status.username);
                    }
                    
                    resolve({ success: true, response });
                }
            });
            
            // Timeout após 5 segundos
            setTimeout(() => {
                console.error('⏰ Timeout ao obter status');
                resolve({ success: false, error: 'Timeout' });
            }, 5000);
            
        } catch (error) {
            console.error('❌ Erro ao obter status:', error);
            resolve({ success: false, error: error.message });
        }
    });
}

// Função para testar se o manifest está correto
function testManifestConfiguration() {
    console.log('\n📋 TESTE 4: Configuração do Manifest');
    console.log('------------------------------------');
    
    try {
        const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
        const manifest = browserAPI.runtime.getManifest();
        
        console.log('📄 Manifest Version:', manifest.manifest_version);
        console.log('📛 Nome:', manifest.name);
        console.log('🔢 Versão:', manifest.version);
        console.log('🔧 Background Script:', manifest.background?.scripts);
        console.log('🔑 Permissões:', manifest.permissions);
        
        // Verificar se há problemas conhecidos
        if (manifest.manifest_version === 2) {
            console.warn('⚠️ ATENÇÃO: Usando Manifest V2 (deprecado)');
            console.log('💡 SUGESTÃO: Considere migrar para Manifest V3');
        }
        
        if (!manifest.background?.scripts?.includes('src/background/background_simple.js')) {
            console.error('❌ Background script não encontrado no manifest');
            return { success: false, error: 'Background script não configurado' };
        }
        
        console.log('✅ Configuração do manifest aparenta estar correta');
        return { success: true, manifest };
        
    } catch (error) {
        console.error('❌ Erro ao verificar manifest:', error);
        return { success: false, error: error.message };
    }
}

// Função para verificar se os services estão funcionando
function testServicesAvailability() {
    console.log('\n🔧 TESTE 5: Disponibilidade dos Services');
    console.log('---------------------------------------');
    
    // Este teste só pode ser executado no contexto do background script
    // Vamos tentar uma abordagem indireta
    
    console.log('⚠️ Este teste precisa ser executado no contexto do background script');
    console.log('💡 Para testar: Abra o DevTools do background e execute:');
    console.log('   - console.log("Platform Service:", platformService.getAllPlatforms().length)');
    console.log('   - console.log("Username Variator:", usernameVariator.generateVariations("test"))');
    console.log('   - console.log("Search Engine:", searchEngine)');
    
    return { success: true, note: 'Teste manual necessário' };
}

// Função principal do diagnóstico
async function executarDiagnosticoCompleto() {
    console.log('🚀 EXECUTANDO DIAGNÓSTICO COMPLETO');
    console.log('==================================');
    
    const resultados = {
        timestamp: new Date().toISOString(),
        testes: {}
    };
    
    // Teste 1: Comunicação com Background
    console.log('\n🔄 Executando Teste 1...');
    resultados.testes.comunicacao = await testBackgroundCommunication();
    
    // Teste 2: Busca com logs detalhados
    console.log('\n🔄 Executando Teste 2...');
    const resultadoBusca = await testSearchWithDetailedLogs();
    resultados.testes.busca = resultadoBusca;
    
    // Teste 3: Status da busca (se tiver searchId)
    if (resultadoBusca.success && resultadoBusca.response?.searchId) {
        console.log('\n🔄 Executando Teste 3...');
        resultados.testes.status = await testSearchStatus(resultadoBusca.response.searchId);
    }
    
    // Teste 4: Configuração do Manifest
    console.log('\n🔄 Executando Teste 4...');
    resultados.testes.manifest = testManifestConfiguration();
    
    // Teste 5: Disponibilidade dos Services
    console.log('\n🔄 Executando Teste 5...');
    resultados.testes.services = testServicesAvailability();
    
    // Análise dos resultados
    console.log('\n📊 ANÁLISE DOS RESULTADOS');
    console.log('========================');
    
    console.log('🔍 Resumo dos testes:');
    Object.entries(resultados.testes).forEach(([nome, resultado]) => {
        const status = resultado.success ? '✅' : '❌';
        console.log(`${status} ${nome}: ${resultado.success ? 'OK' : resultado.error}`);
    });
    
    // Identificação de problemas
    console.log('\n🎯 PROBLEMAS IDENTIFICADOS:');
    console.log('===========================');
    
    if (!resultados.testes.comunicacao.success) {
        console.log('❌ CRÍTICO: Falha na comunicação com background script');
        console.log('💡 SOLUÇÃO: Verificar se a extensão está carregada corretamente');
    }
    
    if (!resultados.testes.busca.success) {
        console.log('❌ CRÍTICO: Falha na execução da busca');
        console.log('💡 SOLUÇÃO: Verificar implementação do handleSearch()');
    } else if (resultados.testes.busca.response?.results?.platformsTotal === 0) {
        console.log('❌ PROBLEMA IDENTIFICADO: platformsTotal = 0');
        console.log('💡 POSSÍVEL CAUSA: SimplePlatformService não está retornando plataformas');
        console.log('💡 SOLUÇÃO: Verificar getAllPlatforms() no SimplePlatformService');
    }
    
    console.log('\n🔧 PRÓXIMOS PASSOS RECOMENDADOS:');
    console.log('================================');
    console.log('1. Verificar logs do background script no DevTools');
    console.log('2. Testar manualmente os services no console do background');
    console.log('3. Verificar se há erros JavaScript silenciosos');
    console.log('4. Confirmar se a inicialização dos services está funcionando');
    
    return resultados;
}

// Auto-execução do diagnóstico
if (typeof window !== 'undefined') {
    // Execução no contexto da página (popup)
    window.executarDiagnostico = executarDiagnosticoCompleto;
    
    console.log('🎮 DIAGNÓSTICO CARREGADO');
    console.log('Para executar: executarDiagnostico()');
} else {
    // Execução no contexto do background
    executarDiagnosticoCompleto();
}
