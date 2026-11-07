# US-01 — Comparação controlada e rastreabilidade

## Revisão e medição

V1 e V2 medidas na produção e421ff9, antes de IA-REF-02. Os manifestos em relatorios/us01-controlado/v1/execucao.json e v2/execucao.json registram hashes idênticos dos três arquivos de produção, Python, comando, horário UTC e hashes dos testes. Coverage.py 7.17.0 com --branch; escopo idêntico src.retriever e src.metadata_utils. main.py participa das chamadas HTTP, mas não do denominador por agregar outras histórias. Os testes usam coleção falsa, sem download, Chroma real ou LLM real.

| Indicador | V1 original na base atual | V2 final antes de refatorar |
|---|---|---|
| Métodos executados | 13 | 21 |
| Métodos aprovados | 11 | 21 |
| Métodos com problemas | 2, com 9 erros de subtestes | 0 |
| Não compilam/importam | 0 | 0 |
| Linhas | 72/95 = 75,79% | 91/95 = 95,79% |
| Branches | 32/42 = 76,19% | 41/42 = 97,62% |
| Critérios exercitados | 5/5 | 5/5 |
| Partições abaixo exercitadas | 22/22 | 22/22 |
| Valores-limite abaixo exercitados | 8/8 | 8/8 |
| Métodos sem asserção ou com apenas asserção trivial | 0/13 | 0/21 |

Contar métodos não é contar subtestes: nove erros pertencem a dois métodos. Critério exercitado não significa que o comportamento passa. Os dois erros da V1 são InvalidSearchResult na origem inválida: a correção anterior já está nesta base. O registro histórico anterior tinha nove falhas de asserção e permanece intocado. Não há nove defeitos independentes: há duas classes de integridade e uma ambiguidade de especificação sobre tratamento de origem inválida.

## Inventário de partições

Inventário explícito derivado das classes já descritas na matriz; não inclui requisitos do backend. Cada item conta uma vez, mesmo com vários representantes. Contam-se asserções executadas, inclusive falhas/erros; resultados não são apagados.

| IDs | Partições | Testes V1 | V2 |
|---|---|---|---|
| P01–03 | pergunta não vazia; vazia; espaços | pergunta_nao_vazia / pergunta_invalida | herdados |
| P04–06 | curso específico; geral; desconhecido | cursos_perfis_reconhecidos / sem_restricoes / filtros_desconhecidos | herdados e aliases_gerais |
| P07–10 | perfil novo; anterior; geral; desconhecido | cursos_perfis_reconhecidos / sem_restricoes / filtros_desconhecidos | herdados |
| P11–16 | top_k inteiro positivo; zero; negativo; decimal; booleano; texto | top_k_valores_validos / top_k_invalido | herdados e limites_exatos_api |
| P17–18 | resultado vazio; não vazio | sem_resultados / varias_fontes | herdados |
| P19–20 | página válida; inválida | fontes_e_paginas_validas / contrato_pagina_invalida_na_origem | herdado / oráculo de rejeição corrigido |
| P21–22 | distância finita; não finita | fontes_e_paginas_validas / contrato_distancia_nao_finita_na_origem | herdado / oráculo de rejeição corrigido |

## Inventário de limites

| IDs | Valores | V1 | V2 |
|---|---|---|---|
| L01–02 | pergunta com comprimento útil 0/1 | pergunta_invalida / pergunta_nao_vazia | herdados |
| L03–04 | top_k 0/1 | top_k_invalido / top_k_valores_validos | herdados |
| L05–06 | quantidade de trechos 0/1 | sem_resultados / fontes_e_paginas_validas | herdados |
| L07–08 | página 0/1 | contrato_pagina_invalida_na_origem / fontes_e_paginas_validas | rejeição / sucesso |

Os limites 0.7999/0.8/0.8001 pertencem à US-02, não entram nesta contagem. Tipos inválidos não são fronteiras numéricas. Ausência/null adicionais testados pela V1 são robustez suplementar.

## Casos da matriz e critérios

CT-01.01: cursos_perfis_reconhecidos; CT-01.02: sem_restricoes; CT-01.03: parcial na V1, completo na V2 por rotulo_exato_interface; CT-01.04: sem_resultados; CT-01.05/06: pergunta_invalida; CT-01.07/08: filtros_desconhecidos; CT-01.09/11: top_k_invalido; CT-01.10: top_k_valores_validos. Assim, casos integralmente cobertos: V1 10/11, V2 11/11. A representação SI/Perfil Novo exata é uma lacuna de alias, embora suas partições já fossem exercitadas.

CA-01.1: cursos_perfis_reconhecidos e top_k_valores_validos; CA-01.2: fontes_e_paginas_validas e validadores de origem; CA-01.3: sem_resultados; CA-01.4: perguntas/top_k/filtros inválidos; CA-01.5: sem_restricoes. Todos têm asserções, com CA-01.2 divergindo na V1 para dados corrompidos. Asserções 4xx da V1 são fracas, não triviais: falham com 200, mas aceitam erro errado. V2 acrescenta 422 exato. Não se afirma exaustividade sobre qualquer dado Python arbitrário.

## Análise crítica

A LLM identificou as classes principais e limites, mas perdeu o alias exato da interface, não exercitou enriquecer_metadados e presumiu sucesso com origem corrompida. A V2 corrige esses oráculos para rejeição segura 502, preservando o histórico. Acrescenta listas inconsistentes, tipos de distância inválidos e código HTTP 422 exato. Não foram encontradas asserções que confirmem deliberadamente um defeito; a interpretação de origem inválida é uma lacuna de contrato, registrada em vez de ocultada.

Na V1, o loop de cursos no enriquecimento não é executado. Na V2 inicial, o caminho codigo is None dentro da lista continuava ausente; test_documento_geral_na_lista agora cobre esse branch. A abertura real da coleção continua sem execução (quatro linhas), justificando não afirmar integração real. Após as melhorias, resta um branch não coberto, identificado no HTML: não remover código para atingir número artificial.

## Reprodução

Na pasta ai-service, executar com o ambiente do projeto:

```powershell
python -m pip install -r requirements-dev.txt
python scripts/medir_us01.py v1-llm ../docs/testes/relatorios/nova-execucao/v1
python scripts/medir_us01.py v2 ../docs/testes/relatorios/nova-execucao/v2
```

O destino precisa ser novo. A V1 tem saída 1 esperada e os relatórios são gerados mesmo assim; o script registra test_exit e falha se a geração de cobertura falhar. Comparar manifestos de produção antes de comparar percentuais. HTML completo é necessário; JSON isolado não substitui a entrega pedida. Este documento é insumo para o PDF global até 5 páginas, que ainda depende de US-02/03.
