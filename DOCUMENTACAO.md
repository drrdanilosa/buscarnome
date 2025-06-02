# Documentação da Extensão DeepAlias Hunter Pro (Versão 4.0 Aprimorada)

## Visão Geral

DeepAlias Hunter Pro é uma extensão avançada para Firefox e Microsoft Edge que permite buscar usernames, nomes reais e termos específicos em diversas plataformas online, incluindo sites de conteúdo adulto, fóruns, redes sociais e deep web.

Esta versão 4.0 foi completamente reescrita com uma arquitetura modular e incorpora diversas melhorias técnicas, novas fontes e estratégias avançadas de detecção, conforme solicitado.

## Principais Melhorias Implementadas

### 1. Expansão de Fontes e Plataformas
- **Lista ampliada de fóruns e comunidades**: Cobertura expandida para mais de 220 plataformas, com foco especial em fóruns onde conteúdo sensível é frequentemente compartilhado
- **Categorização detalhada**: Plataformas organizadas em categorias específicas (adulto, cam, escort, portfolio, imagens, etc.)
- **Palavras-chave expandidas**: Inclusão de termos e padrões de busca específicos do setor adulto e de compartilhamento de conteúdo

### 2. Redução de Falsos Positivos
- **Sistema de pontuação de confiança**: Algoritmo avançado que analisa múltiplos fatores para determinar a relevância dos resultados
- **Análise contextual**: Verificação do contexto em que os termos aparecem para evitar correspondências genéricas
- **Filtros inteligentes**: Eliminação automática de resultados com baixa probabilidade de relevância

### 3. Técnicas de Bypass para Restrições
- **Rotação de User-Agent**: Alternância automática entre diferentes identificações de navegador
- **Gerenciamento de Proxy**: Suporte a múltiplos proxies com rotação automática
- **Integração com Tor**: Acesso seguro a conteúdo na deep web e dark web
- **Manipulação de cabeçalhos**: Técnicas avançadas para contornar detecção de scraping
- **Proteção contra fingerprinting**: Métodos para evitar identificação do navegador

### 4. Compatibilidade Cross-Browser
- **Suporte nativo a Firefox e Edge**: Adaptação automática às APIs específicas de cada navegador
- **Compatibilidade com Manifest V2 e V3**: Funcionamento garantido em diferentes versões de manifest
- **Adaptadores de API**: Camada de abstração para uniformizar o acesso às APIs dos navegadores

### 5. Content Script Avançado
- **Detecção de usernames em páginas**: Identificação automática de possíveis usernames em páginas visitadas
- **Extração de imagens**: Coleta de URLs de imagens para análise posterior
- **Simulação de comportamento humano**: Técnicas para evitar detecção de automação

## Estrutura do Projeto

```
DeepAliasHunterPro_Enhanced/
├── manifest.json                 # Manifest para Firefox (V3)
├── manifest_edge.json            # Manifest para Microsoft Edge (V3)
├── src/
│   ├── assets/                   # Recursos estáticos
│   ├── background/               # Scripts de background
│   ├── content_scripts/          # Scripts injetados nas páginas
│   │   └── content.js            # Script principal de conteúdo
│   ├── popup/                    # Interface do popup
│   ├── options/                  # Página de configurações
│   ├── help/                     # Manual do usuário
│   ├── about/                    # Página sobre a extensão
│   ├── services/                 # Serviços principais
│   │   ├── PlatformService.js    # Gerenciamento de plataformas
│   │   ├── SearchEngine.js       # Motor de busca principal
│   │   ├── FalsePositiveReducer.js # Redução de falsos positivos
│   │   ├── BypassManager.js      # Gerenciamento de técnicas de bypass
│   │   └── ...                   # Outros serviços
│   ├── strategies/               # Estratégias de verificação
│   └── utils/                    # Utilitários
│       ├── BrowserAdapter.js     # Adaptador cross-browser
│       └── ...                   # Outros utilitários
```

## Instruções de Instalação

### Firefox (Prioridade)

1. Extraia o arquivo ZIP da extensão para uma pasta em seu computador
2. Abra o Firefox e digite `about:debugging` na barra de endereços
3. Clique em "Este Firefox" no menu lateral
4. Clique em "Carregar extensão temporária..."
5. Navegue até a pasta onde você extraiu a extensão e selecione o arquivo `manifest.json`
6. A extensão será carregada e aparecerá na lista de extensões temporárias

### Microsoft Edge

1. Extraia o arquivo ZIP da extensão para uma pasta em seu computador
2. **Importante**: Renomeie o arquivo `manifest_edge.json` para `manifest.json` (substituindo o existente)
3. Abra o Edge e digite `edge://extensions` na barra de endereços
4. Ative o "Modo de desenvolvedor" no canto inferior esquerdo
5. Clique em "Carregar sem pacote"
6. Navegue até a pasta onde você extraiu a extensão e selecione-a
7. A extensão será carregada e aparecerá na lista de extensões

## Uso Básico

1. Clique no ícone da extensão na barra de ferramentas do navegador
2. Digite o username ou termo que deseja buscar no campo de texto
3. (Opcional) Configure as opções avançadas de busca
4. Clique no botão "Buscar" para iniciar a pesquisa
5. Aguarde enquanto a extensão verifica as diversas plataformas
6. Analise os resultados encontrados, classificados por nível de risco
7. Exporte os resultados em JSON, CSV ou HTML se necessário

## Recursos Avançados

### Acesso à Deep Web via Tor

Para acessar sites na deep web e dark web (.onion):

1. Instale o Tor Browser (disponível em [torproject.org](https://www.torproject.org/))
2. Inicie o Tor Browser para que o serviço SOCKS esteja disponível
3. Nas configurações da extensão, habilite "Conexão Tor"
4. Verifique se o proxy está configurado corretamente (geralmente `socks5://127.0.0.1:9050`)
5. Teste a conexão usando o botão "Testar Conexão Tor"
6. Nas opções avançadas de busca, marque "Incluir deep/dark web (Tor)"

### Bypass de Restrições

Para contornar bloqueios e restrições de sites:

1. Nas configurações, habilite "Rotação de User-Agent" e "Rotação de Proxy"
2. Configure a lista de proxies no formato `host:porta` ou `host:porta:usuario:senha`
3. Habilite "Proteção WebRTC" e "Proteção Canvas" para evitar fingerprinting
4. Habilite "Spoofing de Referrer" para simular origem do tráfego
5. Ajuste o intervalo de rotação conforme necessário

### Redução de Falsos Positivos

Para melhorar a precisão dos resultados:

1. Nas configurações, ajuste o "Limiar de Confiança" (valores mais altos = menos falsos positivos)
2. Selecione categorias prioritárias para focar em plataformas mais relevantes
3. Utilize termos de busca específicos e evite nomes muito comuns
4. Analise a pontuação de confiança de cada resultado para avaliar sua relevância

## Documentação Completa

Para informações mais detalhadas sobre o uso da extensão, consulte o manual do usuário incluído na extensão, acessível através do link "Ajuda" no popup da extensão.

## Aviso Legal

Esta extensão foi desenvolvida exclusivamente para fins legítimos de investigação, proteção de identidade e verificação de uso não autorizado de dados pessoais. O uso desta ferramenta para stalking, assédio, invasão de privacidade ou qualquer atividade ilegal é estritamente proibido.

O usuário é o único responsável pelo uso ético e legal desta extensão, em conformidade com todas as leis e regulamentos aplicáveis.
