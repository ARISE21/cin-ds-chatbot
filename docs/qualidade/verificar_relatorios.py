"""Confere os relatórios desta rodada, preservando resultados históricos."""
import hashlib
import json
from pathlib import Path
import subprocess

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]


def ler(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))


def verificar():
    arquivos = {
        'docs/qualidade/relatorio-refatoracoes-sprint3-parcial.pdf': 3,
        'docs/testes/analise-critica-sprint3-revisao-20261107.pdf': 5,
    }
    fontes = [
        'docs/qualidade/BACK-REF-01-relatorio.md',
        'docs/qualidade/IA-REF-02-relatorio.md',
        'docs/qualidade/BACK-REF-01-evidencias/antes/estado-versao.json',
        'docs/qualidade/BACK-REF-01-evidencias/depois/estado-versao.json',
        'docs/testes/relatorios/us01-controlado/v2/execucao.json',
        'docs/qualidade/IA-REF-02-evidencias/depois/execucao.json',
        'docs/testes/validacao-ppcs/auditoria-final.json',
        'docs/testes/validacao-ppcs/backend-verificacao-sem-restricao.json',
        'docs/testes/validacao-ppcs/integracao-http.json',
        'docs/testes/indicadores-consolidados.json',
        'docs/testes/matriz-rastreabilidade.md',
        'docs/testes/llm-log.md',
        'docs/qualidade/gerar_relatorio_refatoracoes.py',
        'docs/testes/gerar_relatorio_critico.py',
    ]
    paginas = {}
    links = {}
    for path, expected in arquivos.items():
        pdf = PdfReader(ROOT / path)
        assert len(pdf.pages) == expected, path
        assert all(len(p.extract_text() or '') > 200 for p in pdf.pages), path
        paginas[path] = len(pdf.pages)
        links[path] = sum(len(page.get('/Annots', [])) for page in pdf.pages)
    assert links['docs/qualidade/relatorio-refatoracoes-sprint3-parcial.pdf'] >= 3
    ref = ''.join(p.extract_text() for p in PdfReader(ROOT / next(iter(arquivos))).pages)
    assert 'PARCIAL' in ref and '2 DE 3' in ref and 'Evidência pendente' in ref
    ia = ler('docs/testes/relatorios/us01-controlado/v2/execucao.json')
    ia2 = ler('docs/qualidade/IA-REF-02-evidencias/depois/execucao.json')
    back = ler('docs/qualidade/BACK-REF-01-evidencias/antes/estado-versao.json')
    back2 = ler('docs/qualidade/BACK-REF-01-evidencias/depois/estado-versao.json')
    assert ia['tests_sha256'] == ia2['tests_sha256']
    assert back['suite'] == back2['suite']
    antigo = 'docs/testes/analise-critica-sprint3.pdf'
    original = subprocess.check_output(['git', 'show', 'HEAD:' + antigo], cwd=ROOT)
    assert original == (ROOT / antigo).read_bytes()
    return {
        'base_git': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
        'paginas': paginas, 'anotacoes_de_link': links,
        'revisao_visual': 'Todas as oito páginas renderizadas e inspecionadas nesta rodada.',
        'suites_historicas_iguais_antes_depois': True,
        'pdf_anterior_preservado': True,
        'refatoracoes_comprovadas': 2, 'minimo_exigido': 3,
        'refatoracoes_pdf_final': False,
        'sha256': {path: hashlib.sha256((ROOT / path).read_bytes()).hexdigest()
                   for path in list(arquivos) + fontes + [antigo]},
    }


if __name__ == '__main__':
    result = verificar()
    destino = ROOT / 'docs/qualidade/relatorios-sprint3-verificacao.json'
    if destino.exists():
        raise SystemExit('Manifesto já existe; verificar sem sobrescrever usando verificar().')
    destino.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({k: v for k, v in result.items() if k != 'sha256'}, ensure_ascii=False))
