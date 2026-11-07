# IA-REF-02 — Extract Function na validação vetorial

Item: IA-REF-02, Long Method / coesão / SRP em buscar_contexto, confirmado por leitura com assistência de LLM. Escolhido por separar uma responsabilidade testada e reduzir o risco da intervenção. Status: Refatorado.

A validação de comprimento das listas e de tipo/finitude das distâncias foi movida sem alteração para _validar_resultado_vetorial. buscar_contexto a chama no mesmo ponto, antes de formatar documentos. Condições, ordem, mensagens, exceções e efeitos permanecem iguais. Não foi introduzida nova regra, dependência ou interface pública; os testes não passaram a depender da função interna. A refatoração melhora a separação de responsabilidades, embora buscar_contexto ainda tenha responsabilidades de formatação que podem ser revistas futuramente.

## Antes e depois

Antes: docs/testes/relatorios/us01-controlado/v2; depois: docs/qualidade/IA-REF-02-evidencias/depois. Mesmo escopo, mesma suíte congelada, hashes em execucao.json. A suíte foi commitada antes da mudança em 55a852c. Os hashes de produção, não apenas HEAD, identificam a alteração ainda não commitada durante a medição posterior.

| Indicador | Antes | Depois |
|---|---|---|
| V2 | 21/21 | 21/21 |
| Linhas | 91/95 (95,79%) | 93/97 (95,88%) |
| Branches | 41/42 (97,62%) | 41/42 (97,62%) |
| Regressões existentes | — | 18/18 |

A extração acrescenta definição/chamada, alterando denominador de linhas; não é ganho de cobertura funcional. A justificativa de equivalência é a movimentação literal do bloco na mesma posição. Os testes antes/depois são evidência complementar, não prova absoluta. Não foram alterados V1, V2 ou código dos colegas durante a refatoração.

## Reflexão sobre identificação

A leitura manual do fluxo permite distinguir validação, acesso à coleção e formatação. A LLM sugeriu a extração e ajudou a registrar a consequência; a equipe deve revisar esse diagnóstico. Coverage.py identifica execução e caminhos, mas não diagnostica SRP nem decide se a extração é útil. Não foi executado analisador estático de smells; não atribuir achados a uma ferramenta não usada.

Este registro é insumo para Ricardo consolidar o PDF de refatoração até 3 páginas com BACK-REF-01 e a refatoração do frontend. HTML, JSON, hashes e logs estão versionados em caminhos relativos; não exigem a pasta pessoal de um integrante.
