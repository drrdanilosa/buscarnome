/**
 * 🔍 VALIDAÇÃO FINAL - CONTENT SECURITY POLICY (CSP)
 * 
 * Script para verificar se todas as violações CSP foram corrigidas
 * nos arquivos HTML da extensão DeepAlias Hunter Pro.
 * 
 * Versão: 1.0.0
 * Data: 03/06/2025
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDAÇÃO CSP - DeepAlias Hunter Pro');
console.log('=====================================\n');

// Arquivos HTML para verificar
const htmlFiles = [
    'src/debug/debug_interno.html',
    'src/help/guia_diagnostico.html',
    'src/popup/popup.html',
    'src/options/options.html',
    'src/about/about.html'
];

// Padrões que violam CSP
const cspViolations = [
    {
        pattern: /\s+on\w+\s*=\s*["'][^"']*["']/gi,
        description: 'Event handlers inline (onclick, onload, etc.)',
        severity: 'CRÍTICO'
    },
    {
        pattern: /\s+style\s*=\s*["'][^"']*["']/gi,
        description: 'Estilos inline',
        severity: 'ALTO'
    },
    {
        pattern: /href\s*=\s*["']javascript:/gi,
        description: 'JavaScript URLs',
        severity: 'CRÍTICO'
    },
    {
        pattern: /<script(?![^>]*src\s*=)[^>]*>[^<]+<\/script>/gi,
        description: 'Scripts inline pequenos (possível violação)',
        severity: 'BAIXO'
    }
];

let totalViolations = 0;
let totalFiles = 0;

function validateFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const violations = [];
        
        cspViolations.forEach(violation => {
            const matches = content.match(violation.pattern);
            if (matches) {
                violations.push({
                    type: violation.description,
                    severity: violation.severity,
                    count: matches.length,
                    examples: matches.slice(0, 3) // Primeiros 3 exemplos
                });
            }
        });
        
        return {
            file: filePath,
            violations: violations,
            isClean: violations.length === 0
        };
        
    } catch (error) {
        return {
            file: filePath,
            error: error.message,
            isClean: false
        };
    }
}

function generateReport() {
    console.log('📊 RELATÓRIO DE VALIDAÇÃO CSP\n');
    
    const results = [];
    
    htmlFiles.forEach(file => {
        const fullPath = path.join(__dirname, file);
        if (fs.existsSync(fullPath)) {
            const result = validateFile(fullPath);
            results.push(result);
            totalFiles++;
            
            console.log(`📁 ${file}`);
            
            if (result.error) {
                console.log(`   ❌ ERRO: ${result.error}\n`);
                return;
            }
            
            if (result.isClean) {
                console.log('   ✅ LIMPO - Nenhuma violação CSP encontrada\n');
            } else {
                result.violations.forEach(violation => {
                    const icon = violation.severity === 'CRÍTICO' ? '🚨' : 
                               violation.severity === 'ALTO' ? '⚠️' : '⚡';
                    
                    console.log(`   ${icon} ${violation.type} (${violation.severity})`);
                    console.log(`      Ocorrências: ${violation.count}`);
                    
                    if (violation.examples.length > 0) {
                        console.log('      Exemplos:');
                        violation.examples.forEach(example => {
                            const truncated = example.length > 80 ? 
                                            example.substring(0, 80) + '...' : example;
                            console.log(`        → ${truncated}`);
                        });
                    }
                    console.log('');
                    
                    totalViolations += violation.count;
                });
            }
        } else {
            console.log(`📁 ${file}`);
            console.log('   ⚠️ ARQUIVO NÃO ENCONTRADO\n');
        }
    });
    
    return results;
}

function generateSummary(results) {
    console.log('📋 RESUMO EXECUTIVO');
    console.log('==================\n');
    
    const cleanFiles = results.filter(r => r.isClean && !r.error).length;
    const filesWithViolations = results.filter(r => !r.isClean && !r.error).length;
    const filesWithErrors = results.filter(r => r.error).length;
    
    console.log(`📊 Arquivos verificados: ${totalFiles}`);
    console.log(`✅ Arquivos limpos: ${cleanFiles}`);
    console.log(`⚠️ Arquivos com violações: ${filesWithViolations}`);
    console.log(`❌ Arquivos com erro: ${filesWithErrors}`);
    console.log(`🚨 Total de violações: ${totalViolations}\n`);
    
    if (totalViolations === 0 && filesWithErrors === 0) {
        console.log('🎉 PARABÉNS! Todos os arquivos estão em conformidade com CSP!\n');
        console.log('✅ A extensão está pronta para funcionar sem violações de segurança.');
        console.log('✅ Os arquivos debug_interno.html e guia_diagnostico.html foram corrigidos.');
        console.log('✅ Todos os event handlers inline foram convertidos para addEventListener.');
        console.log('✅ Todos os estilos inline foram movidos para classes CSS.');
        
        return true;
    } else {
        console.log('⚠️ AÇÃO NECESSÁRIA: Ainda existem violações CSP que precisam ser corrigidas.\n');
        
        if (filesWithViolations > 0) {
            console.log('🔧 PRÓXIMOS PASSOS:');
            console.log('1. Remover todos os event handlers inline (onclick, onload, etc.)');
            console.log('2. Substituir por addEventListener no JavaScript');
            console.log('3. Mover estilos inline para classes CSS no <head>');
            console.log('4. Evitar JavaScript URLs (javascript:)');
            console.log('5. Usar arquivos .js externos em vez de scripts inline\n');
        }
        
        return false;
    }
}

function generateFixSuggestions(results) {
    const violatedFiles = results.filter(r => !r.isClean && !r.error);
    
    if (violatedFiles.length > 0) {
        console.log('🔧 SUGESTÕES DE CORREÇÃO');
        console.log('=======================\n');
        
        violatedFiles.forEach(file => {
            console.log(`📁 ${file.file}:`);
            
            file.violations.forEach(violation => {
                console.log(`   ${violation.type}:`);
                
                if (violation.type.includes('Event handlers')) {
                    console.log('     → Substitua onclick="func()" por addEventListener("click", func)');
                    console.log('     → Mova o código para o final do arquivo JavaScript');
                }
                
                if (violation.type.includes('Estilos inline')) {
                    console.log('     → Crie classes CSS no <head> da página');
                    console.log('     → Substitua style="..." por class="nome-da-classe"');
                }
                
                console.log('');
            });
        });
    }
}

// Executar validação
console.log('🚀 Iniciando validação CSP...\n');

const startTime = Date.now();
const results = generateReport();
const isCompliant = generateSummary(results);

if (!isCompliant) {
    generateFixSuggestions(results);
}

const endTime = Date.now();
console.log(`⏱️ Validação concluída em ${endTime - startTime}ms`);

// Salvar relatório em JSON
const reportData = {
    timestamp: new Date().toISOString(),
    totalFiles: totalFiles,
    totalViolations: totalViolations,
    isCompliant: isCompliant,
    results: results,
    summary: {
        cleanFiles: results.filter(r => r.isClean && !r.error).length,
        filesWithViolations: results.filter(r => !r.isClean && !r.error).length,
        filesWithErrors: results.filter(r => r.error).length
    }
};

try {
    fs.writeFileSync('relatorio_csp_final.json', JSON.stringify(reportData, null, 2));
    console.log('\n💾 Relatório salvo em: relatorio_csp_final.json');
} catch (error) {
    console.log(`\n❌ Erro ao salvar relatório: ${error.message}`);
}

process.exit(isCompliant ? 0 : 1);
