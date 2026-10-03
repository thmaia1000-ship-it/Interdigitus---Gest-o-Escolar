import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { FileSpreadsheet, Download, Printer, Filter, BookOpen, Receipt, Wallet, ShoppingBag, Users } from 'lucide-react';

export const RelatoriosView: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'alunos' | 'caixa' | 'mensalidades' | 'professores' | 'produtos'>('alunos');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [activeReport]);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (activeReport === 'alunos') {
        const res = await api.getAlunos({ limit: 100 });
        setData(res.data);
      } else if (activeReport === 'caixa') {
        const res = await api.getCaixa({ limit: 100 });
        setData(res.data);
      } else if (activeReport === 'mensalidades') {
        const res = await api.getMensalidades();
        setData(res);
      } else if (activeReport === 'professores') {
        const res = await api.getPagamentosProfessores();
        setData(res);
      } else if (activeReport === 'produtos') {
        const res = await api.getProdutos();
        setData(res);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val: number | null) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto print:p-0 print:space-y-4">
      {/* Header (Oculto na impressão) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Relatórios & Demonstrativos Oficiais</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geração de relatórios analíticos, exportações CSV neutralizadas e pré-visualização para impressão
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
          <a
            href={`/api/export/csv/${activeReport === 'caixa' ? 'caixa' : 'alunos'}`}
            download
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar CSV Seguro</span>
          </a>
        </div>
      </div>

      {/* Seletor de Tipo de Relatório (Print hidden) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 print:hidden text-xs">
        <button
          onClick={() => setActiveReport('alunos')}
          className={`p-3 rounded-xl border text-left transition-colors flex flex-col justify-between ${
            activeReport === 'alunos'
              ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4 mb-2 text-indigo-600" />
          <span>Alunos & Matrículas</span>
        </button>

        <button
          onClick={() => setActiveReport('caixa')}
          className={`p-3 rounded-xl border text-left transition-colors flex flex-col justify-between ${
            activeReport === 'caixa'
              ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Wallet className="w-4 h-4 mb-2 text-emerald-600" />
          <span>Extrato Geral de Caixa</span>
        </button>

        <button
          onClick={() => setActiveReport('mensalidades')}
          className={`p-3 rounded-xl border text-left transition-colors flex flex-col justify-between ${
            activeReport === 'mensalidades'
              ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Receipt className="w-4 h-4 mb-2 text-blue-600" />
          <span>Saldos de Mensalidades</span>
        </button>

        <button
          onClick={() => setActiveReport('professores')}
          className={`p-3 rounded-xl border text-left transition-colors flex flex-col justify-between ${
            activeReport === 'professores'
              ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-2 text-amber-600" />
          <span>Compromissos Docentes</span>
        </button>

        <button
          onClick={() => setActiveReport('produtos')}
          className={`p-3 rounded-xl border text-left transition-colors flex flex-col justify-between ${
            activeReport === 'produtos'
              ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ShoppingBag className="w-4 h-4 mb-2 text-rose-600" />
          <span>Posição de Estoque</span>
        </button>
      </div>

      {/* Relatório Imprimível / Visualizador */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-6 print:border-none print:shadow-none print:p-0">
        {/* Cabeçalho da Impressão */}
        <div className="border-b border-slate-200 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Interdigitus - Gestão Escolar</h2>
              <p className="text-xs text-slate-500">
                Relatório emitido em: {new Date().toLocaleDateString('pt-BR')} às{' '}
                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="text-right text-xs font-mono text-slate-500">
              <div>Fonte: dbinterdigitus</div>
              <div>Registros listados: {data.length}</div>
            </div>
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="overflow-x-auto">
          {activeReport === 'alunos' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ID / Código</th>
                  <th className="py-2.5 px-3">Nome do Aluno</th>
                  <th className="py-2.5 px-3">CPF</th>
                  <th className="py-2.5 px-3">Telefone</th>
                  <th className="py-2.5 px-3">Turno / Dias</th>
                  <th className="py-2.5 px-3">SISTEC</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((a: any) => (
                  <tr key={a.ID_aluno}>
                    <td className="py-2.5 px-3 font-mono">#{a.ID_aluno}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{a.nome_aluno}</td>
                    <td className="py-2.5 px-3 font-mono">{a.cpf || '-'}</td>
                    <td className="py-2.5 px-3">{a.telefone || '-'}</td>
                    <td className="py-2.5 px-3">{a.turno} · {a.dias_aula}</td>
                    <td className="py-2.5 px-3 font-mono">{a.sistec || '-'}</td>
                    <td className="py-2.5 px-3 font-medium">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'caixa' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ID / Data</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Forma</th>
                  <th className="py-2.5 px-3">Descrição</th>
                  <th className="py-2.5 px-3">Favorecido / Aluno</th>
                  <th className="py-2.5 px-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((c: any) => (
                  <tr key={c.ID_caixa}>
                    <td className="py-2.5 px-3 font-mono">#{c.ID_caixa} · {c.data}</td>
                    <td className="py-2.5 px-3 font-semibold">{c.tipo_movimentacao}</td>
                    <td className="py-2.5 px-3 font-mono">{c.forma}</td>
                    <td className="py-2.5 px-3">{c.descricao}</td>
                    <td className="py-2.5 px-3">{c.nome || '-'}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">{formatMoney(c.valor_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'mensalidades' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ID Plano</th>
                  <th className="py-2.5 px-3">Aluno</th>
                  <th className="py-2.5 px-3">Curso</th>
                  <th className="py-2.5 px-3">Parcelas</th>
                  <th className="py-2.5 px-3">Valor Total</th>
                  <th className="py-2.5 px-3 text-right">Saldo Devedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((m: any) => (
                  <tr key={m.ID_mensalidade}>
                    <td className="py-2.5 px-3 font-mono">#{m.ID_mensalidade}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{m.nome_aluno}</td>
                    <td className="py-2.5 px-3">{m.curso}</td>
                    <td className="py-2.5 px-3 font-mono">{m.parcelas_pagas || '0'} / {m.n_parcelas}</td>
                    <td className="py-2.5 px-3 font-mono">{formatMoney(m.valor_total)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                      {formatMoney(m.saldo_devedor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'professores' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Professor</th>
                  <th className="py-2.5 px-3">Matéria & Turma</th>
                  <th className="py-2.5 px-3">Carga Horária</th>
                  <th className="py-2.5 px-3">Total Contratado</th>
                  <th className="py-2.5 px-3 text-right">Saldo Pendente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((p: any) => (
                  <tr key={p.ID_pagamento}>
                    <td className="py-2.5 px-3 font-mono">#{p.ID_pagamento}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{p.professor}</td>
                    <td className="py-2.5 px-3">{p.materia} ({p.turma})</td>
                    <td className="py-2.5 px-3 font-mono">{p.carga_horaria}</td>
                    <td className="py-2.5 px-3 font-mono">{formatMoney(p.valor_total)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                      {formatMoney(p.valor_pendente)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'produtos' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Produto</th>
                  <th className="py-2.5 px-3">Descrição</th>
                  <th className="py-2.5 px-3">Estoque</th>
                  <th className="py-2.5 px-3 text-right">Preço Venda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((pr: any) => (
                  <tr key={pr.ID_produto}>
                    <td className="py-2.5 px-3 font-mono">#{pr.ID_produto}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{pr.produto}</td>
                    <td className="py-2.5 px-3 text-slate-500">{pr.descricao || '-'}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">{pr.estoque ?? 0} un</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatMoney(pr.valor_venda)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
