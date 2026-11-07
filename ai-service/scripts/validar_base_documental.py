"""Auditoria opt-in do corpus real, sem escrever no ChromaDB ou executar LLM.

Em ai-service: python -m scripts.validar_base_documental --saida CAMINHO_NOVO.json
Não substitui o benchmark de respostas e não modifica evidências V1/V2.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import json
import math
from pathlib import Path
import subprocess

from pypdf import PdfReader

from src.config import CHROMA_PATH, COLLECTION_NAME, DATA_DIR, PROJECT_ROOT
from src.ingest import text_splitter
from src.metadata_utils import CURSOS, construir_filtro, enriquecer_metadados
from src.retriever import buscar_contexto
from src.validate_catalog import validar_catalogo


def auditar():
    import chromadb

    erros = validar_catalogo()
    if erros:
        return {'status': 'erro_catalogo', 'erros': erros}
    catalogo = json.loads((DATA_DIR / 'metadata.json').read_text(encoding='utf-8'))
    collection = chromadb.PersistentClient(path=str(CHROMA_PATH)).get_collection(COLLECTION_NAME)
    dados = collection.get(include=['documents', 'metadatas'])
    reais = dict(zip(dados['ids'], zip(dados['documents'], dados['metadatas'])))
    esperados = set()
    documentos = []
    for item in catalogo:
        path = DATA_DIR / item['arquivo']
        print(f'Auditando {path.name}', flush=True)
        if path.suffix.lower() == '.pdf':
            paginas = [page.extract_text() or '' for page in PdfReader(path).pages]
        else:
            try:
                paginas = [path.read_text(encoding='utf-8')]
            except UnicodeDecodeError:
                paginas = [path.read_text(encoding='latin-1')]
        meta = enriquecer_metadados(item)
        quantidade = 0
        for numero, texto in enumerate(paginas, 1):
            for indice, trecho in enumerate(text_splitter.split_text(texto)):
                chave = f'{path.name}_p{numero}_c{indice}'
                esperados.add(chave)
                quantidade += 1
                atual = reais.get(chave)
                if atual is None:
                    erros.append(f'Trecho ausente: {chave}')
                    continue
                conteudo, metadados = atual
                if conteudo != trecho:
                    erros.append(f'Texto diverge da extração atual: {chave}')
                campos = ['curso_alvo', 'perfil_curricular', 'vigencia', 'tipo_documento']
                campos += ['curso_' + c for c in CURSOS] + ['perfil_novo', 'perfil_anterior']
                if any(metadados.get(c) != meta[c] for c in campos):
                    erros.append(f'Metadados divergentes: {chave}')
                if metadados.get('pagina') != numero or metadados.get('documento') != path.name:
                    erros.append(f'Citação divergente: {chave}')
        documentos.append({
            'arquivo': path.name, 'tipo': item['tipo_documento'],
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'paginas': len(paginas), 'caracteres': sum(map(len, paginas)),
            'paginas_sem_texto': [i + 1 for i, t in enumerate(paginas) if not t.strip()],
            'trechos_esperados': quantidade,
            'trechos_indexados': sum(m.get('documento') == path.name for _, m in reais.values()),
        })
    extras = sorted(set(reais) - esperados)
    if extras:
        erros.append(f'{len(extras)} IDs fora da extração/catálogo atual; não foram excluídos.')
    consultas = []
    for curso in CURSOS:
        for perfil in (['novo'] if curso == 'ia' else ['novo', 'anterior']):
            filtro = construir_filtro(curso, perfil)
            filtrados = collection.get(where=filtro, include=['metadatas'])['metadatas']
            invalidos = [m for m in filtrados if not m.get('curso_' + curso) or not m.get('perfil_' + perfil)]
            ppcs = sorted({m['documento'] for m in filtrados if m.get('tipo_documento') == 'ppc'})
            esperado = f'ppc_{curso}_' + ('novo_2024.pdf' if perfil == 'novo' else 'anterior.pdf')
            if invalidos or ppcs != [esperado]:
                erros.append(f'Isolamento inválido: {curso}/{perfil}: {ppcs}')
            pergunta = f'Qual o perfil profissional do egresso de {CURSOS[curso]} segundo o projeto pedagógico?'
            print(f'Consultando {curso}/{perfil}', flush=True)
            resposta = buscar_contexto(pergunta, curso, perfil, 3, collection=collection)
            for fonte in resposta['fontes']:
                candidatos = [m for _, m in reais.values() if m.get('documento') == fonte['arquivo'] and m.get('pagina') == fonte['pagina']]
                if not candidatos or not all(m.get('curso_' + curso) and m.get('perfil_' + perfil) for m in candidatos):
                    erros.append(f'Fonte não corresponde ao filtro: {curso}/{perfil}: {fonte}')
            if not resposta['fontes'] or not math.isfinite(resposta['distancia_minima']):
                erros.append(f'Consulta sem retorno válido: {curso}/{perfil}')
            consultas.append({'curso': curso, 'perfil': perfil, 'pergunta': pergunta,
                              'ppcs_elegiveis': ppcs, 'fontes': resposta['fontes'],
                              'distancia_minima': resposta['distancia_minima'],
                              'contexto': resposta['contexto']})
    return {
        'utc': datetime.now(timezone.utc).isoformat(),
        'git_head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=PROJECT_ROOT, text=True).strip(),
        'versoes': {nome: importlib.metadata.version(nome) for nome in ['chromadb', 'pypdf', 'fonttools']},
        'colecao': COLLECTION_NAME, 'metrica': collection.metadata,
        'total_documentos': len(catalogo), 'total_trechos': len(reais),
        'total_esperado': len(esperados), 'documentos': documentos,
        'consultas': consultas, 'ids_extras': extras, 'erros': erros,
        'status': 'erro' if erros else 'validado_com_ressalvas_de_extracao',
        'limites': ['Não executa LLM, UI, NestJS ou benchmark de respostas.',
                    'Correspondência textual com a extração não prova completude do PDF.',
                    'Página citada é posição física no PDF, contando capa e anexos.'],
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--saida', type=Path, required=True)
    args = parser.parse_args()
    if args.saida.exists():
        parser.error('Use um arquivo novo para preservar as evidências existentes.')
    resultado = auditar()
    args.saida.parent.mkdir(parents=True, exist_ok=True)
    args.saida.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({k: v for k, v in resultado.items() if k not in ['documentos', 'consultas', 'ids_extras']}, ensure_ascii=False))
    raise SystemExit(1 if resultado['erros'] else 0)
