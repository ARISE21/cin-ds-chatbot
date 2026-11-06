# Inventário consolidado de critérios partições e limites

Data da consolidação: 06/11/2026. As classes abaixo explicitam a tabela de entradas aprovada, sem acrescentar regras de negócio. Contagens retrospectivas não substituem o commit de aprovação anterior à V1. Sim significa partição exercitada por asserção, inclusive erro observado; não significa requisito satisfeito. Parcial não entra no numerador estrito. A suficiência semântica, HTTP e isolamento devem ser descritos ao lado do percentual.

## Critérios e casos

Há 15 critérios: US-01 = 5; US-02 = 4; US-03 = 6. V1 tem asserções diretas para os 5 critérios da IA e 8 do backend: 13/15 (86,67%), com 2 parciais no backend. CA-01.2 é exercitado, mas os cenários de origem inválida da IA falham/geram erro. A V2 possui evidência para 15/15 (100%) no escopo controlado declarado.

Recorte literal dos 26 casos: V1 tem 17 completos, 7 parciais e 2 ausentes (65,38% completos); V2 tem 26 completos (100%). Na IA são 10/11 e 11/11. No backend, exigindo entradas literais, são 7/15 e 15/15; por equivalência de partição, o relatório original admite 10 completos na V1. Não misturar as duas convenções no mesmo percentual. A matriz usa a convenção literal nos casos de fronteira e remete ao CSV original para os títulos completos.

## Partições da US-01

22 classes detalhadas e referenciadas em us01-fechamento.md: pergunta não vazia/vazia/espaços (3); curso específico/geral/desconhecido (3); perfil novo/anterior/geral/desconhecido (4); top_k positivo/zero/negativo/decimal/booleano/texto (6); resultados vazios/não vazios (2); página válida/inválida (2); distância finita/não finita (2). V1 22/22 e V2 22/22 exercitadas, com os resultados de erro preservados. Uma classe pode ter múltiplos representantes, sem aumentar seu peso.

## Partições das US-02 e US-03

Os nomes abaixo remetem aos testes de 01_V1/testes e 02_V2/testes dentro de evidencias-backend. Classes em variáveis diferentes podem coexistir na mesma requisição; a contagem é por variável, não por produto cartesiano.

| ID | Classe | V1 | V2 | Evidência |
|---|---|---|---|---|
| B01 | distância abaixo do limiar | Sim | Sim | orchestration: abaixo do limite; HTTP CT-02.01 |
| B02 | distância igual ao limiar | Sim | Sim | orchestration: distância 0.8; CT-02.02 |
| B03 | distância acima do limiar | Sim | Sim | orchestration: acima; CT-02.03 |
| B04 | distância não finita no contrato externo | Não | Sim | HTTP CT-02.07 NaN/Infinity |
| B05 | contexto com texto | Sim | Sim | mantém resposta; HTTP CT-02.01 |
| B06 | contexto vazio | Sim | Sim | contexto vazio; CT-02.04 |
| B07 | contexto só branco | Sim | Sim | contexto branco; CT-02.04 |
| B08 | assunto SecGrad | Sim | Sim | fallback-email: estágio/requerimento/dispensa/segunda chamada |
| B09 | assunto pedagógico | Sim | Sim | fallback-email; HTTP CT-03.03 |
| B10 | assunto pós-graduação | Sim | Sim | fallback-email; HTTP CT-03.04 |
| B11 | assunto genérico | Sim | Sim | fallback-email; HTTP CT-03.05 |
| B12 | dados opcionais ausentes | Sim | Sim | template completo sem dados; HTTP CT-03.06 |
| B13 | objeto de dados com textos válidos | Sim | Sim | template completo; HTTP CT-03.07 |
| B14 | estrutura inválida de dados | Sim | Sim | rejeita null/lista/etc.; HTTP CA-03.6 |
| B15 | campo de dado não textual | Sim | Sim | validarDadosEmail parametrizado; HTTP CA-03.6 |
| B16 | retorno externo válido | Sim | Sim | fixture preservado; AiService real na V2 |
| B17 | JSON externo malformado | Não | Sim | HTTP CT-02.07 |
| B18 | contrato externo incompleto | Não | Sim | HTTP CT-02.07 campos ausentes |
| B19 | falha de transporte traduzida em HTTP seguro | Parcial | Sim | V1 injeta exceção pronta; V2 CT-02.05 |
| B20 | timeout traduzido em HTTP seguro | Não | Sim | V2 CT-02.06 fetch e JSON |
| B21 | fonte com página válida | Sim | Sim | V1 preserva página 2 do fixture; V2 página 1 |
| B22 | fonte com página inválida | Não | Sim | V2 CT-02.07 página 0 |

Subtotal estrito backend: 16/22 (72,73%), 1 parcial, 5 não na V1; V2 22/22. B21 só demonstra preservação de um dado válido na V1, não validação da sua origem. As obrigações HTTP estão em B19/B20 e nos critérios, para não alegar cobertura mais forte que a evidência. Consolidado por classes de variável: V1 38/44 (86,36%); V2 44/44. Classes adicionais de configuração não entram no denominador; são testes extras.

## Valores-limite

US-01: comprimento útil da pergunta 0/1; top_k 0/1; quantidade de resultados 0/1; página 0/1 = 8 valores. V1 8/8 e V2 8/8 exercitados (mesmo com erro para página 0).

Backend, recorte literal: distância 0.7999/0.8/0.8001; comprimento útil de contexto 0/1; página 0/1; comprimento útil de campo opcional 0/1 = 9 valores. Os campos opcionais usam a mesma fronteira de comprimento, não se multiplica o denominador pelos nomes dos campos. V1 exercita exatamente 0.8, contexto 0 e campo 0 = 3/9 (33,33%). Os vizinhos de distância da V1 são equivalentes de partição, mas não os literais aprovados; página do fixture V1 é 2. V2 9/9, incluindo textos mínimos no HTTP e origem com página 0.

Total descritivo por componente: 11/17 (64,71%) na V1 e 17/17 na V2. São pares variável/componente/valor; páginas 0/1 aparecem nos dois componentes por terem fronteiras diferentes (FastAPI e NestJS). Não apresentar como 17 valores numéricos únicos nem como teste integrado ponta a ponta.

## Asserções e defeitos

IA: 0/13 métodos sem asserção ou com apenas asserção trivial na V1; 0/21 na V2. Backend: a inspeção dos blocos it/it.each preservados encontra expect direto ou helper com expect em cada corpo; nenhum teste sem asserção identificado. Instâncias parametrizadas não foram contadas como novas inspeções de código. Oráculos relacionais e verificações parciais são fracos, mas não triviais: podem falhar para resultados errados.

Não se contam 9 erros da IA como 9 defeitos reais. Há duas classes de integridade de retorno (página/distância), com requisito de tratamento insuficientemente definido; a correção explícita passou a rejeitar origem inválida. Backend V1 teve zero falhas observadas; os riscos descritos são lacunas e possíveis falsos positivos, não defeitos reproduzidos. Não foram executados testes de mutação.
