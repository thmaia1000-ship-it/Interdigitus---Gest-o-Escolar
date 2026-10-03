import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { GraduationCap, BookOpen, Receipt, Clock, CheckCircle2, User, Phone, Mail } from 'lucide-react';

export const PortalAlunoView: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPortalAlunoDados()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const formatMoney = (val: number | null) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center text-slate-500 text-xs">
        <Clock className="w-5 h-5 animate-spin mr-2" />
        Carregando informações do aluno no dbinterdigitus...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-3">
        <div className="text-rose-600 font-bold text-sm">Acesso Restrito ao Portal do Aluno</div>
        <p className="text-xs text-slate-500">
          {error || 'Para visualizar este portal, você deve estar autenticado como Aluno via CPF e senha.'}
        </p>
      </div>
    );
  }

  const { perfil, notas, mensalidades } = data;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Banner de Boas-Vindas do Aluno */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {perfil.nome_aluno?.charAt(0)}
          </div>
          <div>
            <div className="text-xs text-indigo-400 font-mono uppercase tracking-wider">Portal do Aluno</div>
            <h1 className="text-lg font-bold tracking-tight">{perfil.nome_aluno}</h1>
            <div className="text-xs text-slate-400 mt-0.5">
              Matrícula ID #{perfil.ID_aluno} · CPF: {perfil.cpf}
            </div>
          </div>
        </div>
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {perfil.status}
          </span>
        </div>
      </div>

      {/* Grid de Informações Acadêmicas do Aluno */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-slate-500 text-xs font-medium">Curso Matriculado</div>
          <div className="text-sm font-bold text-slate-900 mt-1">{perfil.curso}</div>
          <div className="text-xs text-slate-500 mt-2 font-mono">
            {perfil.turno || '-'} ({perfil.dias_aula || '-'})
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-slate-500 text-xs font-medium">Carga Horária Total</div>
          <div className="text-sm font-bold text-slate-900 mt-1">{perfil.carga_horaria || '1600h'}</div>
          <div className="text-xs text-slate-500 mt-2 font-mono">
            Início: {perfil.inicio_curso || '-'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-slate-500 text-xs font-medium">Contato Cadastrado</div>
          <div className="text-xs text-slate-800 font-semibold mt-1 truncate">{perfil.email || 'Sem e-mail'}</div>
          <div className="text-xs text-slate-500 mt-2 font-mono">{perfil.telefone || 'Sem telefone'}</div>
        </div>
      </div>

      {/* Seção 1: Minhas Notas & Avaliações */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Meu Histórico de Notas & Aproveitamento
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">{notas?.length || 0} disciplina(s)</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5">Disciplina</th>
              <th className="px-4 py-2.5">Nota 1</th>
              <th className="px-4 py-2.5">Nota 2</th>
              <th className="px-4 py-2.5">Média Final</th>
              <th className="px-4 py-2.5">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {!notas || notas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma nota lançada até o momento.
                </td>
              </tr>
            ) : (
              notas.map((n: any) => (
                <tr key={n.ID_nota} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{n.materia}</td>
                  <td className="px-4 py-3 font-mono">{n.nota1 || '-'}</td>
                  <td className="px-4 py-3 font-mono">{n.nota2 || '-'}</td>
                  <td className="px-4 py-3 font-mono font-bold text-indigo-700">{n.media || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-medium ${
                        n.situacao === 'Aprovado'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : n.situacao === 'Exame'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {n.situacao || 'Em curso'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Seção 2: Meu Demonstrativo Financeiro */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Meu Plano de Mensalidades & Quitações
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {mensalidades?.length || 0} contrato(s)
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5">Contrato</th>
              <th className="px-4 py-2.5">Curso</th>
              <th className="px-4 py-2.5">Parcelas Quitadas</th>
              <th className="px-4 py-2.5">Valor da Parcela</th>
              <th className="px-4 py-2.5 text-right">Saldo Devedor Restante</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {!mensalidades || mensalidades.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Nenhum registro financeiro vinculado.
                </td>
              </tr>
            ) : (
              mensalidades.map((m: any) => (
                <tr key={m.ID_mensalidade} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-medium">#{m.ID_mensalidade}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{m.curso}</td>
                  <td className="px-4 py-3 font-mono">
                    <span className="font-bold text-emerald-700">{m.parcelas_pagas || '0'}</span> de{' '}
                    {m.n_parcelas} parcelas
                  </td>
                  <td className="px-4 py-3 font-mono">{formatMoney(m.valor_parcela)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                    {formatMoney(m.saldo_devedor)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
