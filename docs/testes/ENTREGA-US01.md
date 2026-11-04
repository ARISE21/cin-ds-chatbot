# Entrega local da US-01 e IA-REF-02

Branch: test/ia-us01-fechamento-ref02, criada sobre e421ff9, idêntico à main remota na conferência inicial. Nenhum push ou merge nesta entrega.

- Comparação controlada: us01-fechamento.md.
- Matriz preenchida para US-01: matriz-rastreabilidade.md.
- V1 e V2 com mesmo código: relatorios/us01-controlado/v1/html/index.html e v2/html/index.html.
- Refatoração IA-REF-02: ../qualidade/IA-REF-02-relatorio.md e evidências posteriores.
- Evidência anterior da refatoração: relatorios/us01-controlado/v2.
- Script portátil: ai-service/scripts/medir_us01.py, executar a partir de ai-service com destino novo.

A V1 original permanece com SHA-256 0AD591420DFBDE9F14924A6560828BA3771E1A548B59C830C8D46BA12F3970C1. A comparação controlada tem produção idêntica nos manifestos e V2 mais abrangente. V2 antes/depois da refatoração tem testes idênticos. Todas as informações anteriores permanecem históricas, não devem ser substituídas pelos números novos.

Para publicar, enviar esta branch e abrir PR para main, preservando commits sem squash para manter a refatoração identificável. Revisar diff e solicitar revisão de colega. V1 com erros é material de análise e não deve ser executada como barreira de aprovação de produção; executar V2 e regressões separadamente.

Ainda dependem da entrega do grupo: consolidar US-02/03 na matriz/log, produzir PDF crítico global até 5 páginas, PDF das três refatorações até 3 páginas com Ricardo e conferir todos os anexos. Este fechamento não afirma conclusão da Sprint inteira, benchmark real, LLM real ou validação do corpus ampliado.
