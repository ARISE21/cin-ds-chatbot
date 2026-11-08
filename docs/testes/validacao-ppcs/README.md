# PPCs: ingestão, recuperação e revisão de integração (07/11/2026)

Atualização de 08/11: as seis regressões de URL abaixo foram corrigidas e a suíte
corrente do backend passou 256/256, com e2e e serviços reais verificados. Este texto
e seus resultados de 07/11 são históricos; consulte o
[fechamento atual](../fechamento-backend-20261108/README.md). UI, benchmark e curadoria
continuam com as ressalvas descritas aqui.

## Escopo e estado

Base integrada: `484cd24a471efa7b5f2ec7983ad45cf57c5a0bf7` (merge do PR #29),
incluindo PR #30 e a consolidação do PR #28. A divergência observada anteriormente
na main foi resolvida por esse merge; não houve reset ou reescrita de histórico
nesta etapa. Branch local desta revisão: `test/ia-ppcs-validacao`.

Esta etapa valida ingestão e recuperação reais. Não substitui as evidências históricas
da V1/V2, não é a terceira refatoração formal e não certifica LLM real ou benchmark.
Não foram modificados `app.py`, `src/ui/*`, backend, PDFs ou catálogo de Ricardo.

## Alterações de Rafael

- Ingestão informa páginas sem texto e devolve `paginas_sem_texto`, sem renumerar as
  páginas físicas. O restante do conteúdo continua processado; documento inteiramente
  sem texto não substitui o índice anterior. Dois testes novos cobrem esses riscos.
- Dependência `fonttools==4.68.0` declarada após avisos do leitor de fontes PDF. Ela
  auxilia a extração, mas não resolve páginas inteiramente imagem e não faz OCR.
- Auditoria reproduzível `ai-service/scripts/validar_base_documental.py`: catálogo,
  hashes de arquivos, trechos, metadados, páginas e consultas reais nos sete pares
  curso/perfil. Não escreve no banco e exige saída nova para preservar históricos.
- README e manual corrigidos para distinguir implementação atual de requisitos
  planejados, geração mock de resposta acadêmica e ingestão em lote de módulo de funções.

## Evidências de execução

Resultado final: **21 documentos, 6.799 trechos indexados e 6.799 esperados, zero
divergências** de texto/metadados/citação contra a extração atual; sete consultas
curso/perfil com fontes elegíveis. Os sete PPCs somam 1.541 páginas físicas e cinco
delas não têm texto extraível. Isso é validação técnica com ressalvas de completude,
não aprovação institucional de todo o conteúdo nem garantia de resposta correta.

- `ingestao.txt`: primeira ingestão, 21/21 documentos; preserva os avisos originais
  de dependência ausente. Não é a execução final recomendada.
- `ingestao-com-fonttools.txt`: nova ingestão com dependência instalada e avisos de
  páginas sem texto. 21/21 documentos processados. A primeira execução já usava IDs
  determinísticos; a segunda atualiza o mesmo corpus em vez de criar cópias.
- `auditoria-final.json` e `auditoria-final-execucao.txt`: auditoria completa da base
  após a reingestão. Os números e eventuais erros devem ser lidos nesse registro.
- `regressoes-ia-completa.txt`: 20 testes aprovados (18 anteriores + 2 de ingestão).
- `v2-regressao-atual.txt`: 21 testes V2 aprovados contra o código atual; não substitui
  a medição controlada de cobertura nem altera os arquivos históricos.
- `backend-verificacao-sem-restricao.json`: 100 testes atuais selecionados, 94 passam
  e 6 falham. Não é toda a suíte backend nem a V1/V2 histórica. A execução inicial
  `backend-verificacao.json` teve também falhas EACCES de comunicação local do ambiente;
  essas falhas extras não são atribuídas ao código. `regressoes-ia.txt` e
  `auditoria-execucao.txt` são tentativas interrompidas, não resultados finais.
- `integracao-http.json`: serviços temporários reais, corpus real e geração mock.
  Busca/conversa retornou HTTP 201; geração mock 200; contexto vazio 200/null;
  geração desabilitada 503. Logs adjacentes documentam os serviços, todos encerrados.
  O cliente `enviar_pergunta` foi chamado por HTTP, sem automação visual do navegador.

## Curadoria: o que está confirmado e o que não está

Os sete PDFs e metadados foram adicionados por Ricardo, cobrindo CC/EC/SI anterior
e novo e IA novo. O catálogo tem 21 entradas. Arquivos e metadados não foram alterados.

A afirmação de extração perfeita em todas as páginas não foi confirmada. Foram
renderizadas e inspecionadas as seguintes posições físicas sem texto extraível:

| Documento | Páginas | Observação visual |
|---|---|---|
| ppc_ec_anterior.pdf | 22 | Capa de processo digitalizada, com etiqueta visível |
| ppc_si_anterior.pdf | 202 | Ata de aprovação digitalizada com conteúdo textual |
| ppc_si_novo_2024.pdf | 149, 158, 159 | Atas/anexos digitalizados com texto legível |

Essas páginas continuam fora da busca textual. Ricardo deve conferir relevância e
obter versão com texto ou coordenar OCR antes de afirmar cobertura integral. Não
foi aplicado OCR nem adulterado documento oficial nesta etapa.

A capa de IA informa 2025, embora nome/título de catálogo usem 2024. Capas dos PPCs
novos de CC/EC/SI informam 2023. Isso não prova erro de vigência (publicação e perfil
podem ter anos diferentes), mas Ricardo precisa registrar a origem e confirmar a
relação; não renomear ou mudar vigência automaticamente por inferência.

## Backend: resultado do ajuste 503/504

A mudança do Eric no método `AiService.getEndpoint` aceita localhost quando a URL
está vazia/ausente e remove a validação textual estrita da origem. Os seis testes
falhos são: busca com URL vazia, ausente, `http://busca.test?`, `http://busca.test#`,
`http://busca.test/path/..`, e geração com origem vazia. São regressões do contrato
existente, confirmadas sem a restrição de comunicação local do primeiro ensaio.

Victor/Eric devem decidir o comportamento esperado e restaurar a validação de origens
inválidas; não apagar testes para declarar aprovação. A primeira solução recomendada
para execução local é configurar `AI_SERVICE_URL=http://127.0.0.1:8000`. Timeout de
busca fria pode precisar de aquecimento/ajuste de ambiente, não enfraquecimento de URL.

503 também é esperado quando a geração está desabilitada e há contexto. Mudar o
endereço da busca não implementa o provedor LLM. 504 significa timeout, não ausência
de evidência. Não apresentar captura de contexto na tela como prova de geração.

## Interface e benchmark: pendências de Eric

O caminho HTTP NestJS é consumido e os estados de erro/fallback existem, mas:

1. `api_client.py` usa `contexto or resposta`. O teste real confirmou que o aviso mock
   recebido do NestJS não aparece no resultado do cliente. Priorizar a resposta quando
   houver geração e identificar separadamente contexto consultado; Eric deve alinhar
   essa decisão com o contrato e testar sucesso/fallback/erro.
2. O campo chamado `trecho` é uma legenda construída ("Página ... do documento ..."),
   não um trecho extraído. Exibi-lo como citação textual pode induzir a erro.
3. A rota é declarada como `@Post('api/v1/conversa')` no controller; `main.ts` não
   configura prefixo global. A rota funciona, mas a explicação enviada estava imprecisa.
4. O ensaio com "Como consertar um carburador de motocicleta?" retornou distância
   aproximada 0,454 e não acionou fallback no limiar 0,8. Um caso basta para mostrar
   uma limitação, mas não para escolher outro limiar. Calibrar com perguntas relevantes
   e fora de escopo, preservando uma amostra de validação separada.

Não há aqui nova evidência de terceira refatoração formal com ID, commit e V2 antes/
depois. Modularização existente não deve ser contada automaticamente como essa entrega.

## Como reproduzir sua parte

PowerShell na raiz, ambiente virtual ativado:

```powershell
python -m pip install -r ai-service/requirements-dev.txt
cd ai-service
python -m src.validate_catalog
python -m src.ingest_batch
python -m scripts.validar_base_documental --saida ../docs/testes/validacao-ppcs/auditoria-nova.json
python -m unittest discover -s tests -v
python -m unittest discover -s tests/v2 -v
```

A base ChromaDB é local e ignorada pelo Git: cada integrante deve executar a ingestão.
Não commitar o banco nem a cópia de segurança. O modelo padrão do Chroma requer cache
local/download inicial; primeira busca pode ser mais lenta.

## Fluxo para encerrar a Sprint

Rafael publica esta validação. Ricardo revisa páginas imagem, ano/perfil e procedência.
Eric/Victor alinham as seis regressões do backend e a apresentação da geração.
Eric executa o benchmark real da planilha, acrescenta perguntas dos PPCs e casos
negativos, e entrega a terceira refatoração formal. Rafael apoia RAG e revisa o adendo
da análise crítica após resultados. Ricardo consolida dívidas e PDF de refatorações
até três páginas; equipe confere pacote final até 15/11, 23h59, sem apresentação.

Os dois roteiros de Sprint 3 exigem testes gerados por LLM e análise/refatoração;
não confundem isso com integração obrigatória de provedor real nessa entrega. React,
Keycloak/LDAP e Docker Compose/Swarm continuam requisitos gerais a acompanhar.
