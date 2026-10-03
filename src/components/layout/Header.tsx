import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { UserRole } from '../../types/schema.js';
import {
  GraduationCap,
  Database,
  LogOut,
  ChevronDown,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { DbInspectorModal } from '../common/DbInspectorModal.js';

interface HeaderProps {
  currentPath: string;
}

export const Header: React.FC<HeaderProps> = ({ currentPath }) => {
  const { user, logout, quickLoginAsRole } = useAuth();
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const roles: UserRole[] = [
    'Administrador',
    'Secretaria',
    'Coordenação',
    'Financeiro',
    'Comercial',
    'Aluno',
  ];

  const getBreadcrumb = (path: string) => {
    const map: Record<string, string> = {
      '/': 'Dashboard Geral',
      '/academico/alunos': 'Acadêmico / Alunos',
      '/academico/responsaveis': 'Acadêmico / Responsáveis Financeiros',
      '/academico/cursos': 'Acadêmico / Cursos Regulares',
      '/academico/cursos-livres': 'Acadêmico / Cursos Livres',
      '/academico/disciplinas': 'Acadêmico / Disciplinas',
      '/academico/turmas': 'Acadêmico / Turmas',
      '/academico/notas': 'Acadêmico / Lançamento de Notas',
      '/financeiro/mensalidades': 'Financeiro / Mensalidades & Planos',
      '/financeiro/caixa': 'Financeiro / Livro Caixa & Fluxo',
      '/financeiro/despesas': 'Financeiro / Despesas Operacionais',
      '/financeiro/pagamentos-professores': 'Financeiro / Compromissos Docentes',
      '/financeiro/pagamentos-parciais': 'Financeiro / Pagamentos Parciais',
      '/comercial/produtos': 'Comercial / Produtos & Estoque',
      '/comercial/vendas': 'Comercial / Vendas de Balcão',
      '/pessoas/professores': 'Pessoas / Cadastro de Professores',
      '/administracao/usuarios': 'Administração / Usuários Internos',
      '/administracao/contas-alunos': 'Administração / Contas de Alunos',
      '/administracao/auditoria-caixa': 'Administração / Auditoria do Caixa',
      '/relatorios': 'Relatórios & Exportações',
      '/portal-aluno': 'Portal Restrito do Aluno',
    };
    return map[path] || 'Interdigitus';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <GraduationCap className="w-5 h-5 text-indigo-700" />
          <span className="hidden sm:inline font-bold tracking-tight text-indigo-900">INTERDIGITUS</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-normal text-xs sm:text-sm">{getBreadcrumb(currentPath)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Indicador do Banco */}
        <button
          onClick={() => setIsDbModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
          title="Clique para importar dados e consultar o status do banco"
        >
          <Database className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden md:inline font-medium">Banco de Dados</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </button>

        {/* Alternador Rápido de Perfil para Teste de RBAC */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 transition-colors text-xs text-slate-800 font-medium"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <div className="text-left hidden sm:block">
              <span className="text-slate-500 text-[10px] block leading-none">Perfil Ativo</span>
              <span className="font-semibold text-slate-900">{user?.role}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                Alternar Perfil para Teste
              </div>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    quickLoginAsRole(r);
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    user?.role === r ? 'font-semibold text-indigo-600 bg-indigo-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>{r}</span>
                  {user?.role === r && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Usuário e Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="hidden lg:block text-right">
            <div className="text-xs font-semibold text-slate-900 leading-tight">{user?.nome}</div>
            <div className="text-[11px] text-slate-400 font-mono">@{user?.username}</div>
          </div>
          <button
            onClick={() => logout()}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Sair do sistema"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <DbInspectorModal isOpen={isDbModalOpen} onClose={() => setIsDbModalOpen(false)} />
    </header>
  );
};
