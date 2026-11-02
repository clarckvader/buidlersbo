'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { rememberNext } from '@/lib/nextPath';

// Botón de /unirse/[token]: sin sesión pide login y vuelve; con sesión se une.
export function JoinProject({ token, projectName, alreadyMember }: { token: string; projectName: string; alreadyMember: boolean }) {
  const router = useRouter();
  const { member, loading, openModal } = useAuth();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <>
      <p className="sub">
        {alreadyMember
          ? `Ya eres parte de ${projectName}.`
          : member
            ? `Te unirás al equipo de ${projectName}.`
            : 'Inicia sesión para unirte. Después vuelves aquí.'}
      </p>
      {error && <p className="ob__error mono">{error}</p>}
      <div className="ob__actions">
        <span className="ob__spacer" />
        {alreadyMember ? null : member ? (
          <button className="btn btn-primary" onClick={join} disabled={joining}>{joining ? 'uniéndote…' : `unirme a ${projectName} ↗`}</button>
        ) : (
          <button className="btn btn-primary" disabled={loading} onClick={() => { rememberNext(`/unirse/${token}`); openModal(); }}>
            iniciar sesión ↗
          </button>
        )}
      </div>
    </>
  );
}
