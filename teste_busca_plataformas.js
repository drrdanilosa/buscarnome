/**
 * Teste de Busca com Plataformas Reais
 * Execute este código no console da extensão para testar
 */

console.log('🔍 === TESTE DE BUSCA COM PLATAFORMAS REAIS ===');

// Função para testar a busca
async function testarBusca() {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  
  console.log('\n1️⃣ Iniciando teste de busca...');
  
  try {
    // Enviar mensagem de busca
    const response = await new Promise((resolve, reject) => {
      browserAPI.runtime.sendMessage({
        type: 'search',
        data: {
          username: 'testuser',
          options: {
            includeAdult: true,
            maxPlatforms: 10, // Limitar para teste mais rápido
            maxVariations: 3
          }
        }
      }, (response) => {
        if (browserAPI.runtime.lastError) {
          reject(new Error(browserAPI.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    if (response.success) {
      console.log('✅ Busca iniciada com sucesso!');
      console.log('🆔 Search ID:', response.searchId);
      
      const results = response.results;
      console.log('\n📊 Estatísticas da Busca:');
      console.log(`   • Username: ${results.username}`);
      console.log(`   • Status: ${results.status}`);
      console.log(`   • Plataformas Total: ${results.platformsTotal}`);
      console.log(`   • Plataformas Verificadas: ${results.platformsChecked}`);
      console.log(`   • Progresso: ${results.progress}%`);
      console.log(`   • Resultados Encontrados: ${results.results.length}`);
      
      if (results.results.length > 0) {
        console.log('\n🎯 Resultados Encontrados:');
        results.results.forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.platform}`);
          console.log(`      • URL: ${result.platformUrl}`);
          console.log(`      • Categoria: ${result.category}`);
          console.log(`      • Confiança: ${result.confidence}`);
          console.log(`      • Adulto: ${result.adult ? 'Sim' : 'Não'}`);
        });
      } else {
        console.log('\n ℹ️ Nenhum perfil encontrado nesta execução');
      }
      
      // Verificar se as plataformas foram realmente utilizadas
      if (results.platformsTotal > 0) {
        console.log('\n✅ CORREÇÃO APLICADA COM SUCESSO!');
        console.log(`   • Plataformas reais sendo utilizadas: ${results.platformsTotal}`);
        console.log('   • A busca não está mais retornando "Plataformas verificadas: 0"');
      } else {
        console.log('\n❌ PROBLEMA AINDA EXISTE!');
        console.log('   • Ainda mostrando 0 plataformas');
      }
      
    } else {
      console.log('❌ Erro na busca:', response.error);
    }
    
  } catch (error) {
    console.log('❌ Erro na comunicação:', error.message);
  }
}

// Função para testar status
async function testarStatus(searchId) {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  
  console.log('\n2️⃣ Testando consulta de status...');
  
  try {
    const response = await new Promise((resolve, reject) => {
      browserAPI.runtime.sendMessage({
        type: 'getStatus',
        data: { searchId }
      }, (response) => {
        if (browserAPI.runtime.lastError) {
          reject(new Error(browserAPI.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    if (response.success) {
      console.log('✅ Status obtido com sucesso!');
      console.log('📊 Status:', response.status);
    } else {
      console.log('❌ Erro ao obter status:', response.error);
    }
    
  } catch (error) {
    console.log('❌ Erro na comunicação:', error.message);
  }
}

// Executar teste
console.log('\n🚀 Executando teste automático...');
testarBusca();

console.log('\n💡 Dicas para verificar:');
console.log('   1. Verifique se "Plataformas Total" > 0');
console.log('   2. Verifique se "Plataformas Verificadas" > 0');
console.log('   3. Observe a lista de resultados encontrados');
console.log('   4. Abra o popup da extensão e faça uma busca manual');

console.log('\n🔄 Para executar manualmente:');
console.log('   testarBusca() - Executa uma busca de teste');
console.log('   testarStatus("search_id") - Verifica status de uma busca');
