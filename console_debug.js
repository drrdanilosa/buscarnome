/**
 * Script de diagnóstico direto para execução no console do Firefox
 * Verifica se o background script está funcionando e responde a mensagens
 */

console.log('🔍 Iniciando diagnóstico de comunicação...');

// Função para testar comunicação básica
async function testarComunicacao() {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  const isFirefox = typeof browser !== 'undefined';
  
  console.log(`Navegador detectado: ${isFirefox ? 'Firefox' : 'Chrome/Edge'}`);
  
  if (!browserAPI || !browserAPI.runtime) {
    console.error('❌ API do browser não disponível!');
    return;
  }
  
  // Teste 1: Ping básico
  try {
    console.log('🔄 Testando ping básico...');
    const response = await browserAPI.runtime.sendMessage({ type: 'ping', timestamp: Date.now() });
    console.log('✅ Ping bem-sucedido:', response);
  } catch (error) {
    console.error('❌ Ping falhou:', error);
  }
  
  // Teste 2: Health check
  try {
    console.log('🔄 Testando health check...');
    const response = await browserAPI.runtime.sendMessage({ type: 'health-check' });
    console.log('✅ Health check bem-sucedido:', response);
  } catch (error) {
    console.error('❌ Health check falhou:', error);
  }
  
  // Teste 3: GetSettings
  try {
    console.log('🔄 Testando getSettings...');
    const response = await browserAPI.runtime.sendMessage({ type: 'getSettings' });
    console.log('✅ GetSettings bem-sucedido:', response);
  } catch (error) {
    console.error('❌ GetSettings falhou:', error);
  }
  
  // Teste 4: Status
  try {
    console.log('🔄 Testando status...');
    const response = await browserAPI.runtime.sendMessage({ type: 'status' });
    console.log('✅ Status bem-sucedido:', response);
  } catch (error) {
    console.error('❌ Status falhou:', error);
  }
  
  // Teste 5: Debug info
  try {
    console.log('🔄 Testando debug-info...');
    const response = await browserAPI.runtime.sendMessage({ type: 'debug-info' });
    console.log('✅ Debug-info bem-sucedido:', response);
  } catch (error) {
    console.error('❌ Debug-info falhou:', error);
  }
}

// Executar testes
testarComunicacao();

// Função para testar múltiplas mensagens
async function testarMultiplas() {
  console.log('🔄 Testando múltiplas mensagens simultâneas...');
  
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  const mensagens = [
    { type: 'ping', id: 1 },
    { type: 'health-check', id: 2 },
    { type: 'status', id: 3 },
    { type: 'debug-info', id: 4 }
  ];
  
  try {
    const promises = mensagens.map(msg => browserAPI.runtime.sendMessage(msg));
    const responses = await Promise.all(promises);
    console.log('✅ Todas as mensagens processadas:', responses);
  } catch (error) {
    console.error('❌ Erro em múltiplas mensagens:', error);
  }
}

// Função para verificar se a extensão está carregada
function verificarExtensao() {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  
  console.log('🔍 Verificando estado da extensão...');
  console.log('Runtime ID:', browserAPI.runtime?.id);
  console.log('Manifest:', browserAPI.runtime?.getManifest?.());
  console.log('OnMessage disponível:', !!browserAPI.runtime?.onMessage);
  
  // Verificar se há erros no background
  if (browserAPI.runtime.lastError) {
    console.error('Erro no runtime:', browserAPI.runtime.lastError);
  }
}

// Executar verificações
setTimeout(() => {
  console.log('\n🔍 Executando verificações adicionais...');
  verificarExtensao();
  
  setTimeout(() => {
    console.log('\n📤 Testando múltiplas mensagens...');
    testarMultiplas();
  }, 2000);
}, 1000);

console.log('✅ Script de diagnóstico carregado. Verifique os logs acima.');
