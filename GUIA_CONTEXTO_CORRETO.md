# 🔧 GUIA: Como Acessar Debug no Contexto Correto

## ❌ Problema Comum
```
Erro: API do browser não disponível
Ping falhou: API do browser não disponível
```

**Causa**: Interface executando fora do contexto privilegiado (`file://` ou `https://` ao invés de `moz-extension://`)

---

## ✅ MÉTODO 1: Via about:debugging (Recomendado)

### Passo-a-Passo:
1. **Abra o Firefox**
2. **Digite na barra de endereços**: `about:debugging#/runtime/this-firefox`
3. **Localize**: "DeepAlias Hunter Pro" na lista de extensões
4. **Clique em**: "Inspecionar" (próximo ao ícone da extensão)
5. **Nova aba abrirá** com URL similar a: `moz-extension://12345678-1234-5678-9abc-123456789abc/src/popup/popup.html`
6. **Modifique a URL** para: `moz-extension://12345678-1234-5678-9abc-123456789abc/src/debug/debug_interno.html`
7. **Pressione Enter**

### ✅ Confirmação de Sucesso:
- URL deve começar com `moz-extension://`
- Console não deve mostrar erros de "API não disponível"
- Testes de ping devem retornar `PONG`

---

## ✅ MÉTODO 2: Via Popup da Extensão

### Passo-a-Passo:
1. **Clique no ícone** da extensão DeepAlias Hunter Pro na barra de ferramentas
2. **Popup abrirá** com URL `moz-extension://...`
3. **Pressione F12** para abrir Developer Tools
4. **No console, execute**:
   ```javascript
   window.open('/src/debug/debug_interno.html', '_blank');
   ```
5. **Nova aba abrirá** no contexto correto

---

## ✅ MÉTODO 3: Via Script Automático

### Usando o arquivo `abrir_debug_correto.js`:
1. **Abra o popup** da extensão (ícone na barra)
2. **Pressione F12**
3. **No console, execute**:
   ```javascript
   // Cole e execute o conteúdo do arquivo abrir_debug_correto.js
   ```

---

## 🔍 Como Identificar o Contexto Correto

### ✅ CONTEXTO CORRETO (Funciona):
```
URL: moz-extension://12345678-1234-5678-9abc-123456789abc/src/debug/debug_interno.html
Protocolo: moz-extension://
APIs disponíveis: ✅ browser.runtime, browser.storage, etc.
```

### ❌ CONTEXTO INCORRETO (Falha):
```
URL: file:///C:/Users/.../debug_interno.html
URL: http://localhost/debug_interno.html
URL: https://exemplo.com/debug_interno.html
Protocolo: file://, http://, https://
APIs disponíveis: ❌ Não disponíveis
```

---

## 🎯 Testes para Confirmar Funcionamento

Execute estes comandos no console da interface de debug:

```javascript
// 1. Verificar contexto
console.log('Contexto:', window.location.protocol);
console.log('URL:', window.location.href);

// 2. Verificar APIs
console.log('browser disponível:', typeof browser !== 'undefined');
console.log('chrome disponível:', typeof chrome !== 'undefined');

// 3. Teste de comunicação simples
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
browserAPI.runtime.sendMessage({type: 'ping'})
  .then(response => console.log('✅ Ping OK:', response))
  .catch(error => console.log('❌ Ping Falhou:', error));
```

### ✅ Resultado Esperado:
```
Contexto: moz-extension:
URL: moz-extension://12345678-1234-5678-9abc-123456789abc/src/debug/debug_interno.html
browser disponível: true
✅ Ping OK: {pong: "background", timestamp: 1735870147000, browser: "firefox"}
```

---

## 🚨 Solução de Problemas

### Problema: "Extensão não encontrada em about:debugging"
**Solução**: 
1. Vá para `about:addons`
2. Verifique se a extensão está habilitada
3. Se não estiver, clique em "Habilitar"

### Problema: "Inspecionar não abre nada"
**Solução**:
1. Desabilite a extensão
2. Aguarde 2 segundos
3. Habilite novamente
4. Tente "Inspecionar" novamente

### Problema: "APIs ainda não disponíveis mesmo no contexto correto"
**Solução**:
1. Recarregue a extensão em `about:debugging`
2. Feche todas as abas relacionadas
3. Abra uma nova aba para `moz-extension://...`

---

## 💡 Dica Pro

**Crie um bookmark** com este código para abrir debug rapidamente:

```javascript
javascript:(function(){
  if(typeof browser !== 'undefined') {
    browser.tabs.create({url: browser.runtime.getURL('/src/debug/debug_interno.html')});
  } else {
    alert('Execute este bookmark a partir de uma página da extensão');
  }
})();
```

**Nome do bookmark**: "🔧 Debug DeepAlias"
