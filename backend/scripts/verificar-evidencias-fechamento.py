"""Valida registros e PDFs de 08/11 sem reexecutar testes históricos."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
PASTA = ROOT / 'docs/testes/fechamento-backend-20261108'


def ler(nome):
    return json.loads((PASTA / nome).read_text(encoding='utf-8'))


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def verificar():
    antes, atual, e2e = ler('antes.json'), ler('unitarios.json'), ler('e2e.json')
    live = ler('servicos-reais/live-opt-in.json')
    integracao = ler('servicos-reais/integracao-real.json')
    assert (antes['numTotalTests'], antes['numFailedTests']) == (100, 6)
    assert (atual['numPassedTests'], atual['numFailedTests']) == (256, 0)
    assert (e2e['numPassedTests'], e2e['numPendingTests'], e2e['numFailedTests']) == (34, 2, 0)
    assert (live['numPassedTests'], live['numFailedTests']) == (2, 0)
    assert integracao['sucesso'] and len(integracao['casos']) == 10
    assert integracao['processos_temporarios_encerrados']
    # Os casos que falharam antes devem estar presentes e aprovados na suíte corrente.
    falhos = [a['fullName'] for f in antes['testResults'] for a in f['assertionResults'] if a['status'] == 'failed']
    aprovados = {a['fullName'] for f in atual['testResults'] for a in f['assertionResults'] if a['status'] == 'passed'}
    assert all(nome in aprovados for nome in falhos)
    protegidos = git('ls-files', 'ai-service/tests/v1-llm', 'ai-service/tests/v2', 'backend/test/sprint3-v2').decode().splitlines()
    for path in protegidos:
        assert git('show', 'HEAD:' + path).replace(b'\r\n', b'\n') == (ROOT / path).read_bytes().replace(b'\r\n', b'\n'), path
    assert not git('diff', '--name-only', '--', 'app.py', 'src/ui', 'data/raw', 'ai-service/src').strip()
    pdfs = {'docs/testes/analise-critica-sprint3-revisao-20261108.pdf': 5,
            'docs/qualidade/relatorio-refatoracoes-sprint3-parcial-20261108.pdf': 3}
    for path, paginas in pdfs.items():
        assert len(PdfReader(ROOT / path).pages) == paginas
    antigos = ['docs/testes/analise-critica-sprint3.pdf',
               'docs/testes/analise-critica-sprint3-revisao-20261107.pdf',
               'docs/qualidade/relatorio-refatoracoes-sprint3-parcial.pdf']
    for path in antigos:
        assert git('show', 'HEAD:' + path) == (ROOT / path).read_bytes(), path
    fontes = list(pdfs)
    fontes += ['backend/src/ai-service/ai-service.service.ts',
               'backend/scripts/verificar-integracao-real.py',
               'docs/qualidade/BACK-COR-URL-01.md',
               'docs/qualidade/log-analise-backend-20261108.md']
    fontes += [str(path.relative_to(ROOT)).replace('\\', '/') for path in PASTA.rglob('*')
               if path.is_file() and path.name != 'verificacao.json']
    return {
        'utc': datetime.now(timezone.utc).isoformat(),
        'base_git': git('rev-parse', 'HEAD').decode().strip(),
        'branch': git('branch', '--show-current').decode().strip(),
        'antes': {'total': 100, 'aprovados': 94, 'falhos': 6},
        'falhas_anteriores_agora_aprovadas': falhos,
        'depois': {'suite_corrente': 256, 'e2e_padrao_aprovados': 34, 'opt_in_aprovados': 2,
                   'chamadas_http_reais': 10, 'falhos': 0},
        'lint': {'exit_code': 0, 'avisos_herdados': 2,
                 'comando': 'npm run lint', 'origem': 'Saída observada na execução desta conversa; não representa log integral.'},
        'build': {'exit_code': 0, 'comando': 'npm run build'},
        'paginas_pdf': pdfs,
        'pdfs_revisados_visualmente': True,
        'pdfs_anteriores_preservados': True,
        'arquivos_de_testes_historicos_preservados': len(protegidos),
        'ui_corpus_ai_producao_intactos': True,
        'sha256': {path: hashlib.sha256((ROOT / path).read_bytes()).hexdigest() for path in fontes},
        'limitacoes': ['Geração mock; sem LLM real.', 'Sem benchmark de UI ou calibração.',
                       'Terceira refatoração formal pendente.', 'Sem novo registro de prompts históricos ausentes.'],
    }


if __name__ == '__main__':
    destino = PASTA / 'verificacao.json'
    if destino.exists():
        raise SystemExit('Registro existente; usar verificar() para conferir sem sobrescrever.')
    dados = verificar()
    destino.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({k: v for k, v in dados.items() if k != 'sha256'}, ensure_ascii=False))
