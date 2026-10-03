import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { CursoLivre } from '../types/schema.js';
import { BookOpen, Plus, Edit2, Trash2, X, CheckCircle, AlertCircle, Clock, Search } from 'lucide-react';

export const CursosLivresView: React.FC = () => {
  const [cursos, setCursos] = useState<CursoLivre[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome_curso: '',
    carga_horaria: 40,
    conteudo: '',
  });
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getCursosLivres(search || undefined);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ nome_curso: '', carga_horaria: 40, conteudo: '' });
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CursoLivre) => {
    setEditingId(c.ID_curso);
    setFormData({
      nome_curso: c.nome_curso,
      carga_horaria: c.carga_horaria,
      conteudo: c.conteudo,
    });
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateCursoLivre(editingId, formData);
        setMsg({ type: 'ok', text: 'Curso livre atualizado com sucesso!' });
      } else {
        await api.createCursoLivre(formData);
        setMsg({ type: 'ok', text: 'Curso livre cadastrado com sucesso!' });
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Deseja excluir o curso livre "${nome}"?`)) return;
    try {
      await api.deleteCursoLivre(id);
      setMsg({ type: 'ok', text: 'Curso livre removido com sucesso!' });
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cursos Livres e Extensão</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Catálogo autônomo de cursos livres e capacitações de curta duração
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Curso Livre</span>
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
            placeholder="Buscar por nome ou conteúdo programático..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </form>
        <span className="text-xs text-slate-500 font-mono">{cursos.length} curso(s) livre(s)</span>
      </div>

      {/* Grid de Cards com Carga Horária e Conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center text-slate-400 text-xs">Carregando cursos livres...</div>
        ) : cursos.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-500 text-xs">Nenhum curso livre encontrado.</div>
        ) : (
          cursos.map((c) => (
            <div key={c.ID_curso} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
                      ID #{c.ID_curso}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {c.carga_horaria}h
                    </span>
                  </div>
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
                <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Conteúdo Programático (conteudo)
                  </div>
                  {c.conteudo || 'Sem conteúdo programático detalhado.'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? 'Editar Curso Livre' : 'Novo Curso Livre'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Curso Livre *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Primeiros Socorros e Suporte Básico"
                  value={formData.nome_curso}
                  onChange={(e) => setFormData({ ...formData, nome_curso: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Carga Horária (em horas) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.carga_horaria}
                  onChange={(e) => setFormData({ ...formData, carga_horaria: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Conteúdo Programático (conteudo) *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Descreva a ementa, temas e competências abordadas..."
                  value={formData.conteudo}
                  onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
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
