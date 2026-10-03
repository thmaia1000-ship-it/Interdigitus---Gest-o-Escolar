import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { ResponsavelFinanceiro, Aluno } from '../types/schema.js';
import { Users, Search, Plus, Edit2, Trash2, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export const ResponsaveisView: React.FC = () => {
  const [responsaveis, setResponsaveis] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    CPF: '',
    RG: '',
    idaluno: 0,
  });

  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resResp, resAlunos] = await Promise.all([
        api.getResponsaveis({ search: search || undefined, page, limit: 15 }),
        api.getAlunos({ limit: 100 }),
      ]);
      setResponsaveis(resResp.data);
      setTotal(resResp.total);
      setTotalPages(resResp.totalPages);
      setAlunos(resAlunos.data);
      if (resAlunos.data.length > 0 && !formData.idaluno) {
        setFormData((prev) => ({ ...prev, idaluno: resAlunos.data[0].ID_aluno }));
      }
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      nome: '',
      CPF: '',
      RG: '',
      idaluno: alunos[0]?.ID_aluno || 0,
    });
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.ID_responsavel_financeiro);
    setFormData({
      nome: item.nome,
      CPF: item.CPF,
      RG: item.RG,
      idaluno: item.idaluno,
    });
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateResponsavel(editingId, formData);
        setMsg({ type: 'ok', text: 'Responsável financeiro atualizado com sucesso!' });
      } else {
        await api.createResponsavel(formData);
        setMsg({ type: 'ok', text: 'Responsável financeiro cadastrado com sucesso!' });
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Confirma a exclusão do responsável "${nome}"?`)) return;
    try {
      await api.deleteResponsavel(id);
      setMsg({ type: 'ok', text: 'Responsável excluído com sucesso!' });
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Responsáveis Financeiros</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro e gestão de responsáveis legais e financeiros
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Responsável</span>
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

      {/* Busca */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
        <form onSubmit={handleSearch} className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </form>
        <span className="text-xs text-slate-500 font-mono">{total} registro(s)</span>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nome do Responsável</th>
              <th className="px-4 py-3">CPF</th>
              <th className="px-4 py-3">RG</th>
              <th className="px-4 py-3">Aluno Vinculado</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Carregando...
                </td>
              </tr>
            ) : responsaveis.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Nenhum responsável financeiro encontrado.
                </td>
              </tr>
            ) : (
              responsaveis.map((r) => (
                <tr key={r.ID_responsavel_financeiro} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-400">#{r.ID_responsavel_financeiro}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{r.nome}</td>
                  <td className="px-4 py-3 font-mono">{r.CPF}</td>
                  <td className="px-4 py-3 font-mono">{r.RG}</td>
                  <td className="px-4 py-3 text-indigo-700 font-medium">
                    {r.nome_aluno} <span className="text-[10px] text-slate-400 font-mono">(ID #{r.idaluno})</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(r)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(r.ID_responsavel_financeiro, r.nome)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-md"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? 'Editar Responsável' : 'Novo Responsável Financeiro'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">CPF *</label>
                <input
                  type="text"
                  required
                  placeholder="000.000.000-00"
                  value={formData.CPF}
                  onChange={(e) => setFormData({ ...formData, CPF: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">RG *</label>
                <input
                  type="text"
                  required
                  value={formData.RG}
                  onChange={(e) => setFormData({ ...formData, RG: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Aluno Vinculado (idaluno) *</label>
                <select
                  required
                  value={formData.idaluno}
                  onChange={(e) => setFormData({ ...formData, idaluno: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {alunos.map((a) => (
                    <option key={a.ID_aluno} value={a.ID_aluno}>
                      {a.nome_aluno} (ID #{a.ID_aluno})
                    </option>
                  ))}
                </select>
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
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
