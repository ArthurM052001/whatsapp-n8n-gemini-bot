@echo off
REM cleanup_repo.bat
REM Remove arquivos de sessão do índice git, apaga diretórios locais sensíveis e prepara commit para publicação

cd /d %~dp0

echo 1/6 - Atualizando repositório remoto
git fetch origin

echo 2/6 - Abort any rebase in progress
git rebase --abort 2>nul || echo "no rebase in progress"

echo 3/6 - Remove do índice diretórios de sessão (mantém arquivos no disco por segurança)
git rm -r --cached .wwebjs_auth 2>nul || echo ".wwebjs_auth not in index"
git rm -r --cached .wwebjs_cache 2>nul || echo ".wwebjs_cache not in index"

echo 4/6 - Apagar diretórios locais (opcional) - eles serão MOVED to backup
set BACKUP_DIR=%~dp0..\bot_backup_for_cleanup
mkdir "%BACKUP_DIR%" 2>nul || echo "backup exists"
move .wwebjs_auth "%BACKUP_DIR%" 2>nul || echo ".wwebjs_auth not found or already moved"
move .wwebjs_cache "%BACKUP_DIR%" 2>nul || echo ".wwebjs_cache not found or already moved"

echo 5/6 - Atualiza .gitignore e commita as mudanças
git add .gitignore
git commit -m "Cleanup: remove session/cache from index and add to .gitignore" || echo "No changes to commit"

echo 6/6 - Push to origin main (will fail if remote changed; in that case run: git pull --rebase origin main)
git push origin main || (
  echo Push failed. Try: git pull --rebase origin main && git push origin main
)

echo Cleanup complete. Verifique %BACKUP_DIR% para os dados movidos (se existirem).
echo Se os arquivos já estavam no histórico do Git e você quer removê-los permanentemente, siga docs/CLEAN_HISTORY_INSTRUCTIONS.md
pause
