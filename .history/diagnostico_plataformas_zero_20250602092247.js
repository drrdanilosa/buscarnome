/**
 * Diagnóstico Específico: Problema "Plataformas verificadas: 0"
 * Script para identificar exatamente onde está falhando
 */

console.log('=== DIAGNÓSTICO: Plataformas verificadas: 0 ===');

// Polyfill
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

async function diagnosticarProblema() {
    console.log('\n1. VERIFICANDO API DO BROWSER...');
    if (!browserAPI) {
        console.error('❌ ERRO: API do browser não disponível!');
        return;
    }
    console.log('✅ API do browser disponível:', browserAPI.runtime ? 'Runtime OK' : 'Runtime FALHOU');

    console.log('\n2. TESTANDO COMUNICAÇÃO COM BACKGROUND...');
    
    // Teste 1: Ping básico
    try {
        const pingResult = await new Promise((resolve, reject) => {
            browserAPI.runtime.sendMessage({
                type: 'ping',
                data: { test: true }
            }, (response) => {
                if (browserAPI.runtime.lastError) {
                    reject(new Error(browserAPI.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
            
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });
        
        console.log('✅ Ping ao background:', pingResult);
    } catch (error) {
        console.error('❌ ERRO no ping:', error.message);
        return;
    }

    // Teste 2: Verificar serviços
    console.log('\n3. VERIFICANDO SERVIÇOS DO BACKGROUND...');
    try {
        const servicesResult = await new Promise((resolve, reject) => {
            browserAPI.runtime.sendMessage({
                type: 'checkServices'
            }, (response) => {
                if (browserAPI.runtime.lastError) {
                    reject(new Error(browserAPI.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
            
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });
        
        console.log('✅ Verificação de serviços:', servicesResult);
        
        if (servicesResult.success) {
            console.log('📊 DETALHES DOS SERVIÇOS:');
            console.log('- Platform Service inicializado:', servicesResult.services?.platformService || 'FALHOU');
            console.log('- Plataformas carregadas:', servicesResult.services?.platformCount || 0);
            console.log('- Search Engine inicializado:', servicesResult.services?.searchEngine || 'FALHOU');
            console.log('- Username Variator inicializado:', servicesResult.services?.usernameVariator || 'FALHOU');
            
            if (servicesResult.services?.platformCount === 0) {
                console.error('❌ PROBLEMA IDENTIFICADO: PlatformService retorna 0 plataformas!');
                console.log('🔍 Isso significa que o SimplePlatformService não está funcionando corretamente');
            }
        }
    } catch (error) {
        console.error('❌ ERRO ao verificar serviços:', error.message);
        return;
    }

    // Teste 3: Busca de teste
    console.log('\n4. TESTANDO BUSCA REAL...');
    try {
        const searchResult = await new Promise((resolve, reject) => {
            browserAPI.runtime.sendMessage({
                type: 'search',
                data: {
                    username: 'test_user',
                    options: {
                        includeAdult: false,
                        maxVariations: 2,
                        maxPlatforms: 5
                    }
                }
            }, (response) => {
                if (browserAPI.runtime.lastError) {
                    reject(new Error(browserAPI.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
            
            setTimeout(() => reject(new Error('Timeout')), 15000);
        });
        
        console.log('✅ Resultado da busca de teste:', searchResult);
        
        if (searchResult.success) {
            console.log('🔍 ID da busca:', searchResult.searchId);
            console.log('📊 Status inicial:', searchResult.results?.status || 'Não disponível');
            console.log('🎯 Plataformas totais:', searchResult.results?.platformsTotal || 0);
            
            if (searchResult.results?.platformsTotal === 0) {
                console.error('❌ CONFIRMADO: Problema está no SearchEngine.search()');
                console.log('💡 O SimplePlatformService.getAllPlatforms() está retornando array vazio');
            }
        }
    } catch (error) {
        console.error('❌ ERRO na busca de teste:', error.message);
    }

    console.log('\n=== FIM DO DIAGNÓSTICO ===');
}

// Executar diagnóstico
diagnosticarProblema().catch(console.error);
