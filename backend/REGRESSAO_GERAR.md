# Migração da regressão para busca e geração

A execução corrente passou a gerar uma resposta depois da recuperação documental. Os testes que esperavam apenas contexto não descreviam mais esse contrato. Não foi identificado defeito de produção nas 11 instâncias incompatíveis: as causas verificadas foram mocks incompletos e expectativas anteriores. Nenhuma alteração adicional de produção foi necessária nesta migração.

A V1 e a V2 acadêmica original, seus logs, hashes e resultados foram preservados. `test/sprint3-v2/` e `vitest.sprint3-v2.config.mts` continuam byte a byte iguais à baseline. A cópia congelada adicional da V2 está fora do Git, nas evidências desta etapa. Não interpretar a regressão derivada como nova medição acadêmica da V2.

## Identificação nominal das incompatibilidades

Os nomes abaixo são os das instâncias que falharam antes da migração. Os seis casos V2 foram adaptados somente em `test/regressao-gerar/`; seus originais continuam intactos.

| Arquivo original | Teste | Diagnóstico e ajuste |
| --- | --- | --- |
| conversa-http.spec.ts | US-02 e US-03 — contrato HTTP com AiService real e transporte simulado CT-02.01: usa o limite literal 0.7999 e preserva as fontes | Mock incompleto: JSON de busca em /gerar; sucesso agora inclui resposta. |
| conversa-http.spec.ts | US-02 e US-03 — contrato HTTP com AiService real e transporte simulado limite útil 1: pergunta e contexto de um caractere preservam resposta sem fallback | Mock incompleto: JSON de busca em /gerar; sucesso agora inclui resposta. |
| orchestration.spec.ts | US-02 — decisão de fallback mantém a resposta com evidência suficiente e não gera e-mail | Mock incompleto: busca sem geração. |
| orchestration.spec.ts | US-02 — decisão de fallback aceita uma distância imediatamente abaixo do limite | Mock incompleto: busca sem geração. |
| orchestration.spec.ts | US-02 — decisão de fallback respeita o limite injetado e preserva os dados retornados pela busca | Mock incompleto: busca sem geração. |
| orchestration.spec.ts | US-02 — decisão de fallback envia somente a consulta à busca, sem os dados pessoais do e-mail | Mock incompleto: busca sem geração. |
| src/orchestration/orchestration.service.spec.ts | retorna contexto para futura LLM abaixo do limite e não envia dados pessoais ao ai-service | Mock incompleto (provider sem gerarResposta) e expectativa antiga sem resposta. |
| test/app.e2e-spec.ts | retorna contexto e fontes, preserva filtros e não envia dados pessoais | Mock incompleto (somente busca); sucesso agora tem resposta e duas chamadas. |
| test/app.e2e-spec.ts | remove campos externos extras do HTTP com distância 0.2 e fallback false | Mock incompleto (JSON de busca para geração); mantém sanitização e acrescenta resposta. |
| test/app.e2e-spec.ts | aplica os padrões quando os filtros são omitidos | Mock incompleto (somente busca); mantém os padrões verificados na primeira chamada. |
| test/ai-service.e2e-spec.ts | orquestra a resposta HTTP com distância 0.4, contexto "Trecho normativo" e fallback false | Expectativa antiga: fontes vazias não sustentam geração. Sucesso recebe fonte fixture; caso novo separado exige fallback quando fontes estão vazias. Servidor distingue buscar/gerar. |

## Arquivos e rastreabilidade

- `test/regressao-gerar/`: quatro arquivos derivados dos quatro arquivos V2, com a mesma correspondência de nomes e 105 casos. `fallback-config.spec.ts` e `fallback-email.spec.ts` são cópias idênticas; os outros dois passam a fornecer geração e exigir `resposta` no sucesso. Mantêm limites literais, e-mail, fontes, privacidade e erros seguros.
- `src/orchestration/orchestration.service.spec.ts`: provider com geração e asserção exata de pergunta/contexto enviados, preservando a consulta e os dados pessoais locais.
- `test/app.e2e-spec.ts`: fetch distingue `/api/v1/buscar` e `/api/v1/gerar`, rejeita endpoints inesperados e devolve contratos próprios. Expectativas de sucesso incluem resposta; campos internos continuam proibidos.
- `test/ai-service.e2e-spec.ts`: servidor HTTP distingue os endpoints, verifica o corpo de cada chamada e usa fontes em sucesso. Novo caso de contexto sem fonte exige fallback e ausência de geração.
- `vitest.config.ts`: coleta src/test correntes e exclui explicitamente a V2 histórica. `package.json` e `scripts/test-v2-historica.sh`: comandos separados para regressão atual, geração e reprodução histórica.
- `src/ai-service/generation.service.spec.ts`, `test/generation-integration.spec.ts` e `test/generation-live.e2e-spec.ts`: testes próprios da integração. Nenhum modo legado de produção ou desvio para satisfazer regressões foi criado.

A correspondência arquivo original → arquivo derivado é direta: `test/sprint3-v2/<nome>` → `test/regressao-gerar/<nome>`. O manifesto externo `rastreabilidade-v2.json` registra SHA-256 dos dois lados. Os dois arquivos derivados de comportamento inalterado conservam o mesmo hash.

## Comandos e resultados desta entrega

Executar em `backend/`, com Node 24 e dependências instaladas:

```bash
npm test                  # 256/256 correntes
npm run test:regressao     # 105/105 derivados; NÃO são a V2 acadêmica original
npm run test:geracao       # 52/52
npm run test:e2e           # 34/34; 2 live opt-in pulados sem URLs
npm run lint
npm run build
npm run test:v2:historica  # V2 original em cópia temporária da baseline: 105/105
```

O comando histórico fixa `c1bfe72d275b371dcfd2527c700ad66092833834`, cria uma cópia via `git archive` em `/tmp`, instala pelo lockfile e executa a configuração V2 original com cobertura. Imprime o diretório para consultar resultados; não sobrescreve arquivos do checkout nem evidências anteriores. Requer o objeto Git da baseline, Node 24, npm e acesso ao registry/cache. A baseline contém BACK-REF-01; não é o snapshot original da Sprint 2. O resultado histórico formal original continua sendo aquele já congelado e documentado, não este novo ensaio de reprodução.

O ensaio HTTP real separado passou 2/2 com FastAPI mock/disabled. Apenas a recuperação foi controlada; não foram avaliados ChromaDB, corpus ou LLM real. O aviso de simulação foi exigido literalmente. Os processos foram encerrados.

Avisos herdados: vite-tsconfig-paths, lint String(url) na V2 histórica e cópia derivada, tsconfck obsoleto. A instalação da baseline reportou 17 vulnerabilidades preexistentes; dependências e lockfile não foram alterados. Não foi executado audit fix.

A primeira etapa de integração registrou V2 99/105 no código novo, npm test 249/256 e e2e 29/33. Esses resultados continuam válidos como registros daquela execução; os passes atuais pertencem às suítes migradas. V1/V2 formais originais e os denominadores acadêmicos anteriores não foram recalculados nem substituídos.
