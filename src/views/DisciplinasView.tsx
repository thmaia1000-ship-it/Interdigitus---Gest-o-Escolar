import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Materia, Curso } from '../types/schema.js';
import { BookOpen, Plus, Edit2, Trash2, X, CheckCircle, AlertCircle, Search } from 'lucide-react';

export const DisciplinasView: React.FC = () => {
  const [materias, setMaterias] = useState<any[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCurso, setFiltroCurso] = useState('');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    materia: '',
    idcurso: 0,
  });
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [matList, curList] = await Promise.all([
        api.getMaterias({
          idcurso: filtroCurso ? Number(filtroCurso) : undefined,
          search: search || undefined,
        }),
        api.getCursos(),
      ]);
      setMaterias(matList);
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
  }, [filtroCurso]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ materia: '', idcurso: cursos[0]?.ID_curso || 0 });
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: any) => {
    setEditingId(m.ID_materia);
    setFormData({
      materia: m.materia,
      idcurso: m.idcurso,
    });
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateMateria(editingId, formData);
        setMsg({ type: 'ok', text: 'Disciplina atualizada com sucesso!' });
      } else {
        await api.createMateria(formData);
        setMsg({ type: 'ok', text: 'Disciplina cadastrada com sucesso!' });
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Deseja excluir a disciplina "${nome}"? Exclusão bloqueada se houver notas vinculadas.`)) return;
    try {
      await api.deleteMateria(id);
      setMsg({ type: 'ok', text: 'Disciplina excluída com sucesso!' });
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Disciplinas Curriculares</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mapeamento de matérias e cursos da tabela <code className="font-mono text-indigo-600">tb_materias</code>
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Disciplina</span>
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

      {/* Filtro e Busca */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-3">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome da disciplina..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filtroCurso}
            onChange={(e) => setFiltroCurso(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">Todos os Cursos</option>
            {cursos.map((c) => (
              <option key={c.ID_curso} value={c.ID_curso}>
                {c.nome_curso}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500 font-mono">{materias.length} disciplina(s)</span>
        </div>
      </div>

      {/* Tabela de Matérias */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nome da Disciplina (materia)</th>
              <th className="px-4 py-3">Curso Vinculado (idcurso)</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Carregando disciplinas...
                </td>
              </tr>
            ) : materias.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  Nenhuma disciplina cadastrada.
                </td>
              </tr>
            ) : (
              materias.map((m) => (
                <tr key={m.ID_materia} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-400">#{m.ID_materia}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{m.materia}</td>
                  <td className="px-4 py-3 text-indigo-700 font-medium">
                    {m.nome_curso} <span className="text-[10px] text-slate-400 font-mono">(ID #{m.idcurso})</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(m)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.ID_materia, m.materia)}
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
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? 'Editar Disciplina' : 'Nova Disciplina'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome da Disciplina *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Anatomia Humana Aplicada"
                  value={formData.materia}
                  onChange={(e) => setFormData({ ...formData, materia: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Curso Vinculado *</label>
                <select
                  required
                  value={formData.idcurso}
                  onChange={(e) => setFormData({ ...formData, idcurso: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
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
