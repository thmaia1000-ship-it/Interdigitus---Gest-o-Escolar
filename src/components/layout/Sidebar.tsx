import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
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
  X,
  School,
  Library,
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('academico');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleNavigate = (path: string) => {
    onNavigate(path);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const isCurrent = (path: string) => currentPath === path;

  // Renderizador do Conteúdo de Navegação (compartilhado entre desktop e gaveta móvel)
  const renderNavContent = (isMobile: boolean = false) => {
    const isExpanded = isMobile || !collapsed;

    if (user?.role === 'Aluno') {
      return (
        <nav className="p-3 space-y-1 flex-1">
          <button
            onClick={() => handleNavigate('/portal-aluno')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-medium transition-colors min-h-[44px] ${
              isCurrent('/portal-aluno')
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Meu Prontuário & Notas</span>
          </button>
        </nav>
      );
    }

    return (
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar text-xs">
        {/* 1. Dashboard */}
        <button
          onClick={() => handleNavigate('/')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors min-h-[44px] ${
            isCurrent('/')
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Dashboard Geral"
        >
          <LayoutDashboard className="w-4 h-4 shrink-0 text-indigo-400" />
          {isExpanded && <span>1. Dashboard</span>}
        </button>

        {/* 2. Acadêmico */}
        <div>
          <button
            onClick={() => toggleSection('academico')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors font-medium min-h-[44px]"
            title="Módulo Acadêmico"
          >
            <div className="flex items-center gap-3">
              <GraduationCap className="w-4 h-4 shrink-0 text-blue-400" />
              {isExpanded && <span>2. Acadêmico</span>}
            </div>
            {isExpanded && (
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${openSection === 'academico' ? 'rotate-180' : ''}`}
              />
            )}
          </button>

          {(isExpanded && openSection === 'academico') && (
            <div className="pl-7 pr-2 py-1 space-y-0.5 border-l border-slate-800 ml-4 my-1">
              <button
                onClick={() => handleNavigate('/academico/alunos')}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center ${
                  isCurrent('/academico/alunos')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Alunos
              </button>
              <button
                onClick={() => handleNavigate('/academico/responsaveis')}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center ${
                  isCurrent('/academico/responsaveis')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Responsáveis Financeiros
              </button>
              <button
                onClick={() => handleNavigate('/academico/cursos')}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center ${
                  isCurrent('/academico/cursos')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Cursos Regulares
              </button>
              <button
                onClick={() => handleNavigate('/academico/cursos-livres')}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center ${
                  isCurrent('/academico/cursos-livres')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Cursos Livres / Extensão
              </button>
              <button
                onClick={() => handleNavigate('/academico/disciplinas')}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center ${
                  isCurrent('/academico/disciplinas')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Disciplinas
              </button>
              <button
                onClick={() => handleNavigate('/academico/turmas')}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center ${
                  isCurrent('/academico/turmas')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Turmas & Salas
              </button>
              <button
                onClick={() => handleNavigate('/academico/notas')}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center ${
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
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors font-medium min-h-[44px]"
            title="Módulo Financeiro"
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-4 h-4 shrink-0 text-emerald-400" />
              {isExpanded && <span>3. Financeiro</span>}
            </div>
            {isExpanded && (
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${openSection === 'financeiro' ? 'rotate-180' : ''}`}
              />
            )}
          </button>

          {(isExpanded && openSection === 'financeiro') && (
            <div className="pl-7 pr-2 py-1 space-y-0.5 border-l border-slate-800 ml-4 my-1">
              <button
                onClick={() => handleNavigate('/financeiro/mensalidades')}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center ${
                  isCurrent('/financeiro/mensalidades')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Mensalidades Escolares
              </button>
              <button
                onClick={() => handleNavigate('/financeiro/caixa')}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center ${
                  isCurrent('/financeiro/caixa')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Livro Caixa
              </button>
              <a
                href="/financeiro/receber-mensalidade"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center justify-between text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/60 group"
                title="Abrir Terminal de Recebimento de Mensalidades em uma nova aba dedicada"
              >
                <span className="flex items-center gap-1.5 font-medium text-xs">
                  <span>Receber Mensalidade</span>
                  <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800/70 px-1 rounded font-mono">
                    Nova Aba
                  </span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <button
                onClick={() => handleNavigate('/financeiro/despesas')}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center ${
                  isCurrent('/financeiro/despesas')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Despesas Operacionais
              </button>
              <button
                onClick={() => handleNavigate('/financeiro/pagamentos-professores')}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center ${
                  isCurrent('/financeiro/pagamentos-professores')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Honorários Docentes
              </button>
              <button
                onClick={() => handleNavigate('/financeiro/pagamentos-parciais')}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center ${
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

        {/* 4. Pessoas & Docência */}
        <div>
          <button
            onClick={() => toggleSection('pessoas')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors font-medium min-h-[44px]"
            title="Corpo Docente"
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 shrink-0 text-amber-400" />
              {isExpanded && <span>4. Docência</span>}
            </div>
            {isExpanded && (
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${openSection === 'pessoas' ? 'rotate-180' : ''}`}
              />
            )}
          </button>

          {(isExpanded && openSection === 'pessoas') && (
            <div className="pl-7 pr-2 py-1 space-y-0.5 border-l border-slate-800 ml-4 my-1">
              <button
                onClick={() => handleNavigate('/pessoas/professores')}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center ${
                  isCurrent('/pessoas/professores')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Professores
              </button>
            </div>
          )}
        </div>

        {/* 5. Comercial & Vendas */}
        <div>
          <button
            onClick={() => toggleSection('comercial')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors font-medium min-h-[44px]"
            title="Módulo Comercial"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4 shrink-0 text-purple-400" />
              {isExpanded && <span>5. Comercial</span>}
            </div>
            {isExpanded && (
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${openSection === 'comercial' ? 'rotate-180' : ''}`}
              />
            )}
          </button>

          {(isExpanded && openSection === 'comercial') && (
            <div className="pl-7 pr-2 py-1 space-y-0.5 border-l border-slate-800 ml-4 my-1">
              <button
                onClick={() => handleNavigate('/comercial/produtos')}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center ${
                  isCurrent('/comercial/produtos')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Produtos & Livros
              </button>
              <button
                onClick={() => handleNavigate('/comercial/vendas')}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center ${
                  isCurrent('/comercial/vendas')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Balcão de Vendas (PDV)
              </button>
            </div>
          )}
        </div>

        {/* 6. Administração */}
        <div>
          <button
            onClick={() => toggleSection('admin')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors font-medium min-h-[44px]"
            title="Administração & Auditoria"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              {isExpanded && <span>6. Administração</span>}
            </div>
            {isExpanded && (
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${openSection === 'admin' ? 'rotate-180' : ''}`}
              />
            )}
          </button>

          {(isExpanded && openSection === 'admin') && (
            <div className="pl-7 pr-2 py-1 space-y-0.5 border-l border-slate-800 ml-4 my-1">
              <button
                onClick={() => handleNavigate('/administracao/usuarios')}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center ${
                  isCurrent('/administracao/usuarios')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Usuários do Sistema
              </button>
              <button
                onClick={() => handleNavigate('/administracao/contas-alunos')}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center ${
                  isCurrent('/administracao/contas-alunos')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Contas do Portal do Aluno
              </button>
              <button
                onClick={() => handleNavigate('/administracao/auditoria-caixa')}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors min-h-[40px] flex items-center ${
                  isCurrent('/administracao/auditoria-caixa')
                    ? 'text-white font-semibold bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Auditoria do Caixa (Log)
              </button>
            </div>
          )}
        </div>

        {/* 7. Relatórios & CSV */}
        <button
          onClick={() => handleNavigate('/relatorios')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors min-h-[44px] ${
            isCurrent('/relatorios')
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Relatórios & Exportações"
        >
          <FileSpreadsheet className="w-4 h-4 shrink-0 text-violet-400" />
          {isExpanded && <span>7. Relatórios & CSV</span>}
        </button>

        {/* 8. Portal do Aluno */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            onClick={() => handleNavigate('/portal-aluno')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors min-h-[44px] ${
              isCurrent('/portal-aluno')
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-indigo-300 hover:text-white hover:bg-indigo-950/40'
            }`}
            title="Portal Restrito do Aluno"
          >
            <ExternalLink className="w-4 h-4 shrink-0 text-indigo-400" />
            {isExpanded && <span>8. Portal do Aluno</span>}
          </button>
        </div>
      </nav>
    );
  };

  return (
    <>
      {/* 1. GAVETA MÓVEL PARA SMARTPHONES E TABLETS (< lg) */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop escurecido */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Painel lateral deslizante */}
          <aside className="relative w-72 max-w-[85vw] bg-[#02071a]/95 text-slate-300 flex flex-col h-full z-10 shadow-2xl border-r border-blue-950/60 animate-in slide-in-from-left duration-200">
            {/* Topo da Gaveta */}
            <div className="h-16 px-4 border-b border-blue-950/60 flex items-center justify-between bg-[#010412] shrink-0">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="Master Escolar"
                  className="h-9 w-auto max-w-[44px] object-contain shrink-0 drop-shadow-sm"
                />
                <div>
                  <div className="font-bold text-sm tracking-tight text-white leading-tight">Master Escolar</div>
                  <div className="text-[10px] text-blue-300/70 uppercase tracking-wider font-mono">Gestão Escolar</div>
                </div>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                title="Fechar menu"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo de Navegação Móvel */}
            {renderNavContent(true)}

            {/* Rodapé Móvel */}
            <div className="p-3 border-t border-blue-950/60 bg-[#010412]/90 text-[11px] text-slate-500 shrink-0 pb-[calc(env(safe-area-inset-bottom)+12px)]">
              <div className="font-medium text-slate-300">{user?.nome}</div>
              <div className="text-[10px] text-blue-400 font-mono">Desenvolvido por Br3Tech</div>
            </div>
          </aside>
        </div>
      )}

      {/* 2. SIDEBAR DESKTOP FIXA (>= lg) */}
      <aside
        className={`hidden lg:flex bg-[#02071a]/95 text-slate-300 flex-col shrink-0 border-r border-blue-950/60 transition-all duration-200 select-none ${
          collapsed ? 'w-18' : 'w-68'
        }`}
      >
        {/* Brand Header Desktop */}
        <div className="h-16 px-4 border-b border-blue-950/60 flex items-center justify-between bg-[#010412] shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Master Escolar"
                className="h-9 w-auto max-w-[44px] object-contain shrink-0 drop-shadow-sm"
              />
              <div>
                <div className="font-bold text-sm tracking-tight text-white leading-tight">Master Escolar</div>
                <div className="text-[10px] text-blue-300/70 uppercase tracking-wider font-mono">Gestão Escolar</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Master Escolar"
                className="h-8 w-auto max-w-[36px] object-contain drop-shadow-sm"
              />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navegação Desktop */}
        {renderNavContent(false)}

        {/* Rodapé Desktop */}
        {!collapsed && (
          <div className="p-3 border-t border-blue-950/60 bg-[#010412]/90 text-[11px] text-slate-400 shrink-0">
            <div className="font-semibold text-slate-200">Master Escolar</div>
            <div className="text-[10px] text-blue-300/70">Desenvolvido por Br3Tech</div>
          </div>
        )}
      </aside>
    </>
  );
};
