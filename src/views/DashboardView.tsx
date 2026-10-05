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
      <div className="p-8 flex items-center justify-center text-slate-500">
        <Clock className="w-5 h-5 animate-spin mr-2 text-indigo-600" />
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
    <div className="p-3.5 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header & Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Painel de Controle Escolar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas financeiras e acadêmicas apuradas em tempo real do banco <code className="font-mono text-indigo-600">dbinterdigitus</code>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('/academico/alunos')}
            className="flex-1 sm:flex-none px-3.5 py-2 sm:py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm min-h-[40px] flex items-center justify-center"
          >
            Novo Aluno
          </button>
          <button
            onClick={() => onNavigate('/financeiro/caixa')}
            className="flex-1 sm:flex-none px-3.5 py-2 sm:py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 min-h-[40px]"
            title="Abrir o Livro Caixa na mesma aba"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-600" />
            <span>Ver Livro Caixa</span>
          </button>
          <a
            href="/financeiro/receber-mensalidade"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none px-3.5 py-2 sm:py-1.5 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 min-h-[40px] shadow-2xs"
            title="Abrir Terminal de Recebimento de Mensalidades em uma nova aba dedicada"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-700" />
            <span>Receber Mensalidade (Nova Aba)</span>
            <ExternalLink className="w-3 h-3 text-emerald-600" />
          </a>
        </div>
      </div>

      {/* BLOCO 1: ENTRADAS DO CAIXA (DIA, SEMANA, MÊS) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Fluxo de Entradas do Caixa
            </h2>
          </div>
          {stats?.financeiro?.dataReferencia && (
            <span className="text-[11px] text-slate-500 font-medium">
              Data de Referência: <strong>{formatDateBR(stats.financeiro.dataReferencia)}</strong>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Entrada do Dia */}
          <div className="bg-white p-5 rounded-xl border border-emerald-200/80 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Entrada do Dia (Hoje)
              </span>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {stats?.financeiro?.qtdEntradasDia || 0} lançamentos
              </span>
            </div>
            <div className="text-3xl font-extrabold text-emerald-700 mt-3 tracking-tight">
              {formatMoney(stats?.financeiro?.entradasDia)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
              <span className="text-slate-500 font-medium">Recebido hoje</span>
              <button
                onClick={() => onNavigate('/financeiro/caixa')}
                className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
              >
                Conferir caixa <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 2. Entrada da Semana */}
          <div className="bg-white p-5 rounded-xl border border-blue-200/80 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-700">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                Entrada da Semana (Últimos 7 dias)
              </span>
              <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                {stats?.financeiro?.qtdEntradasSemana || 0} lançamentos
              </span>
            </div>
            <div className="text-3xl font-extrabold text-blue-700 mt-3 tracking-tight">
              {formatMoney(stats?.financeiro?.entradasSemana)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
              <span className="text-slate-500 font-medium">Últimos 7 dias corridos</span>
              <button
                onClick={() => onNavigate('/financeiro/caixa')}
                className="text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
              >
                Ver histórico <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 3. Entrada do Mês */}
          <div className="bg-white p-5 rounded-xl border border-indigo-200/80 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-all">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-700">
                <CalendarRange className="w-4 h-4 text-indigo-600" />
                Entrada do Mês Vigente
              </span>
              <span className="text-[11px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                {stats?.financeiro?.qtdEntradasMes || 0} lançamentos
              </span>
            </div>
            <div className="text-3xl font-extrabold text-indigo-700 mt-3 tracking-tight">
              {formatMoney(stats?.financeiro?.entradasMes)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
              <span className="text-slate-500 font-medium">Arrecadado neste mês</span>
              <button
                onClick={() => onNavigate('/financeiro/caixa')}
                className="text-indigo-700 hover:text-indigo-800 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
              >
                Auditar mês <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 2: VISÃO DE A RECEBER NO MÊS VIGENTE & INDICADORES GERAIS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Previsão de Recebimento · {getMesNome(stats?.financeiro?.mesReferencia)}
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/financeiro/mensalidades')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
          >
            <span>Ver Todas as Mensalidades</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Previsto a Receber no Mês */}
          <div className="bg-white p-4 rounded-xl border border-amber-200/90 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span className="font-semibold text-slate-800">Total Previsto no Mês</span>
              <CalendarClock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-900 mt-2">
              {formatMoney(totalPrevisto)}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
              <span className="font-semibold text-amber-800">{stats?.financeiro?.qtdContratosAReceberMes || 0}</span>
              <span>contratos ativos no mês</span>
            </div>
          </div>

          {/* Card 2: Restante Pendente a Receber no Mês */}
          <div className="bg-white p-4 rounded-xl border border-rose-200/90 shadow-xs relative overflow-hidden group hover:border-rose-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span className="font-semibold text-slate-800">A Receber no Mês Vigente</span>
              <Clock className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-700 mt-2">
              {formatMoney(restanteMes)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
              <span className="text-emerald-700 font-semibold">{formatMoney(entradasMes)}</span>
              <span>já recebidos</span>
            </div>
          </div>

          {/* Card 3: Alunos Cadastrados */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span className="font-semibold text-slate-800">Alunos Cadastrados</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.alunos?.total || 0}</div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
              <span className="text-emerald-700 font-semibold">{stats?.alunos?.ativos || 0} Ativos</span>
              <span aria-hidden="true">·</span>
              <span>{stats?.alunos?.concluidos || 0} Concluídos</span>
            </div>
          </div>

          {/* Card 4: Compromissos Docentes */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span className="font-semibold text-slate-800">Pendências Docentes</span>
              <Receipt className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {formatMoney(stats?.financeiro?.totalPendenciasProfessores)}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              <span>Compromissos docentes em aberto</span>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 3: DISTRIBUIÇÃO ACADÊMICA & DETALHAMENTO DE ARRECADAÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição por Cursos */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Distribuição de Alunos por Curso</h2>
              <p className="text-xs text-slate-500">Mapeamento acadêmico em tempo real</p>
            </div>
            <button
              onClick={() => onNavigate('/academico/cursos')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
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
                    <span className="font-medium text-slate-800">{curso}</span>
                    <span className="text-slate-500 font-mono">
                      {count} alunos ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visão de Arrecadação do Mês Vigente */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Progresso do Mês</span>
              </h2>
              <span className="text-xs font-bold text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded">
                {percentArrecadado}% recebido
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Comparativo entre o previsto e arrecadado em {getMesNome(stats?.financeiro?.mesReferencia)}
            </p>

            {/* Barra de Progresso Arrecadado vs Pendente */}
            <div className="space-y-2">
              <div className="w-full h-3 bg-rose-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${percentArrecadado}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 font-medium pt-1">
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Recebido: {formatMoney(entradasMes)}
                </span>
                <span className="flex items-center gap-1 text-rose-700">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  A Receber: {formatMoney(restanteMes)}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Previsão bruta do mês:</span>
                <span className="font-semibold text-slate-800 font-mono">{formatMoney(totalPrevisto)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Contratos com parcela no mês:</span>
                <span className="font-semibold text-slate-800 font-mono">{stats?.financeiro?.qtdContratosAReceberMes || 0} alunos</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Saldos devedores acumulados:</span>
                <span className="font-semibold text-slate-700 font-mono">{formatMoney(stats?.financeiro?.totalSaldosMensalidades)}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => onNavigate('/financeiro/mensalidades')}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors border border-indigo-200/60 flex items-center justify-center gap-1.5"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>Gerenciar Mensalidades & Contratos</span>
              </button>
              <button
                onClick={() => onNavigate('/financeiro/caixa')}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200 flex items-center justify-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Conferir Livro Caixa</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
