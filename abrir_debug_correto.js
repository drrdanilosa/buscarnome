/**
 * 🔧 SCRIPT PARA ABRIR DEBUG NO CONTEXTO CORRETO
 * Este script garante que a interface de debug seja aberta no contexto privilegiado
 */

// Para ser executado no console do Firefox (F12)
// Ou pode ser usado como bookmarklet

async function abrirDebugCorreto() {
    console.log('🔧 Abrindo interface de debug no contexto correto...');
    
    try {
        // Verificar se estamos no contexto da extensão
        if (typeof browser === 'undefined' && typeof chrome === 'undefined') {
            console.error('❌ APIs da extensão não disponíveis');
            console.log('💡 Execute este script no console de uma página da extensão');
            return;
        }
        
        const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
        
        // Obter informações da extensão
        const manifest = browserAPI.runtime.getManifest();
        const runtimeId = browserAPI.runtime.id;
        
        console.log(`✅ Extensão: ${manifest.name} v${manifest.version}`);
        console.log(`🆔 Runtime ID: ${runtimeId}`);
        
        // Construir URL correto para o debug interno
        const debugUrl = `moz-extension://${runtimeId}/src/debug/debug_interno.html`;
        
        console.log(`🌐 URL de debug: ${debugUrl}`);
        
        // Abrir em nova aba
        await browserAPI.tabs.create({ url: debugUrl });
        
        console.log('🎉 Interface de debug aberta no contexto correto!');
        
    } catch (error) {
        console.error('❌ Erro ao abrir debug:', error);
        
        console.log('\n📋 INSTRUÇÕES MANUAIS:');
        console.log('1. Vá para about:debugging#/runtime/this-firefox');
        console.log('2. Encontre "DeepAlias Hunter Pro"');
        console.log('3. Clique em "Inspecionar" na seção da extensão');
        console.log('4. Na barra de endereços, navegue para: moz-extension://[ID]/src/debug/debug_interno.html');
    }
}

// Executar automaticamente se estivermos no contexto correto
if (typeof browser !== 'undefined' || typeof chrome !== 'undefined') {
    abrirDebugCorreto();
} else {
    console.log('📋 COMO USAR:');
    console.log('1. Abra o popup da extensão DeepAlias Hunter Pro');
    console.log('2. Pressione F12 para abrir Developer Tools');
    console.log('3. No console, execute: abrirDebugCorreto()');
}
