import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Produto } from '../types/schema.js';
import { useAuth } from '../context/AuthContext.js';
import { ShoppingBag, Plus, Edit2, Trash2, X, CheckCircle, AlertCircle, AlertTriangle, Search, Package } from 'lucide-react';

export const ProdutosView: React.FC = () => {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<Omit<Produto, 'ID_produto'>>({
    produto: '',
    descricao: '',
    valor_custo: 50,
    valor_venda: 90,
    estoque: 20,
    data_gerada: new Date().toISOString().split('T')[0],
    usuario: '',
  });

  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const canViewCost = user?.role === 'Administrador' || user?.role === 'Comercial';

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getProdutos(search || undefined);
      setProdutos(data);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      produto: '',
      descricao: '',
      valor_custo: 50,
      valor_venda: 90,
      estoque: 20,
      data_gerada: new Date().toISOString().split('T')[0],
      usuario: '',
    });
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Produto) => {
    setEditingId(p.ID_produto);
    setFormData({
      produto: p.produto,
      descricao: p.descricao || '',
      valor_custo: p.valor_custo || 0,
      valor_venda: p.valor_venda || 0,
      estoque: p.estoque || 0,
      data_gerada: p.data_gerada,
      usuario: p.usuario,
    });
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateProduto(editingId, formData);
        setMsg({ type: 'ok', text: 'Produto e estoque atualizados com sucesso!' });
      } else {
        await api.createProduto(formData);
        setMsg({ type: 'ok', text: 'Produto cadastrado com sucesso!' });
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Deseja excluir o produto "${nome}"? Exclusão bloqueada se houver vendas vinculadas.`)) return;
    try {
      await api.deleteProduto(id);
      setMsg({ type: 'ok', text: 'Produto excluído com sucesso!' });
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const formatMoney = (val: number | null) => {
    if (val === null || val === undefined) return 'Restrito';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Catálogo de Produtos & Estoque</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão de materiais escolares, uniformes e apostilas
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Produto</span>
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
            placeholder="Buscar por nome do produto ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </form>
        <span className="text-xs text-slate-500 font-mono">{produtos.length} produto(s)</span>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Descrição (descricao)</th>
              <th className="px-4 py-3">Estoque Atual</th>
              {canViewCost && <th className="px-4 py-3">Preço de Custo</th>}
              <th className="px-4 py-3">Preço de Venda</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Carregando produtos...
                </td>
              </tr>
            ) : produtos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  Nenhum produto encontrado.
                </td>
              </tr>
            ) : (
              produtos.map((p) => (
                <tr key={p.ID_produto} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-400">#{p.ID_produto}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{p.produto}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{p.descricao || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1 ${
                        (p.estoque || 0) <= 10
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {(p.estoque || 0) <= 10 && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                      <span>{p.estoque ?? 0} un</span>
                    </span>
                  </td>
                  {canViewCost && (
                    <td className="px-4 py-3 font-mono text-slate-500">{formatMoney(p.valor_custo)}</td>
                  )}
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{formatMoney(p.valor_venda)}</td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md"
                      title="Editar Produto e Estoque"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.ID_produto, p.produto)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-md"
                      title="Excluir Produto"
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
              <h2 className="text-base font-bold text-slate-900">{editingId ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Jaleco Branco Bordado"
                  value={formData.produto}
                  onChange={(e) => setFormData({ ...formData, produto: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição do Item</label>
                <textarea
                  rows={2}
                  placeholder="Detalhes, tamanho, fabricante..."
                  value={formData.descricao || ''}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                ></textarea>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor_custo || 0}
                    onChange={(e) => setFormData({ ...formData, valor_custo: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.valor_venda || 0}
                    onChange={(e) => setFormData({ ...formData, valor_venda: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estoque *</label>
                  <input
                    type="number"
                    required
                    value={formData.estoque || 0}
                    onChange={(e) => setFormData({ ...formData, estoque: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
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
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
