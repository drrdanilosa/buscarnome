/**
 * 🔧 SCRIPT DE VERIFICAÇÃO FINAL - CORRECAO FIREFOX
 * 
 * Este script verifica se TODAS as correções foram aplicadas corretamente
 * e se a extensão DeepAlias Hunter Pro está funcionando no Firefox.
 */

console.log('🚀 === INICIANDO VERIFICAÇÃO FINAL DA CORREÇÃO ===');

// Verificação 1: API do Browser
console.log('\n1. 🔍 Verificando API do Browser...');
const isBrowserAPI = typeof browser !== 'undefined';
const isChromeAPI = typeof chrome !== 'undefined';

if (isBrowserAPI) {
    console.log('✅ Firefox API detectada (browser)');
    console.log(`   - Runtime: ${!!browser.runtime}`);
    console.log(`   - Messaging: ${!!browser.runtime?.sendMessage}`);
} else if (isChromeAPI) {
    console.log('✅ Chrome API detectada (chrome)');
    // Usar detecção segura para evitar erros no Firefox
    const chromeAPI = (typeof chrome !== 'undefined') ? chrome : null;
    console.log(`   - Runtime: ${!!(chromeAPI?.runtime)}`);
    console.log(`   - Messaging: ${!!(chromeAPI?.runtime?.sendMessage)}`);
} else {
    console.log('❌ ERRO: Nenhuma API de extensão detectada!');
    console.log('   💡 Execute este script dentro da extensão carregada');
}

// Verificação 2: Teste de Comunicação
console.log('\n2. 📨 Testando Comunicação...');

async function testCommunication() {
    const browserAPI = isBrowserAPI ? browser : (isChromeAPI ? chrome : null);
    
    if (!browserAPI) {
        console.log('❌ API não disponível para teste');
        return false;
    }
    
    try {
        console.log('   📤 Enviando ping...');
        const pingResponse = await browserAPI.runtime.sendMessage({
            type: 'ping',
            data: { timestamp: Date.now() }
        });
        
        if (pingResponse && pingResponse.success) {
            console.log('   ✅ Ping bem-sucedido!');
            console.log(`      - Pong: ${pingResponse.pong}`);
            console.log(`      - Browser API: ${pingResponse.browserAPI}`);
            console.log(`      - Services: ${JSON.stringify(pingResponse.services)}`);
            return true;
        } else {
            console.log('   ❌ Ping falhou:', pingResponse);
            return false;
        }
    } catch (error) {
        console.log('   ❌ Erro na comunicação:', error.message);
        return false;
    }
}

// Verificação 3: Teste dos Serviços
async function testServices() {
    const browserAPI = isBrowserAPI ? browser : (isChromeAPI ? chrome : null);
    
    if (!browserAPI) {
        console.log('❌ API não disponível para teste de serviços');
        return false;
    }
    
    try {
        console.log('   🔧 Verificando serviços...');
        const servicesResponse = await browserAPI.runtime.sendMessage({
            type: 'checkServices',
            data: {}
        });
        
        if (servicesResponse && servicesResponse.success) {
            console.log('   ✅ Serviços funcionando!');
            const { services } = servicesResponse;
            
            console.log(`      - Platform Service: ${services.platformService.available} (${services.platformService.platforms} plataformas)`);
            console.log(`        Plataformas: ${services.platformService.platformNames?.join(', ')}`);
            console.log(`      - Username Variator: ${services.usernameVariator.available} (${services.usernameVariator.variations} variações)`);
            console.log(`      - Platform Checker: ${services.platformChecker.available}`);
            console.log(`      - Search Engine: ${services.searchEngine.available} (searching: ${services.searchEngine.isSearching})`);
            console.log(`      - Storage Service: ${services.storageService.available}`);
            
            // Verificação crítica: plataformas
            if (services.platformService.platforms > 0) {
                console.log('   🎯 PROBLEMA RESOLVIDO! Plataformas carregadas corretamente!');
                return true;
            } else {
                console.log('   ❌ PROBLEMA PERSISTE! Nenhuma plataforma carregada!');
                return false;
            }
        } else {
            console.log('   ❌ Verificação de serviços falhou:', servicesResponse);
            return false;
        }
    } catch (error) {
        console.log('   ❌ Erro na verificação de serviços:', error.message);
        return false;
    }
}

// Verificação 4: Teste de Busca Real
async function testRealSearch() {
    const browserAPI = isBrowserAPI ? browser : (isChromeAPI ? chrome : null);
    
    if (!browserAPI) {
        console.log('❌ API não disponível para teste de busca');
        return false;
    }
    
    try {
        console.log('   🔍 Executando busca real...');
        const searchResponse = await browserAPI.runtime.sendMessage({
            type: 'search',
            data: {
                username: 'test_final_verification',
                options: {
                    includeAdult: false,
                    maxPlatforms: 5
                }
            }
        });
        
        if (searchResponse && searchResponse.success) {
            const { results } = searchResponse;
            console.log('   🎉 BUSCA EXECUTADA COM SUCESSO!');
            console.log(`      - Search ID: ${searchResponse.searchId}`);
            console.log(`      - Status: ${results.status}`);
            console.log(`      - Plataformas Verificadas: ${results.platformsChecked}`);
            console.log(`      - Total de Plataformas: ${results.platformsTotal}`);
            console.log(`      - Resultados Encontrados: ${results.results.length}`);
            
            if (results.platformsChecked > 0) {
                console.log('   ✅ CORREÇÃO APLICADA COM SUCESSO!');
                return true;
            } else {
                console.log('   ❌ PROBLEMA PERSISTE: Nenhuma plataforma verificada!');
                return false;
            }
        } else {
            console.log('   ❌ Busca falhou:', searchResponse);
            return false;
        }
    } catch (error) {
        console.log('   ❌ Erro na busca:', error.message);
        return false;
    }
}

// Executar todas as verificações
async function runAllTests() {
    console.log('\n🔍 === EXECUTANDO TODAS AS VERIFICAÇÕES ===');
    
    const communicationOK = await testCommunication();
    console.log('\n3. 🔧 Testando Serviços...');
    const servicesOK = await testServices();
    console.log('\n4. 🚀 Testando Busca Real...');
    const searchOK = await testRealSearch();
    
    console.log('\n🏁 === RESULTADO FINAL ===');
    
    const totalTests = 3;
    const passedTests = [communicationOK, servicesOK, searchOK].filter(Boolean).length;
    
    console.log(`📊 Testes Passou: ${passedTests}/${totalTests}`);
    console.log(`📨 Comunicação: ${communicationOK ? '✅' : '❌'}`);
    console.log(`🔧 Serviços: ${servicesOK ? '✅' : '❌'}`);
    console.log(`🔍 Busca: ${searchOK ? '✅' : '❌'}`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 🎉 🎉 SUCESSO TOTAL! 🎉 🎉 🎉');
        console.log('✅ A extensão DeepAlias Hunter Pro está funcionando corretamente no Firefox!');
        console.log('✅ O problema "Plataformas verificadas: 0" foi RESOLVIDO!');
        console.log('✅ Todas as correções foram aplicadas com sucesso!');
    } else {
        console.log('\n❌ ❌ ❌ AINDA HÁ PROBLEMAS ❌ ❌ ❌');
        console.log('🔧 Algumas verificações falharam.');
        console.log('💡 Revise os logs acima para identificar os problemas restantes.');
    }
}

// Executar com delay para dar tempo da extensão carregar
setTimeout(runAllTests, 1000);
