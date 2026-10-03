/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Header } from './components/layout/Header.js';
import { Sidebar } from './components/layout/Sidebar.js';

// Views
import { LoginView } from './views/LoginView.js';
import { DashboardView } from './views/DashboardView.js';
import { AlunosView } from './views/AlunosView.js';
import { ResponsaveisView } from './views/ResponsaveisView.js';
import { CursosView } from './views/CursosView.js';
import { CursosLivresView } from './views/CursosLivresView.js';
import { DisciplinasView } from './views/DisciplinasView.js';
import { TurmasView } from './views/TurmasView.js';
import { NotasView } from './views/NotasView.js';
import { MensalidadesView } from './views/MensalidadesView.js';
import { CaixaView } from './views/CaixaView.js';
import { AuditoriaCaixaView } from './views/AuditoriaCaixaView.js';
import { DespesasView } from './views/DespesasView.js';
import { ProfessoresView } from './views/ProfessoresView.js';
import { PagamentosProfessoresView } from './views/PagamentosProfessoresView.js';
import { PagamentosParciaisView } from './views/PagamentosParciaisView.js';
import { ProdutosView } from './views/ProdutosView.js';
import { VendasView } from './views/VendasView.js';
import { UsuariosView } from './views/UsuariosView.js';
import { ContasAlunosView } from './views/ContasAlunosView.js';
import { RelatoriosView } from './views/RelatoriosView.js';
import { PortalAlunoView } from './views/PortalAlunoView.js';

import { ShieldAlert, Clock } from 'lucide-react';
import { UserRole } from './types/schema.js';

function MainApp() {
  const { user, loading, hasPermission } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>('/');

  useEffect(() => {
    if (user?.role === 'Aluno') {
      setCurrentPath('/portal-aluno');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 animate-spin text-indigo-500" />
          <span className="text-sm font-medium">Iniciando sistema Interdigitus...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // Mapa de Permissões RBAC por rota
  const routePermissions: Record<string, UserRole[]> = {
    '/': ['Administrador', 'Secretaria', 'Coordenação', 'Financeiro', 'Comercial'],
    '/academico/alunos': ['Administrador', 'Secretaria', 'Coordenação', 'Financeiro'],
    '/academico/responsaveis': ['Administrador', 'Secretaria', 'Financeiro'],
    '/academico/cursos': ['Administrador', 'Secretaria', 'Coordenação'],
    '/academico/cursos-livres': ['Administrador', 'Secretaria', 'Coordenação'],
    '/academico/disciplinas': ['Administrador', 'Secretaria', 'Coordenação'],
    '/academico/turmas': ['Administrador', 'Secretaria', 'Coordenação'],
    '/academico/notas': ['Administrador', 'Secretaria', 'Coordenação'],
    '/financeiro/mensalidades': ['Administrador', 'Financeiro', 'Secretaria'],
    '/financeiro/caixa': ['Administrador', 'Financeiro'],
    '/financeiro/despesas': ['Administrador', 'Financeiro'],
    '/financeiro/pagamentos-professores': ['Administrador', 'Financeiro'],
    '/financeiro/pagamentos-parciais': ['Administrador', 'Financeiro'],
    '/comercial/produtos': ['Administrador', 'Comercial', 'Secretaria', 'Financeiro'],
    '/comercial/vendas': ['Administrador', 'Comercial', 'Financeiro'],
    '/pessoas/professores': ['Administrador', 'Secretaria', 'Coordenação', 'Financeiro'],
    '/administracao/usuarios': ['Administrador'],
    '/administracao/contas-alunos': ['Administrador', 'Secretaria'],
    '/administracao/auditoria-caixa': ['Administrador'],
    '/relatorios': ['Administrador', 'Secretaria', 'Coordenação', 'Financeiro', 'Comercial'],
    '/portal-aluno': ['Aluno', 'Administrador'],
  };

  const allowedRoles = routePermissions[currentPath] || ['Administrador'];
  const isAllowed = user.role === 'Administrador' || allowedRoles.includes(user.role);

  const renderContent = () => {
    if (!isAllowed) {
      return (
        <div className="p-12 max-w-md mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Acesso Restrito ao Módulo</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Seu perfil atual (<strong>{user.role}</strong>) não possui permissão para acessar o recurso{' '}
            <code className="font-mono text-indigo-600 bg-slate-100 px-1 py-0.5 rounded">{currentPath}</code>.
            Utilize o alternador de perfis no topo da tela para testar os outros níveis de acesso.
          </p>
          <button
            onClick={() => setCurrentPath('/')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            Voltar ao Dashboard
          </button>
        </div>
      );
    }

    switch (currentPath) {
      case '/':
        return <DashboardView onNavigate={setCurrentPath} />;
      case '/academico/alunos':
        return <AlunosView />;
      case '/academico/responsaveis':
        return <ResponsaveisView />;
      case '/academico/cursos':
        return <CursosView />;
      case '/academico/cursos-livres':
        return <CursosLivresView />;
      case '/academico/disciplinas':
        return <DisciplinasView />;
      case '/academico/turmas':
        return <TurmasView />;
      case '/academico/notas':
        return <NotasView />;
      case '/financeiro/mensalidades':
        return <MensalidadesView />;
      case '/financeiro/caixa':
        return <CaixaView />;
      case '/financeiro/despesas':
        return <DespesasView />;
      case '/financeiro/pagamentos-professores':
        return <PagamentosProfessoresView />;
      case '/financeiro/pagamentos-parciais':
        return <PagamentosParciaisView />;
      case '/comercial/produtos':
        return <ProdutosView />;
      case '/comercial/vendas':
        return <VendasView />;
      case '/pessoas/professores':
        return <ProfessoresView />;
      case '/administracao/usuarios':
        return <UsuariosView />;
      case '/administracao/contas-alunos':
        return <ContasAlunosView />;
      case '/administracao/auditoria-caixa':
        return <AuditoriaCaixaView />;
      case '/relatorios':
        return <RelatoriosView />;
      case '/portal-aluno':
        return <PortalAlunoView />;
      default:
        return <DashboardView onNavigate={setCurrentPath} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar currentPath={currentPath} onNavigate={setCurrentPath} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header currentPath={currentPath} onNavigate={setCurrentPath} />
        <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
