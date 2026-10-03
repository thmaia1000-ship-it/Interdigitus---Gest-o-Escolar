import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { PagamentoProfessor, Professor, Curso, Materia } from '../types/schema.js';
import { Briefcase, Plus, Search, DollarSign, X, CheckCircle, AlertCircle, ChevronDown, Calendar, Layers } from 'lucide-react';

export const PagamentosProfessoresView: React.FC = () => {
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modais
  const [isNovoCompromissoOpen, setIsNovoCompromissoOpen] = useState(false);
  const [isParcialOpen, setIsParcialOpen] = useState(false);
  const [selectedCompromisso, setSelectedCompromisso] = useState<any | null>(null);

  // Form Novo Compromisso
  const [novoCompromisso, setNovoCompromisso] = useState<Omit<PagamentoProfessor, 'ID_pagamento'>>({
    valor_total: 2000,
    valor_pendente: 2000,
    pagamento: 'Mensal',
    professor: '',
    turma: 'ENF-2025-1M',
    materia: '',
    carga_horaria: '60h',
    idprofessor: 0,
    idmateria: null,
    idcurso: null,
    descricao: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: new Date(Date.now() + 120 * 24 * 3600 * 1000).toISOString().split('T')[0],
    data_pagou: null,
    usuario: '',
    data_gerada: new Date().toISOString().split('T')[0],
    tipo: 'Hora/Aula',
  });

  // Form Pagamento Parcial
  const [parcialData, setParcialData] = useState({
    valor: 500,
    tipo: 'Transferência PIX',
  });

  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pagList, profList, curList, matList] = await Promise.all([
        api.getPagamentosProfessores({ search: search || undefined }),
        api.getProfessores(),
        api.getCursos(),
        api.getMaterias(),
      ]);
      setPagamentos(pagList);
      setProfessores(profList);
      setCursos(curList);
      setMaterias(matList);
      if (profList.length > 0 && !novoCompromisso.idprofessor) {
        setNovoCompromisso((prev) => ({
          ...prev,
          idprofessor: profList[0].ID_professor,
          professor: profList[0].nome_professor,
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

  const handleOpenParcial = (p: any) => {
    setSelectedCompromisso(p);
    setParcialData({
      valor: p.valor_pendente > 0 ? p.valor_pendente : 0,
      tipo: 'Transferência PIX',
    });
    setMsg(null);
    setIsParcialOpen(true);
  };

  const handleSalvarParcial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompromisso) return;
    try {
      await api.createPagamentoParcial({
        idpagamento: selectedCompromisso.ID_pagamento,
        valor: Number(parcialData.valor),
        tipo: parcialData.tipo,
      });
      setMsg({ type: 'ok', text: 'Pagamento parcial registrado e saldo pendente atualizado!' });
      setIsParcialOpen(false);
      loadData();
      setTimeout(() => setMsg(null), 3500);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    }
  };

  const handleSalvarCompromisso = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPagamentoProfessor(novoCompromisso);
      setMsg({ type: 'ok', text: 'Compromisso docente registrado com sucesso!' });
      setIsNovoCompromissoOpen(false);
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Compromissos Docentes</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de contratos, valores devidos e pendências da tabela <code className="font-mono text-indigo-600">tb_pagamentos</code>
          </p>
        </div>
        <button
          onClick={() => {
            setMsg(null);
            setIsNovoCompromissoOpen(true);
          }}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Compromisso Docente</span>
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
            placeholder="Buscar por professor, matéria ou turma..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </form>
        <span className="text-xs text-slate-500 font-mono">{pagamentos.length} compromisso(s)</span>
      </div>

      {/* Tabela de Compromissos */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Professor</th>
              <th className="px-4 py-3">Disciplina & Turma</th>
              <th className="px-4 py-3">Carga Horária</th>
              <th className="px-4 py-3">Total do Contrato</th>
              <th className="px-4 py-3">Saldo Pendente</th>
              <th className="px-4 py-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Carregando compromissos...
                </td>
              </tr>
            ) : pagamentos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  Nenhum compromisso docente registrado.
                </td>
              </tr>
            ) : (
              pagamentos.map((p) => (
                <tr key={p.ID_pagamento} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-400">#{p.ID_pagamento}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{p.professor}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{p.materia}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Turma: {p.turma}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">{p.carga_horaria}</td>
                  <td className="px-4 py-3 font-mono font-medium">{formatMoney(p.valor_total)}</td>
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-amber-700">{formatMoney(p.valor_pendente)}</div>
                    <div className="text-[10px] text-slate-400">
                      {p.parciais?.length || 0} pagamento(s) parcial(is)
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleOpenParcial(p)}
                      disabled={p.valor_pendente <= 0}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ml-auto"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{p.valor_pendente > 0 ? 'Pagar Parcial' : 'Quitado'}</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Pagamento Parcial */}
      {isParcialOpen && selectedCompromisso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-900">Registrar Pagamento Parcial</h2>
              <button onClick={() => setIsParcialOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Professor:</span>
                <span className="font-semibold text-slate-900">{selectedCompromisso.professor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Disciplina:</span>
                <span className="font-medium text-slate-800">{selectedCompromisso.materia}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-semibold">Valor Pendente Atual:</span>
                <span className="font-mono font-bold text-amber-700">
                  {formatMoney(selectedCompromisso.valor_pendente)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSalvarParcial} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Valor do Pagamento Parcial (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={0.01}
                  max={selectedCompromisso.valor_pendente}
                  value={parcialData.valor}
                  onChange={(e) => setParcialData({ ...parcialData, valor: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Modalidade de Pagamento (tipo) *</label>
                <select
                  required
                  value={parcialData.tipo}
                  onChange={(e) => setParcialData({ ...parcialData, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Transferência PIX">Transferência PIX</option>
                  <option value="Transferência TED">Transferência TED</option>
                  <option value="Dinheiro em Espécie">Dinheiro em Espécie</option>
                  <option value="Cheque Administrativo">Cheque Administrativo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsParcialOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Compromisso */}
      {isNovoCompromissoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-900">Novo Compromisso com Docente</h2>
              <button onClick={() => setIsNovoCompromissoOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarCompromisso} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Professor *</label>
                <select
                  required
                  value={novoCompromisso.idprofessor}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const prof = professores.find((p) => p.ID_professor === id);
                    setNovoCompromisso({
                      ...novoCompromisso,
                      idprofessor: id,
                      professor: prof ? prof.nome_professor : '',
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {professores.map((p) => (
                    <option key={p.ID_professor} value={p.ID_professor}>
                      {p.nome_professor} (ID #{p.ID_professor})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Disciplina / Matéria *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Anatomia e Fisiologia Humana"
                  value={novoCompromisso.materia}
                  onChange={(e) => setNovoCompromisso({ ...novoCompromisso, materia: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Turma (texto original) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: ENF-2025-1M"
                    value={novoCompromisso.turma}
                    onChange={(e) => setNovoCompromisso({ ...novoCompromisso, turma: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Carga Horária *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 60h"
                    value={novoCompromisso.carga_horaria}
                    onChange={(e) => setNovoCompromisso({ ...novoCompromisso, carga_horaria: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor Total do Compromisso (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={novoCompromisso.valor_total}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNovoCompromisso({
                        ...novoCompromisso,
                        valor_total: val,
                        valor_pendente: val,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Formato de Remuneração *</label>
                  <select
                    required
                    value={novoCompromisso.tipo}
                    onChange={(e) => setNovoCompromisso({ ...novoCompromisso, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Hora/Aula">Hora/Aula</option>
                    <option value="Mensalista">Mensalista</option>
                    <option value="Empreitada">Empreitada / Módulo Fechado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição Adicional</label>
                <input
                  type="text"
                  placeholder="Detalhes sobre horários ou materiais inclusos..."
                  value={novoCompromisso.descricao || ''}
                  onChange={(e) => setNovoCompromisso({ ...novoCompromisso, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNovoCompromissoOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Cadastrar Compromisso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
