/**
 * DeepAlias Hunter Pro - Diagnóstico de Plataformas
 * @author drrdanilosa
 * @version 5.0.0
 * @date 2025-06-03
 */

/**
 * Executa diagnóstico do sistema de plataformas
 */
async function runPlatformDiagnostic() {
  console.log('=========== DIAGNÓSTICO DE PLATAFORMAS ===========');
  console.log('Data/Hora:', new Date().toISOString());
  
  try {
    // 1. Verificar se o arquivo de plataformas completo existe
    console.log('\n1. Verificando arquivo de plataformas completo...');
    const completeUrl = browser.runtime.getURL('data/platforms_complete.json');
    console.log('URL do arquivo completo:', completeUrl);
    
    try {
      const completeResponse = await fetch(completeUrl);
      if (completeResponse.ok) {
        console.log('✅ Arquivo de plataformas completo existe e pode ser acessado');
        
        try {
          const completeData = await completeResponse.json();
          console.log('✅ Arquivo de plataformas completo contém JSON válido');
          console.log('Número de plataformas:', completeData.length);
          
          if (completeData.length < 100) {
            console.warn('⚠️ Arquivo de plataformas completo contém menos de 100 plataformas');
          }
          
          // Verificar estrutura de algumas plataformas
          if (completeData.length > 0) {
            console.log('Amostra de plataforma:', completeData[0]);
            
            // Verificar campos necessários
            const hasRequiredFields = completeData.every(p => 
              p.name && p.url_format && p.check_uri && p.category
            );
            
            if (hasRequiredFields) {
              console.log('✅ Todas as plataformas têm os campos necessários');
            } else {
              console.warn('⚠️ Algumas plataformas não têm todos os campos necessários');
            }
          }
        } catch (jsonError) {
          console.error('❌ Erro ao analisar JSON do arquivo completo:', jsonError);
        }
      } else {
        console.error('❌ Arquivo de plataformas completo não pode ser acessado (status:', completeResponse.status, ')');
      }
    } catch (fetchError) {
      console.error('❌ Erro ao buscar arquivo completo:', fetchError);
    }
    
    // 2. Verificar se o arquivo de fallback existe
    console.log('\n2. Verificando arquivo de fallback...');
    const fallbackUrl = browser.runtime.getURL('data/platforms_fallback.json');
    console.log('URL do arquivo de fallback:', fallbackUrl);
    
    try {
      const fallbackResponse = await fetch(fallbackUrl);
      if (fallbackResponse.ok) {
        console.log('✅ Arquivo de fallback existe e pode ser acessado');
        
        try {
          const fallbackData = await fallbackResponse.json();
          console.log('✅ Arquivo de fallback contém JSON válido');
          console.log('Número de plataformas fallback:', fallbackData.length);
        } catch (jsonError) {
          console.error('❌ Erro ao analisar JSON do arquivo de fallback:', jsonError);
        }
      } else {
        console.error('❌ Arquivo de fallback não pode ser acessado (status:', fallbackResponse.status, ')');
      }
    } catch (fetchError) {
      console.error('❌ Erro ao buscar arquivo de fallback:', fetchError);
    }
    
    // 3. Verificar se o PlatformService está disponível
    console.log('\n3. Verificando PlatformService...');
    
    if (typeof PlatformService === 'undefined') {
      console.error('❌ PlatformService não está definido');
    } else {
      console.log('✅ PlatformService está definido');
      
      // Verificar se há uma instância no background
      const backgroundPage = browser.extension.getBackgroundPage();
      if (backgroundPage && backgroundPage.platformService) {
        console.log('✅ Instância de PlatformService encontrada no background');
        
        // Verificar estado da instância
        const platformService = backgroundPage.platformService;
        console.log('Inicializado:', platformService.isInitialized);
        console.log('Número de plataformas:', platformService.platforms.length);
        console.log('Número de categorias:', platformService.categories.size);
        
        if (platformService.platforms.length === 0) {
          console.error('❌ Nenhuma plataforma carregada');
        }
      } else {
        console.error('❌ Nenhuma instância de PlatformService encontrada no background');
      }
    }
    
    // 4. Verificar dados no storage
    console.log('\n4. Verificando dados de plataformas no storage...');
    
    try {
      const storedData = await browser.storage.local.get('platformsData');
      if (storedData.platformsData) {
        console.log('✅ Dados de plataformas encontrados no storage');
        console.log('Timestamp:', new Date(storedData.platformsData.timestamp).toISOString());
        console.log('Número de plataformas armazenadas:', storedData.platformsData.platforms.length);
      } else {
        console.warn('⚠️ Nenhum dado de plataformas encontrado no storage');
      }
    } catch (storageError) {
      console.error('❌ Erro ao acessar storage:', storageError);
    }
    
    // 5. Testar geração de fallback hardcoded
    console.log('\n5. Testando geração de fallback hardcoded...');
    
    if (typeof FALLBACK_PLATFORMS === 'undefined') {
      console.error('❌ FALLBACK_PLATFORMS não está definido');
    } else {
      console.log('✅ FALLBACK_PLATFORMS está definido');
      console.log('Número de plataformas fallback hardcoded:', FALLBACK_PLATFORMS.length);
    }
    
  } catch (error) {
    console.error('❌ Erro geral durante diagnóstico:', error);
  }
  
  console.log('\n=========== FIM DO DIAGNÓSTICO ===========');
}

// Executar diagnóstico se for carregado diretamente
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runPlatformDiagnostic);
} else {
  runPlatformDiagnostic();
}

// Exportar função para uso em outras partes da extensão
if (typeof module !== 'undefined') {
  module.exports = { runPlatformDiagnostic };
} else {
  window.runPlatformDiagnostic = runPlatformDiagnostic;
}