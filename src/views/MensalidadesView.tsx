import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Mensalidade, Aluno } from '../types/schema.js';
import { Receipt, Search, Plus, DollarSign, X, CheckCircle, AlertCircle, ArrowUpRight, Calendar, User } from 'lucide-react';

export const MensalidadesView: React.FC = () => {
  const [mensalidades, setMensalidades] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modais
  const [isNovoContratoOpen, setIsNovoContratoOpen] = useState(false);
  const [isReceberOpen, setIsReceberOpen] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<any | null>(null);

  // Form Novo Contrato
  const [novoContrato, setNovoContrato] = useState<Omit<Mensalidade, 'ID_mensalidade'>>({
    entrada: 300,
    n_parcelas: '18',
    valor_total: 5400,
    saldo_devedor: 5100,
    valor_parcela: 300,
    data_pagar: new Date().toISOString().split('T')[0],
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: new Date(Date.now() + 18 * 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    parcelas_pagas: '0',
    data_gerada: new Date().toISOString().split('T')[0],
    usuario: null,
    horario: '10:00',
    curso: 'Técnico em Enfermagem',
    idaluno: 0,
  });

  // Form Receber Pagamento
  const [pagamentoData, setPagamentoData] = useState({
    valor_pago: 300,
    forma_pagamento: 'PIX',
    gerar_caixa: true,
    observacao: '',
  });

  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mensList, alList] = await Promise.all([
        api.getMensalidades({ search: search || undefined }),
        api.getAlunos({ limit: 100 }),
      ]);
      setMensalidades(mensList);
      setAlunos(alList.data);
      if (alList.data.length > 0 && !novoContrato.idaluno) {
        setNovoContrato((prev) => ({
          ...prev,
          idaluno: alList.data[0].ID_aluno,
          curso: alList.data[0].idcurso ? `Curso #${alList.data[0].idcurso}` : 'Técnico em Enfermagem',
        }));
      }
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenReceber = (m: any) => {
    setSelectedPlano(m);
    setPagamentoData({
      valor_pago: m.valor_parcela || 0,
      forma_pagamento: 'PIX',
      gerar_caixa: true,
      observacao: `Quitação parcela mensalidade - Aluno ${m.nome_aluno}`,
    });
    setMsg(null);
    setIsReceberOpen(true);
  };

  const handleEfetivarPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlano) return;
    try {
      await api.registrarPagamentoMensalidade({
        idmensalidade: selectedPlano.ID_mensalidade,
        valor_pago: Number(pagamentoData.valor_pago),
        forma_pagamento: pagamentoData.forma_pagamento,
        gerar_caixa: pagamentoData.gerar_caixa,
        observacao: pagamentoData.observacao,
      });
      setMsg({ type: 'ok', text: 'Recebimento de mensalidade registrado com sucesso! Saldo e caixa atualizados.' });
      setIsReceberOpen(false);
      loadData();
      setTimeout(() => setMsg(null), 3500);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const handleCriarContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMensalidade(novoContrato);
      setMsg({ type: 'ok', text: 'Novo plano financeiro de mensalidade criado com sucesso!' });
      setIsNovoContratoOpen(false);
      loadData();
      setTimeout(() => setMsg(null), 3500);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const formatMoney = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Planos de Mensalidades</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão de contratos financeiros, parcelas e saldos de alunos
          </p>
        </div>
        <button
          onClick={() => {
            setMsg(null);
            setIsNovoContratoOpen(true);
          }}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Plano Financeiro</span>
        </button>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            msg.type === 'ok'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {msg.type === 'ok' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Busca */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
        <form onSubmit={handleSearch} className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome do aluno ou curso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </form>
        <span className="text-xs text-slate-500 font-mono">{mensalidades.length} plano(s)</span>
      </div>

      {/* Tabela de Mensalidades */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">ID Plano</th>
              <th className="px-4 py-3">Aluno & CPF</th>
              <th className="px-4 py-3">Curso</th>
              <th className="px-4 py-3">Parcelas Pagas</th>
              <th className="px-4 py-3">Valor Parcela</th>
              <th className="px-4 py-3">Saldo Devedor</th>
              <th className="px-4 py-3 text-right">Ação Operacional</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Carregando mensalidades...
                </td>
              </tr>
            ) : mensalidades.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  Nenhum plano financeiro registrado.
                </td>
              </tr>
            ) : (
              mensalidades.map((m) => (
                <tr key={m.ID_mensalidade} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-400">#{m.ID_mensalidade}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{m.nome_aluno}</div>
                    <div className="text-[10px] text-slate-400 font-mono">CPF: {m.cpf_aluno}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{m.curso}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-slate-800">
                      {m.parcelas_pagas || '0'} / {m.n_parcelas}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-medium">{formatMoney(m.valor_parcela)}</td>
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-rose-600">{formatMoney(m.saldo_devedor)}</div>
                    <div className="text-[10px] text-slate-400">Total: {formatMoney(m.valor_total)}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleOpenReceber(m)}
                      disabled={m.saldo_devedor <= 0}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ml-auto"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{m.saldo_devedor > 0 ? 'Receber' : 'Quitado'}</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Receber Pagamento */}
      {isReceberOpen && selectedPlano && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recebimento de Mensalidade</h2>
                <p className="text-xs text-slate-500">Baixa atômica de parcela e integração com Livro Caixa</p>
              </div>
              <button onClick={() => setIsReceberOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Aluno:</span>
                <span className="font-semibold text-slate-900">{selectedPlano.nome_aluno}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Curso:</span>
                <span className="font-medium text-slate-800">{selectedPlano.curso}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Parcelas Quitadas:</span>
                <span className="font-mono text-slate-800">
                  {selectedPlano.parcelas_pagas || '0'} de {selectedPlano.n_parcelas}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-semibold">Saldo Devedor Atual:</span>
                <span className="font-mono font-bold text-rose-600">
                  {formatMoney(selectedPlano.saldo_devedor)}
                </span>
              </div>
            </div>

            <form onSubmit={handleEfetivarPagamento} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Valor a Receber (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={selectedPlano.saldo_devedor}
                  value={pagamentoData.valor_pago}
                  onChange={(e) => setPagamentoData({ ...pagamentoData, valor_pago: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Forma de Pagamento *</label>
                <select
                  required
                  value={pagamentoData.forma_pagamento}
                  onChange={(e) => setPagamentoData({ ...pagamentoData, forma_pagamento: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão Débito">Cartão Débito</option>
                  <option value="Cartão Crédito">Cartão Crédito</option>
                  <option value="Boleto">Boleto Bancário</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição / Observação</label>
                <input
                  type="text"
                  value={pagamentoData.observacao}
                  onChange={(e) => setPagamentoData({ ...pagamentoData, observacao: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chkCaixa"
                  checked={pagamentoData.gerar_caixa}
                  onChange={(e) => setPagamentoData({ ...pagamentoData, gerar_caixa: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="chkCaixa" className="text-[11px] text-emerald-950 font-medium">
                  Gerar lançamento de entrada no <strong>Livro Caixa</strong> e registrar na{' '}
                  <strong>Auditoria Contábil</strong>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsReceberOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                >
                  Confirmar Recebimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Contrato */}
      {isNovoContratoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-900">Novo Plano de Mensalidade</h2>
              <button onClick={() => setIsNovoContratoOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCriarContrato} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Aluno *</label>
                <select
                  required
                  value={novoContrato.idaluno}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const al = alunos.find((a) => a.ID_aluno === id);
                    setNovoContrato({
                      ...novoContrato,
                      idaluno: id,
                      curso: al?.idcurso ? `Curso #${al.idcurso}` : novoContrato.curso,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {alunos.map((a) => (
                    <option key={a.ID_aluno} value={a.ID_aluno}>
                      {a.nome_aluno} (ID #{a.ID_aluno})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Curso / Descritivo *</label>
                <input
                  type="text"
                  required
                  value={novoContrato.curso}
                  onChange={(e) => setNovoContrato({ ...novoContrato, curso: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor da Entrada (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={novoContrato.entrada}
                    onChange={(e) => {
                      const ent = Number(e.target.value);
                      setNovoContrato({
                        ...novoContrato,
                        entrada: ent,
                        saldo_devedor: Math.max(0, novoContrato.valor_total - ent),
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantidade de Parcelas (n_parcelas)</label>
                  <input
                    type="text"
                    required
                    value={novoContrato.n_parcelas}
                    onChange={(e) => setNovoContrato({ ...novoContrato, n_parcelas: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor Total (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={novoContrato.valor_total}
                    onChange={(e) => {
                      const tot = Number(e.target.value);
                      const parcelas = parseInt(novoContrato.n_parcelas, 10) || 1;
                      setNovoContrato({
                        ...novoContrato,
                        valor_total: tot,
                        saldo_devedor: Math.max(0, tot - novoContrato.entrada),
                        valor_parcela: Number((tot / parcelas).toFixed(2)),
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor da Parcela (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={novoContrato.valor_parcela}
                    onChange={(e) => setNovoContrato({ ...novoContrato, valor_parcela: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNovoContratoOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Criar Contrato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
