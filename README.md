# Multiple MCP Tools

Projeto de automacao e agentes com LangGraph, MCP tools, MongoDB e n8n. A aplicacao processa arquivos de vendas, gera relatorios, calcula metricas, identifica alertas e deixa o fluxo pronto para integrar notificacoes como e-mail, WhatsApp, Slack ou outros canais via n8n.

## Objetivo

O objetivo principal e demonstrar uma arquitetura de automacao com duas camadas:

- **LangGraph Agent**: fluxo com LLM e tools para tarefas abertas, como interpretar pedidos e acionar ferramentas.
- **n8n Automation Layer**: interface visual e operacional para o usuario final enviar arquivos, executar processos e ramificar a automacao conforme o resultado.

O caso de uso principal e:

```text
Usuario envia arquivo de vendas
  -> n8n recebe o upload
  -> API processa CSV/XLS/XLSX
  -> relatorio de vendas e gerado
  -> alertas sao avaliados
  -> n8n mostra o resultado e pode acionar notificacoes
```

## Principais Possibilidades

- Upload de arquivos de vendas via formulario n8n.
- Suporte a arquivos `.csv`, `.xlsx` e `.xls` para relatorio de vendas.
- Suporte generico a extracao de texto/metadados de `.csv`, `.pdf`, `.docx`, `.xlsx` e `.xls`.
- Geracao de relatorio com:
  - receita total;
  - ticket medio;
  - total de vendas;
  - quantidade de produtos unicos;
  - top produtos por receita;
  - receita por data;
  - alertas de negocio.
- Persistencia do relatorio em `reports/`.
- Workflows n8n importaveis para upload, extracao, chat e relatorio.
- Agent LangGraph com tools MCP, filesystem, MongoDB e extracao de documentos.

## Status Das Notificacoes

O projeto **ainda nao envia e-mails nem mensagens de WhatsApp automaticamente**.

Mas ele ja esta preparado para isso no n8n. O workflow de vendas possui um ponto claro de extensao:

```text
Has Alerts?
  -> Show Alerts
  -> Show OK
```

No ramo `Show Alerts`, voce pode adicionar nodes do n8n como:

- Gmail / SMTP / Outlook para e-mail;
- WhatsApp Cloud API via HTTP Request;
- Slack;
- Discord;
- Telegram;
- Notion;
- Google Sheets;
- qualquer CRM ou webhook externo.

Exemplo futuro:

```text
Sales Report Form
  -> Generate Sales Report
  -> Has Alerts?
      -> Send Email
      -> Send WhatsApp
      -> Save in Google Sheets
      -> Show Alerts
```

## Arquitetura

### Backend API

A API Fastify fica em:

```text
src/server.ts
```

Ela expoe endpoints para:

```text
POST /chat
POST /automation/chat
POST /automation/sales-report
POST /automation/sales-report/upload
POST /automation/document/extract
POST /automation/document/upload
```

O endpoint principal para usuario final e:

```text
POST /automation/sales-report/upload
```

Ele recebe upload multipart de arquivo de vendas e retorna o relatorio estruturado.

### n8n

O n8n e a camada visual. Os workflows importaveis ficam na raiz do projeto:

```text
n8n-workflow-sales-report-upload-form.json
n8n-workflow-document-upload-form.json
n8n-workflow-document-extraction.json
n8n-workflow-sales-report.json
n8n-workflow-langgraph-chat.json
```

O workflow recomendado para usuario final e:

```text
n8n-workflow-sales-report-upload-form.json
```

Fluxo:

```text
Sales Report Form
  -> Generate Sales Report
  -> Has Alerts?
  -> Show Alerts / Show OK
```

### LangGraph

O fluxo LangGraph fica em:

```text
src/graph/
```

Ele usa:

```text
intentNode -> agentNode
```

E recebe ferramentas registradas em:

```text
src/services/mcpService.ts
```

Tools disponiveis:

- `csv_to_json`
- `document_to_text`
- filesystem MCP tools
- MongoDB MCP tools

## SOLID e KISS

O projeto foi organizado para manter o codigo simples, extensivel e com responsabilidades claras.

### Single Responsibility

Cada classe tem uma responsabilidade principal:

```text
SalesCsvParser -> parse de CSV de vendas
SalesReportService -> metricas e alertas
SalesReportWriter -> persistencia do relatorio
DocumentExtractionService -> coordenacao da extracao de documentos
DocumentProcessorRegistry -> escolha do processor correto
CsvDocumentProcessor -> extracao CSV
PdfDocumentProcessor -> extracao PDF
DocxDocumentProcessor -> extracao DOCX
XlsxDocumentProcessor -> extracao Excel
```

### Open/Closed

Para adicionar um novo formato, como PowerPoint, a ideia e criar um novo processor:

```text
PptxDocumentProcessor
```

e registra-lo no container de documentos. Nao e necessario reescrever o fluxo principal.

### Interface Segregation

A interface de documentos e pequena:

```ts
export interface DocumentProcessor {
  readonly type: SupportedDocumentType;
  supports(input): boolean;
  extract(input): Promise<DocumentExtraction>;
}
```

### Dependency Inversion

O servidor recebe dependencias montadas por um container:

```text
src/container/applicationContainer.ts
```

E a camada de documentos e montada em:

```text
src/documents/documentContainer.ts
```

Isso deixa a criacao de objetos nas bordas e facilita testar/substituir implementacoes.

### KISS

Nao foi usado um framework pesado de injecao de dependencias. O projeto usa containers explicitos, simples e faceis de seguir.

## Requisitos

- Node.js `>=24.10.0`
- Docker Desktop
- GitHub CLI, apenas para publicar o repositorio
- Conta/OpenRouter API key, se for testar o agente com LLM
- LangSmith API key, se for usar tracing/Studio

## Configuracao

Copie o arquivo de exemplo:

```powershell
copy .env.example .env
```

Preencha:

```text
OPENROUTER_API_KEY=...
LANGSMITH_API_KEY=...
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=01-multiple-mcp-tools-template
```

Nunca commit o `.env`. Ele ja esta ignorado no `.gitignore`.

## Como Rodar

Instale as dependencias:

```powershell
npm.cmd install
```

Suba a infraestrutura:

```powershell
npm.cmd run docker:infra:up
```

Isso sobe:

```text
MongoDB        -> localhost:27017
Mongo Express  -> http://localhost:8081
n8n            -> http://localhost:5678
```

Suba a API:

```powershell
npm.cmd run api:serve
```

A API fica em:

```text
http://localhost:3000
```

## Como Testar Como Usuario Final

1. Abra o n8n:

```text
http://localhost:5678
```

2. Importe o workflow:

```text
n8n-workflow-sales-report-upload-form.json
```

3. Abra o node:

```text
Sales Report Form
```

4. Execute o formulario e envie um arquivo com as colunas:

```text
id, product, price, date
```

Voce pode usar:

```text
data/sales-complete.csv
```

5. Configure no formulario:

```text
Alertar se receita for menor que: 2000
Quantidade de top produtos: 3
```

6. Resultado esperado:

```text
Receita total: 1106.21
Alertas: receita abaixo do limite configurado
```

Se usar limite `100`, o fluxo deve seguir pelo caminho sem alertas.

## Scripts Uteis

```powershell
npm.cmd run api:serve
npm.cmd run sales:report
npm.cmd run documents:extract
npm.cmd run langgraph:serve
npm.cmd run docker:infra:up
npm.cmd run docker:infra:down
npm.cmd run docker:infra:logs
```

## Testes Manuais Rapidos

Gerar relatorio local sem n8n:

```powershell
npm.cmd run sales:report
```

Extrair documento local:

```powershell
npm.cmd run documents:extract
```

Testar upload via API:

```powershell
curl.exe -X POST `
  -F "file=@data/sales-complete.csv;type=text/csv" `
  -F "alertRevenueBelow=2000" `
  -F "topProductsLimit=3" `
  http://localhost:3000/automation/sales-report/upload
```

## Estrutura Principal

```text
src/
  container/
    applicationContainer.ts
  documents/
    processors/
    documentContainer.ts
    documentExtractionService.ts
    documentProcessorRegistry.ts
    types.ts
  graph/
  sales/
    salesAutomationService.ts
    salesCsvParser.ts
    salesFileParsers.ts
    salesReportService.ts
    salesReportWriter.ts
  services/
  tools/
  server.ts
```

## Proximos Passos Sugeridos

- Adicionar envio de e-mail no ramo de alertas do workflow n8n.
- Adicionar envio via WhatsApp Cloud API usando HTTP Request.
- Salvar historico de relatorios em MongoDB.
- Criar dashboard no n8n, Google Sheets ou outra ferramenta.
- Adicionar testes automatizados para parsers e alertas.
- Revisar `npm audit`, pois a cadeia atual reporta uma vulnerabilidade de alta severidade.

