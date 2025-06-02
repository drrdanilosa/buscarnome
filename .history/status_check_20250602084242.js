/**
 * Verificação de Status da Extensão
 * Execute este código no console do DevTools da extensão
 */

console.log('🔍 === VERIFICAÇÃO DE STATUS - DeepAlias Hunter Pro ===');
console.log('⏰ Timestamp:', new Date().toLocaleString());

// 1. Verificar se background script está ativo
console.log('\n1️⃣ Background Script Status:');
console.log('✅ Background script ativo (você está vendo este log!)');

// 2. Verificar runtime
console.log('\n2️⃣ Runtime Status:');
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
console.log('✅ Runtime ID:', browserAPI.runtime.id);
console.log('✅ Manifest Version:', browserAPI.runtime.getManifest().manifest_version);

// 3. Testar storage
console.log('\n3️⃣ Storage Test:');
browserAPI.storage.local.set({ 
  statusCheck: { 
    timestamp: Date.now(), 
    status: 'active' 
  } 
}, () => {
  if (!browserAPI.runtime.lastError) {
    console.log('✅ Storage funcionando corretamente');
    
    browserAPI.storage.local.get(['statusCheck'], (result) => {
      if (!browserAPI.runtime.lastError && result.statusCheck) {
        console.log('✅ Storage read/write OK');
      }
    });
  } else {
    console.log('❌ Erro no storage:', browserAPI.runtime.lastError);
  }
});

// 4. Verificar listeners
console.log('\n4️⃣ Message Listeners:');
console.log('✅ onMessage listener:', browserAPI.runtime.onMessage.hasListeners());

// 5. Testar comunicação interna
console.log('\n5️⃣ Internal Communication Test:');
browserAPI.runtime.sendMessage({
  type: 'getStatus',
  data: { searchId: 'status_check_' + Date.now() }
}, (response) => {
  if (browserAPI.runtime.lastError) {
    console.log('⚠️ Comunicação:', browserAPI.runtime.lastError.message);
  } else {
    console.log('✅ Comunicação OK:', response);
  }
});

console.log('\n🎯 === VERIFICAÇÃO CONCLUÍDA ===');
console.log('💡 Dica: A mensagem sobre "DevTools attached" é NORMAL durante desenvolvimento!');
