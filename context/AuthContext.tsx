'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePollar } from '@pollar/react';
import { User } from '@/lib/types';
import type { Member } from '@/payload-types';
import { takeNext } from '@/lib/nextPath';
import { postLoginRoute } from '@/lib/postLogin';

interface AuthCtx {
  user: User | null;
  member: Member | null;
  setMember: (member: Member) => void;
  loading: boolean;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  login: (provider: 'google' | 'github' | 'email' | 'wallet') => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  member: null,
  setMember: () => {},
  loading: false,
  modalOpen: false,
  openModal: () => {},
  closeModal: () => {},
  login: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { wallet, verified, isAuthenticated, login: pollarLogin, logout: pollarLogout, openLoginModal, getClient } = usePollar();
  const walletAddress = wallet?.address ?? null;
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthenticated) setModalOpen(false);
  }, [isAuthenticated]);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  // Sesión del servidor (colección `members` en Payload), derivada del login de Pollar.
  const [member, setMember] = useState<Member | null>(null);
  const [syncing, setSyncing] = useState(false);
  // true cuando la sesión se abrió recién (login nuevo), no restaurada desde la cookie.
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setMember(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setSyncing(true);
      try {
        // Si ya hay cookie de sesión válida no volvemos a verificar con Pollar.
        const current = await fetch('/api/members/session', { credentials: 'include' }).then((r) => r.json()).catch(() => null);
        if (current?.member) {
          if (!cancelled) setMember(current.member);
          return;
        }
        // Solo mandamos el token cuando Pollar ya revalidó la sesión (no uno restaurado de storage).
        const state = getClient().getAuthState();
        if (!verified || state.step !== 'authenticated') return;
        const res = await fetch('/api/members/session', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: state.session.token.accessToken }),
        });
        const body = await res.json().catch(() => null);
        if (!cancelled && res.ok) {
          setMember(body.member);
          setJustLoggedIn(true);
        }
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, verified, getClient]);

  // Sin @usuario → bienvenida (en cualquier página). Con @usuario, solo tras un login nuevo → destino o panel.
  useEffect(() => {
    if (!member) return;
    const hasUsername = !!member.username;
    const next = hasUsername && justLoggedIn ? takeNext() : null;
    const { to, consumeLogin } = postLoginRoute({ hasUsername, justLoggedIn, pathname, next });
    if (consumeLogin) setJustLoggedIn(false);
    if (to) router.push(to);
  }, [member, justLoggedIn, pathname, router]);

  const user = useMemo<User | null>(() => {
    if (!isAuthenticated) return null;
    // La wallet puede no existir todavía (Pollar la está creando).
    const short = walletAddress ? walletAddress.slice(0, 4) + '…' + walletAddress.slice(-4) : '';
    return {
      provider: member?.authProvider ?? 'pollar',
      name: member?.name || member?.email || short || 'builder',
      handle: member?.username ? `@${member.username}` : walletAddress ?? '',
      team: '',
    };
  }, [isAuthenticated, walletAddress, member]);

  const login = useCallback((provider: 'google' | 'github' | 'email' | 'wallet') => {
    setModalOpen(false);
    if (provider === 'google' || provider === 'github') {
      pollarLogin({ provider });
    } else {
      openLoginModal();
    }
  }, [pollarLogin, openLoginModal]);

  const logout = useCallback(async () => {
    // Cerramos ambas sesiones (cookie de miembro y Pollar) antes de que el llamador navegue.
    await Promise.allSettled([
      fetch('/api/members/session', { method: 'DELETE', credentials: 'include' }),
      pollarLogout(),
    ]);
    setMember(null);
  }, [pollarLogout]);

  return (
    <AuthContext.Provider value={{ user, member, setMember, loading: syncing, modalOpen, openModal, closeModal, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
