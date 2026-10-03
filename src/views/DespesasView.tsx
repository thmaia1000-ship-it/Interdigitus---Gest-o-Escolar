import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Despesa } from '../types/schema.js';
import { ArrowDownCircle, Search, Plus, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react';

export const DespesasView: React.FC = () => {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'Material de Consumo',
    descricao: '',
    valor: 100,
    data: new Date().toISOString().split('T')[0],
    observacoes: '',
  });
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getDespesas({
        tipo: filtroTipo || undefined,
        search: search || undefined,
      });
      setDespesas(data);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filtroTipo]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenCreate = () => {
    setFormData({
      tipo: 'Material de Consumo',
      descricao: '',
      valor: 100,
      data: new Date().toISOString().split('T')[0],
      observacoes: '',
    });
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDespesa(formData);
      setMsg({ type: 'ok', text: 'Despesa registrada com sucesso!' });
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir o registro desta despesa?')) return;
    try {
      await api.deleteDespesa(id);
      setMsg({ type: 'ok', text: 'Despesa removida com sucesso!' });
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const formatMoney = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const totalDespesas = despesas.reduce((s, d) => s + (d.valor || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Despesas Administrativas & Operacionais</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle de despesas da tabela <code className="font-mono text-indigo-600">tb_despesas</code>
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Despesa</span>
        </button>
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

      {/* Barra de Filtros e Total */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-3">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por descrição ou observações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </form>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="">Todos os Tipos de Despesa</option>
            <option value="Material de Consumo">Material de Consumo</option>
            <option value="Serviços Públicos">Serviços Públicos</option>
            <option value="Manutenção">Manutenção</option>
            <option value="Outros">Outros</option>
          </select>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase">Total no Filtro</span>
            <span className="font-mono font-bold text-rose-700 text-sm">{formatMoney(totalDespesas)}</span>
          </div>
        </div>
      </div>

      {/* Tabela de Despesas */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">ID / Data</th>
              <th className="px-4 py-3">Tipo de Despesa</th>
              <th className="px-4 py-3">Descrição (descricao)</th>
              <th className="px-4 py-3">Observações (observacoes)</th>
              <th className="px-4 py-3">Operador</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Carregando despesas...
                </td>
              </tr>
            ) : despesas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  Nenhuma despesa registrada.
                </td>
              </tr>
            ) : (
              despesas.map((d) => (
                <tr key={d.ID_despesa} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500">
                    <div>#{d.ID_despesa}</div>
                    <div className="text-[10px] text-slate-400">{d.data}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{d.tipo}</td>
                  <td className="px-4 py-3 max-w-xs">{d.descricao}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{d.observacoes || '-'}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{d.usuario}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">
                    {formatMoney(d.valor)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(d.ID_despesa)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-md"
                      title="Excluir Despesa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-900">Registrar Despesa</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Despesa *</label>
                <select
                  required
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Material de Consumo">Material de Consumo</option>
                  <option value="Serviços Públicos">Serviços Públicos (Energia, Água, Internet)</option>
                  <option value="Manutenção">Manutenção Predial / Equipamentos</option>
                  <option value="Locação">Locação e Aluguel</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição do Gasto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra de materiais de escritório e papel A4"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0.01}
                    required
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data da Despesa *</label>
                  <input
                    type="date"
                    required
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações / NF</label>
                <textarea
                  rows={2}
                  placeholder="Número da Nota Fiscal, fornecedor ou observações..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                ></textarea>
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
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
