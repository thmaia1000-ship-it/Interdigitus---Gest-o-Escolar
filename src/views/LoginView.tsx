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
    <div className="min-h-screen relative flex flex-col justify-center items-center p-4 system-bg-wrapper">
      {/* Container Principal Glassmorphism */}
      <div className="w-full max-w-md bg-slate-950/85 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-500/30 overflow-hidden shadow-blue-950/80">
        {/* Header Visual */}
        <div className="px-6 pt-8 pb-6 text-white text-center border-b border-slate-800/80 bg-gradient-to-b from-blue-950/40 to-transparent">
          <div className="flex justify-center items-center">
            <img
              src="/logo-login.png"
              alt="Master Escolar"
              className="h-20 sm:h-24 w-auto max-w-[240px] object-contain drop-shadow-lg transition-transform hover:scale-105 duration-200"
            />
          </div>
          <p className="text-xs text-blue-300 mt-3 font-semibold tracking-wide">
            Master Escolar - Sistema de Gestão Escolar
          </p>
        </div>

        {/* Segmented Control */}
        <div className="p-3 bg-slate-900/70 border-b border-slate-800/80">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/60">
            <button
              type="button"
              onClick={() => {
                setTab('operador');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'operador'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
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
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'aluno'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Portal do Aluno
            </button>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'operador' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome de Usuário</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900/90 text-white placeholder:text-slate-500 border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Senha de Acesso</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900/90 text-white placeholder:text-slate-500 border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">CPF do Aluno</label>
                <input
                  type="text"
                  required
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900/90 text-white placeholder:text-slate-500 border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Senha do Aluno</label>
                <input
                  type="password"
                  required
                  value={alunoPass}
                  onChange={(e) => setAlunoPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900/90 text-white placeholder:text-slate-500 border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 btn-primary-cepi text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
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

      <footer className="mt-6 text-xs text-blue-300/80 text-center font-medium tracking-wide">
        Desenvolvido por Br3Tech - Todos os direitos reservados
      </footer>
    </div>
  );
};
