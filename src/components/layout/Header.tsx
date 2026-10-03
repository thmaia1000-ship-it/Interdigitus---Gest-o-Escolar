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
} from 'lucide-react';
import { DbInspectorModal } from '../common/DbInspectorModal.js';

interface HeaderProps {
  currentPath: string;
  onNavigate?: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate }) => {
  const { user, logout, quickLoginAsRole } = useAuth();
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
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
    const map: Record<string, string> = {
      '/': 'Dashboard Geral',
      '/academico/alunos': 'Acadêmico / Alunos',
      '/academico/responsaveis': 'Acadêmico / Responsáveis Financeiros',
      '/academico/cursos': 'Acadêmico / Cursos Regulares',
      '/academico/cursos-livres': 'Acadêmico / Cursos Livres',
      '/academico/disciplinas': 'Acadêmico / Disciplinas',
      '/academico/turmas': 'Acadêmico / Turmas',
      '/academico/notas': 'Acadêmico / Lançamento de Notas',
      '/financeiro/mensalidades': 'Financeiro / Mensalidades & Contratos',
      '/financeiro/caixa': 'Financeiro / Caixa (Recebimento de Mensalidades)',
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

  const hasResults =
    searchResults &&
    (searchResults.alunos.length > 0 ||
      searchResults.usuarios.length > 0 ||
      searchResults.financeiro.length > 0);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 gap-4">
      {/* Esquerda: Logo e Breadcrumb */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <GraduationCap className="w-5 h-5 text-indigo-700" />
          <span className="hidden xl:inline font-bold tracking-tight text-indigo-900">INTERDIGITUS</span>
          <span className="text-slate-300 hidden xl:inline">/</span>
          <span className="text-slate-600 font-normal text-xs sm:text-sm truncate max-w-[200px] sm:max-w-none">
            {getBreadcrumb(currentPath)}
          </span>
        </div>
      </div>

      {/* Centro: Mecanismo de Busca Global (Alunos, Usuários, Financeiro) */}
      <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por alunos, CPF, usuários ou caixa/financeiro..."
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

                {/* 3. Financeiro (Mensalidades e Caixa) */}
                {searchResults!.financeiro.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Financeiro & Caixa</span>
                    </div>
                    {searchResults!.financeiro.map((item) => (
                      <button
                        key={`fin-${item.id}-${item.titulo}`}
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

      {/* Direita: Banco, Perfil e Logout */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Indicador do Banco */}
        <button
          onClick={() => setIsDbModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
          title="Clique para importar dados e consultar o status do banco"
        >
          <Database className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden lg:inline font-medium">Banco</span>
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
          <div className="hidden xl:block text-right">
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
