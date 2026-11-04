"""Medição reproduzível que preserva destinos existentes."""
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import sys
from datetime import datetime, timezone

SERVICE = Path(__file__).resolve().parents[1]
ROOT = SERVICE.parent


def medir(versao, destino):
    destino = destino.resolve()
    destino.mkdir(parents=True, exist_ok=False)
    paths = [SERVICE / 'src/retriever.py', SERVICE / 'src/metadata_utils.py', SERVICE / 'main.py']
    tests = sorted((SERVICE / 'tests' / versao).glob('*.py'))
    if versao == 'v2':
        tests += sorted((SERVICE / 'tests/v1-llm').glob('*.py'))
    digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
    env = dict(os.environ, PYTHONUTF8='1', PYTHONDONTWRITEBYTECODE='1', COVERAGE_FILE=str(destino / '.coverage'))
    command = [sys.executable, '-m', 'coverage', 'run', '--branch', '--source=src.retriever,src.metadata_utils', '-m', 'unittest', 'discover', '-s', f'tests/{versao}', '-v']
    result = subprocess.run(command, cwd=SERVICE, env=env, capture_output=True, text=True, encoding='utf-8')
    (destino / 'execucao.txt').write_text(result.stdout + result.stderr, encoding='utf-8')
    commands = [command]
    for args in [('json', '-o', str(destino / 'coverage.json')), ('html', '-d', str(destino / 'html'))]:
        cmd = [sys.executable, '-m', 'coverage', *args]
        subprocess.run(cmd, cwd=SERVICE, env=env, check=True)
        commands.append(cmd)
    record = {'utc': datetime.now(timezone.utc).isoformat(), 'python': platform.python_version(), 'git_head': subprocess.check_output(['git','rev-parse','HEAD'], cwd=ROOT, text=True).strip(), 'suite': versao, 'test_exit': result.returncode, 'commands': commands, 'cwd': str(SERVICE), 'production_sha256': {str(p.relative_to(ROOT)): digest(p) for p in paths}, 'tests_sha256': {str(p.relative_to(ROOT)): digest(p) for p in tests}}
    (destino / 'execucao.json').write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding='utf-8')
    print(json.dumps({'suite': versao, 'exit': result.returncode, 'totals': json.loads((destino / 'coverage.json').read_text())['totals']}, ensure_ascii=False))


if __name__ == '__main__':
    if len(sys.argv) != 3 or sys.argv[1] not in ('v1-llm', 'v2'):
        raise SystemExit('Uso: python scripts/medir_us01.py v1-llm|v2 DESTINO_NOVO')
    medir(sys.argv[1], Path(sys.argv[2]))
