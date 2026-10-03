import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Turma, Curso } from '../types/schema.js';
import { School, Plus, Edit2, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react';

export const TurmasView: React.FC = () => {
  const [turmas, setTurmas] = useState<any[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTurno, setFiltroTurno] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Omit<Turma, 'ID_turma'>>({
    turma: '',
    sala: '',
    turno: 'Manhã',
    status_turma: 'A',
    idcurso: null,
  });
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [turList, curList] = await Promise.all([
        api.getTurmas({
          turno: filtroTurno || undefined,
          status: filtroStatus || undefined,
        }),
        api.getCursos(),
      ]);
      setTurmas(turList);
      setCursos(curList);
      if (curList.length > 0 && !formData.idcurso) {
        setFormData((prev) => ({ ...prev, idcurso: curList[0].ID_curso }));
      }
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filtroTurno, filtroStatus]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      turma: '',
      sala: '',
      turno: 'Manhã',
      status_turma: 'A',
      idcurso: cursos[0]?.ID_curso || null,
    });
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: any) => {
    setEditingId(t.ID_turma);
    setFormData({
      turma: t.turma,
      sala: t.sala,
      turno: t.turno,
      status_turma: t.status_turma,
      idcurso: t.idcurso,
    });
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateTurma(editingId, formData);
        setMsg({ type: 'ok', text: 'Turma atualizada com sucesso!' });
      } else {
        await api.createTurma(formData);
        setMsg({ type: 'ok', text: 'Turma cadastrada com sucesso!' });
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Deseja excluir a turma "${nome}"?`)) return;
    try {
      await api.deleteTurma(id);
      setMsg({ type: 'ok', text: 'Turma excluída com sucesso!' });
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const getStatusDescricao = (st: string) => {
    switch (st) {
      case 'A':
        return 'Ativa (A)';
      case 'F':
        return 'Finalizada (F)';
      case 'I':
        return 'Inativa (I)';
      default:
        return st;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Turmas & Salas</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão de turmas ativas, salas e turnos da tabela <code className="font-mono text-indigo-600">tb_turmas</code>
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Turma</span>
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

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <select
            value={filtroTurno}
            onChange={(e) => setFiltroTurno(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="">Todos os Turnos</option>
            <option value="Manhã">Manhã</option>
            <option value="Tarde">Tarde</option>
            <option value="Noite">Noite</option>
            <option value="Sábado">Sábado</option>
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="">Todos os Status</option>
            <option value="A">Ativas (A)</option>
            <option value="F">Finalizadas (F)</option>
            <option value="I">Inativas (I)</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-mono">{turmas.length} turma(s)</span>
      </div>

      {/* Tabela de Turmas */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Identificador da Turma</th>
              <th className="px-4 py-3">Sala</th>
              <th className="px-4 py-3">Turno</th>
              <th className="px-4 py-3">Curso Regular</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Carregando turmas...
                </td>
              </tr>
            ) : turmas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  Nenhuma turma encontrada.
                </td>
              </tr>
            ) : (
              turmas.map((t) => (
                <tr key={t.ID_turma} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-400">#{t.ID_turma}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{t.turma}</td>
                  <td className="px-4 py-3 text-slate-600">{t.sala}</td>
                  <td className="px-4 py-3 text-slate-600">{t.turno}</td>
                  <td className="px-4 py-3 text-indigo-700 font-medium">
                    {t.nome_curso} <span className="text-[10px] text-slate-400 font-mono">(ID #{t.idcurso})</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        t.status_turma === 'A'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {getStatusDescricao(t.status_turma)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.ID_turma, t.turma)}
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
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-900">{editingId ? 'Editar Turma' : 'Nova Turma'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Identificador da Turma *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ENF-2025-1M"
                  value={formData.turma}
                  onChange={(e) => setFormData({ ...formData, turma: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sala / Laboratório *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sala 102 ou Laboratório 01"
                  value={formData.sala}
                  onChange={(e) => setFormData({ ...formData, sala: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Turno *</label>
                  <select
                    required
                    value={formData.turno}
                    onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noite">Noite</option>
                    <option value="Sábado">Sábado</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status da Turma *</label>
                  <select
                    required
                    value={formData.status_turma}
                    onChange={(e) => setFormData({ ...formData, status_turma: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="A">Ativa (A)</option>
                    <option value="F">Finalizada (F)</option>
                    <option value="I">Inativa (I)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Curso Vinculado</label>
                <select
                  value={formData.idcurso || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, idcurso: e.target.value ? Number(e.target.value) : null })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Sem curso vinculado</option>
                  {cursos.map((c) => (
                    <option key={c.ID_curso} value={c.ID_curso}>
                      {c.nome_curso}
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
