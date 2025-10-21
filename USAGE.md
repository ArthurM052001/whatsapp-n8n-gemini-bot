USAGE - whatsapp-n8n-gemini-bot

1) Quickstart (local)

- Clone or copy this repo
- Create `.env` from `.env.example` and edit values
- Install dependencies: `npm install`
- Start bot: `npm start` (scan QR shown in console)
- Import `n8n_workflow_whatsapp_gemini.json` into n8n and configure credentials

2) Workflow overview

- Webhook receives messages
- Call Gemini (via HTTP Request)
- Post suggestion to /review for human validation
- Approve to send via /reviews/:id/approve

3) Tips

- Keep `SEND_TOKEN` secret
- Do not commit `.env` or session directories
- Use `cleanup_repo.bat` before publishing
