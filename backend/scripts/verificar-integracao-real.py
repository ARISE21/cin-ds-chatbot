"""Ensaio opt-in do backend com FastAPI/ChromaDB reais e geração mock.

Na raiz, após build do backend e ingestão:
python backend/scripts/verificar-integracao-real.py --saida docs/testes/ensaio-novo
Executar com o Python do ambiente do projeto e Node.js 24 no PATH.
Não modifica UI, corpus, V1/V2, limiar permanente ou serviços já existentes.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import time

import requests

ROOT = Path(__file__).resolve().parents[2]
MARCADOR = '[SIMULAÇÃO DE INTEGRAÇÃO — NÃO É RESPOSTA ACADÊMICA]'


def executar(saida, node):
    processos, arquivos = [], []
    resultado = {'utc': datetime.now(timezone.utc).isoformat(),
                 'git_base': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
                 'tipo': 'Serviços e corpus reais; geração simulada, sem navegador ou LLM real.',
                 'casos': [], 'comandos': [], 'sucesso': False}

    def porta_livre():
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            return sock.getsockname()[1]

    def iniciar(comando, cwd, env, nome, health):
        log = (saida / f'{nome}.txt').open('w', encoding='utf-8')
        arquivos.append(log)
        flags = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        processo = subprocess.Popen(comando, cwd=cwd, env=env, stdout=log,
                                    stderr=subprocess.STDOUT, creationflags=flags)
        processos.append(processo)
        resultado['comandos'].append({'nome': nome, 'argv': comando, 'cwd': str(cwd)})
        prazo = time.monotonic() + 35
        while time.monotonic() < prazo:
            if processo.poll() is not None:
                raise RuntimeError(f'{nome} encerrou; conferir log.')
            try:
                if requests.get(health, timeout=1).status_code == 200:
                    return
            except requests.RequestException:
                pass
            time.sleep(.25)
        raise TimeoutError(f'{nome}: inicialização excedeu 35 segundos.')

    def fastapi(modo):
        porta = porta_livre()
        url = f'http://127.0.0.1:{porta}'
        iniciar([sys.executable, '-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', str(porta)],
                ROOT / 'ai-service', dict(os.environ, PYTHONUTF8='1', SECGRAD_GENERATION_MODE=modo),
                f'fastapi-{modo}', url + '/health')
        return url

    def nest(url, nome, limiar='0.8'):
        porta = porta_livre()
        env = dict(os.environ, PORT=str(porta), AI_SERVICE_TIMEOUT_MS='30000', FALLBACK_DISTANCE_THRESHOLD=limiar)
        env.pop('AI_SERVICE_URL', None)
        if url is not None:
            env['AI_SERVICE_URL'] = url
        origem = f'http://127.0.0.1:{porta}'
        iniciar([node, 'dist/main.js'], ROOT / 'backend', env, nome, origem + '/')
        return origem + '/api/v1/conversa'

    consulta = {'consulta': {'pergunta': 'Qual o perfil profissional do egresso de Ciência da Computação segundo o projeto pedagógico?',
                            'curso': 'CC', 'perfil': 'novo', 'top_k': 3}}

    def chamar(nome, url, payload, status):
        inicio = time.monotonic()
        resposta = requests.post(url, json=payload, timeout=65)
        corpo = resposta.json()
        caso = {'nome': nome, 'status_http': resposta.status_code,
                'segundos': round(time.monotonic() - inicio, 3), 'retorno': corpo}
        resultado['casos'].append(caso)
        assert resposta.status_code == status, f'{nome}: HTTP {resposta.status_code}, esperado {status}'
        return corpo

    try:
        assert (ROOT / 'backend/dist/main.js').exists(), 'Executar npm run build no backend.'
        mock = fastapi('mock')
        disabled = fastapi('disabled')
        # Aquecer os dois processos e comprovar busca real antes de avaliar geração.
        for modo, origem in [('mock', mock), ('disabled', disabled)]:
            busca = chamar('busca_real_' + modo, origem + '/api/v1/buscar', consulta['consulta'], 200)
            assert busca['fontes'] and busca['fontes'][0]['arquivo'] == 'ppc_cc_novo_2024.pdf'
        endpoint = nest(mock, 'nest-mock')
        sucesso = chamar('conversa_com_corpus_real', endpoint, consulta, 201)
        assert sucesso['resposta'] == MARCADOR and sucesso['fallback_acionado'] is False
        assert sucesso['fontes'] and sucesso['distancia_minima'] < .8
        assert all(f['pagina'] >= 1 and f['arquivo'] for f in sucesso['fontes'])
        chamar('consulta_invalida', endpoint, {'consulta': {'pergunta': ''}}, 400)
        vazio = chamar('geracao_sem_contexto', mock + '/api/v1/gerar', {'pergunta': 'Teste', 'contexto': ''}, 200)
        assert vazio == {'resposta': None}
        # Limiar controlado só neste processo, para exercitar o ramo de fallback.
        fallback_endpoint = nest(mock, 'nest-fallback-controlado', '0')
        fallback = chamar('fallback_limiar_controlado_zero', fallback_endpoint, consulta, 201)
        assert fallback['fallback_acionado'] is True and 'resposta' not in fallback
        assert fallback['template_email'] and fallback['setor_sugerido']
        desabilitado = chamar('geracao_desabilitada_via_nest', nest(disabled, 'nest-disabled'), consulta, 503)
        assert desabilitado == {'statusCode': 503, 'message': 'Serviço de geração indisponível.', 'error': 'Service Unavailable'}
        for nome, url in [('configuracao_ausente', None), ('configuracao_invalida', mock + '?')]:
            erro = chamar(nome, nest(url, 'nest-' + nome), consulta, 503)
            assert erro['message'] == 'Serviço de busca não configurado.'
            assert 'template_email' not in erro and 'resposta' not in erro
        inacessivel = f'http://127.0.0.1:{porta_livre()}'
        erro = chamar('busca_indisponivel', nest(inacessivel, 'nest-indisponivel'), consulta, 503)
        assert erro['message'] == 'Serviço de busca indisponível.' and 'template_email' not in erro
        # Reutiliza também os dois testes opt-in existentes com fontes controladas.
        comando = [node, 'node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.config.e2e.ts',
                   'test/generation-live.e2e-spec.ts', '--reporter=json', '--outputFile=' + str(saida / 'live-opt-in.json')]
        env = dict(os.environ, SECGRAD_LIVE_AI_SERVICE_URL=mock, SECGRAD_LIVE_AI_DISABLED_URL=disabled)
        teste = subprocess.run(comando, cwd=ROOT / 'backend', env=env, capture_output=True,
                               text=True, encoding='utf-8', timeout=60)
        (saida / 'live-opt-in.txt').write_text(teste.stdout + teste.stderr, encoding='utf-8')
        resultado['comandos'].append({'nome': 'testes_opt_in', 'argv': comando, 'exit_code': teste.returncode})
        assert teste.returncode == 0, 'Testes opt-in falharam; conferir relatório.'
        resultado['sucesso'] = True
    except Exception as erro:
        resultado['erro'] = f'{type(erro).__name__}: {erro}'
    finally:
        for processo in reversed(processos):
            if processo.poll() is None:
                processo.terminate()
            try:
                processo.wait(timeout=10)
            except subprocess.TimeoutExpired:
                processo.kill()
                processo.wait()
        for log in arquivos:
            log.close()
        resultado['processos_temporarios_encerrados'] = True
        resultado['producao_sha256'] = {path: hashlib.sha256((ROOT / path).read_bytes()).hexdigest()
                                       for path in ['backend/src/ai-service/ai-service.service.ts',
                                                    'backend/src/orchestration/orchestration.service.ts',
                                                    'ai-service/src/retriever.py', 'ai-service/src/generation.py']}
        (saida / 'integracao-real.json').write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding='utf-8')
    return resultado


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--saida', type=Path, required=True)
    parser.add_argument('--node', default='node')
    args = parser.parse_args()
    node = shutil.which(args.node)
    if not node:
        parser.error('Node não encontrado. Instalar Node.js 24 ou informar --node CAMINHO.')
    args.saida = args.saida.resolve()
    args.saida.mkdir(parents=True, exist_ok=False)
    resultado = executar(args.saida, node)
    print(json.dumps({'sucesso': resultado['sucesso'], 'casos_http': len(resultado['casos']),
                      'erro': resultado.get('erro')}, ensure_ascii=False))
    raise SystemExit(0 if resultado['sucesso'] else 1)
