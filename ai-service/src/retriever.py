from src.config import CHROMA_PATH, COLLECTION_NAME
from src.metadata_utils import construir_filtro
import math


class InvalidSearchResult(RuntimeError):
    """A coleção retornou dados que não podem fundamentar uma resposta."""


def _validar_resultado_vetorial(documentos, metadados, distancias):
    """Confere integridade antes de associar trechos às fontes."""
    if not (len(documentos) == len(metadados) == len(distancias)):
        raise InvalidSearchResult("Resultado documental inconsistente.")
    for distancia in distancias:
        if type(distancia) not in (int, float) or not math.isfinite(distancia):
            raise InvalidSearchResult("Distância inválida na origem.")


def obter_collection():
    """
    Abre a coleção do ChromaDB somente quando ela for necessária.
    Isso permite testar a busca sem depender do banco real.
    """
    import chromadb

    client = chromadb.PersistentClient(
        path=str(CHROMA_PATH)
    )

    return client.get_or_create_collection(
        name=COLLECTION_NAME
    )


def buscar_contexto(
    pergunta: str,
    curso: str = "Geral",
    perfil: str = "Todos",
    top_k: int = 3,
    collection=None,
) -> dict:
    """
    Recupera trechos relevantes do ChromaDB.

    Retorna:
    - contexto formatado;
    - fontes utilizadas;
    - menor distância encontrada.
    """

    if not pergunta or not pergunta.strip():
        raise ValueError(
            "A pergunta não pode estar vazia."
        )

    if (
        not isinstance(top_k, int)
        or isinstance(top_k, bool)
        or top_k < 1
    ):
        raise ValueError(
            "top_k deve ser um número inteiro positivo."
        )

    if collection is None:
        collection = obter_collection()

    where_filter = construir_filtro(
        curso=curso,
        perfil=perfil,
    )

    parametros = {
        "query_texts": [pergunta.strip()],
        "n_results": top_k,
    }

    if where_filter:
        parametros["where"] = where_filter

    resultados = collection.query(**parametros)

    documentos = (
        resultados["documents"][0]
        if resultados.get("documents")
        else []
    )

    metadados = (
        resultados["metadatas"][0]
        if resultados.get("metadatas")
        else []
    )

    distancias = (
        resultados["distances"][0]
        if resultados.get("distances")
        else []
    )

    _validar_resultado_vetorial(documentos, metadados, distancias)

    contexto_formatado = []
    fontes = []

    for documento, metadata in zip(
        documentos,
        metadados,
    ):
        nome_documento = metadata.get(
            "documento",
            metadata.get(
                "source",
                "Documento Oficial",
            ),
        )

        numero_pagina = metadata.get(
            "pagina",
            metadata.get("page", 1),
        )

        curso_documento = metadata.get(
            "curso_alvo",
            metadata.get("curso", "Geral"),
        )

        if type(numero_pagina) is not int or numero_pagina < 1:
            raise InvalidSearchResult("Página inválida na origem.")

        identificacao = (
            f"[Documento: {nome_documento} | "
            f"Pág. {numero_pagina} | "
            f"Curso: {curso_documento}]"
        )

        contexto_formatado.append(
            f"{identificacao}\n{documento}"
        )

        fontes.append({
            "arquivo": nome_documento,
            "pagina": numero_pagina,
            "curso": curso_documento,
        })

    return {
        "contexto": "\n\n---\n\n".join(
            contexto_formatado
        ),
        "fontes": fontes,
        "distancia_minima": (
            distancias[0]
            if distancias
            else 1.0
        ),
    }
