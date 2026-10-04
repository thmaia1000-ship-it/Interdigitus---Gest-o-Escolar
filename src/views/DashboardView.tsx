import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import {
  Users,
  GraduationCap,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Clock,
  Calendar,
  CalendarDays,
  CalendarRange,
  ShoppingBag,
  ArrowRight,
  CircleDollarSign,
  TrendingUp,
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Painel de Controle Escolar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas financeiras e acadêmicas apuradas em tempo real do banco <code className="font-mono text-indigo-600">dbinterdigitus</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/academico/alunos')}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            Novo Aluno
          </button>
          <button
            onClick={() => onNavigate('/financeiro/caixa')}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Wallet className="w-3.5 h-3.5 text-slate-600" />
            <span>Ver Livro Caixa</span>
          </button>
        </div>
      </div>

      {/* BLOCO PRINCIPAL: ENTRADAS DO CAIXA (DIA, SEMANA, MÊS) */}
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
              <span className="text-slate-500 font-medium">Recebido na data</span>
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
              <span className="text-slate-500 font-medium">Acumulado dos últimos 7 dias</span>
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
              <span className="text-slate-500 font-medium">Total recebido no mês</span>
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

      {/* Grid Secundário: Indicadores Gerais Consolidados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Alunos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Alunos Cadastrados</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.alunos?.total || 0}</div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span className="text-emerald-700 font-semibold">{stats?.alunos?.ativos || 0} Ativos</span>
            <span aria-hidden="true">·</span>
            <span>{stats?.alunos?.concluidos || 0} Concluídos</span>
          </div>
        </div>

        {/* Saldo Líquido Total Acumulado em Caixa */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Saldo Líquido em Caixa</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {formatMoney(stats?.financeiro?.saldoCaixa)}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span className="text-emerald-600 flex items-center font-medium">
              <ArrowUpRight className="w-3 h-3" />
              {formatMoney(stats?.financeiro?.entradasCaixa)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-rose-600 flex items-center font-medium">
              <ArrowDownRight className="w-3 h-3" />
              {formatMoney(stats?.financeiro?.saidasCaixa)}
            </span>
          </div>
        </div>

        {/* Saldos devedores de Mensalidades */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Saldos de Mensalidades</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {formatMoney(stats?.financeiro?.totalSaldosMensalidades)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 truncate">
            Soma dos campos <code className="font-mono">saldo_devedor</code> do legado
          </div>
        </div>

        {/* Vendas & Pedidos Realizados */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Vendas Realizadas</span>
            <ShoppingBag className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {formatMoney(stats?.comercial?.totalVendasValor)}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span>{stats?.comercial?.pedidosDistintos || 0} pedidos</span>
            <span aria-hidden="true">·</span>
            <span>{stats?.comercial?.totalItensVendidos || 0} itens</span>
          </div>
        </div>
      </div>

      {/* Linha Inferior: Distribuição por Cursos e Gestão Financeira */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição por Cursos */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200">
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

        {/* Resumo Financeiro & Compromissos Docentes */}
        <div className="space-y-4">
          {/* Card Comparativo de Entradas */}
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Comparativo de Entradas</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">Evolução dos recebimentos no caixa</p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Dia (Hoje)</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {formatMoney(stats?.financeiro?.entradasDia)}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(((stats?.financeiro?.entradasDia || 0) / (stats?.financeiro?.entradasSemana || 1)) * 100)
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Semana (7 dias)</span>
                  <span className="font-bold text-blue-700 font-mono">
                    {formatMoney(stats?.financeiro?.entradasSemana)}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(((stats?.financeiro?.entradasSemana || 0) / (stats?.financeiro?.entradasMes || 1)) * 100)
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Mês Vigente</span>
                  <span className="font-bold text-indigo-700 font-mono">
                    {formatMoney(stats?.financeiro?.entradasMes)}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => onNavigate('/financeiro/caixa')}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200 flex items-center justify-center gap-1.5"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Abrir Livro Caixa Completo</span>
              </button>
            </div>
          </div>

          {/* Card Pendências Docentes */}
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Pendências Docentes</h2>
            <p className="text-xs text-slate-500 mb-3">
              Total acumulado em aberto de compromissos com professores
            </p>
            <div className="text-xl font-bold text-slate-900">
              {formatMoney(stats?.financeiro?.totalPendenciasProfessores)}
            </div>
            <div className="mt-3">
              <button
                onClick={() => onNavigate('/financeiro/pagamentos-professores')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Ver Compromissos Docentes &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
