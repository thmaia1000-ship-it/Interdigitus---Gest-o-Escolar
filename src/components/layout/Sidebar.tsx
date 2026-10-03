import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  BookOpen,
  GraduationCap,
  Library,
  School,
  FileCheck2,
  Receipt,
  Wallet,
  ArrowDownCircle,
  Briefcase,
  Layers,
  ShoppingBag,
  ShoppingCart,
  UserCheck,
  ShieldAlert,
  KeyRound,
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Menu,
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate }) => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('academico');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const isCurrent = (path: string) => currentPath === path;

  // Se o usuário for Aluno, mostrar menu específico do Portal do Aluno
  if (user?.role === 'Aluno') {
    return (
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
        <div className="h-16 px-5 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
          <GraduationCap className="w-6 h-6 text-indigo-400" />
          <div>
            <div className="font-bold text-sm tracking-tight text-white">INTERDIGITUS</div>
            <div className="text-[10px] text-indigo-400 uppercase tracking-widest font-mono">Portal do Aluno</div>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          <button
            onClick={() => onNavigate('/portal-aluno')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              isCurrent('/portal-aluno')
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Meu Prontuário & Notas</span>
          </button>
        </nav>
      </aside>
    );
  }

  return (
    <aside
      className={`bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 transition-all duration-200 select-none ${
        collapsed ? 'w-18' : 'w-68'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              ID
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-white leading-tight">INTERDIGITUS</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Gestão Escolar</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
            ID
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:block"
          title={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Nav Tree */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar text-xs">
        {/* 1. Dashboard */}
        <button
          onClick={() => onNavigate('/')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
            isCurrent('/')
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Dashboard Geral"
        >
          <LayoutDashboard className="w-4 h-4 shrink-0 text-indigo-400" />
          {!collapsed && <span>1. Dashboard</span>}
        </button>

        {/* 2. Acadêmico */}
        <div>
          <button
            onClick={() => toggleSection('academico')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors font-medium"
            title="Módulo Acadêmico"
          >
            <div className="flex items-center gap-3">
              <GraduationCap className="w-4 h-4 shrink-0 text-blue-400" />
              {!collapsed && <span>2. Acadêmico</span>}
            </div>
            {!collapsed && (
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${openSection === 'academico' ? 'rotate-180' : ''}`}
              />
            )}
          </button>

          {(!collapsed && openSection === 'academico') && (
            <div className="pl-7 pr-2 py-1 space-y-0.5 border-l border-slate-800 ml-4 my-1">
              <button
                onClick={() => onNavigate('/academico/alunos')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  isCurrent('/academico/alunos')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Alunos
              </button>
              <button
                onClick={() => onNavigate('/academico/responsaveis')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  isCurrent('/academico/responsaveis')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Responsáveis Financeiros
              </button>
              <button
                onClick={() => onNavigate('/academico/cursos')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  isCurrent('/academico/cursos')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Cursos Regulares
              </button>
              <button
                onClick={() => onNavigate('/academico/cursos-livres')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  isCurrent('/academico/cursos-livres')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Cursos Livres
              </button>
              <button
                onClick={() => onNavigate('/academico/disciplinas')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  isCurrent('/academico/disciplinas')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Disciplinas
              </button>
              <button
                onClick={() => onNavigate('/academico/turmas')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  isCurrent('/academico/turmas')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Turmas
              </button>
              <button
                onClick={() => onNavigate('/academico/notas')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  isCurrent('/academico/notas')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Notas & Médias
              </button>
            </div>
          )}
        </div>

        {/* 3. Financeiro */}
        <div>
          <button
            onClick={() => toggleSection('financeiro')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors font-medium"
            title="Módulo Financeiro"
          >
            <div className="flex items-center gap-3">
              <Receipt className="w-4 h-4 shrink-0 text-emerald-400" />
              {!collapsed && <span>3. Financeiro</span>}
            </div>
            {!collapsed && (
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${openSection === 'financeiro' ? 'rotate-180' : ''}`}
              />
            )}
          </button>

          {(!collapsed && openSection === 'financeiro') && (
            <div className="pl-7 pr-2 py-1 space-y-0.5 border-l border-slate-800 ml-4 my-1">
              <button
                onClick={() => onNavigate('/financeiro/caixa')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors flex items-center justify-between ${
                  isCurrent('/financeiro/caixa')
                    ? 'text-white font-semibold bg-emerald-600 shadow-xs'
                    : 'text-emerald-400 font-medium hover:text-emerald-300 hover:bg-slate-800/60'
                }`}
              >
                <span>Caixa (Recebimentos)</span>
                <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono">Alunos</span>
              </button>
              <button
                onClick={() => onNavigate('/financeiro/mensalidades')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  isCurrent('/financeiro/mensalidades')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Mensalidades & Contratos
              </button>
              <button
                onClick={() => onNavigate('/financeiro/despesas')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  isCurrent('/financeiro/despesas')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Despesas Operacionais
              </button>
              <button
                onClick={() => onNavigate('/financeiro/pagamentos-professores')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  isCurrent('/financeiro/pagamentos-professores')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Pagamentos Professores
              </button>
              <button
                onClick={() => onNavigate('/financeiro/pagamentos-parciais')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  isCurrent('/financeiro/pagamentos-parciais')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Pagamentos Parciais
              </button>
            </div>
          )}
        </div>

        {/* 4. Comercial */}
        <div>
          <button
            onClick={() => toggleSection('comercial')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors font-medium"
            title="Módulo Comercial"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4 shrink-0 text-amber-400" />
              {!collapsed && <span>4. Comercial</span>}
            </div>
            {!collapsed && (
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${openSection === 'comercial' ? 'rotate-180' : ''}`}
              />
            )}
          </button>

          {(!collapsed && openSection === 'comercial') && (
            <div className="pl-7 pr-2 py-1 space-y-0.5 border-l border-slate-800 ml-4 my-1">
              <button
                onClick={() => onNavigate('/comercial/produtos')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  isCurrent('/comercial/produtos')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Produtos / Estoque
              </button>
              <button
                onClick={() => onNavigate('/comercial/vendas')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  isCurrent('/comercial/vendas')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Vendas & Pedidos
              </button>
            </div>
          )}
        </div>

        {/* 5. Pessoas */}
        <button
          onClick={() => onNavigate('/pessoas/professores')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
            isCurrent('/pessoas/professores')
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Cadastro de Professores"
        >
          <Users className="w-4 h-4 shrink-0 text-cyan-400" />
          {!collapsed && <span>5. Pessoas (Professores)</span>}
        </button>

        {/* 6. Administração */}
        <div>
          <button
            onClick={() => toggleSection('administracao')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors font-medium"
            title="Administração e Auditoria"
          >
            <div className="flex items-center gap-3">
              <KeyRound className="w-4 h-4 shrink-0 text-rose-400" />
              {!collapsed && <span>6. Administração</span>}
            </div>
            {!collapsed && (
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${openSection === 'administracao' ? 'rotate-180' : ''}`}
              />
            )}
          </button>

          {(!collapsed && openSection === 'administracao') && (
            <div className="pl-7 pr-2 py-1 space-y-0.5 border-l border-slate-800 ml-4 my-1">
              <button
                onClick={() => onNavigate('/administracao/usuarios')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  isCurrent('/administracao/usuarios')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Usuários Internos
              </button>
              <button
                onClick={() => onNavigate('/administracao/contas-alunos')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  isCurrent('/administracao/contas-alunos')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Acesso de Alunos
              </button>
              <button
                onClick={() => onNavigate('/administracao/auditoria-caixa')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  isCurrent('/administracao/auditoria-caixa')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Auditoria do Caixa
              </button>
            </div>
          )}
        </div>

        {/* 7. Relatórios */}
        <button
          onClick={() => onNavigate('/relatorios')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
            isCurrent('/relatorios')
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Relatórios & Exportações"
        >
          <FileSpreadsheet className="w-4 h-4 shrink-0 text-violet-400" />
          {!collapsed && <span>7. Relatórios & CSV</span>}
        </button>

        {/* 8. Portal do Aluno */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            onClick={() => onNavigate('/portal-aluno')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              isCurrent('/portal-aluno')
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-indigo-300 hover:text-white hover:bg-indigo-950/40'
            }`}
            title="Portal Restrito do Aluno"
          >
            <ExternalLink className="w-4 h-4 shrink-0 text-indigo-400" />
            {!collapsed && <span>8. Portal do Aluno</span>}
          </button>
        </div>
      </nav>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-[11px] text-slate-500">
          <div>dbinterdigitus · MySQL 8.x</div>
          <div className="text-[10px] text-slate-600">18 tabelas operacionais</div>
        </div>
      )}
    </aside>
  );
};
