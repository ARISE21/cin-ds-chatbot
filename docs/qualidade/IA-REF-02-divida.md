# IA-REF-02 — Separar validação do retorno vetorial

Local: ai-service/src/retriever.py, buscar_contexto.

Problema confirmado por leitura do código: buscar_contexto valida entrada, acessa coleção, interpreta listas, valida integridade, formata contexto e monta fontes. A validação da integridade do retorno é uma responsabilidade distinguível do fluxo de busca. Categorias: Long Method, coesão e SRP. Mudanças na integridade hoje exigem navegar pela função inteira; testes de validação ficam ligados ao restante do fluxo.

Escolha: extrair a validação das listas e distâncias para uma função interna nomeada (Extract Function). Mudança pequena, coberta pela V2 para listas inconsistentes e distâncias não finitas ou de tipos inválidos. Preservar ordem de validação, mensagens e exceções. Não alterar validação de página, contrato HTTP ou condições de fallback.

Estado inicial: Aberto. Evidência anterior: docs/testes/relatorios/us01-controlado/v2 (21 métodos aprovados). V2 congelada antes da alteração; hashes registrados em execucao.json. Estado final será documentado no relatório após execução.
