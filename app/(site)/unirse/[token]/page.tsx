'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { rememberNext } from '@/lib/nextPath';

export default function UnirsePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { member, openModal } = useAuth();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = () => {
    // Al iniciar sesión (y completar la bienvenida si hace falta) vuelve aquí.
    rememberNext(`/unirse/${token}`);
    openModal();
  };

  async function join() {
    setJoining(true);
    setError(null);
    const res = await fetch('/api/projects/join', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json().catch(() => null);
    setJoining(false);
    if (!res.ok) return setError(data?.error ?? 'No se pudo unir al proyecto');
    router.push(`/proyectos/${data.project.slug}`);
  }

  return (
    <div className="ob">
      <div className="ob__card">
        <div className="modal__bar">
          <span className="dots"><i /><i /><i /></span>
          <span className="t mono">invitación — ./unirse</span>
        </div>
        <div className="modal__body">
          <div className="pre mono"><span className="y">$</span> git clone equipo</div>
          <h3>Te invitaron a un proyecto</h3>
          {error ? (
            <p className="ob__error mono">{error}</p>
          ) : (
            <p className="sub">{member ? 'Únete y aparecerás en el equipo del proyecto.' : 'Inicia sesión para unirte. Después vuelves aquí.'}</p>
          )}
          <div className="ob__actions">
            <span className="ob__spacer" />
            {member ? (
              <button className="btn btn-primary" onClick={join} disabled={joining || !!error}>{joining ? 'uniéndote…' : 'unirme ↗'}</button>
            ) : (
              <button className="btn btn-primary" onClick={login}>iniciar sesión ↗</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
