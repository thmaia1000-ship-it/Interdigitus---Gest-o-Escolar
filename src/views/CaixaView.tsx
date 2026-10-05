import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { api } from '../services/api.js';
import { Caixa, Aluno } from '../types/schema.js';
import {
  Wallet,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  X,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Receipt,
  User,
  GraduationCap,
  Filter,
  Check,
  Printer,
  ExternalLink,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { FechamentoCaixaModal } from '../components/FechamentoCaixaModal.js';

// Utilitário para busca sem acentos e minúsculo
const normalizeSearch = (str: string = '') =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Realce visual das letras digitadas pelo operador
const highlightMatch = (text: string = '', query: string = '') => {
  if (!query.trim() || !text) return <>{text}</>;
  const qNorm = normalizeSearch(query);
  const textNorm = normalizeSearch(text);
  const idx = textNorm.indexOf(qNorm);
  if (idx === -1) return <>{text}</>;
  const start = text.slice(0, idx);
  const match = text.slice(idx, idx + query.trim().length);
  const end = text.slice(idx + query.trim().length);
  return (
    <>
      {start}
      <mark className="bg-amber-200 text-amber-950 font-bold px-0.5 rounded">
        {match}
      </mark>
      {end}
    </>
  );
};

interface CaixaViewProps {
  isExclusiveMode?: boolean;
  onExitExclusive?: () => void;
  onEnterExclusive?: () => void;
}

export const CaixaView: React.FC<CaixaViewProps> = ({
  isExclusiveMode = false,
  onExitExclusive,
  onEnterExclusive,
}) => {
  const [movimentos, setMovimentos] = useState<Caixa[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca e Autocomplete de Alunos no Lançamento Avulso
  const [alunoAvulsoBusca, setAlunoAvulsoBusca] = useState('');
  const [showAlunosDropdown, setShowAlunosDropdown] = useState(false);

  // Modal Fechamento de Caixa do Operador
  const [isFechamentoOpen, setIsFechamentoOpen] = useState(false);

  // Totais
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSaidas, setTotalSaidas] = useState(0);
  const [saldo, setSaldo] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filtros
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState('');
  const [forma, setForma] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Modal Novo Lançamento Avulso
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    valor_total: 100,
    tipo_movimentacao: 'Entrada',
    forma: 'PIX',
    descricao: '',
    nome: '',
    curso: '',
    idaluno: null as number | null,
    justificativa: '',
  });

  // Modal Receber Mensalidade do Aluno & Pesquisa Avançada
  const [isReceberOpen, setIsReceberOpen] = useState(false);
  const [mensalidades, setMensalidades] = useState<any[]>([]);
  const [selectedPlano, setSelectedPlano] = useState<any | null>(null);
  const [alunoSearchTerm, setAlunoSearchTerm] = useState('');
  const deferredAlunoSearch = useDeferredValue(alunoSearchTerm);
  const [modalStatusTab, setModalStatusTab] = useState<'TODAS' | 'VENCIDAS' | 'AVENCER' | 'PAGAS'>('TODAS');
  const [recebimentoData, setRecebimentoData] = useState({
    valor_pago: 0,
    forma_pagamento: 'PIX',
    gerar_caixa: true,
    observacao: '',
  });

  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Lista de Alunos filtrados letra por letra no Lançamento Avulso
  const filteredAlunosAvulso = alunos
    .filter((a) => {
      if (!alunoAvulsoBusca.trim()) return true;
      const term = normalizeSearch(alunoAvulsoBusca);
      const cleanDigits = alunoAvulsoBusca.replace(/[^\d]/g, '');
      const cleanCpf = (a.cpf || '').replace(/[^\d]/g, '');
      const nomeNorm = normalizeSearch(a.nome_aluno);
      return (
        nomeNorm.includes(term) ||
        (cleanDigits && cleanCpf.includes(cleanDigits)) ||
        String(a.ID_aluno).includes(term)
      );
    })
    .slice(0, 10);

  // Lista de Alunos filtrados ultra-rápida no Receber Mensalidade com useMemo
  const filteredMensalidadesModal = useMemo(() => {
    const term = normalizeSearch(deferredAlunoSearch);
    const cleanDigits = deferredAlunoSearch.replace(/[^\d]/g, '');

    return mensalidades.filter((m) => {
      if (modalStatusTab === 'VENCIDAS' && m.status_parcela !== 'VENCIDA') return false;
      if (modalStatusTab === 'AVENCER' && m.status_parcela !== 'AVENCER') return false;
      if (modalStatusTab === 'PAGAS' && m.status_parcela !== 'PAGA') return false;

      if (!term) return true;

      return (
        (m._normNome && m._normNome.includes(term)) ||
        (cleanDigits.length >= 2 && m._cleanCpf && m._cleanCpf.includes(cleanDigits)) ||
        (m._normCurso && m._normCurso.includes(term)) ||
        (m._normStatus && m._normStatus.includes(term)) ||
        (m._normLabel && m._normLabel.includes(term)) ||
        (m._cleanMensId && m._cleanMensId.includes(term)) ||
        (m._cleanId && m._cleanId.includes(term))
      );
    });
  }, [mensalidades, deferredAlunoSearch, modalStatusTab]);

  // Ao alterar resultados filtrados, selecionar o primeiro apenas se o atual sumiu
  useEffect(() => {
    if (filteredMensalidadesModal.length > 0) {
      const isAlreadyInList = filteredMensalidadesModal.some(
        (m) =>
          (m.ID_mensalidade && m.ID_mensalidade === selectedPlano?.ID_mensalidade) ||
          (!m.ID_mensalidade && m.idaluno === selectedPlano?.idaluno)
      );
      if (!isAlreadyInList) {
        const first = filteredMensalidadesModal[0];
        handleSelectPlano(first.ID_mensalidade || first.idaluno);
      }
    }
  }, [filteredMensalidadesModal]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resCaixa, resAlunos] = await Promise.all([
        api.getCaixa({
          tipo: tipo || undefined,
          forma: forma || undefined,
          data_inicio: dataInicio || undefined,
          data_fim: dataFim || undefined,
          search: search || undefined,
          page,
          limit: 15,
        }),
        api.getAlunos({ limit: 100 }),
      ]);
      setMovimentos(resCaixa.data);
      setTotalEntradas(resCaixa.totalEntradas);
      setTotalSaidas(resCaixa.totalSaidas);
      setSaldo(resCaixa.saldo);
      setTotal(resCaixa.total);
      setTotalPages(resCaixa.totalPages);
      setAlunos(resAlunos.data);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, tipo, forma, dataInicio, dataFim]);

  // Busca instantânea ao digitar cada letra na barra de busca principal do Caixa
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadData();
    }, 180);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleOpenReceberMensalidade = async () => {
    setMsg(null);
    setAlunoSearchTerm('');
    setModalStatusTab('TODAS');
    try {
      const data = await api.getPesquisaAlunosMensalidades();
      const indexed = data.map((item: any) => ({
        ...item,
        _normNome: normalizeSearch(item.nome_aluno || ''),
        _cleanCpf: (item.cpf_aluno || '').replace(/[^\d]/g, ''),
        _normCurso: normalizeSearch(item.curso || ''),
        _normStatus: normalizeSearch(item.status_parcela || ''),
        _normLabel: normalizeSearch(item.status_label || ''),
        _cleanId: String(item.idaluno || ''),
        _cleanMensId: item.ID_mensalidade ? String(item.ID_mensalidade) : '',
      }));
      setMensalidades(indexed);
      if (indexed.length > 0) {
        const primeiroComSaldo =
          indexed.find((m: any) => m.status_parcela === 'VENCIDA') ||
          indexed.find((m: any) => m.status_parcela === 'AVENCER') ||
          indexed[0];
        if (primeiroComSaldo) {
          handleSelectPlano(primeiroComSaldo.ID_mensalidade || primeiroComSaldo.idaluno);
        }
      }
      setIsReceberOpen(true);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const handleSelectPlano = (id: number) => {
    const plano = mensalidades.find((m: any) => m.ID_mensalidade === id || m.idaluno === id);
    if (!plano) return;
    setSelectedPlano(plano);
    setRecebimentoData((prev) => ({
      ...prev,
      valor_pago: Math.min(plano.valor_parcela || 0, plano.saldo_devedor || 0),
      observacao: `Recebimento Mensalidade - ${plano.nome_aluno} (${plano.curso})`,
    }));
  };

  const handleConfirmarRecebimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlano) return;
    try {
      await api.registrarPagamentoMensalidade({
        idmensalidade: selectedPlano.ID_mensalidade,
        valor_pago: Number(recebimentoData.valor_pago),
        forma_pagamento: recebimentoData.forma_pagamento,
        gerar_caixa: recebimentoData.gerar_caixa,
        observacao: recebimentoData.observacao,
      });
      setMsg({
        type: 'ok',
        text: `Recebimento de ${formatMoney(Number(recebimentoData.valor_pago))} do aluno(a) ${selectedPlano.nome_aluno} registrado com sucesso no Caixa e quitado na mensalidade!`,
      });
      setIsReceberOpen(false);
      loadData();
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      valor_total: 100,
      tipo_movimentacao: 'Entrada',
      forma: 'PIX',
      descricao: '',
      nome: '',
      curso: '',
      idaluno: null,
      justificativa: 'Lançamento manual avulso no balcão',
    });
    setAlunoAvulsoBusca('');
    setShowAlunosDropdown(false);
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCaixa(formData);
      setMsg({
        type: 'ok',
        text: 'Lançamento registrado com sucesso no Caixa e registrado na auditoria!',
      });
      setIsModalOpen(false);
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
    <div className="p-3.5 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Livro Caixa</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Movimentações financeiras de entrada e saída do fluxo diário
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/export/csv/caixa"
            download
            className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 min-h-[40px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </a>
          <button
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs min-h-[40px]"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span>Lançamento Avulso</span>
          </button>
          <button
            onClick={() => setIsFechamentoOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 sm:py-1.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs min-h-[40px]"
            title="Gerar e imprimir relatório de fechamento do operador"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Fechamento do Caixa</span>
          </button>
          <a
            href="/financeiro/receber-mensalidade"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm min-h-[40px]"
            title="Abrir Terminal de Recebimento de Mensalidades em uma nova aba dedicada"
          >
            <Receipt className="w-4 h-4" />
            <span>Receber Mensalidade (Nova Aba)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
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

      {/* Cards de Totais do Caixa */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Total Entradas</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-2 font-mono">{formatMoney(totalEntradas)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Total Saídas</span>
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700 mt-2 font-mono">{formatMoney(totalSaidas)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Saldo Líquido</span>
            <Wallet className="w-4 h-4 text-indigo-600" />
          </div>
          <div className={`text-xl font-bold mt-2 font-mono ${saldo >= 0 ? 'text-indigo-900' : 'text-rose-600'}`}>
            {formatMoney(saldo)}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-3">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome do aluno, descrição ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 hover:bg-white focus:bg-white transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="">Todos os Tipos</option>
            <option value="Entrada">Entradas</option>
            <option value="Saída">Saídas</option>
          </select>

          <select
            value={forma}
            onChange={(e) => {
              setForma(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="">Todas as Formas</option>
            <option value="PIX">PIX</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão Débito">Cartão Débito</option>
            <option value="Cartão Crédito">Cartão Crédito</option>
            <option value="Boleto">Boleto</option>
          </select>

          <input
            type="date"
            value={dataInicio}
            onChange={(e) => {
              setDataInicio(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
            title="Data Inicial"
          />

          <input
            type="date"
            value={dataFim}
            onChange={(e) => {
              setDataFim(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
            title="Data Final"
          />

          <span className="text-xs text-slate-500 font-mono ml-auto">{total} registro(s)</span>
        </div>
      </div>

      {/* Tabela do Livro Caixa */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs touch-scroll">
        <table className="w-full text-left text-xs min-w-[680px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">ID / Data</th>
              <th className="px-4 py-3">Tipo & Forma</th>
              <th className="px-4 py-3">Descrição / Finalidade</th>
              <th className="px-4 py-3">Aluno / Favorecido</th>
              <th className="px-4 py-3">Operador</th>
              <th className="px-4 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Carregando livro caixa...
                </td>
              </tr>
            ) : movimentos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Nenhum lançamento no período filtrado.
                </td>
              </tr>
            ) : (
              movimentos.map((c) => (
                <tr key={c.ID_caixa} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500">
                    <div>#{c.ID_caixa}</div>
                    <div className="text-[10px] text-slate-400">
                      {c.data} {c.horario && `· ${c.horario}`}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        /ENTRADA/i.test(c.tipo_movimentacao || '')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {c.tipo_movimentacao}
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{c.forma}</div>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">
                    <div className="font-semibold text-slate-900">{highlightMatch(c.descricao || 'Sem descrição', search)}</div>
                    {c.curso && <div className="text-[10px] text-indigo-600">{highlightMatch(c.curso, search)}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{highlightMatch(c.nome || 'Não vinculado', search)}</div>
                    {c.idaluno && <div className="text-[10px] text-slate-400 font-mono">ID Aluno #{c.idaluno}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{c.usuario || 'Sistema'}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-mono font-bold text-sm ${
                        /ENTRADA/i.test(c.tipo_movimentacao || '') ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {/SAIDA/i.test(c.tipo_movimentacao || '') ? '-' : '+'} {formatMoney(c.valor_total || 0)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginação */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Página <span className="font-semibold">{page}</span> de <span className="font-semibold">{totalPages}</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 border border-slate-300 rounded hover:bg-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-slate-300 rounded hover:bg-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Novo Lançamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Novo Lançamento de Caixa</h2>
                <p className="text-xs text-slate-500">Auditoria cronológica automática garantida</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Movimentação *</label>
                  <select
                    required
                    value={formData.tipo_movimentacao}
                    onChange={(e) => setFormData({ ...formData, tipo_movimentacao: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value="Entrada">Entrada (+)</option>
                    <option value="Saída">Saída (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Forma de Pagamento *</label>
                  <select
                    required
                    value={formData.forma}
                    onChange={(e) => setFormData({ ...formData, forma: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão Débito">Cartão Débito</option>
                    <option value="Cartão Crédito">Cartão Crédito</option>
                    <option value="Boleto">Boleto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Valor Total (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={0.01}
                  value={formData.valor_total}
                  onChange={(e) => setFormData({ ...formData, valor_total: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição / Finalidade *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pagamento taxa de expedição de declaração"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Buscar Aluno por Nome (Filtrado letra por letra)
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Digite o nome do aluno letra por letra..."
                    value={alunoAvulsoBusca}
                    onChange={(e) => {
                      setAlunoAvulsoBusca(e.target.value);
                      setShowAlunosDropdown(true);
                    }}
                    onFocus={() => setShowAlunosDropdown(true)}
                    className="w-full pl-8 pr-8 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                  {alunoAvulsoBusca && (
                    <button
                      type="button"
                      onClick={() => {
                        setAlunoAvulsoBusca('');
                        setFormData({ ...formData, idaluno: null, nome: '' });
                      }}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {showAlunosDropdown && alunoAvulsoBusca.trim() && (
                  <div className="mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-36 overflow-y-auto divide-y divide-slate-100 z-10 relative">
                    {filteredAlunosAvulso.length === 0 ? (
                      <div className="p-2 text-slate-400 text-center text-[11px]">Nenhum aluno encontrado</div>
                    ) : (
                      filteredAlunosAvulso.map((a) => (
                        <div
                          key={a.ID_aluno}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              idaluno: a.ID_aluno,
                              nome: a.nome_aluno,
                            });
                            setAlunoAvulsoBusca(a.nome_aluno);
                            setShowAlunosDropdown(false);
                          }}
                          className="p-2 hover:bg-indigo-50 cursor-pointer flex justify-between items-center text-xs transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">
                              {highlightMatch(a.nome_aluno, alunoAvulsoBusca)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              CPF: {a.cpf || '-'} · ID #{a.ID_aluno}
                            </div>
                          </div>
                          <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                            Selecionar
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {formData.idaluno && (
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    <span>
                      Aluno vinculado: <strong>{formData.nome}</strong> (ID #{formData.idaluno})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, idaluno: null, nome: '' });
                        setAlunoAvulsoBusca('');
                      }}
                      className="text-rose-600 hover:text-rose-800 font-bold text-[10px]"
                    >
                      Desvincular
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome / Favorecido</label>
                <input
                  type="text"
                  placeholder="Ex: Fornecedor, Aluno ou Portador"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Justificativa para a Auditoria *</label>
                <input
                  type="text"
                  required
                  placeholder="Motivo obrigatório para auditoria"
                  value={formData.justificativa}
                  onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Registrar Movimentação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Recebimento de Mensalidade do Aluno com Pesquisa Avançada */}
      {isReceberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header do Modal */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Caixa: Receber Mensalidade do Aluno</h2>
                  <p className="text-xs text-slate-500">Pesquisa avançada de alunos e baixa no livro caixa</p>
                </div>
              </div>
              <button
                onClick={() => setIsReceberOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarRecebimento} className="p-6 space-y-4 text-xs overflow-y-auto custom-scrollbar flex-1">
              {/* Seção 1: Pesquisa Avançada por Nome */}
              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Search className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Pesquisa de Alunos (Base Completa)</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setModalStatusTab('TODAS')}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                        modalStatusTab === 'TODAS'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalStatusTab('VENCIDAS')}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                        modalStatusTab === 'VENCIDAS'
                          ? 'bg-rose-600 text-white font-bold'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                    >
                      🔴 Vencidas
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalStatusTab('AVENCER')}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                        modalStatusTab === 'AVENCER'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      🟡 A Vencer
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalStatusTab('PAGAS')}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                        modalStatusTab === 'PAGAS'
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                    >
                      🟢 Pagas
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Digite o nome do aluno, CPF ou curso letra por letra..."
                    value={alunoSearchTerm}
                    onChange={(e) => setAlunoSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  {alunoSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setAlunoSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                      title="Limpar filtro"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {alunoSearchTerm && (
                  <div className="flex items-center justify-between text-[11px] text-emerald-800 font-medium px-1">
                    <span>
                      Buscando: <strong>"{alunoSearchTerm}"</strong> ({modalStatusTab})
                    </span>
                    <span className="font-mono bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-[10px]">
                      {filteredMensalidadesModal.length} aluno(s) encontrado(s)
                    </span>
                  </div>
                )}

                {/* Lista de Alunos Encontrados */}
                <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1 pt-1">
                  {filteredMensalidadesModal.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                      Nenhum aluno encontrado para "{alunoSearchTerm}".
                    </div>
                  ) : (
                    filteredMensalidadesModal.map((m) => {
                      const isSelected =
                        (m.ID_mensalidade && selectedPlano?.ID_mensalidade === m.ID_mensalidade) ||
                        (!m.ID_mensalidade && selectedPlano?.idaluno === m.idaluno);
                      return (
                        <div
                          key={`${m.idaluno}-${m.ID_mensalidade || 'sem'}`}
                          onClick={() => handleSelectPlano(m.ID_mensalidade || m.idaluno)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                <span>{highlightMatch(m.nome_aluno, alunoSearchTerm)}</span>
                                <span className="text-[10px] font-mono text-slate-400 font-normal">
                                  CPF: {highlightMatch(m.cpf_aluno || '-', alunoSearchTerm)}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {highlightMatch(m.curso, alunoSearchTerm)}
                                {m.tem_contrato && ` · Parc. ${m.parcelas_pagas || 0}/${m.n_parcelas}`}
                              </div>
                              <div className="mt-0.5">
                                {m.status_parcela === 'VENCIDA' && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200">
                                    VENCIDA {m.dias_atraso > 0 ? `(${m.dias_atraso}d)` : ''}
                                  </span>
                                )}
                                {m.status_parcela === 'AVENCER' && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                                    A VENCER
                                  </span>
                                )}
                                {m.status_parcela === 'PAGA' && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                                    PAGA (Quitada)
                                  </span>
                                )}
                                {m.status_parcela === 'SEM_CONTRATO' && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                    Sem Contrato
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-400 block">Saldo</span>
                            <span
                              className={`font-mono font-bold text-xs ${
                                m.status_parcela === 'VENCIDA'
                                  ? 'text-rose-700'
                                  : m.status_parcela === 'AVENCER'
                                  ? 'text-amber-700'
                                  : m.status_parcela === 'PAGA'
                                  ? 'text-emerald-700'
                                  : 'text-slate-500'
                              }`}
                            >
                              {m.tem_contrato ? formatMoney(m.saldo_devedor) : 'R$ 0,00'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Seção 2: Contrato Selecionado & Painel de Quitação */}
              {selectedPlano ? (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Aluno Selecionado para Baixa
                      </span>
                      <div className="text-sm font-bold text-emerald-950">{selectedPlano.nome_aluno}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900 font-semibold">
                      Contrato #{selectedPlano.ID_mensalidade}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2 bg-white/80 rounded-lg border border-emerald-100 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Saldo Devedor Total</span>
                      <strong className="text-rose-700 font-mono text-sm">
                        {formatMoney(selectedPlano.saldo_devedor)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Parcelas Pagas</span>
                      <strong className="text-slate-800 font-mono text-sm">
                        {selectedPlano.parcelas_pagas || 0} de {selectedPlano.n_parcelas}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Valor da Parcela</span>
                      <strong className="text-emerald-700 font-mono text-sm">
                        {formatMoney(selectedPlano.valor_parcela)}
                      </strong>
                    </div>
                  </div>

                  {/* Atalhos Rápidos de Pagamento */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 block">Atalhos de Pagamento:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setRecebimentoData({
                            ...recebimentoData,
                            valor_pago: Math.min(
                              selectedPlano.valor_parcela || 0,
                              selectedPlano.saldo_devedor || 0
                            ),
                          })
                        }
                        className="px-2.5 py-1 bg-white hover:bg-emerald-100/60 border border-emerald-200 rounded text-[11px] font-semibold text-emerald-800 transition-colors"
                      >
                        1 Parcela ({formatMoney(selectedPlano.valor_parcela)})
                      </button>
                      {selectedPlano.saldo_devedor >= selectedPlano.valor_parcela * 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            setRecebimentoData({
                              ...recebimentoData,
                              valor_pago: selectedPlano.valor_parcela * 2,
                            })
                          }
                          className="px-2.5 py-1 bg-white hover:bg-emerald-100/60 border border-emerald-200 rounded text-[11px] font-semibold text-emerald-800 transition-colors"
                        >
                          2 Parcelas ({formatMoney(selectedPlano.valor_parcela * 2)})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setRecebimentoData({
                            ...recebimentoData,
                            valor_pago: selectedPlano.saldo_devedor || 0,
                          })
                        }
                        className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 rounded text-[11px] font-semibold text-rose-700 transition-colors"
                      >
                        Quitar Saldo Total ({formatMoney(selectedPlano.saldo_devedor)})
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  Utilize o campo de pesquisa acima para selecionar o aluno que efetuará o pagamento.
                </div>
              )}

              {/* Seção 3: Valores e Forma de Pagamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor a Receber (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min={0.01}
                    max={selectedPlano?.saldo_devedor || 99999}
                    value={recebimentoData.valor_pago || ''}
                    onChange={(e) =>
                      setRecebimentoData({ ...recebimentoData, valor_pago: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm text-emerald-900 focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  {selectedPlano && (
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Saldo restante após pagamento: {formatMoney(Math.max(0, selectedPlano.saldo_devedor - (recebimentoData.valor_pago || 0)))}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Forma de Pagamento *</label>
                  <select
                    required
                    value={recebimentoData.forma_pagamento}
                    onChange={(e) =>
                      setRecebimentoData({ ...recebimentoData, forma_pagamento: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-800"
                  >
                    <option value="PIX">PIX (Chave Institucional)</option>
                    <option value="Dinheiro">Dinheiro (Em espécie no balcão)</option>
                    <option value="Cartão Débito">Cartão de Débito</option>
                    <option value="Cartão Crédito">Cartão de Crédito</option>
                    <option value="Boleto">Boleto Bancário</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição / Recibo da Operação</label>
                <input
                  type="text"
                  placeholder="Ex: Recebimento parcela mensalidade aluno..."
                  value={recebimentoData.observacao}
                  onChange={(e) => setRecebimentoData({ ...recebimentoData, observacao: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">Entrada Automática no Livro Caixa</div>
                  <div className="text-[11px] text-slate-500">
                    Gera movimentação em tb_caixa e registro cronológico em log_caixa
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={recebimentoData.gerar_caixa}
                  onChange={(e) => setRecebimentoData({ ...recebimentoData, gerar_caixa: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </div>

              {/* Botões do Rodapé */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsReceberOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedPlano || recebimentoData.valor_pago <= 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Confirmar Recebimento de {formatMoney(recebimentoData.valor_pago || 0)}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Fechamento Diário de Caixa do Operador (Comprovante Oficial de Impressão) */}
      <FechamentoCaixaModal
        isOpen={isFechamentoOpen}
        onClose={() => setIsFechamentoOpen(false)}
        initialDate={dataInicio || '2026-10-03'}
        initialOperator="ERICA"
      />
    </div>
  );
};
