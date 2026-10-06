import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  Wallet,
  Clock,
  User,
  LogOut,
  Maximize2,
  Minimize2,
  ArrowLeft,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface CaixaExclusivoHeaderProps {
  onExit?: () => void;
}

export const CaixaExclusivoHeader: React.FC<CaixaExclusivoHeaderProps> = ({ onExit }) => {
  const { user, logout } = useAuth();
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
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

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <header className="bg-[#02071a]/95 text-white border-b border-blue-900/40 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xl shadow-blue-950/30 shrink-0">
      {/* Esquerda: Identificação do Terminal Exclusivo */}
      <div className="flex items-center gap-3">
        <img
          src="/logo.png"
          alt="CEPI Logo"
          className="h-10 w-auto max-w-[48px] object-contain drop-shadow-sm shrink-0"
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
              Master Escolar
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-xs sm:text-sm font-semibold text-emerald-400 uppercase tracking-wider font-mono">
              Frente de Caixa Exclusivo
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Terminal Ativo
            </span>
            <span>·</span>
            <span className="hidden sm:inline">Atividade Exclusiva do Operador</span>
          </div>
        </div>
      </div>

      {/* Centro: Relógio em Tempo Real */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
        <Clock className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-slate-400 capitalize">{date}</span>
        <span className="text-white font-bold tracking-wider">{time}</span>
      </div>

      {/* Direita: Operador, Tela Cheia e Saída */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Identificação do Operador */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <User className="w-3.5 h-3.5 text-emerald-400" />
          <div className="text-left">
            <div className="text-[10px] text-slate-400 leading-none">Operador(a)</div>
            <div className="font-bold text-white leading-tight truncate max-w-[120px] sm:max-w-none">
              {user?.nome || user?.username}
            </div>
          </div>
        </div>

        {/* Botão Tela Cheia */}
        <button
          onClick={toggleFullscreen}
          className="hidden sm:flex p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-h-[38px] min-w-[38px] items-center justify-center"
          title={isFullscreen ? 'Sair da tela cheia' : 'Modo Tela Cheia (Kiosk)'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Botão Voltar ao Sistema Geral */}
        {onExit && (
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-colors min-h-[38px]"
            title="Sair do modo exclusivo e retornar ao menu completo"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Painel Geral</span>
          </button>
        )}

        {/* Logout do Operador */}
        <button
          onClick={() => logout()}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
          title="Encerrar turno e deslogar"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
