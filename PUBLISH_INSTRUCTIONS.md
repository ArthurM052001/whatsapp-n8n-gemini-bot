Publicar no GitHub — instruções rápidas

Repositório remoto: https://github.com/ArthurM052001/whatsapp-n8n-gemini-bot

Siga estes passos no Windows `cmd.exe` no diretório do projeto (`d:\Users\arthur.silva\Desktop\Bot`).

1) Confirme que não há segredos comitados
- O arquivo `.env` NÃO deve estar no repositório. Se existir, remova-o do git:

```bat
cd /d d:\Users\arthur.silva\Desktop\Bot
git status --porcelain
```
- Se `.env` aparecer em staged/committed, remova do index e do histórico antes de push (me avise se isso ocorreu).

2) Inicialize o repositório (se ainda não inicializou)

```bat
cd /d d:\Users\arthur.silva\Desktop\Bot
git init
git add .
git commit -m "Initial commit: whatsapp-n8n-gemini-bot scaffold with placeholders"
```

3) Conectar ao remoto (o seu repo já existe em GitHub)

```bat
git remote add origin https://github.com/ArthurM052001/whatsapp-n8n-gemini-bot.git
git branch -M main
git push -u origin main
```

Se você já tem `origin` configurado e quer forçar atualização (após revisar), use:

```bat
git push -u origin main --force
```

4) Alternativa com GitHub CLI (se tiver `gh` instalado)

```bat
gh auth login
gh repo clone ArthurM052001/whatsapp-n8n-gemini-bot
# ou criar e enviar se o repo não existia
gh repo create ArthurM052001/whatsapp-n8n-gemini-bot --public --source=. --remote=origin --push
```

5) Substituir placeholder `__SEND_TOKEN__` no n8n (APÓS importar o workflow)
- No n8n, abra o workflow importado e vá no node `Post to Bot Review`.
- Na aba Headers, substitua `__SEND_TOKEN__` pelo valor do seu `SEND_TOKEN` (do `.env`).
- Salve o workflow.

6) Substituir placeholder GEMINI (se aplicável)
- O workflow usa `{{$env.GEMINI_API_URL}}` e você deve definir `GEMINI_API_KEY` nas Credentials do n8n (ou como variável de ambiente do serviço que roda o n8n).
- Não coloque chaves em arquivos versionados.

7) Verificação final
- Abra o repo no GitHub e confirme que `README.md`, `n8n_workflow_whatsapp_gemini.json`, `index.js` e `.gitignore` foram enviados.
- Confirme que `.env` não aparece no repo.

8) Se precisar remover um `.env` que já foi comitado, me diga e eu te passo os comandos seguros para remover do histórico do git.

Se quiser, eu também posso:
- Gerar um pequeno `deploy.md` com instruções de hospedagem (VPS/Docker) e GitHub Actions.
- Ajudar a revisar o repositório no GitHub e confirmar que não há segredos.

Pronto para eu executar mais alguma alteração local (por exemplo: criar `deploy.md`) ou você prefere executar os comandos acima no seu terminal agora?   
