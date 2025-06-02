/**
 * Script de Verificação - DeepAlias Hunter Pro
 * Executa testes básicos para validar a extensão
 */

console.log('🔍 Iniciando verificação da extensão DeepAlias Hunter Pro...');

// Teste 1: Verificar browserAPI
console.log('\n1️⃣ Testando browserAPI...');
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
console.log('✅ browserAPI disponível:', !!browserAPI);

// Teste 2: Verificar runtime
console.log('\n2️⃣ Testando runtime...');
if (browserAPI && browserAPI.runtime) {
  console.log('✅ Runtime disponível');
  console.log('   - ID:', browserAPI.runtime.id);
  console.log('   - Manifest:', browserAPI.runtime.getManifest ? 'Disponível' : 'Indisponível');
} else {
  console.log('❌ Runtime indisponível');
}

// Teste 3: Verificar storage
console.log('\n3️⃣ Testando storage...');
if (browserAPI && browserAPI.storage) {
  console.log('✅ Storage disponível');
  
  // Teste básico de storage
  browserAPI.storage.local.set({ testKey: 'testValue' }, () => {
    if (!browserAPI.runtime.lastError) {
      console.log('✅ Storage write OK');
      
      browserAPI.storage.local.get(['testKey'], (result) => {
        if (!browserAPI.runtime.lastError && result.testKey === 'testValue') {
          console.log('✅ Storage read OK');
          
          // Limpar teste
          browserAPI.storage.local.remove(['testKey']);
        } else {
          console.log('❌ Storage read failed');
        }
      });
    } else {
      console.log('❌ Storage write failed:', browserAPI.runtime.lastError);
    }
  });
} else {
  console.log('❌ Storage indisponível');
}

// Teste 4: Verificar comunicação
console.log('\n4️⃣ Testando comunicação...');
if (browserAPI && browserAPI.runtime && browserAPI.runtime.sendMessage) {
  console.log('✅ sendMessage disponível');
  
  // Tentar enviar mensagem de teste
  browserAPI.runtime.sendMessage({ 
    type: 'getStatus',
    data: { searchId: 'test' }
  }, (response) => {
    if (browserAPI.runtime.lastError) {
      console.log('⚠️ Mensagem falhou (esperado se background não estiver ativo):', browserAPI.runtime.lastError.message);
    } else {
      console.log('✅ Mensagem enviada com sucesso:', response);
    }
  });
} else {
  console.log('❌ sendMessage indisponível');
}

// Teste 5: Verificar DOM (se em content script)
console.log('\n5️⃣ Testando DOM...');
if (typeof document !== 'undefined') {
  console.log('✅ DOM disponível');
  console.log('   - URL:', document.location.href);
  console.log('   - Title:', document.title);
} else {
  console.log('⚠️ DOM indisponível (normal para background script)');
}

console.log('\n🏁 Verificação concluída!');
