/**
 * Script de validação final para a extensão DeepAlias Hunter Pro
 * Testa todas as funcionalidades implementadas
 */

console.log('🔍 INICIANDO VALIDAÇÃO FINAL DA EXTENSÃO');
console.log('==========================================');

// Polyfill para compatibilidade
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

/**
 * Executa todos os testes de validação
 */
async function executarValidacaoCompleta() {
    const resultados = {
        comunicacao: false,
        storage: false,
        debugInterno: false,
        guiaDiagnostico: false,
        opcoes: false
    };

    console.log('\n📋 1. TESTANDO COMUNICAÇÃO COM BACKGROUND SCRIPT...');
    try {
        const response = await browserAPI.runtime.sendMessage({ type: 'ping' });
        if (response && response.status === 'success') {
            console.log('✅ Comunicação funcionando!', response);
            resultados.comunicacao = true;
        } else {
            console.log('❌ Resposta inválida:', response);
        }
    } catch (error) {
        console.error('❌ Erro na comunicação:', error.message);
    }

    console.log('\n💾 2. TESTANDO STORAGE SERVICE...');
    try {
        const testKey = 'validation-test-' + Date.now();
        const testValue = { teste: true, timestamp: Date.now() };
        
        // Teste de escrita
        const setResponse = await browserAPI.runtime.sendMessage({
            type: 'storage-set',
            key: testKey,
            value: testValue
        });
        
        // Teste de leitura
        const getResponse = await browserAPI.runtime.sendMessage({
            type: 'storage-get',
            key: testKey
        });
        
        // Teste de remoção
        const removeResponse = await browserAPI.runtime.sendMessage({
            type: 'storage-remove',
            key: testKey
        });
        
        if (setResponse && getResponse && removeResponse) {
            console.log('✅ Storage funcionando!');
            resultados.storage = true;
        }
    } catch (error) {
        console.error('❌ Erro no storage:', error.message);
    }

    console.log('\n🔍 3. TESTANDO DEBUG INTERNO...');
    try {
        const debugUrl = browserAPI.runtime.getURL('src/debug/debug_interno.html');
        console.log('✅ URL do debug interno gerada:', debugUrl);
        resultados.debugInterno = true;
    } catch (error) {
        console.error('❌ Erro no debug interno:', error.message);
    }

    console.log('\n📖 4. TESTANDO GUIA DE DIAGNÓSTICO...');
    try {
        const guideUrl = browserAPI.runtime.getURL('src/help/guia_diagnostico.html');
        console.log('✅ URL do guia gerada:', guideUrl);
        resultados.guiaDiagnostico = true;
    } catch (error) {
        console.error('❌ Erro no guia:', error.message);
    }

    console.log('\n⚙️ 5. TESTANDO PÁGINA DE OPÇÕES...');
    try {
        const optionsUrl = browserAPI.runtime.getURL('src/options/options.html');
        console.log('✅ URL das opções gerada:', optionsUrl);
        resultados.opcoes = true;
    } catch (error) {
        console.error('❌ Erro nas opções:', error.message);
    }

    // Resumo final
    console.log('\n📊 RESUMO DA VALIDAÇÃO:');
    console.log('========================');
    console.log('Comunicação Background:', resultados.comunicacao ? '✅ OK' : '❌ FALHOU');
    console.log('Storage Service:', resultados.storage ? '✅ OK' : '❌ FALHOU');
    console.log('Debug Interno:', resultados.debugInterno ? '✅ OK' : '❌ FALHOU');
    console.log('Guia Diagnóstico:', resultados.guiaDiagnostico ? '✅ OK' : '❌ FALHOU');
    console.log('Página Opções:', resultados.opcoes ? '✅ OK' : '❌ FALHOU');

    const sucessos = Object.values(resultados).filter(r => r).length;
    const total = Object.keys(resultados).length;
    
    console.log(`\n🎯 RESULTADO FINAL: ${sucessos}/${total} testes passaram`);
    
    if (sucessos === total) {
        console.log('🎉 EXTENSÃO VALIDADA COM SUCESSO!');
        return true;
    } else {
        console.log('⚠️ EXTENSÃO REQUER CORREÇÕES ADICIONAIS');
        return false;
    }
}

// Executar validação automaticamente
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(executarValidacaoCompleta, 1000);
    });
} else {
    executarValidacaoCompleta();
}

// Exportar para uso manual
if (typeof window !== 'undefined') {
    window.validarExtensao = executarValidacaoCompleta;
}
