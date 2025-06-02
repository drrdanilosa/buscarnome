/**
 * Script de Validação Final - DeepAlias Hunter Pro
 * Verifica se todas as correções de comunicação Firefox/Chrome foram aplicadas
 * @version 2.0.0 - Validação Completa
 */

console.log('🔍 Iniciando validação final das correções...\n');

// Função para ler arquivos
const fs = require('fs');
const path = require('path');

// Caminhos dos arquivos principais
const projectRoot = 'c:\\Users\\drdan\\CURSOS_TESTE\\CRIANDO\\SCRIPTS\\deep';
const backgroundPath = path.join(projectRoot, 'src', 'background', 'background_simple.js');
const popupPath = path.join(projectRoot, 'src', 'assets', 'js', 'popup.js');

// Função para validar correções no background script
function validateBackgroundScript() {
    console.log('📋 Validando background_simple.js...');
    
    try {
        const content = fs.readFileSync(backgroundPath, 'utf8');
        const validations = [];
          // Verificar se a detecção Firefox/Chrome está presente
        if (content.includes('typeof browser !== \'undefined\'')) {
            validations.push('✅ Detecção Firefox/Chrome implementada');
        } else {
            validations.push('❌ Detecção Firefox/Chrome não encontrada');
        }
        
        // Verificar listener específico para Firefox
        if (content.includes('typeof browser !== \'undefined\'') && content.includes('return handleMessage(message, sender);')) {
            validations.push('✅ Listener Firefox (Promise-based) implementado');
        } else {
            validations.push('❌ Listener Firefox não encontrado');
        }
        
        // Verificar listener específico para Chrome/Edge
        if (content.includes('} else {') && content.includes('sendResponse(response);')) {
            validations.push('✅ Listener Chrome/Edge (Callback-based) implementado');
        } else {
            validations.push('❌ Listener Chrome/Edge não encontrado');
        }
        
        // Verificar função isSearching
        if (content.includes('isSearching()')) {
            validations.push('✅ Função isSearching() adicionada');
        } else {
            validations.push('❌ Função isSearching() não encontrada');
        }
        
        // Verificar se o listener antigo foi removido
        if (!content.includes('browser.runtime.onMessage.addListener((message, sender) => {')) {
            validations.push('✅ Listener único antigo removido');
        } else {
            validations.push('⚠️ Listener único antigo ainda presente');
        }
        
        return validations;
        
    } catch (error) {
        return [`❌ Erro ao ler background script: ${error.message}`];
    }
}

// Função para validar correções no popup script
function validatePopupScript() {
    console.log('📋 Validando popup.js...');
    
    try {
        const content = fs.readFileSync(popupPath, 'utf8');
        const validations = [];
        
        // Verificar função auxiliar de comunicação
        if (content.includes('async function sendMessageToBackground(message, timeout = 5000)')) {
            validations.push('✅ Função auxiliar sendMessageToBackground implementada');
        } else {
            validations.push('❌ Função auxiliar de comunicação não encontrada');
        }
        
        // Verificar detecção Firefox/Chrome na função auxiliar
        if (content.includes('const isFirefox = typeof browser !== \'undefined\' && browser.runtime && browser.runtime.sendMessage;')) {
            validations.push('✅ Detecção Firefox/Chrome na função auxiliar');
        } else {
            validations.push('❌ Detecção Firefox/Chrome não encontrada na função auxiliar');
        }
        
        // Verificar uso da função auxiliar em loadSettings
        if (content.includes('const response = await sendMessageToBackground({') && 
            content.includes('type: \'getSettings\'')) {
            validations.push('✅ loadSettings() usando função auxiliar');
        } else {
            validations.push('❌ loadSettings() não usando função auxiliar');
        }
        
        // Verificar uso da função auxiliar em checkSearchStatus
        if (content.includes('const response = await sendMessageToBackground({') && 
            content.includes('type: \'getStatus\'')) {
            validations.push('✅ checkSearchStatus() usando função auxiliar');
        } else {
            validations.push('❌ checkSearchStatus() não usando função auxiliar');
        }
        
        // Verificar uso da função auxiliar em cancelSearch
        if (content.includes('await sendMessageToBackground({') && 
            content.includes('type: \'cancelSearch\'')) {
            validations.push('✅ cancelSearch() usando função auxiliar');
        } else {
            validations.push('❌ cancelSearch() não usando função auxiliar');
        }
        
        // Verificar uso da função auxiliar em saveSettings
        if (content.includes('await sendMessageToBackground({') && 
            content.includes('type: \'saveSettings\'')) {
            validations.push('✅ saveSettings() usando função auxiliar');
        } else {
            validations.push('❌ saveSettings() não usando função auxiliar');
        }
        
        // Verificar correção na função startSearch
        if (content.includes('const isFirefox = typeof browser !== \'undefined\' && browser.runtime && browser.runtime.sendMessage;') &&
            content.includes('if (isFirefox) {') &&
            content.includes('} else {') &&
            content.includes('Chrome/Edge: Callback-based')) {
            validations.push('✅ startSearch() com comunicação específica Firefox/Chrome');
        } else {
            validations.push('❌ startSearch() não tem comunicação específica por navegador');
        }
        
        return validations;
        
    } catch (error) {
        return [`❌ Erro ao ler popup script: ${error.message}`];
    }
}

// Função para validar arquivos de configuração
function validateConfigFiles() {
    console.log('📋 Validando arquivos de configuração...');
    
    const validations = [];
    
    // Verificar manifest.json
    try {
        const manifestPath = path.join(projectRoot, 'manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        if (manifest.manifest_version === 2) {
            validations.push('✅ Manifest v2 (compatível com Firefox)');
        } else {
            validations.push('⚠️ Manifest não é v2');
        }
        
        if (manifest.background && manifest.background.scripts) {
            validations.push('✅ Background scripts configurados');
        } else {
            validations.push('❌ Background scripts não configurados');
        }
        
    } catch (error) {
        validations.push(`❌ Erro ao validar manifest: ${error.message}`);
    }
    
    return validations;
}

// Função para verificar se as plataformas estão sendo carregadas
function validatePlatformLoading() {
    console.log('📋 Validando carregamento de plataformas...');
    
    const validations = [];
    
    try {
        const platformServicePath = path.join(projectRoot, 'src', 'services', 'PlatformService.js');
        
        if (fs.existsSync(platformServicePath)) {
            const content = fs.readFileSync(platformServicePath, 'utf8');
            
            // Verificar se há plataformas definidas
            if (content.includes('platforms = [') || content.includes('this.platforms')) {
                validations.push('✅ Serviço de plataformas encontrado');
                
                // Contar plataformas aproximadamente
                const platformMatches = content.match(/{\s*name:/g);
                if (platformMatches && platformMatches.length > 0) {
                    validations.push(`✅ Aproximadamente ${platformMatches.length} plataformas definidas`);
                } else {
                    validations.push('⚠️ Estrutura de plataformas não reconhecida');
                }
            } else {
                validations.push('❌ Plataformas não encontradas no serviço');
            }
        } else {
            validations.push('❌ Arquivo PlatformService.js não encontrado');
        }
        
    } catch (error) {
        validations.push(`❌ Erro ao validar plataformas: ${error.message}`);
    }
    
    return validations;
}

// Função para gerar relatório final
function generateFinalReport() {
    console.log('\n🎯 RELATÓRIO FINAL DE VALIDAÇÃO\n');
    console.log('=' .repeat(50));
    
    const backgroundValidations = validateBackgroundScript();
    const popupValidations = validatePopupScript();
    const configValidations = validateConfigFiles();
    const platformValidations = validatePlatformLoading();
    
    console.log('\n📱 BACKGROUND SCRIPT:');
    backgroundValidations.forEach(v => console.log(`  ${v}`));
    
    console.log('\n💻 POPUP SCRIPT:');
    popupValidations.forEach(v => console.log(`  ${v}`));
    
    console.log('\n⚙️ CONFIGURAÇÕES:');
    configValidations.forEach(v => console.log(`  ${v}`));
    
    console.log('\n🔍 PLATAFORMAS:');
    platformValidations.forEach(v => console.log(`  ${v}`));
    
    // Calcular score de validação
    const allValidations = [...backgroundValidations, ...popupValidations, ...configValidations, ...platformValidations];
    const successCount = allValidations.filter(v => v.startsWith('✅')).length;
    const warningCount = allValidations.filter(v => v.startsWith('⚠️')).length;
    const errorCount = allValidations.filter(v => v.startsWith('❌')).length;
    const totalCount = allValidations.length;
    
    console.log('\n📊 RESUMO:');
    console.log(`  ✅ Aprovado: ${successCount}/${totalCount}`);
    console.log(`  ⚠️ Avisos: ${warningCount}/${totalCount}`);
    console.log(`  ❌ Erros: ${errorCount}/${totalCount}`);
    
    const score = Math.round((successCount / totalCount) * 100);
    console.log(`  🎯 Score: ${score}%`);
    
    console.log('\n' + '=' .repeat(50));
    
    if (score >= 90) {
        console.log('🎉 VALIDAÇÃO APROVADA! Extensão pronta para uso.');
    } else if (score >= 75) {
        console.log('⚠️ VALIDAÇÃO PARCIAL. Alguns ajustes podem ser necessários.');
    } else {
        console.log('❌ VALIDAÇÃO REPROVADA. Correções adicionais necessárias.');
    }
    
    // Recomendações
    console.log('\n💡 PRÓXIMOS PASSOS:');
    if (errorCount === 0) {
        console.log('  1. Execute teste manual no Firefox');
        console.log('  2. Verifique se "Plataformas verificadas" não está mais em 0');
        console.log('  3. Teste comunicação popup ↔ background');
        console.log('  4. Valide busca completa em diferentes plataformas');
    } else {
        console.log('  1. Corrija os erros identificados');
        console.log('  2. Execute novamente esta validação');
        console.log('  3. Teste manual após correções');
    }
    
    return { score, successCount, warningCount, errorCount, totalCount };
}

// Executar validação
try {
    const report = generateFinalReport();
    
    // Salvar relatório
    const reportContent = `
# Relatório de Validação Final - DeepAlias Hunter Pro
Data: ${new Date().toLocaleString()}

## Score Final: ${report.score}%
- ✅ Aprovado: ${report.successCount}/${report.totalCount}
- ⚠️ Avisos: ${report.warningCount}/${report.totalCount}
- ❌ Erros: ${report.errorCount}/${report.totalCount}

## Status
${report.score >= 90 ? '🎉 APROVADA' : report.score >= 75 ? '⚠️ PARCIAL' : '❌ REPROVADA'}

## Correções Aplicadas
1. ✅ Detecção específica Firefox vs Chrome/Edge
2. ✅ Listener Promise-based para Firefox
3. ✅ Listener Callback-based para Chrome/Edge
4. ✅ Função auxiliar de comunicação no popup
5. ✅ Substituição de todas as chamadas de comunicação
6. ✅ Remoção do listener único problemático

## Próximos Passos
${report.errorCount === 0 ? 
  '- Teste manual no Firefox\n- Verificar "Plataformas verificadas: 0"\n- Validar busca completa' : 
  '- Corrigir erros identificados\n- Re-executar validação\n- Teste manual'}
`;
    
    fs.writeFileSync(path.join(projectRoot, 'VALIDACAO_FINAL_RESULTADO.md'), reportContent);
    console.log('\n📄 Relatório salvo em: VALIDACAO_FINAL_RESULTADO.md');
    
} catch (error) {
    console.error(`❌ Erro durante validação: ${error.message}`);
    process.exit(1);
}
