import os
import ocrmypdf

# Mapeamento com o caminho correto (subindo um nível para sair de ai-service e entrar em data/raw)
tarefas_ocr = [
    {
        "arquivo": "../data/raw/ppc_ec_anterior.pdf",
        "paginas": "22",
        "saida": "../data/raw/ppc_ec_anterior_temp.pdf",
    },
    {
        "arquivo": "../data/raw/ppc_si_anterior.pdf",
        "paginas": "202",
        "saida": "../data/raw/ppc_si_anterior_temp.pdf",
    },
    {
        "arquivo": "../data/raw/ppc_si_novo_2024.pdf",
        "paginas": "149,158-159",
        "saida": "../data/raw/ppc_si_novo_2024_temp.pdf",
    },
]

def aplicar_ocr_nas_paginas():
    print("=== INICIANDO PROCESSAMENTO DE OCR NAS PÁGINAS ALVO ===")

    for tarefa in tarefas_ocr:
        origem = tarefa["arquivo"]
        paginas = tarefa["paginas"]
        temp_saida = tarefa["saida"]

        if not os.path.exists(origem):
            print(f"[ERRO] Ficheiro não encontrado: {origem}")
            continue

        print(f"\nProcessando {origem} (Páginas: {paginas})...")

        try:
            # Removido o deskew=True para evitar conflito com o redo_ocr
            ocrmypdf.ocr(
                origem,
                temp_saida,
                pages=paginas,
                redo_ocr=True,
                language="por",
            )

            os.replace(temp_saida, origem)
            print(f"[SUCESSO] {origem} atualizado com camada OCR com sucesso!")

        except Exception as e:
            print(f"[FALHA] Erro ao processar {origem}: {e}")
            if os.path.exists(temp_saida):
                os.remove(temp_saida)

    print("\n=== PROCESSAMENTO CONCLUÍDO ===")

if __name__ == "__main__":
    aplicar_ocr_nas_paginas()