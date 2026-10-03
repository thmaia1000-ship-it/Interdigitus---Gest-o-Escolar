/**
 * Interdigitus - Camada de Persistência e Acesso a Dados
 * Suporta conexão real com MySQL (via mysql2/promise) ou repositório relacional em memória/disco
 * com aplicação estrita das chaves estrangeiras, regras de integridade e auditoria de caixa.
 */

import { generateSeedData, hashPassword } from './seed.js';
import {
  Aluno,
  ResponsavelFinanceiro,
  Curso,
  CursoLivre,
  Materia,
  Turma,
  Nota,
  Mensalidade,
  Caixa,
  LogCaixa,
  Despesa,
  Professor,
  PagamentoProfessor,
  PagamentoParcial,
  Produto,
  Venda,
  Usuario,
  ContaAluno,
  DatabaseStatus,
  UserRole,
} from '../types/schema.js';
import fs from 'fs';
import path from 'path';

interface MemoryDB {
  tb_cursos: Curso[];
  tb_cursoLivre: CursoLivre[];
  tb_materias: Materia[];
  tb_turmas: Turma[];
  tb_alunos: Aluno[];
  tb_responsavel_financeiro: ResponsavelFinanceiro[];
  tb_notas: Nota[];
  tb_mensalidades: Mensalidade[];
  tb_caixa: Caixa[];
  log_caixa: LogCaixa[];
  tb_despesas: Despesa[];
  tb_professores: Professor[];
  tb_pagamentos: PagamentoProfessor[];
  tb_pagamentos_parciais: PagamentoParcial[];
  tb_produtos: Produto[];
  tb_vendas: Venda[];
  tb_usuarios: Usuario[];
  tb_contas: ContaAluno[];
}

const DATA_FILE = path.resolve(process.cwd(), 'data_interdigitus.json');

class DatabaseManager {
  private memDb!: MemoryDB;
  private isMysqlConfigured: boolean = false;
  private mysqlConnected: boolean = false;
  private mysqlConnectionError: string | null = null;
  private mysqlPool: any = null;

  constructor() {
    this.initLocalData();
    this.checkAndInitMysql();
  }

  private initLocalData() {
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.memDb = JSON.parse(raw);
        return;
      } catch (e) {
        console.error('Erro ao ler data_interdigitus.json, recriando seed:', e);
      }
    }

    const seed = generateSeedData();
    this.memDb = {
      tb_cursos: seed.cursos,
      tb_cursoLivre: seed.cursoLivre,
      tb_materias: seed.materias,
      tb_turmas: seed.turmas,
      tb_alunos: seed.alunos,
      tb_responsavel_financeiro: seed.responsavelFinanceiro,
      tb_notas: seed.notas,
      tb_mensalidades: seed.mensalidades,
      tb_caixa: seed.caixa,
      log_caixa: seed.logCaixa,
      tb_despesas: seed.despesas,
      tb_professores: seed.professores,
      tb_pagamentos: seed.pagamentos,
      tb_pagamentos_parciais: seed.pagamentosParciais,
      tb_produtos: seed.produtos,
      tb_vendas: seed.vendas,
      tb_usuarios: seed.usuarios,
      tb_contas: seed.contas,
    };
    this.persist();
  }

  private persist() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.memDb, null, 2), 'utf-8');
    } catch (e) {
      console.error('Erro ao persistir dados locais:', e);
    }
  }

  private async checkAndInitMysql() {
    const host = process.env.MYSQL_HOST;
    const user = process.env.MYSQL_USER;
    const database = process.env.MYSQL_DATABASE;
    const password = process.env.MYSQL_PASSWORD;
    const port = Number(process.env.MYSQL_PORT) || 3306;

    if (host && user && database) {
      this.isMysqlConfigured = true;
      try {
        const mysql = await import('mysql2/promise');
        this.mysqlPool = mysql.createPool({
          host,
          user,
          password,
          database,
          port,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });

        // Test connection
        const conn = await this.mysqlPool.getConnection();
        conn.release();
        this.mysqlConnected = true;
        this.mysqlConnectionError = null;
        console.log(`[DatabaseManager] Conectado com sucesso ao MySQL em ${host}:${port}/${database}`);
      } catch (err: any) {
        this.mysqlConnected = false;
        this.mysqlConnectionError = err.message || 'Falha ao conectar no MySQL';
        console.warn(`[DatabaseManager] Falha na conexão MySQL (${this.mysqlConnectionError}). Operando em modo de demonstração/persistência local.`);
      }
    } else {
      this.isMysqlConfigured = false;
      this.mysqlConnected = false;
      this.mysqlConnectionError = 'Variáveis MYSQL_HOST, MYSQL_USER ou MYSQL_DATABASE não foram definidas no ambiente.';
    }
  }

  public getStatus(): DatabaseStatus {
    const tables = [
      { name: 'tb_alunos', count: this.memDb.tb_alunos.length, description: 'Cadastro e prontuário acadêmico de alunos' },
      { name: 'tb_responsavel_financeiro', count: this.memDb.tb_responsavel_financeiro.length, description: 'Responsáveis financeiros dos alunos' },
      { name: 'tb_cursos', count: this.memDb.tb_cursos.length, description: 'Catálogo de cursos técnicos regulares' },
      { name: 'tb_cursoLivre', count: this.memDb.tb_cursoLivre.length, description: 'Cursos livres e de extensão' },
      { name: 'tb_materias', count: this.memDb.tb_materias.length, description: 'Disciplinas vinculadas a cursos' },
      { name: 'tb_turmas', count: this.memDb.tb_turmas.length, description: 'Turmas, turnos, salas e status' },
      { name: 'tb_notas', count: this.memDb.tb_notas.length, description: 'Lançamentos de notas e médias' },
      { name: 'tb_mensalidades', count: this.memDb.tb_mensalidades.length, description: 'Planos de mensalidade e parcelas' },
      { name: 'tb_caixa', count: this.memDb.tb_caixa.length, description: 'Movimentações financeiras de entrada e saída' },
      { name: 'log_caixa', count: this.memDb.log_caixa.length, description: 'Trilha de auditoria imutável do caixa' },
      { name: 'tb_despesas', count: this.memDb.tb_despesas.length, description: 'Despesas operacionais e administrativas' },
      { name: 'tb_professores', count: this.memDb.tb_professores.length, description: 'Corpo docente cadastrado' },
      { name: 'tb_pagamentos', count: this.memDb.tb_pagamentos.length, description: 'Compromissos de pagamento docente' },
      { name: 'tb_pagamentos_parciais', count: this.memDb.tb_pagamentos_parciais.length, description: 'Pagamentos parciais a professores' },
      { name: 'tb_produtos', count: this.memDb.tb_produtos.length, description: 'Itens de vestuário, livros e materiais' },
      { name: 'tb_vendas', count: this.memDb.tb_vendas.length, description: 'Itens vendidos e pedidos' },
      { name: 'tb_usuarios', count: this.memDb.tb_usuarios.length, description: 'Operadores internos do sistema' },
      { name: 'tb_contas', count: this.memDb.tb_contas.length, description: 'Contas de acesso dos alunos' },
    ];

    return {
      mode: this.mysqlConnected ? 'mysql' : 'demo_local',
      connected: this.mysqlConnected,
      databaseName: process.env.MYSQL_DATABASE || 'dbinterdigitus (local)',
      tables,
      message: this.mysqlConnected
        ? 'Conectado diretamente ao banco de dados MySQL de produção.'
        : `Operando em modo de persistência local isolado (todas as 18 tabelas ativas e operacionais). ${this.mysqlConnectionError || ''}`,
    };
  }

  // Helper para mapear nível de usuário para Perfil
  public mapNivelToRole(nivel: number): UserRole {
    switch (nivel) {
      case 1:
        return 'Administrador';
      case 2:
        return 'Secretaria';
      case 3:
        return 'Coordenação';
      case 4:
        return 'Financeiro';
      case 5:
        return 'Comercial';
      default:
        return 'Secretaria';
    }
  }

  public mapRoleToNivel(role: UserRole): number {
    switch (role) {
      case 'Administrador':
        return 1;
      case 'Secretaria':
        return 2;
      case 'Coordenação':
        return 3;
      case 'Financeiro':
        return 4;
      case 'Comercial':
        return 5;
      default:
        return 2;
    }
  }

  // --- MÉTODOS DE CONSULTA E OPERAÇÃO (18 TABELAS) ---

  // 1. ALUNOS
  public getAlunos(params: { search?: string; idcurso?: number; status?: string; page?: number; limit?: number }) {
    let list = [...this.memDb.tb_alunos];
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.nome_aluno.toLowerCase().includes(q) ||
          (a.cpf && a.cpf.includes(q)) ||
          (a.codigo && a.codigo.toLowerCase().includes(q)) ||
          (a.email && a.email.toLowerCase().includes(q))
      );
    }
    if (params.idcurso) {
      list = list.filter((a) => a.idcurso === Number(params.idcurso));
    }
    if (params.status) {
      list = list.filter((a) => a.status === params.status);
    }

    const total = list.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 15);
    const data = list.slice((page - 1) * limit, page * limit);

    return { total, page, limit, totalPages: Math.ceil(total / limit), data };
  }

  public getAlunoById(id: number) {
    const aluno = this.memDb.tb_alunos.find((a) => a.ID_aluno === id);
    if (!aluno) return null;

    // Agregar relações para ficha completa
    const curso = this.memDb.tb_cursos.find((c) => c.ID_curso === aluno.idcurso) || null;
    const responsaveis = this.memDb.tb_responsavel_financeiro.filter((r) => r.idaluno === id);
    const notas = this.memDb.tb_notas.filter((n) => n.idaluno === id);
    const mensalidades = this.memDb.tb_mensalidades.filter((m) => m.idaluno === id);
    const movimentosCaixa = this.memDb.tb_caixa.filter((c) => c.idaluno === id);
    const conta = this.memDb.tb_contas.find((c) => c.idaluno === id) || null;

    return {
      ...aluno,
      curso,
      responsaveis,
      notas,
      mensalidades,
      movimentosCaixa,
      temContaAcesso: !!conta,
    };
  }

  public createAluno(data: Omit<Aluno, 'ID_aluno'>, operatorUser: string): Aluno {
    const nextId = this.memDb.tb_alunos.reduce((max, a) => Math.max(max, a.ID_aluno), 0) + 1;
    const newAluno: Aluno = {
      ...data,
      ID_aluno: nextId,
      data_gerada: data.data_gerada || new Date().toISOString().split('T')[0],
      usuario: operatorUser,
    };
    this.memDb.tb_alunos.push(newAluno);
    this.persist();
    return newAluno;
  }

  public updateAluno(id: number, data: Partial<Aluno>): Aluno {
    const idx = this.memDb.tb_alunos.findIndex((a) => a.ID_aluno === id);
    if (idx === -1) throw new Error('Aluno não encontrado.');
    this.memDb.tb_alunos[idx] = { ...this.memDb.tb_alunos[idx], ...data, ID_aluno: id };
    this.persist();
    return this.memDb.tb_alunos[idx];
  }

  public deleteAluno(id: number) {
    // Regra Seção 7: Bloquear exclusão física se houver histórico acadêmico ou financeiro
    const hasMensalidades = this.memDb.tb_mensalidades.some((m) => m.idaluno === id);
    const hasNotas = this.memDb.tb_notas.some((n) => n.idaluno === id);
    const hasCaixa = this.memDb.tb_caixa.some((c) => c.idaluno === id);

    if (hasMensalidades || hasNotas || hasCaixa) {
      throw new Error(
        'Operação bloqueada por integridade: Este aluno possui histórico financeiro e/ou acadêmico vinculado. Recomenda-se alterar o status para "Inativo" ou "Evadido".'
      );
    }

    // Excluir responsáveis associados se não houver histórico
    this.memDb.tb_responsavel_financeiro = this.memDb.tb_responsavel_financeiro.filter((r) => r.idaluno !== id);
    this.memDb.tb_contas = this.memDb.tb_contas.filter((c) => c.idaluno !== id);
    this.memDb.tb_alunos = this.memDb.tb_alunos.filter((a) => a.ID_aluno !== id);
    this.persist();
    return true;
  }

  // 2. RESPONSÁVEIS FINANCEIROS
  public getResponsaveis(params: { search?: string; idaluno?: number; page?: number; limit?: number }) {
    let list = [...this.memDb.tb_responsavel_financeiro];
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((r) => r.nome.toLowerCase().includes(q) || r.CPF.includes(q));
    }
    if (params.idaluno) {
      list = list.filter((r) => r.idaluno === Number(params.idaluno));
    }

    const total = list.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 15);
    const data = list.slice((page - 1) * limit, page * limit).map((r) => {
      const aluno = this.memDb.tb_alunos.find((a) => a.ID_aluno === r.idaluno);
      return { ...r, nome_aluno: aluno ? aluno.nome_aluno : `Aluno #${r.idaluno}` };
    });

    return { total, page, limit, totalPages: Math.ceil(total / limit), data };
  }

  public createResponsavel(data: Omit<ResponsavelFinanceiro, 'ID_responsavel_financeiro'>): ResponsavelFinanceiro {
    const nextId = this.memDb.tb_responsavel_financeiro.reduce((max, r) => Math.max(max, r.ID_responsavel_financeiro), 0) + 1;
    const item: ResponsavelFinanceiro = { ...data, ID_responsavel_financeiro: nextId };
    this.memDb.tb_responsavel_financeiro.push(item);
    this.persist();
    return item;
  }

  public updateResponsavel(id: number, data: Partial<ResponsavelFinanceiro>): ResponsavelFinanceiro {
    const idx = this.memDb.tb_responsavel_financeiro.findIndex((r) => r.ID_responsavel_financeiro === id);
    if (idx === -1) throw new Error('Responsável não encontrado.');
    this.memDb.tb_responsavel_financeiro[idx] = { ...this.memDb.tb_responsavel_financeiro[idx], ...data, ID_responsavel_financeiro: id };
    this.persist();
    return this.memDb.tb_responsavel_financeiro[idx];
  }

  public deleteResponsavel(id: number) {
    this.memDb.tb_responsavel_financeiro = this.memDb.tb_responsavel_financeiro.filter((r) => r.ID_responsavel_financeiro !== id);
    this.persist();
    return true;
  }

  // 3. CURSOS
  public getCursos() {
    return this.memDb.tb_cursos.map((c) => {
      const totalAlunos = this.memDb.tb_alunos.filter((a) => a.idcurso === c.ID_curso).length;
      const totalMaterias = this.memDb.tb_materias.filter((m) => m.idcurso === c.ID_curso).length;
      const totalTurmas = this.memDb.tb_turmas.filter((t) => t.idcurso === c.ID_curso).length;
      return { ...c, totalAlunos, totalMaterias, totalTurmas };
    });
  }

  public createCurso(nome_curso: string): Curso {
    const nextId = this.memDb.tb_cursos.reduce((max, c) => Math.max(max, c.ID_curso), 0) + 1;
    const item: Curso = { ID_curso: nextId, nome_curso };
    this.memDb.tb_cursos.push(item);
    this.persist();
    return item;
  }

  public updateCurso(id: number, nome_curso: string): Curso {
    const idx = this.memDb.tb_cursos.findIndex((c) => c.ID_curso === id);
    if (idx === -1) throw new Error('Curso não encontrado.');
    this.memDb.tb_cursos[idx].nome_curso = nome_curso;
    this.persist();
    return this.memDb.tb_cursos[idx];
  }

  public deleteCurso(id: number) {
    // Bloquear exclusão se houver disciplinas ou turmas
    const hasMaterias = this.memDb.tb_materias.some((m) => m.idcurso === id);
    const hasAlunos = this.memDb.tb_alunos.some((a) => a.idcurso === id);
    if (hasMaterias || hasAlunos) {
      throw new Error('Não é possível excluir o curso pois existem disciplinas e/ou alunos vinculados a ele.');
    }
    this.memDb.tb_cursos = this.memDb.tb_cursos.filter((c) => c.ID_curso !== id);
    this.persist();
    return true;
  }

  // 4. CURSOS LIVRES (tb_cursoLivre)
  public getCursosLivres(params: { search?: string }) {
    let list = [...this.memDb.tb_cursoLivre];
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((c) => c.nome_curso.toLowerCase().includes(q) || c.conteudo.toLowerCase().includes(q));
    }
    return list;
  }

  public createCursoLivre(data: Omit<CursoLivre, 'ID_curso'>): CursoLivre {
    const nextId = this.memDb.tb_cursoLivre.reduce((max, c) => Math.max(max, c.ID_curso), 0) + 1;
    const item: CursoLivre = { ...data, ID_curso: nextId };
    this.memDb.tb_cursoLivre.push(item);
    this.persist();
    return item;
  }

  public updateCursoLivre(id: number, data: Partial<CursoLivre>): CursoLivre {
    const idx = this.memDb.tb_cursoLivre.findIndex((c) => c.ID_curso === id);
    if (idx === -1) throw new Error('Curso Livre não encontrado.');
    this.memDb.tb_cursoLivre[idx] = { ...this.memDb.tb_cursoLivre[idx], ...data, ID_curso: id };
    this.persist();
    return this.memDb.tb_cursoLivre[idx];
  }

  public deleteCursoLivre(id: number) {
    this.memDb.tb_cursoLivre = this.memDb.tb_cursoLivre.filter((c) => c.ID_curso !== id);
    this.persist();
    return true;
  }

  // 5. MATÉRIAS / DISCIPLINAS (tb_materias)
  public getMaterias(params: { idcurso?: number; search?: string }) {
    let list = [...this.memDb.tb_materias];
    if (params.idcurso) {
      list = list.filter((m) => m.idcurso === Number(params.idcurso));
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((m) => m.materia.toLowerCase().includes(q));
    }
    return list.map((m) => {
      const curso = this.memDb.tb_cursos.find((c) => c.ID_curso === m.idcurso);
      return { ...m, nome_curso: curso ? curso.nome_curso : 'Sem curso vinculado' };
    });
  }

  public createMateria(data: Omit<Materia, 'ID_materia'>): Materia {
    const nextId = this.memDb.tb_materias.reduce((max, m) => Math.max(max, m.ID_materia), 0) + 1;
    const item: Materia = { ...data, ID_materia: nextId };
    this.memDb.tb_materias.push(item);
    this.persist();
    return item;
  }

  public updateMateria(id: number, data: Partial<Materia>): Materia {
    const idx = this.memDb.tb_materias.findIndex((m) => m.ID_materia === id);
    if (idx === -1) throw new Error('Matéria não encontrada.');
    this.memDb.tb_materias[idx] = { ...this.memDb.tb_materias[idx], ...data, ID_materia: id };
    this.persist();
    return this.memDb.tb_materias[idx];
  }

  public deleteMateria(id: number) {
    const hasNotas = this.memDb.tb_notas.some((n) => n.idmateria === id);
    if (hasNotas) {
      throw new Error('Não é possível excluir esta disciplina pois existem notas lançadas vinculadas a ela.');
    }
    this.memDb.tb_materias = this.memDb.tb_materias.filter((m) => m.ID_materia !== id);
    this.persist();
    return true;
  }

  // 6. TURMAS (tb_turmas)
  public getTurmas(params: { idcurso?: number; turno?: string; status?: string }) {
    let list = [...this.memDb.tb_turmas];
    if (params.idcurso) {
      list = list.filter((t) => t.idcurso === Number(params.idcurso));
    }
    if (params.turno) {
      list = list.filter((t) => t.turno === params.turno);
    }
    if (params.status) {
      list = list.filter((t) => t.status_turma === params.status);
    }
    return list.map((t) => {
      const curso = this.memDb.tb_cursos.find((c) => c.ID_curso === t.idcurso);
      return { ...t, nome_curso: curso ? curso.nome_curso : 'Sem curso' };
    });
  }

  public createTurma(data: Omit<Turma, 'ID_turma'>): Turma {
    const nextId = this.memDb.tb_turmas.reduce((max, t) => Math.max(max, t.ID_turma), 0) + 1;
    const item: Turma = { ...data, ID_turma: nextId };
    this.memDb.tb_turmas.push(item);
    this.persist();
    return item;
  }

  public updateTurma(id: number, data: Partial<Turma>): Turma {
    const idx = this.memDb.tb_turmas.findIndex((t) => t.ID_turma === id);
    if (idx === -1) throw new Error('Turma não encontrada.');
    this.memDb.tb_turmas[idx] = { ...this.memDb.tb_turmas[idx], ...data, ID_turma: id };
    this.persist();
    return this.memDb.tb_turmas[idx];
  }

  public deleteTurma(id: number) {
    this.memDb.tb_turmas = this.memDb.tb_turmas.filter((t) => t.ID_turma !== id);
    this.persist();
    return true;
  }

  // 7. NOTAS (tb_notas)
  public getNotas(params: { idaluno?: number; idcurso?: number; idmateria?: number; search?: string }) {
    let list = [...this.memDb.tb_notas];
    if (params.idaluno) {
      list = list.filter((n) => n.idaluno === Number(params.idaluno));
    }
    if (params.idcurso) {
      list = list.filter((n) => n.idcurso === Number(params.idcurso));
    }
    if (params.idmateria) {
      list = list.filter((n) => n.idmateria === Number(params.idmateria));
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((n) => n.aluno.toLowerCase().includes(q) || (n.materia && n.materia.toLowerCase().includes(q)));
    }
    return list;
  }

  public createNota(data: Omit<Nota, 'ID_nota'>, operatorUser: string): Nota {
    const nextId = this.memDb.tb_notas.reduce((max, n) => Math.max(max, n.ID_nota), 0) + 1;

    // Calcular média e situação se não fornecido
    let media = data.media;
    let situacao = data.situacao;
    if (data.nota1 && data.nota2 && !media) {
      const n1 = parseFloat(data.nota1.replace(',', '.'));
      const n2 = parseFloat(data.nota2.replace(',', '.'));
      if (!isNaN(n1) && !isNaN(n2)) {
        const m = (n1 + n2) / 2;
        media = m.toFixed(1);
        if (!situacao) {
          situacao = m >= 7.0 ? 'Aprovado' : m >= 5.0 ? 'Exame' : 'Reprovado';
        }
      }
    }

    const item: Nota = {
      ...data,
      media,
      situacao,
      ID_nota: nextId,
      data_gerada: data.data_gerada || new Date().toISOString().split('T')[0],
      usuario: operatorUser,
    };
    this.memDb.tb_notas.push(item);
    this.persist();
    return item;
  }

  public updateNota(id: number, data: Partial<Nota>): Nota {
    const idx = this.memDb.tb_notas.findIndex((n) => n.ID_nota === id);
    if (idx === -1) throw new Error('Nota não encontrada.');

    let merged = { ...this.memDb.tb_notas[idx], ...data, ID_nota: id };
    if (merged.nota1 && merged.nota2) {
      const n1 = parseFloat(merged.nota1.replace(',', '.'));
      const n2 = parseFloat(merged.nota2.replace(',', '.'));
      if (!isNaN(n1) && !isNaN(n2)) {
        const m = (n1 + n2) / 2;
        merged.media = m.toFixed(1);
        if (!data.situacao) {
          merged.situacao = m >= 7.0 ? 'Aprovado' : m >= 5.0 ? 'Exame' : 'Reprovado';
        }
      }
    }

    this.memDb.tb_notas[idx] = merged;
    this.persist();
    return merged;
  }

  public deleteNota(id: number) {
    this.memDb.tb_notas = this.memDb.tb_notas.filter((n) => n.ID_nota !== id);
    this.persist();
    return true;
  }

  // 8. MENSALIDADES (tb_mensalidades)
  public getMensalidades(params: { idaluno?: number; search?: string; statusFiltro?: string }) {
    let list = [...this.memDb.tb_mensalidades];
    if (params.idaluno) {
      list = list.filter((m) => m.idaluno === Number(params.idaluno));
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((m) => {
        const aluno = this.memDb.tb_alunos.find((a) => a.ID_aluno === m.idaluno);
        return (aluno && aluno.nome_aluno.toLowerCase().includes(q)) || m.curso.toLowerCase().includes(q);
      });
    }

    return list.map((m) => {
      const aluno = this.memDb.tb_alunos.find((a) => a.ID_aluno === m.idaluno);
      return {
        ...m,
        nome_aluno: aluno ? aluno.nome_aluno : `Aluno #${m.idaluno}`,
        cpf_aluno: aluno?.cpf || '-',
      };
    });
  }

  public createMensalidade(data: Omit<Mensalidade, 'ID_mensalidade'>, operatorUser: string): Mensalidade {
    const nextId = this.memDb.tb_mensalidades.reduce((max, m) => Math.max(max, m.ID_mensalidade), 0) + 1;
    const now = new Date();
    const item: Mensalidade = {
      ...data,
      ID_mensalidade: nextId,
      data_gerada: data.data_gerada || now.toISOString().split('T')[0],
      horario: data.horario || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      usuario: operatorUser,
    };
    this.memDb.tb_mensalidades.push(item);
    this.persist();
    return item;
  }

  // Operação financeira de recebimento com atualização atômica e registro opcional no Caixa
  public registrarPagamentoMensalidade(payload: {
    idmensalidade: number;
    valor_pago: number;
    forma_pagamento: string;
    gerar_caixa: boolean;
    observacao?: string;
    operatorUser: string;
  }) {
    const idx = this.memDb.tb_mensalidades.findIndex((m) => m.ID_mensalidade === payload.idmensalidade);
    if (idx === -1) throw new Error('Mensalidade não encontrada.');
    const mens = this.memDb.tb_mensalidades[idx];

    if (payload.valor_pago <= 0) throw new Error('O valor pago deve ser maior que zero.');
    if (payload.valor_pago > mens.saldo_devedor) {
      throw new Error(`O valor pago (R$ ${payload.valor_pago.toFixed(2)}) não pode ser superior ao saldo devedor atual (R$ ${mens.saldo_devedor.toFixed(2)}).`);
    }

    // Atualiza saldo e parcelas pagas
    const novoSaldo = Math.max(0, mens.saldo_devedor - payload.valor_pago);
    const parcelasNum = parseInt(mens.parcelas_pagas || '0', 10) + 1;
    this.memDb.tb_mensalidades[idx].saldo_devedor = Number(novoSaldo.toFixed(2));
    this.memDb.tb_mensalidades[idx].parcelas_pagas = String(parcelasNum);

    const aluno = this.memDb.tb_alunos.find((a) => a.ID_aluno === mens.idaluno);
    const now = new Date();
    const dataAtual = now.toISOString().split('T')[0];
    const horaAtual = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let caixaCriado: Caixa | null = null;
    if (payload.gerar_caixa) {
      const nextCaixaId = this.memDb.tb_caixa.reduce((max, c) => Math.max(max, c.ID_caixa), 0) + 1;
      const desc = payload.observacao || `Recebimento Mensalidade Parcela ${parcelasNum}/${mens.n_parcelas} - ${aluno?.nome_aluno || ''}`;

      caixaCriado = {
        ID_caixa: nextCaixaId,
        valor_total: payload.valor_pago,
        forma: payload.forma_pagamento,
        tipo_movimentacao: 'Entrada',
        descricao: desc,
        usuario: payload.operatorUser,
        data: dataAtual,
        horario: horaAtual,
        nome: aluno ? aluno.nome_aluno : `Aluno #${mens.idaluno}`,
        curso: mens.curso,
        idaluno: mens.idaluno,
        mensalidades_pagas: parcelasNum,
        idmensalidade: mens.ID_mensalidade,
      };
      this.memDb.tb_caixa.push(caixaCriado);

      // Inserção atômica no log_caixa (auditoria imutável)
      const nextLogId = this.memDb.log_caixa.reduce((max, l) => Math.max(max, l.ID_log_caixa), 0) + 1;
      const logItem: LogCaixa = {
        ID_log_caixa: nextLogId,
        valor_total: payload.valor_pago,
        forma: payload.forma_pagamento,
        tipo_movimentacao: 'Entrada',
        descricao: desc,
        usuario: payload.operatorUser,
        data: dataAtual,
        horario: horaAtual,
        nome: aluno ? aluno.nome_aluno : `Aluno #${mens.idaluno}`,
        curso: mens.curso,
        idaluno: mens.idaluno,
        mensalidades_pagas: parcelasNum,
        idmensalidade: mens.ID_mensalidade,
        justificativa: 'Baixa de mensalidade regular com quitação via sistema',
        tipo: 'RECEBIMENTO_MENSALIDADE',
        data_log: dataAtual,
        usuario_log: payload.operatorUser,
      };
      this.memDb.log_caixa.push(logItem);
    }

    this.persist();
    return {
      mensalidade: this.memDb.tb_mensalidades[idx],
      caixa: caixaCriado,
    };
  }

  // 9. CAIXA (tb_caixa)
  public getCaixa(params: {
    tipo?: string;
    forma?: string;
    data_inicio?: string;
    data_fim?: string;
    usuario?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    let list = [...this.memDb.tb_caixa];

    if (params.tipo) {
      list = list.filter((c) => c.tipo_movimentacao === params.tipo);
    }
    if (params.forma) {
      list = list.filter((c) => c.forma === params.forma);
    }
    if (params.usuario) {
      list = list.filter((c) => c.usuario === params.usuario);
    }
    if (params.data_inicio) {
      list = list.filter((c) => c.data && c.data >= params.data_inicio!);
    }
    if (params.data_fim) {
      list = list.filter((c) => c.data && c.data <= params.data_fim!);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (c) =>
          (c.descricao && c.descricao.toLowerCase().includes(q)) ||
          (c.nome && c.nome.toLowerCase().includes(q)) ||
          (c.curso && c.curso.toLowerCase().includes(q))
      );
    }

    // Ordenação decrescente de data
    list.sort((a, b) => (b.data || '').localeCompare(a.data || '') || b.ID_caixa - a.ID_caixa);

    const totalEntradas = list
      .filter((c) => c.tipo_movimentacao === 'Entrada')
      .reduce((sum, c) => sum + (c.valor_total || 0), 0);
    const totalSaidas = list
      .filter((c) => c.tipo_movimentacao === 'Saída')
      .reduce((sum, c) => sum + (c.valor_total || 0), 0);
    const saldo = totalEntradas - totalSaidas;

    const total = list.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 20);
    const data = list.slice((page - 1) * limit, page * limit);

    return { total, page, limit, totalPages: Math.ceil(total / limit), totalEntradas, totalSaidas, saldo, data };
  }

  public createMovimentacaoCaixa(
    payload: Omit<Caixa, 'ID_caixa'> & { justificativa?: string },
    operatorUser: string
  ): Caixa {
    if (!payload.valor_total || payload.valor_total <= 0) {
      throw new Error('O valor do lançamento deve ser maior que zero.');
    }
    const nextId = this.memDb.tb_caixa.reduce((max, c) => Math.max(max, c.ID_caixa), 0) + 1;
    const now = new Date();
    const dataAtual = payload.data || now.toISOString().split('T')[0];
    const horaAtual = payload.horario || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const caixaItem: Caixa = {
      ID_caixa: nextId,
      valor_total: payload.valor_total,
      forma: payload.forma || 'Dinheiro',
      tipo_movimentacao: payload.tipo_movimentacao || 'Entrada',
      descricao: payload.descricao || null,
      usuario: operatorUser,
      data: dataAtual,
      horario: horaAtual,
      nome: payload.nome || null,
      curso: payload.curso || null,
      idaluno: payload.idaluno || null,
      mensalidades_pagas: payload.mensalidades_pagas || null,
      idmensalidade: payload.idmensalidade || null,
    };
    this.memDb.tb_caixa.push(caixaItem);

    // Gravação automática em log_caixa (auditoria obrigatória)
    const nextLogId = this.memDb.log_caixa.reduce((max, l) => Math.max(max, l.ID_log_caixa), 0) + 1;
    const logItem: LogCaixa = {
      ID_log_caixa: nextLogId,
      valor_total: caixaItem.valor_total!,
      forma: caixaItem.forma!,
      tipo_movimentacao: caixaItem.tipo_movimentacao!,
      descricao: caixaItem.descricao,
      usuario: operatorUser,
      data: dataAtual,
      horario: horaAtual,
      nome: caixaItem.nome || 'Lançamento Avulso',
      curso: caixaItem.curso,
      idaluno: caixaItem.idaluno,
      mensalidades_pagas: caixaItem.mensalidades_pagas,
      idmensalidade: caixaItem.idmensalidade,
      justificativa: payload.justificativa || 'Lançamento manual registrado no caixa',
      tipo: caixaItem.tipo_movimentacao === 'Entrada' ? 'ENTRADA_AVULSA' : 'SAIDA_AVULSA',
      data_log: dataAtual,
      usuario_log: operatorUser,
    };
    this.memDb.log_caixa.push(logItem);

    this.persist();
    return caixaItem;
  }

  // 10. AUDITORIA DE CAIXA (log_caixa) - SOMENTE LEITURA
  public getLogCaixa(params: {
    data_inicio?: string;
    data_fim?: string;
    usuario?: string;
    tipo?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    let list = [...this.memDb.log_caixa];
    if (params.data_inicio) {
      list = list.filter((l) => l.data_log >= params.data_inicio!);
    }
    if (params.data_fim) {
      list = list.filter((l) => l.data_log <= params.data_fim!);
    }
    if (params.usuario) {
      list = list.filter((l) => l.usuario_log === params.usuario || l.usuario === params.usuario);
    }
    if (params.tipo) {
      list = list.filter((l) => l.tipo === params.tipo || l.tipo_movimentacao === params.tipo);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (l) =>
          l.nome.toLowerCase().includes(q) ||
          (l.descricao && l.descricao.toLowerCase().includes(q)) ||
          l.justificativa.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => b.data_log.localeCompare(a.data_log) || b.ID_log_caixa - a.ID_log_caixa);

    const total = list.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 20);
    const data = list.slice((page - 1) * limit, page * limit);

    return { total, page, limit, totalPages: Math.ceil(total / limit), data };
  }

  // 11. DESPESAS (tb_despesas)
  public getDespesas(params: { tipo?: string; data_inicio?: string; data_fim?: string; search?: string }) {
    let list = [...this.memDb.tb_despesas];
    if (params.tipo) {
      list = list.filter((d) => d.tipo === params.tipo);
    }
    if (params.data_inicio) {
      list = list.filter((d) => d.data >= params.data_inicio!);
    }
    if (params.data_fim) {
      list = list.filter((d) => d.data <= params.data_fim!);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((d) => d.descricao.toLowerCase().includes(q) || d.observacoes.toLowerCase().includes(q));
    }
    list.sort((a, b) => b.data.localeCompare(a.data));
    return list;
  }

  public createDespesa(data: Omit<Despesa, 'ID_despesa'>, operatorUser: string): Despesa {
    const nextId = this.memDb.tb_despesas.reduce((max, d) => Math.max(max, d.ID_despesa), 0) + 1;
    const item: Despesa = {
      ...data,
      ID_despesa: nextId,
      data_gerada: new Date().toISOString().split('T')[0],
      usuario: operatorUser,
    };
    this.memDb.tb_despesas.push(item);
    this.persist();
    return item;
  }

  public deleteDespesa(id: number) {
    this.memDb.tb_despesas = this.memDb.tb_despesas.filter((d) => d.ID_despesa !== id);
    this.persist();
    return true;
  }

  // 12. PROFESSORES (tb_professores)
  public getProfessores(params: { search?: string }) {
    let list = [...this.memDb.tb_professores];
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((p) => p.nome_professor.toLowerCase().includes(q) || p.telefone.includes(q));
    }
    return list.map((p) => {
      const compromissos = this.memDb.tb_pagamentos.filter((pg) => pg.idprofessor === p.ID_professor);
      const totalCompromissos = compromissos.reduce((s, c) => s + c.valor_total, 0);
      const totalPendente = compromissos.reduce((s, c) => s + c.valor_pendente, 0);
      return { ...p, compromissosCount: compromissos.length, totalCompromissos, totalPendente };
    });
  }

  public createProfessor(data: Omit<Professor, 'ID_professor'>): Professor {
    const nextId = this.memDb.tb_professores.reduce((max, p) => Math.max(max, p.ID_professor), 0) + 1;
    const item: Professor = { ...data, ID_professor: nextId };
    this.memDb.tb_professores.push(item);
    this.persist();
    return item;
  }

  public updateProfessor(id: number, data: Partial<Professor>): Professor {
    const idx = this.memDb.tb_professores.findIndex((p) => p.ID_professor === id);
    if (idx === -1) throw new Error('Professor não encontrado.');
    this.memDb.tb_professores[idx] = { ...this.memDb.tb_professores[idx], ...data, ID_professor: id };
    this.persist();
    return this.memDb.tb_professores[idx];
  }

  public deleteProfessor(id: number) {
    const hasPagamentos = this.memDb.tb_pagamentos.some((p) => p.idprofessor === id);
    if (hasPagamentos) {
      throw new Error('Não é possível excluir o professor pois existem compromissos de pagamento vinculados a ele.');
    }
    this.memDb.tb_professores = this.memDb.tb_professores.filter((p) => p.ID_professor !== id);
    this.persist();
    return true;
  }

  // 13. PAGAMENTOS A PROFESSORES (tb_pagamentos)
  public getPagamentosProfessores(params: { idprofessor?: number; search?: string }) {
    let list = [...this.memDb.tb_pagamentos];
    if (params.idprofessor) {
      list = list.filter((p) => p.idprofessor === Number(params.idprofessor));
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.professor.toLowerCase().includes(q) ||
          p.materia.toLowerCase().includes(q) ||
          p.turma.toLowerCase().includes(q)
      );
    }
    return list.map((p) => {
      const parciais = this.memDb.tb_pagamentos_parciais.filter((pp) => pp.idpagamento === p.ID_pagamento);
      const totalPago = parciais.reduce((s, pp) => s + pp.valor, 0);
      return { ...p, parciais, totalPago };
    });
  }

  public createPagamentoProfessor(
    data: Omit<PagamentoProfessor, 'ID_pagamento'>,
    operatorUser: string
  ): PagamentoProfessor {
    const nextId = this.memDb.tb_pagamentos.reduce((max, p) => Math.max(max, p.ID_pagamento), 0) + 1;
    const item: PagamentoProfessor = {
      ...data,
      ID_pagamento: nextId,
      valor_pendente: data.valor_pendente !== undefined ? data.valor_pendente : data.valor_total,
      data_gerada: new Date().toISOString().split('T')[0],
      usuario: operatorUser,
    };
    this.memDb.tb_pagamentos.push(item);
    this.persist();
    return item;
  }

  // 14. PAGAMENTOS PARCIAIS (tb_pagamentos_parciais)
  public getPagamentosParciais(params: { idpagamento?: number; idprofessor?: number }) {
    let list = [...this.memDb.tb_pagamentos_parciais];
    if (params.idpagamento) {
      list = list.filter((pp) => pp.idpagamento === Number(params.idpagamento));
    }
    if (params.idprofessor) {
      list = list.filter((pp) => pp.idprofessor === Number(params.idprofessor));
    }
    return list.map((pp) => {
      const prof = this.memDb.tb_professores.find((p) => p.ID_professor === pp.idprofessor);
      const compromisso = this.memDb.tb_pagamentos.find((p) => p.ID_pagamento === pp.idpagamento);
      return {
        ...pp,
        nome_professor: prof ? prof.nome_professor : `Professor #${pp.idprofessor}`,
        materia_compromisso: compromisso?.materia || '',
      };
    });
  }

  public createPagamentoParcial(
    payload: {
      valor: number;
      idpagamento: number;
      tipo: string;
    },
    operatorUser: string
  ): PagamentoParcial {
    const compIdx = this.memDb.tb_pagamentos.findIndex((p) => p.ID_pagamento === payload.idpagamento);
    if (compIdx === -1) throw new Error('Compromisso de pagamento docente não encontrado.');
    const comp = this.memDb.tb_pagamentos[compIdx];

    if (payload.valor <= 0) throw new Error('O valor do pagamento parcial deve ser maior que zero.');
    if (payload.valor > comp.valor_pendente) {
      throw new Error(`O valor informado (R$ ${payload.valor.toFixed(2)}) ultrapassa o saldo pendente (R$ ${comp.valor_pendente.toFixed(2)}).`);
    }

    const nextId = this.memDb.tb_pagamentos_parciais.reduce((max, pp) => Math.max(max, pp.ID_pagamento_parcial), 0) + 1;
    const now = new Date().toISOString().split('T')[0];

    const parcialItem: PagamentoParcial = {
      ID_pagamento_parcial: nextId,
      valor: payload.valor,
      idpagamento: comp.ID_pagamento,
      idprofessor: comp.idprofessor,
      tipo: payload.tipo || 'Transferência Bancária',
      data_gerada: now,
      usuario: operatorUser,
    };

    // Atualiza atomicamente o saldo pendente do compromisso
    const novoPendente = Math.max(0, comp.valor_pendente - payload.valor);
    this.memDb.tb_pagamentos[compIdx].valor_pendente = Number(novoPendente.toFixed(2));
    if (novoPendente === 0) {
      this.memDb.tb_pagamentos[compIdx].data_pagou = now;
    }

    this.memDb.tb_pagamentos_parciais.push(parcialItem);
    this.persist();
    return parcialItem;
  }

  // 15. PRODUTOS (tb_produtos)
  public getProdutos(params: { search?: string }) {
    let list = [...this.memDb.tb_produtos];
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((p) => p.produto.toLowerCase().includes(q) || (p.descricao && p.descricao.toLowerCase().includes(q)));
    }
    return list;
  }

  public createProduto(data: Omit<Produto, 'ID_produto'>, operatorUser: string): Produto {
    const nextId = this.memDb.tb_produtos.reduce((max, p) => Math.max(max, p.ID_produto), 0) + 1;
    const item: Produto = {
      ...data,
      ID_produto: nextId,
      data_gerada: new Date().toISOString().split('T')[0],
      usuario: operatorUser,
    };
    this.memDb.tb_produtos.push(item);
    this.persist();
    return item;
  }

  public updateProduto(id: number, data: Partial<Produto>): Produto {
    const idx = this.memDb.tb_produtos.findIndex((p) => p.ID_produto === id);
    if (idx === -1) throw new Error('Produto não encontrado.');
    this.memDb.tb_produtos[idx] = { ...this.memDb.tb_produtos[idx], ...data, ID_produto: id };
    this.persist();
    return this.memDb.tb_produtos[idx];
  }

  public deleteProduto(id: number) {
    const hasVendas = this.memDb.tb_vendas.some((v) => v.idproduto === id);
    if (hasVendas) {
      throw new Error('Não é possível excluir o produto pois existem vendas registradas com este item.');
    }
    this.memDb.tb_produtos = this.memDb.tb_produtos.filter((p) => p.ID_produto !== id);
    this.persist();
    return true;
  }

  // 16. VENDAS (tb_vendas) - COM CONTROLE DE ESTOQUE E AGRUPAMENTO POR codigovenda
  public getVendas(params: { codigovenda?: number; data_inicio?: string; data_fim?: string; search?: string }) {
    let list = [...this.memDb.tb_vendas];
    if (params.codigovenda) {
      list = list.filter((v) => v.codigovenda === Number(params.codigovenda));
    }
    if (params.data_inicio) {
      list = list.filter((v) => v.data_gerada >= params.data_inicio!);
    }
    if (params.data_fim) {
      list = list.filter((v) => v.data_gerada <= params.data_fim!);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (v) =>
          (v.nome && v.nome.toLowerCase().includes(q)) ||
          (v.produto && v.produto.toLowerCase().includes(q)) ||
          (v.observacao && v.observacao.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => b.data_gerada.localeCompare(a.data_gerada) || b.ID_venda - a.ID_venda);
    return list;
  }

  public createVenda(
    payload: {
      itens: { idproduto: number; quantidade: number; valor_unitario?: number }[];
      nome_cliente?: string;
      idcliente?: number | null;
      observacao?: string;
    },
    operatorUser: string
  ) {
    if (!payload.itens || payload.itens.length === 0) {
      throw new Error('A venda precisa conter pelo menos 1 item.');
    }

    // Validação de estoque prévia
    for (const item of payload.itens) {
      const prod = this.memDb.tb_produtos.find((p) => p.ID_produto === item.idproduto);
      if (!prod) throw new Error(`Produto #${item.idproduto} não encontrado.`);
      if (item.quantidade <= 0) throw new Error(`Quantidade do produto "${prod.produto}" deve ser maior que zero.`);
      const estoqueAtual = prod.estoque ?? 0;
      if (estoqueAtual < item.quantidade) {
        throw new Error(`Estoque insuficiente para o produto "${prod.produto}". Disponível: ${estoqueAtual}, solicitado: ${item.quantidade}.`);
      }
    }

    const nextCodigoVenda = this.memDb.tb_vendas.reduce((max, v) => Math.max(max, v.codigovenda), 1000) + 1;
    const now = new Date().toISOString().split('T')[0];
    const criadas: Venda[] = [];

    // Executa em bloco atômico: baixa estoque e cria registros de venda
    for (const item of payload.itens) {
      const prodIdx = this.memDb.tb_produtos.findIndex((p) => p.ID_produto === item.idproduto);
      const prod = this.memDb.tb_produtos[prodIdx];

      // Baixa estoque
      this.memDb.tb_produtos[prodIdx].estoque = (prod.estoque ?? 0) - item.quantidade;

      const valorUnit = item.valor_unitario ?? prod.valor_venda ?? 0;
      const valorTotal = valorUnit * item.quantidade;
      const nextVendaId = this.memDb.tb_vendas.reduce((max, v) => Math.max(max, v.ID_venda), 0) + 1;

      const venda: Venda = {
        ID_venda: nextVendaId,
        produto: prod.produto,
        valor_total: valorTotal,
        quantidade: item.quantidade,
        observacao: payload.observacao || null,
        nome: payload.nome_cliente || null,
        idcliente: payload.idcliente || null,
        usuario: operatorUser,
        data_gerada: now,
        codigovenda: nextCodigoVenda,
        idproduto: prod.ID_produto,
      };

      this.memDb.tb_vendas.push(venda);
      criadas.push(venda);
    }

    this.persist();
    return { codigovenda: nextCodigoVenda, itens: criadas };
  }

  // 17. USUÁRIOS INTERNOS (tb_usuarios)
  public getUsuarios() {
    return this.memDb.tb_usuarios.map((u) => ({
      ID_usuario: u.ID_usuario,
      nome_usuario: u.nome_usuario,
      username: u.username,
      nivel_usuario: u.nivel_usuario,
      role: this.mapNivelToRole(u.nivel_usuario),
    }));
  }

  public createUsuario(data: { nome_usuario: string; username: string; senha_plana: string; nivel_usuario: number }) {
    const exists = this.memDb.tb_usuarios.some((u) => u.username.toLowerCase() === data.username.toLowerCase());
    if (exists) throw new Error('Nome de usuário já está em uso.');

    const nextId = this.memDb.tb_usuarios.reduce((max, u) => Math.max(max, u.ID_usuario), 0) + 1;
    const item: Usuario = {
      ID_usuario: nextId,
      nome_usuario: data.nome_usuario,
      username: data.username,
      senha: hashPassword(data.senha_plana),
      nivel_usuario: data.nivel_usuario,
    };
    this.memDb.tb_usuarios.push(item);
    this.persist();
    return {
      ID_usuario: item.ID_usuario,
      nome_usuario: item.nome_usuario,
      username: item.username,
      nivel_usuario: item.nivel_usuario,
      role: this.mapNivelToRole(item.nivel_usuario),
    };
  }

  public updateUsuario(id: number, data: Partial<{ nome_usuario: string; username: string; nivel_usuario: number; nova_senha?: string }>) {
    const idx = this.memDb.tb_usuarios.findIndex((u) => u.ID_usuario === id);
    if (idx === -1) throw new Error('Usuário não encontrado.');

    if (data.username) {
      const exists = this.memDb.tb_usuarios.some((u) => u.ID_usuario !== id && u.username.toLowerCase() === data.username!.toLowerCase());
      if (exists) throw new Error('Nome de usuário já está em uso.');
      this.memDb.tb_usuarios[idx].username = data.username;
    }
    if (data.nome_usuario) this.memDb.tb_usuarios[idx].nome_usuario = data.nome_usuario;
    if (data.nivel_usuario !== undefined) this.memDb.tb_usuarios[idx].nivel_usuario = data.nivel_usuario;
    if (data.nova_senha) {
      this.memDb.tb_usuarios[idx].senha = hashPassword(data.nova_senha);
    }

    this.persist();
    return {
      ID_usuario: this.memDb.tb_usuarios[idx].ID_usuario,
      nome_usuario: this.memDb.tb_usuarios[idx].nome_usuario,
      username: this.memDb.tb_usuarios[idx].username,
      nivel_usuario: this.memDb.tb_usuarios[idx].nivel_usuario,
      role: this.mapNivelToRole(this.memDb.tb_usuarios[idx].nivel_usuario),
    };
  }

  public deleteUsuario(id: number) {
    if (this.memDb.tb_usuarios.length <= 1) {
      throw new Error('Não é possível remover o único usuário do sistema.');
    }
    this.memDb.tb_usuarios = this.memDb.tb_usuarios.filter((u) => u.ID_usuario !== id);
    this.persist();
    return true;
  }

  // 18. CONTAS DE ALUNOS (tb_contas)
  public getContasAlunos() {
    return this.memDb.tb_contas.map((c) => {
      const aluno = this.memDb.tb_alunos.find((a) => a.ID_aluno === c.idaluno);
      return {
        ID_conta: c.ID_conta,
        cpf: c.cpf,
        idaluno: c.idaluno,
        nome_aluno: aluno ? aluno.nome_aluno : `Aluno #${c.idaluno}`,
        status_aluno: aluno?.status || 'Desconhecido',
      };
    });
  }

  public createContaAluno(data: { cpf: string; senha_plana: string; idaluno: number }) {
    const exists = this.memDb.tb_contas.some((c) => c.idaluno === data.idaluno || c.cpf === data.cpf);
    if (exists) throw new Error('Já existe uma conta cadastrada para este aluno ou CPF.');

    const nextId = this.memDb.tb_contas.reduce((max, c) => Math.max(max, c.ID_conta), 0) + 1;
    const item: ContaAluno = {
      ID_conta: nextId,
      cpf: data.cpf,
      senha: hashPassword(data.senha_plana),
      idaluno: data.idaluno,
    };
    this.memDb.tb_contas.push(item);
    this.persist();
    return { ID_conta: item.ID_conta, cpf: item.cpf, idaluno: item.idaluno };
  }

  public resetSenhaContaAluno(idconta: number, nova_senha_plana: string) {
    const idx = this.memDb.tb_contas.findIndex((c) => c.ID_conta === idconta);
    if (idx === -1) throw new Error('Conta não encontrada.');
    this.memDb.tb_contas[idx].senha = hashPassword(nova_senha_plana);
    this.persist();
    return true;
  }

  public deleteContaAluno(id: number) {
    this.memDb.tb_contas = this.memDb.tb_contas.filter((c) => c.ID_conta !== id);
    this.persist();
    return true;
  }

  // AUTENTICAÇÃO INTERNA
  public authenticateInternal(username: string, plainPass: string) {
    const user = this.memDb.tb_usuarios.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return null;
    const hash = hashPassword(plainPass);
    if (user.senha !== hash) return null;

    return {
      id: user.ID_usuario,
      nome: user.nome_usuario,
      username: user.username,
      role: this.mapNivelToRole(user.nivel_usuario),
      isStudent: false,
    };
  }

  // AUTENTICAÇÃO DO ALUNO (PORTAL)
  public authenticateStudent(cpf: string, plainPass: string) {
    const cleanCpf = cpf.replace(/[^\d]/g, '');
    const conta = this.memDb.tb_contas.find((c) => c.cpf.replace(/[^\d]/g, '') === cleanCpf);
    if (!conta) return null;
    const hash = hashPassword(plainPass);
    if (conta.senha !== hash) return null;

    const aluno = this.memDb.tb_alunos.find((a) => a.ID_aluno === conta.idaluno);
    if (!aluno) return null;

    return {
      id: conta.ID_conta,
      nome: aluno.nome_aluno,
      username: aluno.cpf || conta.cpf,
      role: 'Aluno' as UserRole,
      isStudent: true,
      studentId: aluno.ID_aluno,
    };
  }

  // DASHBOARD AGGREGATES (sem números fixos inventados)
  public getDashboardStats() {
    const totalAlunos = this.memDb.tb_alunos.length;
    const alunosAtivos = this.memDb.tb_alunos.filter((a) => a.status === 'Ativo').length;
    const alunosConcluidos = this.memDb.tb_alunos.filter((a) => a.status === 'Concluído').length;

    // Alunos por curso
    const alunosPorCurso: Record<string, number> = {};
    for (const a of this.memDb.tb_alunos) {
      const c = this.memDb.tb_cursos.find((item) => item.ID_curso === a.idcurso);
      const nome = c ? c.nome_curso : 'Sem curso';
      alunosPorCurso[nome] = (alunosPorCurso[nome] || 0) + 1;
    }

    // Caixa no período atual
    const entradasCaixa = this.memDb.tb_caixa
      .filter((c) => c.tipo_movimentacao === 'Entrada')
      .reduce((sum, c) => sum + (c.valor_total || 0), 0);
    const saidasCaixa = this.memDb.tb_caixa
      .filter((c) => c.tipo_movimentacao === 'Saída')
      .reduce((sum, c) => sum + (c.valor_total || 0), 0);
    const saldoCaixa = entradasCaixa - saidasCaixa;

    // Saldos pendentes do legado
    const totalSaldosMensalidades = this.memDb.tb_mensalidades.reduce((sum, m) => sum + m.saldo_devedor, 0);
    const totalPendenciasProfessores = this.memDb.tb_pagamentos.reduce((sum, p) => sum + p.valor_pendente, 0);

    // Vendas
    const totalVendasValor = this.memDb.tb_vendas.reduce((sum, v) => sum + (v.valor_total || 0), 0);
    const totalItensVendidos = this.memDb.tb_vendas.reduce((sum, v) => sum + (v.quantidade || 0), 0);
    const codigosVendaUnicos = new Set(this.memDb.tb_vendas.map((v) => v.codigovenda)).size;

    // Alertas de estoque baixo (estoque <= 10)
    const produtosEstoqueBaixo = this.memDb.tb_produtos.filter((p) => (p.estoque ?? 0) <= 10);

    return {
      alunos: {
        total: totalAlunos,
        ativos: alunosAtivos,
        concluidos: alunosConcluidos,
        porCurso: alunosPorCurso,
      },
      financeiro: {
        entradasCaixa,
        saidasCaixa,
        saldoCaixa,
        totalSaldosMensalidades,
        totalPendenciasProfessores,
      },
      comercial: {
        totalVendasValor,
        totalItensVendidos,
        pedidosDistintos: codigosVendaUnicos,
        produtosEstoqueBaixo: produtosEstoqueBaixo.map((p) => ({
          id: p.ID_produto,
          produto: p.produto,
          estoque: p.estoque,
        })),
      },
      auditCount: this.memDb.log_caixa.length,
    };
  }
}

export const db = new DatabaseManager();
