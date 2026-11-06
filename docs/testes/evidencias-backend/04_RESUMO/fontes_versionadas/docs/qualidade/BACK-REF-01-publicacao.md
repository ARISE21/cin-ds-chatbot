# BACK-REF-01 — publicação e reprodução da V2

Esta entrega complementa a primeira refatoração formal. O commit f7a067fb7886d1b68621ca57af42cf051dfe02a1 é preservado; a única mudança de produção continua sendo a consolidação de condições em FallbackService.identificarSetor. A revisão não encontrou alteração de ordem, curto-circuito, retornos ou precedência. Nenhuma nova refatoração foi implementada.

Os quatro testes em backend/test/sprint3-v2 são cópias byte a byte da V2 formal (105 casos), agora parte da entrega. A configuração backend/vitest.sprint3-v2.config.mts resolve a raiz pelo próprio arquivo e não depende de caminhos de um desenvolvedor. Não muda dependências, testes, ambiente funcional ou escopo da instrumentação. A pasta coverage é ignorada pelo Git.

Os registros [da dívida](BACK-REF-01-divida.md) e [do relatório histórico](BACK-REF-01-relatorio.md) preservam a refatoração e as execuções anteriores. As referências a caminhos locais nesses registros são proveniência histórica, não pré-requisitos para executar os testes. A antiga configuração absoluta dentro das evidências é um artefato histórico; use somente a nova configuração portátil.

## Reprodução pela equipe

Pré-requisito: Node 24.x e npm; instalar as versões do lockfile. Na raiz do checkout:

```bash
sha256sum -c docs/qualidade/BACK-REF-01-V2.sha256
cd backend
npm ci
npx --no-install vitest run --config vitest.sprint3-v2.config.mts --coverage
npm test
npm run test:e2e
npm run lint
npm run build
```

O comando exclusivo coleta somente a V2: 105 testes. npm test coleta os testes .spec.ts existentes e V2: 204 (99 + 105). npm run test:e2e coleta os 33 e2e existentes. A V1 permanece preservada externamente e não é coletada nesses comandos. Não são necessários FastAPI, corpus ou credenciais: o HTTP NestJS é real e fetch é simulado nos testes. Sucesso do POST usa 201, como na implementação.

Saídas geradas, não versionadas: backend/coverage/sprint3-v2/index.html; coverage-summary.json e coverage-final.json na mesma pasta; backend/coverage/sprint3-v2-results.json para resultados Vitest. Cada nova execução local pode substituir apenas esses artefatos derivados; evidências históricas em docs/qualidade não são substituídas.

## Referência aos testes antes e depois

| Evidência histórica | Antes | Depois |
|---|---:|---:|
| V2 exclusiva | 105/105 | 105/105 |
| Linhas nos três arquivos originais | 45/45 | 43/43 |
| Branches nos três arquivos originais | 53/53 | 51/51 |
| Linhas no escopo de cinco arquivos | 85/90 (94,44%) | 83/88 (94,31%) |
| Branches no escopo de cinco arquivos | 108/113 (95,57%) | 106/111 (95,49%) |

A remoção de dois pontos estruturais do código reduz os denominadores; não aumentam as cinco linhas e cinco entradas de branches descobertas fora da orquestração/fallback. [Logs e resultados antes](BACK-REF-01-evidencias/antes/execucao.json), [depois](BACK-REF-01-evidencias/depois/execucao.json) e [comparação](BACK-REF-01-evidencias/comparacao-cobertura.json) permanecem versionados. Os mapas de cobertura dos resultados históricos contêm caminhos absolutos, mas sua leitura não exige acesso a esses caminhos.

Para repetir também a versão ANTES, usar outro worktree na baseline 9d328dc463f3e47588811a37eafece6f13f3f891, copiar a partir desta entrega os quatro .spec.ts para backend/test/sprint3-v2 e a configuração portátil para backend/, instalar pelo lockfile e executar a V2 nessa área. Não reverter produção nem editar testes no checkout de trabalho. Asserções, mocks e hashes da V2 devem permanecer iguais; só muda a produção da versão testada.

## Limitações conhecidas

Os testes não equivalem à prova integral de comportamento: justificativa de equivalência dos condicionais e revisão do diff complementam a execução. Não medem integração FastAPI/RAG real nem qualidade semântica. A prioridade herdada de assuntos mistos permanece uma decisão documental pendente. Lint pode emitir aviso preexistente typescript/no-base-to-string no String(url) do teste HTTP V2; os testes originais são mantidos intactos. As regressões podem emitir aviso de descontinuação de vite-tsconfig-paths.

A pasta de handoff, backups, node_modules, dist, relatórios novos gerados e configurações locais antigas não fazem parte da entrega Git. Não foi feito push, merge ou PR. O SHA do eventual complemento local de entrega e as instruções exatas de publicação são registrados no handoff, evitando autorreferência de SHA em documento do próprio commit.

## Verificação da entrega portátil

A entrega foi exportada por `git archive` do tree proposto, sem arquivos não rastreados, para uma raiz diferente da máquina de trabalho. Foram instaladas 342 dependências com `npm ci --offline` usando o cache do lockfile; nenhum pacote/lockfile foi alterado. Isso valida a portabilidade da raiz e a presença dos quatro testes na entrega, sem depender do node_modules anterior, do handoff ou da configuração absoluta local.

| Check no checkout limpo | Resultado |
|---|---|
| V2 exclusiva com configuração portátil | 105/105; exit 0 |
| npm test (99 existentes + 105 V2) | 204/204; exit 0 |
| npm run test:e2e | 33/33; exit 0 |
| npm run lint | exit 0; aviso herdado no String(url) |
| npm run build | exit 0 |
| Cobertura ampliada, cinco arquivos | linhas 83/88 (94,31%); branches 106/111 (95,49%) |

Os checks confirmam a cobertura posterior histórica e a identidade por hash dos quatro testes. Não houve novos testes, correções de expectativas ou mudanças de produção nesta preparação. A consulta direta da main remota retornou 9d328dc463f3e47588811a37eafece6f13f3f891, igual à baseline. A branch está tecnicamente apta à revisão em PR contra main; não se substitui a revisão humana nem se garante ausência de futuras mudanças na main.

O complemento local de publicação contém somente os quatro testes V2 preservados, a configuração portátil, este guia, seu resumo de checks e o manifesto SHA-256. A refatoração de produção continua isolada no commit f7a067f. Recomendação: publicar a branch existente com os dois commits, sem squash/amend antes da revisão acadêmica, para manter a refatoração e o complemento de reprodução distinguíveis. Nenhuma publicação foi executada nesta etapa.
