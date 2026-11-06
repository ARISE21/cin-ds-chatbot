# Entrega backend — Sprint 3 — Chatbot SecGrad

Evidências acadêmicas históricas das US-02 (fallback por confiança/contexto e falhas técnicas) e US-03 (rascunho de e-mail e encaminhamento por assunto). Arquivos originais copiados integralmente, sem alterar testes, código ou relatórios. Logs podem conter caminhos locais de proveniência e fixtures sintéticas, sem dados pessoais reais identificados.

- [V1: prompt integral e saída original](../01_V1/geracao/), três testes, resultado 65/65, [HTML](../01_V1/execucao/coverage/index.html) e [análise de lacunas](../01_V1/analise/ANALISE_FORMAL_V1.md).
- [V2 acadêmica original](../02_V2/): quatro testes, resultado 105/105, [HTML](../02_V2/execucao/coverage/index.html), comparação, inventário e rastreabilidade dos 15 casos esperados.
- [BACK-REF-01](../03_REFATORACAO/): consolidação de condições com mesmo destino, documentação, diff, resultados e HTML [antes](../03_REFATORACAO/antes/coverage/index.html) e [depois](../03_REFATORACAO/depois/coverage/index.html).

| Medição | Linhas | Branches |
|---|---:|---:|
| V1: três arquivos | 45/45 (100%) | 53/53 (100%) |
| V2: mesmos três arquivos | 45/45 (100%) | 53/53 (100%) |
| V2: cinco arquivos | 85/90 (94,44%) | 108/113 (95,57%) |
| Após BACK-REF-01: cinco arquivos | 83/88 (94,31%) | 106/111 (95,49%) |

V1 × V2 no mesmo escopo: delta zero. A ampliação para cinco arquivos muda o denominador. BACK-REF-01: 105/105 antes e depois; os três arquivos originais permanecem 100% (43/43 linhas e 51/51 branches depois). Duas linhas e duas entradas de branch cobertas foram removidas pela consolidação; permanecem cinco linhas e cinco branches descobertos no escopo ampliado. Commit da refatoração: `f7a067fb7886d1b68621ca57af42cf051dfe02a1`.

PRs: [#24](https://github.com/rafael-ramos-c/cin-ds-chatbot/pull/24), [#25 — BACK-REF-01](https://github.com/rafael-ramos-c/cin-ds-chatbot/pull/25), [#26 — integração /gerar e regressões](https://github.com/rafael-ramos-c/cin-ds-chatbot/pull/26). Links identificam os PRs; seu estado remoto não foi consultado nesta organização.

## Reprodução

Use checkout isolado e saídas novas, nunca os caminhos das evidências históricas. Ambiente histórico: Node 24.21.0, npm 11.19.0, Vitest/coverage-v8 4.1.11.

1. Para V1/V2 formal, crie checkout temporário do SHA `9d328dc463f3e47588811a37eafece6f13f3f891` e execute `npm ci` dentro de backend.
2. Copie os testes de 01_V1/testes ou 02_V2/testes para backend/test/sprint3-v1 ou sprint3-v2 no checkout temporário, mantendo os nomes.
3. Copie a configuração correspondente de execucao/vitest.exec.config.mts para o backend temporário. Na cópia, ajuste `root` para esse backend, `reportsDirectory` e `outputFile.json` para uma pasta NOVA fora desta entrega. Preserve includes, instrumentação e testes.
4. No backend temporário: `./node_modules/.bin/vitest run --config ./vitest.exec.config.mts --coverage`.
5. Para refatoração, siga o relatório versionado em fontes_versionadas/docs/qualidade/BACK-REF-01-relatorio.md e a configuração preservada em 03_REFATORACAO. Antes usa o baseline acima; depois usa o commit f7a067f, com a mesma suíte V2. Ajuste apenas caminhos na cópia da configuração e use `BACK_REF_EVIDENCE_DIR` novo em cada execução.

No código integrado com /gerar, V2 acadêmica permanece referência histórica: regressões correntes de `test/regressao-gerar` são uma suíte derivada, também com 105 casos, adaptada ao novo contrato. Seus 105 testes não substituem o resultado acadêmico original. Consulte fontes_versionadas/backend/REGRESSAO_GERAR.md e o script histórico copiado. Não reexecute V1/V2 diretamente contra produção atual para alegar reprodução histórica. Nenhum teste foi reexecutado nesta tarefa de empacotamento.

## Limitações e verificações

Fetch é simulado; NestJS/Supertest exercita HTTP local. Não comprova RAG/corpus, LLM real, rede externa, entrega de e-mail, UI, carga, segurança completa ou todo o backend. Prioridade de assuntos mistos é ambiguidade da matriz. Cobertura alta não prova completude; GET básico e algumas validações de configuração ficam descobertos. Checkboxes históricos da matriz não foram alterados.

Os manifestos originais foram conferidos por SHA-256, assim como cada cópia. Consulte VERIFICACOES.json, PROVENIENCIA.json e SHA256SUMS. Os quatro relatórios HTML mantêm todos os recursos relativos e tiveram links, fragmentos e recursos locais validados. Abertura visual em navegador permanece pendente por indisponibilidade de navegador automatizável. O checkout local não representa o estado integrado informado: arquivos versionados foram copiados diretamente do commit 17423f86; nenhuma alteração local foi tocada.
