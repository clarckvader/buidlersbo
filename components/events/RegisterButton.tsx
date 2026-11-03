'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { rememberNext } from '@/lib/nextPath';

// Inscribirse / cancelar. Sin sesión abre el login y vuelve a esta página.
export function RegisterButton({ eventId, registered, full, block = false }: {
  eventId: number | string; registered: boolean; full: boolean; block?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // `member` existe recién cuando el servidor abrió la sesión (cookie); antes, un POST daría 401.
  const { member, loading, openModal } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const style = block ? { width: '100%', justifyContent: 'center' as const } : undefined;

  async function toggle() {
    if (!member) {
      rememberNext(pathname);
      return openModal();
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/event-registrations/event/${eventId}`, {
      method: registered ? 'DELETE' : 'POST',
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) return setError(data?.error ?? 'No se pudo completar');
    router.refresh();
  }

  if (registered) {
    return (
      <div className="ev-reg">
        <button className="btn btn-ghost" style={style} onClick={toggle} disabled={busy || loading}>
          {busy ? 'cancelando…' : 'inscrito ✓ · cancelar'}
        </button>
        {error && <span className="ob__error mono">{error}</span>}
      </div>
    );
  }

  return (
    <div className="ev-reg">
      <button className="btn btn-primary" style={style} onClick={toggle} disabled={busy || full || loading}>
        {full ? 'evento lleno' : busy ? 'inscribiendo…' : 'registrarme ↗'}
      </button>
      {error && <span className="ob__error mono">{error}</span>}
    </div>
  );
}
