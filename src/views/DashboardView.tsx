import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import {
  Users,
  Calendar,
  CalendarDays,
  CalendarRange,
  Clock,
  ArrowRight,
  CircleDollarSign,
  TrendingUp,
  Receipt,
  CheckCircle2,
  CalendarClock,
  ArrowUpRight,
  ExternalLink,
  UserPlus,
} from 'lucide-react';

export const DashboardView: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboardStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-blue-200">
        <Clock className="w-5 h-5 animate-spin mr-2 text-blue-400" />
        Carregando indicadores consolidados do dbinterdigitus...
      </div>
    );
  }

  const formatMoney = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDateBR = (isoDate?: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoDate;
  };

  const getMesNome = (mesAno?: string) => {
    if (!mesAno) return 'Mês Vigente';
    const [ano, mes] = mesAno.split('-');
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const idx = parseInt(mes, 10) - 1;
    if (idx >= 0 && idx < 12) {
      return `${meses[idx]} de ${ano}`;
    }
    return mesAno;
  };

  const totalPrevisto = stats?.financeiro?.totalPrevistoMesVigente || 0;
  const entradasMes = stats?.financeiro?.entradasMes || 0;
  const restanteMes = stats?.financeiro?.restanteAReceberMes || 0;
  const percentArrecadado = totalPrevisto > 0 ? Math.min(100, Math.round((entradasMes / totalPrevisto) * 100)) : 0;

  return (
    <div className="min-h-full p-3.5 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto system-bg-wrapper text-slate-100 relative rounded-2xl border border-blue-900/40 shadow-2xl overflow-hidden my-2">
      {/* Header & Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 relative z-10">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Painel de Controle Escolar</span>
          </h1>
          <p className="text-xs text-blue-200/80 mt-1">
            Métricas financeiras e acadêmicas apuradas em tempo real do banco <code className="font-mono text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40">dbinterdigitus</code>
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('/academico/alunos')}
            className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md min-h-[40px] flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Aluno</span>
          </button>
          <a
            href="/financeiro/receber-mensalidade"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none px-4 py-2 btn-gold-cepi text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 min-h-[40px]"
            title="Abrir Terminal de Recebimento de Mensalidades em uma nova aba dedicada"
          >
            <Receipt className="w-4 h-4" />
            <span>Receber Mensalidade</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>
      </div>

      {/* BLOCO 1: ENTRADAS DO CAIXA (DIA, SEMANA, MÊS) */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
              Fluxo de Entradas do Caixa
            </h2>
          </div>
          {stats?.financeiro?.dataReferencia && (
            <span className="text-[11px] text-blue-200/70 font-medium">
              Data de Referência: <strong className="text-white">{formatDateBR(stats.financeiro.dataReferencia)}</strong>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Entrada do Dia */}
          <div className="bg-slate-950/80 backdrop-blur-xl p-5 rounded-2xl border border-emerald-500/30 shadow-xl shadow-blue-950/70 relative overflow-hidden group hover:border-emerald-400/50 transition-all">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 shadow-sm shadow-emerald-500"></div>
            <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-200">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Entrada do Dia (Hoje)
              </span>
              <span className="text-[11px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold px-2 py-0.5 rounded-full">
                {stats?.financeiro?.qtdEntradasDia || 0} lançamentos
              </span>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-3 tracking-tight drop-shadow-xs">
              {formatMoney(stats?.financeiro?.entradasDia)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
              <span className="text-slate-400 font-medium">Recebido hoje</span>
              <button
                onClick={() => onNavigate('/financeiro/caixa')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
              >
                Conferir caixa <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 2. Entrada da Semana */}
          <div className="bg-slate-950/80 backdrop-blur-xl p-5 rounded-2xl border border-blue-500/30 shadow-xl shadow-blue-950/70 relative overflow-hidden group hover:border-blue-400/50 transition-all">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 shadow-sm shadow-blue-500"></div>
            <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-200">
                <CalendarDays className="w-4 h-4 text-blue-400" />
                Entrada da Semana (Últimos 7 dias)
              </span>
              <span className="text-[11px] bg-blue-950/80 text-blue-300 border border-blue-500/40 font-bold px-2 py-0.5 rounded-full">
                {stats?.financeiro?.qtdEntradasSemana || 0} lançamentos
              </span>
            </div>
            <div className="text-3xl font-extrabold text-blue-400 mt-3 tracking-tight drop-shadow-xs">
              {formatMoney(stats?.financeiro?.entradasSemana)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
              <span className="text-slate-400 font-medium">Últimos 7 dias corridos</span>
              <button
                onClick={() => onNavigate('/financeiro/caixa')}
                className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
              >
                Ver histórico <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 3. Entrada do Mês */}
          <div className="bg-slate-950/80 backdrop-blur-xl p-5 rounded-2xl border border-indigo-500/30 shadow-xl shadow-blue-950/70 relative overflow-hidden group hover:border-indigo-400/50 transition-all">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 shadow-sm shadow-indigo-500"></div>
            <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-200">
                <CalendarRange className="w-4 h-4 text-indigo-400" />
                Entrada do Mês Vigente
              </span>
              <span className="text-[11px] bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 font-bold px-2 py-0.5 rounded-full">
                {stats?.financeiro?.qtdEntradasMes || 0} lançamentos
              </span>
            </div>
            <div className="text-3xl font-extrabold text-indigo-400 mt-3 tracking-tight drop-shadow-xs">
              {formatMoney(stats?.financeiro?.entradasMes)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
              <span className="text-slate-400 font-medium">Arrecadado neste mês</span>
              <button
                onClick={() => onNavigate('/financeiro/caixa')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
              >
                Auditar mês <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 2: VISÃO DE A RECEBER NO MÊS VIGENTE & INDICADORES GERAIS */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
              Previsão de Recebimento · {getMesNome(stats?.financeiro?.mesReferencia)}
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/financeiro/mensalidades')}
            className="text-xs text-blue-300 hover:text-blue-200 font-semibold flex items-center gap-1"
          >
            <span>Ver Todas as Mensalidades</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Previsto a Receber no Mês */}
          <div className="bg-slate-950/80 backdrop-blur-xl p-4 rounded-2xl border border-amber-500/30 shadow-xl shadow-blue-950/60 relative overflow-hidden group hover:border-amber-400/50 transition-all">
            <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
              <span className="font-semibold text-slate-200">Total Previsto no Mês</span>
              <CalendarClock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400 mt-2">
              {formatMoney(totalPrevisto)}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
              <span className="font-semibold text-amber-300">{stats?.financeiro?.qtdContratosAReceberMes || 0}</span>
              <span>contratos ativos no mês</span>
            </div>
          </div>

          {/* Card 2: Restante Pendente a Receber no Mês */}
          <div className="bg-slate-950/80 backdrop-blur-xl p-4 rounded-2xl border border-rose-500/30 shadow-xl shadow-blue-950/60 relative overflow-hidden group hover:border-rose-400/50 transition-all">
            <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
              <span className="font-semibold text-slate-200">A Receber no Mês Vigente</span>
              <Clock className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-extrabold text-rose-400 mt-2">
              {formatMoney(restanteMes)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
              <span className="text-emerald-400 font-semibold">{formatMoney(entradasMes)}</span>
              <span>já recebidos</span>
            </div>
          </div>

          {/* Card 3: Alunos Cadastrados */}
          <div className="bg-slate-950/80 backdrop-blur-xl p-4 rounded-2xl border border-blue-500/25 shadow-xl shadow-blue-950/60">
            <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
              <span className="font-semibold text-slate-200">Alunos Cadastrados</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-2">{stats?.alunos?.total || 0}</div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
              <span className="text-emerald-400 font-semibold">{stats?.alunos?.ativos || 0} Ativos</span>
              <span aria-hidden="true">·</span>
              <span>{stats?.alunos?.concluidos || 0} Concluídos</span>
            </div>
          </div>

          {/* Card 4: Compromissos Docentes */}
          <div className="bg-slate-950/80 backdrop-blur-xl p-4 rounded-2xl border border-purple-500/30 shadow-xl shadow-blue-950/60">
            <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
              <span className="font-semibold text-slate-200">Pendências Docentes</span>
              <Receipt className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-purple-300 mt-2">
              {formatMoney(stats?.financeiro?.totalPendenciasProfessores)}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              <span>Compromissos docentes em aberto</span>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 3: DISTRIBUIÇÃO ACADÊMICA & DETALHAMENTO DE ARRECADAÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Distribuição por Cursos */}
        <div className="lg:col-span-2 bg-slate-950/80 backdrop-blur-xl p-5 rounded-2xl border border-blue-500/25 shadow-xl shadow-blue-950/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Distribuição de Alunos por Curso</h2>
              <p className="text-xs text-blue-200/70">Mapeamento acadêmico em tempo real</p>
            </div>
            <button
              onClick={() => onNavigate('/academico/cursos')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              Ver Cursos
            </button>
          </div>

          <div className="space-y-3">
            {Object.entries(stats?.alunos?.porCurso || {}).map(([curso, count]: any) => {
              const total = stats?.alunos?.total || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={curso} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-200">{curso}</span>
                    <span className="text-blue-300/80 font-mono">
                      {count} alunos ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visão de Arrecadação do Mês Vigente */}
        <div className="space-y-4">
          <div className="bg-slate-950/80 backdrop-blur-xl p-5 rounded-2xl border border-blue-500/25 shadow-xl shadow-blue-950/60">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span>Progresso do Mês</span>
              </h2>
              <span className="text-xs font-bold text-blue-300 font-mono bg-blue-950/80 border border-blue-800/40 px-2 py-0.5 rounded">
                {percentArrecadado}% recebido
              </span>
            </div>
            <p className="text-xs text-blue-200/70 mb-4">
              Comparativo entre o previsto e arrecadado em {getMesNome(stats?.financeiro?.mesReferencia)}
            </p>

            {/* Barra de Progresso Arrecadado vs Pendente */}
            <div className="space-y-2">
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500 shadow-xs shadow-emerald-500"
                  style={{ width: `${percentArrecadado}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] font-medium pt-1">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Recebido: {formatMoney(entradasMes)}
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  A Receber: {formatMoney(restanteMes)}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Previsão bruta do mês:</span>
                <span className="font-semibold text-white font-mono">{formatMoney(totalPrevisto)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Contratos com parcela no mês:</span>
                <span className="font-semibold text-white font-mono">{stats?.financeiro?.qtdContratosAReceberMes || 0} alunos</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Saldos devedores acumulados:</span>
                <span className="font-semibold text-slate-300 font-mono">{formatMoney(stats?.financeiro?.totalSaldosMensalidades)}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
              <button
                onClick={() => onNavigate('/financeiro/mensalidades')}
                className="w-full py-2 bg-blue-950/60 hover:bg-blue-900/60 text-blue-200 text-xs font-semibold rounded-xl transition-colors border border-blue-800/50 flex items-center justify-center gap-1.5"
              >
                <CalendarClock className="w-3.5 h-3.5 text-blue-400" />
                <span>Gerenciar Mensalidades & Contratos</span>
              </button>
              <button
                onClick={() => onNavigate('/financeiro/caixa')}
                className="w-full py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-colors border border-slate-700/60 flex items-center justify-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5 text-slate-400" />
                <span>Conferir Livro Caixa</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
