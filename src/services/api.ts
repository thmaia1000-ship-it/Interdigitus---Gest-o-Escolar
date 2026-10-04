/**
 * Interdigitus - Cliente de API Frontend
 */

import { AuthUser, DatabaseStatus } from '../types/schema.js';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('interdigitus_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido na requisição' }));
    if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/portal-login')) {
      localStorage.removeItem('interdigitus_token');
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    throw new Error(errorData.error || `Erro ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Autenticação
  loginInternal: (username: string, password: string) =>
    request<{ user: AuthUser; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  loginStudent: (cpf: string, password: string) =>
    request<{ user: AuthUser; token: string }>('/auth/portal-login', {
      method: 'POST',
      body: JSON.stringify({ cpf, password }),
    }),

  logout: () =>
    request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () => request<{ user: AuthUser }>('/auth/me'),

  getStatus: () => request<DatabaseStatus>('/status'),

  importSql: (sqlContent: string, replaceExisting: boolean = true) =>
    request<{ success: boolean; message: string; importedCount: number; tablesSummary: Record<string, number> }>(
      '/database/import-sql',
      {
        method: 'POST',
        body: JSON.stringify({ sqlContent, replaceExisting }),
      }
    ),

  getDashboardStats: () => request<any>('/dashboard/stats'),

  // Alunos
  getAlunos: (params: { search?: string; idcurso?: number; status?: string; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.idcurso) q.append('idcurso', String(params.idcurso));
    if (params.status) q.append('status', params.status);
    if (params.page) q.append('page', String(params.page));
    if (params.limit) q.append('limit', String(params.limit));
    return request<any>(`/alunos?${q.toString()}`);
  },

  getAlunoById: (id: number) => request<any>(`/alunos/${id}`),

  createAluno: (data: any) =>
    request<any>('/alunos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAluno: (id: number, data: any) =>
    request<any>(`/alunos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteAluno: (id: number) =>
    request<any>(`/alunos/${id}`, {
      method: 'DELETE',
    }),

  // Responsáveis
  getResponsaveis: (params: { search?: string; idaluno?: number; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.idaluno) q.append('idaluno', String(params.idaluno));
    if (params.page) q.append('page', String(params.page));
    if (params.limit) q.append('limit', String(params.limit));
    return request<any>(`/responsaveis?${q.toString()}`);
  },

  createResponsavel: (data: any) =>
    request<any>('/responsaveis', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateResponsavel: (id: number, data: any) =>
    request<any>(`/responsaveis/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteResponsavel: (id: number) =>
    request<any>(`/responsaveis/${id}`, {
      method: 'DELETE',
    }),

  // Cursos
  getCursos: () => request<any[]>('/cursos'),

  createCurso: (nome_curso: string) =>
    request<any>('/cursos', {
      method: 'POST',
      body: JSON.stringify({ nome_curso }),
    }),

  updateCurso: (id: number, nome_curso: string) =>
    request<any>(`/cursos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nome_curso }),
    }),

  deleteCurso: (id: number) =>
    request<any>(`/cursos/${id}`, {
      method: 'DELETE',
    }),

  // Cursos Livres (tb_cursoLivre)
  getCursosLivres: (search?: string) =>
    request<any[]>(`/cursos-livres${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  createCursoLivre: (data: any) =>
    request<any>('/cursos-livres', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCursoLivre: (id: number, data: any) =>
    request<any>(`/cursos-livres/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCursoLivre: (id: number) =>
    request<any>(`/cursos-livres/${id}`, {
      method: 'DELETE',
    }),

  // Matérias
  getMaterias: (params: { idcurso?: number; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.idcurso) q.append('idcurso', String(params.idcurso));
    if (params.search) q.append('search', params.search);
    return request<any[]>(`/materias?${q.toString()}`);
  },

  createMateria: (data: any) =>
    request<any>('/materias', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMateria: (id: number, data: any) =>
    request<any>(`/materias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteMateria: (id: number) =>
    request<any>(`/materias/${id}`, {
      method: 'DELETE',
    }),

  // Turmas
  getTurmas: (params: { idcurso?: number; turno?: string; status?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.idcurso) q.append('idcurso', String(params.idcurso));
    if (params.turno) q.append('turno', params.turno);
    if (params.status) q.append('status', params.status);
    return request<any[]>(`/turmas?${q.toString()}`);
  },

  createTurma: (data: any) =>
    request<any>('/turmas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTurma: (id: number, data: any) =>
    request<any>(`/turmas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTurma: (id: number) =>
    request<any>(`/turmas/${id}`, {
      method: 'DELETE',
    }),

  // Notas
  getNotas: (params: { idaluno?: number; idcurso?: number; idmateria?: number; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.idaluno) q.append('idaluno', String(params.idaluno));
    if (params.idcurso) q.append('idcurso', String(params.idcurso));
    if (params.idmateria) q.append('idmateria', String(params.idmateria));
    if (params.search) q.append('search', params.search);
    return request<any[]>(`/notas?${q.toString()}`);
  },

  createNota: (data: any) =>
    request<any>('/notas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateNota: (id: number, data: any) =>
    request<any>(`/notas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteNota: (id: number) =>
    request<any>(`/notas/${id}`, {
      method: 'DELETE',
    }),

  // Mensalidades
  getMensalidades: (params: { idaluno?: number; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.idaluno) q.append('idaluno', String(params.idaluno));
    if (params.search) q.append('search', params.search);
    return request<any[]>(`/mensalidades?${q.toString()}`);
  },

  createMensalidade: (data: any) =>
    request<any>('/mensalidades', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  registrarPagamentoMensalidade: (payload: {
    idmensalidade: number;
    valor_pago: number;
    forma_pagamento: string;
    gerar_caixa: boolean;
    observacao?: string;
  }) =>
    request<any>('/mensalidades/pagamento', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Caixa
  getCaixa: (params: {
    tipo?: string;
    forma?: string;
    data_inicio?: string;
    data_fim?: string;
    usuario?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const q = new URLSearchParams();
    if (params.tipo) q.append('tipo', params.tipo);
    if (params.forma) q.append('forma', params.forma);
    if (params.data_inicio) q.append('data_inicio', params.data_inicio);
    if (params.data_fim) q.append('data_fim', params.data_fim);
    if (params.usuario) q.append('usuario', params.usuario);
    if (params.search) q.append('search', params.search);
    if (params.page) q.append('page', String(params.page));
    if (params.limit) q.append('limit', String(params.limit));
    return request<any>(`/caixa?${q.toString()}`);
  },

  createCaixa: (data: any) =>
    request<any>('/caixa', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Auditoria Caixa (log_caixa)
  getAuditoriaCaixa: (params: {
    data_inicio?: string;
    data_fim?: string;
    usuario?: string;
    tipo?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const q = new URLSearchParams();
    if (params.data_inicio) q.append('data_inicio', params.data_inicio);
    if (params.data_fim) q.append('data_fim', params.data_fim);
    if (params.usuario) q.append('usuario', params.usuario);
    if (params.tipo) q.append('tipo', params.tipo);
    if (params.search) q.append('search', params.search);
    if (params.page) q.append('page', String(params.page));
    if (params.limit) q.append('limit', String(params.limit));
    return request<any>(`/auditoria-caixa?${q.toString()}`);
  },

  // Despesas
  getDespesas: (params: { tipo?: string; data_inicio?: string; data_fim?: string; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.tipo) q.append('tipo', params.tipo);
    if (params.data_inicio) q.append('data_inicio', params.data_inicio);
    if (params.data_fim) q.append('data_fim', params.data_fim);
    if (params.search) q.append('search', params.search);
    return request<any[]>(`/despesas?${q.toString()}`);
  },

  createDespesa: (data: any) =>
    request<any>('/despesas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteDespesa: (id: number) =>
    request<any>(`/despesas/${id}`, {
      method: 'DELETE',
    }),

  // Professores
  getProfessores: (search?: string) =>
    request<any[]>(`/professores${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  createProfessor: (data: any) =>
    request<any>('/professores', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProfessor: (id: number, data: any) =>
    request<any>(`/professores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProfessor: (id: number) =>
    request<any>(`/professores/${id}`, {
      method: 'DELETE',
    }),

  // Pagamentos a Professores
  getPagamentosProfessores: (params: { idprofessor?: number; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.idprofessor) q.append('idprofessor', String(params.idprofessor));
    if (params.search) q.append('search', params.search);
    return request<any[]>(`/pagamentos-professores?${q.toString()}`);
  },

  createPagamentoProfessor: (data: any) =>
    request<any>('/pagamentos-professores', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Pagamentos Parciais
  getPagamentosParciais: (params: { idpagamento?: number; idprofessor?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.idpagamento) q.append('idpagamento', String(params.idpagamento));
    if (params.idprofessor) q.append('idprofessor', String(params.idprofessor));
    return request<any[]>(`/pagamentos-parciais?${q.toString()}`);
  },

  createPagamentoParcial: (data: any) =>
    request<any>('/pagamentos-parciais', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Produtos
  getProdutos: (search?: string) =>
    request<any[]>(`/produtos${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  createProduto: (data: any) =>
    request<any>('/produtos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduto: (id: number, data: any) =>
    request<any>(`/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduto: (id: number) =>
    request<any>(`/produtos/${id}`, {
      method: 'DELETE',
    }),

  // Vendas
  getVendas: (params: { codigovenda?: number; data_inicio?: string; data_fim?: string; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.codigovenda) q.append('codigovenda', String(params.codigovenda));
    if (params.data_inicio) q.append('data_inicio', params.data_inicio);
    if (params.data_fim) q.append('data_fim', params.data_fim);
    if (params.search) q.append('search', params.search);
    return request<any[]>(`/vendas?${q.toString()}`);
  },

  createVenda: (data: any) =>
    request<any>('/vendas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Usuários
  getUsuarios: (search?: string) =>
    request<any[]>(`/usuarios${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  // Busca Global
  searchGlobal: (q: string) =>
    request<{
      alunos: Array<{ id: number; titulo: string; subtitulo: string; categoria: string; rota: string }>;
      usuarios: Array<{ id: number; titulo: string; subtitulo: string; categoria: string; rota: string }>;
      financeiro: Array<{ id: number; titulo: string; subtitulo: string; categoria: string; rota: string }>;
    }>(`/search?q=${encodeURIComponent(q)}`),

  createUsuario: (data: any) =>
    request<any>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUsuario: (id: number, data: any) =>
    request<any>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteUsuario: (id: number) =>
    request<any>(`/usuarios/${id}`, {
      method: 'DELETE',
    }),

  // Contas de Alunos
  getContasAlunos: () => request<any[]>('/contas-alunos'),

  createContaAluno: (data: any) =>
    request<any>('/contas-alunos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetSenhaContaAluno: (id: number, nova_senha: string) =>
    request<any>(`/contas-alunos/${id}/reset-senha`, {
      method: 'POST',
      body: JSON.stringify({ nova_senha }),
    }),

  deleteContaAluno: (id: number) =>
    request<any>(`/contas-alunos/${id}`, {
      method: 'DELETE',
    }),

  // Portal do Aluno
  getPortalAlunoDados: () => request<any>('/portal-aluno/meus-dados'),
};
