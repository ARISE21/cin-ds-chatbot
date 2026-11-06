# BACK-REF-01 — consolidar condições com o mesmo destino

Dívida: identificarSetor tem dois ifs consecutivos que retornam SecGrad, para estágio/estagio e requerimento/dispensa/segunda chamada. A mesma decisão está fragmentada e o retorno repetido.

Refatoração escolhida: Consolidate Conditional Expression. Reunir as cinco verificações em uma condição OR, mantendo ordem e curto-circuito, seguida do mesmo retorno SecGrad. Não extrair funções nem criar tabelas. Benefício: todas as palavras-chave do destino prioritário ficam juntas; uma única decisão/retorno para manter.

Equivalência: se A são as variantes de estágio e B são os três termos administrativos, if(A) return S; if(B) return S equivale a if(A || B) return S. A avaliação de A/B é pura (includes no texto local em minúsculas); os demais ramos continuam depois, com a mesma precedência. O retorno padrão SecGrad permanece no fim, pois removê-lo ou mover palavras-chave alteraria casos mistos.

Escopo: somente fallback.service.ts, método identificarSetor. Sem funcionalidades, mudanças de mensagens, templates, limiar, validação, transporte ou API. A matriz não define desempates para assuntos mistos: preserva-se o comportamento e os testes herdados, sem inventar regra nova.
