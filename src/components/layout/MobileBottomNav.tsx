import React from 'react';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Receipt,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface MobileBottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPath,
  onNavigate,
  onOpenMenu,
}) => {
  const { user } = useAuth();

  if (user?.role === 'Aluno') {
    return null;
  }

  const items = [
    { label: 'Início', path: '/', icon: LayoutDashboard },
    { label: 'Alunos', path: '/academico/alunos', icon: Users },
    { label: 'Caixa', path: '/financeiro/caixa', icon: Wallet },
    { label: 'Mensalidades', path: '/financeiro/mensalidades', icon: Receipt },
  ];

  return (
    <nav
      aria-label="Navegação rápida móvel"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around h-15 px-2 max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 transition-colors relative ${
                active ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
              <span className={`text-[10px] mt-0.5 tracking-tight ${active ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
              {active && (
                <span className="absolute top-1 w-1 h-1 rounded-full bg-indigo-600" />
              )}
            </button>
          );
        })}

        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 text-slate-500 hover:text-slate-800 transition-colors"
          title="Abrir menu completo"
        >
          <Menu className="w-5 h-5 stroke-[1.75px]" />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Módulos</span>
        </button>
      </div>
    </nav>
  );
};
