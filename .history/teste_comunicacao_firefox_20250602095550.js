/**
 * TESTE DIRETO DE COMUNICAÇÃO - Firefox Focus
 * Este script vai testar exatamente onde está a falha
 */

console.log('=== INICIANDO TESTE PROFUNDO DEEPALIAS ===');

// 1. VERIFICAR API DO BROWSER
console.log('1. Verificando API do browser...');
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
console.log('Browser API disponível:', !!browserAPI);
console.log('Tipo:', typeof browser !== 'undefined' ? 'Firefox' : 'Chrome/Edge');

if (!browserAPI) {
  console.error('ERRO CRÍTICO: Nenhuma API de browser disponível!');
}

// 2. VERIFICAR RUNTIME
console.log('2. Verificando runtime...');
console.log('Runtime disponível:', !!browserAPI?.runtime);
console.log('SendMessage disponível:', !!browserAPI?.runtime?.sendMessage);

// 3. TESTE DE PING BÁSICO
console.log('3. Testando comunicação básica...');

function testPing() {
  return new Promise((resolve, reject) => {
    if (!browserAPI?.runtime?.sendMessage) {
      reject(new Error('SendMessage não disponível'));
      return;
    }

    browserAPI.runtime.sendMessage({
      type: 'ping',
      timestamp: Date.now()
    }, (response) => {
      if (browserAPI.runtime.lastError) {
        console.error('Erro na comunicação:', browserAPI.runtime.lastError);
        reject(new Error(browserAPI.runtime.lastError.message));
      } else {
        console.log('Resposta do ping:', response);
        resolve(response);
      }
    });

    // Timeout
    setTimeout(() => {
      reject(new Error('Timeout - background script não respondeu'));
    }, 5000);
  });
}

// 4. TESTE DE VERIFICAÇÃO DE SERVIÇOS
function testServices() {
  return new Promise((resolve, reject) => {
    browserAPI.runtime.sendMessage({
      type: 'checkServices'
    }, (response) => {
      if (browserAPI.runtime.lastError) {
        console.error('Erro ao verificar serviços:', browserAPI.runtime.lastError);
        reject(new Error(browserAPI.runtime.lastError.message));
      } else {
        console.log('Resposta dos serviços:', response);
        resolve(response);
      }
    });

    setTimeout(() => {
      reject(new Error('Timeout ao verificar serviços'));
    }, 5000);
  });
}

// 5. TESTE DE BUSCA REAL
function testSearch() {
  return new Promise((resolve, reject) => {
    browserAPI.runtime.sendMessage({
      type: 'search',
      data: {
        username: 'test_firefox_user',
        options: {
          includeAdult: false,
          maxVariations: 2,
          maxPlatforms: 5
        }
      }
    }, (response) => {
      if (browserAPI.runtime.lastError) {
        console.error('Erro na busca:', browserAPI.runtime.lastError);
        reject(new Error(browserAPI.runtime.lastError.message));
      } else {
        console.log('Resposta da busca:', response);
        resolve(response);
      }
    });

    setTimeout(() => {
      reject(new Error('Timeout na busca'));
    }, 10000);
  });
}

// EXECUTAR TESTES SEQUENCIAIS
async function executarTestes() {
  console.log('=== INICIANDO TESTES SEQUENCIAIS ===');
  
  try {
    // Teste 1: Ping
    console.log('\n--- TESTE 1: PING ---');
    const pingResult = await testPing();
    console.log('✅ Ping OK:', pingResult);
    
    // Teste 2: Serviços
    console.log('\n--- TESTE 2: SERVIÇOS ---');
    const servicesResult = await testServices();
    console.log('✅ Serviços OK:', servicesResult);
    
    if (servicesResult.success) {
      const services = servicesResult.services;
      console.log('📊 ANÁLISE DETALHADA:');
      console.log(`- PlatformService: ${services.platformService?.available ? '✅' : '❌'} (${services.platformService?.platforms || 0} plataformas)`);
      console.log(`- SearchEngine: ${services.searchEngine?.available ? '✅' : '❌'}`);
      console.log(`- UsernameVariator: ${services.usernameVariator?.available ? '✅' : '❌'}`);
      
      if (services.platformService?.platforms === 0) {
        console.error('🚨 PROBLEMA IDENTIFICADO: PlatformService tem 0 plataformas!');
      }
    }
    
    // Teste 3: Busca real
    console.log('\n--- TESTE 3: BUSCA REAL ---');
    const searchResult = await testSearch();
    console.log('✅ Busca OK:', searchResult);
    
    if (searchResult.success) {
      console.log(`🎯 Search ID: ${searchResult.searchId}`);
      
      // Aguardar um pouco e verificar status
      console.log('Aguardando 2 segundos para verificar status...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar status
      const statusResult = await new Promise((resolve, reject) => {
        browserAPI.runtime.sendMessage({
          type: 'getStatus',
          data: { searchId: searchResult.searchId }
        }, (response) => {
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
        setTimeout(() => reject(new Error('Timeout no status')), 5000);
      });
      
      console.log('📊 Status da busca:', statusResult);
      
      if (statusResult.success && statusResult.status) {
        const status = statusResult.status;
        console.log(`📈 Progresso: ${status.progress}%`);
        console.log(`🔍 Plataformas verificadas: ${status.platformsChecked}/${status.platformsTotal}`);
        console.log(`📋 Resultados: ${status.resultsCount}`);
        
        if (status.platformsTotal === 0) {
          console.error('🚨 CONFIRMADO: O problema é que platformsTotal = 0!');
          console.error('💡 Isso indica que SimplePlatformService.getAllPlatforms() retorna array vazio');
        }
      }
    }
    
    console.log('\n=== TESTES CONCLUÍDOS ===');
    
  } catch (error) {
    console.error('❌ ERRO NOS TESTES:', error);
    console.error('🔍 Stack trace:', error.stack);
    
    // Diagnóstico adicional
    console.log('\n=== DIAGNÓSTICO DE FALHA ===');
    console.log('Browser API disponível:', !!browserAPI);
    console.log('Runtime disponível:', !!browserAPI?.runtime);
    console.log('SendMessage disponível:', !!browserAPI?.runtime?.sendMessage);
    console.log('LastError:', browserAPI?.runtime?.lastError);
  }
}

// EXECUTAR QUANDO O DOM ESTIVER PRONTO
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', executarTestes);
} else {
  executarTestes();
}

// EXPORTAR FUNÇÕES PARA USO MANUAL
window.testDeepAlias = {
  ping: testPing,
  services: testServices,
  search: testSearch,
  full: executarTestes
};

console.log('💡 Para executar testes manualmente, use:');
console.log('- window.testDeepAlias.ping()');
console.log('- window.testDeepAlias.services()');
console.log('- window.testDeepAlias.search()');
console.log('- window.testDeepAlias.full()');
