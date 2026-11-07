# Integração NestJS com POST /api/v1/gerar

## Contrato e configuração

Baseline: c1bfe72d275b371dcfd2527c700ad66092833834. Esta integração chama o endpoint FastAPI existente; a geração real por LLM continua sendo responsabilidade do serviço mantido por Rafael.

No processo NestJS:

```bash
AI_SERVICE_URL=http://127.0.0.1:8000
AI_SERVICE_TIMEOUT_MS=5000
FALLBACK_DISTANCE_THRESHOLD=0.8
```

AI_SERVICE_URL deve ser somente uma origem HTTP(S), sem credenciais, query ou caminho. AI_SERVICE_TIMEOUT_MS é o timeout de cada chamada individual, de busca e geração: inteiro decimal de 1 a 2147483647, padrão 5000 ms. O limite vale também para leitura do JSON. Duas chamadas podem consumir até dois timeouts, não há prazo global único da conversa. Reutilizam-se as validações existentes de URL/timeout; suas mensagens de configuração continuam referindo-se ao serviço de busca.

No processo FastAPI, apenas para demonstração:

```bash
SECGRAD_GENERATION_MODE=mock python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Instalar previamente as dependências Python de ai-service/requirements.txt em ambiente próprio e executar em ai-service/. O modo é configurado no FastAPI, não pelo NestJS. Sem mock e sem provedor real implementado, o FastAPI retorna 503. O aviso `[SIMULAÇÃO DE INTEGRAÇÃO — NÃO É RESPOSTA ACADÊMICA]` é conservado literalmente no resultado público; ele não é uma resposta acadêmica.

## Fluxo e resposta pública

1. Validar consulta e dados opcionais, como antes; buscar contexto/fontes.
2. Chamar gerar somente se contexto tiver texto após trim, houver pelo menos uma fonte e distância for estritamente menor que o limiar injetado. Fontes vazias agora provocam fallback mesmo quando a distância é baixa: sem documento identificado não há sustentação rastreável para gerar. A igualdade com 0.8 continua no fallback.
3. Enviar ao FastAPI exclusivamente `{pergunta, contexto}`. Nome, matrícula, resumo, fontes e filtros não são enviados à geração. A própria pergunta pode conter informações inseridas pelo estudante; não se afirma anonimização do texto livre.
4. Aceitar somente objeto com resposta string ou null; descartar todos os campos extras. Strings vazias/brancas equivalem a null. Resposta textual válida mantém o conteúdo original, inclusive aviso de simulação.
5. Sucesso de /api/v1/conversa conserva contexto, distancia_minima, fontes e fallback_acionado=false e acrescenta resposta textual. POST mantém HTTP 201. Fontes são exclusivamente as sanitizadas da busca, na mesma ordem/conteúdo; campos/fontes extras da geração não são usados.
6. Busca inadequada ou geração null/vazia reutiliza o fallback e o rascunho existentes, com os campos antigos e sem acrescentar resposta. Templates e regras de setor não foram editados.
7. Falha técnica de geração não é fallback: erro de rede ou HTTP upstream 503 → 503; timeout local ou HTTP upstream 504 → 504; outros HTTP inválidos, JSON ou contrato incompatível → 502. Mensagens locais fixas, sem corpo upstream, prompt, credencial ou stack. Erros de busca mantêm o comportamento existente.

## Testes da integração

Na pasta backend, após npm ci:

```bash
npx --no-install vitest run test/generation-integration.spec.ts src/ai-service/generation.service.spec.ts
npm run lint
npm run build
```

52 testes novos aprovados: geração, string/null/brancos, filtros de adequação, fontes vazias, limiares literais e injetado, corpo de requisição, simulação explícita, 503/504/502, timeout em fetch/JSON, URL/timeout inválidos, proteção de informações internas, preservação de fontes e do e-mail.

Teste opt-in com FastAPI realmente em execução (modo mock em 8000 e outro processo sem geração em 8001):

```bash
SECGRAD_LIVE_AI_SERVICE_URL=http://127.0.0.1:8000 SECGRAD_LIVE_AI_DISABLED_URL=http://127.0.0.1:8001 npx --no-install vitest run --config vitest.config.e2e.ts test/generation-live.e2e-spec.ts
```

Foram realizados **2/2 testes HTTP reais** NestJS → FastAPI /gerar nesta etapa, com os dois modos. Apenas buscarContexto foi simulado no NestJS e as fontes eram fixtures; nenhuma busca ChromaDB, corpus ou LLM real foi validada. O teste também confirmou diretamente /gerar com contexto vazio → resposta null. Os processos temporários foram encerrados; o FastAPI e os manifests originais não foram alterados. Dependências necessárias ao ensaio foram instaladas exclusivamente em /tmp, com versões registradas nas evidências.

## Registro da primeira execução, anterior à migração

| Verificação | Resultado observado |
|---|---|
| V2 congelada na baseline, antes de alterar produção | 105/105 aprovados |
| 52 testes novos na integração final | 52/52 aprovados |
| V2 congelada na integração final | 99 aprovados, 6 falhos |
| npm test, incluindo V2 + regressões + novos | 249 aprovados, 7 falhos (256) |
| e2e históricos + opt-in sem servidores | 29 aprovados, 4 falhos; 2 testes live pulados |
| Live separado com FastAPI iniciado | 2/2 aprovados |
| lint e build | exit 0; aviso antigo String(url) no teste V2 |

A V2 foi desenhada para devolver somente evidência à futura LLM, não para gerar resposta. Quatro testes unitários V2 não configuram geração/URL após simular buscarContexto; dois HTTP V2 devolvem o JSON de busca também na chamada gerar. Uma regressão unitária fornece um AiService que só tem buscarContexto. Quatro e2e de sucesso têm o mesmo contrato anterior. Essas falhas foram registradas, sem tratar todas as suítes como aprovadas ou alterar expectativas.

Não se editaram V1/V2, testes antigos, matriz ou configurações de coleta para esconder falhas. Foi solicitada decisão sobre atualização legítima das regressões não acadêmicas e uso da V2 congelada como referência na baseline. Naquela execução, a entrega permaneceu sem commit, aguardando decisão e checks adequados. Não houve push, PR ou merge.

Cobertura dos 52 testes novos, somente AiService e OrchestrationService: linhas 66/77 (85,71%), branches 84/93 (90,32%), statements 67/80 e funções 10/12. A cobertura inclui também caminhos antigos desses arquivos que os testes novos não pretendem cobrir integralmente. Não equivale à cobertura de todos os requisitos nem se compara diretamente aos denominadores V2 antigos. A medição da V2 com falhas não é usada como aprovação da integração.

Evidências locais desta etapa: /home/victor/codex-chatbot-handoff/integracao-gerar-20261102T011136Z. Logs de cada tentativa, stdout/stderr, comandos e exits, baseline, cobertura HTML/JSON, diff e fontes finais preservados. Originais acadêmicos foram conferidos por hash e permanecem intactos.

## Conclusão da migração

A migração foi autorizada e validada em etapa posterior. Consulte [REGRESSAO_GERAR.md](REGRESSAO_GERAR.md) para a classificação nominal das 11 incompatibilidades, os comandos correntes e a reprodução histórica separada. Os resultados acima são o registro da primeira etapa; não representam o estado corrente.
