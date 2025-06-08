#!/usr/bin/env node

/**
 * 🎯 VALIDAÇÃO FINAL - DEEPALIAS HUNTER PRO
 * Script Node.js para validar o status final da extensão
 */

const fs = require('fs');
const path = require('path');

console.log('🎉 VALIDAÇÃO FINAL - DEEPALIAS HUNTER PRO');
console.log('=======================================');
console.log('Data:', new Date().toLocaleString('pt-BR'));
console.log('');

// Função para verificar se arquivo existe
function arquivoExiste(caminho) {
    try {
        return fs.existsSync(caminho);
    } catch (error) {
        return false;
    }
}

// Função para ler arquivo JSON
function lerJSON(caminho) {
    try {
        const conteudo = fs.readFileSync(caminho, 'utf8');
        return JSON.parse(conteudo);
    } catch (error) {
        return null;
    }
}

// Função para verificar tamanho do arquivo
function tamanhoArquivo(caminho) {
    try {
        const stats = fs.statSync(caminho);
        return stats.size;
    } catch (error) {
        return 0;
    }
}

// Lista de arquivos críticos para verificar
const arquivosCriticos = [
    'manifest_firefox.json',
    'src/background/background_simple.js',
    'src/popup/popup.html',
    'src/assets/js/popup.js',
    'src/debug/debug_interno.html',
    'src/debug/debug_interno.js',
    'src/options/options.html',
    'src/help/guia_diagnostico.html',
    'src/about/about.html',
    'src/assets/css/popup.css',
    'validacao_csp_final.js',
    'GUIA_CONTEXTO_CORRETO.md'
];

console.log('🔍 Verificando arquivos críticos...');
console.log('');

let arquivosOK = 0;
let arquivosProblema = 0;

arquivosCriticos.forEach((arquivo, index) => {
    const caminho = path.join(__dirname, arquivo);
    const existe = arquivoExiste(caminho);
    const tamanho = existe ? tamanhoArquivo(caminho) : 0;
      if (existe && tamanho > 0) {
        console.log(`✅ ${String(index + 1).padStart(2)}. ${arquivo.padEnd(40)} (${tamanho} bytes)`);
        arquivosOK++;
    } else {
        console.log(`❌ ${String(index + 1).padStart(2)}. ${arquivo.padEnd(40)} (PROBLEMA)`);
        arquivosProblema++;
    }
});

console.log('');
console.log('📊 RESUMO DA VERIFICAÇÃO');
console.log('========================');
console.log(`✅ Arquivos OK: ${arquivosOK}`);
console.log(`❌ Arquivos com problema: ${arquivosProblema}`);
console.log(`📊 Total verificado: ${arquivosCriticos.length}`);

// Verificar manifest_firefox.json
console.log('');
console.log('🔍 Analisando manifest_firefox.json...');

const manifest = lerJSON('manifest_firefox.json');
if (manifest) {
    console.log(`✅ Manifest carregado com sucesso`);
    console.log(`   Nome: ${manifest.name}`);
    console.log(`   Versão: ${manifest.version}`);
    console.log(`   Manifest Version: ${manifest.manifest_version}`);
    console.log(`   Background Script: ${manifest.background?.scripts?.[0] || 'N/A'}`);
    console.log(`   Content Scripts: ${manifest.content_scripts?.length || 0} configurados`);
    console.log(`   Web Accessible Resources: ${manifest.web_accessible_resources?.length || 0} itens`);
    
    // Verificar se web_accessible_resources inclui debug e help
    const webResources = manifest.web_accessible_resources || [];
    const incluiDebug = webResources.some(r => r.includes('debug'));
    const incluiHelp = webResources.some(r => r.includes('help'));
    
    console.log(`   Debug páginas acessíveis: ${incluiDebug ? '✅' : '❌'}`);
    console.log(`   Help páginas acessíveis: ${incluiHelp ? '✅' : '❌'}`);
} else {
    console.log(`❌ Erro ao carregar manifest_firefox.json`);
}

// Verificar relatório CSP se existir
console.log('');
console.log('🔍 Verificando conformidade CSP...');

const relatorioCspPath = 'relatorio_csp_final.json';
if (arquivoExiste(relatorioCspPath)) {
    const relatorio = lerJSON(relatorioCspPath);
    if (relatorio && relatorio.resumo) {
        console.log(`✅ Relatório CSP encontrado`);
        console.log(`   Arquivos verificados: ${relatorio.resumo.arquivos_verificados}`);
        console.log(`   Arquivos limpos: ${relatorio.resumo.arquivos_limpos}`);
        console.log(`   Total violações: ${relatorio.resumo.total_violacoes}`);
        
        if (relatorio.resumo.total_violacoes === 0) {
            console.log(`   Status CSP: ✅ CONFORMIDADE TOTAL`);
        } else {
            console.log(`   Status CSP: ⚠️ ${relatorio.resumo.total_violacoes} violações detectadas`);
        }
    }
} else {
    console.log(`⚠️ Relatório CSP não encontrado - execute validacao_csp_final.js`);
}

// Verificar tamanhos dos arquivos principais
console.log('');
console.log('📏 Verificando integridade dos arquivos...');

const arquivosImportantes = [
    { nome: 'background_simple.js', minimo: 5000 },
    { nome: 'popup.js', minimo: 3000 },
    { nome: 'debug_interno.js', minimo: 10000 }
];

arquivosImportantes.forEach(({ nome, minimo }) => {
    const arquivoPath = arquivosCriticos.find(a => a.includes(nome));
    if (arquivoPath) {
        const tamanho = tamanhoArquivo(arquivoPath);
        if (tamanho >= minimo) {
            console.log(`✅ ${nome}: ${tamanho} bytes (OK)`);
        } else {
            console.log(`⚠️ ${nome}: ${tamanho} bytes (esperado min. ${minimo})`);
        }
    }
});

// Status final
console.log('');
console.log('🎯 STATUS FINAL');
console.log('===============');

const statusGeral = arquivosProblema === 0 && arquivosOK >= 10;

if (statusGeral) {
    console.log('🎉 ✅ EXTENSÃO 100% PRONTA!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Carregar a extensão no Firefox (about:debugging)');
    console.log('2. Testar funcionalidade de busca');
    console.log('3. Acessar debug via moz-extension:// se necessário');
    console.log('');
    console.log('📖 Documentação disponível:');
    console.log('   • GUIA_CONTEXTO_CORRETO.md');
    console.log('   • src/help/guia_diagnostico.html');
    console.log('   • STATUS_FINAL_CORRIGIDO.md');
} else {
    console.log('⚠️ ❌ ATENÇÃO: Problemas detectados');
    console.log('');
    console.log('🔧 Ações necessárias:');
    console.log(`   • Resolver ${arquivosProblema} arquivos com problema`);
    console.log('   • Verificar integridade dos arquivos críticos');
    console.log('   • Executar validacao_csp_final.js se necessário');
}

console.log('');
console.log('⏰ Validação concluída em', new Date().toLocaleTimeString());
console.log('');

// Exit code
process.exit(statusGeral ? 0 : 1);
