#!/usr/bin/env bash
# Script para instalar os Git Hooks de sincronização automática do banco de dados

HOOKS_DIR=".git/hooks"

if [ ! -d "$HOOKS_DIR" ]; then
  echo "⚠️ Diretório .git/hooks não encontrado. Certifique-se de executar na raiz do repositório Git."
  exit 0
fi

echo "🔧 Instalando Git Hooks para sincronização do banco de dados..."

# 1. Hook pre-commit
cat << 'EOF' > "$HOOKS_DIR/pre-commit"
#!/usr/bin/env bash
echo "📦 [Git Hook: pre-commit] Sincronizando data_interdigitus.json e db_summary.json..."

if command -v bun >/dev/null 2>&1; then
  bun scripts/sync_db.ts --stage
elif command -v npx >/dev/null 2>&1; then
  npx tsx scripts/sync_db.ts --stage
fi
EOF

chmod +x "$HOOKS_DIR/pre-commit"

# 2. Hook pre-push
cat << 'EOF' > "$HOOKS_DIR/pre-push"
#!/usr/bin/env bash
echo "🚀 [Git Hook: pre-push] Verificando dados do banco antes de enviar para o GitHub..."

if command -v bun >/dev/null 2>&1; then
  bun scripts/sync_db.ts --check-push
elif command -v npx >/dev/null 2>&1; then
  npx tsx scripts/sync_db.ts --check-push
fi

echo "✅ [Git Hook: pre-push] Banco validado com sucesso. Prosseguindo com o git push..."
EOF

chmod +x "$HOOKS_DIR/pre-push"

echo "🎉 Git Hooks configurados com sucesso em $HOOKS_DIR!"
