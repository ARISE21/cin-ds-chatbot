# Sprint 3 — Registro de uso de LLM

## Fechamento do backend assumido por Rafael - 08/11/2026

Rafael informou autorização de Victor para assumir suas pendências finais. O pedido
integral e o diagnóstico assistido estão em
[log de manutenção](../qualidade/log-analise-backend-20261108.md).
Não houve nova V1/V2: restaurou-se o contrato de URL que já tinha testes, mantendo
suítes e resultados históricos. O recorte de 100 casos antes falhou em seis; a suíte
corrente de 256 passou após a restauração. Resultados e limites:
[fechamento de 08/11](fechamento-backend-20261108/README.md).
As revisões dos PDFs de 08/11 mantêm os resultados antigos e distinguem essas
regressões posteriores. A correção funcional não é contada como terceira refatoração.

## Consolidação das três histórias em 06/11/2026

Pedido integral de Rafael: "Ok, chat. Baseando-se em tudo isso e considerando ainda aquelas orientações técnicas que te mandei (prints dos professores, etc), você consegue avançar a minha parte para o Sprint 3 com o que temos até agora? Leve o tempo que achar necessário para fazer essa minha parte. Se ainda faltar coisas que dependem de outros integrantes me avise."

Contexto: pacote ENTREGA_BACKEND_SPRINT3.zip fornecido por Victor, histórico da US-01 já versionado e roteiros da disciplina. Codex consolidou documentos; não gerou nova V1 nem mudou testes nesta etapa. Os 138 arquivos do ZIP foram copiados byte a byte; 137 hashes conferidos. O manifesto IMPORTACAO.json preserva origem e hashes. Modelo/snapshot exato desta interação não foi registrado, sem atribuição retroativa.

### Backend V1 original

- Data: 02/11/2026 às 00:06:35 UTC (01/11/2026 às 21:06:35 em Fortaleza).
- Modelo informado no artefato: GPT-6 / agente Codex; snapshot indisponível. Ver [metadados originais](evidencias-backend/01_V1/geracao/METADADOS.json).
- [Prompt integral original](evidencias-backend/01_V1/geracao/PROMPT_INTEGRAL_20261102T000635Z-ddf53b69.txt).
- [Primeira resposta integral, código e explicações](evidencias-backend/01_V1/geracao/SAIDA_ORIGINAL_20261102T000635Z-ddf53b69.md).
- [Resumo da geração](evidencias-backend/01_V1/geracao/RESUMO_GERACAO_V1.md).
- Uma geração independente, sem execução/correções na geração. Execução posterior: 65/65, zero falhas. Logs em [execução V1](evidencias-backend/01_V1/execucao/).
- Ressalva: prompt recebido não transcreve critérios de aceitação nem solicita explicitamente as técnicas e comentários por requisito. Isso é divergência do protocolo do roteiro, não motivo para modificar o histórico ou inventar contexto anterior.

### Backend análise e V2

- [Análise formal da V1](evidencias-backend/01_V1/analise/ANALISE_FORMAL_V1.md) e inventário de 65 instâncias.
- [Relatório V2](evidencias-backend/02_V2/RELATORIO_V2_FORMAL.md), [diff V1/V2](evidencias-backend/02_V2/V1-para-V2.diff), [comparação](evidencias-backend/02_V2/comparacao-v1-v2.json) e inventário de 105 instâncias.
- Mesma produção histórica 9d328dc, 105/105, sem falhas na primeira execução. Testes HTTP acrescentados e oráculos fortalecidos.
- O ZIP não contém a transcrição integral do prompt de melhoria V2 como arquivo próprio. O relatório descreve procedimento e mudanças. Registrar esta ausência e solicitar a Victor o histórico real se disponível; não apresentar o resumo como transcrição literal.

### Observação sobre completude

Este índice liga os arquivos integrais em vez de duplicar milhares de linhas neste log. A entrega deve incluir toda a pasta evidencias-backend e v1-ia-geracao.md. Para a IA, as melhorias V2 foram realizadas neste chat, registradas nas entradas abaixo; os identificadores exatos do modelo permanecem indisponíveis. Os PDFs e tabelas usam apenas números registrados, com escopos e revisões explícitos.

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

## Adendo de manutenção e validação real - 07/11/2026

Após solicitação de Rafael para conferir os merges de Eric/Ricardo e continuar sua
parte, o assistente revisou a base `484cd24`, executou ingestão, auditoria e regressões
e criou `test_ingest_pages.py` para cobrir páginas sem texto e preservação da numeração.
São regressões novas de manutenção, não uma regeneração da V1 nem substituição da V2.
Os roteiros, prompts e resultados históricos anteriores não foram reescritos.
As alterações de produção ficaram em `src/ingest.py` (avisos e retorno das páginas
omitidas) e dependência de leitura de fontes; backend/interface/catálogo não foram
editados. Os seis testes falhos atuais de URL foram registrados, não removidos.
Evidências e limites: [validação dos PPCs](validacao-ppcs/README.md).
