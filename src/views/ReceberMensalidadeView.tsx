import React, { useState, useEffect, useRef, useMemo, useDeferredValue } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Receipt,
  Search,
  Check,
  X,
  Printer,
  Clock,
  User,
  ArrowLeft,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  Calendar,
  Sparkles,
  Layers,
  GraduationCap,
  PlusCircle,
  RefreshCw,
  Split,
  ChevronRight,
} from 'lucide-react';

// Normalização ultra-segura para busca sem acentos e minúsculo (suporta números, strings e null)
const normalizeSearch = (str: any = '') =>
  String(str ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

// Realce visual ultra-rápido e à prova de falhas com qualquer tipo de dado
const HighlightText: React.FC<{ text: any; query: any }> = React.memo(({ text, query }) => {
  const textStr = String(text ?? '');
  const queryStr = String(query ?? '').trim();
  if (!queryStr || !textStr) return <>{textStr}</>;
  const qNorm = normalizeSearch(queryStr);
  const textNorm = normalizeSearch(textStr);
  const idx = textNorm.indexOf(qNorm);
  if (idx === -1) return <>{textStr}</>;
  const start = textStr.slice(0, idx);
  const match = textStr.slice(idx, idx + queryStr.length);
  const end = textStr.slice(idx + queryStr.length);
  return (
    <>
      {start}
      <mark className="bg-amber-200 text-amber-950 font-bold px-0.5 rounded">
        {match}
      </mark>
      {end}
    </>
  );
});

const formatMoney = (val: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
};

// Componente isolado de relógio: NÃO causa re-render no componente pai
const LiveClock: React.FC = React.memo(() => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDate(
        now.toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
      <Clock className="w-3.5 h-3.5 text-emerald-400" />
      <span className="text-slate-400 capitalize">{date}</span>
      <span className="text-white font-bold tracking-wider">{time}</span>
    </div>
  );
});

interface ReceberMensalidadeViewProps {
  onClose?: () => void;
}

export const ReceberMensalidadeView: React.FC<ReceberMensalidadeViewProps> = ({ onClose }) => {
  const { user } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Estados de dados
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlano, setSelectedPlano] = useState<any | null>(null);

  // Filtros de busca ultra-rápidos com prioridade não-bloqueante
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [statusTab, setStatusTab] = useState<'TODAS' | 'VENCIDAS' | 'AVENCER' | 'PAGAS' | 'SEM_CONTRATO'>('TODAS');

  // Formulário de Quitação
  const [recebimentoData, setRecebimentoData] = useState({
    valor_pago: 0,
    forma_pagamento: 'PIX',
    gerar_caixa: true,
    observacao: '',
  });

  // Formulário de Gerar Contrato Rápido
  const [novoContratoData, setNovoContratoData] = useState({
    n_parcelas: 10,
    valor_parcela: 150,
    valor_total: 1500,
    data_pagar: new Date().toISOString().split('T')[0],
  });
  const [gerandoContrato, setGerandoContrato] = useState(false);

  // Tela Cheia
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Status e Comprovante
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [ultimoComprovante, setUltimoComprovante] = useState<any | null>(null);

  // Quadro de Mensalidades do Aluno (Pagas, Atrasadas e A Vencer)
  const [detalheAluno, setDetalheAluno] = useState<any | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [quadroFilter, setQuadroFilter] = useState<'TODAS' | 'ATRASADAS' | 'AVENCER' | 'PAGAS'>('TODAS');

  // Opção de Receber em 2 Formas (Pagamento Misto)
  const [emDuasFormas, setEmDuasFormas] = useState(false);
  const [forma2, setForma2] = useState('Dinheiro');
  const [valor2, setValor2] = useState<number>(0);

  // Foco automático no input de busca ao carregar
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Carregar lista completa com pré-indexação para busca instantânea
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getPesquisaAlunosMensalidades();
      // Pré-indexar termos em minúsculo e sem acento uma única vez protegendo contra números em CPFs ou nomes
      const indexed = (data || []).map((item: any) => {
        const cpfStr = item.cpf_aluno !== null && item.cpf_aluno !== undefined ? String(item.cpf_aluno) : '-';
        const cleanCpfDigits = String(item.cpf_aluno ?? '').replace(/[^\d]/g, '');

        return {
          ...item,
          nome_aluno: String(item.nome_aluno || 'Aluno sem nome'),
          cpf_aluno: cpfStr,
          curso: String(item.curso || 'Geral'),
          _normNome: normalizeSearch(item.nome_aluno),
          _cleanCpf: cleanCpfDigits,
          _normCurso: normalizeSearch(item.curso),
          _normStatus: normalizeSearch(item.status_parcela),
          _normLabel: normalizeSearch(item.status_label),
          _cleanId: String(item.idaluno ?? ''),
          _cleanMensId: item.ID_mensalidade ? String(item.ID_mensalidade) : '',
        };
      });

      setItens(indexed);
      if (indexed.length > 0 && !selectedPlano) {
        const prioritario =
          indexed.find((m: any) => m.status_parcela === 'VENCIDA') ||
          indexed.find((m: any) => m.status_parcela === 'AVENCER') ||
          indexed[0];
        if (prioritario) {
          selectPlano(prioritario);
        }
      }
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message || 'Erro ao carregar dados dos alunos e mensalidades.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadDetalheAluno = async (idaluno: number) => {
    if (!idaluno) {
      setDetalheAluno(null);
      return;
    }
    setLoadingDetalhe(true);
    try {
      const data = await api.getMensalidadesDetalheAluno(idaluno);
      setDetalheAluno(data);
    } catch (err) {
      console.warn('Erro ao carregar detalhes das mensalidades do aluno:', err);
    } finally {
      setLoadingDetalhe(false);
    }
  };

  const handleToggleDuasFormas = (checked: boolean) => {
    setEmDuasFormas(checked);
    if (checked) {
      const totalAtual = Number(recebimentoData.valor_pago) || Number(selectedPlano?.valor_parcela) || 0;
      const v1 = Number((totalAtual / 2).toFixed(2));
      const v2 = Number((totalAtual - v1).toFixed(2));
      setRecebimentoData((prev) => ({ ...prev, valor_pago: v1 }));
      setValor2(v2);

      // Garantir formas diferentes por padrão
      if (recebimentoData.forma_pagamento === forma2) {
        setForma2(recebimentoData.forma_pagamento === 'PIX' ? 'Dinheiro' : 'PIX');
      }
    } else {
      const totalRecomposto = Number((recebimentoData.valor_pago + valor2).toFixed(2));
      setRecebimentoData((prev) => ({ ...prev, valor_pago: totalRecomposto }));
      setValor2(0);
    }
  };

  const selectPlano = (item: any) => {
    setSelectedPlano(item);
    setEmDuasFormas(false);
    setValor2(0);
    loadDetalheAluno(item.idaluno);

    if (item.tem_contrato) {
      setRecebimentoData((prev) => ({
        ...prev,
        valor_pago: Math.min(item.valor_parcela || 0, item.saldo_devedor || 0),
        observacao: `Recebimento Mensalidade Aluno: ${item.nome_aluno} (${item.curso})`,
      }));
    } else {
      setNovoContratoData({
        n_parcelas: 10,
        valor_parcela: 150,
        valor_total: 1500,
        data_pagar: new Date().toISOString().split('T')[0],
      });
    }
  };

  // Contadores pré-calculados em 1 único loop com useMemo
  const counts = useMemo(() => {
    let vencidas = 0;
    let avencer = 0;
    let pagas = 0;
    let semContrato = 0;
    for (let i = 0; i < itens.length; i++) {
      const st = itens[i].status_parcela;
      if (st === 'VENCIDA') vencidas++;
      else if (st === 'AVENCER') avencer++;
      else if (st === 'PAGA') pagas++;
      else if (st === 'SEM_CONTRATO') semContrato++;
    }
    return {
      todas: itens.length,
      vencidas,
      avencer,
      pagas,
      semContrato,
    };
  }, [itens]);

  // Filtragem ultra-rápida usando deferredSearch e campos pré-indexados
  const filteredItens = useMemo(() => {
    const term = normalizeSearch(deferredSearch);
    const cleanDigits = String(deferredSearch ?? '').replace(/[^\d]/g, '');

    return itens.filter((item) => {
      // Filtro de aba
      if (statusTab === 'VENCIDAS' && item.status_parcela !== 'VENCIDA') return false;
      if (statusTab === 'AVENCER' && item.status_parcela !== 'AVENCER') return false;
      if (statusTab === 'PAGAS' && item.status_parcela !== 'PAGA') return false;
      if (statusTab === 'SEM_CONTRATO' && item.status_parcela !== 'SEM_CONTRATO') return false;

      // Filtro de texto
      if (!term) return true;

      return (
        item._normNome.includes(term) ||
        (cleanDigits.length >= 2 && item._cleanCpf.includes(cleanDigits)) ||
        item._normCurso.includes(term) ||
        item._normStatus.includes(term) ||
        item._normLabel.includes(term) ||
        item._cleanId.includes(term) ||
        (item._cleanMensId && item._cleanMensId.includes(term))
      );
    });
  }, [itens, deferredSearch, statusTab]);

  // Sincronizar seleção apenas quando a lista filtrada não contém o aluno atualmente selecionado
  useEffect(() => {
    if (filteredItens.length > 0) {
      const isStillInList = filteredItens.some(
        (m) =>
          (m.ID_mensalidade && m.ID_mensalidade === selectedPlano?.ID_mensalidade) ||
          (!m.ID_mensalidade && m.idaluno === selectedPlano?.idaluno)
      );
      if (!isStillInList) {
        selectPlano(filteredItens[0]);
      }
    }
  }, [filteredItens]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const handleConfirmarRecebimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlano || !selectedPlano.tem_contrato) return;
    
    const valor1 = Number(recebimentoData.valor_pago) || 0;
    const v2 = emDuasFormas ? (Number(valor2) || 0) : 0;
    const totalNum = Number((valor1 + v2).toFixed(2));

    if (totalNum <= 0) {
      setMsg({ type: 'err', text: 'Informe um valor válido maior que zero.' });
      return;
    }

    if (emDuasFormas && v2 <= 0) {
      setMsg({ type: 'err', text: 'Na opção em 2 formas, informe o valor da segunda forma de pagamento.' });
      return;
    }

    if (totalNum > (selectedPlano.saldo_devedor + 0.05)) {
      setMsg({
        type: 'err',
        text: `O total pago (${formatMoney(totalNum)}) excede o saldo devedor de ${formatMoney(selectedPlano.saldo_devedor)}.`,
      });
      return;
    }

    setSubmitting(true);
    setMsg(null);
    try {
      const res = await api.registrarPagamentoMensalidade({
        idmensalidade: selectedPlano.ID_mensalidade,
        valor_pago: valor1,
        forma_pagamento: recebimentoData.forma_pagamento,
        gerar_caixa: recebimentoData.gerar_caixa,
        observacao: recebimentoData.observacao,
        em_duas_formas: emDuasFormas,
        forma_pagamento_2: emDuasFormas ? forma2 : undefined,
        valor_pago_2: emDuasFormas ? v2 : undefined,
      });

      const formaDesc = emDuasFormas
        ? `${recebimentoData.forma_pagamento} (${formatMoney(valor1)}) + ${forma2} (${formatMoney(v2)})`
        : recebimentoData.forma_pagamento;

      const comprovanteInfo = {
        data: new Date().toLocaleDateString('pt-BR'),
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        operador: user?.nome || user?.username || 'Caixa',
        aluno: selectedPlano.nome_aluno,
        cpf: selectedPlano.cpf_aluno,
        curso: selectedPlano.curso,
        valor_pago: totalNum,
        forma: formaDesc,
        parcela: (parseInt(selectedPlano.parcelas_pagas || '0', 10) + 1) + '/' + selectedPlano.n_parcelas,
        saldo_restante: Math.max(0, (selectedPlano.saldo_devedor || 0) - totalNum),
        id_mensalidade: selectedPlano.ID_mensalidade,
        id_caixa: res.caixa?.ID_caixa,
        em_duas_formas: emDuasFormas,
        forma_1: recebimentoData.forma_pagamento,
        valor_1: valor1,
        forma_2: forma2,
        valor_2: v2,
      };

      setUltimoComprovante(comprovanteInfo);
      setMsg({
        type: 'ok',
        text: `Recebimento de ${formatMoney(totalNum)} [${formaDesc}] do aluno(a) ${selectedPlano.nome_aluno} quitado com sucesso!`,
      });

      // Recarregar dados da lista e do quadro do aluno
      await loadData();
      await loadDetalheAluno(selectedPlano.idaluno);
      searchInputRef.current?.focus();
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message || 'Falha ao processar quitação.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGerarContratoRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlano || selectedPlano.tem_contrato) return;
    setGerandoContrato(true);
    setMsg(null);
    try {
      const novo = await api.gerarContratoMensalidadeRapido({
        idaluno: selectedPlano.idaluno,
        curso: selectedPlano.curso,
        n_parcelas: novoContratoData.n_parcelas,
        valor_parcela: novoContratoData.valor_parcela,
        valor_total: novoContratoData.n_parcelas * novoContratoData.valor_parcela,
        data_pagar: novoContratoData.data_pagar,
      });

      setMsg({
        type: 'ok',
        text: `Contrato de mensalidade (${novo.n_parcelas} parcelas de ${formatMoney(novo.valor_parcela)}) gerado com sucesso para o aluno ${selectedPlano.nome_aluno}!`,
      });

      await loadData();
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message || 'Falha ao gerar contrato.' });
    } finally {
      setGerandoContrato(false);
    }
  };

  const formasPagamento = [
    { id: 'PIX', label: 'PIX', icon: QrCode },
    { id: 'Dinheiro', label: 'Dinheiro', icon: Banknote },
    { id: 'Cartão Débito', label: 'Débito', icon: CreditCard },
    { id: 'Cartão Crédito', label: 'Crédito', icon: CreditCard },
    { id: 'Boleto', label: 'Boleto', icon: FileText },
  ];

  // Parcelas do aluno filtradas para o Quadro de Mensalidades
  const parcelasFiltradasQuadro = useMemo(() => {
    if (!detalheAluno || !detalheAluno.parcelas || detalheAluno.parcelas.length === 0) {
      if (!selectedPlano || !selectedPlano.tem_contrato) return [];
      const nParc = parseInt(selectedPlano.n_parcelas || '1', 10);
      const pagas = parseInt(selectedPlano.parcelas_pagas || '0', 10);
      const val = Number(selectedPlano.valor_parcela) || 0;
      const today = new Date().toISOString().split('T')[0];
      const list: any[] = [];
      for (let i = 1; i <= nParc; i++) {
        const isPaga = i <= pagas;
        const isVencida = !isPaga && (selectedPlano.data_pagar && selectedPlano.data_pagar < today);
        list.push({
          numero: i,
          contratoId: selectedPlano.ID_mensalidade,
          curso: selectedPlano.curso,
          valor: val,
          data_vencimento: selectedPlano.data_pagar || today,
          status: isPaga ? 'PAGA' : (isVencida ? 'ATRASADA' : 'AVENCER'),
          status_label: isPaga ? 'Paga / Quitada' : (isVencida ? 'Atrasada' : 'A Vencer'),
          dias_atraso: isVencida ? (selectedPlano.dias_atraso || 1) : 0,
          paga: isPaga,
        });
      }
      return list;
    }

    if (quadroFilter === 'ATRASADAS') {
      return detalheAluno.parcelas.filter((p: any) => p.status === 'ATRASADA');
    }
    if (quadroFilter === 'AVENCER') {
      return detalheAluno.parcelas.filter((p: any) => p.status === 'AVENCER');
    }
    if (quadroFilter === 'PAGAS') {
      return detalheAluno.parcelas.filter((p: any) => p.status === 'PAGA');
    }
    return detalheAluno.parcelas;
  }, [detalheAluno, selectedPlano, quadroFilter]);

  return (
    <div className="h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Topo: Header Dedicado da Estação de Recebimento */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/60">
            <Receipt className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                INTERDIGITUS
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-xs sm:text-sm font-semibold text-emerald-400 uppercase tracking-wider font-mono">
                Recebimento de Mensalidades
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Terminal Otimizado de Alta Performance
              </span>
              <span>·</span>
              <span className="hidden sm:inline">Busca instantânea sem travamentos</span>
            </div>
          </div>
        </div>

        {/* Relógio em Tempo Real Isolado */}
        <LiveClock />

        {/* Operador e Ações */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 leading-none">Operador(a)</div>
              <div className="font-bold text-white text-xs truncate max-w-[120px]">
                {user?.nome || user?.username}
              </div>
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden sm:block"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-colors"
              title="Voltar ao Livro Caixa no sistema principal"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Caixa</span>
            </button>
          )}
        </div>
      </header>

      {/* Conteúdo Principal Dividido em 2 Colunas */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950">
        {/* COLUNA ESQUERDA: Busca de Alunos e Abas de Status */}
        <div className="w-full lg:w-5/12 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col bg-slate-900/60 p-4 min-w-0">
          <div className="space-y-2.5 mb-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span>Busca de Alunos (Todos os Nomes da Base)</span>
              </label>
            </div>

            {/* Input com prioridade de digitação imediata e debounce */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                autoFocus
                placeholder="Digite o nome do aluno, CPF ou curso letra por letra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-0.5"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Abas Rápidas de Status: Vencidas, A Vencer, Pagas, Todas */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setStatusTab('TODAS')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  statusTab === 'TODAS'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>Todas</span>
                <span className="text-[10px] font-mono opacity-80">({counts.todas})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusTab('VENCIDAS')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  statusTab === 'VENCIDAS'
                    ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                    : 'bg-rose-950/40 text-rose-300 hover:bg-rose-950/70 border border-rose-900/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>Vencidas</span>
                <span className="text-[10px] font-mono font-bold">({counts.vencidas})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusTab('AVENCER')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  statusTab === 'AVENCER'
                    ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                    : 'bg-amber-950/40 text-amber-300 hover:bg-amber-950/70 border border-amber-900/60'
                }`}
              >
                <span>A Vencer</span>
                <span className="text-[10px] font-mono">({counts.avencer})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusTab('PAGAS')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  statusTab === 'PAGAS'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-950/70 border border-emerald-900/60'
                }`}
              >
                <span>Pagas</span>
                <span className="text-[10px] font-mono">({counts.pagas})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusTab('SEM_CONTRATO')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  statusTab === 'SEM_CONTRATO'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-500 hover:text-slate-300 border border-slate-800'
                }`}
              >
                <span>Sem Contrato</span>
                <span className="text-[10px] font-mono">({counts.semContrato})</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
              <span>
                {searchTerm ? (
                  <>
                    Filtrando por: <strong className="text-emerald-400">"{searchTerm}"</strong>
                  </>
                ) : (
                  <span>
                    Exibindo categoria: <strong>{statusTab}</strong>
                  </span>
                )}
              </span>
              <span className="font-mono text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded">
                {filteredItens.length} resultado(s)
              </span>
            </div>
          </div>

          {/* Lista de Alunos e Contratos com Rolagem Ultra Fluida */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Carregando base completa de alunos e mensalidades...
              </div>
            ) : filteredItens.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-xs">
                Nenhum aluno ou contrato localizado para o filtro selecionado.
              </div>
            ) : (
              <>
                {filteredItens.slice(0, 60).map((m) => {
                  const isSelected =
                    (m.ID_mensalidade && selectedPlano?.ID_mensalidade === m.ID_mensalidade) ||
                    (!m.ID_mensalidade && selectedPlano?.idaluno === m.idaluno);

                  return (
                    <div
                      key={`${m.idaluno}-${m.ID_mensalidade || 'sem'}`}
                      onClick={() => selectPlano(m)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-600 text-white'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                            <span>
                              <HighlightText text={m.nome_aluno} query={deferredSearch} />
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 font-normal">
                              CPF: <HighlightText text={m.cpf_aluno || '-'} query={deferredSearch} />
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                            <span>
                              <HighlightText text={m.curso} query={deferredSearch} />
                            </span>
                            {m.tem_contrato && (
                              <>
                                <span>·</span>
                                <span>
                                  Parc. {m.parcelas_pagas}/{m.n_parcelas}
                                </span>
                              </>
                            )}
                            {m.origem === 'tb_caixa' && (
                              <span className="text-[9px] bg-slate-800 text-slate-300 px-1 rounded">
                                Caixa
                              </span>
                            )}
                          </div>
                          {/* Badge de Status da Mensalidade */}
                          <div className="mt-1 flex items-center gap-1.5">
                            {m.status_parcela === 'VENCIDA' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                VENCIDA {m.dias_atraso > 0 ? `(${m.dias_atraso}d em atraso)` : ''}
                              </span>
                            )}
                            {m.status_parcela === 'AVENCER' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                                A VENCER ({m.data_pagar || 'No prazo'})
                              </span>
                            )}
                            {m.status_parcela === 'PAGA' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                PAGA (Quitada)
                              </span>
                            )}
                            {m.status_parcela === 'SEM_CONTRATO' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                Sem Contrato Gerado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-500 block">Saldo</span>
                        <span
                          className={`font-mono font-bold text-xs ${
                            m.status_parcela === 'VENCIDA'
                              ? 'text-rose-400'
                              : m.status_parcela === 'AVENCER'
                              ? 'text-amber-400'
                              : m.status_parcela === 'PAGA'
                              ? 'text-emerald-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {m.tem_contrato ? formatMoney(m.saldo_devedor) : 'R$ 0,00'}
                        </span>
                        {m.tem_contrato && (
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {formatMoney(m.valor_parcela)}/mês
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredItens.length > 60 && (
                  <div className="p-3 text-center text-[11px] text-slate-400 bg-slate-950/70 rounded-xl border border-slate-800">
                    Exibindo os primeiros 60 de {filteredItens.length.toLocaleString('pt-BR')} resultados. Digite letras para refinar.
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: Detalhes, Baixa e Pagamento */}
        <div className="w-full lg:w-7/12 flex flex-col bg-slate-950 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          {msg && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 mb-4 shadow-sm ${
                msg.type === 'ok'
                  ? 'bg-emerald-950 border border-emerald-800 text-emerald-200'
                  : 'bg-rose-950 border border-rose-800 text-rose-200'
              }`}
            >
              {msg.type === 'ok' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span className="font-medium">{msg.text}</span>
            </div>
          )}

          {selectedPlano ? (
            selectedPlano.tem_contrato ? (
              <form onSubmit={handleConfirmarRecebimento} className="space-y-4">
                {/* Banner de Status Especial se Vencida ou Paga */}
                {selectedPlano.status_parcela === 'VENCIDA' && (
                  <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl flex items-center gap-2.5 text-xs text-rose-200">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
                    <div>
                      <strong>Atenção: Mensalidade Vencida!</strong>
                      <p className="text-[11px] text-rose-300">
                        Venceu em {selectedPlano.data_pagar}{' '}
                        {selectedPlano.dias_atraso > 0 ? `(${selectedPlano.dias_atraso} dias de atraso)` : ''}.
                        Priorize a quitação no caixa.
                      </p>
                    </div>
                  </div>
                )}

                {selectedPlano.status_parcela === 'PAGA' && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl flex items-center gap-2.5 text-xs text-emerald-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <strong>Mensalidade Integralmente Quitada!</strong>
                      <p className="text-[11px] text-emerald-300">
                        Todas as {selectedPlano.n_parcelas} parcelas deste contrato já foram pagas. Saldo restante: R$ 0,00.
                      </p>
                    </div>
                  </div>
                )}

                {/* Card Resumo do Aluno e Contrato */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider font-bold">
                        Aluno Selecionado da Base
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                        {selectedPlano.nome_aluno}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>
                          CPF: <strong className="text-slate-200 font-mono">{selectedPlano.cpf_aluno || '-'}</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Curso: <strong className="text-slate-200">{selectedPlano.curso}</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Contrato: <strong className="text-slate-200 font-mono">#{selectedPlano.ID_mensalidade}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Saldo Devedor</div>
                      <div
                        className={`text-xl sm:text-2xl font-bold font-mono ${
                          selectedPlano.status_parcela === 'VENCIDA'
                            ? 'text-rose-400'
                            : selectedPlano.status_parcela === 'PAGA'
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {formatMoney(selectedPlano.saldo_devedor)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Parcelas: {selectedPlano.parcelas_pagas || 0} de {selectedPlano.n_parcelas} pagas
                      </div>
                    </div>
                  </div>
                </div>

                {/* QUADRO DE MENSALIDADES DO ALUNO (PAGAS, ATRASADAS E A VENCER) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          Quadro Financeiro do Aluno
                          {loadingDetalhe && (
                            <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Situação das parcelas pagas, atrasadas e a vencer
                        </p>
                      </div>
                    </div>

                    {/* Abas do Quadro */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setQuadroFilter('TODAS')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                          quadroFilter === 'TODAS'
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Todas ({detalheAluno?.parcelas?.length || selectedPlano.n_parcelas})
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuadroFilter('ATRASADAS')}
                        className={`px-2 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                          quadroFilter === 'ATRASADAS'
                            ? 'bg-rose-950 text-rose-200 border border-rose-800 shadow-xs'
                            : 'text-rose-400/80 hover:text-rose-300'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Atrasadas ({detalheAluno?.resumo?.total_atrasadas_qtd ?? (selectedPlano.status_parcela === 'VENCIDA' ? 1 : 0)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuadroFilter('AVENCER')}
                        className={`px-2 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                          quadroFilter === 'AVENCER'
                            ? 'bg-amber-950 text-amber-200 border border-amber-800 shadow-xs'
                            : 'text-amber-400/80 hover:text-amber-300'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        A Vencer ({detalheAluno?.resumo?.total_avencer_qtd ?? Math.max(0, (selectedPlano.n_parcelas - (selectedPlano.parcelas_pagas || 0) - (selectedPlano.status_parcela === 'VENCIDA' ? 1 : 0)))})
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuadroFilter('PAGAS')}
                        className={`px-2 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                          quadroFilter === 'PAGAS'
                            ? 'bg-emerald-950 text-emerald-200 border border-emerald-800 shadow-xs'
                            : 'text-emerald-400/80 hover:text-emerald-300'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Pagas ({detalheAluno?.resumo?.total_pagas_qtd ?? selectedPlano.parcelas_pagas ?? 0})
                      </button>
                    </div>
                  </div>

                  {/* Resumo em 3 Métricas Visuais */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Pagas */}
                    <div
                      onClick={() => setQuadroFilter(quadroFilter === 'PAGAS' ? 'TODAS' : 'PAGAS')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        quadroFilter === 'PAGAS'
                          ? 'bg-emerald-950/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-slate-950/80 border-slate-800 hover:border-emerald-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Pagas
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                          {detalheAluno?.resumo?.total_pagas_qtd ?? selectedPlano.parcelas_pagas ?? 0}
                        </span>
                      </div>
                      <div className="text-sm sm:text-base font-bold font-mono text-emerald-300 mt-1">
                        {formatMoney(
                          detalheAluno?.resumo?.total_pagas_valor ??
                            ((selectedPlano.parcelas_pagas || 0) * (selectedPlano.valor_parcela || 0))
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">parcelas quitadas</span>
                    </div>

                    {/* Atrasadas */}
                    <div
                      onClick={() => setQuadroFilter(quadroFilter === 'ATRASADAS' ? 'TODAS' : 'ATRASADAS')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        quadroFilter === 'ATRASADAS'
                          ? 'bg-rose-950/90 border-rose-500 shadow-md ring-1 ring-rose-500/30'
                          : 'bg-slate-950/80 border-slate-800 hover:border-rose-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Atrasadas
                        </span>
                        <span className="text-xs font-mono font-bold text-rose-300 bg-rose-950 px-1.5 py-0.2 rounded border border-rose-800">
                          {detalheAluno?.resumo?.total_atrasadas_qtd ?? (selectedPlano.status_parcela === 'VENCIDA' ? 1 : 0)}
                        </span>
                      </div>
                      <div className="text-sm sm:text-base font-bold font-mono text-rose-400 mt-1">
                        {formatMoney(
                          detalheAluno?.resumo?.total_atrasadas_valor ??
                            (selectedPlano.status_parcela === 'VENCIDA' ? selectedPlano.valor_parcela : 0)
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">vencidas no prazo</span>
                    </div>

                    {/* A Vencer */}
                    <div
                      onClick={() => setQuadroFilter(quadroFilter === 'AVENCER' ? 'TODAS' : 'AVENCER')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        quadroFilter === 'AVENCER'
                          ? 'bg-amber-950/90 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-slate-950/80 border-slate-800 hover:border-amber-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          A Vencer
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800">
                          {detalheAluno?.resumo?.total_avencer_qtd ??
                            Math.max(
                              0,
                              (selectedPlano.n_parcelas || 1) -
                                (selectedPlano.parcelas_pagas || 0) -
                                (selectedPlano.status_parcela === 'VENCIDA' ? 1 : 0)
                            )}
                        </span>
                      </div>
                      <div className="text-sm sm:text-base font-bold font-mono text-amber-400 mt-1">
                        {formatMoney(
                          detalheAluno?.resumo?.total_avencer_valor ??
                            Math.max(
                              0,
                              (selectedPlano.saldo_devedor || 0) -
                                (selectedPlano.status_parcela === 'VENCIDA' ? selectedPlano.valor_parcela : 0)
                            )
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">futuras parcelas</span>
                    </div>
                  </div>

                  {/* Lista de Parcelas com Rolagem */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/90">
                    <div className="max-h-44 overflow-y-auto custom-scrollbar divide-y divide-slate-800/60">
                      {parcelasFiltradasQuadro.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          Nenhuma parcela encontrada para o filtro selecionado.
                        </div>
                      ) : (
                        parcelasFiltradasQuadro.map((p: any) => (
                          <div
                            key={`${p.contratoId}-${p.numero}`}
                            className={`p-2.5 flex items-center justify-between gap-3 text-xs transition-colors ${
                              p.status === 'ATRASADA'
                                ? 'bg-rose-950/20 hover:bg-rose-950/40'
                                : p.status === 'PAGA'
                                ? 'bg-emerald-950/10 hover:bg-emerald-950/30'
                                : 'hover:bg-slate-900/60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold flex items-center justify-center text-slate-300 shrink-0">
                                {p.numero}
                              </span>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-200 truncate flex items-center gap-1.5">
                                  <span>Parcela {p.numero}/{selectedPlano.n_parcelas}</span>
                                  <span className="text-[10px] text-slate-500">· Venc. {p.data_vencimento}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  {p.status === 'PAGA' && (
                                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Paga
                                    </span>
                                  )}
                                  {p.status === 'ATRASADA' && (
                                    <span className="text-rose-400 font-bold flex items-center gap-0.5">
                                      <AlertTriangle className="w-3 h-3" />
                                      Atrasada ({p.dias_atraso}d em atraso)
                                    </span>
                                  )}
                                  {p.status === 'AVENCER' && (
                                    <span className="text-amber-400 font-medium">
                                      A Vencer
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-mono font-bold text-white">
                                {formatMoney(p.valor)}
                              </span>

                              {p.status !== 'PAGA' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRecebimentoData((prev) => ({
                                      ...prev,
                                      valor_pago: p.valor,
                                      observacao: `Recebimento Parcela ${p.numero}/${selectedPlano.n_parcelas} - ${selectedPlano.nome_aluno}`,
                                    }));
                                    if (emDuasFormas) {
                                      const v1 = Number((p.valor / 2).toFixed(2));
                                      const v2 = Number((p.valor - v1).toFixed(2));
                                      setRecebimentoData((prev) => ({ ...prev, valor_pago: v1 }));
                                      setValor2(v2);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-md text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Carregar esta parcela para recebimento imediato"
                                >
                                  <span>Receber</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* ÁREA DE RECEBIMENTO DO PAGAMENTO */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden space-y-4">
                  {/* Cabeçalho da Quitação + Toggle para Receber em 2 Formas */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider font-bold">
                        Estação de Caixa
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">
                        Registrar Recebimento de Mensalidade
                      </h4>
                    </div>

                    {/* Toggle: Receber em 2 Formas */}
                    <div className="flex items-center gap-2.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                      <Split className={`w-4 h-4 ${emDuasFormas ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <label className="text-xs font-bold text-slate-300 cursor-pointer flex items-center gap-2">
                        <span>Receber em 2 Formas</span>
                        <input
                          type="checkbox"
                          checked={emDuasFormas}
                          onChange={(e) => handleToggleDuasFormas(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Se NÃO estiver em 2 formas (Forma Única Tradicional) */}
                  {!emDuasFormas ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-2">
                          Forma de Pagamento no Caixa *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {formasPagamento.map((f) => {
                            const Icon = f.icon;
                            const isChosen = recebimentoData.forma_pagamento === f.id;
                            return (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => setRecebimentoData({ ...recebimentoData, forma_pagamento: f.id })}
                                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                  isChosen
                                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950 font-bold scale-[1.02]'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                <span className="text-xs">{f.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            Valor a Receber (R$) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-500 font-mono font-bold text-sm">
                              R$
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              max={selectedPlano.saldo_devedor || undefined}
                              required
                              value={recebimentoData.valor_pago || ''}
                              onChange={(e) =>
                                setRecebimentoData({ ...recebimentoData, valor_pago: Number(e.target.value) })
                              }
                              className="w-full pl-10 pr-3 py-2 text-base font-bold font-mono bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div className="flex gap-1.5 mt-1.5">
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
                              className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium cursor-pointer"
                            >
                              1 Parcela ({formatMoney(selectedPlano.valor_parcela)})
                            </button>
                            {selectedPlano.saldo_devedor > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setRecebimentoData({
                                    ...recebimentoData,
                                    valor_pago: selectedPlano.saldo_devedor || 0,
                                  })
                                }
                                className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium cursor-pointer"
                              >
                                Quitar Total ({formatMoney(selectedPlano.saldo_devedor)})
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            Observação / Identificação do Recibo
                          </label>
                          <input
                            type="text"
                            value={recebimentoData.observacao}
                            onChange={(e) =>
                              setRecebimentoData({ ...recebimentoData, observacao: e.target.value })
                            }
                            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    /* SE ESTIVER EM 2 FORMAS (PAGAMENTO MISTO) */
                    <div className="space-y-4 pt-1">
                      <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-xl text-xs text-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Split className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>
                            <strong>Pagamento Dividido:</strong> Defina o valor pago na 1ª e na 2ª Forma.
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const total = Math.min(selectedPlano.valor_parcela || 0, selectedPlano.saldo_devedor || 0);
                              const half1 = Number((total / 2).toFixed(2));
                              const half2 = Number((total - half1).toFixed(2));
                              setRecebimentoData((prev) => ({ ...prev, valor_pago: half1 }));
                              setValor2(half2);
                            }}
                            className="px-2 py-1 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 rounded text-[10px] font-bold cursor-pointer"
                          >
                            50% / 50% Parcela
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const totalAlvo = Number(selectedPlano.valor_parcela || selectedPlano.saldo_devedor || 0);
                              const v1 = Number(recebimentoData.valor_pago) || 0;
                              setValor2(Math.max(0, Number((totalAlvo - v1).toFixed(2))));
                            }}
                            className="px-2 py-1 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Completar 1 Parcela
                          </button>
                        </div>
                      </div>

                      {/* Bloco 1ª Forma */}
                      <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-700 text-[10px] font-bold flex items-center justify-center text-emerald-300">
                              1
                            </span>
                            1ª Forma de Pagamento
                          </span>
                          <span className="font-mono text-xs font-bold text-white">
                            {formatMoney(Number(recebimentoData.valor_pago))}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                          {formasPagamento.map((f) => {
                            const isChosen = recebimentoData.forma_pagamento === f.id;
                            const Icon = f.icon;
                            return (
                              <button
                                key={`f1-${f.id}`}
                                type="button"
                                onClick={() => setRecebimentoData({ ...recebimentoData, forma_pagamento: f.id })}
                                className={`py-1.5 px-2 rounded-lg border text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                  isChosen
                                    ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{f.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="relative pt-1">
                          <span className="absolute left-3 top-3.5 text-slate-500 font-mono font-bold text-xs">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={recebimentoData.valor_pago || ''}
                            onChange={(e) =>
                              setRecebimentoData({ ...recebimentoData, valor_pago: Number(e.target.value) })
                            }
                            placeholder="Valor da 1ª Forma"
                            className="w-full pl-9 pr-3 py-2 text-sm font-bold font-mono bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Bloco 2ª Forma */}
                      <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-700 text-[10px] font-bold flex items-center justify-center text-indigo-300">
                              2
                            </span>
                            2ª Forma de Pagamento
                          </span>
                          <span className="font-mono text-xs font-bold text-white">
                            {formatMoney(Number(valor2))}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                          {formasPagamento.map((f) => {
                            const isChosen = forma2 === f.id;
                            const Icon = f.icon;
                            return (
                              <button
                                key={`f2-${f.id}`}
                                type="button"
                                onClick={() => setForma2(f.id)}
                                className={`py-1.5 px-2 rounded-lg border text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                  isChosen
                                    ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{f.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="relative pt-1">
                          <span className="absolute left-3 top-3.5 text-slate-500 font-mono font-bold text-xs">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={valor2 || ''}
                            onChange={(e) => setValor2(Number(e.target.value))}
                            placeholder="Valor da 2ª Forma"
                            className="w-full pl-9 pr-3 py-2 text-sm font-bold font-mono bg-slate-900 border border-slate-700 rounded-xl text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Barra de Conferência da Soma das 2 Formas */}
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
                          <span className="font-semibold">Soma Total:</span>
                          <span className="font-mono font-bold text-white text-sm">
                            {formatMoney(Number(recebimentoData.valor_pago) + Number(valor2))}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ({recebimentoData.forma_pagamento}: {formatMoney(Number(recebimentoData.valor_pago))} + {forma2}: {formatMoney(Number(valor2))})
                          </span>
                        </div>

                        <div>
                          {(Number(recebimentoData.valor_pago) + Number(valor2)) > (selectedPlano.saldo_devedor + 0.05) ? (
                            <span className="text-[11px] font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                              Excede saldo devedor
                            </span>
                          ) : (Number(recebimentoData.valor_pago) + Number(valor2)) <= 0 ? (
                            <span className="text-[11px] font-medium text-slate-500">
                              Informe os valores
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Pronto para quitar
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Observação */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Observação / Identificação do Recibo
                        </label>
                        <input
                          type="text"
                          value={recebimentoData.observacao}
                          onChange={(e) =>
                            setRecebimentoData({ ...recebimentoData, observacao: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Opção Integrar no Livro Caixa */}
                  <div className="pt-3 border-t border-slate-800">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={recebimentoData.gerar_caixa}
                        onChange={(e) =>
                          setRecebimentoData({ ...recebimentoData, gerar_caixa: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                      />
                      <span>
                        Lançar automaticamente como <strong>Entrada</strong> no Livro Caixa diário
                      </span>
                    </label>
                  </div>
                </div>

                {/* Botão de Quitação Principal */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      (Number(recebimentoData.valor_pago) + (emDuasFormas ? Number(valor2) : 0)) <= 0
                    }
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-5 h-5" />
                    <span>
                      {submitting
                        ? 'Processando Quitação...'
                        : emDuasFormas
                        ? `Confirmar Recebimento de ${formatMoney(Number(recebimentoData.valor_pago) + Number(valor2))} em 2 Formas`
                        : `Confirmar Recebimento de ${formatMoney(Number(recebimentoData.valor_pago))} (Enter)`}
                    </span>
                  </button>
                </div>
              </form>
            ) : (
              /* ALUNO CADASTRADO MAS SEM CONTRATO FINANCEIRO AINDA */
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase">
                        {selectedPlano.origem === 'tb_caixa' ? 'Pagador / Atendimento em Caixa' : 'Aluno(a) Cadastrado(a) na Base'}
                      </span>
                      <h3 className="text-base font-bold text-white">{selectedPlano.nome_aluno}</h3>
                      <div className="text-xs text-slate-400">
                        CPF: <strong className="text-slate-300 font-mono">{selectedPlano.cpf_aluno}</strong> · Curso:{' '}
                        <strong className="text-slate-300">{selectedPlano.curso}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-200">
                    <p className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Este cadastro ainda não possui contrato financeiro de mensalidades registrado.
                    </p>
                    <p className="text-[11px] text-amber-300/90 mt-1">
                      Você pode gerar o contrato de mensalidades agora com 1 clique para habilitar os recebimentos recorrentes.
                    </p>
                  </div>

                  <form onSubmit={handleGerarContratoRapido} className="mt-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Nº de Parcelas *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="48"
                          required
                          value={novoContratoData.n_parcelas}
                          onChange={(e) =>
                            setNovoContratoData({
                              ...novoContratoData,
                              n_parcelas: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Valor da Parcela (R$) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          required
                          value={novoContratoData.valor_parcela}
                          onChange={(e) =>
                            setNovoContratoData({
                              ...novoContratoData,
                              valor_parcela: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          1º Vencimento *
                        </label>
                        <input
                          type="date"
                          required
                          value={novoContratoData.data_pagar}
                          onChange={(e) =>
                            setNovoContratoData({
                              ...novoContratoData,
                              data_pagar: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-slate-400">Valor Total do Contrato Calculado:</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {formatMoney(novoContratoData.n_parcelas * novoContratoData.valor_parcela)}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={gerandoContrato}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{gerandoContrato ? 'Gerando Plano...' : 'Gerar Contrato de Mensalidade e Habilitar Recebimento'}</span>
                    </button>
                  </form>
                </div>
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <Receipt className="w-12 h-12 text-slate-700 mb-3" />
              <h4 className="text-base font-bold text-slate-400">Nenhum aluno selecionado</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Utilize o campo de busca à esquerda para pesquisar entre todos os alunos cadastrados e verificar mensalidades vencidas, a vencer ou pagas.
              </p>
            </div>
          )}

          {/* Modal / Card de Último Comprovante Gerado */}
          {ultimoComprovante && (
            <div className="mt-6 bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Comprovante de Quitação Emitido</span>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Imprimir Comprovante</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3">
                <div>
                  <span className="text-[10px] text-slate-500 block">Aluno</span>
                  <span className="font-bold text-white truncate block">{ultimoComprovante.aluno}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Valor Quitado</span>
                  <span className="font-bold text-emerald-400 font-mono block">
                    {formatMoney(ultimoComprovante.valor_pago)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Forma</span>
                  <span className="font-semibold text-white block">{ultimoComprovante.forma}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Saldo Restante</span>
                  <span className="font-mono text-slate-300 block">
                    {formatMoney(ultimoComprovante.saldo_restante)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
