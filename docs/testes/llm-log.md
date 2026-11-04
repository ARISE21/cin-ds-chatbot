# Sprint 3 — Registro de uso de LLM

## Fechamento local da US-01 e IA-REF-02

Solicitação de Rafael: "Ok, chat. Quero que você faça essa minha parte de agora que você disse que já é possível fazer (passos 1 a 5, né?) Leve o tempo que achar necessário. Lembre-se de sempre ir seguindo as orientações e as exigências que fui te mandando por aqui, como prints, etc. Faça todas essas alterações localmente. Depois, me diga o que você fez para eu subir no repositório remoto."

Codex, em 04/11/2026, analisou os módulos da US-01 e a V2 existente, acrescentou quatro métodos para lacunas observadas (listas inconsistentes, tipos de distância, 422 exato e documento Geral na lista), sem modificar a V1. Mediu V1/V2 na mesma produção, identificada por hashes, e congelou a V2 antes de extrair a validação vetorial em IA-REF-02. Métricas, comparação de oráculos, inventários e justificativa estão em us01-fechamento.md e ../qualidade/IA-REF-02-relatorio.md. Nome do modelo exato não registrado nesta interação; não inventar versão. Esta interação é melhoria V2 e análise/refatoração, não nova geração V1. Não foram enviadas mensagens ao grupo ou alterados backend, interface ou catálogo.

## Medição e melhoria após a V1

Foi preservada a geração independente em commit 0a75b77; o prompt integral e saída original estão em v1-ia-geracao.md. Em seguida, neste chat, Rafael solicitou: "Ok, então continue esse trabalho para mim, por favor, e vai me dizendo o que você ta fazendo. Acha que você ainda vai fazer alguma alteração no código do projeto relativo à minha parte? Quero saber quando eu posso mandar as alterações pro repositório no GitHub...".

Codex mediu a V1 com coverage.py, analisou as falhas, implementou rejeição de retorno documental inválido e criou a V2 por herança explícita dos testes válidos da V1, com substituição dos dois oráculos de origem inválida e quatro métodos adicionais. Resultados e limitações em analise-ia-v1-v2.md. Esta interação modifica V2 e produção, não o arquivo V1. Versão exata do modelo não registrada; não inferir pelo nome comercial da ferramenta.

## Atualização de aprovação antes da V1

Rafael confirmou nesta conversa que a equipe aprovou a matriz em conjunto e que a professora abriu exceção à elaboração necessariamente manual. Registro baseado no relato do integrante; a assistência original foi preservada. A geração V1 da IA será feita em chat novo, sem fornecer a matriz, limitada à US-01. US-02 e US-03 permanecem no escopo do backend de Victor.

Este arquivo mantém a rastreabilidade do uso de LLM durante a Sprint 3. Novas interações relevantes devem ser adicionadas sem apagar as anteriores.

## Entrada 001 — Apoio ao planejamento da matriz

- **Data:** 28/10/2026
- **Responsável pela interação:** Rafael
- **Ferramenta:** Codex / modelo da OpenAI disponível na sessão
- **Tipo de uso:** estruturação assistida de requisitos e casos esperados
- **Arquivos de saída:** `docs/testes/matriz-rastreabilidade.md`
- **Não é:** geração da suíte de testes V1

### Contexto fornecido

Foram fornecidos o repositório atualizado, as orientações da professora para a Sprint 3 e o pedido para selecionar funcionalidades da Sprint 2, escrever user stories, definir critérios de aceitação, entradas, partições, valores-limite e casos esperados.

### Resultado produzido

A LLM propôs um rascunho de matriz para três fluxos já implementados:

1. busca semântica filtrada com fontes;
2. decisão de fallback;
3. geração de rascunho de e-mail.

O rascunho foi baseado nos contratos e comportamentos observados no FastAPI e no NestJS. A futura rota de geração por LLM foi excluída por não pertencer à implementação da Sprint 2.

### Limitação e validação necessária

A matriz não deve ser apresentada como elaboração manual independente. Antes da geração da suíte V1, os integrantes devem validar todos os critérios, partições, limites e resultados esperados e registrar a aprovação em novo commit. A conversa destinada à geração da V1 deve ser nova e não deve receber a matriz de referência.

## Modelo para as próximas entradas

Copiar a estrutura abaixo a cada rodada:

```text
## Entrada NNN — Título

- Data:
- Responsável:
- Ferramenta/modelo:
- Objetivo:
- Arquivos afetados:
- Prompt enviado:
- Resposta recebida:
- Ajustes manuais para compilar/executar:
- Resultado dos testes:
- Decisão da equipe:
```
