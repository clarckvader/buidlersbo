'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { rememberNext, takeNext } from '@/lib/nextPath';

// Punto de entrada de login con destino (ej. /admin): guarda `next` y abre el modal de acceso.
function Acceder() {
  const router = useRouter();
  const params = useSearchParams();
  const { member, openModal } = useAuth();

  useEffect(() => {
    rememberNext(params.get('next') ?? '');
    if (member) router.replace(takeNext() ?? '/participante');
    else openModal();
  }, [member, params, router, openModal]);

  return (
    <div className="ob">
      <p className="mono ob__muted">inicia sesión para continuar…</p>
    </div>
  );
}

export default function AccederPage() {
  return (
    <Suspense>
      <Acceder />
    </Suspense>
  );
}
