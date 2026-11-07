"""Reconstrói o corpo do relatório; apêndices integrais acompanham no repositório."""
from pathlib import Path
import argparse
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle

HERE = Path(__file__).resolve().parent
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyLocal', fontName='Helvetica', fontSize=10.2, leading=14.1, spaceAfter=8))
styles.add(ParagraphStyle(name='TitleLocal', fontName='Helvetica-Bold', fontSize=20, leading=24, spaceAfter=15))
styles.add(ParagraphStyle(name='HeadLocal', fontName='Helvetica-Bold', fontSize=12, leading=16, spaceBefore=9, spaceAfter=7))
styles.add(ParagraphStyle(name='SmallLocal', fontName='Helvetica', fontSize=8.3, leading=11, spaceAfter=6))
story = []


def p(text, style='BodyLocal'):
    story.append(Paragraph(escape(text), styles[style]))


def title(text):
    p(text, 'TitleLocal')


def h(text):
    p(text, 'HeadLocal')


def table(rows, widths):
    cells = [[Paragraph(escape(str(x)), styles['SmallLocal']) for x in row] for row in rows]
    t = Table(cells, colWidths=widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e5e7eb')), ('GRID',(0,0),(-1,-1),0.4,colors.HexColor('#cbd5e1')), ('VALIGN',(0,0),(-1,-1),'TOP'), ('LEFTPADDING',(0,0),(-1,-1),7), ('RIGHTPADDING',(0,0),(-1,-1),7), ('TOPPADDING',(0,0),(-1,-1),6), ('BOTTOMPADDING',(0,0),(-1,-1),6)]))
    story.append(t)
    story.append(Spacer(1,9))


title('Análise crítica de testes')
p('Chatbot SecGrad | Sprint 3 | CInCoders | Revisão de 07/11/2026', 'SmallLocal')
h('1 Contexto e resultado principal')
p('A análise compara testes produzidos com apoio de LLM e suas melhorias para três histórias: US-01, busca documental filtrada com fontes; US-02, fallback quando não há evidência suficiente; US-03, rascunho de e-mail para encaminhamento. A V2 exerce os 26 casos aprovados. Cobertura estrutural alta, porém, não certifica a qualidade semântica do corpus, a integração completa ou a força dos oráculos.')
p('A IA usa Python, FastAPI, unittest e coverage.py 7.17.0 com branches. A US-01 foi medida sobre a produção e421ff9, com hashes idênticos entre V1 e V2. A refatoração posterior IA-REF-02 tem evidências separadas. O backend usa NestJS/TypeScript, Vitest e coverage-v8 4.1.11, Node 24.21.0. As US-02/03 foram medidas na baseline histórica 9d328dc, anterior à integração com /gerar. Regressões atuais não substituem essas suítes acadêmicas.')
h('2 Projeto de referência')
p('A matriz contém 15 critérios (5 + 4 + 6) e 26 casos (11 + 7 + 8). O inventário explicita 22 classes de entradas da IA e 22 do backend, além de 8 e 9 valores-limite por componente. Inclui entradas válidas/inválidas, fronteiras de quantidade e comprimento, limiar de distância e erros de contrato. A contagem é por variável/componente, sem produto cartesiano; não representa todas as combinações possíveis.')
p('A elaboração da matriz teve assistência de LLM. Rafael informou aprovação coletiva e autorização da professora para essa forma de elaboração; a aprovação foi registrada no commit 97aa72f antes das gerações V1. Não se atribui autoria manual independente nem se criam atas individuais retrospectivas. O inventário atômico foi explicitado no fechamento, a partir das classes já descritas na matriz.')
p('A US-01 usa coleção falsa. O backend V1 simula a busca; a V2 usa HTTP NestJS/Supertest local e simula fetch. São testes controlados: não medem Chroma real, precisão de recuperação, rede externa, UI, envio de e-mail ou provedor real de LLM.')
p('Fontes e memória de cálculo: docs/testes/matriz-rastreabilidade.md, inventario-consolidado.md, us01-fechamento.md e evidencias-backend/. Os apêndices integrais acompanham o PDF no repositório.', 'SmallLocal')

story.append(PageBreak())
title('Geração e preservação')
h('3 Protocolo da LLM')
p('Na IA, uma conversa nova recebeu US-01, critérios, módulos e framework, com instruções de partições, valores-limite e comentários por requisito, sem receber a matriz. A primeira saída foi preservada sem edição. Em 30/10/2026 foram executados 13 métodos: 11 passaram e dois concentraram nove falhas de subtestes, sem erro de importação. Não houve rodada de correção para aumentar cobertura na V1.')
p('Na medição controlada posterior, o mesmo conteúdo V1 executou 13 métodos, com 11 aprovados e nove erros de subtestes nos outros dois: a produção já rejeitava dados inválidos por InvalidSearchResult. A diferença entre falha histórica e erro atual é registrada. O blob Git coincide com o commit original 0a75b77; o checkout Windows converte finais de linha para CRLF, mudando o hash bruto local. Manifestos históricos não foram reescritos; a verificação registra os hashes e a comparação de conteúdo normalizado.')
p('No backend, a geração foi preservada em 02/11/2026 às 00:06:35 UTC (01/11, 21:06:35 em Fortaleza). Três arquivos geraram 65 instâncias Vitest, todas aprovadas em execução posterior. A V2 derivada manteve a produção e acrescentou HTTP e oráculos mais fortes, totalizando 105 instâncias aprovadas. O ZIP foi importado byte a byte: 138 arquivos, dos quais 137 estavam listados no manifesto e tiveram hashes conferidos.')
h('Limitações do protocolo documentadas')
p('O prompt integral preservado do backend nomeia as histórias e fornece código, mas não transcreve os critérios de aceitação nem pede explicitamente partições, limites e comentários por requisito, como o roteiro orientava. A análise posterior pode comparar com a matriz; isso não comprova que a LLM recebeu esse contexto na geração. A divergência permanece explícita e não é corrigida alterando a V1.')
p('Os registros identificam Codex/agente GPT-6 conforme o ambiente informado, mas não disponibilizam snapshot exato. Não se deduz a versão de implantação. O pacote não contém transcrição integral específica do pedido de melhoria V2 do backend: há relatório, diff e resultados. Victor pode complementar apenas com o histórico real, se disponível. Os resultados não são descartados por essa limitação documental.')
p('A V2 da IA corrigiu dois oráculos de origem inválida, acrescentou casos ausentes e foi ampliada de 17 para 21 métodos antes da IA-REF-02. Os pedidos de melhoria realizados neste chat estão registrados no log. Não se atribui a eles independência da matriz.')
p('Apêndice de interação: llm-log.md liga o prompt e a saída integrais da IA em v1-ia-geracao.md e os arquivos originais do backend em evidencias-backend/01_V1/geracao/. A importação não reexecutou testes nem alterou código de produção.', 'SmallLocal')

story.append(PageBreak())
title('Indicadores medidos')
h('4 Resultados com escopos comparáveis')
table([
['Indicador','IA V1 / V2','Backend V1 / V2'],
['Unidade executada','13 / 21 métodos unittest','65 / 105 instâncias Vitest'],
['Aprovados','11 / 21 métodos','65 / 105 instâncias'],
['Falhas ou erros','V1: 2 métodos, 9 erros de subtestes; V2: 0','0 / 0'],
['Não compilam/importam','0 / 0','0 / 0'],
['Linhas, mesmo escopo','72/95 (75,79%) / 91/95 (95,79%)','45/45 (100%) / 45/45 (100%)'],
['Branches, mesmo escopo','32/42 (76,19%) / 41/42 (97,62%)','53/53 (100%) / 53/53 (100%)'],
['Critérios com oráculo direto','5/5 / 5/5, com CA-01.2 em erro na V1','8/10 + 2 parciais / 10/10'],
['Casos completos, literal','10/11 / 11/11','7/15 / 15/15'],
['Partições exercitadas','22/22 / 22/22','16/22 + 1 parcial / 22/22'],
['Limites literais exercitados','8/8 / 8/8','3/9 / 9/9'],
], [125,176,176])
p('Os critérios com oráculo direto somam 13/15 (86,67%) na V1 e 15/15 na V2; isso mede presença de verificação, não conformidade universal. Casos completos: 17/26 (65,38%), mais 7 parciais e 2 ausentes, contra 26/26. Partições: 38/44 (86,36%) contra 44/44; limites por componente: 11/17 (64,71%) contra 17/17. Erros não são removidos do denominador de exercício.')
p('No backend, equivalência de partição admite 10 casos completos na V1; o recorte literal acima é mais estrito (7). Não misturar convenções. Instâncias parametrizadas do Vitest e métodos com subtestes do unittest não são unidades intercambiáveis: não se anuncia um total único de testes nem uma média simples de cobertura das duas stacks.')
p('A V2 ampliada do backend inclui AiService e controller: 85/90 linhas (94,44%) e 108/113 branches (95,57%). Esses percentuais não representam queda em relação aos 100% da V1: o escopo passou de três para cinco arquivos. No escopo original o delta é zero, com teto já alcançado. A meta de crescimento estrito de branches é impossível nesse recorte; a melhoria funcional é demonstrada pelos novos oráculos e HTTP.')
p('Nenhum teste sem asserção foi identificado nos corpos inspecionados; asserções fracas não são automaticamente triviais. Há dois grupos de integridade de retorno na IA e uma decisão de tratamento a esclarecer, não nove defeitos independentes. Backend: zero falhas funcionais observadas na V1; lacunas não são defeitos reproduzidos.', 'SmallLocal')

story.append(PageBreak())
title('Análise dos testes')
h('5 Técnicas funcionais e requisitos')
p('A V1 da IA reconheceu as classes principais e os limites 0/1, mas não testou o rótulo exato Perfil Novo / Vigente nem o enriquecimento de metadados. A V1 do backend usou vizinhos 0.799999 e 0.800001, equivalentes em partição, porém diferentes dos literais aprovados 0.7999 e 0.8001; usou contexto vazio a distância 0 em vez de 0.1. A V2 reproduz os valores literais e acrescenta contexto/campos com comprimento útil 1.')
p('No backend, CA-02.4 ficou parcial: a V1 injeta ServiceUnavailableException pronta, o que só comprova propagação. Não provoca timeout nem contrato inválido e não inspeciona HTTP seguro. CA-03.6 testa classe de exceção, sem corpo HTTP. A V2 executa AiService e controller reais com fetch controlado, verifica 503/504/502/400 e ausência de detalhes internos. Seus 40 testes HTTP ampliam a proteção sem alterar a baseline.')
h('Linhas não equivalem a decisões verificadas')
p('Na IA, enriquecer_metadados pode executar o for e o caminho codigo is not None sem executar o caminho oposto quando a lista contém Geral. O teste acrescentado test_documento_geral_na_lista cobre esse caminho. Na V2 final, o HTML ainda registra um branch descoberto e quatro linhas da abertura da coleção real não executadas; isso delimita o alcance da suíte.')
p('No backend ampliado, a validação da consulta no AiService é um exemplo de decisão parcialmente coberta: requisições válidas executam sua avaliação, mas a rejeição de consulta inválida não é exercitada nessa seleção histórica. O HTML aponta o branch faltante. Os três arquivos originais, já em 100%, não devem receber um exemplo inventado de branch descoberto.')
h('Oráculos e testes potencialmente fracos')
p('Na IA, os dois métodos problemáticos exigiam sucesso com página inválida ou distância não finita na origem. O contrato não determinava recuperação automática. A correção de produção passou a rejeitar a origem com HTTP 502; V2 afirma essa rejeição, sem inventar página ou distância. É correção de comportamento, distinta da posterior refatoração.')
p('No backend, brancos eram comparados a outra saída do mesmo gerador; classe BadRequestException não provava a mensagem segura; flag de fallback não garantia template completo. V2 acrescenta literais, corpo integral e inspeção de dados internos. Assuntos mistos herdados seguem a prioridade implementada, mas a matriz não aprova desempate: não são novos requisitos. SecGrad coincide com o padrão, então um teste isolado desse setor pode passar mesmo com regra específica removida. São riscos de falso positivo identificados por inspeção; não houve teste de mutação.')

story.append(PageBreak())
title('Melhorias e conclusão')
h('6 O que mudou na V2')
table([
['Lacuna','Melhoria e efeito observado'],
['Alias e metadados da IA','Rótulo exato, metadados gerais/multicurso e perfis. Fecha CT-01.03 e caminhos de enriquecimento.'],
['Origem inválida da IA','Oráculo de rejeição, HTTP 502, listas inconsistentes e tipos inválidos. Não altera V1.'],
['Status genérico 4xx','V2 da IA acrescenta 422 exato. Evita aprovação por status errado.'],
['Falhas técnicas do backend','AiService real e HTTP local com fetch simulado. Fecha CT-02.05/06/07.'],
['Template e dados','Corpo e marcadores literais, ausências individuais e HTTP 400 seguro. Fecha obrigações parciais de CT-03.06/08.'],
['Limites do backend','0.7999/0.8/0.8001 e comprimentos mínimos literais. Mantém 100% estrutural original, melhora evidência funcional.'],
], [135,342])
h('7 Conclusão e alcance')
p('A equipe usaria LLM para propor testes e explorar classes de entrada, preservando requisitos externos como oráculo e revisando casos contra eles. A evidência mostra por que quantidade e cobertura não bastam: 65 testes e 100% de branches no backend deixavam obrigações HTTP incompletas. O ganho da V2 está na ligação entre requisito, entrada, resultado e fronteira realmente exercitada.')
p('A IA teve aumento controlado de branches de 76,19% para 97,62%; o backend permaneceu no teto de 100% no escopo original. O atendimento literal da meta de aumento do backend requer a ressalva de teto e eventual alinhamento com o monitor, sem degradar V1, trocar denominadores ou inventar um delta.')
p('As suítes históricas foram preservadas; não se confundem os 105 testes acadêmicos com regressões posteriores adaptadas a /gerar. A revisão de 07/11 audita separadamente o corpus real: 21 documentos, 6.799 trechos e sete pares curso/perfil, sem divergência contra a extração. Há cinco páginas dos PPCs sem texto extraível; correspondência de trechos não significa completude documental. Resultados em validacao-ppcs/auditoria-final.json.')
p('O teste HTTP real com geração mock retornou 201, mas o cliente UI priorizou contexto e ocultou o aviso de simulação. Uma pergunta sobre carburador não acionou fallback (distância 0,454, limiar 0,8). Em um recorte de 100 testes atuais do backend, 94 passaram e seis falharam na configuração de URL; são regressões posteriores, não falhas da V2 histórica. Esses achados reforçam o limite dos testes controlados. Não se atribui validação completa, LLM real nem calibração a essas medições. A terceira refatoração e o pacote final permanecem pendentes.')
h('Apêndices e evidências entregues com o PDF')
p('A: matriz-rastreabilidade.md; B: llm-log.md e suas referências integrais; memória de cálculo: inventario-consolidado.md e indicadores-consolidados.json. Índice e instruções: CONSOLIDACAO-SPRINT3.md. Todos ficam na mesma pasta docs/testes e devem acompanhar este PDF.', 'SmallLocal')
p('HTML IA: relatorios/us01-controlado/v1/html/index.html e v2/html/index.html. HTML backend: evidencias-backend/01_V1/execucao/coverage/index.html e 02_V2/execucao/coverage/index.html. Comparação backend: 02_V2/comparacao-v1-v2.json; inventários CSV e análise original preservados no mesmo pacote. Importação: evidencias-backend/IMPORTACAO.json.', 'SmallLocal')


def footer(canvas, doc):
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#4b5563'))
    canvas.drawString(59, 32, 'Chatbot SecGrad | Análise crítica da Sprint 3')
    canvas.drawRightString(A4[0]-59, 32, str(doc.page))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--saida', type=Path, default=HERE / 'analise-critica-sprint3-revisao-20261107.pdf')
    args = parser.parse_args()
    if args.saida.exists():
        parser.error('Escolha uma saída nova para preservar os relatórios anteriores.')
    SimpleDocTemplate(str(args.saida), pagesize=A4, rightMargin=59, leftMargin=59, topMargin=48, bottomMargin=48, title='Análise crítica de testes - revisão 07/11/2026', author='Equipe CInCoders').build(story, onFirstPage=footer, onLaterPages=footer)
