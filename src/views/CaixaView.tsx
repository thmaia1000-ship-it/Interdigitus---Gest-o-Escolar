import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Caixa, Aluno } from '../types/schema.js';
import {
  Wallet,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  X,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const CaixaView: React.FC = () => {
  const [movimentos, setMovimentos] = useState<Caixa[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);

  // Totais
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSaidas, setTotalSaidas] = useState(0);
  const [saldo, setSaldo] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filtros
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState('');
  const [forma, setForma] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Modal Novo Lançamento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    valor_total: 100,
    tipo_movimentacao: 'Entrada',
    forma: 'PIX',
    descricao: '',
    nome: '',
    curso: '',
    idaluno: null as number | null,
    justificativa: '',
  });

  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resCaixa, resAlunos] = await Promise.all([
        api.getCaixa({
          tipo: tipo || undefined,
          forma: forma || undefined,
          data_inicio: dataInicio || undefined,
          data_fim: dataFim || undefined,
          search: search || undefined,
          page,
          limit: 15,
        }),
        api.getAlunos({ limit: 100 }),
      ]);
      setMovimentos(resCaixa.data);
      setTotalEntradas(resCaixa.totalEntradas);
      setTotalSaidas(resCaixa.totalSaidas);
      setSaldo(resCaixa.saldo);
      setTotal(resCaixa.total);
      setTotalPages(resCaixa.totalPages);
      setAlunos(resAlunos.data);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, tipo, forma, dataInicio, dataFim]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleOpenCreate = () => {
    setFormData({
      valor_total: 100,
      tipo_movimentacao: 'Entrada',
      forma: 'PIX',
      descricao: '',
      nome: '',
      curso: '',
      idaluno: null,
      justificativa: 'Lançamento manual avulso no balcão',
    });
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCaixa(formData);
      setMsg({
        type: 'ok',
        text: 'Lançamento registrado com sucesso no Caixa e auditado automaticamente no log_caixa!',
      });
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setMsg(null), 3500);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const formatMoney = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Livro Caixa</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Movimentações financeiras de entrada e saída da tabela <code className="font-mono text-indigo-600">tb_caixa</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/csv/caixa"
            download
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV Seguro</span>
          </a>
          <button
            onClick={handleOpenCreate}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            msg.type === 'ok'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {msg.type === 'ok' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Cards de Totais do Caixa */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Total Entradas</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-2 font-mono">{formatMoney(totalEntradas)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Total Saídas</span>
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700 mt-2 font-mono">{formatMoney(totalSaidas)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Saldo Líquido</span>
            <Wallet className="w-4 h-4 text-indigo-600" />
          </div>
          <div className={`text-xl font-bold mt-2 font-mono ${saldo >= 0 ? 'text-indigo-900' : 'text-rose-600'}`}>
            {formatMoney(saldo)}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-3">
        <form onSubmit={handleSearch} className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por descrição ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="">Todos os Tipos</option>
            <option value="Entrada">Entradas</option>
            <option value="Saída">Saídas</option>
          </select>

          <select
            value={forma}
            onChange={(e) => {
              setForma(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="">Todas as Formas</option>
            <option value="PIX">PIX</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão Débito">Cartão Débito</option>
            <option value="Cartão Crédito">Cartão Crédito</option>
            <option value="Boleto">Boleto</option>
          </select>

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

          <span className="text-xs text-slate-500 font-mono ml-auto">{total} registro(s)</span>
        </div>
      </div>

      {/* Tabela do Livro Caixa */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">ID / Data</th>
              <th className="px-4 py-3">Tipo & Forma</th>
              <th className="px-4 py-3">Descrição / Finalidade</th>
              <th className="px-4 py-3">Aluno / Favorecido</th>
              <th className="px-4 py-3">Operador</th>
              <th className="px-4 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Carregando livro caixa...
                </td>
              </tr>
            ) : movimentos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Nenhum lançamento no período filtrado.
                </td>
              </tr>
            ) : (
              movimentos.map((c) => (
                <tr key={c.ID_caixa} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500">
                    <div>#{c.ID_caixa}</div>
                    <div className="text-[10px] text-slate-400">
                      {c.data} {c.horario && `· ${c.horario}`}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        c.tipo_movimentacao === 'Entrada'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {c.tipo_movimentacao}
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{c.forma}</div>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">
                    <div className="font-semibold text-slate-900">{c.descricao || 'Sem descrição'}</div>
                    {c.curso && <div className="text-[10px] text-indigo-600">{c.curso}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div>{c.nome || 'Não vinculado'}</div>
                    {c.idaluno && <div className="text-[10px] text-slate-400 font-mono">ID Aluno #{c.idaluno}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{c.usuario || 'Sistema'}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-mono font-bold text-sm ${
                        c.tipo_movimentacao === 'Entrada' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {c.tipo_movimentacao === 'Saída' ? '-' : '+'} {formatMoney(c.valor_total || 0)}
                    </span>
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

      {/* Modal Novo Lançamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Novo Lançamento de Caixa</h2>
                <p className="text-xs text-slate-500">Auditoria automática garantida via log_caixa</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Movimentação *</label>
                  <select
                    required
                    value={formData.tipo_movimentacao}
                    onChange={(e) => setFormData({ ...formData, tipo_movimentacao: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value="Entrada">Entrada (+)</option>
                    <option value="Saída">Saída (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Forma de Pagamento *</label>
                  <select
                    required
                    value={formData.forma}
                    onChange={(e) => setFormData({ ...formData, forma: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão Débito">Cartão Débito</option>
                    <option value="Cartão Crédito">Cartão Crédito</option>
                    <option value="Boleto">Boleto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Valor Total (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={0.01}
                  value={formData.valor_total}
                  onChange={(e) => setFormData({ ...formData, valor_total: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição / Finalidade *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pagamento taxa de expedição de declaração"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Aluno Vinculado (Opcional)</label>
                <select
                  value={formData.idaluno || ''}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    const al = alunos.find((a) => a.ID_aluno === id);
                    setFormData({
                      ...formData,
                      idaluno: id,
                      nome: al ? al.nome_aluno : formData.nome,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Lançamento avulso / Não vincular a aluno</option>
                  {alunos.map((a) => (
                    <option key={a.ID_aluno} value={a.ID_aluno}>
                      {a.nome_aluno} (ID #{a.ID_aluno})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome / Favorecido</label>
                <input
                  type="text"
                  placeholder="Ex: Fornecedor, Aluno ou Portador"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Justificativa para a Auditoria *</label>
                <input
                  type="text"
                  required
                  placeholder="Motivo obrigatório registrado no log_caixa"
                  value={formData.justificativa}
                  onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Registrar Movimentação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
