# V2 formal — Sprint 3, US-02 e US-03

## Resultado e condições da comparação

**105/105 testes aprovados em uma única tentativa, zero falhas**, quatro arquivos: configuração 19, e-mail 30, orquestração 16 e HTTP 40. Vitest 4.1.11, Node v24.21.0 e npm 11.19.0; exit 0; duração Vitest 2,33 s. A configuração própria coletou exclusivamente `test/sprint3-v2/*.spec.ts` enumerados explicitamente; não executou V1 nem testes dos colegas. Os quatro testes HTTP parametrizados por campo executam cinco requisições cada: a contagem 105 é de instâncias Vitest, não de requisições.

V2 foi derivada das cópias da V1, guiada pela matriz e pela análise formal. Não é uma nova geração independente. Produção fixada no SHA `9d328dc463f3e47588811a37eafece6f13f3f891`, na mesma branch/worktree da V1. `git diff --exit-code` inicial e final passou. Dependências não foram reinstaladas nem atualizadas; o lockfile e o lock instalado permaneceram idênticos antes/depois e a lista completa de versões diretas coincide com o log da V1.

Todos os artefatos dos manifestos da geração, execução V1 e análise formal foram conferidos antes da criação da V2. Ao fim, 166 arquivos protegidos foram comparados por hash, abrangendo as evidências originais, arquivos rastreados (inclusive produção, matriz e testes antigos), cópias executáveis V1 e lock instalado. Nenhum mudou. O resumo anterior é preservado integralmente antes do acréscimo.

## Desenho dos testes e mudanças justificadas

Os três testes da V1 foram copiados para `backend/test/sprint3-v2/`. A configuração do limiar permanece byte a byte igual. Não foram removidos casos: as sobreposições herdadas protegem pontos de entrada diferentes, e a matriz não justifica reduzir essa proteção nesta etapa. As mudanças são visíveis em `V1-para-V2.diff`:

- Orquestração: limites 0.799999/0.800001 substituídos por 0.7999/0.8001; contexto vazio passa a distância literal 0.1; resposta abaixo do limiar exige igualdade integral; contexto vazio exige setor, texto do e-mail e uma chamada ao gerador real.
- E-mail: cenário de brancos exige explicitamente os cinco marcadores e ausência de undefined/null, além do oráculo relacional herdado.
- Novo `conversa-http.spec.ts`: NestJS com AppModule, controller, OrchestrationService, FallbackService e AiService reais; mock apenas da API global fetch. Supertest envia requisições HTTP locais. Não se simulam as exceções NestJS: as traduções 503/504/502 são executadas pelo AiService de produção. A injeção do limiar pelo módulo também é utilizada.

Timeout usa `AbortSignal.timeout` real de 15 ms e uma promise de transporte que rejeita quando o sinal aborta. Há duas fases: aguardar fetch e aguardar JSON. A suíte observa `signal.aborted=true` e não depende de Sleep nem de servidor externo. JSON malformado usa `Response` com texto inválido; NaN/Infinity/-Infinity usam objeto decodificado simulado, pois esses números não são representáveis em JSON padrão. Esses cenários são distintos e estão identificados como tais.

O sucesso do POST mantém **HTTP 201**, padrão do NestJS nesse endpoint. A matriz US-02/03 não fixa HTTP 200 para sucesso; não houve mudança de produção nem expectativa ajustada após execução. Erros têm corpo exato (statusCode/message/error), sem fallback, setor ou template; o gerador não é chamado. As mensagens são conferidas contra literais seguros, e o corpo é inspecionado para excluir detalhes internos fictícios, stack, origem do ai-service e dados pessoais de teste.

Dados pessoais fornecidos devem constar do rascunho destinado ao estudante; sua ausência é exigida no corpo da consulta externa e nas respostas de erro. O teste CT-03.07 também injeta campos extras internos no retorno da busca e exige sua remoção da resposta pública. Todos os dados usados são sintéticos; não há credenciais reais.

## Cobertura comparável: mesmos três arquivos e denominadores

| Escopo original | V1 linhas | V2 linhas | V1 branches | V2 branches |
|---|---:|---:|---:|---:|
| fallback.config.ts | 9/9 | 9/9 | 7/7 | 7/7 |
| fallback.service.ts | 25/25 | 25/25 | 40/40 | 40/40 |
| orchestration.service.ts | 11/11 | 11/11 | 6/6 | 6/6 |
| **Total** | **45/45 (100%)** | **45/45 (100%)** | **53/53 (100%)** | **53/53 (100%)** |

Delta: **0 ponto percentual** em linhas e branches. Statements 47/47 e funções 7/7 também permanecem 100%. Essa comparação é calculada por seleção dos mesmos três caminhos no coverage-summary da execução ampliada V2; não há execução separada, mudança de instrumentação ou alteração dos denominadores. Valores e método estão em `comparacao-v1-v2.json`.

## Cobertura ampliada V2

| Arquivo | Linhas | Branches |
|---|---:|---:|
| Três arquivos originais | 45/45 | 53/53 |
| ai-service.service.ts | 36/40 (90%) | 55/60 (91,66%) |
| app.controller.ts | 4/5 (80%) | 0/0 (sem branches instrumentados) |
| **Total dos cinco arquivos** | **85/90 (94,44%)** | **108/113 (95,57%)** |

Statements 87/94 (92,55%); funções 16/18 (88,88%). A V1 não mediu AiService/controller; portanto não existe delta válido entre seus 100% e os 94,44% do novo denominador. A redução aparente vem da ampliação do escopo. Não foram acrescentados testes só para buscar 100%.

Linhas não exercitadas: `app.controller.ts:19` (GET getHello, fora de US-02/03); `ai-service.service.ts:50` (rejeição de consulta inválida), `:124` (timeout configurado inválido), `:144` e `:148` (origem inválida e conversão da exceção de configuração). Há cinco entradas de branches não cobertas no AiService. Esses caminhos e a configuração de origem/timeout não são os casos prioritários de falha técnica durante busca exigidos na matriz US-02/03. Validação de pergunta vazia e filtros reconhecidos é fronteira compartilhada com US-01 e não foi apresentada como coberta.

O relatório é restrito aos cinco arquivos declarados: módulos de composição são executados, mas não entram na instrumentação; AppService e main também não entram. Não representa cobertura de todo backend, UI, FastAPI ou RAG.

## Critérios de aceitação

| Critério | V1 formal | V2 | Evidência |
|---|---|---|---|
| CA-02.1 | Sim unitário | Sim | CT-02.01 literal no HTTP; resposta integral e ausência de geração de e-mail. |
| CA-02.2 | Sim unitário | Sim | CT-02.02/03 literais; flag, fontes, setor e estrutura do template. |
| CA-02.3 | Sim unitário | Sim | CT-02.04 vazio/espaços/quebra-tab a 0.1; rascunho e dados presentes. |
| CA-02.4 | Parcial | Sim no contrato NestJS com transporte controlado | CT-02.05/06/07; 503, 504 e 502 originados no AiService real, corpo seguro, ausência de fallback. |
| CA-03.1 | Sim unitário | Sim | HTTP estágio, dispensa, requerimento e segunda chamada; parametrizados originais mantidos. |
| CA-03.2 | Sim unitário | Sim | HTTP pedagógico → NEAP e variantes unitárias. |
| CA-03.3 | Sim unitário | Sim | HTTP pós-graduação → Secretaria de Pós-Graduação; variantes unitárias. |
| CA-03.4 | Sim unitário | Sim | HTTP declaração → padrão SecGrad. |
| CA-03.5 | Sim unitário | Sim | CT-03.06 com resposta integral no HTTP; ausências individuais e marcadores; brancos na unidade fortalecidos. |
| CA-03.6 | Parcial | Sim no contrato NestJS com transporte controlado | CT-03.07 textos; nome=123 e demais tipos inválidos nos quatro campos → HTTP 400 com mensagem segura antes de fetch. |

São dez critérios com evidência no escopo definido. Isso não é afirmação de completude de todos os comportamentos, combinações, segurança ou integração externa. A matriz original não foi preenchida/alterada; esta tabela e o CSV são a avaliação externa.

## Rastreabilidade dos casos esperados

Arquivo `H` abaixo significa `conversa-http.spec.ts`. Os nomes parametrizados são preservados integralmente em `inventario-v2.csv`; títulos com %s/%j referem-se à declaração parametrizada.

| Caso | V1 | V2 | Teste H e obrigação verificada |
|---|---|---|---|
| CT-02.01 | Sim por partição / literal ausente | Sim | CT-02.01: usa o limite literal 0.7999 e preserva as fontes: distância 0.7999; HTTP 201; igualdade de resposta; sem gerarEmail. |
| CT-02.02 | Sim | Sim | CT-02.02: usa o limite literal 0.8 e preserva as fontes: true, setor, estrutura do template e fontes. |
| CT-02.03 | Sim por partição / literal ausente | Sim | CT-02.03: usa o limite literal 0.8001 e preserva as fontes: distância 0.8001; true, setor, template. |
| CT-02.04 | Sim por partição / literal ausente | Sim | CT-02.04: contexto %j com distância literal 0.1 entrega rascunho: vazio e brancos; 0.1; flag, setor, texto pessoal, template. |
| CT-02.05 | Parcial | Sim | CT-02.05: falha de transporte retorna 503 seguro sem fallback: fetch rejeita Error com detalhe interno; HTTP 503 e corpo literal seguro; gerador não chamado. |
| CT-02.06 | Não | Sim | CT-02.06: timeout real durante %s retorna 504 seguro: fetch e leitura JSON aguardam abort real de 15 ms; 504 e sem rascunho. |
| CT-02.07 | Não | Sim | CT-02.07: JSON textual malformado retorna 502 seguro; contrato com %s; distância não finita %s: JSON textual inválido; contexto/fontes ausentes; distância string; página 0; NaN e ±Infinity no objeto decodificado; 502 seguro. |
| CT-03.01 | Sim | Sim | CT-03.01: assunto estágio entrega setor SecGrad no HTTP: setor e corpo; demais palavras CA-03.1 requerimento/segunda chamada também exercitadas. |
| CT-03.02 | Sim | Sim | CT-03.02: assunto dispensa entrega setor SecGrad no HTTP: setor, assunto, estrutura de e-mail. |
| CT-03.03 | Sim | Sim | CT-03.03: assunto pedagógico entrega setor NEAP no HTTP: setor, assunto, estrutura de e-mail. |
| CT-03.04 | Sim | Sim | CT-03.04: assunto pós-graduação entrega setor Secretaria de Pós-Graduação no HTTP: setor, assunto, estrutura de e-mail. |
| CT-03.05 | Sim | Sim | CT-03.05: assunto declaração entrega setor SecGrad no HTTP: padrão; nenhum termo específico. |
| CT-03.06 | Parcial | Sim | CT-03.06: fallback sem dados opcionais entrega os cinco marcadores no HTTP: igualdade integral de resposta e template; sem undefined/null; defaults da consulta externa. |
| CT-03.07 | Sim | Sim | CT-03.07: preserva textos no rascunho e envia somente consulta à busca: todos textos; requisição externa exata sem pessoais; campos extras internos removidos do retorno. |
| CT-03.08 | Parcial | Sim | CA-03.6: tipos inválidos em nome retornam HTTP 400 seguro: nome=123 explicitamente no laço; também quatro campos × cinco tipos; sem fetch nem rascunho; mensagem literal. |

A V1 tinha 10 Sim por equivalência de partição, 3 Parcial e 2 Não (ou 7/6/2 exigindo entrada literal). A V2 verifica os **15 casos esperados**, com os valores literais e as obrigações HTTP. CT-03.08 usa o laço de campo nome com valor 123; é o mesmo caso aprovado, embora o título agrupe outros tipos. O CSV registra tanto caso quanto critério, nome e oráculo.

Os limites de contexto e pergunta com um caractere, página válida 1/inválida 0, dados_email ausente/lista/null e campos textuais mínimos também têm evidência. Curso/perfil com um caractere são exercícios da montagem do template pelo NestJS, não prova de que FastAPI reconhece esses rótulos. Não incluir esses testes na cobertura de US-01.

## Tentativas, falhas e integridade

Uma tentativa: preparação, execução e encerramento concluídos com exit 0. Nenhuma falha de compilação, ambiental ou funcional; nenhuma correção após execução; nenhuma expectativa relaxada. O arquivo `tentativa-01/execucao.json` preserva argv, CWD, horários, stdout e stderr completos, incluindo tempo e sumário Vitest. O JSON de resultados lista todos os testes. A configuração dessa tentativa e a cópia prévia da suíte são preservadas, além da primeira saída gerada antes da execução.

O status inicial tinha apenas `backend/test/sprint3-v1/` não rastreado; o final acrescenta `backend/test/sprint3-v2/`. Nenhum arquivo rastreado mudou. Não foram executados format, install, audit fix, build de produção, refatorações formais, commit, push, merge ou PR. O resumo é o único arquivo preexistente autorizado a receber um acréscimo, com seu conteúdo anterior arquivado.

## Limitações e próximo passo

- Transporte é simulado em fetch; não se mede DNS, sockets até FastAPI, comportamento real de cancelamento de rede, corpus, precisão semântica, segurança de infraestrutura ou envio de e-mail. Supertest usa o servidor HTTP local real do NestJS, com inicialização e fechamento controlados.
- Os casos mistos de prioridade herdados da V1 permanecem como testes de comportamento implementado. A matriz não define desempate entre palavras-chave simultâneas; isso depende de decisão humana antes de apresentá-lo como requisito. Não se criaram novos oráculos de prioridade. O setor padrão igual a SecGrad mantém limitação de poder de detecção de regras individuais com o mesmo resultado.
- Configuração inválida de origem/timeout, pergunta inválida, GET básico e demais partições US-01 ficam fora da comprovação completa desta V2. Não foram executados testes de mutação, carga ou integração externa. O timeout de 15 ms testa o sinal real, sem pretender estabelecer SLA de 15 ms para a aplicação.
- Checkboxes individuais da matriz continuam desmarcados, conforme ressalva documental da análise V1; a aprovação declarada e o documento foram preservados.

Próximo passo recomendado: revisão humana dos oráculos, rastreabilidade e evidências desta V2; decidir as prioridades de assunto e a necessidade de integração externa em etapa separada. Refatorações formais não foram iniciadas nem autorizadas por esta execução.

## Arquivos e reprodução

- Evidências: `/home/victor/codex-chatbot-handoff/evidencias-v2-formal-20261102T002856Z`.
- Suíte executável: `/home/victor/worktrees/cin-ds-chatbot-backend-v1-formal-20261101/backend/test/sprint3-v2` (três cópias derivadas e `conversa-http.spec.ts`, mais configuração própria).
- Cópia congelada da V2 antes de executar: `/home/victor/codex-chatbot-handoff/evidencias-v2-formal-20261102T002856Z/suite-v2-gerada-antes-execucao/`.
- Cópia da V1 usada como base: `/home/victor/codex-chatbot-handoff/evidencias-v2-formal-20261102T002856Z/copias-v1-base/` (original externo intacto).
- Diferenças: `/home/victor/codex-chatbot-handoff/evidencias-v2-formal-20261102T002856Z/V1-para-V2.diff`.
- Relatório HTML: `/home/victor/codex-chatbot-handoff/evidencias-v2-formal-20261102T002856Z/tentativa-01/coverage/index.html`.
- Cobertura JSON: `/home/victor/codex-chatbot-handoff/evidencias-v2-formal-20261102T002856Z/tentativa-01/coverage/coverage-summary.json` e `coverage-final.json`.
- Comando de execução (CWD `/home/victor/worktrees/cin-ds-chatbot-backend-v1-formal-20261101/backend`): `./node_modules/.bin/vitest run --config /home/victor/worktrees/cin-ds-chatbot-backend-v1-formal-20261101/backend/test/sprint3-v2/vitest.exec.config.mts --coverage`.
- Resultados: `/home/victor/codex-chatbot-handoff/evidencias-v2-formal-20261102T002856Z/tentativa-01/vitest-results.json`; comando/log completo: `/home/victor/codex-chatbot-handoff/evidencias-v2-formal-20261102T002856Z/tentativa-01/execucao.json`.
- Comparação: `/home/victor/codex-chatbot-handoff/evidencias-v2-formal-20261102T002856Z/comparacao-v1-v2.json`; rastreabilidade: `/home/victor/codex-chatbot-handoff/evidencias-v2-formal-20261102T002856Z/rastreabilidade-v1-v2.csv`; inventário: `/home/victor/codex-chatbot-handoff/evidencias-v2-formal-20261102T002856Z/inventario-v2.csv`.
- Metadados, hashes, ambientes e scripts: `baseline.json`, `PROCEDIMENTO.md`, `integridade-inicial.json`, `arquivos-protegidos.json`, `verificacao-final.json`, `SHA256SUMS`, `procedimento.py` e `procedimento-finalizacao.py`.
- Resumo atualizado: `/home/victor/codex-chatbot-handoff/RESUMO_PARA_CHATGPT.md`; conteúdo anterior: `/home/victor/codex-chatbot-handoff/evidencias-v2-formal-20261102T002856Z/RESUMO_ANTES.md`.

Para reproduzir, criar nova configuração com relatórios em uma nova pasta de tentativa; não executar o comando acima reutilizando os caminhos dos relatórios preservados. Não incluir automaticamente estas evidências externas em Git.
