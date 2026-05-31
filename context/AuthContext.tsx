'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User } from '@/lib/types';

interface AuthCtx {
  user: User | null;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  login: (provider: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  modalOpen: false,
  openModal: () => {},
  closeModal: () => {},
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem('bb_user') || 'null'); } catch { return null; }
  });
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const login = useCallback((provider: string) => {
    const u: User = {
      provider,
      name: provider === 'github' ? '0xbuidler' : provider === 'google' ? 'Ana Quispe' : '0x7a3F…9B2c',
      handle: provider === 'wallet' ? '0x7a3F…9B2c' : '@ana.buidl',
      team: 'lab altiplano',
    };
    localStorage.setItem('bb_user', JSON.stringify(u));
    setUser(u);
    setModalOpen(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bb_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, modalOpen, openModal, closeModal, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
