# Documentação da Extensão DeepAlias Hunter Pro (Aprimorada)

## Visão Geral

DeepAlias Hunter Pro é uma extensão avançada para Firefox e Microsoft Edge que permite buscar usernames, nomes reais e termos específicos em diversas plataformas online, incluindo sites de conteúdo adulto, fóruns, redes sociais e deep web.

Esta versão 4.0 foi completamente reescrita com uma arquitetura modular e incorpora diversas melhorias técnicas, novas fontes e estratégias avançadas de detecção, conforme solicitado.

## Estrutura do Projeto

```
DeepAliasHunterPro_Enhanced/
├── manifest.json                 # Manifest para Firefox (V3)
├── manifest_edge.json            # Manifest para Microsoft Edge (V3)
├── src/
│   ├── assets/
│   │   ├── css/
│   │   │   └── popup.css         # Estilos do popup
│   │   ├── js/
│   │   │   ├── popup.js          # Script do popup
│   │   │   └── options.js        # Script da página de opções
│   │   └── img/                  # Ícones e imagens
│   ├── background/
│   │   └── background.js         # Script de background
│   ├── popup/
│   │   └── popup.html            # HTML do popup
│   ├── options/
│   │   └── options.html          # HTML da página de opções
│   ├── help/
│   │   └── help.html             # Manual do usuário
│   ├── about/
│   │   └── about.html            # Página sobre a extensão
│   ├── services/
│   │   ├── PlatformService.js    # Gerenciamento de plataformas
│   │   ├── StorageService.js     # Armazenamento e cache
│   │   ├── SearchEngine.js       # Motor de busca principal
│   │   ├── PlatformChecker.js    # Verificação de plataformas
│   │   ├── UsernameVariator.js   # Geração de variações
│   │   ├── RiskScoreCalculator.js # Cálculo de risco
│   │   ├── ProxyManager.js       # Gerenciamento de proxies
│   │   ├── UserAgentRotator.js   # Rotação de user-agents
│   │   ├── TorConnector.js       # Conexão com rede Tor
│   │   ├── ImageAnalyzer.js      # Análise de imagens
│   │   ├── ForumCrawler.js       # Crawler especializado para fóruns
│   │   └── OSINTConnector.js     # Integração com serviços OSINT
│   ├── strategies/
│   │   ├── PlatformCheckStrategy.js        # Interface de estratégia
│   │   ├── HttpStatusCheckStrategy.js      # Estratégia de verificação HTTP
│   │   ├── ContentCheckStrategy.js         # Estratégia de verificação de conteúdo
│   │   └── PlatformCheckStrategyFactory.js # Fábrica de estratégias
│   └── utils/
│       ├── EventBus.js           # Sistema de eventos centralizado
│       ├── Logger.js             # Sistema de log estruturado
│       └── DependencyContainer.js # Container de injeção de dependências
```

## Principais Melhorias Implementadas

### 1. Arquitetura e Performance

- **Arquitetura Modular**: Completa separação de responsabilidades com padrão MVC
- **Injeção de Dependências**: Sistema de DI para facilitar testes e manutenção
- **Event Bus**: Sistema de eventos para comunicação desacoplada entre módulos
- **Estratégias de Verificação**: Padrão Strategy para diferentes métodos de verificação
- **Paralelização Inteligente**: Controle de concorrência para evitar bloqueios
- **Cache com TTL**: Armazenamento eficiente de resultados com tempo de expiração

### 2. Segurança e Privacidade

- **Rotação de Proxy**: Suporte a múltiplos proxies para evitar bloqueios
- **Rotação de User-Agent**: Alternância entre diferentes identificações de navegador
- **Integração Tor**: Acesso seguro a conteúdo na deep web e dark web
- **Sanitização de Dados**: Proteção contra XSS e injeção de código

### 3. Novas Fontes e Plataformas

- **Expansão de Categorias**: Novas categorias especializadas (cam, escort, portfolio, etc.)
- **Plataformas de Conteúdo Adulto**: Cobertura ampliada de sites adultos e fóruns
- **Fontes Deep Web**: Acesso a sites .onion e fóruns privados
- **Plataformas de Imagem**: Sites de compartilhamento de imagens e portfólios

### 4. Detecção Avançada

- **Análise de Imagem**: Detecção de conteúdo sensível em imagens
- **Variações Inteligentes**: Algoritmo aprimorado para gerar variações de username
- **Pontuação de Risco**: Sistema multifatorial para avaliar o risco de cada resultado
- **Redução de Falsos Positivos**: Verificação em múltiplas etapas para maior precisão

### 5. Integração OSINT

- **Have I Been Pwned**: Verificação de vazamentos de dados
- **DeHashed**: Busca em bases de credenciais vazadas
- **Intelligence X**: Acesso a dados de inteligência de código aberto
- **Sherlock**: Implementação local para verificação de usernames

## Instruções de Instalação

### Firefox

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

### Análise de Imagem

Para detectar conteúdo sensível em imagens encontradas:

1. Nas configurações, habilite "Análise de Imagem"
2. Selecione um provedor de API (Sightengine recomendado)
3. Configure sua chave de API para o serviço selecionado
4. Durante as buscas, a extensão analisará automaticamente imagens encontradas

### Integração com Serviços OSINT

Para verificar vazamentos de dados e presença em bases de dados comprometidas:

1. Nas configurações, habilite "Integração OSINT"
2. Configure as chaves de API para os serviços desejados
3. Durante as buscas, a extensão consultará automaticamente esses serviços

## Documentação Completa

Para informações mais detalhadas sobre o uso da extensão, consulte o manual do usuário incluído na extensão, acessível através do link "Ajuda" no popup da extensão.

## Aviso Legal

Esta extensão foi desenvolvida exclusivamente para fins legítimos de investigação, proteção de identidade e verificação de uso não autorizado de dados pessoais. O uso desta ferramenta para stalking, assédio, invasão de privacidade ou qualquer atividade ilegal é estritamente proibido.

O usuário é o único responsável pelo uso ético e legal desta extensão, em conformidade com todas as leis e regulamentos aplicáveis.
