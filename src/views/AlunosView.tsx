import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Aluno, Curso } from '../types/schema.js';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  X,
  FileText,
  AlertCircle,
  CheckCircle,
  Calendar,
  BookOpen,
  DollarSign,
  Receipt,
  Download,
} from 'lucide-react';

export const AlunosView: React.FC = () => {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filtros
  const [search, setSearch] = useState('');
  const [filtroCurso, setFiltroCurso] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');

  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [activeTab, setActiveTab] = useState<'pessoal' | 'endereco' | 'academico'>('pessoal');

  // Detalhe / Ficha do Aluno
  const [selectedAlunoDetail, setSelectedAlunoDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Erros e avisos
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const initialForm: Omit<Aluno, 'ID_aluno'> = {
    nome_aluno: '',
    email: '',
    cpf: '',
    rg: '',
    orgao_emissor: 'SSP/SP',
    data_emissao: '',
    datanasc: '',
    UF: 'SP',
    cidade: 'São Paulo',
    nacionalidade: 'Brasileira',
    rua: '',
    bairro: '',
    cep: '',
    numero: '',
    telefone: '',
    mae: '',
    idcurso: null,
    dias_aula: 'Seg a Sex',
    turno: 'Manhã',
    ensino_medio: '',
    ano_conclusao: '',
    observacao: '',
    sistec: '',
    livro_ata: '',
    registro: '',
    pagina: '',
    codigo: '',
    inicio_curso: '',
    fim_curso: '',
    data_conclusao_curso: '',
    carga_horaria: '1200h',
    status: 'Ativo',
    data_gerada: null,
    usuario: null,
  };
  const [formData, setFormData] = useState<Omit<Aluno, 'ID_aluno'>>(initialForm);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resAlunos, resCursos] = await Promise.all([
        api.getAlunos({
          search: search || undefined,
          idcurso: filtroCurso ? Number(filtroCurso) : undefined,
          status: filtroStatus || undefined,
          page,
          limit: 12,
        }),
        api.getCursos(),
      ]);
      setAlunos(resAlunos.data);
      setTotal(resAlunos.total);
      setTotalPages(resAlunos.totalPages);
      setCursos(resCursos);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, filtroCurso, filtroStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleOpenCreate = () => {
    setEditingAluno(null);
    setFormData(initialForm);
    setActiveTab('pessoal');
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setFormData({
      nome_aluno: aluno.nome_aluno || '',
      email: aluno.email || '',
      cpf: aluno.cpf || '',
      rg: aluno.rg || '',
      orgao_emissor: aluno.orgao_emissor || '',
      data_emissao: aluno.data_emissao || '',
      datanasc: aluno.datanasc || '',
      UF: aluno.UF || '',
      cidade: aluno.cidade || '',
      nacionalidade: aluno.nacionalidade || '',
      rua: aluno.rua || '',
      bairro: aluno.bairro || '',
      cep: aluno.cep || '',
      numero: aluno.numero || '',
      telefone: aluno.telefone || '',
      mae: aluno.mae || '',
      idcurso: aluno.idcurso,
      dias_aula: aluno.dias_aula || '',
      turno: aluno.turno || '',
      ensino_medio: aluno.ensino_medio || '',
      ano_conclusao: aluno.ano_conclusao || '',
      observacao: aluno.observacao || '',
      sistec: aluno.sistec || '',
      livro_ata: aluno.livro_ata || '',
      registro: aluno.registro || '',
      pagina: aluno.pagina || '',
      codigo: aluno.codigo || '',
      inicio_curso: aluno.inicio_curso || '',
      fim_curso: aluno.fim_curso || '',
      data_conclusao_curso: aluno.data_conclusao_curso || '',
      carga_horaria: aluno.carga_horaria || '',
      status: aluno.status || 'Ativo',
      data_gerada: aluno.data_gerada,
      usuario: aluno.usuario,
    });
    setActiveTab('pessoal');
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  const handleViewDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const data = await api.getAlunoById(id);
      setSelectedAlunoDetail(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (editingAluno) {
        await api.updateAluno(editingAluno.ID_aluno, formData);
        setSuccessMsg('Dados do aluno atualizados com sucesso!');
      } else {
        await api.createAluno(formData);
        setSuccessMsg('Novo aluno cadastrado com sucesso!');
      }
      setIsFormOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Deseja realmente excluir o aluno "${nome}"? A exclusão será bloqueada se houver histórico acadêmico ou financeiro.`)) {
      return;
    }
    setErrorMsg(null);
    try {
      await api.deleteAluno(id);
      setSuccessMsg('Aluno removido com sucesso!');
      loadData();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const getCursoNome = (idcurso: number | null) => {
    if (!idcurso) return 'Sem curso';
    const c = cursos.find((item) => item.ID_curso === idcurso);
    return c ? c.nome_curso : `Curso #${idcurso}`;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cadastro Geral de Alunos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento do prontuário acadêmico e dados cadastrais de alunos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/csv/alunos"
            download
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </a>
          <button
            onClick={handleOpenCreate}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Aluno</span>
          </button>
        </div>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filtro Curso */}
          <select
            value={filtroCurso}
            onChange={(e) => {
              setFiltroCurso(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">Todos os Cursos</option>
            {cursos.map((c) => (
              <option key={c.ID_curso} value={c.ID_curso}>
                {c.nome_curso}
              </option>
            ))}
          </select>

          {/* Filtro Status */}
          <select
            value={filtroStatus}
            onChange={(e) => {
              setFiltroStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">Todos os Status</option>
            <option value="Ativo">Ativo</option>
            <option value="Concluído">Concluído</option>
            <option value="Trancado">Trancado</option>
            <option value="Evadido">Evadido</option>
          </select>

          <span className="text-xs text-slate-500 font-mono ml-auto">
            {total} aluno(s)
          </span>
        </div>
      </div>

      {/* Tabela de Alunos */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">ID / Código</th>
                <th className="px-4 py-3">Aluno</th>
                <th className="px-4 py-3">CPF / Contato</th>
                <th className="px-4 py-3">Curso & Turno</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Carregando alunos...
                  </td>
                </tr>
              ) : alunos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Nenhum aluno encontrado para os critérios selecionados.
                  </td>
                </tr>
              ) : (
                alunos.map((a) => (
                  <tr key={a.ID_aluno} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      <div>#{a.ID_aluno}</div>
                      <div className="text-slate-400">{a.codigo || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{a.nome_aluno}</div>
                      <div className="text-[11px] text-slate-400">{a.email || 'Sem e-mail'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[11px]">{a.cpf || '-'}</div>
                      <div className="text-[11px] text-slate-500">{a.telefone || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{getCursoNome(a.idcurso)}</div>
                      <div className="text-[11px] text-slate-500">
                        {a.turno || '-'} · {a.dias_aula || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          a.status === 'Ativo'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : a.status === 'Concluído'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetail(a.ID_aluno)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                        title="Ver Ficha Completa do Aluno"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(a)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                        title="Editar Aluno"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(a.ID_aluno, a.nome_aluno)}
                        className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                        title="Excluir Aluno (com bloqueio se houver histórico)"
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

        {/* Paginação */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Página <span className="font-semibold">{page}</span> de <span className="font-semibold">{totalPages}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 border border-slate-300 rounded-md hover:bg-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-slate-300 rounded-md hover:bg-white disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Formulário Completo (Multi-Aba com Todos os Campos do Banco) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingAluno ? `Editar Aluno #${editingAluno.ID_aluno}` : 'Cadastrar Novo Aluno'}
                </h2>
                <p className="text-xs text-slate-500">Prontuário integral e dados cadastrais completos</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas do Formulário */}
            <div className="px-6 pt-3 border-b border-slate-200 flex gap-4 text-xs font-medium bg-white">
              <button
                type="button"
                onClick={() => setActiveTab('pessoal')}
                className={`pb-2.5 border-b-2 transition-colors ${
                  activeTab === 'pessoal'
                    ? 'border-indigo-600 text-indigo-700 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                1. Identificação & Filiação
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('endereco')}
                className={`pb-2.5 border-b-2 transition-colors ${
                  activeTab === 'endereco'
                    ? 'border-indigo-600 text-indigo-700 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                2. Contato & Endereço
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('academico')}
                className={`pb-2.5 border-b-2 transition-colors ${
                  activeTab === 'academico'
                    ? 'border-indigo-600 text-indigo-700 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                3. Acadêmico, SISTEC & Livro de Ata
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
                {activeTab === 'pessoal' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Nome Completo do Aluno *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nome_aluno}
                        onChange={(e) => setFormData({ ...formData, nome_aluno: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">CPF</label>
                      <input
                        type="text"
                        placeholder="000.000.000-00"
                        value={formData.cpf || ''}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">RG</label>
                      <input
                        type="text"
                        value={formData.rg || ''}
                        onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Órgão Emissor</label>
                      <input
                        type="text"
                        placeholder="SSP/SP"
                        value={formData.orgao_emissor || ''}
                        onChange={(e) => setFormData({ ...formData, orgao_emissor: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Data de Emissão do RG</label>
                      <input
                        type="date"
                        value={formData.data_emissao || ''}
                        onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Data de Nascimento</label>
                      <input
                        type="date"
                        value={formData.datanasc || ''}
                        onChange={(e) => setFormData({ ...formData, datanasc: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nacionalidade</label>
                      <input
                        type="text"
                        value={formData.nacionalidade || ''}
                        onChange={(e) => setFormData({ ...formData, nacionalidade: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Nome da Mãe</label>
                      <input
                        type="text"
                        value={formData.mae || ''}
                        onChange={(e) => setFormData({ ...formData, mae: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'endereco' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">E-mail</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                      <input
                        type="text"
                        placeholder="(00) 00000-0000"
                        value={formData.telefone || ''}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Logradouro / Rua</label>
                      <input
                        type="text"
                        value={formData.rua || ''}
                        onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Número</label>
                      <input
                        type="text"
                        value={formData.numero || ''}
                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Bairro</label>
                      <input
                        type="text"
                        value={formData.bairro || ''}
                        onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Cidade</label>
                      <input
                        type="text"
                        value={formData.cidade || ''}
                        onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">UF</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={formData.UF || ''}
                        onChange={(e) => setFormData({ ...formData, UF: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs uppercase"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">CEP</label>
                      <input
                        type="text"
                        placeholder="00000-000"
                        value={formData.cep || ''}
                        onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'academico' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Curso Vinculado</label>
                      <select
                        value={formData.idcurso || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, idcurso: e.target.value ? Number(e.target.value) : null })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      >
                        <option value="">Selecione um curso...</option>
                        {cursos.map((c) => (
                          <option key={c.ID_curso} value={c.ID_curso}>
                            {c.nome_curso}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Status Cadastral *</label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Trancado">Trancado</option>
                        <option value="Evadido">Evadido</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Turno</label>
                      <select
                        value={formData.turno || ''}
                        onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      >
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noite">Noite</option>
                        <option value="Sábado">Sábado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Dias de Aula</label>
                      <input
                        type="text"
                        placeholder="Ex: Seg a Sex, Sábados"
                        value={formData.dias_aula || ''}
                        onChange={(e) => setFormData({ ...formData, dias_aula: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Carga Horária</label>
                      <input
                        type="text"
                        placeholder="Ex: 1200h, 1600h"
                        value={formData.carga_horaria || ''}
                        onChange={(e) => setFormData({ ...formData, carga_horaria: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Início do Curso</label>
                      <input
                        type="text"
                        placeholder="DD/MM/AAAA"
                        value={formData.inicio_curso || ''}
                        onChange={(e) => setFormData({ ...formData, inicio_curso: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Previsão Fim Curso</label>
                      <input
                        type="text"
                        placeholder="DD/MM/AAAA"
                        value={formData.fim_curso || ''}
                        onChange={(e) => setFormData({ ...formData, fim_curso: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Data Conclusão</label>
                      <input
                        type="text"
                        placeholder="DD/MM/AAAA"
                        value={formData.data_conclusao_curso || ''}
                        onChange={(e) => setFormData({ ...formData, data_conclusao_curso: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    {/* Campos Legados Obrigatórios da Seção 3 */}
                    <div className="md:col-span-3 pt-3 border-t border-slate-200">
                      <div className="font-semibold text-slate-800 mb-2">
                        Dados de Registro Ministerial e Diplomas (Campos do Legado)
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-slate-600 mb-1">Código SISTEC</label>
                          <input
                            type="text"
                            placeholder="20250000000"
                            value={formData.sistec || ''}
                            onChange={(e) => setFormData({ ...formData, sistec: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 mb-1">Livro de Ata</label>
                          <input
                            type="text"
                            placeholder="Livro 14"
                            value={formData.livro_ata || ''}
                            onChange={(e) => setFormData({ ...formData, livro_ata: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 mb-1">Registro</label>
                          <input
                            type="text"
                            placeholder="REG-8800"
                            value={formData.registro || ''}
                            onChange={(e) => setFormData({ ...formData, registro: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 mb-1">Página / Folha</label>
                          <input
                            type="text"
                            placeholder="Folha 32"
                            value={formData.pagina || ''}
                            onChange={(e) => setFormData({ ...formData, pagina: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Observações Gerais</label>
                      <textarea
                        rows={2}
                        value={formData.observacao || ''}
                        onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                        placeholder="Anotações pedagógicas, estágios ou ocorrências..."
                      ></textarea>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <div className="flex gap-2">
                  {activeTab !== 'academico' ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab(activeTab === 'pessoal' ? 'endereco' : 'academico')}
                      className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
                    >
                      Próxima Aba &rarr;
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      Salvar Cadastro
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ficha Completa do Aluno (com Notas, Mensalidades, Responsáveis e Caixa vinculados) */}
      {selectedAlunoDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header da Ficha */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-base">
                  {selectedAlunoDetail.nome_aluno.charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-bold">{selectedAlunoDetail.nome_aluno}</h2>
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                    <span>ID #{selectedAlunoDetail.ID_aluno}</span>
                    <span>·</span>
                    <span>CPF: {selectedAlunoDetail.cpf || 'Não informado'}</span>
                    <span>·</span>
                    <span>Status: {selectedAlunoDetail.status}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlunoDetail(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo da Ficha */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Bloco 1: Dados do Curso e Matrícula */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-slate-500 font-medium">Curso Regular</div>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {selectedAlunoDetail.curso?.nome_curso || 'Nenhum'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Turno & Dias</div>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {selectedAlunoDetail.turno || '-'} ({selectedAlunoDetail.dias_aula || '-'})
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Período Letivo</div>
                  <div className="font-semibold text-slate-900 mt-0.5 font-mono">
                    {selectedAlunoDetail.inicio_curso || '-'} até {selectedAlunoDetail.fim_curso || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Carga Horária</div>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {selectedAlunoDetail.carga_horaria || '-'}
                  </div>
                </div>
              </div>

              {/* Bloco 2: Responsável Financeiro Vinculado */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Responsáveis Financeiros Vinculados</span>
                </h3>
                {selectedAlunoDetail.responsaveis?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedAlunoDetail.responsaveis.map((r: any) => (
                      <div key={r.ID_responsavel_financeiro} className="p-3 border border-slate-200 rounded-lg">
                        <div className="font-semibold text-slate-900">{r.nome}</div>
                        <div className="text-slate-500 font-mono mt-0.5">
                          CPF: {r.CPF} · RG: {r.RG}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Nenhum responsável financeiro cadastrado para este aluno.</p>
                )}
              </div>

              {/* Bloco 3: Notas e Avaliações */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Histórico de Notas Lançadas</span>
                </h3>
                {selectedAlunoDetail.notas?.length > 0 ? (
                  <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-600 font-semibold text-[10px] uppercase">
                      <tr>
                        <th className="px-3 py-2">Disciplina</th>
                        <th className="px-3 py-2">Nota 1</th>
                        <th className="px-3 py-2">Nota 2</th>
                        <th className="px-3 py-2">Média</th>
                        <th className="px-3 py-2">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedAlunoDetail.notas.map((n: any) => (
                        <tr key={n.ID_nota}>
                          <td className="px-3 py-2 font-medium">{n.materia}</td>
                          <td className="px-3 py-2 font-mono">{n.nota1 || '-'}</td>
                          <td className="px-3 py-2 font-mono">{n.nota2 || '-'}</td>
                          <td className="px-3 py-2 font-mono font-bold text-indigo-700">{n.media || '-'}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                n.situacao === 'Aprovado'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : n.situacao === 'Exame'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {n.situacao || 'Pendente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-slate-400 italic">Nenhuma nota lançada para este aluno até o momento.</p>
                )}
              </div>

              {/* Bloco 4: Planos de Mensalidade */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Planos Financeiros e Mensalidades</span>
                </h3>
                {selectedAlunoDetail.mensalidades?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAlunoDetail.mensalidades.map((m: any) => (
                      <div
                        key={m.ID_mensalidade}
                        className="p-3 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            Plano #{m.ID_mensalidade} · {m.curso}
                          </div>
                          <div className="text-slate-500 font-mono mt-0.5">
                            Parcelas: {m.parcelas_pagas || '0'} de {m.n_parcelas} pagas · Parcela: R${' '}
                            {m.valor_parcela?.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 uppercase">Saldo Devedor</div>
                          <div className="font-mono font-bold text-rose-600 text-sm">
                            R$ {m.saldo_devedor?.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Nenhum contrato de mensalidade registrado.</p>
                )}
              </div>
            </div>

            {/* Footer da Ficha */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedAlunoDetail(null)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
