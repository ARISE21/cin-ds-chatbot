# Sprint 3 — Matriz de rastreabilidade de testes

> **Status:** aprovada em conjunto pela equipe, conforme confirmação de Rafael nesta conversa. A professora autorizou elaboração com apoio de LLM, conforme relato de Rafael. O histórico de assistência permanece registrado.
>
> Esta versão foi preparada a partir do comportamento já implementado no projeto. Antes da geração da suíte V1, os quatro integrantes devem conferir as histórias, os critérios, as partições, os limites e os resultados esperados. A assistência utilizada está registrada em `docs/testes/llm-log.md`.

## 1. Objetivo e escopo

Esta matriz define a base de testes da Sprint 3 para três funcionalidades que já existiam no MVP da Sprint 2:

1. busca semântica de documentos com filtros de curso e perfil curricular;
2. acionamento de fallback quando a evidência recuperada é insuficiente;
3. geração de um rascunho de e-mail para encaminhamento ao setor adequado.

A futura geração de resposta por LLM (`/api/v1/gerar`) não faz parte desta matriz, porque ainda não estava implementada na Sprint 2. A interface Streamlit também não é usada como objeto principal nesta versão: os testes se concentram nos contratos do FastAPI e do NestJS que sustentam o fluxo real.

## 2. User stories selecionadas

### US-01 — Buscar evidências acadêmicas aplicáveis

**Como** estudante do CIn, **quero** pesquisar uma dúvida informando meu curso e perfil curricular, **para** receber trechos de documentos oficiais aplicáveis à minha situação, acompanhados das fontes consultadas.

### US-02 — Receber fallback quando não houver evidência suficiente

**Como** estudante do CIn, **quero** ser encaminhado com segurança quando a busca não encontrar evidência suficientemente próxima, **para** evitar uma resposta acadêmica apresentada como certa sem sustentação documental.

### US-03 — Obter um rascunho de e-mail de encaminhamento

**Como** estudante do CIn, **quero** receber um rascunho de e-mail direcionado ao setor responsável, **para** continuar o atendimento mesmo quando o chatbot não puder responder diretamente.

## 3. Critérios de aceitação

### US-01 — Busca semântica

- **CA-01.1:** Dada uma pergunta não vazia, um curso reconhecido, um perfil reconhecido e `top_k` inteiro positivo, quando a busca for executada, então o serviço deve aplicar os filtros correspondentes e retornar HTTP 200.
- **CA-01.2:** Quando houver trechos recuperados, então a resposta deve conter `contexto`, `distancia_minima` finita e uma lista de fontes; cada fonte deve informar `arquivo`, `pagina` inteira maior ou igual a 1 e `curso`.
- **CA-01.3:** Quando a coleção não devolver resultados, então o serviço deve retornar `contexto` vazio, `fontes` vazias e `distancia_minima` igual a `1.0`.
- **CA-01.4:** Quando a pergunta estiver vazia ou contiver apenas espaços, `top_k` não for inteiro positivo, ou curso/perfil não forem reconhecidos, então a requisição deve ser rejeitada como inválida, sem consultar resultados como se fossem válidos.
- **CA-01.5:** Quando curso e perfil forem gerais (`Geral`/`Todos`), então nenhuma restrição de curso ou perfil deve ser adicionada à consulta vetorial.

### US-02 — Decisão de fallback

- **CA-02.1:** Dado contexto não vazio e distância estritamente menor que `0.8`, quando o NestJS orquestrar a consulta, então deve retornar `fallback_acionado: false`.
- **CA-02.2:** Dada distância maior ou igual a `0.8`, quando o NestJS orquestrar a consulta, então deve retornar `fallback_acionado: true`, `setor_sugerido` e `template_email`.
- **CA-02.3:** Dado contexto vazio, mesmo com distância menor que `0.8`, quando o NestJS orquestrar a consulta, então o fallback deve ser acionado.
- **CA-02.4:** Quando ocorrer indisponibilidade, timeout ou resposta inválida do serviço de busca, então o backend deve devolver um erro HTTP seguro; uma falha técnica não deve ser disfarçada como fallback por ausência de informação.

### US-03 — Rascunho de e-mail

- **CA-03.1:** Quando o assunto mencionar estágio, requerimento, dispensa ou segunda chamada, então o setor sugerido deve ser `SecGrad`.
- **CA-03.2:** Quando o assunto mencionar questão pedagógica, então o setor sugerido deve ser `NEAP`.
- **CA-03.3:** Quando o assunto mencionar pós-graduação, então o setor sugerido deve ser `Secretaria de Pós-Graduação`.
- **CA-03.4:** Quando nenhum assunto específico for reconhecido, então o setor padrão deve ser `SecGrad`.
- **CA-03.5:** Quando nome, matrícula, curso, perfil ou resumo não forem informados, então o rascunho deve usar marcadores editáveis e não deve exibir `undefined` ou `null`.
- **CA-03.6:** Quando os dados pessoais forem fornecidos como texto, então eles devem aparecer no rascunho; valores de tipos incompatíveis devem causar HTTP 400 com mensagem segura.

## 4. Entradas, partições de equivalência e valores-limite

| Entrada | Partição válida | Partição inválida ou especial | Valores-limite relevantes |
|---|---|---|---|
| `pergunta` | texto com ao menos um caractere após `trim()` | ausente, vazia ou somente espaços | comprimento útil `0` (inválido) e `1` (válido) |
| `curso` | `CC`, `EC`, `SI`, `IA` e nomes completos reconhecidos | rótulo desconhecido | não há limite numérico; testar alias curto e nome completo |
| `curso` geral | `Geral`, `Todos`, vazio ou ausente | — | partição especial: não cria filtro de curso |
| `perfil` | novo/vigente/único ou anterior/antigo | rótulo desconhecido | não há limite numérico; testar os dois grupos de aliases |
| `perfil` geral | `Todos`, `Ambos`, vazio ou ausente | — | partição especial: não cria filtro de perfil |
| `top_k` | inteiro positivo | zero, negativo, decimal, booleano ou texto | `0` (inválido) e `1` (menor valor válido) |
| resultado da coleção | um ou mais trechos | nenhum trecho | `0` resultado e `1` resultado |
| `pagina` da fonte | inteiro maior ou igual a 1 | zero, negativo, decimal ou texto | `0` (inválido) e `1` (menor valor válido) |
| `distancia_minima` | finita e abaixo de `0.8` | finita e maior ou igual a `0.8`; não finita é resposta inválida | `0.7999`, `0.8` e `0.8001` |
| `contexto` | texto não vazio após `trim()` | vazio ou somente espaços | comprimento útil `0` e `1` |
| `assunto` do e-mail | palavras-chave reconhecidas ou assunto genérico | valor não textual | testar cada grupo de palavras-chave e a partição padrão |
| `dados_email` | objeto ausente ou objeto com campos textuais opcionais | `null`, lista ou campos não textuais | vazio/ausente versus um caractere textual |
| resposta do ai-service | contrato completo e tipos válidos | JSON inválido, campos ausentes, distância não finita ou página menor que 1 | página `0/1`; distância finita/não finita |

## 5. Casos de teste esperados

### US-01 — Busca semântica

| ID | Dados de entrada ou preparação | Resultado esperado |
|---|---|---|
| CT-01.01 | pergunta válida; curso `SI`; perfil `novo`; `top_k=3`; coleção com resultados | HTTP 200; filtro com `curso_si=true` e `perfil_novo=true`; até três trechos com fontes |
| CT-01.02 | pergunta válida; curso `Geral`; perfil `Todos`; `top_k=3` | HTTP 200; consulta ao ChromaDB sem cláusula `where` |
| CT-01.03 | curso `Sistemas de Informação`; perfil `Perfil Novo / Vigente` | os rótulos da interface são normalizados para os mesmos filtros do CT-01.01 |
| CT-01.04 | pergunta válida; coleção sem documentos | `contexto=""`, `fontes=[]` e `distancia_minima=1.0` |
| CT-01.05 | `pergunta=""` | requisição rejeitada como inválida |
| CT-01.06 | `pergunta="   "` | requisição rejeitada como inválida |
| CT-01.07 | `curso="Curso inexistente"` | HTTP 422 no FastAPI; nenhuma resposta de busca válida |
| CT-01.08 | `perfil="Perfil inexistente"` | HTTP 422 no FastAPI; nenhuma resposta de busca válida |
| CT-01.09 | `top_k=0` | requisição rejeitada como inválida |
| CT-01.10 | `top_k=1` e coleção com resultados | HTTP 200; exatamente um resultado solicitado |
| CT-01.11 | `top_k=1.5` | requisição rejeitada como inválida |

### US-02 — Fallback

| ID | Dados de entrada ou preparação | Resultado esperado |
|---|---|---|
| CT-02.01 | contexto não vazio; `distancia_minima=0.7999` | `fallback_acionado=false` |
| CT-02.02 | contexto não vazio; `distancia_minima=0.8` | `fallback_acionado=true`, com setor e rascunho de e-mail |
| CT-02.03 | contexto não vazio; `distancia_minima=0.8001` | `fallback_acionado=true`, com setor e rascunho de e-mail |
| CT-02.04 | contexto vazio; `distancia_minima=0.1` | `fallback_acionado=true` |
| CT-02.05 | ai-service indisponível | HTTP 503 com mensagem segura |
| CT-02.06 | ai-service excede o timeout configurado | HTTP 504 com mensagem segura |
| CT-02.07 | ai-service responde JSON incompatível, distância não finita ou fonte com página `0` | HTTP 502; contrato inválido não chega ao frontend como sucesso |

### US-03 — Rascunho de e-mail

| ID | Dados de entrada ou preparação | Resultado esperado |
|---|---|---|
| CT-03.01 | assunto contém `estágio` | setor `SecGrad` |
| CT-03.02 | assunto contém `dispensa` | setor `SecGrad` |
| CT-03.03 | assunto contém `pedagógico` | setor `NEAP` |
| CT-03.04 | assunto contém `pós-graduação` | setor `Secretaria de Pós-Graduação` |
| CT-03.05 | assunto sem palavra-chave reconhecida | setor padrão `SecGrad` |
| CT-03.06 | fallback sem `dados_email`, curso ou perfil | template contém `[Nome]`, `[Matrícula]`, `[Curso]`, `[Perfil curricular]` e `[Resumo da situação]` |
| CT-03.07 | nome, matrícula, assunto e resumo textuais informados | valores aparecem no template do e-mail |
| CT-03.08 | `dados_email.nome=123` | HTTP 400 com mensagem segura sobre dados inválidos |

## 6. Matriz de rastreabilidade

As colunas V1 e V2 devem ser preenchidas somente depois de cada suíte ser gerada, preservada e executada. Use `Sim`, `Parcial` ou `Não`, sempre apontando o nome do teste quando houver cobertura.

| Requisito / critério | Variável | Partição ou limite | Caso esperado | Coberto V1? | Coberto V2? |
|---|---|---|---|---|---|
| US-01 / CA-01.1 | curso + perfil | específicos válidos | CT-01.01 | A medir | A medir |
| US-01 / CA-01.5 | curso + perfil | gerais | CT-01.02 | A medir | A medir |
| US-01 / CA-01.1 | aliases de curso/perfil | nome completo da interface | CT-01.03 | A medir | A medir |
| US-01 / CA-01.3 | quantidade de resultados | limite 0 | CT-01.04 | A medir | A medir |
| US-01 / CA-01.4 | pergunta | comprimento útil 0 | CT-01.05 | A medir | A medir |
| US-01 / CA-01.4 | pergunta | apenas espaços | CT-01.06 | A medir | A medir |
| US-01 / CA-01.4 | curso | partição desconhecida | CT-01.07 | A medir | A medir |
| US-01 / CA-01.4 | perfil | partição desconhecida | CT-01.08 | A medir | A medir |
| US-01 / CA-01.4 | `top_k` | limite 0 inválido | CT-01.09 | A medir | A medir |
| US-01 / CA-01.1 | `top_k` | limite 1 válido | CT-01.10 | A medir | A medir |
| US-01 / CA-01.4 | `top_k` | decimal inválido | CT-01.11 | A medir | A medir |
| US-02 / CA-02.1 | distância | imediatamente abaixo de 0.8 | CT-02.01 | A medir | A medir |
| US-02 / CA-02.2 | distância | exatamente 0.8 | CT-02.02 | A medir | A medir |
| US-02 / CA-02.2 | distância | imediatamente acima de 0.8 | CT-02.03 | A medir | A medir |
| US-02 / CA-02.3 | contexto | comprimento útil 0 | CT-02.04 | A medir | A medir |
| US-02 / CA-02.4 | transporte | serviço indisponível | CT-02.05 | A medir | A medir |
| US-02 / CA-02.4 | transporte | timeout | CT-02.06 | A medir | A medir |
| US-02 / CA-02.4 | contrato da resposta | JSON/tipos inválidos; página 0 | CT-02.07 | A medir | A medir |
| US-03 / CA-03.1 | assunto | palavra-chave estágio | CT-03.01 | A medir | A medir |
| US-03 / CA-03.1 | assunto | palavra-chave dispensa | CT-03.02 | A medir | A medir |
| US-03 / CA-03.2 | assunto | palavra-chave pedagógico | CT-03.03 | A medir | A medir |
| US-03 / CA-03.3 | assunto | palavra-chave pós-graduação | CT-03.04 | A medir | A medir |
| US-03 / CA-03.4 | assunto | partição padrão | CT-03.05 | A medir | A medir |
| US-03 / CA-03.5 | dados opcionais | ausentes | CT-03.06 | A medir | A medir |
| US-03 / CA-03.6 | dados opcionais | textos válidos | CT-03.07 | A medir | A medir |
| US-03 / CA-03.6 | dados opcionais | tipo incompatível | CT-03.08 | A medir | A medir |

## 7. Validação humana obrigatória antes da suíte V1

- [ ] Rafael confirma os rótulos, filtros e resultados esperados do `ai-service`.
- [ ] Victor confirma o contrato do NestJS, os códigos HTTP e a regra provisória de `0.8`.
- [ ] Ricardo confirma os nomes canônicos de cursos, perfis e documentos.
- [ ] Eric confirma os rótulos enviados pela interface e os dados exibidos ao usuário.
- [ ] A equipe aprova esta matriz em um commit anterior à geração da suíte V1.
- [ ] A conversa usada para gerar a V1 não recebe esta matriz.

## 8. Observações e decisões

- O limiar `0.8` é provisório e deve ser calibrado com o benchmark do corpus real.
- Distância vetorial não é probabilidade; valores menores representam maior proximidade no contrato atual.
- Erros técnicos do ai-service não equivalem a ausência de informação e não devem acionar o fallback funcional.
- A suíte V1 deve ser preservada sem melhorias manuais; correções necessárias apenas para compilar ou executar devem ser registradas no log.
- Os testes que Rafael já criou para a refatoração do RAG são testes de regressão existentes e não devem ser apresentados como a futura suíte V1 gerada pela LLM.
