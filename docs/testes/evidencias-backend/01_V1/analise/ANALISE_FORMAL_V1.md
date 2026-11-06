# Análise formal da V1 — Sprint 3, US-02 e US-03

## Parecer e método

A V1 está aprovada na execução preservada (65/65), mas não demonstra integralmente os requisitos aprovados. O principal déficit é CA-02.4 (tratamento real de falhas de transporte/contrato e resposta HTTP segura). CA-03.6 também tem comprovação parcial do erro HTTP seguro. Não foi encontrada falha funcional executada; os riscos abaixo são inferências estáticas sobre o que as asserções deixam passar, não mutações executadas.

Esta avaliação lê a matriz, os três testes originais, código de produção pertinente, configuração exclusiva, log, RESULTADO.json, vitest-results.json e relatórios coverage-summary/coverage-final. Não executa novamente testes, não altera a matriz, não cria V2. O inventário CSV lista as 65 instâncias aprovadas; laços internos com cinco valores não são cinco testes separados no relatório Vitest.

Base: `9d328dc463f3e47588811a37eafece6f13f3f891`. Matriz: `docs/testes/matriz-rastreabilidade.md` do worktree formal. O documento declara aprovação; último commit da matriz é `97aa72f24bdd0b2fd58add3c217a9c0ded7fa488` (30/10/2026), ancestral da base e anterior à geração de 02/11/2026 UTC. A seção 7 mantém checkboxes desmarcados e o preâmbulo conserva linguagem preparatória. Isso é uma inconsistência documental residual, não prova de ausência de aprovação; não se preenchem nem alteram esses registros. A confirmação individual dos quatro integrantes não foi demonstrada por atas nesta avaliação.

US-02 exige encaminhamento quando falta sustentação documental, sem confundir falha técnica com falta de evidência. US-03 exige rascunho para setor responsável, com preenchimento seguro dos dados opcionais. US-01 não é avaliada, mas a validação do contrato ai-service é pertinente a CA-02.4.

## Evidência de execução e cobertura

| Arquivo | Testes aprovados | Linhas | Branches |
|---|---:|---:|---:|
| fallback-config.spec.ts / fallback.config.ts | 19 | 9/9 | 7/7 |
| fallback-email.spec.ts / fallback.service.ts | 30 | 25/25 | 40/40 |
| orchestration.spec.ts / orchestration.service.ts | 16 | 11/11 | 6/6 |
| Total | 65/65 | 45/45 (100%) | 53/53 (100%) |

Statements 47/47 e funções 7/7. Vitest 4.1.11, provider v8, exit 0, duração 2,27 s. O JSON registra 6 suites lógicas, mas contém 3 entradas de arquivos; o log confirma 3 arquivos. A inclusão da cobertura é explicitamente limitada aos três arquivos de produção. AiService, controller, módulos NestJS, transporte e FastAPI ficam fora do denominador. O HTML é a apresentação dos mesmos resultados, não evidência independente de requisitos.

## Rastreabilidade por critério de aceitação

Convenção: **Sim** significa que a obrigação funcional tem oráculo direto no nível unitário; não significa certificação HTTP ou de todas as combinações. **Parcial** indica obrigação expressa sem oráculo suficiente. **Não** indica ausência de teste correspondente. Nomes abaixo são os títulos reais das declarações; parâmetros estão entre parênteses. `O` = orchestration.spec.ts; `E` = fallback-email.spec.ts; `C` = fallback-config.spec.ts. Fontes exatas e hashes estão no manifesto de fontes e no inventário CSV.

| Critério aprovado | V1 | Testes que realmente verificam / restrição |
|---|---|---|
| CA-02.1: contexto não vazio e distância < 0.8 → false | Sim | O: “mantém a resposta com evidência suficiente e não gera e-mail” (0.2; igualdade integral e ausência do rascunho); “aceita uma distância imediatamente abaixo do limite” (0.799999; verifica flag). |
| CA-02.2: distância ≥ 0.8 → true, setor e template | Sim | O: “aciona fallback para distância %s no limite ou acima” (0.8, 0.800001, 1.2); setor SecGrad, template contendo pergunta e chamada ao gerador real. O: “integra fallback e rascunho com os dados informados pelo estudante” (0.9). |
| CA-02.3: contexto vazio mesmo com distância baixa → fallback | Sim | O: “aciona fallback para contexto vazio ou branco (%j)” ('', espaços, quebra/tab; distância 0); verifica contexto e flag. Não verifica template/setor nesses três cenários. |
| CA-02.4: indisponibilidade, timeout e resposta inválida → erro HTTP seguro, sem fallback | Parcial | O: “propaga indisponibilidade da busca sem produzir rascunho”; mock rejeita com ServiceUnavailableException previamente criada e teste exige a mesma instância, sem gerarEmail. Não provoca rede, timeout, parsing ou validação; não verifica HTTP nem sanitização. |
| CA-03.1: estágio, requerimento, dispensa ou segunda chamada → SecGrad | Sim | E: “sugere setor para %s respeitando a prioridade implementada” (ESTÁGIO, estagio, requerimento, dispensa, segunda chamada), igualdade direta do setor. SecGrad também é o padrão: veja risco de falso positivo abaixo. |
| CA-03.2: pedagógico → NEAP | Sim | E: mesmo parametrizado (apoio pedagógico, apoio pedagogico); “compõe o rascunho completo e remove espaços externos dos campos”; “usa o assunto informado para sugerir setor e preserva a pergunta no corpo”. |
| CA-03.3: pós-graduação → Secretaria de Pós-Graduação | Sim | E: parametrizado de setor (pós-graduação, pos-graduacao, pós graduação), igualdade direta. Não passa pelo controller. |
| CA-03.4: assunto não reconhecido → SecGrad | Sim | E: parametrizado (assunto sem palavra-chave) e template integral sem dados. |
| CA-03.5: dados ausentes → marcadores editáveis, sem undefined/null | Sim | E: “usa marcadores de preenchimento e a pergunta como assunto quando os dados são omitidos”: igualdade integral contém os cinco marcadores e exclui implicitamente undefined/null. E: “trata campos em branco como ausentes” compara ao resultado sem dados. Não há teste de fluxo de fallback sem dados na orquestração. |
| CA-03.6: textos fornecidos aparecem; tipos incompatíveis → HTTP 400 seguro | Parcial | E: template completo verifica nome, matrícula, curso, perfil, assunto, resumo; “rejeita estrutura inválida de dados (%j)” e “rejeita valor não textual no campo %s” verificam classe BadRequestException. O: “valida dados pessoais mesmo quando a busca poderia responder” verifica classe e nenhuma busca. Status serializado e mensagem segura não são assertados. |

Resultado por critérios: **8 Sim, 2 Parcial, 0 Não**, segundo a convenção unitária acima. Não converter essa contagem em “80% dos requisitos completos”: critérios têm obrigações de tamanhos diferentes, e há lacunas de fronteira HTTP.

## Correspondência aos 15 casos esperados da matriz

| Caso | V1 | Evidência e diferença para a entrada literal |
|---|---|---|
| CT-02.01 (0.7999) | Sim | O “aceita uma distância imediatamente abaixo do limite”, usa 0.799999. Cobre a partição, não o número literal 0.7999. |
| CT-02.02 (0.8) | Sim | O parametrizado de distância, 0.8; verifica true, setor e template. |
| CT-02.03 (0.8001) | Sim | O parametrizado de distância, 0.800001. Mesma partição; 0.8001 exato ausente. |
| CT-02.04 (vazio, 0.1) | Sim | O parametrizado de contexto, vazio com 0. Cobre contexto vazio com distância baixa; 0.1 literal ausente. |
| CT-02.05 (HTTP 503 seguro) | Parcial | Exceção 503 injetada na dependência; apenas propagação/ausência de rascunho comprovadas. |
| CT-02.06 (timeout, HTTP 504) | Não | Não há timeout nem GatewayTimeoutException na V1. |
| CT-02.07 (JSON/contrato inválido, distância não finita, página 0 → 502) | Não | buscarContexto é simulado; nenhum desses contratos inválidos é exercitado. |
| CT-03.01 (estágio) | Sim | E parametrizado: ESTÁGIO e estagio. |
| CT-03.02 (dispensa) | Sim | E parametrizado: dispensa. |
| CT-03.03 (pedagógico) | Sim | E parametrizado e template completo. |
| CT-03.04 (pós-graduação) | Sim | E parametrizado: pós-graduação e variantes. |
| CT-03.05 (padrão) | Sim | E parametrizado: assunto sem palavra-chave. |
| CT-03.06 (fallback sem dados/curso/perfil) | Parcial | E gera diretamente o template sem dados e verifica todos os marcadores; falta comprovar sua entrega no fluxo processar quando dados_email está ausente. |
| CT-03.07 (textos informados) | Sim | E igualdade integral do rascunho; O integração com nome/matrícula/resumo. |
| CT-03.08 (nome=123, HTTP 400 seguro) | Parcial | E usa 42 e outros tipos; O usa exatamente 123, exige BadRequestException e não busca. Não verifica mensagem nem resposta HTTP. |

Contagem: 10 Sim por partição, 3 Parcial, 2 Não. Classificar os três valores alternativos como cobertura equivalente não os apresenta como execução literal da matriz. Se o protocolo exigir reprodução exata, CT-02.01/03/04 devem ser considerados parciais quanto aos dados; nesse recorte a contagem passa a 7 Sim, 6 Parcial e 2 Não.

## Partições e valores-limite

| Entrada pertinente | Cobertura observada | Lacuna / limite não testado |
|---|---|---|
| distancia_minima | 0, 0.2, 0.799999, 0.8, 0.800001, 0.9, 1.2; com limiar 1.5 usa 1.4 | 0.7999/0.8001 literais; NaN/Infinity/-Infinity no contrato externo. Distância não é probabilidade; não inventar teto 1. |
| contexto | texto longo válido, '', espaços e quebra/tab | Comprimento útil exatamente 1 e combinações com limiar; matriz destaca 0/1, não todas as combinações. |
| assunto | quatro grupos SecGrad, pedagógico com/sem acento, três variantes de pós; genérico; ausente/branco | Um caractere textual; regra para assuntos mistos não definida pela matriz. |
| dados_email | undefined, {}, estrutura null/lista/string/número/booleano; quatro campos com null/42/false/lista/objeto; brancos e dados completos | Mínimo de um caractere por campo, ausência individual combinada a outros presentes, erro HTTP/mensagem segura. null de campo é rejeitado, não marcador: distinguir de ausência. |
| curso/perfil no template | ambos textuais com trim, ausentes e brancos | Um caractere; tipos incompatíveis de curso/perfil não exercitados na fronteira de consulta. Não estender automaticamente o contrato de dados_email a esses campos. |
| resposta ai-service | somente resposta válida simulada; exceção 503 simulada | JSON inválido, campos ausentes, distância não finita, página 0/1 na validação real. A fonte com página 2 no fixture não testa validação de página. |
| pergunta/consulta | consulta ausente/null e objeto sem consulta rejeitados; pergunta válida longa | Pergunta ausente/vazia/só espaços e comprimento útil 1 não passam pelo AiService real; são fronteira compartilhada com US-01, não novos critérios autônomos de US-03. |

Aliases de curso/perfil, top_k e quantidade de resultados pertencem principalmente a US-01 e não entram na contagem desta análise. Os 19 testes de configuração do limiar (padrão, sete formatos válidos, onze inválidos) são evidência adicional de implementação, sem CT específico nesta matriz. Não compensam timeout/contrato ausentes. O teste de limiar injetado verifica decisão isolada, não leitura da variável pelo provider NestJS.

## Asserções fracas, redundância e falsos positivos possíveis

1. **Mock no ponto da obrigação principal de CA-02.4.** A V1 fabrica uma exceção segura. Se AiService parar de converter erro de rede em 503, timeout em 504 ou contrato inválido em 502, esse teste ainda pode passar. Não há prova da tradução HTTP pelo controller. Propagar a mesma instância é um bom oráculo de propagação, mas não prova sua origem ou segurança.
2. **Classe de exceção sem conteúdo.** BadRequestException normalmente tem status 400, porém a suíte não exige getStatus/getResponse, mensagem segura ou ausência de detalhes internos no JSON HTTP. Uma mensagem contendo informação indevida passaria. As 20 combinações de tipo por campo são testadas somente em validarDadosEmail; gerarEmail é exercitado para estruturas inválidas, e processar apenas para nome=123.
3. **Oráculo relacional para brancos.** “trata campos em branco como ausentes” compara duas saídas do mesmo gerador. Uma regressão específica aos dois caminhos poderia passar nessa comparação; o template integral de ausentes reduz, mas não elimina toda dependência entre oráculos. Recomendar marcadores literais e ausência de undefined/null também nesse cenário.
4. **Asserções parciais.** Contexto vazio exige só flag/contexto; poderia retornar fallback sem setor/template nesses casos. Distância abaixo do limiar exige apenas flag; o caso 0.2 com igualdade integral oferece proteção complementar. Template no limiar é exigido apenas por conter pergunta: texto incompleto ainda passaria nesses casos, embora o teste de template completo proteja outra entrada.
5. **SecGrad igual ao padrão.** Os casos isolados estágio/dispensa/requerimento/segunda chamada passariam se certas regras fossem removidas e tudo caísse no padrão SecGrad. Os assuntos mistos estágio+pedagógico e requerimento+pós reduzem esse risco para duas regras, mas não para dispensa/segunda chamada. Isso é risco de detecção, não demonstração de defeito.
6. **Prioridade derivada do código.** Os três assuntos mistos exigem a “prioridade implementada”, que a matriz não aprova explicitamente. Podem cristalizar comportamento incidental. Não concluir que são correção de requisito sem decisão da equipe; a matriz também não define desempate entre CA-03.1/2/3 simultâneos.
7. **Sobreposição útil e redundância potencial.** Distâncias 1.2 e 0.9 repetem a partição acima do limiar; 0.9 também verifica dados pessoais na integração, portanto agrega valor. 0.8 e valores adjacentes não são redundantes: detectam troca de >= por >. Os três contextos brancos cobrem trim/ausência; nenhum é substituto de contexto com um caractere. Validação direta e via gerarEmail repetem estruturas inválidas, mas protegem dois pontos de entrada. Os formatos de configuração são testes extras legítimos; não removê-los por mera semelhança. Priorizar obrigações ausentes antes de ampliar casos equivalentes.
8. **Fixture não é validação.** curso Computação/perfil 2023 e fonte página 2 são dados de respostas simuladas. Seu uso não demonstra reconhecimento desses rótulos nem validação externa. A igualdade com o fixture prova preservação, não legitimidade do contrato.

Não foram executadas mutações, contraprovas novas ou testes antigos. Nenhum falso positivo concreto de execução foi afirmado; foram identificados defeitos hipotéticos que os oráculos atuais podem deixar passar.

## Por que 100% estrutural não é 100% dos requisitos

Cobertura de linhas/branches registra passagem pelo código incluído na instrumentação; não verifica por si só se o resultado observado corresponde ao requisito, se a asserção é forte ou se a entrada representa os limites especificados. Branches não equivalem a todas as combinações, MC/DC ou todas as condições do domínio. Aqui o denominador exclui justamente AiService e HTTP, necessários para CA-02.4. Asserções de flag podem executar o ramo inteiro e ainda aceitar rascunho incompleto. Os 19 testes de configuração contribuem para cobertura estrutural sem suprir os casos 504/502. Logo, 45/45 linhas e 53/53 branches são resultados válidos e restritos; não sustentam declaração de conformidade integral de US-02/US-03.

## Recomendações registradas para futura V2 — não implementadas

| Prioridade | Melhoria futura | Evidência de conclusão desejada |
|---|---|---|
| Alta | Exercitar AiService real com transporte controlado para indisponibilidade, timeout, JSON inválido, campos ausentes, NaN/Infinity em objeto de contrato e página 0 | 503/504/502 corretos; mensagem segura; nenhuma conversão em fallback. JSON textual inválido e números não finitos devem ser preparados de forma tecnicamente distinta. |
| Alta | Testar fronteira HTTP NestJS com app local isolada e dependências controladas | Status e corpo seguros para CT-02.05/06/07 e CT-03.08; não exigir serviços externos reais. |
| Alta | Completar CT-03.06 no fluxo processar sem dados/curso/perfil | Fallback true, setor correto e todos os cinco marcadores; ausência de undefined/null. |
| Média | Reproduzir literalmente 0.7999, 0.8, 0.8001 e contexto vazio a 0.1; adicionar contexto útil de um caractere | Oráculos de flag, setor e rascunho conforme cada ramo; manter evidência original independente. |
| Média | Fortalecer template/setor nos contextos vazios e resultado preservado abaixo do limite | Não aceitar rascunho incompleto nem perda de fontes/contexto nos caminhos de fronteira. |
| Média | Dados com um caractere, ausências individuais e mensagens de erro seguras | Marcadores somente nos campos ausentes e preservação dos presentes; HTTP 400 para tipos incompatíveis previstos. |
| Média | Obter decisão humana para assuntos com múltiplas palavras-chave | Oráculos de precedência aprovados antes de usá-los como requisitos; distinguir testes adicionais de critérios aprovados. |
| Baixa | Revisar sobreposições e usar oráculos literais para brancos | Manter apenas redundância que proteja entrada/caminho distinto, sem sacrificar testes de fronteira. |

V2 deve ter prompt, saída bruta, hashes, diff e execução próprios, após autorização separada. Não reescrever V1 para preencher lacunas. A matriz original conserva “A medir”; esta tabela externa é o registro da avaliação solicitado. Não foram feitas refatorações, commit, push, merge ou PR.

## Localização e preservação

- Matriz lida: /home/victor/worktrees/cin-ds-chatbot-backend-v1-formal-20261101/docs/testes/matriz-rastreabilidade.md
- Três testes originais: /home/victor/codex-chatbot-handoff/geracao-formal-sprint3-v1-20261102T000635Z-ddf53b69/backend/test/sprint3-v1/
- Geração original e manifesto: /home/victor/codex-chatbot-handoff/geracao-formal-sprint3-v1-20261102T000635Z-ddf53b69/
- Execução e relatórios originais: /home/victor/codex-chatbot-handoff/evidencias-execucao-v1-20261102T001129Z/
- HTML original: /home/victor/codex-chatbot-handoff/evidencias-execucao-v1-20261102T001129Z/coverage/index.html
- Análise externa: /home/victor/codex-chatbot-handoff/analise-formal-sprint3-v1-20261102T002330Z/ANALISE_FORMAL_V1.md
- Inventário de resultados: /home/victor/codex-chatbot-handoff/analise-formal-sprint3-v1-20261102T002330Z/inventario-testes-v1.csv
- Integridade: integridade-manifestos-originais.json; fontes-sha256-antes.json; verificacao-final.json; SHA256SUMS.

Todos os arquivos dos manifestos originais foram verificados por SHA-256 antes da gravação. Ao fim são comparados novamente os arquivos de evidência, testes de execução, produção e documentos Markdown do worktree formal. O resumo anterior foi copiado integralmente para RESUMO_ANTES.md; a atualização é aditiva. Nenhum arquivo das duas pastas de evidência originais foi sobrescrito. Esta pasta está fora do repositório, sem symlinks para ele.
