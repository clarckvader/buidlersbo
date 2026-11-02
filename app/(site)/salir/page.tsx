'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Logout del panel y del sitio: cierra la sesión de miembro y la de Pollar.
export default function SalirPage() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    logout().finally(() => router.replace('/'));
  }, [logout, router]);

  return (
    <div className="ob">
      <p className="mono ob__muted">cerrando sesión…</p>
    </div>
  );
}
