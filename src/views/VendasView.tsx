import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Venda, Produto, Aluno } from '../types/schema.js';
import { ShoppingCart, Plus, Search, Trash2, X, CheckCircle, AlertCircle, PackageCheck, Layers } from 'lucide-react';

export const VendasView: React.FC = () => {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroCodigoVenda, setFiltroCodigoVenda] = useState('');

  // Modal Nova Venda
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itensVenda, setItensVenda] = useState<{ idproduto: number; quantidade: number; valor_unitario: number }[]>([]);
  const [nomeCliente, setNomeCliente] = useState('');
  const [idCliente, setIdCliente] = useState<number | null>(null);
  const [observacao, setObservacao] = useState('');

  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [venList, prodList, alList] = await Promise.all([
        api.getVendas({
          codigovenda: filtroCodigoVenda ? Number(filtroCodigoVenda) : undefined,
          search: search || undefined,
        }),
        api.getProdutos(),
        api.getAlunos({ limit: 100 }),
      ]);
      setVendas(venList);
      setProdutos(prodList);
      setAlunos(alList.data);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filtroCodigoVenda]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenNovaVenda = () => {
    if (produtos.length === 0) {
      setMsg({ type: 'err', text: 'Não há produtos cadastrados no catálogo para realizar vendas.' });
      return;
    }
    const p1 = produtos[0];
    setItensVenda([
      {
        idproduto: p1.ID_produto,
        quantidade: 1,
        valor_unitario: p1.valor_venda || 0,
      },
    ]);
    setNomeCliente('');
    setIdCliente(null);
    setObservacao('');
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    const p1 = produtos[0];
    setItensVenda([
      ...itensVenda,
      {
        idproduto: p1.ID_produto,
        quantidade: 1,
        valor_unitario: p1.valor_venda || 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItensVenda(itensVenda.filter((_, i) => i !== index));
  };

  const handleFinalizarVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itensVenda.length === 0) {
      setMsg({ type: 'err', text: 'Adicione pelo menos 1 produto à venda.' });
      return;
    }

    try {
      const res = await api.createVenda({
        itens: itensVenda,
        nome_cliente: nomeCliente || 'Cliente Balcão',
        idcliente: idCliente,
        observacao,
      });

      setMsg({
        type: 'ok',
        text: `Venda #${res.codigovenda} finalizada com sucesso! Estoque atualizado automaticamente.`,
      });
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setMsg(null), 3500);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const formatMoney = (val: number | null) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const valorTotalCarrinho = itensVenda.reduce((s, it) => s + it.quantidade * it.valor_unitario, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Vendas & Pedidos de Balcão</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de itens vendidos e agrupamento por código da tabela <code className="font-mono text-indigo-600">tb_vendas</code>
          </p>
        </div>
        <button
          onClick={handleOpenNovaVenda}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Realizar Nova Venda</span>
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

      {/* Busca e Filtro por Código de Venda */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-3">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, produto ou observação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="number"
            placeholder="Filtrar por Código de Venda..."
            value={filtroCodigoVenda}
            onChange={(e) => setFiltroCodigoVenda(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
          />
          <span className="text-xs text-slate-500 font-mono">{vendas.length} linha(s) de item</span>
        </div>
      </div>

      {/* Tabela de Vendas */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">Cód. Pedido</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Produto Vendido</th>
              <th className="px-4 py-3">Qtd</th>
              <th className="px-4 py-3">Cliente / Aluno</th>
              <th className="px-4 py-3">Operador</th>
              <th className="px-4 py-3 text-right">Valor Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Carregando vendas...
                </td>
              </tr>
            ) : vendas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  Nenhuma venda registrada.
                </td>
              </tr>
            ) : (
              vendas.map((v) => (
                <tr key={v.ID_venda} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-700">#{v.codigovenda}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{v.data_gerada}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{v.produto}</div>
                    {v.observacao && <div className="text-[10px] text-slate-400 truncate max-w-xs">{v.observacao}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{v.quantidade} un</td>
                  <td className="px-4 py-3">
                    <div>{v.nome || 'Não identificado'}</div>
                    {v.idcliente && <div className="text-[10px] text-slate-400 font-mono">ID Cliente #{v.idcliente}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{v.usuario}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    {formatMoney(v.valor_total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Venda (PDV com Baixa de Estoque) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">Registrar Venda no Balcão</h2>
                <p className="text-xs text-slate-500">Validação de estoque e agrupamento via codigovenda</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFinalizarVenda} className="flex-1 flex flex-col overflow-hidden text-xs">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Identificação do Cliente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Vincular a Aluno (idcliente)</label>
                    <select
                      value={idCliente || ''}
                      onChange={(e) => {
                        const id = e.target.value ? Number(e.target.value) : null;
                        const al = alunos.find((a) => a.ID_aluno === id);
                        setIdCliente(id);
                        setNomeCliente(al ? al.nome_aluno : nomeCliente);
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">Cliente Avulso / Balcão</option>
                      {alunos.map((a) => (
                        <option key={a.ID_aluno} value={a.ID_aluno}>
                          {a.nome_aluno} (ID #{a.ID_aluno})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nome do Cliente no Pedido</label>
                    <input
                      type="text"
                      placeholder="Ex: Nome do comprador"
                      value={nomeCliente}
                      onChange={(e) => setNomeCliente(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Itens do Pedido */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-800">Itens da Venda:</span>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Item</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {itensVenda.map((it, idx) => {
                      const prodSel = produtos.find((p) => p.ID_produto === it.idproduto);
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg bg-white"
                        >
                          <select
                            value={it.idproduto}
                            onChange={(e) => {
                              const pId = Number(e.target.value);
                              const p = produtos.find((prod) => prod.ID_produto === pId);
                              const updated = [...itensVenda];
                              updated[idx].idproduto = pId;
                              updated[idx].valor_unitario = p?.valor_venda || 0;
                              setItensVenda(updated);
                            }}
                            className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
                          >
                            {produtos.map((p) => (
                              <option key={p.ID_produto} value={p.ID_produto}>
                                {p.produto} (Estoque: {p.estoque || 0})
                              </option>
                            ))}
                          </select>

                          <div className="w-20">
                            <input
                              type="number"
                              min={1}
                              max={prodSel?.estoque || 1}
                              value={it.quantidade}
                              onChange={(e) => {
                                const updated = [...itensVenda];
                                updated[idx].quantidade = Math.max(1, Number(e.target.value));
                                setItensVenda(updated);
                              }}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-mono text-center font-bold"
                            />
                          </div>

                          <div className="w-28 text-right font-mono font-bold text-slate-900">
                            {formatMoney(it.quantidade * it.valor_unitario)}
                          </div>

                          {itensVenda.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Observações da Venda</label>
                  <input
                    type="text"
                    placeholder="Ex: Pago com desconto de convênio, tamanho M..."
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Footer com Total */}
              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Valor Total do Pedido</div>
                  <div className="text-lg font-bold text-indigo-900 font-mono">
                    {formatMoney(valorTotalCarrinho)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm"
                  >
                    Concluir Venda e Baixar Estoque
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
