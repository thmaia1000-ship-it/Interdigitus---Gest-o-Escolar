import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { DatabaseStatus } from '../../types/schema.js';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Table2,
  ShieldCheck,
  X,
  UploadCloud,
  FileCode2,
  RefreshCw,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DbInspectorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'tables' | 'schema' | 'import' | 'env'>('tables');

  // Import SQL state
  const [sqlText, setSqlText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    importedCount?: number;
    tablesSummary?: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = () => {
    api.getStatus().then(setStatus).catch(console.error);
  };

  if (!isOpen) return null;

  const copySql = () => {
    navigator.clipboard.writeText(SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setSqlText(text);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!sqlText.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await api.importSql(sqlText);
      setImportResult(res);
      loadStatus();
    } catch (err: any) {
      setImportResult({
        success: false,
        message: err.message || 'Falha ao processar script SQL.',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Diagnóstico do Banco dbinterdigitus</h2>
              <p className="text-xs text-slate-500">Mapeamento e verificação das 18 tabelas originais</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alert */}
        <div className="px-6 py-3 bg-amber-50/80 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-amber-900">
            {status?.connected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>
              {status?.connected
                ? `Conexão MySQL ativa (${status.databaseName})`
                : 'Modo Demonstração / Dados Locais Ativo. Todas as 18 tabelas operando com persistência isolada.'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded">
            {status?.mode === 'mysql' ? 'MySQL 8.x' : 'Engine Local / 18 Tabelas'}
          </span>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('tables')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'tables'
                ? 'border-indigo-600 text-indigo-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table2 className="w-4 h-4" />
            Cobertura das 18 Tabelas ({status?.tables.length || 18})
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'schema'
                ? 'border-indigo-600 text-indigo-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            DDL Original
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-indigo-600 text-indigo-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Importar Dump .SQL
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'env'
                ? 'border-indigo-600 text-indigo-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            Configuração de Conexão MySQL
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'tables' && (
            <div>
              <p className="text-xs text-slate-600 mb-4">
                As 18 tabelas do banco <code className="text-indigo-600 font-mono">dbinterdigitus</code> possuem
                rotas dedicadas de consulta, cadastro, paginação no servidor e regras de validação aplicadas:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {status?.tables.map((t) => (
                  <div
                    key={t.name}
                    className="p-3 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors bg-white flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-900">{t.name}</span>
                        {t.name === 'log_caixa' && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Somente Leitura
                          </span>
                        )}
                        {t.name === 'tb_cursoLivre' && (
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            Case-sensitive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                    </div>
                    <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded shrink-0 ml-2">
                      {t.count} registros
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-600">
                  Script DDL de referência do esquema original (sem dados pessoais).
                </span>
                <button
                  onClick={copySql}
                  className="px-3 py-1 text-xs border border-slate-200 rounded-md hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar DDL'}
                </button>
              </div>
              <pre className="text-[11px] font-mono bg-slate-900 text-slate-200 p-4 rounded-lg overflow-x-auto max-h-96 leading-relaxed">
                {SCHEMA_SQL}
              </pre>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs text-indigo-900 leading-relaxed">
                <strong>Importação Direta de Dados Legados:</strong> Você pode enviar um arquivo <code className="font-mono bg-white px-1 py-0.5 rounded">.sql</code> gerado pelo <em>mysqldump</em> ou colar os comandos <code className="font-mono bg-white px-1 py-0.5 rounded">INSERT INTO tb_...</code> abaixo. Os registros serão processados e integrados com integridade relacional.
              </div>

              {/* Status do resultado da importação */}
              {importResult && (
                <div
                  className={`p-3 rounded-lg text-xs flex flex-col gap-1 ${
                    importResult.success
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {importResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{importResult.message}</span>
                  </div>
                  {importResult.tablesSummary && (
                    <div className="text-[11px] text-emerald-800 font-mono mt-1 pl-6">
                      {Object.entries(importResult.tablesSummary).map(([tab, count]) => (
                        <span key={tab} className="mr-3 inline-block">
                          {tab}: +{count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* File upload picker */}
              <div className="flex items-center justify-between gap-4 p-3 border border-slate-200 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <FileCode2 className="w-4 h-4 text-slate-500" />
                  <span>Carregar arquivo do seu computador (.sql):</span>
                </div>
                <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-md text-xs font-semibold text-slate-700 cursor-pointer shadow-xs transition-colors">
                  <span>Selecionar Arquivo .sql</span>
                  <input
                    type="file"
                    accept=".sql,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ou cole os comandos SQL INSERT abaixo:
                </label>
                <textarea
                  rows={8}
                  placeholder={`INSERT INTO \`tb_cursos\` (\`ID_curso\`, \`nome_curso\`) VALUES (1, 'Técnico em Enfermagem');\nINSERT INTO \`tb_alunos\` (...) VALUES (...);`}
                  value={sqlText}
                  onChange={(e) => setSqlText(e.target.value)}
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                ></textarea>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSqlText('')}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Limpar texto
                </button>
                <button
                  type="button"
                  disabled={importing || !sqlText.trim()}
                  onClick={handleExecuteImport}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processando Importação...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Executar Importação SQL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'env' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Para conectar este sistema a uma instância real de MySQL hospedada na rede ou em nuvem (ex: Google Cloud SQL,
                AWS RDS ou servidor dedicado), configure as seguintes variáveis no arquivo <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">.env</code>:
              </p>
              <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs space-y-1">
                <div># Conexão MySQL para Interdigitus</div>
                <div>MYSQL_HOST=127.0.0.1</div>
                <div>MYSQL_PORT=3306</div>
                <div>MYSQL_USER=usuario_interdigitus</div>
                <div>MYSQL_PASSWORD=sua_senha_segura</div>
                <div>MYSQL_DATABASE=dbinterdigitus</div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                <strong>Garantia de Integridade:</strong> O frontend nunca conecta diretamente ao MySQL. O backend
                Express centraliza a autenticação, auditoria no <code className="font-mono">log_caixa</code> e verificação de
                permissões antes de qualquer operação.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Fechar Diagnóstico
          </button>
        </div>
      </div>
    </div>
  );
};

const SCHEMA_SQL = `-- Esquema Original de Referência dbinterdigitus
-- 5 Chaves Estrangeiras Declaradas:
-- 1. tb_alunos.idcurso -> tb_cursos.ID_curso (ON DELETE SET NULL ON UPDATE SET NULL)
-- 2. tb_materias.idcurso -> tb_cursos.ID_curso (ON DELETE CASCADE ON UPDATE CASCADE)
-- 3. tb_mensalidades.idaluno -> tb_alunos.ID_aluno (ON DELETE CASCADE ON UPDATE CASCADE)
-- 4. tb_responsavel_financeiro.idaluno -> tb_alunos.ID_aluno (ON DELETE CASCADE ON UPDATE CASCADE)
-- 5. tb_turmas.idcurso -> tb_cursos.ID_curso (ON DELETE SET NULL ON UPDATE SET NULL)

CREATE TABLE log_caixa (
  ID_log_caixa int(11) NOT NULL AUTO_INCREMENT,
  valor_total decimal(10,2) NOT NULL,
  forma varchar(30) NOT NULL,
  tipo_movimentacao varchar(10) NOT NULL,
  descricao varchar(500) DEFAULT NULL,
  usuario varchar(70) NOT NULL,
  data date NOT NULL,
  horario varchar(5) NOT NULL,
  nome varchar(200) NOT NULL,
  curso varchar(20) DEFAULT NULL,
  idaluno int(11) DEFAULT NULL,
  mensalidades_pagas int(11) DEFAULT NULL,
  idmensalidade int(11) DEFAULT NULL,
  justificativa varchar(500) NOT NULL,
  tipo varchar(20) DEFAULT NULL,
  data_log date NOT NULL,
  usuario_log varchar(50) NOT NULL,
  PRIMARY KEY (ID_log_caixa)
);

CREATE TABLE tb_alunos (
  ID_aluno int(11) NOT NULL AUTO_INCREMENT,
  nome_aluno varchar(100) NOT NULL,
  email varchar(50) DEFAULT NULL,
  cpf varchar(15) DEFAULT NULL,
  rg varchar(20) DEFAULT NULL,
  orgao_emissor varchar(15) DEFAULT NULL,
  data_emissao date DEFAULT NULL,
  datanasc date DEFAULT NULL,
  UF varchar(10) DEFAULT NULL,
  cidade varchar(40) DEFAULT NULL,
  nacionalidade varchar(25) DEFAULT NULL,
  rua varchar(50) DEFAULT NULL,
  bairro varchar(50) DEFAULT NULL,
  cep varchar(15) DEFAULT NULL,
  numero varchar(10) DEFAULT NULL,
  telefone varchar(20) DEFAULT NULL,
  mae varchar(100) DEFAULT NULL,
  idcurso int(11) DEFAULT NULL,
  dias_aula varchar(15) DEFAULT NULL,
  turno varchar(15) DEFAULT NULL,
  ensino_medio varchar(70) DEFAULT NULL,
  ano_conclusao char(4) DEFAULT NULL,
  observacao varchar(1000) DEFAULT NULL,
  sistec varchar(20) DEFAULT NULL,
  livro_ata varchar(50) DEFAULT NULL,
  registro varchar(50) DEFAULT NULL,
  pagina varchar(50) DEFAULT NULL,
  codigo varchar(50) DEFAULT NULL,
  inicio_curso varchar(10) DEFAULT NULL,
  fim_curso varchar(10) DEFAULT NULL,
  data_conclusao_curso varchar(10) DEFAULT NULL,
  carga_horaria varchar(20) DEFAULT NULL,
  status varchar(20) NOT NULL,
  data_gerada date DEFAULT NULL,
  usuario varchar(50) DEFAULT NULL,
  PRIMARY KEY (ID_aluno)
);`;
