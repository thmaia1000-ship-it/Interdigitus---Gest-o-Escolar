/**
 * Script de Sincronização e Validação do Banco de Dados
 * Garante que os dados (data_interdigitus.json) estejam íntegros, atualizados
 * e versionados no Git antes de commits e pushes para o GitHub.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const dbPath = path.resolve(rootDir, 'data_interdigitus.json');
const summaryPath = path.resolve(rootDir, 'db_summary.json');

console.log('------------------------------------------------------------');
console.log('📦 [Sync-DB] Iniciando sincronização da base de dados...');
console.log('------------------------------------------------------------');

if (!fs.existsSync(dbPath)) {
  console.error(`❌ [Sync-DB] Arquivo do banco de dados não encontrado em: ${dbPath}`);
  process.exit(1);
}

try {
  const stat = fs.statSync(dbPath);
  const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);
  console.log(`ℹ️ [Sync-DB] Arquivo data_interdigitus.json detectado (${sizeMb} MB)`);

  // Lê e valida o conteúdo JSON
  const raw = fs.readFileSync(dbPath, 'utf-8');
  const data = JSON.parse(raw);

  const tables: Record<string, number> = {};
  let totalRecords = 0;

  for (const [key, val] of Object.entries(data)) {
    if (Array.isArray(val)) {
      tables[key] = val.length;
      totalRecords += val.length;
    }
  }

  const summary = {
    updatedAt: new Date().toISOString(),
    database: 'dbinterdigitus',
    fileSizeBytes: stat.size,
    fileSizeMb: parseFloat(sizeMb),
    totalRecords,
    tablesCount: Object.keys(tables).length,
    tables,
    system: 'Master Escolar - Sistema de Gestão Escolar',
    provider: 'Br3Tech',
  };

  // Grava o resumo leve do banco (útil para o Google AI Studio e diagnósticos rápidos)
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(`✅ [Sync-DB] Resumo gerado em db_summary.json (${totalRecords} registros em ${Object.keys(tables).length} tabelas)`);

  const args = process.argv.slice(2);
  const shouldStage = args.includes('--stage');
  const checkPush = args.includes('--check-push');

  if (shouldStage || checkPush) {
    try {
      execSync('git add data_interdigitus.json db_summary.json', { cwd: rootDir, stdio: 'inherit' });
      console.log('📌 [Sync-DB] data_interdigitus.json e db_summary.json adicionados ao Git stage com sucesso!');

      if (checkPush) {
        // Se houver modificações staged prontas para commit antes do push
        const diffStaged = execSync('git diff --cached --name-only', { cwd: rootDir, encoding: 'utf-8' }).trim();
        if (diffStaged.includes('data_interdigitus.json') || diffStaged.includes('db_summary.json')) {
          console.log('🔄 [Sync-DB] Commitando atualizações pendentes do banco de dados antes do push...');
          execSync('git commit -m "chore(db): sincronizar base data_interdigitus.json e db_summary.json"', {
            cwd: rootDir,
            stdio: 'inherit',
          });
          console.log('✅ [Sync-DB] Commit automático gerado com sucesso!');
        }
      }
    } catch (gitErr: any) {
      console.warn('⚠️ [Sync-DB] Aviso ao executar comando Git:', gitErr.message || gitErr);
    }
  }

  console.log('------------------------------------------------------------');
  console.log('🎉 [Sync-DB] Base de dados validada e pronta para publicação!');
  console.log('------------------------------------------------------------');
} catch (err: any) {
  console.error('❌ [Sync-DB] Erro ao validar o banco de dados:', err.message);
  process.exit(1);
}
