/**
 * 🔧 TESTE DE CONTEXTO E VALIDAÇÃO DA EXTENSÃO
 * Este script valida se a extensão está funcionando no contexto correto
 */

console.log('🚀 INICIANDO VALIDAÇÃO COMPLETA DA EXTENSÃO...');
console.log('=====================================');

// Função principal de validação
async function validarExtensaoCompleta() {
    const resultados = {
        contexto: false,
        apis: false,
        comunicacao: false,
        storage: false,
        detalhes: []
    };
    
    try {
        // 1. Verificar contexto
        console.log('📍 1. Verificando contexto...');
        const url = window.location.href;
        const protocol = window.location.protocol;
        
        const contextoCorreto = protocol === 'moz-extension:' || protocol === 'chrome-extension:';
        resultados.contexto = contextoCorreto;
        
        if (contextoCorreto) {
            console.log('✅ Contexto: CORRETO (' + protocol + ')');
            resultados.detalhes.push('✅ Contexto privilegiado detectado');
        } else {
            console.error('❌ Contexto: INCORRETO (' + protocol + ')');
            resultados.detalhes.push('❌ Contexto não privilegiado: ' + protocol);
            console.error('💡 SOLUÇÃO: Acesse via moz-extension:// ou chrome-extension://');
            return resultados;
        }
        
        // 2. Verificar APIs
        console.log('📍 2. Verificando APIs do browser...');
        const browserAPI = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);
        
        if (browserAPI) {
            console.log('✅ APIs: DISPONÍVEIS');
            resultados.apis = true;
            resultados.detalhes.push('✅ APIs do browser disponíveis');
            
            // Verificar APIs específicas
            const apis = {
                runtime: !!browserAPI.runtime,
                storage: !!browserAPI.storage,
                tabs: !!browserAPI.tabs
            };
            
            console.log('📋 APIs disponíveis:', apis);
            resultados.detalhes.push(`📋 Runtime: ${apis.runtime ? '✅' : '❌'}, Storage: ${apis.storage ? '✅' : '❌'}, Tabs: ${apis.tabs ? '✅' : '❌'}`);
        } else {
            console.error('❌ APIs: NÃO DISPONÍVEIS');
            resultados.detalhes.push('❌ APIs do browser não disponíveis');
            return resultados;
        }
        
        // 3. Teste de comunicação
        console.log('📍 3. Testando comunicação com background...');
        try {
            const response = await browserAPI.runtime.sendMessage({ 
                type: 'ping', 
                timestamp: Date.now(),
                source: 'validation-test'
            });
            
            if (response && response.pong) {
                console.log('✅ Comunicação: FUNCIONANDO');
                console.log('📨 Resposta:', response);
                resultados.comunicacao = true;
                resultados.detalhes.push('✅ Background script respondeu: ' + response.pong);
            } else {
                console.error('❌ Comunicação: FALHOU (resposta inválida)');
                resultados.detalhes.push('❌ Background script não respondeu corretamente');
            }
        } catch (error) {
            console.error('❌ Comunicação: FALHOU (' + error.message + ')');
            resultados.detalhes.push('❌ Erro na comunicação: ' + error.message);
        }
        
        // 4. Teste de storage
        console.log('📍 4. Testando storage...');
        try {
            // Tentar ler configurações
            const settingsResponse = await browserAPI.runtime.sendMessage({ type: 'getSettings' });
            
            if (settingsResponse && settingsResponse.success) {
                console.log('✅ Storage: FUNCIONANDO');
                console.log('📦 Configurações carregadas:', Object.keys(settingsResponse.settings || {}).length);
                resultados.storage = true;
                resultados.detalhes.push('✅ Storage funcionando com ' + Object.keys(settingsResponse.settings || {}).length + ' configurações');
            } else {
                console.error('❌ Storage: FALHOU (não conseguiu carregar configurações)');
                resultados.detalhes.push('❌ Storage não conseguiu carregar configurações');
            }
        } catch (error) {
            console.error('❌ Storage: FALHOU (' + error.message + ')');
            resultados.detalhes.push('❌ Erro no storage: ' + error.message);
        }
        
    } catch (error) {
        console.error('❌ ERRO GERAL:', error);
        resultados.detalhes.push('❌ Erro geral: ' + error.message);
    }
    
    return resultados;
}

// Função para exibir relatório
function exibirRelatorio(resultados) {
    console.log('\n📊 RELATÓRIO FINAL DE VALIDAÇÃO');
    console.log('=====================================');
    
    const score = [
        resultados.contexto,
        resultados.apis, 
        resultados.comunicacao,
        resultados.storage
    ].filter(Boolean).length;
    
    console.log(`🎯 SCORE: ${score}/4 (${Math.round(score/4*100)}%)`);
    console.log('');
    
    resultados.detalhes.forEach(detalhe => {
        console.log(detalhe);
    });
    
    console.log('');
    
    if (score === 4) {
        console.log('🎉 EXTENSÃO 100% FUNCIONAL!');
        console.log('✅ Todos os sistemas operacionais');
        console.log('🚀 Pronta para uso');
    } else if (score >= 2) {
        console.log('⚠️ EXTENSÃO PARCIALMENTE FUNCIONAL');
        console.log('💡 Alguns problemas detectados');
        console.log('📋 Consulte GUIA_CONTEXTO_CORRETO.md');
    } else {
        console.log('❌ EXTENSÃO COM PROBLEMAS GRAVES');
        console.log('🔧 Verificação urgente necessária');
        console.log('📋 Consulte GUIA_CONTEXTO_CORRETO.md');
    }
    
    return score;
}

// Executar validação automaticamente
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔄 Aguardando carregamento da página...');
    
    // Aguardar um pouco para garantir que tudo carregou
    setTimeout(async () => {
        const resultados = await validarExtensaoCompleta();
        const score = exibirRelatorio(resultados);
        
        // Exibir na página se possível
        try {
            const body = document.body || document.documentElement;
            const resultDiv = document.createElement('div');
            resultDiv.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: ${score === 4 ? '#4caf50' : score >= 2 ? '#ff9800' : '#f44336'};
                color: white;
                padding: 15px;
                border-radius: 8px;
                font-family: monospace;
                font-size: 14px;
                z-index: 10000;
                max-width: 300px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            `;
            
            resultDiv.innerHTML = `
                <strong>🔧 Validação Extensão</strong><br>
                📊 Score: ${score}/4 (${Math.round(score/4*100)}%)<br>
                ${score === 4 ? '🎉 100% Funcional!' : score >= 2 ? '⚠️ Problemas detectados' : '❌ Verificação urgente'}
            `;
            
            body.appendChild(resultDiv);
            
            // Remover após 10 segundos
            setTimeout(() => {
                if (resultDiv.parentNode) {
                    resultDiv.parentNode.removeChild(resultDiv);
                }
            }, 10000);
            
        } catch (error) {
            console.log('ℹ️ Não foi possível exibir resultado na página:', error.message);
        }
        
    }, 1000);
});

// Também disponibilizar função global para execução manual
window.validarExtensao = validarExtensaoCompleta;
window.exibirRelatorio = exibirRelatorio;

console.log('✅ Script de validação carregado');
console.log('💡 Execute: await validarExtensao() para testar manualmente');
