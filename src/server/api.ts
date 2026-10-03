import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import { AuthUser, UserRole } from '../types/schema.js';
import crypto from 'crypto';

export const apiRouter = Router();

// Cache simples de sessões em memória
const sessions = new Map<string, AuthUser>();

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Neutralizador de injeção de fórmulas CSV
export function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');
  // Se começar com caracteres de fórmula perigosos (=, +, -, @), prefixar com apóstrofo
  if (/^[=\+\-@]/.test(str)) {
    str = "'" + str;
  }
  return `"${str}"`;
}

// Middleware de autenticação
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Sessão expirada ou não autenticado.' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const user = sessions.get(token);
  if (!user) {
    return res.status(401).json({ error: 'Token de autenticação inválido ou expirado.' });
  }

  (req as any).user = user;
  next();
}

// Middleware de Autorização por Perfil (RBAC)
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthUser;
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    if (user.role === 'Administrador') {
      return next(); // Administrador tem acesso a todos os módulos
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `Acesso negado: Perfil "${user.role}" não possui permissão para acessar este recurso.`,
      });
    }

    next();
  };
}

// --- ROTAS DE AUTENTICAÇÃO ---

// Login interno (tb_usuarios)
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Informe usuário e senha.' });
    }

    const user = db.authenticateInternal(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique o usuário e a senha.' });
    }

    const token = generateToken();
    const authData: AuthUser = { ...user, token };
    sessions.set(token, authData);

    return res.json({ user: authData, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Login do Aluno (tb_contas)
apiRouter.post('/auth/portal-login', (req: Request, res: Response) => {
  try {
    const { cpf, password } = req.body;
    if (!cpf || !password) {
      return res.status(400).json({ error: 'Informe CPF e senha de acesso.' });
    }

    const user = db.authenticateStudent(cpf, password);
    if (!user) {
      return res.status(401).json({ error: 'CPF ou senha do aluno incorretos.' });
    }

    const token = generateToken();
    const authData: AuthUser = { ...user, token };
    sessions.set(token, authData);

    return res.json({ user: authData, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Logout
apiRouter.post('/auth/logout', requireAuth, (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (token) sessions.delete(token);
  return res.json({ success: true });
});

// Obter usuário atual
apiRouter.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  return res.json({ user: (req as any).user });
});

// Status do Banco de Dados
apiRouter.get('/status', (req: Request, res: Response) => {
  const status = db.getStatus();
  return res.json(status);
});

// Importação de Script / Dump SQL (.sql)
apiRouter.post('/database/import-sql', async (req: Request, res: Response) => {
  try {
    const { sqlContent, replaceExisting } = req.body;
    if (!sqlContent || typeof sqlContent !== 'string') {
      return res.status(400).json({ error: 'Nenhum conteúdo SQL fornecido para importação.' });
    }

    // Se replaceExisting não for especificado, padrão é true (substituir dados demonstrativos pelos dados reais da importação)
    const shouldReplace = replaceExisting !== undefined ? Boolean(replaceExisting) : true;
    const result = await db.importSql(sqlContent, shouldReplace);

    return res.json({
      success: true,
      message: `Importação concluída com sucesso! ${result.importedCount} registro(s) processados e integrados ao sistema.`,
      ...result,
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Falha na importação do SQL: ${err.message}` });
  }
});

// Dashboard Geral
apiRouter.get('/dashboard/stats', requireAuth, (req: Request, res: Response) => {
  const stats = db.getDashboardStats();
  return res.json(stats);
});

// --- 1. TB_ALUNOS (/academico/alunos) ---
apiRouter.get('/alunos', requireAuth, requireRole('Secretaria', 'Coordenação', 'Financeiro'), (req, res) => {
  const { search, idcurso, status, page, limit } = req.query;
  const result = db.getAlunos({
    search: search as string,
    idcurso: idcurso ? Number(idcurso) : undefined,
    status: status as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  return res.json(result);
});

apiRouter.get('/alunos/:id', requireAuth, requireRole('Secretaria', 'Coordenação', 'Financeiro'), (req, res) => {
  const aluno = db.getAlunoById(Number(req.params.id));
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado.' });
  return res.json(aluno);
});

apiRouter.post('/alunos', requireAuth, requireRole('Secretaria'), (req, res) => {
  try {
    const operator = (req as any).user.username;
    const aluno = db.createAluno(req.body, operator);
    return res.status(201).json(aluno);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/alunos/:id', requireAuth, requireRole('Secretaria'), (req, res) => {
  try {
    const aluno = db.updateAluno(Number(req.params.id), req.body);
    return res.json(aluno);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/alunos/:id', requireAuth, requireRole('Secretaria'), (req, res) => {
  try {
    db.deleteAluno(Number(req.params.id));
    return res.json({ success: true, message: 'Aluno removido com sucesso.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- 2. TB_RESPONSAVEL_FINANCEIRO (/academico/responsaveis) ---
apiRouter.get('/responsaveis', requireAuth, requireRole('Secretaria', 'Financeiro'), (req, res) => {
  const { search, idaluno, page, limit } = req.query;
  const result = db.getResponsaveis({
    search: search as string,
    idaluno: idaluno ? Number(idaluno) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  return res.json(result);
});

apiRouter.post('/responsaveis', requireAuth, requireRole('Secretaria'), (req, res) => {
  try {
    const resp = db.createResponsavel(req.body);
    return res.status(201).json(resp);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/responsaveis/:id', requireAuth, requireRole('Secretaria'), (req, res) => {
  try {
    const resp = db.updateResponsavel(Number(req.params.id), req.body);
    return res.json(resp);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/responsaveis/:id', requireAuth, requireRole('Secretaria'), (req, res) => {
  try {
    db.deleteResponsavel(Number(req.params.id));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- 3. TB_CURSOS (/academico/cursos) ---
apiRouter.get('/cursos', requireAuth, (req, res) => {
  const cursos = db.getCursos();
  return res.json(cursos);
});

apiRouter.post('/cursos', requireAuth, requireRole('Secretaria', 'Coordenação'), (req, res) => {
  try {
    const curso = db.createCurso(req.body.nome_curso);
    return res.status(201).json(curso);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/cursos/:id', requireAuth, requireRole('Secretaria', 'Coordenação'), (req, res) => {
  try {
    const curso = db.updateCurso(Number(req.params.id), req.body.nome_curso);
    return res.json(curso);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/cursos/:id', requireAuth, requireRole('Secretaria', 'Coordenação'), (req, res) => {
  try {
    db.deleteCurso(Number(req.params.id));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- 4. TB_CURSOLIVRE (/academico/cursos-livres) ---
apiRouter.get('/cursos-livres', requireAuth, (req, res) => {
  const list = db.getCursosLivres({ search: req.query.search as string });
  return res.json(list);
});

apiRouter.post('/cursos-livres', requireAuth, requireRole('Secretaria', 'Coordenação'), (req, res) => {
  try {
    const item = db.createCursoLivre(req.body);
    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/cursos-livres/:id', requireAuth, requireRole('Secretaria', 'Coordenação'), (req, res) => {
  try {
    const item = db.updateCursoLivre(Number(req.params.id), req.body);
    return res.json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/cursos-livres/:id', requireAuth, requireRole('Secretaria', 'Coordenação'), (req, res) => {
  try {
    db.deleteCursoLivre(Number(req.params.id));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- 5. TB_MATERIAS (/academico/disciplinas) ---
apiRouter.get('/materias', requireAuth, (req, res) => {
  const list = db.getMaterias({
    idcurso: req.query.idcurso ? Number(req.query.idcurso) : undefined,
    search: req.query.search as string,
  });
  return res.json(list);
});

apiRouter.post('/materias', requireAuth, requireRole('Secretaria', 'Coordenação'), (req, res) => {
  try {
    const item = db.createMateria(req.body);
    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/materias/:id', requireAuth, requireRole('Secretaria', 'Coordenação'), (req, res) => {
  try {
    const item = db.updateMateria(Number(req.params.id), req.body);
    return res.json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/materias/:id', requireAuth, requireRole('Secretaria', 'Coordenação'), (req, res) => {
  try {
    db.deleteMateria(Number(req.params.id));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- 6. TB_TURMAS (/academico/turmas) ---
apiRouter.get('/turmas', requireAuth, (req, res) => {
  const list = db.getTurmas({
    idcurso: req.query.idcurso ? Number(req.query.idcurso) : undefined,
    turno: req.query.turno as string,
    status: req.query.status as string,
  });
  return res.json(list);
});

apiRouter.post('/turmas', requireAuth, requireRole('Secretaria', 'Coordenação'), (req, res) => {
  try {
    const item = db.createTurma(req.body);
    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/turmas/:id', requireAuth, requireRole('Secretaria', 'Coordenação'), (req, res) => {
  try {
    const item = db.updateTurma(Number(req.params.id), req.body);
    return res.json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/turmas/:id', requireAuth, requireRole('Secretaria', 'Coordenação'), (req, res) => {
  try {
    db.deleteTurma(Number(req.params.id));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- 7. TB_NOTAS (/academico/notas) ---
apiRouter.get('/notas', requireAuth, requireRole('Secretaria', 'Coordenação'), (req, res) => {
  const list = db.getNotas({
    idaluno: req.query.idaluno ? Number(req.query.idaluno) : undefined,
    idcurso: req.query.idcurso ? Number(req.query.idcurso) : undefined,
    idmateria: req.query.idmateria ? Number(req.query.idmateria) : undefined,
    search: req.query.search as string,
  });
  return res.json(list);
});

apiRouter.post('/notas', requireAuth, requireRole('Secretaria', 'Coordenação'), (req, res) => {
  try {
    const operator = (req as any).user.username;
    const item = db.createNota(req.body, operator);
    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/notas/:id', requireAuth, requireRole('Secretaria', 'Coordenação'), (req, res) => {
  try {
    const item = db.updateNota(Number(req.params.id), req.body);
    return res.json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/notas/:id', requireAuth, requireRole('Secretaria', 'Coordenação'), (req, res) => {
  try {
    db.deleteNota(Number(req.params.id));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- 8. TB_MENSALIDADES (/financeiro/mensalidades) ---
apiRouter.get('/mensalidades', requireAuth, requireRole('Financeiro', 'Secretaria'), (req, res) => {
  const list = db.getMensalidades({
    idaluno: req.query.idaluno ? Number(req.query.idaluno) : undefined,
    search: req.query.search as string,
  });
  return res.json(list);
});

apiRouter.post('/mensalidades', requireAuth, requireRole('Financeiro', 'Secretaria'), (req, res) => {
  try {
    const operator = (req as any).user.username;
    const item = db.createMensalidade(req.body, operator);
    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/mensalidades/pagamento', requireAuth, requireRole('Financeiro'), (req, res) => {
  try {
    const operator = (req as any).user.username;
    const result = db.registrarPagamentoMensalidade({
      ...req.body,
      operatorUser: operator,
    });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- 9. TB_CAIXA (/financeiro/caixa) ---
apiRouter.get('/caixa', requireAuth, requireRole('Financeiro'), (req, res) => {
  const result = db.getCaixa({
    tipo: req.query.tipo as string,
    forma: req.query.forma as string,
    data_inicio: req.query.data_inicio as string,
    data_fim: req.query.data_fim as string,
    usuario: req.query.usuario as string,
    search: req.query.search as string,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  return res.json(result);
});

apiRouter.post('/caixa', requireAuth, requireRole('Financeiro'), (req, res) => {
  try {
    const operator = (req as any).user.username;
    const item = db.createMovimentacaoCaixa(req.body, operator);
    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- 10. LOG_CAIXA (/administracao/auditoria-caixa) - SOMENTE LEITURA ---
apiRouter.get('/auditoria-caixa', requireAuth, requireRole('Administrador'), (req, res) => {
  const result = db.getLogCaixa({
    data_inicio: req.query.data_inicio as string,
    data_fim: req.query.data_fim as string,
    usuario: req.query.usuario as string,
    tipo: req.query.tipo as string,
    search: req.query.search as string,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  return res.json(result);
});

// --- 11. TB_DESPESAS (/financeiro/despesas) ---
apiRouter.get('/despesas', requireAuth, requireRole('Financeiro'), (req, res) => {
  const list = db.getDespesas({
    tipo: req.query.tipo as string,
    data_inicio: req.query.data_inicio as string,
    data_fim: req.query.data_fim as string,
    search: req.query.search as string,
  });
  return res.json(list);
});

apiRouter.post('/despesas', requireAuth, requireRole('Financeiro'), (req, res) => {
  try {
    const operator = (req as any).user.username;
    const item = db.createDespesa(req.body, operator);
    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/despesas/:id', requireAuth, requireRole('Financeiro'), (req, res) => {
  try {
    db.deleteDespesa(Number(req.params.id));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- 12. TB_PROFESSORES (/pessoas/professores) ---
apiRouter.get('/professores', requireAuth, (req, res) => {
  const list = db.getProfessores({ search: req.query.search as string });
  return res.json(list);
});

apiRouter.post('/professores', requireAuth, requireRole('Secretaria', 'Coordenação', 'Financeiro'), (req, res) => {
  try {
    const item = db.createProfessor(req.body);
    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/professores/:id', requireAuth, requireRole('Secretaria', 'Coordenação', 'Financeiro'), (req, res) => {
  try {
    const item = db.updateProfessor(Number(req.params.id), req.body);
    return res.json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/professores/:id', requireAuth, requireRole('Secretaria', 'Coordenação', 'Financeiro'), (req, res) => {
  try {
    db.deleteProfessor(Number(req.params.id));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- 13. TB_PAGAMENTOS (/financeiro/pagamentos-professores) ---
apiRouter.get('/pagamentos-professores', requireAuth, requireRole('Financeiro'), (req, res) => {
  const list = db.getPagamentosProfessores({
    idprofessor: req.query.idprofessor ? Number(req.query.idprofessor) : undefined,
    search: req.query.search as string,
  });
  return res.json(list);
});

apiRouter.post('/pagamentos-professores', requireAuth, requireRole('Financeiro'), (req, res) => {
  try {
    const operator = (req as any).user.username;
    const item = db.createPagamentoProfessor(req.body, operator);
    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- 14. TB_PAGAMENTOS_PARCIAIS (/financeiro/pagamentos-parciais) ---
apiRouter.get('/pagamentos-parciais', requireAuth, requireRole('Financeiro'), (req, res) => {
  const list = db.getPagamentosParciais({
    idpagamento: req.query.idpagamento ? Number(req.query.idpagamento) : undefined,
    idprofessor: req.query.idprofessor ? Number(req.query.idprofessor) : undefined,
  });
  return res.json(list);
});

apiRouter.post('/pagamentos-parciais', requireAuth, requireRole('Financeiro'), (req, res) => {
  try {
    const operator = (req as any).user.username;
    const item = db.createPagamentoParcial(req.body, operator);
    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- 15. TB_PRODUTOS (/comercial/produtos) ---
apiRouter.get('/produtos', requireAuth, requireRole('Comercial', 'Secretaria', 'Financeiro'), (req, res) => {
  const list = db.getProdutos({ search: req.query.search as string });
  const user = (req as any).user as AuthUser;

  // Se não for Administrador ou Comercial, omitir custo para proteção
  const hideCost = user.role !== 'Administrador' && user.role !== 'Comercial';
  const sanitized = list.map((p) => (hideCost ? { ...p, valor_custo: null } : p));
  return res.json(sanitized);
});

apiRouter.post('/produtos', requireAuth, requireRole('Comercial'), (req, res) => {
  try {
    const operator = (req as any).user.username;
    const item = db.createProduto(req.body, operator);
    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/produtos/:id', requireAuth, requireRole('Comercial'), (req, res) => {
  try {
    const item = db.updateProduto(Number(req.params.id), req.body);
    return res.json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/produtos/:id', requireAuth, requireRole('Comercial'), (req, res) => {
  try {
    db.deleteProduto(Number(req.params.id));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- 16. TB_VENDAS (/comercial/vendas) ---
apiRouter.get('/vendas', requireAuth, requireRole('Comercial', 'Financeiro'), (req, res) => {
  const list = db.getVendas({
    codigovenda: req.query.codigovenda ? Number(req.query.codigovenda) : undefined,
    data_inicio: req.query.data_inicio as string,
    data_fim: req.query.data_fim as string,
    search: req.query.search as string,
  });
  return res.json(list);
});

apiRouter.post('/vendas', requireAuth, requireRole('Comercial'), (req, res) => {
  try {
    const operator = (req as any).user.username;
    const result = db.createVenda(req.body, operator);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- 17. TB_USUARIOS (/administracao/usuarios) ---
apiRouter.get('/usuarios', requireAuth, requireRole('Administrador'), (req, res) => {
  const list = db.getUsuarios();
  return res.json(list);
});

apiRouter.post('/usuarios', requireAuth, requireRole('Administrador'), (req, res) => {
  try {
    const item = db.createUsuario(req.body);
    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/usuarios/:id', requireAuth, requireRole('Administrador'), (req, res) => {
  try {
    const item = db.updateUsuario(Number(req.params.id), req.body);
    return res.json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/usuarios/:id', requireAuth, requireRole('Administrador'), (req, res) => {
  try {
    db.deleteUsuario(Number(req.params.id));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- 18. TB_CONTAS (/administracao/contas-alunos) ---
apiRouter.get('/contas-alunos', requireAuth, requireRole('Administrador', 'Secretaria'), (req, res) => {
  const list = db.getContasAlunos();
  return res.json(list);
});

apiRouter.post('/contas-alunos', requireAuth, requireRole('Administrador', 'Secretaria'), (req, res) => {
  try {
    const item = db.createContaAluno(req.body);
    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/contas-alunos/:id/reset-senha', requireAuth, requireRole('Administrador', 'Secretaria'), (req, res) => {
  try {
    const { nova_senha } = req.body;
    if (!nova_senha || nova_senha.length < 4) {
      return res.status(400).json({ error: 'A nova senha deve possuir pelo menos 4 caracteres.' });
    }
    db.resetSenhaContaAluno(Number(req.params.id), nova_senha);
    return res.json({ success: true, message: 'Senha redefinida com sucesso.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/contas-alunos/:id', requireAuth, requireRole('Administrador', 'Secretaria'), (req, res) => {
  try {
    db.deleteContaAluno(Number(req.params.id));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- PORTAL DO ALUNO (ACESSO RESTRITO POR IDENTIDADE DO ALUNO) ---
apiRouter.get('/portal-aluno/meus-dados', requireAuth, (req, res) => {
  const user = (req as any).user as AuthUser;
  if (!user.isStudent || !user.studentId) {
    return res.status(403).json({ error: 'Apenas alunos autenticados podem acessar este portal.' });
  }

  const aluno = db.getAlunoById(user.studentId);
  if (!aluno) return res.status(404).json({ error: 'Dados do aluno não encontrados.' });

  return res.json({
    perfil: {
      ID_aluno: aluno.ID_aluno,
      nome_aluno: aluno.nome_aluno,
      email: aluno.email,
      cpf: aluno.cpf,
      telefone: aluno.telefone,
      status: aluno.status,
      curso: aluno.curso?.nome_curso || 'Não informado',
      turno: aluno.turno,
      dias_aula: aluno.dias_aula,
      carga_horaria: aluno.carga_horaria,
      inicio_curso: aluno.inicio_curso,
      fim_curso: aluno.fim_curso,
    },
    notas: aluno.notas,
    mensalidades: aluno.mensalidades,
  });
});

// --- EXPORTAÇÃO CSV COM NEUTRALIZAÇÃO DE FÓRMULAS ---
apiRouter.get('/export/csv/:tabela', requireAuth, (req, res) => {
  const { tabela } = req.params;
  const user = (req as any).user as AuthUser;

  // Verificação de permissão para exportação
  if (tabela === 'auditoria-caixa' && user.role !== 'Administrador') {
    return res.status(403).json({ error: 'Apenas Administradores podem exportar o log de auditoria.' });
  }

  let csvContent = '';
  let filename = `${tabela}_${new Date().toISOString().split('T')[0]}.csv`;

  if (tabela === 'alunos') {
    const data = db.getAlunos({ limit: 1000 }).data;
    const header = ['ID', 'Nome', 'CPF', 'Telefone', 'Email', 'Curso ID', 'Status', 'SISTEC', 'Data Cadastro'];
    const rows = data.map((a) => [
      escapeCsvField(a.ID_aluno),
      escapeCsvField(a.nome_aluno),
      escapeCsvField(a.cpf),
      escapeCsvField(a.telefone),
      escapeCsvField(a.email),
      escapeCsvField(a.idcurso),
      escapeCsvField(a.status),
      escapeCsvField(a.sistec),
      escapeCsvField(a.data_gerada),
    ]);
    csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  } else if (tabela === 'caixa') {
    const data = db.getCaixa({ limit: 2000 }).data;
    const header = ['ID', 'Data', 'Horario', 'Tipo', 'Valor', 'Forma', 'Descricao', 'Aluno', 'Operador'];
    const rows = data.map((c) => [
      escapeCsvField(c.ID_caixa),
      escapeCsvField(c.data),
      escapeCsvField(c.horario),
      escapeCsvField(c.tipo_movimentacao),
      escapeCsvField(c.valor_total?.toFixed(2)),
      escapeCsvField(c.forma),
      escapeCsvField(c.descricao),
      escapeCsvField(c.nome),
      escapeCsvField(c.usuario),
    ]);
    csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  } else if (tabela === 'auditoria-caixa') {
    const data = db.getLogCaixa({ limit: 2000 }).data;
    const header = ['ID_Log', 'Data_Log', 'Operador_Log', 'Tipo_Acao', 'Justificativa', 'Valor', 'Forma', 'Descricao'];
    const rows = data.map((l) => [
      escapeCsvField(l.ID_log_caixa),
      escapeCsvField(l.data_log),
      escapeCsvField(l.usuario_log),
      escapeCsvField(l.tipo),
      escapeCsvField(l.justificativa),
      escapeCsvField(l.valor_total.toFixed(2)),
      escapeCsvField(l.forma),
      escapeCsvField(l.descricao),
    ]);
    csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  } else {
    return res.status(400).json({ error: 'Tabela não suportada para exportação direta.' });
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send('\uFEFF' + csvContent); // Adicionar BOM UTF-8 para Excel
});
