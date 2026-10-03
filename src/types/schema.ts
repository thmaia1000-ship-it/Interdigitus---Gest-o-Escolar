/**
 * Interdigitus - Definições de Tipos para o Banco de Dados dbinterdigitus
 * Todas as 18 tabelas originais mapeadas rigorosamente com os tipos originais.
 */

// 1. tb_alunos
export interface Aluno {
  ID_aluno: number;
  nome_aluno: string;
  email: string | null;
  cpf: string | null;
  rg: string | null;
  orgao_emissor: string | null;
  data_emissao: string | null;
  datanasc: string | null;
  UF: string | null;
  cidade: string | null;
  nacionalidade: string | null;
  rua: string | null;
  bairro: string | null;
  cep: string | null;
  numero: string | null;
  telefone: string | null;
  mae: string | null;
  idcurso: number | null;
  dias_aula: string | null;
  turno: string | null;
  ensino_medio: string | null;
  ano_conclusao: string | null;
  observacao: string | null;
  sistec: string | null;
  livro_ata: string | null;
  registro: string | null;
  pagina: string | null;
  codigo: string | null;
  inicio_curso: string | null;
  fim_curso: string | null;
  data_conclusao_curso: string | null;
  carga_horaria: string | null;
  status: string; // Ex: 'Ativo', 'Concluído', 'Trancado', 'Evadido'
  data_gerada: string | null;
  usuario: string | null;
}

// 2. tb_responsavel_financeiro
export interface ResponsavelFinanceiro {
  ID_responsavel_financeiro: number;
  nome: string;
  CPF: string;
  RG: string;
  idaluno: number;
}

// 3. tb_cursos
export interface Curso {
  ID_curso: number;
  nome_curso: string;
}

// 4. tb_cursoLivre (preservando maiúsculas e minúsculas)
export interface CursoLivre {
  ID_curso: number;
  nome_curso: string;
  carga_horaria: number;
  conteudo: string;
}

// 5. tb_materias
export interface Materia {
  ID_materia: number;
  materia: string;
  idcurso: number;
}

// 6. tb_turmas
export interface Turma {
  ID_turma: number;
  turma: string;
  sala: string;
  turno: string;
  status_turma: string; // char(1) ex: 'A', 'I', 'F'
  idcurso: number | null;
}

// 7. tb_notas
export interface Nota {
  ID_nota: number;
  aluno: string;
  materia: string | null;
  nota1: string | null;
  nota2: string | null;
  media: string | null;
  situacao: string | null;
  idaluno: number | null;
  idcurso: number | null;
  idmateria: number | null;
  data_gerada: string | null;
  usuario: string | null;
}

// 8. tb_mensalidades
export interface Mensalidade {
  ID_mensalidade: number;
  entrada: number;
  n_parcelas: string;
  valor_total: number;
  saldo_devedor: number;
  valor_parcela: number;
  data_pagar: string;
  data_inicio: string;
  data_fim: string;
  parcelas_pagas: string;
  data_gerada: string;
  usuario: string | null;
  horario: string;
  curso: string;
  idaluno: number;
}

// 9. tb_caixa
export interface Caixa {
  ID_caixa: number;
  valor_total: number | null;
  forma: string | null; // Dinheiro, PIX, Cartão Crédito, Cartão Débito, Boleto
  tipo_movimentacao: string | null; // Entrada, Saída
  descricao: string | null;
  usuario: string | null;
  data: string | null;
  horario: string | null;
  nome: string | null;
  curso: string | null;
  idaluno: number | null;
  mensalidades_pagas: number | null;
  idmensalidade: number | null;
}

// 10. log_caixa (auditoria imutável)
export interface LogCaixa {
  ID_log_caixa: number;
  valor_total: number;
  forma: string;
  tipo_movimentacao: string;
  descricao: string | null;
  usuario: string;
  data: string;
  horario: string;
  nome: string;
  curso: string | null;
  idaluno: number | null;
  mensalidades_pagas: number | null;
  idmensalidade: number | null;
  justificativa: string;
  tipo: string | null;
  data_log: string;
  usuario_log: string;
}

// 11. tb_despesas
export interface Despesa {
  ID_despesa: number;
  tipo: string;
  descricao: string;
  valor: number;
  data: string;
  observacoes: string;
  usuario: string;
  data_gerada: string;
}

// 12. tb_professores
export interface Professor {
  ID_professor: number;
  nome_professor: string;
  telefone: string;
}

// 13. tb_pagamentos (compromissos de professores)
export interface PagamentoProfessor {
  ID_pagamento: number;
  valor_total: number;
  valor_pendente: number;
  pagamento: string;
  professor: string;
  turma: string;
  materia: string;
  carga_horaria: string;
  idprofessor: number;
  idmateria: number | null;
  idcurso: number | null;
  descricao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  data_pagou: string | null;
  usuario: string;
  data_gerada: string;
  tipo: string;
}

// 14. tb_pagamentos_parciais
export interface PagamentoParcial {
  ID_pagamento_parcial: number;
  valor: number;
  idpagamento: number;
  idprofessor: number;
  usuario: string;
  data_gerada: string;
  tipo: string;
}

// 15. tb_produtos
export interface Produto {
  ID_produto: number;
  produto: string;
  descricao: string | null;
  valor_custo: number | null;
  valor_venda: number | null;
  estoque: number | null;
  data_gerada: string;
  usuario: string;
}

// 16. tb_vendas
export interface Venda {
  ID_venda: number;
  produto: string | null;
  valor_total: number | null;
  quantidade: number | null;
  observacao: string | null;
  nome: string | null;
  idcliente: number | null;
  usuario: string;
  data_gerada: string;
  codigovenda: number;
  idproduto: number;
}

// 17. tb_usuarios
export interface Usuario {
  ID_usuario: number;
  nome_usuario: string;
  username: string;
  senha?: string; // Nunca retornado em respostas de API normais
  nivel_usuario: number; // Mapeado para os perfis funcionais
}

// 18. tb_contas (acesso do aluno)
export interface ContaAluno {
  ID_conta: number;
  cpf: string;
  senha?: string; // Nunca exposta
  idaluno: number;
}

// Tipos de Perfis Operacionais
export type UserRole = 
  | 'Administrador' 
  | 'Secretaria' 
  | 'Coordenação' 
  | 'Financeiro' 
  | 'Comercial' 
  | 'Aluno';

export interface AuthUser {
  id: number;
  nome: string;
  username: string;
  role: UserRole;
  isStudent?: boolean;
  studentId?: number;
  token?: string;
}

// Diagnóstico de Conexão e Banco
export interface DatabaseStatus {
  mode: 'mysql' | 'demo_local';
  connected: boolean;
  databaseName: string;
  tables: {
    name: string;
    count: number;
    description: string;
  }[];
  message: string;
}
