# WhatsApp n8n Gemini Bot (QR / WhatsApp Web)

Este repositório contém um scaffold Node.js que usa `whatsapp-web.js` para conectar ao WhatsApp Web via QR code. O bot encaminha mensagens recebidas para um webhook do n8n, onde você pode ligar a chamada à API Gemini.

Pré-requisitos:
- Node.js 18+ instalado
- n8n rodando (local ou n8n.cloud) com um webhook configurado para processar as mensagens

Instalação:

```bash
npm install
```

Rodando:

```bash
set N8N_WEBHOOK_URL=http://localhost:5678/webhook/whatsapp
npm start
```

Fluxo sugerido:
1. O `index.js` recebe mensagens via WhatsApp Web.
2. As mensagens são enviadas por HTTP POST para o webhook do n8n.
3. No n8n você chama a API do Gemini para gerar respostas e então responde via WhatsApp (pelo mesmo bot ou por outro serviço).

Notas:
- `whatsapp-web.js` guarda sessão localmente em `.wwebjs_auth/session-*` ou conforme `LocalAuth`.
- Para produção, considere hospedar em um servidor sempre-on e proteger o webhook com um segredo.

Integração com n8n (exemplo rápido)

1) Workflow básico:
	- Node `Webhook` (Recebe POST do bot) configurado no n8n para receber `from`, `body`, `isMedia`.
	- Node `HTTP Request` (chama a API do Gemini) com o prompt em PT-BR usando `body`.
	- Node `HTTP Request` (POST) para o endpoint do bot `/send` com cabeçalho `x-send-token` igual ao `SEND_TOKEN` do .env e payload:

```json
{
	"to": "5511999999999@c.us",
	"text": "Resposta gerada pelo Gemini em PT-BR"
}
```

2) Exemplo de corpo que o bot envia para n8n (via webhook):
```json
{
	"from": "5511999999999@c.us",
	"body": "Olá, gostaria de informações sobre preços",
	"isMedia": false
}
```

3) Exemplo curl para chamar o endpoint `/send` do bot (de dentro do n8n ou qualquer servidor autorizado):

```bash
curl -X POST http://BOT_HOST:3000/send \
	-H "Content-Type: application/json" \
	-H "x-send-token: troque_este_token" \
	-d '{"to":"5511999999999@c.us","text":"Olá! Aqui está a informação que você pediu."}'
```

Notas adicionais:
- O `LocalAuth` guarda sessões localmente em `.wwebjs_auth/` — assim você não precisa escanear QR a cada reinício.
- Proteja `SEND_TOKEN` e o webhook do n8n com segredos e, se possível, restrinja IPs.
- Depois que o n8n chamar Gemini, implemente regras para limitar tamanho de respostas, conteúdo proibido e fallback para atendimento humano.

Validação humana / primeiros dias

Durante os primeiros dias de uso é recomendado rever manualmente as respostas geradas. Este scaffold fornece endpoints para isso:

- POST /review : n8n envia a resposta proposta aqui (em vez de chamar /send). Corpo esperado:

```json
{
	"to": "5511999999999@c.us",
	"text": "Resposta sugerida pelo Gemini",
	"originalMessageId": "optional-id",
	"metadata": { "confidence": 0.85 }
}
```

- GET /reviews : retorna revisões pendentes. Cabeçalho ou query `token` (igual ao `SEND_TOKEN`) é necessário.
- POST /reviews/:id/approve : aprova e envia a mensagem ao usuário.

Fluxo recomendado:
1. n8n processa a mensagem e chama Gemini.
2. Em vez de enviar direto, n8n posta a resposta para `/review`.
3. Um atendente (ou você) acessa `/reviews`, verifica e chama `/reviews/:id/approve` para enviar.

Isso permite coletar métricas, ajustar prompts e prevenir envios incorretos nos primeiros dias.

--------------------------------------------------------------------------------
Publicar este projeto no seu GitHub
--------------------------------------------------------------------------------

O passo-a-passo abaixo mostra como preparar o repositório local e enviar (push) para o seu GitHub pessoal. Siga as instruções no Windows `cmd.exe`.

1) Verifique que o repositório local está pronto
- Confirme que arquivos sensíveis estão ignorados por `.gitignore` (ex.: `.env`, `node_modules`, sessões). O arquivo `.gitignore` já inclui esses itens.

2) Inicializar git (se ainda não inicializou)
```bat
cd /d d:\Users\arthur.silva\Desktop\Bot
git init
git add .
git commit -m "Initial commit: whatsapp-n8n-gemini-bot scaffold"
```

3) Criar o repositório remoto no GitHub
- Opção A — via navegador (web):
	- Vá para https://github.com -> clique em New repository -> defina o nome (ex.: `whatsapp-n8n-gemini-bot`) -> Create repository.
	- Na página do novo repositório GitHub, haverá instruções para conectar seu repositório local.

- Opção B — via GitHub CLI (recomendado se tiver `gh` instalado):
```bat
gh auth login
gh repo create <seu-usuario>/whatsapp-n8n-gemini-bot --public --source=. --remote=origin --push
```

4) Caso tenha criado via web, conecte o remoto e faça push (substitua `<usuario>` e `<repo>`):
```bat
git remote add origin https://github.com/<usuario>/whatsapp-n8n-gemini-bot.git
git branch -M main
git push -u origin main
```

5) Verifique no GitHub: a página do repositório deve listar seus arquivos. Não divulgue o `.env` nem o token.

Boas práticas após publicar
- Crie um Release e use GitHub Issues para acompanhar bugs/ajustes.
- Se quiser CI/CD para deploy automático, posso te ajudar a criar um workflow GitHub Actions (opcional).

--------------------------------------------------------------------------------
Checklist antes de compartilhar o link do repositório
--------------------------------------------------------------------------------
- Remova valores sensíveis do `.env` (não commite). Use `.env.example` para instruções.
- Confirme que `SEND_TOKEN` não está em código fonte ou no JSON importável do n8n (use placeholders).
- Inclua instruções no README para clonar, configurar `.env` e rodar (`npm install`, `npm start`).

