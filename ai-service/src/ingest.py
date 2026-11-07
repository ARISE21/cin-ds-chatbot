import os

from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
)
from pypdf import PdfReader

from src.config import CHROMA_PATH, COLLECTION_NAME
from src.index_utils import sincronizar_documento
from src.metadata_utils import enriquecer_metadados


def obter_collection():
    """
    Abre a coleção do ChromaDB apenas quando necessário.
    """

    import chromadb

    client = chromadb.PersistentClient(
        path=str(CHROMA_PATH)
    )

    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )


text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=700,
    chunk_overlap=150,
    separators=[
        "\n\n",
        "\n",
        "Art.",
        "Artigo",
        ". ",
        " ",
        "",
    ],
)


def sanitizar_metadados(meta: dict) -> dict:
    """
    Converte metadados para os tipos aceitos pelo ChromaDB.
    """

    metadados_limpos = {}

    for chave, valor in meta.items():
        if isinstance(valor, list):
            metadados_limpos[chave] = ", ".join(
                str(item)
                for item in valor
            )

        elif isinstance(
            valor,
            (str, int, float, bool),
        ):
            metadados_limpos[chave] = valor

        else:
            metadados_limpos[chave] = str(valor)

    return metadados_limpos


def indexar_documento(
    caminho_arquivo: str,
    metadados_personalizados: dict | None = None,
    collection=None,
) -> dict:
    """
    Extrai o texto de um PDF ou TXT e o insere no ChromaDB.
    """

    nome_arquivo = os.path.basename(
        caminho_arquivo
    )

    extensao = os.path.splitext(
        nome_arquivo
    )[1].lower()

    if metadados_personalizados is None:
        metadados_personalizados = {}

    metadados_enriquecidos = enriquecer_metadados(
        metadados_personalizados
    )

    metadados_base = sanitizar_metadados(
        metadados_enriquecidos
    )

    documentos_para_inserir = []
    paginas_sem_texto = []

    if extensao == ".txt":
        try:
            with open(
                caminho_arquivo,
                "r",
                encoding="utf-8",
            ) as arquivo:
                conteudo = arquivo.read()

        except UnicodeDecodeError:
            with open(
                caminho_arquivo,
                "r",
                encoding="latin-1",
            ) as arquivo:
                conteudo = arquivo.read()

        if not conteudo.strip():
            print(
                f"[AVISO] O arquivo "
                f"'{nome_arquivo}' está vazio."
            )

            return {
                "sucesso": False,
                "motivo": "Arquivo vazio",
            }

        chunks = text_splitter.split_text(
            conteudo
        )

        for numero_chunk, chunk in enumerate(
            chunks
        ):
            identificador = (
                f"{nome_arquivo}_p1_c"
                f"{numero_chunk}"
            )

            metadata_chunk = (
                metadados_base.copy()
            )

            metadata_chunk.update({
                "documento": nome_arquivo,
                "pagina": 1,
                "chunk_id": identificador,
            })

            documentos_para_inserir.append((
                identificador,
                chunk,
                metadata_chunk,
            ))

    elif extensao == ".pdf":
        try:
            leitor = PdfReader(
                caminho_arquivo
            )

        except Exception as erro:
            print(
                f"[ERRO] Não foi possível abrir "
                f"'{nome_arquivo}': {erro}"
            )

            return {
                "sucesso": False,
                "motivo": str(erro),
            }

        for numero_pagina, pagina in enumerate(
            leitor.pages,
            start=1,
        ):
            texto_pagina = (
                pagina.extract_text() or ""
            )

            if not texto_pagina.strip():
                paginas_sem_texto.append(numero_pagina)
                continue

            chunks = text_splitter.split_text(
                texto_pagina
            )

            for numero_chunk, chunk in enumerate(
                chunks
            ):
                identificador = (
                    f"{nome_arquivo}_p"
                    f"{numero_pagina}_c"
                    f"{numero_chunk}"
                )

                metadata_chunk = (
                    metadados_base.copy()
                )

                metadata_chunk.update({
                    "documento": nome_arquivo,
                    "pagina": numero_pagina,
                    "chunk_id": identificador,
                })

                documentos_para_inserir.append((
                    identificador,
                    chunk,
                    metadata_chunk,
                ))

    else:
        print(
            f"[ERRO] Formato não suportado: "
            f"'{nome_arquivo}'."
        )

        return {
            "sucesso": False,
            "motivo": "Extensão inválida",
        }

    if paginas_sem_texto:
        print(
            f"[AVISO] '{nome_arquivo}': páginas sem texto extraível: "
            f"{', '.join(map(str, paginas_sem_texto))}. "
            "Conferir visualmente; imagens com conteúdo podem exigir OCR."
        )

    if not documentos_para_inserir:
        print(
            f"[AVISO] Nenhum texto extraído de "
            f"'{nome_arquivo}'."
        )

        return {
            "sucesso": False,
            "motivo": "Nenhum texto extraído",
            "paginas_sem_texto": paginas_sem_texto,
        }

    ids = [
        item[0]
        for item in documentos_para_inserir
    ]

    documentos = [
        item[1]
        for item in documentos_para_inserir
    ]

    metadados = [
        item[2]
        for item in documentos_para_inserir
    ]

    if collection is None:
        collection = obter_collection()

    ids_removidos = sincronizar_documento(
        collection=collection,
        nome_arquivo=nome_arquivo,
        ids=ids,
        documents=documentos,
        metadatas=metadados,
    )

    print(
        f"[OK] {len(ids)} trechos indexados "
        f"de '{nome_arquivo}'."
    )

    return {
        "sucesso": True,
        "total_chunks": len(ids),
        "paginas_sem_texto": paginas_sem_texto,
        "chunks_obsoletos_removidos": len(
            ids_removidos
        ),
    }


# Mantém compatibilidade com chamadas anteriores.
indexar_pdf = indexar_documento
