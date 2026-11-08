# Fechamento do backend da Sprint 3 - 08/11/2026

Rafael assumiu as pendências finais de Victor por acordo informado nesta conversa.
Base remota conferida: `7c85cf08a303d6c3298bc5fd4b54b92095918861` (PR #31 integrado).
Branch local: `fix/backend-fechamento-sprint3`. Sem alteração de UI, corpus ou V1/V2.

## Correção aplicada

Restaurado o contrato de origem do FastAPI em `AiService.getEndpoint`:
`AI_SERVICE_URL` é obrigatória; aceita origem HTTP(S) válida, com espaços externos
removidos e barra final opcional, sem credenciais, query, fragmento ou caminho adicional.
Removido o localhost implícito e restaurada a checagem da forma textual original:
o parser de URL sozinho normaliza `/path/..`, `?` e `#` vazios e não os rejeitava.

A mudança corrige as seis regressões introduzidas no ajuste do PR #29; não altera
o limiar, os templates ou a decisão de fallback. Não é uma terceira refatoração:
restaura comportamento funcional especificado e já testado. Nenhum teste foi apagado,
relaxado ou excluído da coleta por causa desta correção.

## Resultados medidos

| Execução | Resultado | Evidência |
|---|---|---|
| Recorte antes da mudança | 94 aprovados, 6 falhos, 100 | antes.json |
| Suíte corrente completa | 256/256 aprovados | unitarios.json |
| E2E, sem variáveis opt-in | 34 aprovados, 2 pulados, 0 falhos | e2e.json |
| Dois e2e opt-in, com FastAPI real | 2/2 aprovados | servicos-reais/live-opt-in.json |
| Ensaio separado com corpus e serviços reais | 10 chamadas HTTP verificadas | servicos-reais/integracao-real.json |
| Lint | exit 0, dois avisos herdados | verificacao.json |
| Build | exit 0 | verificacao.json |

O recorte antes usa `ai-service.service.spec.ts`, `generation.service.spec.ts` e
`generation-integration.spec.ts`. Esses mesmos arquivos estão na suíte de 256
aprovados depois; não somar os 100 aos 256. Os dois opt-in são os mesmos que foram
pulados na execução e2e geral; não contar como dois cenários novos do produto.
Os 10 HTTP são ensaio de integração, não testes V1/V2 nem benchmark semântico.

Os dois avisos de lint são `typescript/no-base-to-string` no `String(url)` dos
testes `test/regressao-gerar/conversa-http.spec.ts:347` e
`test/sprint3-v2/conversa-http.spec.ts:186`; os arquivos não foram modificados.
Vitest também informa aviso de descontinuação de vite-tsconfig-paths. Não se
alteraram dependências ou configuração para esconder esses avisos.

## O que a integração real comprovou

- Busca real nos dois processos FastAPI (mock e disabled), com fonte PPC de CC novo.
- Conversa pública com corpus real e retorno 201, fontes/páginas válidas e aviso mock.
- Consulta inválida retorna 400; geração com contexto vazio retorna 200/null.
- Fallback com minuta usando limiar **controlado zero apenas em processo temporário**.
  Isso exercita o ramo, não calibra o limiar 0,8 nem prova recusa de toda pergunta externa.
- Geração desabilitada retorna 503 seguro através do NestJS, sem fallback de conteúdo.
- Origem ausente, origem inválida e serviço inacessível retornam 503 seguro, sem minuta.
- Os testes existentes verificam 502 para retorno inválido e 504 para timeout, incluindo
  leitura do corpo. Não se usou lentidão real aleatória para comprovar timeout.

O ensaio não chama provedor externo, não automatiza navegador e não altera filtros,
documentos, índice ou o limiar permanente. Os serviços temporários foram encerrados.
Não houve nova ingestão: utilizou-se a coleção local validada com 21 documentos.

## Execução local correta (PowerShell)

Primeiro iniciar FastAPI com o ambiente Python ativado e base já ingerida:

```powershell
cd ai-service
$env:SECGRAD_GENERATION_MODE='mock'
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Em outro terminal, dentro de `backend`:

```powershell
$env:AI_SERVICE_URL='http://127.0.0.1:8000'
$env:AI_SERVICE_TIMEOUT_MS='30000'
npm run start:dev
```

O timeout de 30000 ms é ajuste de desenvolvimento para busca fria; o padrão continua
5000 ms por chamada, não um prazo global único. Arquivos `.env` não são carregados
automaticamente pelo NestJS. Não configurar endereço do ai-service com `/api/v1/buscar`:
o backend monta buscar/gerar a partir da origem. Em Docker, localhost é o próprio container.

503 não tem uma causa única. Identificar pela etapa/mensagem segura: configuração,
indisponibilidade de rede, ou geração desabilitada. 504 é timeout; 502 é retorno técnico
inválido. Para busca, HTTP upstream não bem-sucedido continua mapeado a 502; não foi
mudado esse contrato anterior. Para geração, HTTP upstream 503/504 é preservado como
503/504. Falha técnica não produz e-mail como se faltasse informação documental.

## Reprodução

Em `backend`, Node 24 e dependências do lockfile:

```powershell
npm ci
npm test
npm run test:e2e
npm run lint
npm run build
```

Os dois testes opt-in ficam pulados sem serviços/variáveis; para reproduzir todo o
ensaio, após build e ingestão, na raiz e com o Python do projeto ativado:

```powershell
python backend/scripts/verificar-integracao-real.py --saida docs/testes/ensaio-backend-novo
```

O script exige pasta nova, usa portas temporárias e encerra processos próprios em
sucesso ou falha. Registra comandos, respostas, hashes da produção e dois testes opt-in.
Asserções internas precisam estar habilitadas: executar normalmente, sem `python -O`.
O modelo de embeddings pode exigir download/cache no primeiro uso.

## Pendências fora deste fechamento

**Eric:** corrigir a preferência `contexto or resposta` e legenda apresentada como
trecho; executar benchmark com perguntas relevantes/fora de escopo e fontes corretas;
entregar terceira refatoração formal com ID, commit e V2 antes/depois. A evidência de
funcionamento do cliente/UI não é certificada por uma resposta HTTP de backend.

**Ricardo:** curadoria das cinco páginas sem texto, anos/perfis e fontes; registro de
dívidas e log de identificação consolidados. Se os PDFs mudarem, Rafael reingere e audita.

**Rafael:** publicar o fechamento e os PDFs revisados, incorporar terceiro item e
resultados do benchmark ao pacote final. Não precisa aguardar os colegas para publicar
esta correção. O limiar 0,8 continua provisório; não foi escolhido outro com um caso só.

**Victor (histórico):** se disponível, complementar o prompt original de melhoria V2 e
metadados de geração ausentes. Essa evidência não pode ser fabricada nem retrodatada;
a limitação permanece explícita. Pode revisar a descrição de BACK-REF-01 sem precisar
implementar nova funcionalidade para esse relatório.

LLM real, React, Keycloak/LDAP e implantação são requisitos gerais, não certificados
por este ensaio. Os históricos da Sprint 3 e os PDFs anteriores permanecem intactos.
