import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { ContaAluno, Aluno } from '../types/schema.js';
import { KeyRound, Plus, Key, Trash2, X, CheckCircle, AlertCircle, ShieldAlert, Lock } from 'lucide-react';

export const ContasAlunosView: React.FC = () => {
  const [contas, setContas] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);
  const [isModalResetOpen, setIsModalResetOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<any | null>(null);

  // Form Nova Conta
  const [formData, setFormData] = useState({
    cpf: '',
    senha_plana: 'aluno123',
    idaluno: 0,
  });

  // Form Reset Senha
  const [novaSenha, setNovaSenha] = useState('aluno123');

  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, aList] = await Promise.all([
        api.getContasAlunos(),
        api.getAlunos({ limit: 100 }),
      ]);
      setContas(cList);
      setAlunos(aList.data);
      if (aList.data.length > 0 && !formData.idaluno) {
        setFormData((prev) => ({
          ...prev,
          idaluno: aList.data[0].ID_aluno,
          cpf: aList.data[0].cpf || '',
        }));
      }
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    const a = alunos[0];
    setFormData({
      idaluno: a ? a.ID_aluno : 0,
      cpf: a ? a.cpf || '' : '',
      senha_plana: 'aluno123',
    });
    setMsg(null);
    setIsModalCreateOpen(true);
  };

  const handleOpenReset = (c: any) => {
    setSelectedConta(c);
    setNovaSenha('aluno123');
    setMsg(null);
    setIsModalResetOpen(true);
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createContaAluno(formData);
      setMsg({ type: 'ok', text: 'Conta de acesso criada com sucesso!' });
      setIsModalCreateOpen(false);
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const handleSaveReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConta) return;
    try {
      await api.resetSenhaContaAluno(selectedConta.ID_conta, novaSenha);
      setMsg({ type: 'ok', text: `Senha do aluno ${selectedConta.nome_aluno} redefinida com sucesso!` });
      setIsModalResetOpen(false);
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Deseja revogar o acesso do aluno "${nome}" excluindo sua conta?`)) return;
    try {
      await api.deleteContaAluno(id);
      setMsg({ type: 'ok', text: 'Conta de acesso revogada com sucesso!' });
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Contas de Acesso dos Alunos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Credenciais do portal do aluno gerenciadas na tabela <code className="font-mono text-indigo-600">tb_contas</code>
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Conta de Aluno</span>
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

      {/* Tabela de Contas */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">ID Conta</th>
              <th className="px-4 py-3">Aluno Vinculado (idaluno)</th>
              <th className="px-4 py-3">Identificador CPF (Login)</th>
              <th className="px-4 py-3">Status do Aluno</th>
              <th className="px-4 py-3 text-right">Ações de Segurança</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Carregando contas de alunos...
                </td>
              </tr>
            ) : contas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Nenhuma conta de aluno cadastrada.
                </td>
              </tr>
            ) : (
              contas.map((c) => (
                <tr key={c.ID_conta} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-400">#{c.ID_conta}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {c.nome_aluno} <span className="text-[10px] text-slate-400 font-mono">(ID #{c.idaluno})</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-indigo-700">{c.cpf}</td>
                  <td className="px-4 py-3">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium">
                      {c.status_aluno}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => handleOpenReset(c)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] inline-flex items-center gap-1"
                      title="Redefinir Senha do Aluno"
                    >
                      <Key className="w-3.5 h-3.5 text-slate-500" />
                      <span>Redefinir Senha</span>
                    </button>
                    <button
                      onClick={() => handleDelete(c.ID_conta, c.nome_aluno)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md"
                      title="Excluir Conta de Acesso"
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

      {/* Modal Nova Conta */}
      {isModalCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-900">Liberar Acesso para Aluno</h2>
              <button onClick={() => setIsModalCreateOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Selecione o Aluno *</label>
                <select
                  required
                  value={formData.idaluno}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const al = alunos.find((a) => a.ID_aluno === id);
                    setFormData({
                      ...formData,
                      idaluno: id,
                      cpf: al?.cpf || formData.cpf,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {alunos.map((a) => (
                    <option key={a.ID_aluno} value={a.ID_aluno}>
                      {a.nome_aluno} (CPF: {a.cpf || 'S/ CPF'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">CPF de Acesso (Login) *</label>
                <input
                  type="text"
                  required
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Senha Inicial de Acesso *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.senha_plana}
                  onChange={(e) => setFormData({ ...formData, senha_plana: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalCreateOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Criar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Redefinir Senha */}
      {isModalResetOpen && selectedConta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-900">Redefinir Senha do Aluno</h2>
              <button onClick={() => setIsModalResetOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4 text-xs">
              <span className="text-slate-500">Aluno:</span>{' '}
              <span className="font-semibold text-slate-900">{selectedConta.nome_aluno}</span>
            </div>

            <form onSubmit={handleSaveReset} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nova Senha *</label>
                <input
                  type="password"
                  required
                  placeholder="Digite a nova senha..."
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalResetOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
