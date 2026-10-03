import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import {
  Users,
  GraduationCap,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  ShoppingBag,
  Package,
  Layers,
  FileCheck2,
  Receipt,
  Clock,
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
        <Clock className="w-5 h-5 animate-spin mr-2" />
        Carregando indicadores consolidados do dbinterdigitus...
      </div>
    );
  }

  const formatMoney = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Boas-Vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Painel de Controle Escolar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas apuradas a partir das 18 tabelas do banco de dados <code className="font-mono text-indigo-600">dbinterdigitus</code>
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
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Ver Livro Caixa
          </button>
        </div>
      </div>

      {/* Grid de Métricas Principais (Academico, Financeiro, Comercial) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Alunos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Alunos Cadastrados</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.alunos?.total || 0}</div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span className="text-emerald-700 font-medium">{stats?.alunos?.ativos || 0} Ativos</span>
            <span aria-hidden="true">·</span>
            <span>{stats?.alunos?.concluidos || 0} Concluídos</span>
          </div>
        </div>

        {/* Saldo Operacional do Caixa */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Saldo Líquido em Caixa</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {formatMoney(stats?.financeiro?.saldoCaixa)}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span className="text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              {formatMoney(stats?.financeiro?.entradasCaixa)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-rose-600 flex items-center">
              <ArrowDownRight className="w-3 h-3" />
              {formatMoney(stats?.financeiro?.saidasCaixa)}
            </span>
          </div>
        </div>

        {/* Saldos a Receber de Mensalidades (Legado) */}
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

        {/* Vendas & Pedidos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Vendas Realizadas</span>
            <ShoppingBag className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {formatMoney(stats?.comercial?.totalVendasValor)}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span>{stats?.comercial?.pedidosDistintos || 0} pedidos agrupados</span>
            <span aria-hidden="true">·</span>
            <span>{stats?.comercial?.totalItensVendidos || 0} itens</span>
          </div>
        </div>
      </div>

      {/* Linha 2: Distribuição por Cursos e Alertas de Estoque */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição por Cursos */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Distribuição de Alunos por Curso</h2>
              <p className="text-xs text-slate-500">Mapeamento em tempo real via tabela <code className="font-mono">tb_cursos</code></p>
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

        {/* Alertas de Estoque & Pendências Docentes */}
        <div className="space-y-4">
          {/* Card Alerta de Estoque */}
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Estoque Crítico</span>
              </h2>
              <button
                onClick={() => onNavigate('/comercial/produtos')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Gerenciar
              </button>
            </div>

            {stats?.comercial?.produtosEstoqueBaixo?.length > 0 ? (
              <div className="space-y-2">
                {stats.comercial.produtosEstoqueBaixo.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-amber-950 truncate max-w-[180px]">{p.produto}</span>
                    <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      {p.estoque} un
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Nenhum produto com estoque abaixo de 10 unidades.</p>
            )}
          </div>

          {/* Card Pendências Docentes */}
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Pendências Docentes (Legado)</h2>
            <p className="text-xs text-slate-500 mb-3">
              Soma dos campos <code className="font-mono">valor_pendente</code> em <code className="font-mono">tb_pagamentos</code>
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

      {/* Nota de Integridade do Sistema Legado */}
      <div className="p-4 bg-slate-100/80 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <Package className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-slate-800">Nota de Transparência e Validação do Banco</div>
          <p className="mt-0.5 leading-relaxed">
            Conforme as diretrizes arquiteturais do projeto Interdigitus, métricas avançadas que não são sustentadas pelas
            18 tabelas originais (como frequência diária, índice de inadimplência por parcela individualizada ou conciliação bancária externa)
            permanecem classificadas como <em>indisponíveis com os dados atuais</em> para evitar projeções enganosas.
          </p>
        </div>
      </div>
    </div>
  );
};
