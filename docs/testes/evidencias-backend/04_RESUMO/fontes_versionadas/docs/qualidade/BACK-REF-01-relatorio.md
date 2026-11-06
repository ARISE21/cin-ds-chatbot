# BACK-REF-01 — primeira refatoração formal do backend

## Dívida e alteração

Dívida registrada em [BACK-REF-01-divida.md](BACK-REF-01-divida.md): duas condições adjacentes retornavam `SecGrad` em `FallbackService.identificarSetor`. A refatoração **Consolidate Conditional Expression** reúne as cinco verificações em um único `if` com OR, seguido de um retorno. Foram removidos um if e um retorno duplicados, sem funções auxiliares, tabelas, novas dependências ou regras.

Para condições A e B, `if (A) return S; if (B) return S;` equivale a `if (A || B) return S;`. A ordem de `includes` e seu curto-circuito foram preservados; são verificações puras sobre a mesma string em minúsculas. Os ramos NEAP, pós-graduação e padrão permanecem na mesma posição. Mensagens, e-mail, validações, limiar e contrato público não mudaram. Assuntos mistos mantêm o comportamento herdado, sem estabelecer novos requisitos de prioridade.

O único arquivo de produção alterado é `backend/src/orchestration/fallback.service.ts`. O [diff](BACK-REF-01-evidencias/BACK-REF-01.diff) contém exclusivamente essa consolidação. Não houve integração de gerar, mudanças em FastAPI/Streamlit, outras refatorações ou alterações de testes.

## Isolamento, versões e integridade

- Baseline anterior: `9d328dc463f3e47588811a37eafece6f13f3f891`.
- Branch: `refactor/backend-back-ref-01-20261102t003619z`.
- Worktree exclusivo: `/home/victor/worktrees/cin-ds-chatbot-back-ref-01-20261102T003619Z`.
- Evidências externas novas: `/home/victor/codex-chatbot-handoff/refatoracao-BACK-REF-01-20261102T003619Z`.
- Dependências copiadas fisicamente da instalação V2, incluindo links internos de node_modules; sem npm install nem alteração do lockfile. Node v24.21.0, npm 11.19.0, Vitest/coverage-v8 4.1.11.
- Quatro arquivos V2 copiados byte a byte da saída congelada, conferidos contra a suíte executável original. V1 e V2 originais, relatórios, logs e hashes foram preservados; todos os manifestos antigos passaram.
- Antes e depois usam exatamente os mesmos 105 testes e a mesma configuração (hashes em estado-versao.json); apenas `BACK_REF_EVIDENCE_DIR` varia para impedir sobrescrita de resultados. A configuração altera a raiz para o novo worktree e mantém os cinco arquivos de produção instrumentados na V2.

O SHA HEAD durante o teste posterior ainda é o baseline, pois a mudança não estava commitada. Para identificar precisamente a versão testada, registram-se o diff e o hash do arquivo: anterior `550ff2e4f5b41aeebce1c85b5b78e6d572bdef0cf07d78b4a7cc422c6c8848f1`; posterior `f05347eeb2f7b0a0ed215592958d7862acd308e327cb093ef5f5e527beab8444`. Após todos os checks aprovados, será criado um único commit `BACK-REF-01`; seu SHA final será registrado no handoff externo e poderá ser consultado pelo histórico desta branch. Isso evita atribuir ao baseline o conteúdo modificado.

## Resultados antes e depois

| Verificação | Antes | Depois |
|---|---|---|
| V2 exclusiva | 105/105, 4 arquivos, exit 0 | 105/105, 4 arquivos, exit 0 |
| Cobertura: três arquivos originais, linhas | 45/45 (100%) | 43/43 (100%) |
| Cobertura: três arquivos originais, branches | 53/53 (100%) | 51/51 (100%) |
| Cobertura: cinco arquivos V2, linhas | 85/90 (94,44%) | 83/88 (94,31%) |
| Cobertura: cinco arquivos V2, branches | 108/113 (95,57%) | 106/111 (95,49%) |
| Testes unitários existentes | não reexecutados antes | 99/99, 5 arquivos, exit 0 |
| Testes e2e existentes | não reexecutados antes | 33/33, 2 arquivos, exit 0 |
| Lint do backend, inclusive V2 | não reexecutado antes | exit 0; um aviso em teste V2 intacto |
| Build NestJS | não reexecutado antes | exit 0 |
| git diff --check | — | exit 0 |

A V2 anterior reproduziu as métricas da V2 formal original: 85/90 linhas e 108/113 branches no escopo ampliado. A V2 posterior cobre todas as linhas/branches dos três arquivos de orquestração/fallback. A consolidação reduz o próprio denominador: `fallback.service.ts` passa de 25/25 linhas e 40/40 branches para 23/23 e 38/38. Os outros quatro arquivos medidos mantêm as contagens. Há as mesmas cinco linhas e cinco entradas de branch descobertas fora do escopo original; a pequena redução percentual ampliada não é perda de testes nem cobertura de um caminho antes exercitado. Não se força denominador igual após transformação estrutural.

Statements ampliados: antes 87/94 (92,55%), depois 85/92 (92,39%). Funções ampliadas permanecem 16/18 (88,88%). As coberturas detalhadas e seus denominadores estão em [comparacao-cobertura.json](BACK-REF-01-evidencias/comparacao-cobertura.json).

As regressões usam seleção explícita de todos os arquivos de teste rastreados (cinco unitários e dois e2e), com as configurações originais. A V1 não foi recolhida; a V2 foi executada apenas nos dois comandos exclusivos acima. Cada comando, CWD, stdout/stderr, exit code e, nas execuções V2, horários e overrides de ambiente constam dos JSON de evidências.

## Avisos e limitações

Lint passou com um aviso `typescript/no-base-to-string` em `test/sprint3-v2/conversa-http.spec.ts:186`, na expressão `String(url)`. Esse arquivo é byte a byte o teste V2 anterior; não foi modificado para silenciar o aviso. Os testes existentes informam também aviso de descontinuação de vite-tsconfig-paths, sem falhas. Nenhuma dependência/configuração foi ajustada por causa desses avisos.

A V2 usa NestJS/Supertest local e fetch simulado; não comprova integração com FastAPI/RAG real, qualidade semântica ou comportamento de toda a infraestrutura. Não se afirma prova formal de equivalência apenas pelos testes: a justificativa de equivalência do fluxo complementa os resultados. Prioridade de assuntos mistos continua uma ambiguidade documental da matriz, preservada nesta mudança.

Não houve falhas de reprodução da V2, ajustes de expectativas, alterações em V1/V2 ou correções adicionais. Não foi feito push, merge ou PR.

## Evidências e reprodução

Evidências versionadas em [BACK-REF-01-evidencias](BACK-REF-01-evidencias/): diff, ambiente, configuração, resultados integrais V2 antes/depois, sumários de cobertura, versões testadas e logs de regressão, lint e build. Cada conjunto de resultados tem seus próprios caminhos, sem substituir relatórios anteriores.

Cópia completa externa, inclusive HTML e mapas de cobertura:

- Antes: `/home/victor/codex-chatbot-handoff/refatoracao-BACK-REF-01-20261102T003619Z/antes/coverage/index.html`.
- Depois: `/home/victor/codex-chatbot-handoff/refatoracao-BACK-REF-01-20261102T003619Z/depois/coverage/index.html`.
- Suíte exata preservada: `/home/victor/codex-chatbot-handoff/refatoracao-BACK-REF-01-20261102T003619Z/V2-preservada/`.
- Handoff atualizado após commit: `/home/victor/codex-chatbot-handoff/RESUMO_PARA_CHATGPT.md`.

Os quatro testes V2 e a configuração de execução estão disponíveis no novo worktree, como arquivos não rastreados; não foram misturados ao commit de refatoração. A cópia externa congelada e os hashes permitem reconstruí-los. O commit contém apenas um arquivo de produção e os novos registros específicos de BACK-REF-01 em docs/qualidade.

Para reproduzir no backend do worktree isolado, copiar os quatro `.spec.ts` congelados para `test/sprint3-v2/` quando necessário. Usar a configuração exclusiva `vitest.back-ref-01.config.mts`, cuja raiz é este backend. Escolher um destino de evidência novo para cada execução:

```bash
BACK_REF_EVIDENCE_DIR=/tmp/back-ref-01-nova-medicao ./node_modules/.bin/vitest run --config vitest.back-ref-01.config.mts --coverage
```

Não reutilizar os diretórios antes/depois preservados. Em outro worktree, ajustar somente `root` da cópia da configuração para a nova raiz; manter testes e escopo de cobertura. Comandos exatos dos testes existentes estão em selecao-regressao.json e nos logs; lint `npm run lint`, build `npm run build`. Não executar o script de preparação de novo nos caminhos existentes.
