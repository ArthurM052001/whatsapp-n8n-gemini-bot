````markdown
Como remover arquivos sensíveis do histórico do Git (BFG/git-filter-repo)

Se você já enviou arquivos de sessão (.wwebjs_auth) para o repositório remoto e quer removê-los do histórico, siga as instruções abaixo.

Opção A — Usando BFG (mais simples)
1. Instale o BFG: https://rtyley.github.io/bfg-repo-cleaner/
2. Clone um mirror do repositório:
```bat
git clone --mirror https://github.com/ArthurM052001/whatsapp-n8n-gemini-bot.git
cd whatsapp-n8n-gemini-bot.git
```
3. Rode o BFG para remover o diretório:
```bat
bfg --delete-folders .wwebjs_auth --delete-folders .wwebjs_cache
```
4. Atualize refs e force push:
```bat
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

Opção B — Usando git-filter-repo (recomendado se disponível)
1. Instale `git-filter-repo` (https://github.com/newren/git-filter-repo)
2. Faça um clone mirror:
```bat
git clone --mirror https://github.com/ArthurM052001/whatsapp-n8n-gemini-bot.git
cd whatsapp-n8n-gemini-bot.git
```
3. Rode o filtro:
```bat
git filter-repo --invert-paths --path .wwebjs_auth --path .wwebjs_cache
```
4. Push forçado do mirror:
```bat
git push --force
```

Atenção: forçar push reescreve o histórico e pode causar problemas para outros colaboradores. Use somente se entender as consequências.

````
