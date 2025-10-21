MCP (Model Context Protocol) - instruções rápidas

Se você quiser usar MCP para modularizar como os prompts e estados de conversação são gerenciados, a ideia é:

1. Defina um microserviço (ou workflow n8n) que implemente o 'context manager' — armazena histórico, meta-informações de usuário e regras de segurança.
2. Quando uma mensagem chega, o bot chama o contexto para montar o prompt final para o Gemini.
3. O Gemini responde; o contexto aplica filtros (conteúdo ofensivo, comprimento) e decide se deve enviar direto ou criar uma revisão.

Vantagens:
- Separação de responsabilidades.
- Fácil auditoria e ajuste de prompts por ambiente (produção vs testes).

Posso gerar um exemplo de arquitetura MCP + n8n + Gemini se quiseres — diga se prefere uma implementação leve (JSON + arquivos) ou persistente (Postgres/Redis).