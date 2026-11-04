# Análise incremental da US-01

Atualização: o fechamento controlado está em us01-fechamento.md. Este documento preserva a medição histórica anterior; suas pendências de comparação/contagem foram resolvidas no novo registro, sem sobrescrever os resultados originais.

## Escopo e evidências

Módulos medidos: src.retriever e src.metadata_utils. Testes via unittest; coverage.py 7.17.0 com branches. A API é exercitada, mas main.py inclui ingestão e geração fora da US-01 e não entra no denominador. Os relatórios HTML e JSON estão em relatorios/v1/ e relatorios/v2/. A coleção é falsa: esta medição não demonstra integração real com Chroma nem qualidade semântica do corpus.

| Indicador | V1 original, antes da correção | V2, após correção |
|---|---|---|
| Métodos executados | 13 | 17 |
| Métodos aprovados | 11 | 17 |
| Métodos com falhas | 2, contendo 9 subtestes falhos | 0 |
| Erros de importação/compilação | 0 | 0 |
| Linhas | 64/86 = 74,42% | 90/95 = 94,74% |
| Branches | 25/34 = 73,53% | 39/42 = 92,86% |
| Critérios com pelo menos uma asserção | 5/5 | 5/5 |

Os denominadores de linhas/branches mudaram por correção de produção. Os números acima são evidências de duas revisões diferentes; não demonstram isoladamente o ganho da suíte. Uma comparação controlada adicional na mesma revisão ainda precisa ser anexada antes do relatório final. Critério exercitado não significa critério satisfeito: CA-01.2 falhou na V1.

## Oráculos e classificação

A V1 exige resposta de sucesso válida mesmo quando a coleção simulada fornece página 0, negativa, textual, decimal, booleana ou nula, ou distância NaN/infinita. Há uma lacuna de robustez real: o retorno original repassa esses dados. Porém o oráculo da V1 presume recuperação automática; o requisito não define essa recuperação. A decisão técnica implementada é rejeitar a origem inválida com InvalidSearchResult e HTTP 502 seguro, sem inventar evidência. Essa é uma correção de comportamento, não uma refatoração. A equipe deve confirmar a decisão ao revisar a alteração.

Na V2 os dois testes foram substituídos por asserções de rejeição e foi acrescentado teste HTTP 502. A V1 permanece intocada. Os demais testes válidos são herdados explicitamente da V1; V2 depende desse arquivo preservado.

## Rastreabilidade dos casos da US-01

| Caso aprovado | V1 | V2 |
|---|---|---|
| CT-01.01 | test_cursos_perfis_reconhecidos | herdado |
| CT-01.02 | test_sem_restricoes | herdado |
| CT-01.03 | parcial: não testa o rótulo exato Perfil Novo / Vigente | test_rotulo_exato_interface |
| CT-01.04 | test_sem_resultados | herdado |
| CT-01.05/06 | test_pergunta_invalida | herdado |
| CT-01.07/08 | test_filtros_desconhecidos | herdado |
| CT-01.09/10/11 | test_top_k_invalido e test_top_k_valores_validos | herdados |

Todas as 11 linhas de casos da US-01 possuem teste correspondente na V2, mas a contagem formal das partições e limites deve usar um inventário atômico antes de informar percentuais. US-02/03 não são cobertas por esta entrega e dependem do trabalho do backend.

## Lacunas encontradas e melhorias

V1 não exercita enriquecer_metadados. V2 testa curso geral, curso textual, múltiplos cursos e perfis novo/anterior/ambos. V2 também cobre aliases gerais vazios e Ambos e o rótulo exato da interface. V1 tem asserções, mas algumas aceitam qualquer 4xx em vez de verificar o código e a mensagem exatos. Isso ainda pode ser fortalecido.

Exemplo de linha coberta com branch não coberto: em enriquecer_metadados, V2 executa a iteração sobre cursos válidos; a decisão codigo is not None também admite um curso Geral dentro da lista, que não foi exercitado nesta versão. A linha executada não comprova os dois caminhos. O HTML identifica os caminhos restantes. Não remover código apenas para aumentar cobertura.

## Pendências antes de considerar a Sprint concluída

- Comparação controlada V1/V2 na mesma revisão de produção.
- Inventário e métricas finais de partições/limites e inspeção de asserções.
- Integração dos resultados do backend para US-02/03.
- Ao menos três refatorações confirmadas pela equipe, com V2 antes/depois e commits por ID de dívida.
- Relatório crítico PDF até 5 páginas e relatório de refatoração PDF até 3 páginas, com logs completos e dívida consolidada.

Este documento é uma análise intermediária assistida por LLM e não substitui os PDFs finais.
