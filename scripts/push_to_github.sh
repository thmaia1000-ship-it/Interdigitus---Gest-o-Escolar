#!/usr/bin/env bash
# Script unificado para sincronizar o banco de dados e enviar para o GitHub

set -e

MSG="${1:-feat: atualizar sistema e sincronizar base de dados}"

echo "============================================================"
echo "🚀 [Master Escolar] Sincronizando Banco de Dados e Enviando ao GitHub"
echo "============================================================"

# 1. Executa validação e sincronização do banco
if command -v bun >/dev/null 2>&1; then
  bun scripts/sync_db.ts --stage
elif command -v npx >/dev/null 2>&1; then
  npx tsx scripts/sync_db.ts --stage
else
  echo "⚠️ Nem bun nem npx encontrados no PATH."
fi

# 2. Adiciona todas as alterações do repositório
git add -A

# 3. Verifica se há algo para commitar
if git diff --cached --quiet; then
  echo "ℹ️ Nenhuma alteração pendente para commit."
else
  echo "📝 Criando commit com mensagem: '$MSG'..."
  git commit -m "$MSG"
fi

# 4. Envia para o GitHub na branch ativa
CURRENT_BRANCH=$(git branch --show-current)
echo "🌐 Enviando alterações para origin/$CURRENT_BRANCH no GitHub..."
git push origin "$CURRENT_BRANCH"

echo "============================================================"
echo "🎉 Concluído com sucesso! Base de dados e código enviados ao GitHub."
echo "Pronto para sincronização no Google AI Studio e publicação web!"
echo "============================================================"
