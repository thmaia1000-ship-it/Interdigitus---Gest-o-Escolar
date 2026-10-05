import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Receipt,
  Search,
  Check,
  X,
  Printer,
  Wallet,
  Clock,
  User,
  ArrowLeft,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  RotateCcw,
} from 'lucide-react';

// Normalização para busca sem acentos e minúsculo
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

const formatMoney = (val: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
};

interface ReceberMensalidadeViewProps {
  onClose?: () => void;
}

export const ReceberMensalidadeView: React.FC<ReceberMensalidadeViewProps> = ({ onClose }) => {
  const { user } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Estados de dados
  const [mensalidades, setMensalidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlano, setSelectedPlano] = useState<any | null>(null);

  // Filtros de busca letra por letra
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroApenasComSaldo, setFiltroApenasComSaldo] = useState(true);

  // Formulário de Quitação
  const [recebimentoData, setRecebimentoData] = useState({
    valor_pago: 0,
    forma_pagamento: 'PIX',
    gerar_caixa: true,
    observacao: '',
  });

  // Relógio e Tela Cheia
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Status e Comprovante
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [ultimoComprovante, setUltimoComprovante] = useState<any | null>(null);

  // Atualização do relógio ao vivo
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
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

  // Foco automático no input de busca ao carregar
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Carregar lista de mensalidades da API
  const loadMensalidades = async () => {
    setLoading(true);
    try {
      const data = await api.getMensalidades();
      setMensalidades(data);
      if (data.length > 0 && !selectedPlano) {
        const primeiroComSaldo = data.find((m: any) => (m.saldo_devedor || 0) > 0) || data[0];
        if (primeiroComSaldo) {
          selectPlano(primeiroComSaldo);
        }
      }
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message || 'Erro ao carregar mensalidades.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMensalidades();
  }, []);

  const selectPlano = (plano: any) => {
    setSelectedPlano(plano);
    setRecebimentoData((prev) => ({
      ...prev,
      valor_pago: Math.min(plano.valor_parcela || 0, plano.saldo_devedor || 0),
      observacao: `Recebimento Mensalidade Aluno: ${plano.nome_aluno} (${plano.curso})`,
    }));
  };

  // Filtragem em tempo real letra por letra
  const filteredMensalidades = mensalidades.filter((m) => {
    if (filtroApenasComSaldo && (m.saldo_devedor || 0) <= 0) return false;
    if (!searchTerm.trim()) return true;

    const term = normalizeSearch(searchTerm);
    const cleanDigits = searchTerm.replace(/[^\d]/g, '');
    const cleanCpf = (m.cpf_aluno || '').replace(/[^\d]/g, '');
    const nomeAlunoNorm = normalizeSearch(m.nome_aluno || '');
    const cursoNorm = normalizeSearch(m.curso || '');

    return (
      nomeAlunoNorm.includes(term) ||
      (cleanDigits.length >= 2 && cleanCpf.includes(cleanDigits)) ||
      cursoNorm.includes(term) ||
      String(m.ID_mensalidade).includes(term)
    );
  });

  // Ao digitar letras, seleciona automaticamente o primeiro resultado caso o atual não esteja nos resultados
  useEffect(() => {
    if (searchTerm.trim() && filteredMensalidades.length > 0) {
      const stillSelected = filteredMensalidades.some(
        (m) => m.ID_mensalidade === selectedPlano?.ID_mensalidade
      );
      if (!stillSelected) {
        selectPlano(filteredMensalidades[0]);
      }
    }
  }, [searchTerm, filtroApenasComSaldo]);

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
    if (!selectedPlano) return;
    const valorNum = Number(recebimentoData.valor_pago);
    if (valorNum <= 0) {
      setMsg({ type: 'err', text: 'Informe um valor válido maior que zero.' });
      return;
    }

    setSubmitting(true);
    setMsg(null);
    try {
      const res = await api.registrarPagamentoMensalidade({
        idmensalidade: selectedPlano.ID_mensalidade,
        valor_pago: valorNum,
        forma_pagamento: recebimentoData.forma_pagamento,
        gerar_caixa: recebimentoData.gerar_caixa,
        observacao: recebimentoData.observacao,
      });

      const comprovanteInfo = {
        data: new Date().toLocaleDateString('pt-BR'),
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        operador: user?.nome || user?.username || 'Caixa',
        aluno: selectedPlano.nome_aluno,
        cpf: selectedPlano.cpf_aluno,
        curso: selectedPlano.curso,
        valor_pago: valorNum,
        forma: recebimentoData.forma_pagamento,
        parcela: (parseInt(selectedPlano.parcelas_pagas || '0', 10) + 1) + '/' + selectedPlano.n_parcelas,
        saldo_restante: Math.max(0, (selectedPlano.saldo_devedor || 0) - valorNum),
        id_mensalidade: selectedPlano.ID_mensalidade,
        id_caixa: res.caixa?.ID_caixa,
      };

      setUltimoComprovante(comprovanteInfo);
      setMsg({
        type: 'ok',
        text: `Recebimento de ${formatMoney(valorNum)} do aluno(a) ${selectedPlano.nome_aluno} quitado com sucesso!`,
      });

      // Recarregar mensalidades
      await loadMensalidades();
      searchInputRef.current?.focus();
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message || 'Falha ao processar quitação.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formasPagamento = [
    { id: 'PIX', label: 'PIX', icon: QrCode, color: 'text-teal-600 bg-teal-50 border-teal-200' },
    { id: 'Dinheiro', label: 'Dinheiro', icon: Banknote, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'Cartão Débito', label: 'Débito', icon: CreditCard, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'Cartão Crédito', label: 'Crédito', icon: CreditCard, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'Boleto', label: 'Boleto', icon: FileText, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  ];

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
                Terminal Exclusivo Aberto
              </span>
              <span>·</span>
              <span className="hidden sm:inline">Baixa no Livro Caixa e Quitação Escolar</span>
            </div>
          </div>
        </div>

        {/* Relógio em Tempo Real */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400 capitalize">{currentDate}</span>
          <span className="text-white font-bold tracking-wider">{currentTime}</span>
        </div>

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
        {/* COLUNA ESQUERDA: Busca de Alunos e Lista em Tempo Real */}
        <div className="w-full lg:w-5/12 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col bg-slate-900/60 p-4 min-w-0">
          <div className="space-y-2.5 mb-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span>Busca de Alunos (Instantânea letra por letra)</span>
              </label>
              <button
                type="button"
                onClick={() => setFiltroApenasComSaldo(!filtroApenasComSaldo)}
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors flex items-center gap-1 ${
                  filtroApenasComSaldo
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                <span>{filtroApenasComSaldo ? 'Apenas com Saldo Aberto' : 'Todos os Contratos'}</span>
              </button>
            </div>

            {/* Input com autofocus e live filter */}
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

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>
                {searchTerm ? (
                  <>
                    Filtrando por: <strong className="text-emerald-400">"{searchTerm}"</strong>
                  </>
                ) : (
                  'Todos os contratos disponíveis'
                )}
              </span>
              <span className="font-mono text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded">
                {filteredMensalidades.length} aluno(s)
              </span>
            </div>
          </div>

          {/* Lista de Alunos com Rolagem Rápida */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Carregando base de alunos e mensalidades...
              </div>
            ) : filteredMensalidades.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-xs">
                Nenhum aluno encontrado para "{searchTerm}".
              </div>
            ) : (
              filteredMensalidades.map((m) => {
                const isSelected = selectedPlano?.ID_mensalidade === m.ID_mensalidade;
                const temSaldo = (m.saldo_devedor || 0) > 0;
                return (
                  <div
                    key={m.ID_mensalidade}
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
                          <span>{highlightMatch(m.nome_aluno, searchTerm)}</span>
                          <span className="text-[10px] font-mono text-slate-400 font-normal">
                            CPF: {highlightMatch(m.cpf_aluno || '-', searchTerm)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {highlightMatch(m.curso, searchTerm)} · Parc. {m.parcelas_pagas || 0}/{m.n_parcelas} · R${' '}
                          {(m.valor_parcela || 0).toFixed(2)}/mês
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 block">Saldo Devedor</span>
                      <span
                        className={`font-mono font-bold text-xs ${
                          temSaldo ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {formatMoney(m.saldo_devedor)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: Terminal de Baixa e Confirmação de Pagamento */}
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
            <form onSubmit={handleConfirmarRecebimento} className="space-y-4">
              {/* Card Resumo do Aluno Selecionado */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider font-bold">
                      Aluno Selecionado para Quitação
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                      {selectedPlano.nome_aluno}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>CPF: <strong className="text-slate-200 font-mono">{selectedPlano.cpf_aluno || '-'}</strong></span>
                      <span>·</span>
                      <span>Curso: <strong className="text-slate-200">{selectedPlano.curso}</strong></span>
                      <span>·</span>
                      <span>Contrato: <strong className="text-slate-200 font-mono">#{selectedPlano.ID_mensalidade}</strong></span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Saldo Devedor Atual</div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
                      {formatMoney(selectedPlano.saldo_devedor)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Parcelas: {selectedPlano.parcelas_pagas || 0} de {selectedPlano.n_parcelas} pagas
                    </div>
                  </div>
                </div>

                {/* Seletor Rápido de Forma de Pagamento */}
                <div className="pt-4">
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
                          className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
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

                {/* Campos do Valor e Observação */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
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
                            valor_pago: Math.min(selectedPlano.valor_parcela || 0, selectedPlano.saldo_devedor || 0),
                          })
                        }
                        className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
                      >
                        1 Parcela ({formatMoney(selectedPlano.valor_parcela)})
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setRecebimentoData({
                            ...recebimentoData,
                            valor_pago: selectedPlano.saldo_devedor || 0,
                          })
                        }
                        className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
                      >
                        Quitar Total ({formatMoney(selectedPlano.saldo_devedor)})
                      </button>
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

                {/* Opção Integrar no Livro Caixa */}
                <div className="pt-4 border-t border-slate-800 mt-4">
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
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || Number(recebimentoData.valor_pago) <= 0}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-5 h-5" />
                  <span>
                    {submitting
                      ? 'Processando Quitação...'
                      : `Confirmar Recebimento de ${formatMoney(Number(recebimentoData.valor_pago))} (Enter)`}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <Receipt className="w-12 h-12 text-slate-700 mb-3" />
              <h4 className="text-base font-bold text-slate-400">Nenhum aluno selecionado</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Utilize o campo de busca à esquerda para encontrar o aluno letra por letra e carregar seus dados financeiros.
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
