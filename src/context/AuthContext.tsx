import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole } from '../types/schema.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  loginInternal: (username: string, pass: string) => Promise<void>;
  loginStudent: (cpf: string, pass: string) => Promise<void>;
  quickLoginAsRole: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('interdigitus_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        setUser(res.user);
      } catch (e) {
        localStorage.removeItem('interdigitus_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();

    const handleAuthExpired = () => {
      localStorage.removeItem('interdigitus_token');
      setUser(null);
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const loginInternal = async (username: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.loginInternal(username, pass);
      localStorage.setItem('interdigitus_token', res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const loginStudent = async (cpf: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.loginStudent(cpf, pass);
      localStorage.setItem('interdigitus_token', res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const quickLoginAsRole = async (role: UserRole) => {
    if (role === 'Aluno') {
      await loginStudent('234.567.890-12', 'aluno123');
      return;
    }

    const roleCredentials: Record<string, { u: string; p: string }> = {
      Administrador: { u: 'admin', p: 'admin123' },
      Secretaria: { u: 'secretaria', p: 'sec123' },
      Coordenação: { u: 'coordenacao', p: 'coord123' },
      Financeiro: { u: 'financeiro', p: 'fin123' },
      Comercial: { u: 'comercial', p: 'com123' },
    };

    const cred = roleCredentials[role] || { u: 'admin', p: 'admin123' };
    await loginInternal(cred.u, cred.p);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignora erro no logout
    }
    localStorage.removeItem('interdigitus_token');
    setUser(null);
  };

  const hasPermission = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'Administrador') return true;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginInternal,
        loginStudent,
        quickLoginAsRole,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};
