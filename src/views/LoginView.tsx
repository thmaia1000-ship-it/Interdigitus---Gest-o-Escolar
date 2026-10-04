import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { GraduationCap, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginInternal, loginStudent } = useAuth();
  const [tab, setTab] = useState<'operador' | 'aluno'>('operador');

  // Operador
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Aluno
  const [cpf, setCpf] = useState('');
  const [alunoPass, setAlunoPass] = useState('');

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
              Operador Interno
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
              Portal do Aluno
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
                  placeholder="Digite seu usuário..."
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
      </div>

      <div className="mt-4 text-xs text-slate-500 text-center">
        Banco MySQL de Referência: <code className="font-mono text-slate-400">dbinterdigitus (18 tabelas)</code>
      </div>
    </div>
  );
};
