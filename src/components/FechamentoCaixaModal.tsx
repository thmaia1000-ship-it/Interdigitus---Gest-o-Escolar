import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  Printer,
  X,
  Calendar,
  User,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  FileText,
  ShieldCheck,
} from 'lucide-react';

interface FechamentoCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  initialOperator?: string;
}

export const FechamentoCaixaModal: React.FC<FechamentoCaixaModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  initialOperator,
}) => {
  const [dataFechamento, setDataFechamento] = useState(initialDate || '2026-10-03');
  const [operador, setOperador] = useState(initialOperator || 'ERICA');
  const [fundoTroco, setFundoTroco] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (initialDate) setDataFechamento(initialDate);
    if (initialOperator) setOperador(initialOperator);
  }, [initialDate, initialOperator]);

  useEffect(() => {
    if (!isOpen) return;
    carregarFechamento();
  }, [isOpen, dataFechamento, operador, fundoTroco]);

  const carregarFechamento = async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await api.getFechamentoCaixa({
        data: dataFechamento,
        usuario: operador,
        fundo_troco: fundoTroco,
      });
      setDados(res);
      // Se o operador atual não estiver definido e a API retornar a lista, seleciona o primeiro com movimentos
      if (!operador && res.operadoresDisponiveis && res.operadoresDisponiveis.length > 0) {
        setOperador(res.operadoresDisponiveis[0]);
      }
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar dados do fechamento.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatMoney = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDateBR = (isoDate?: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoDate;
  };

  const formatDateTimeBR = (isoDateTime?: string) => {
    if (!isoDateTime) return '';
    try {
      const d = new Date(isoDateTime);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoDateTime;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* CSS Injetado exclusivo para impressão perfeita */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-fechamento-caixa, #printable-fechamento-caixa * {
            visibility: visible;
          }
          #printable-fechamento-caixa {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 15px 20px;
            background: white !important;
            color: #0f172a !important;
            font-size: 11px !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Topo do Modal (Controles no ecrã - oculto na impressão) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  Fechamento de Caixa do Operador
                </h2>
                <p className="text-xs text-slate-500">
                  Emissão de comprovante oficial para conferência e prestação de contas
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading || !dados}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Fechamento (Ctrl+P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Filtros e Configuração do Fechamento (Oculta na impressão) */}
        <div className="p-4 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center gap-3 text-xs no-print">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-700">Data do Movimento:</span>
            <input
              type="date"
              value={dataFechamento}
              onChange={(e) => setDataFechamento(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-700">Operador:</span>
            <select
              value={operador}
              onChange={(e) => setOperador(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white font-medium"
            >
              <option value="TODOS">Todos os Operadores</option>
              {dados?.operadoresDisponiveis?.map((op: string) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-700">Fundo de Troco (R$):</span>
            <input
              type="number"
              step="10"
              min="0"
              value={fundoTroco}
              onChange={(e) => setFundoTroco(Number(e.target.value) || 0)}
              className="w-24 px-2.5 py-1 text-xs border border-slate-300 rounded bg-white font-mono"
              placeholder="0,00"
            />
          </div>

          <button
            onClick={carregarFechamento}
            className="ml-auto px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700 font-semibold"
          >
            Recalcular
          </button>
        </div>

        {/* ÁREA IMPRIMÍVEL (Relatório Estruturado em Formato A4 / Folha de Prestação de Contas) */}
        <div className="overflow-y-auto p-6 sm:p-8 bg-white flex-1 text-slate-800">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Clock className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Consolidando dados de caixa do operador...</span>
            </div>
          ) : erro ? (
            <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>{erro}</span>
            </div>
          ) : (
            <div id="printable-fechamento-caixa" className="space-y-6 max-w-3xl mx-auto">
              {/* CABEÇALHO DO COMPROVANTE */}
              <div className="border-b-2 border-slate-900 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                      Interdigitus · Gestão Escolar
                    </h1>
                    <p className="text-xs text-slate-600 font-medium">
                      Comprovante Oficial de Fechamento Diário de Caixa
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-300 inline-block">
                      {dados.numeroFechamento}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Emissão: {formatDateTimeBR(dados.dataHoraEmissao)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Data do Movimento</span>
                    <strong className="text-slate-900 text-sm font-mono">{formatDateBR(dados.dataMovimento)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Operador Responsável</span>
                    <strong className="text-slate-900 text-sm">{dados.operador}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Fundo de Troco</span>
                    <strong className="text-slate-900 text-sm font-mono">{formatMoney(dados.fundoTroco)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Lançamentos</span>
                    <strong className="text-slate-900 text-sm font-mono">
                      {dados.totalRegistros} ({dados.qtdEntradas} ent / {dados.qtdSaidas} saí)
                    </strong>
                  </div>
                </div>
              </div>

              {/* 1. QUADRO RESUMO CONSOLIDADO */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 page-break-inside-avoid">
                <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-lg">
                  <div className="text-[10px] font-bold uppercase text-emerald-800 flex items-center justify-between">
                    <span>Total Entradas</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg font-black text-emerald-900 font-mono mt-1">
                    {formatMoney(dados.totalEntradas)}
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">{dados.qtdEntradas} recebimento(s)</div>
                </div>

                <div className="p-3 bg-rose-50/70 border border-rose-300 rounded-lg">
                  <div className="text-[10px] font-bold uppercase text-rose-800 flex items-center justify-between">
                    <span>Total Saídas</span>
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg font-black text-rose-900 font-mono mt-1">
                    {formatMoney(dados.totalSaidas)}
                  </div>
                  <div className="text-[10px] text-rose-700 mt-0.5">{dados.qtdSaidas} pagamento(s)</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg">
                  <div className="text-[10px] font-bold uppercase text-slate-700">Saldo Movimento</div>
                  <div className="text-lg font-black text-slate-900 font-mono mt-1">
                    {formatMoney(dados.saldoMovimentacoes)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Entradas menos Saídas</div>
                </div>

                <div className="p-3 bg-indigo-50/80 border border-indigo-300 rounded-lg">
                  <div className="text-[10px] font-bold uppercase text-indigo-900 flex items-center justify-between">
                    <span>Saldo com Fundo</span>
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg font-black text-indigo-950 font-mono mt-1">
                    {formatMoney(dados.saldoFinalComFundo)}
                  </div>
                  <div className="text-[10px] text-indigo-700 mt-0.5">Fundo inicial + Saldo</div>
                </div>
              </div>

              {/* 2. CONFERÊNCIA FÍSICA DE DINHEIRO EM ESPÉCIE */}
              <div className="p-3.5 bg-amber-50/60 border border-amber-300/80 rounded-lg page-break-inside-avoid">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-amber-700" />
                      Dinheiro Físico em Espécie (Gaveta do Caixa)
                    </span>
                    <p className="text-[11px] text-amber-900/80 mt-0.5">
                      Fundo inicial ({formatMoney(dados.fundoTroco)}) + Entradas em espécie ({formatMoney(dados.entradasDinheiro)}) - Saídas em espécie ({formatMoney(dados.saidasDinheiro)})
                    </p>
                  </div>
                  <div className="text-right sm:text-right">
                    <span className="text-[10px] uppercase text-amber-800 font-bold block">Valor a Recolher</span>
                    <strong className="text-xl font-black text-amber-950 font-mono">
                      {formatMoney(dados.dinheiroGavetaFisica)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 3. APURAÇÃO POR FORMA DE PAGAMENTO */}
              <div className="page-break-inside-avoid">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Apuração por Forma de Pagamento</span>
                </h3>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2 border-b border-r border-slate-200">Forma</th>
                      <th className="p-2 border-b border-r border-slate-200 text-center">Qtd. Entradas</th>
                      <th className="p-2 border-b border-r border-slate-200 text-right">Entradas (R$)</th>
                      <th className="p-2 border-b border-r border-slate-200 text-center">Qtd. Saídas</th>
                      <th className="p-2 border-b border-r border-slate-200 text-right">Saídas (R$)</th>
                      <th className="p-2 border-b border-slate-200 text-right">Saldo Líquido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800 font-mono">
                    {dados.porForma.map((f: any) => (
                      <tr key={f.forma} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-200 font-sans font-bold text-slate-900">{f.forma}</td>
                        <td className="p-2 border-r border-slate-200 text-center">{f.qtdEntradas}</td>
                        <td className="p-2 border-r border-slate-200 text-right text-emerald-800 font-semibold">
                          {formatMoney(f.entradas)}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center">{f.qtdSaidas}</td>
                        <td className="p-2 border-r border-slate-200 text-right text-rose-800 font-semibold">
                          {formatMoney(f.saidas)}
                        </td>
                        <td className="p-2 text-right font-black text-slate-900">{formatMoney(f.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-mono font-bold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td className="p-2 border-r border-slate-300 font-sans">TOTAL GERAL</td>
                      <td className="p-2 border-r border-slate-300 text-center">{dados.qtdEntradas}</td>
                      <td className="p-2 border-r border-slate-300 text-right text-emerald-900">
                        {formatMoney(dados.totalEntradas)}
                      </td>
                      <td className="p-2 border-r border-slate-300 text-center">{dados.qtdSaidas}</td>
                      <td className="p-2 border-r border-slate-300 text-right text-rose-900">
                        {formatMoney(dados.totalSaidas)}
                      </td>
                      <td className="p-2 text-right font-black">{formatMoney(dados.saldoMovimentacoes)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* 4. EXTRATO ANALÍTICO COMPLETO DOS LANÇAMENTOS DO TURNO */}
              <div className="page-break-inside-avoid">
                <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-1">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Extrato Analítico dos Lançamentos</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">{dados.movimentos.length} lançamentos</span>
                </div>

                <table className="w-full text-left text-[10px] border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                    <tr>
                      <th className="p-1.5 border-b border-r border-slate-200 text-center w-12">Hora</th>
                      <th className="p-1.5 border-b border-r border-slate-200 text-center w-14">Tipo</th>
                      <th className="p-1.5 border-b border-r border-slate-200 w-16">Forma</th>
                      <th className="p-1.5 border-b border-r border-slate-200">Aluno / Favorecido</th>
                      <th className="p-1.5 border-b border-r border-slate-200">Descrição / Curso</th>
                      <th className="p-1.5 border-b border-slate-200 text-right w-20">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {dados.movimentos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400">
                          Nenhuma movimentação para os parâmetros selecionados.
                        </td>
                      </tr>
                    ) : (
                      dados.movimentos.map((m: any, idx: number) => (
                        <tr key={m.ID_caixa} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                          <td className="p-1.5 border-r border-slate-200 font-mono text-center text-slate-500">
                            {m.horario || '--:--'}
                          </td>
                          <td className="p-1.5 border-r border-slate-200 text-center font-bold">
                            <span
                              className={
                                /ENTRADA/i.test(m.tipo_movimentacao || '') ? 'text-emerald-700' : 'text-rose-700'
                              }
                            >
                              {/ENTRADA/i.test(m.tipo_movimentacao || '') ? 'ENT' : 'SAÍ'}
                            </span>
                          </td>
                          <td className="p-1.5 border-r border-slate-200 font-mono text-[9px] truncate max-w-[70px]">
                            {m.forma || '-'}
                          </td>
                          <td className="p-1.5 border-r border-slate-200 font-medium text-slate-900 truncate max-w-[170px]">
                            {m.nome || 'Lançamento Avulso'}
                          </td>
                          <td className="p-1.5 border-r border-slate-200 text-slate-600 truncate max-w-[160px]">
                            {m.descricao} {m.curso && `(${m.curso})`}
                          </td>
                          <td className="p-1.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatMoney(m.valor_total)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 5. TERMO DE RESPONSABILIDADE E CAMPOS DE ASSINATURA */}
              <div className="pt-6 border-t-2 border-slate-900 page-break-inside-avoid space-y-6">
                <p className="text-[10px] text-slate-600 leading-relaxed text-justify italic">
                  &ldquo;Declaro para todos os fins de direito e controle financeiro institucional que os valores e
                  documentos acima relacionados correspondem com exatidão à totalidade da movimentação operada sob minha
                  responsabilidade neste turno de trabalho, tendo sido conferidos e entregues à tesouraria.&rdquo;
                </p>

                <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                  <div>
                    <div className="border-t border-slate-800 mx-4 pt-1.5">
                      <strong className="block text-slate-900 font-bold uppercase">{dados.operador}</strong>
                      <span className="text-[10px] text-slate-500">Operador(a) do Caixa</span>
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-slate-800 mx-4 pt-1.5">
                      <strong className="block text-slate-900 font-bold uppercase">Tesouraria / Supervisão</strong>
                      <span className="text-[10px] text-slate-500">Visto da Coordenação Financeira</span>
                    </div>
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 text-center font-mono">
                  Documento gerado automaticamente pelo Sistema Interdigitus em {formatDateTimeBR(dados.dataHoraEmissao)} · Autenticação: {dados.numeroFechamento}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal (Apenas em tela) */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs no-print">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg"
          >
            Fechar
          </button>
          <button
            onClick={handlePrint}
            disabled={loading || !dados}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Fechamento</span>
          </button>
        </div>
      </div>
    </div>
  );
};
