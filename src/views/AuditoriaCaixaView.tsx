import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { LogCaixa } from '../types/schema.js';
import { ShieldCheck, Search, Download, ChevronLeft, ChevronRight, Lock, Calendar, Filter } from 'lucide-react';

export const AuditoriaCaixaView: React.FC = () => {
  const [logs, setLogs] = useState<LogCaixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filtros
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditoriaCaixa({
        search: search || undefined,
        tipo: tipo || undefined,
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
        page,
        limit: 15,
      });
      setLogs(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, tipo, dataInicio, dataFim]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const formatMoney = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Trilha de Auditoria do Caixa</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Somente Leitura (Imutável)</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro cronológico forense de movimentações e conciliações do fluxo de caixa
          </p>
        </div>
        <a
          href="/api/export/csv/auditoria-caixa"
          download
          className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Auditoria (CSV)</span>
        </a>
      </div>

      {/* Box de Política de Auditoria */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-white">Integridade e Trilha Forense:</span> Os registros de auditoria contábil são gerados automaticamente pelo servidor para qualquer transação financeira (entradas, saídas ou quitações). Edições e exclusões manuais são estritamente bloqueadas para garantir a conformidade legal.
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-3">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por favorecido, justificativa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => {
              setDataInicio(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
            title="Data Inicial"
          />

          <input
            type="date"
            value={dataFim}
            onChange={(e) => {
              setDataFim(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
            title="Data Final"
          />

          <span className="text-xs text-slate-500 font-mono ml-auto">{total} evento(s)</span>
        </div>
      </div>

      {/* Tabela de Logs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">ID Log / Data Registro</th>
              <th className="px-4 py-3">Operador (usuario_log)</th>
              <th className="px-4 py-3">Tipo & Forma</th>
              <th className="px-4 py-3">Justificativa da Auditoria</th>
              <th className="px-4 py-3">Favorecido / Aluno</th>
              <th className="px-4 py-3 text-right">Valor Auditado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Carregando trilha de auditoria...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Nenhum registro de log encontrado para os filtros.
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.ID_log_caixa} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500">
                    <div className="font-semibold text-slate-800">#{l.ID_log_caixa}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{l.data_log}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-indigo-700 font-medium">{l.usuario_log}</div>
                    <div className="text-[10px] text-slate-400">Op. Origem: {l.usuario}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        l.tipo_movimentacao === 'Entrada'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {l.tipo_movimentacao}
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{l.forma}</div>
                  </td>
                  <td className="px-4 py-3 max-w-sm">
                    <div className="font-medium text-slate-900">{l.justificativa}</div>
                    {l.descricao && <div className="text-[11px] text-slate-400 truncate">{l.descricao}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div>{l.nome}</div>
                    {l.curso && <div className="text-[10px] text-slate-400">{l.curso}</div>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    {formatMoney(l.valor_total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginação */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Página <span className="font-semibold">{page}</span> de <span className="font-semibold">{totalPages}</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 border border-slate-300 rounded hover:bg-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-slate-300 rounded hover:bg-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
