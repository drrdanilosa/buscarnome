/**
 * Teste de Comunicação Background Script - DeepAlias Hunter Pro
 * Verifica se a comunicação entre popup e background está funcionando
 */

console.log('=== TESTE DE COMUNICAÇÃO BACKGROUND SCRIPT ===');
console.log('Timestamp:', new Date().toISOString());

// Função para testar comunicação básica
async function testCommunication() {
  try {
    console.log('\n1. Testando detecção de browser...');
    const isFirefox = typeof browser !== 'undefined';
    const browserAPI = isFirefox ? browser : chrome;
    console.log(`✅ Browser detectado: ${isFirefox ? 'Firefox' : 'Chrome/Edge'}`);
    
    console.log('\n2. Testando ping básico...');
    const pingTest = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout na comunicação ping'));
      }, 5000);
      
      if (isFirefox) {
        browserAPI.runtime.sendMessage({ type: 'ping' })
          .then(response => {
            clearTimeout(timeout);
            resolve(response);
          })
          .catch(reject);
      } else {
        browserAPI.runtime.sendMessage({ type: 'ping' }, (response) => {
          clearTimeout(timeout);
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      }
    });
    
    console.log('✅ Ping response:', pingTest);
    
    console.log('\n3. Testando busca básica...');
    const searchTest = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout na comunicação de busca'));
      }, 10000);
      
      const searchMessage = {
        type: 'search',
        data: {
          username: 'testuser',
          options: {
            maxVariations: 3,
            includeTor: false,
            includeAdult: false
          }
        }
      };
      
      if (isFirefox) {
        browserAPI.runtime.sendMessage(searchMessage)
          .then(response => {
            clearTimeout(timeout);
            resolve(response);
          })
          .catch(reject);
      } else {
        browserAPI.runtime.sendMessage(searchMessage, (response) => {
          clearTimeout(timeout);
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      }
    });
    
    console.log('✅ Search response:', searchTest);
    
    console.log('\n4. Testando getSettings...');
    const settingsTest = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao obter configurações'));
      }, 5000);
      
      if (isFirefox) {
        browserAPI.runtime.sendMessage({ type: 'getSettings' })
          .then(response => {
            clearTimeout(timeout);
            resolve(response);
          })
          .catch(reject);
      } else {
        browserAPI.runtime.sendMessage({ type: 'getSettings' }, (response) => {
          clearTimeout(timeout);
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      }
    });
    
    console.log('✅ Settings response:', settingsTest);
    
    console.log('\n5. Testando status de saúde...');
    const healthTest = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout no health check'));
      }, 5000);
      
      if (isFirefox) {
        browserAPI.runtime.sendMessage({ type: 'health-check' })
          .then(response => {
            clearTimeout(timeout);
            resolve(response);
          })
          .catch(reject);
      } else {
        browserAPI.runtime.sendMessage({ type: 'health-check' }, (response) => {
          clearTimeout(timeout);
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      }
    });
    
    console.log('✅ Health response:', healthTest);
    
    console.log('\n=== TODOS OS TESTES PASSARAM ===');
    console.log('✅ Comunicação entre popup e background funcionando corretamente!');
    
    return {
      success: true,
      browser: isFirefox ? 'Firefox' : 'Chrome/Edge',
      ping: pingTest.success,
      search: searchTest.success,
      settings: settingsTest.success,
      health: healthTest.success,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    throw error;
  }
}

// Auto-executar se estivermos em contexto de extensão
if (typeof chrome !== 'undefined' || typeof browser !== 'undefined') {
  testCommunication()
    .then(result => {
      console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO:', result);
    })
    .catch(error => {
      console.error('\n❌ TESTE FALHOU:', error);
    });
} else {
  console.log('Script pronto para ser executado em contexto de extensão');
}
