# BACK-COR-URL-01 - restaurar contrato de origem do ai-service

Categoria: correção funcional/regressão de validação; **não contabilizar como
terceira refatoração**. Local: `backend/src/ai-service/ai-service.service.ts`, getEndpoint.

Sintoma reproduzido: seis falhas nos testes correntes com URL ausente/vazia,
query/fragmento vazios e caminho normalizado. A mudança anterior passou a usar localhost
silenciosamente e removeu a validação da forma original da origem.

Consequência: configuração incorreta podia chamar outro destino ou contornar restrições
documentadas. O contrato exige origem explícita e rejeição antes de fetch.

Correção: restaurar leitura sem host padrão e expressão regular de origem estrita,
mantendo a validação semântica de URL, protocolo, credenciais, query, fragmento e path.
O diff tem apenas essa restauração; não muda a orquestração ou o fallback.

Evidências: [fechamento de 08/11](../testes/fechamento-backend-20261108/README.md),
com antes 94/100, depois 256/256 na suíte corrente, e2e e serviços reais.
Status técnico: corrigido localmente; commit/PR serão feitos por Rafael.
Revisão do grupo deve confirmar o contrato. Nenhuma confirmação humana fictícia foi
registrada em nome de Victor ou dos demais integrantes.

Para a tabela consolidada de dívida, este item pode ser referido como regressão
corrigida. Não substitui o diagnóstico de projeto/SOLID/smells solicitado no roteiro.
