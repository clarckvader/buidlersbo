'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { usePollar } from '@pollar/react';
import { User } from '@/lib/types';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  login: (provider: 'google' | 'github' | 'email' | 'wallet') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: false,
  modalOpen: false,
  openModal: () => {},
  closeModal: () => {},
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { walletAddress, isAuthenticated, login: pollarLogin, logout: pollarLogout, openLoginModal } = usePollar();
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      setModalOpen(false);
      router.push('/participante');
    }
  }, [isAuthenticated, router]);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const user = useMemo<User | null>(() => {
    if (!isAuthenticated || !walletAddress) return null;
    return {
      provider: 'pollar',
      name: walletAddress.slice(0, 4) + '…' + walletAddress.slice(-4),
      handle: walletAddress,
      team: '',
    };
  }, [isAuthenticated, walletAddress]);

  const login = useCallback((provider: 'google' | 'github' | 'email' | 'wallet') => {
    setModalOpen(false);
    if (provider === 'google' || provider === 'github') {
      pollarLogin({ provider });
    } else {
      openLoginModal();
    }
  }, [pollarLogin, openLoginModal]);

  const logout = useCallback(() => {
    pollarLogout();
  }, [pollarLogout]);

  return (
    <AuthContext.Provider value={{ user, loading: !isAuthenticated && !!walletAddress, modalOpen, openModal, closeModal, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
