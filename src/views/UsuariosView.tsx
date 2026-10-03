import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Usuario } from '../types/schema.js';
import { KeyRound, Plus, Edit2, Trash2, X, CheckCircle, AlertCircle, Shield, Lock, Search } from 'lucide-react';

export const UsuariosView: React.FC = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    nome_usuario: '',
    username: '',
    senha_plana: '',
    nivel_usuario: 2, // Secretaria por padrão
  });

  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadData = async (searchTerm?: string) => {
    setLoading(true);
    try {
      const data = await api.getUsuarios(searchTerm !== undefined ? searchTerm : search);
      setUsuarios(data);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(search);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      nome_usuario: '',
      username: '',
      senha_plana: '',
      nivel_usuario: 2,
    });
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: any) => {
    setEditingId(u.ID_usuario);
    setFormData({
      nome_usuario: u.nome_usuario,
      username: u.username,
      senha_plana: '', // Deixar vazio se não quiser alterar
      nivel_usuario: u.nivel_usuario,
    });
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateUsuario(editingId, {
          nome_usuario: formData.nome_usuario,
          username: formData.username,
          nivel_usuario: Number(formData.nivel_usuario),
          ...(formData.senha_plana ? { nova_senha: formData.senha_plana } : {}),
        });
        setMsg({ type: 'ok', text: 'Usuário atualizado com sucesso!' });
      } else {
        if (!formData.senha_plana) {
          setMsg({ type: 'err', text: 'Informe a senha inicial do novo usuário.' });
          return;
        }
        await api.createUsuario(formData);
        setMsg({ type: 'ok', text: 'Novo usuário criado com sucesso!' });
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`Deseja remover o usuário "${username}"?`)) return;
    try {
      await api.deleteUsuario(id);
      setMsg({ type: 'ok', text: 'Usuário removido com sucesso!' });
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Usuários Internos do Sistema</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento de operadores internos, acessos e permissões
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
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

      {/* Nota de Segurança */}
      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center gap-2">
        <Lock className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Segurança de Credenciais:</strong> Senhas e hashes criptográficos nunca são expostos em listagens,
          respostas de API ou logs. Apenas redefinições controladas são permitidas aos administradores.
        </span>
      </div>

      {/* Barra de Busca de Usuários */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, username ou perfil..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value === '') loadData('');
            }}
            className="w-full pl-9 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                loadData('');
              }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
        <div className="text-xs text-slate-500 font-medium">
          Total: <strong className="text-slate-900 font-mono">{usuarios.length}</strong> operador(es)
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nome do Operador (nome_usuario)</th>
              <th className="px-4 py-3">Login / Username</th>
              <th className="px-4 py-3">Nível (nivel_usuario)</th>
              <th className="px-4 py-3">Perfil Funcional RBAC</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Carregando operadores...
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.ID_usuario} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-400">#{u.ID_usuario}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{u.nome_usuario}</td>
                  <td className="px-4 py-3 font-mono text-indigo-700">@{u.username}</td>
                  <td className="px-4 py-3 font-mono">Nível {u.nivel_usuario}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                        u.role === 'Administrador'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : u.role === 'Financeiro'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : u.role === 'Secretaria'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md"
                      title="Editar Usuário / Redefinir Senha"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.ID_usuario, u.username)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-md"
                      title="Excluir Usuário"
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
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? 'Editar Usuário / Redefinir Senha' : 'Novo Usuário do Sistema'}
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
                  placeholder="Ex: Maria das Graças"
                  value={formData.nome_usuario}
                  onChange={(e) => setFormData({ ...formData, nome_usuario: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome de Usuário (Login) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: maria.secretaria"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {editingId ? 'Nova Senha (deixe em branco para manter)' : 'Senha Inicial *'}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.senha_plana}
                  onChange={(e) => setFormData({ ...formData, senha_plana: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Perfil Funcional (nivel_usuario) *</label>
                <select
                  required
                  value={formData.nivel_usuario}
                  onChange={(e) => setFormData({ ...formData, nivel_usuario: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value={1}>1 - Administrador (Acesso total)</option>
                  <option value={2}>2 - Secretaria (Acadêmico & Alunos)</option>
                  <option value={3}>3 - Coordenação (Cursos & Notas)</option>
                  <option value={4}>4 - Financeiro (Caixa, Despesas & Mensalidades)</option>
                  <option value={5}>5 - Comercial (Produtos & Vendas)</option>
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
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
