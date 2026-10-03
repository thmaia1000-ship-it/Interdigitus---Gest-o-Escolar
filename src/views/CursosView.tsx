import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Curso } from '../types/schema.js';
import { BookOpen, Plus, Edit2, Trash2, X, CheckCircle, AlertCircle, Users, Layers, School } from 'lucide-react';

export const CursosView: React.FC = () => {
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nomeCurso, setNomeCurso] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getCursos();
      setCursos(data);
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
    setEditingId(null);
    setNomeCurso('');
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.ID_curso);
    setNomeCurso(item.nome_curso);
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateCurso(editingId, nomeCurso);
        setMsg({ type: 'ok', text: 'Curso atualizado com sucesso!' });
      } else {
        await api.createCurso(nomeCurso);
        setMsg({ type: 'ok', text: 'Novo curso criado com sucesso!' });
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Deseja excluir o curso "${nome}"? Exclusão bloqueada se houver disciplinas ou alunos vinculados.`)) return;
    try {
      await api.deleteCurso(id);
      setMsg({ type: 'ok', text: 'Curso excluído com sucesso!' });
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cursos Regulares</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Catálogo de cursos técnicos e profissionalizantes
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Curso</span>
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

      {/* Grid de Cursos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center text-slate-400 text-xs">Carregando cursos...</div>
        ) : (
          cursos.map((c) => (
            <div key={c.ID_curso} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
                    ID #{c.ID_curso}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.ID_curso, c.nome_curso)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-3">{c.nome_curso}</h3>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500">
                <div>
                  <div className="font-bold text-slate-800 font-mono">{c.totalAlunos}</div>
                  <div className="text-[10px] text-slate-400">Alunos</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800 font-mono">{c.totalMaterias}</div>
                  <div className="text-[10px] text-slate-400">Disciplinas</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800 font-mono">{c.totalTurmas}</div>
                  <div className="text-[10px] text-slate-400">Turmas</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-900">{editingId ? 'Editar Curso' : 'Novo Curso'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Curso *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Técnico em Enfermagem"
                  value={nomeCurso}
                  onChange={(e) => setNomeCurso(e.target.value)}
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
