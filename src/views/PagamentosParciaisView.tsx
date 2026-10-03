import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { PagamentoParcial } from '../types/schema.js';
import { Layers, Plus, DollarSign, Calendar, Search } from 'lucide-react';

export const PagamentosParciaisView: React.FC = () => {
  const [parciais, setParciais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getPagamentosParciais();
      setParciais(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatMoney = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const totalPago = parciais.reduce((s, p) => s + (p.valor || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Histórico de Pagamentos Parciais</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lançamentos executados e baixas parciais da tabela <code className="font-mono text-indigo-600">tb_pagamentos_parciais</code>
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-right">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total em Parciais Pagos</span>
          <span className="font-mono font-bold text-emerald-700 text-base">{formatMoney(totalPago)}</span>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">ID Parcial</th>
              <th className="px-4 py-3">Data Lançamento</th>
              <th className="px-4 py-3">Professor Favorecido</th>
              <th className="px-4 py-3">Compromisso Vinculado</th>
              <th className="px-4 py-3">Modalidade (tipo)</th>
              <th className="px-4 py-3">Operador</th>
              <th className="px-4 py-3 text-right">Valor Pago</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Carregando pagamentos parciais...
                </td>
              </tr>
            ) : parciais.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  Nenhum pagamento parcial registrado.
                </td>
              </tr>
            ) : (
              parciais.map((pp) => (
                <tr key={pp.ID_pagamento_parcial} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-400">#{pp.ID_pagamento_parcial}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{pp.data_gerada}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{pp.nome_professor}</td>
                  <td className="px-4 py-3 text-indigo-700 font-medium">
                    {pp.materia_compromisso || `Contrato #${pp.idpagamento}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono">
                      {pp.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{pp.usuario}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                    {formatMoney(pp.valor)}
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
