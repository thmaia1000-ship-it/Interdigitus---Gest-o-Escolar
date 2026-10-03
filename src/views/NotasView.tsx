import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Nota, Aluno, Curso, Materia } from '../types/schema.js';
import { FileCheck2, Search, Plus, Edit2, Trash2, X, CheckCircle, AlertCircle, Calculator } from 'lucide-react';

export const NotasView: React.FC = () => {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroMateria, setFiltroMateria] = useState('');

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<Omit<Nota, 'ID_nota'>>({
    aluno: '',
    materia: '',
    nota1: '',
    nota2: '',
    media: '',
    situacao: '',
    idaluno: null,
    idcurso: null,
    idmateria: null,
    data_gerada: null,
    usuario: null,
  });

  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notList, alList, curList, matList] = await Promise.all([
        api.getNotas({
          idcurso: filtroCurso ? Number(filtroCurso) : undefined,
          idmateria: filtroMateria ? Number(filtroMateria) : undefined,
          search: search || undefined,
        }),
        api.getAlunos({ limit: 100 }),
        api.getCursos(),
        api.getMaterias(),
      ]);
      setNotas(notList);
      setAlunos(alList.data);
      setCursos(curList);
      setMaterias(matList);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filtroCurso, filtroMateria]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const calculateAutoAverage = (n1Str: string, n2Str: string) => {
    const n1 = parseFloat(n1Str.replace(',', '.'));
    const n2 = parseFloat(n2Str.replace(',', '.'));
    if (!isNaN(n1) && !isNaN(n2)) {
      const m = (n1 + n2) / 2;
      const mediaVal = m.toFixed(1);
      const sit = m >= 7.0 ? 'Aprovado' : m >= 5.0 ? 'Exame' : 'Reprovado';
      return { media: mediaVal, situacao: sit };
    }
    return { media: '', situacao: '' };
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    const firstAluno = alunos[0];
    const firstCurso = cursos[0];
    const firstMat = materias[0];
    setFormData({
      aluno: firstAluno?.nome_aluno || '',
      materia: firstMat?.materia || '',
      nota1: '',
      nota2: '',
      media: '',
      situacao: '',
      idaluno: firstAluno?.ID_aluno || null,
      idcurso: firstCurso?.ID_curso || null,
      idmateria: firstMat?.ID_materia || null,
      data_gerada: null,
      usuario: null,
    });
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (n: Nota) => {
    setEditingId(n.ID_nota);
    setFormData({
      aluno: n.aluno,
      materia: n.materia,
      nota1: n.nota1,
      nota2: n.nota2,
      media: n.media,
      situacao: n.situacao,
      idaluno: n.idaluno,
      idcurso: n.idcurso,
      idmateria: n.idmateria,
      data_gerada: n.data_gerada,
      usuario: n.usuario,
    });
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateNota(editingId, formData);
        setMsg({ type: 'ok', text: 'Nota atualizada com sucesso!' });
      } else {
        await api.createNota(formData);
        setMsg({ type: 'ok', text: 'Nota lançada com sucesso!' });
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente remover este lançamento de nota?')) return;
    try {
      await api.deleteNota(id);
      setMsg({ type: 'ok', text: 'Lançamento de nota excluído com sucesso!' });
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Lançamento de Notas</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro acadêmico de notas, médias e situações da tabela <code className="font-mono text-indigo-600">tb_notas</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Nota Individual</span>
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

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-3">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por aluno ou matéria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filtroCurso}
            onChange={(e) => setFiltroCurso(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="">Todos os Cursos</option>
            {cursos.map((c) => (
              <option key={c.ID_curso} value={c.ID_curso}>
                {c.nome_curso}
              </option>
            ))}
          </select>

          <select
            value={filtroMateria}
            onChange={(e) => setFiltroMateria(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="">Todas as Disciplinas</option>
            {materias.map((m) => (
              <option key={m.ID_materia} value={m.ID_materia}>
                {m.materia}
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-500 font-mono ml-auto">{notas.length} nota(s)</span>
        </div>
      </div>

      {/* Tabela de Notas */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Aluno</th>
              <th className="px-4 py-3">Disciplina (materia)</th>
              <th className="px-4 py-3">Nota 1</th>
              <th className="px-4 py-3">Nota 2</th>
              <th className="px-4 py-3">Média</th>
              <th className="px-4 py-3">Situação</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                  Carregando notas...
                </td>
              </tr>
            ) : notas.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                  Nenhum lançamento de notas encontrado.
                </td>
              </tr>
            ) : (
              notas.map((n) => (
                <tr key={n.ID_nota} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-400">#{n.ID_nota}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{n.aluno}</div>
                    <div className="text-[10px] text-slate-400 font-mono">ID Aluno #{n.idaluno}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{n.materia}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{n.nota1 || '-'}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{n.nota2 || '-'}</td>
                  <td className="px-4 py-3 font-mono font-bold text-indigo-700">{n.media || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                        n.situacao === 'Aprovado'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : n.situacao === 'Exame'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {n.situacao || 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(n)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md"
                      title="Editar Nota"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(n.ID_nota)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-md"
                      title="Excluir Lançamento"
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

      {/* Modal de Lançamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? 'Editar Lançamento de Nota' : 'Lançar Nota'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Aluno *</label>
                <select
                  required
                  value={formData.idaluno || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const al = alunos.find((a) => a.ID_aluno === id);
                    setFormData({
                      ...formData,
                      idaluno: id,
                      aluno: al ? al.nome_aluno : '',
                      idcurso: al ? al.idcurso : formData.idcurso,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Selecione o aluno...</option>
                  {alunos.map((a) => (
                    <option key={a.ID_aluno} value={a.ID_aluno}>
                      {a.nome_aluno} (CPF: {a.cpf || 'S/ CPF'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Disciplina *</label>
                <select
                  required
                  value={formData.idmateria || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const mat = materias.find((m) => m.ID_materia === id);
                    setFormData({
                      ...formData,
                      idmateria: id,
                      materia: mat ? mat.materia : '',
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Selecione a disciplina...</option>
                  {materias.map((m) => (
                    <option key={m.ID_materia} value={m.ID_materia}>
                      {m.materia}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nota 1 (0 a 10)</label>
                  <input
                    type="text"
                    placeholder="Ex: 8.5"
                    value={formData.nota1 || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const calc = calculateAutoAverage(val, formData.nota2 || '');
                      setFormData({
                        ...formData,
                        nota1: val,
                        media: calc.media || formData.media,
                        situacao: calc.situacao || formData.situacao,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nota 2 (0 a 10)</label>
                  <input
                    type="text"
                    placeholder="Ex: 7.0"
                    value={formData.nota2 || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const calc = calculateAutoAverage(formData.nota1 || '', val);
                      setFormData({
                        ...formData,
                        nota2: val,
                        media: calc.media || formData.media,
                        situacao: calc.situacao || formData.situacao,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Média Calculada</label>
                  <input
                    type="text"
                    value={formData.media || ''}
                    onChange={(e) => setFormData({ ...formData, media: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-indigo-700 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Situação Final</label>
                  <select
                    value={formData.situacao || ''}
                    onChange={(e) => setFormData({ ...formData, situacao: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="">A Definir</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Exame">Exame</option>
                    <option value="Reprovado">Reprovado</option>
                  </select>
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
                  Salvar Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
