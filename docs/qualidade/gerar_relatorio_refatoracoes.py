"""Relatório parcial: duas refatorações comprovadas; terceira pendente.

Executar com reportlab instalado. Não executa testes ou modifica produção.
"""
import argparse
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, PageBreak

HERE = Path(__file__).resolve().parent
STYLES = getSampleStyleSheet()
STYLES.add(ParagraphStyle(name='Texto', fontName='Helvetica', fontSize=10, leading=13.5, spaceAfter=8))
STYLES.add(ParagraphStyle(name='Titulo', fontName='Helvetica-Bold', fontSize=19, leading=23, spaceAfter=12))
STYLES.add(ParagraphStyle(name='Sub', fontName='Helvetica-Bold', fontSize=11.5, leading=15, spaceBefore=7, spaceAfter=6))
STYLES.add(ParagraphStyle(name='Pequeno', fontName='Helvetica', fontSize=8, leading=10.5, spaceAfter=6))
STYLES.add(ParagraphStyle(name='Codigo', fontName='Courier', fontSize=8, leading=11, spaceAfter=8))
REPO = 'https://github.com/rafael-ramos-c/cin-ds-chatbot'


def construir(destino):
    story = []

    def p(text, style='Texto'):
        story.append(Paragraph(escape(text).replace('\n', '<br/>'), STYLES[style]))

    def h(text):
        p(text, 'Sub')

    def link(label, url):
        story.append(Paragraph(f'<link href="{escape(url)}" color="#135b86">{escape(label)}</link>', STYLES['Pequeno']))

    def tabela(rows):
        cells = [[Paragraph(escape(str(c)), STYLES['Pequeno']) for c in row] for row in rows]
        t = Table(cells, colWidths=[204, 132, 132], repeatRows=1)
        t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e5edf2')),
                              ('GRID', (0, 0), (-1, -1), .35, colors.HexColor('#bdcbd4')),
                              ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                              ('LEFTPADDING', (0, 0), (-1, -1), 7),
                              ('RIGHTPADDING', (0, 0), (-1, -1), 7),
                              ('TOPPADDING', (0, 0), (-1, -1), 5),
                              ('BOTTOMPADDING', (0, 0), (-1, -1), 5)]))
        story.append(t); story.append(Spacer(1, 8))

    p('Relatório de refatorações', 'Titulo')
    p('Chatbot SecGrad | CInCoders | Sprint 3 | 07/11/2026', 'Pequeno')
    p('VERSÃO PARCIAL PARA REVISÃO - 2 DE 3 ITENS COMPROVADOS', 'Sub')
    p('O roteiro exige pelo menos três itens refatorados, cada um com ID, commit e V2 antes/depois. Este documento antecipa duas frentes com evidência preservada. Não está pronto para entrega final e não certifica a terceira refatoração ou o sistema atual sem regressões.')
    h('1. BACK-REF-01 | Victor | Duplicação de decisão')
    p('Local: backend/src/orchestration/fallback.service.ts, identificarSetor. Dois ifs adjacentes retornavam SecGrad. A duplicação fragmentava a manutenção do mesmo destino; uma alteração poderia atualizar só parte das palavras-chave. Categoria: Duplicated Code e integridade conceitual, sem atribuir violação de todos os princípios SOLID.')
    p('Escolha: pequena mudança com proteção da V2 e benefício claro de manutenção. Técnica: Consolidate Conditional Expression. Consolidam-se as cinco verificações com OR e um único retorno, preservando ordem, curto-circuito e prioridade dos ramos NEAP, pós-graduação e padrão.')
    p('Antes: if (A) return S; if (B) return S;\nDepois: if (A || B) return S;', 'Codigo')
    p('A e B são condições puras sobre a mesma string. Essa equivalência e a inspeção do diff sustentam a preservação; testes são evidência complementar. Assuntos mistos mantêm regras herdadas, não passam a representar requisitos novos.')
    tabela([['Evidência histórica', 'Antes', 'Depois'],
            ['V2 congelada (4 arquivos)', '105/105', '105/105'],
            ['Linhas - escopo original', '45/45 (100%)', '43/43 (100%)'],
            ['Branches - escopo original', '53/53 (100%)', '51/51 (100%)'],
            ['Linhas - escopo ampliado', '85/90 (94,44%)', '83/88 (94,31%)'],
            ['Branches - escopo ampliado', '108/113 (95,57%)', '106/111 (95,49%)']])
    p('A redução dos denominadores explica a pequena queda percentual ampliada: permanecem cinco linhas e cinco entradas de branch descobertas. Não houve remoção de testes ou perda de cobertura de caminho antes exercitado. Não somar esta execução aos testes atuais.', 'Pequeno')
    link('Commit BACK-REF-01: f7a067f (diff completo antes/depois)', REPO + '/commit/f7a067fb7886d1b68621ca57af42cf051dfe02a1')
    p('Baseline: 9d328dc. Evidências locais: docs/qualidade/BACK-REF-01-evidencias/antes e depois (execucao.json, estado-versao.json); relatório BACK-REF-01-relatorio.md. HTML completo: docs/testes/evidencias-backend/03_REFATORACAO/antes/coverage/index.html e depois/coverage/index.html.', 'Pequeno')

    story.append(PageBreak())
    p('Validação vetorial com mais coesão', 'Titulo')
    h('2. IA-REF-02 | Rafael | Extract Function')
    p('Local: ai-service/src/retriever.py, buscar_contexto. A função valida entradas, acessa coleção, verifica retorno, formata contexto e monta fontes. A integridade das listas/distâncias é uma responsabilidade distinguível. Categorias: Long Method, coesão e SRP; o problema é a mistura de razões de mudança, não apenas contar linhas.')
    p('Escolha: isolar uma responsabilidade já coberta e de baixo risco. Técnica: Extract Function, extraindo _validar_resultado_vetorial. O bloco permanece no mesmo ponto do fluxo, antes da formatação. A nova função é interna e não cria contrato público nem dependência entre testes e detalhe privado.')
    p('Antes: buscar_contexto contém o bloco que compara os tamanhos das listas e percorre as distâncias, rejeitando tipos inválidos e números não finitos. Depois: buscar_contexto chama a função interna que contém literalmente esse bloco. A validação de páginas permanece no lugar original.')
    p('Listas de comprimentos diferentes e distâncias inválidas continuam lançando InvalidSearchResult com as mesmas mensagens. Não se altera política de fallback, cálculo de distância, fonte ou tratamento HTTP. A extração não resolve todas as responsabilidades restantes do retriever.')
    tabela([['Evidência histórica', 'Antes', 'Depois'],
            ['V2 congelada', '21/21', '21/21'],
            ['Linhas', '91/95 (95,79%)', '93/97 (95,88%)'],
            ['Branches', '41/42 (97,62%)', '41/42 (97,62%)'],
            ['Regressões existentes', 'Não repetidas', '18/18']])
    p('A definição e a chamada acrescentam linhas instrumentadas; o aumento percentual de linhas não é ganho de comportamento testado. O branch faltante continua existindo. A mesma V2 foi congelada em 55a852c antes da mudança; hashes nos dois manifestos permitem conferir a identidade da suíte.')
    link('Commit IA-REF-02: 8e2f8f6 (diff completo antes/depois)', REPO + '/commit/8e2f8f6')
    link('Congelamento da V2: 55a852c', REPO + '/commit/55a852c')
    p('Antes: docs/testes/relatorios/us01-controlado/v2/execucao.json e html/index.html. Depois: docs/qualidade/IA-REF-02-evidencias/depois/execucao.json e html/index.html. Registro: IA-REF-02-divida.md e IA-REF-02-relatorio.md.', 'Pequeno')
    h('Histórico não equivale à certificação da main atual')
    p('As duas frentes acima usam medições históricas controladas, anteriores a mudanças posteriores na integração. Em 07/11, a IA teve 20 regressões e 21 testes V2 aprovados. Um recorte atual de 100 testes backend teve 94 aprovados e seis falhas de configuração/URL após o ajuste do PR #29. Isso não altera os resultados históricos nem permite declarar a versão atual sem falhas.')
    p('A ingestão agora avisa sobre páginas sem texto e possui dois testes novos. É correção de observabilidade/contrato de retorno, não terceira refatoração sem mudança de comportamento. Do mesmo modo, alterar URL padrão é mudança funcional e não substitui a terceira entrega.', 'Pequeno')

    story.append(PageBreak())
    p('Fechamento e reflexão crítica', 'Titulo')
    h('3. Terceiro item | Eric | Evidência pendente')
    p('Não há no material conferido evidência suficiente para registrar um terceiro item concluído. A modularização da interface e o ajuste do endereço do serviço não foram convertidos retrospectivamente em uma refatoração formal com resultados antes/depois. Não foram inventados ID, testes, métricas, autoria ou commit.')
    h('O que Eric precisa entregar para substituir esta seção')
    p('1. ID ligado ao registro de dívida; local exato, categoria, consequência e justificativa da escolha.\n2. Nome da técnica do catálogo e trecho antes/depois ou link do commit identificado.\n3. V2 executada antes da alteração, com resultado, versão de produção e suíte identificadas. Se o trecho não tem teste, caracterizar primeiro o comportamento.\n4. Mesma suíte após a refatoração, com logs e diferenças investigadas.\n5. Explicação do que foi preservado e do que melhorou; confirmação pelo responsável.')
    p('Rafael substitui esta seção pelas evidências recebidas e mantém o limite total de três páginas, condensando as seções se necessário. Não anexar uma quarta página para contornar o limite. Ricardo continua responsável pela curadoria e pelo registro consolidado das dívidas conforme a divisão do grupo.')
    h('Comparação: leitura humana, ferramentas e LLM')
    p('Na identificação registrada, a leitura do fluxo e o apoio de LLM localizaram responsabilidades misturadas no retriever e decisões com o mesmo retorno no fallback. O histórico não isola o que cada abordagem descobriu primeiro; portanto, não se afirma uma descoberta exclusiva da pessoa ou da LLM.')
    p('A inspeção dos trechos confirmou por que as mudanças são pequenas e preservam ordem/efeitos. Também impediu um falso enquadramento: adicionar avisos de páginas omitidas ou mudar configuração não é apenas refatorar. Esse é um julgamento de requisito e comportamento que cobertura sozinha não faz.')
    p('Vitest/coverage-v8 e coverage.py medem execução e branches; não diagnosticam SRP nem aprovam utilidade de extrações. Seus denominadores expõem que remoção de condicionais ou inclusão de função pode mudar percentuais sem perder/ganhar capacidade de teste. Não houve execução documentada de Sonar, jscpd ou analisador de smells; não se atribuem resultados a essas ferramentas.')
    p('O uso de LLM serve à proposta e ao registro, com revisão crítica dos responsáveis. Sugestões não comprovadas devem permanecer abertas ou ser descartadas com motivo. A comparação manual versus LLM permanece limitada pela falta de registro separado de autoria dos achados; o log consolidado ainda precisa ser conferido pela equipe.')
    h('Condições para a versão final')
    p('Completar terceiro item, conferir os links/hashes, integrar o registro de dívida técnica e log de identificação (docs/qualidade/divida-tecnica.md e log-analise.md) e revisar os dois itens existentes com seus responsáveis. Corrigir as regressões atuais sem reescrever evidências históricas. Este PDF parcial pode ser versionado agora, mas não cumpre sozinho o mínimo de três refatorações.')
    p('Fontes: relatórios de BACK-REF-01/IA-REF-02 e seus manifestos; validação atual em docs/testes/validacao-ppcs/README.md. As evidências completas acompanham no repositório; não foram reexecutadas as suítes históricas para montar este documento.', 'Pequeno')

    def rodape(canvas, doc):
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor('#4a5c69'))
        canvas.drawString(59, 30, 'Sprint 3 | PARCIAL - falta terceira refatoração')
        canvas.drawRightString(A4[0] - 59, 30, str(doc.page))

    SimpleDocTemplate(str(destino), pagesize=A4, rightMargin=59, leftMargin=59,
                      topMargin=45, bottomMargin=48,
                      title='Refatorações da Sprint 3 - parcial, duas de três',
                      author='Equipe CInCoders - consolidação de Rafael').build(
                          story, onFirstPage=rodape, onLaterPages=rodape)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--saida', type=Path, default=HERE / 'relatorio-refatoracoes-sprint3-parcial.pdf')
    args = parser.parse_args()
    if args.saida.exists():
        parser.error('Use uma saída nova; não substituir evidência anterior automaticamente.')
    construir(args.saida)
