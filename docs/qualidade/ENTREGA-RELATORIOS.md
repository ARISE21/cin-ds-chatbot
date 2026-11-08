# Relatórios da Sprint 3 - consolidação de Rafael

## Revisão vigente de 08/11

Usar [análise crítica de 08/11](../testes/analise-critica-sprint3-revisao-20261108.pdf)
e [refatorações parciais de 08/11](relatorio-refatoracoes-sprint3-parcial-20261108.pdf).
Os PDFs de 06/11 e 07/11 abaixo permanecem como histórico. A revisão registra o
[fechamento do backend](../testes/fechamento-backend-20261108/README.md), com as seis
regressões corrigidas, sem converter a correção funcional em terceira refatoração.
Rafael assumiu também o fechamento do backend por acordo informado com Victor.
Para finalizar os PDFs, continuam necessárias a terceira refatoração de Eric e a
consolidação documental da equipe. Os avisos de 07/11 sobre backend não são seu estado atual.

Responsabilidade atualizada em 07/11/2026 por acordo informado por Rafael: ele assume
os dois PDFs. Referências antigas a Ricardo como autor do PDF de refatoração são
históricas. Ricardo continua com curadoria, fontes e consolidação das dívidas.

## PDFs disponíveis para revisão

| Documento | Arquivo | Estado |
|---|---|---|
| Análise crítica, Parte 1 | [Revisão de 07/11](../testes/analise-critica-sprint3-revisao-20261107.pdf) | 5 páginas; revisada com os achados de integração, sujeita à conferência da equipe |
| Refatorações, Parte 2 | [Relatório parcial](relatorio-refatoracoes-sprint3-parcial.pdf) | 3 páginas; apenas 2 de 3 itens comprovados; não entregar como final |

O PDF anterior de análise crítica, datado de 06/11, continua preservado byte a byte.
Usar a revisão de 07/11 como texto mais recente; não enviar versões concorrentes
como se fossem entregas diferentes. Apêndices da análise: matriz, log e referências
integrais, conforme [índice](../testes/CONSOLIDACAO-SPRINT3.md). Esses arquivos devem
acompanhar o PDF; o corpo de cinco páginas não os incorpora integralmente.

## O que foi preparado sem esperar novos avanços

- Relatório de refatoração com diagnóstico, consequência, justificativa de escolha,
  técnica, preservação de comportamento, commit e testes antes/depois de BACK-REF-01
  e IA-REF-02; reflexão crítica sobre leitura, LLM e ferramentas.
- Terceira seção explicitamente pendente: não foram inventadas evidências do Eric.
- Revisão da análise crítica mantendo sete seções e métricas históricas, com
  distinção entre resultados controlados e achados atuais do corpus/HTTP/UI.
- Geradores editáveis: `gerar_relatorio_refatoracoes.py` nesta pasta e
  `../testes/gerar_relatorio_critico.py`. Dependência de autoria: ReportLab.

Nenhuma suíte histórica foi reexecutada para compor os PDFs. Nenhum código de
backend/interface/dados foi alterado nesta preparação dos relatórios. Os arquivos
locais da etapa anterior de ingestão continuam separados dessas mudanças documentais.

## Dependências para finalizar

**Eric:** fornecer terceiro ID ligado à dívida técnica, diagnóstico e justificativa,
técnica, commit com ID, versão de produção e logs V2 antes/depois; testes devem
caracterizar primeiro o trecho caso não haja cobertura. Concluir benchmark e validar
o comportamento de exibição de resposta/fonte e fallback. Não basta print de interface.

**Victor:** revisar a descrição de BACK-REF-01 e os resultados históricos; complementar
prompts/metadados históricos se disponíveis; alinhar com Eric as seis regressões de
URL identificadas. Não é necessário implementar nova refatoração para redigir o PDF.

**Ricardo:** validar páginas em imagem, relação ano/perfil e fontes dos PPCs; entregar
registro de dívida e log de identificação nos caminhos exigidos
`docs/qualidade/divida-tecnica.md` e `docs/qualidade/log-analise.md`. Se menos de cerca
de oito itens forem confirmados, documentar escopo procurado e achados descartados,
conforme roteiro. Não transformar toda falha funcional em dívida de projeto.

**Rafael:** publicar esta preparação, receber as evidências, substituir a terceira
seção e condensar o PDF para continuar com no máximo três páginas; atualizar a revisão
da análise se o benchmark mudar conclusões. Conferir os dois PDFs com os responsáveis.

Não alterar V1, hashes ou resultados antigos para fazê-los coincidir com a main atual.
Falhas atuais não invalidam automaticamente a medição histórica, nem a medição antiga
prova que o código atual está sem defeitos. Os achados atuais estão em
[validação dos PPCs](../testes/validacao-ppcs/README.md).

## Reprodução dos documentos

Na raiz, com Python e ReportLab disponíveis:

```powershell
python docs/qualidade/gerar_relatorio_refatoracoes.py --saida docs/qualidade/refatoracoes-nova-revisao.pdf
python docs/testes/gerar_relatorio_critico.py --saida docs/testes/analise-critica-nova-revisao.pdf
```

Os geradores exigem destino novo para evitar sobrescrever históricos. Após alterar o
texto, renderizar e conferir todas as páginas: somente extrair texto não valida layout.
O manifesto `relatorios-sprint3-verificacao.json` registra os PDFs desta rodada e suas
fontes; uma nova revisão requer nova verificação. Não é um certificado de aprovação
acadêmica nem substitui a revisão humana dos diagnósticos.

Entrega informada: 15/11 às 23h59, sem apresentação. Estes PDFs não substituem matriz,
log, testes versionados, HTMLs de cobertura, registro de dívidas e commits identificados.
