import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { UserRole } from '../../types/schema.js';
import { api } from '../../services/api.js';
import {
  GraduationCap,
  Database,
  LogOut,
  ChevronDown,
  UserCheck,
  ShieldAlert,
  Search,
  X,
  Users,
  User,
  Wallet,
  Receipt,
  ArrowRight,
  Menu,
} from 'lucide-react';
import { DbInspectorModal } from '../common/DbInspectorModal.js';

interface HeaderProps {
  currentPath: string;
  onNavigate?: (path: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate, onToggleMobileMenu }) => {
  const { user, logout, quickLoginAsRole } = useAuth();
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Busca Global
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{
    alunos: any[];
    usuarios: any[];
    financeiro: any[];
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setIsMobileSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!globalSearch.trim() || globalSearch.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.searchGlobal(globalSearch);
        setSearchResults(res);
        setIsSearchOpen(true);
      } catch (e) {
        console.error('Erro na busca global:', e);
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [globalSearch]);

  const handleSelectResult = (rota: string) => {
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    setGlobalSearch('');
    if (onNavigate) {
      onNavigate(rota);
    }
  };

  const roles: UserRole[] = [
    'Administrador',
    'Secretaria',
    'Coordenação',
    'Financeiro',
    'Comercial',
    'Aluno',
  ];

  const getBreadcrumb = (path: string) => {
    switch (path) {
      case '/':
        return 'Dashboard Geral';
      case '/academico/alunos':
        return 'Alunos';
      case '/academico/responsaveis':
        return 'Responsáveis';
      case '/academico/cursos':
        return 'Cursos';
      case '/academico/cursos-livres':
        return 'Cursos Livres';
      case '/academico/disciplinas':
        return 'Disciplinas';
      case '/academico/turmas':
        return 'Turmas';
      case '/academico/notas':
        return 'Notas';
      case '/financeiro/mensalidades':
        return 'Mensalidades';
      case '/financeiro/caixa':
        return 'Livro Caixa';
      case '/financeiro/despesas':
        return 'Despesas';
      case '/financeiro/pagamentos-professores':
        return 'Honorários Docentes';
      case '/financeiro/pagamentos-parciais':
        return 'Pagamentos Parciais';
      case '/comercial/produtos':
        return 'Produtos';
      case '/comercial/vendas':
        return 'Vendas (PDV)';
      case '/pessoas/professores':
        return 'Professores';
      case '/administracao/usuarios':
        return 'Usuários';
      case '/administracao/contas-alunos':
        return 'Contas Alunos';
      case '/administracao/auditoria-caixa':
        return 'Auditoria';
      case '/relatorios':
        return 'Relatórios';
      case '/portal-aluno':
        return 'Portal do Aluno';
      default:
        return 'Painel';
    }
  };

  const hasResults =
    searchResults &&
    (searchResults.alunos.length > 0 ||
      searchResults.usuarios.length > 0 ||
      searchResults.financeiro.length > 0);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 gap-2 sm:gap-4 shrink-0">
      {/* Esquerda: Botão Menu Mobile & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            title="Abrir menu lateral"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-800 font-semibold text-xs sm:text-sm truncate">
          <GraduationCap className="w-5 h-5 text-indigo-700 shrink-0" />
          <span className="hidden md:inline font-bold tracking-tight text-indigo-900">INTERDIGITUS</span>
          <span className="text-slate-300 hidden md:inline">/</span>
          <span className="text-slate-700 font-semibold text-xs sm:text-sm truncate max-w-[140px] sm:max-w-none">
            {getBreadcrumb(currentPath)}
          </span>
        </div>
      </div>

      {/* Centro: Mecanismo de Busca Global Desktop/Tablet */}
      <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar alunos, CPF, usuários ou lançamentos..."
            value={globalSearch}
            onChange={(e) => {
              setGlobalSearch(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-slate-900 placeholder:text-slate-400"
          />
          {globalSearch && (
            <button
              onClick={() => {
                setGlobalSearch('');
                setSearchResults(null);
                setIsSearchOpen(false);
              }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown de Resultados da Busca */}
        {isSearchOpen && globalSearch.trim().length >= 2 && (
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-xs animate-in fade-in max-h-96 overflow-y-auto">
            {searchLoading ? (
              <div className="p-4 text-center text-slate-400 text-xs">Pesquisando nas tabelas...</div>
            ) : !hasResults ? (
              <div className="p-4 text-center text-slate-500 text-xs">
                Nenhum registro encontrado para "<span className="font-semibold">{globalSearch}</span>".
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {/* 1. Alunos */}
                {searchResults!.alunos.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                      <span>Alunos Encontrados</span>
                    </div>
                    {searchResults!.alunos.map((item) => (
                      <button
                        key={`al-${item.id}`}
                        onClick={() => handleSelectResult(item.rota)}
                        className="w-full text-left px-2.5 py-2 hover:bg-blue-50/70 rounded-lg transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-blue-700">
                            {item.titulo}
                          </div>
                          <div className="text-[11px] text-slate-500">{item.subtitulo}</div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Usuários */}
                {searchResults!.usuarios.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Operadores & Usuários</span>
                    </div>
                    {searchResults!.usuarios.map((item) => (
                      <button
                        key={`us-${item.id}`}
                        onClick={() => handleSelectResult(item.rota)}
                        className="w-full text-left px-2.5 py-2 hover:bg-indigo-50/70 rounded-lg transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-indigo-700">
                            {item.titulo}
                          </div>
                          <div className="text-[11px] text-slate-500">{item.subtitulo}</div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {/* 3. Financeiro */}
                {searchResults!.financeiro.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Lançamentos Financeiros</span>
                    </div>
                    {searchResults!.financeiro.map((item) => (
                      <button
                        key={`fn-${item.id}`}
                        onClick={() => handleSelectResult(item.rota)}
                        className="w-full text-left px-2.5 py-2 hover:bg-emerald-50/70 rounded-lg transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-emerald-700">
                            {item.titulo}
                          </div>
                          <div className="text-[11px] text-slate-500">{item.subtitulo}</div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Direita: Ações, Perfil e Logout */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Botão de Busca Mobile (Ícone para telas menores que md) */}
        <button
          onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
          title="Buscar no sistema"
          aria-label="Buscar no sistema"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Inspetor de Banco */}
        <button
          onClick={() => setIsDbModalOpen(true)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors min-h-[44px]"
          title="Inspecionar as 18 tabelas"
        >
          <Database className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Inspetor BD</span>
        </button>

        {/* Alternador Rápido de Perfil para Teste de RBAC */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 transition-colors text-xs text-slate-800 font-medium min-h-[44px]"
            title="Alternar Perfil de Acesso (RBAC)"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <div className="text-left hidden sm:block">
              <span className="text-slate-500 text-[10px] block leading-none">Perfil</span>
              <span className="font-semibold text-slate-900">{user?.role}</span>
            </div>
            <span className="sm:hidden font-semibold text-[11px] text-slate-900 max-w-[65px] truncate">
              {user?.role}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in">
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
        <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-200">
          <div className="hidden xl:block text-right">
            <div className="text-xs font-semibold text-slate-900 leading-tight">{user?.nome}</div>
            <div className="text-[11px] text-slate-400 font-mono">@{user?.username}</div>
          </div>
          <button
            onClick={() => logout()}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Sair do sistema"
            aria-label="Sair do sistema"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Caixa de Busca Mobile Suspensa (< md) */}
      {isMobileSearchOpen && (
        <div
          ref={mobileSearchRef}
          className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-slate-200 p-3 shadow-xl z-40 animate-in slide-in-from-top-2"
        >
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Buscar alunos, CPF, financeiro..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Resultados da Busca Mobile */}
          {globalSearch.trim().length >= 2 && (
            <div className="mt-2 max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
              {searchLoading ? (
                <div className="p-3 text-center text-slate-400">Pesquisando...</div>
              ) : !hasResults ? (
                <div className="p-3 text-center text-slate-500">Nenhum resultado.</div>
              ) : (
                <>
                  {searchResults!.alunos.map((item) => (
                    <button
                      key={`m-al-${item.id}`}
                      onClick={() => handleSelectResult(item.rota)}
                      className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{item.titulo}</div>
                        <div className="text-[11px] text-slate-500">{item.subtitulo}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                  {searchResults!.financeiro.map((item) => (
                    <button
                      key={`m-fn-${item.id}`}
                      onClick={() => handleSelectResult(item.rota)}
                      className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{item.titulo}</div>
                        <div className="text-[11px] text-slate-500">{item.subtitulo}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}

      <DbInspectorModal isOpen={isDbModalOpen} onClose={() => setIsDbModalOpen(false)} />
    </header>
  );
};
