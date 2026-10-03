import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../types/schema.js';
import { GraduationCap, ShieldCheck, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginInternal, loginStudent, quickLoginAsRole } = useAuth();
  const [tab, setTab] = useState<'operador' | 'aluno'>('operador');

  // Operador
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');

  // Aluno
  const [cpf, setCpf] = useState('234.567.890-12');
  const [alunoPass, setAlunoPass] = useState('aluno123');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (tab === 'operador') {
        await loginInternal(username, password);
      } else {
        await loginStudent(cpf, alunoPass);
      }
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação. Verifique os dados informados.');
    } finally {
      setLoading(false);
    }
  };

  const testUsers: { role: UserRole; name: string; u: string; p: string }[] = [
    { role: 'Administrador', name: 'Administrador Geral', u: 'admin', p: 'admin123' },
    { role: 'Secretaria', name: 'Márcia Secretária', u: 'secretaria', p: 'sec123' },
    { role: 'Coordenação', name: 'Coordenação Pedagógica', u: 'coordenacao', p: 'coord123' },
    { role: 'Financeiro', name: 'Cláudia Financeiro', u: 'financeiro', p: 'fin123' },
    { role: 'Comercial', name: 'Marcos Balcão/Vendas', u: 'comercial', p: 'com123' },
    { role: 'Aluno', name: 'Camila Ferreira (Aluna)', u: '234.567.890-12', p: 'aluno123' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      {/* Container Principal */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Visual */}
        <div className="bg-indigo-950 p-6 text-white text-center border-b border-indigo-900/60">
          <div className="inline-flex p-3 bg-indigo-800/60 rounded-xl mb-3 border border-indigo-700/50">
            <GraduationCap className="w-8 h-8 text-indigo-300" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Interdigitus</h1>
          <p className="text-xs text-indigo-200/80 mt-1">
            Sistema de Gestão Escolar · Banco dbinterdigitus
          </p>
        </div>

        {/* Segmented Control */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setTab('operador');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-all ${
                tab === 'operador' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Operador Interno (tb_usuarios)
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('aluno');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-all ${
                tab === 'aluno' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Portal do Aluno (tb_contas)
            </button>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'operador' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome de Usuário</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: admin, secretaria, financeiro"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Senha de Acesso</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CPF do Aluno</label>
                <input
                  type="text"
                  required
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Senha do Aluno</label>
                <input
                  type="password"
                  required
                  value={alunoPass}
                  onChange={(e) => setAlunoPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Acesso Rápido para Avaliação e Demonstração */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Acesso Rápido por Perfil (1 Clique):</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {testUsers.map((t) => (
              <button
                key={t.role}
                type="button"
                onClick={() => quickLoginAsRole(t.role)}
                className="p-1.5 text-left bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-md transition-all text-[11px] text-slate-700"
              >
                <div className="font-semibold text-slate-900">{t.role}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{t.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-500 text-center">
        Banco MySQL de Referência: <code className="font-mono text-slate-400">dbinterdigitus (18 tabelas)</code>
      </div>
    </div>
  );
};
