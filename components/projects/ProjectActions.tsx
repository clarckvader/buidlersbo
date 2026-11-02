'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectForm } from './ProjectForm';
import type { ProjectPage } from '@/lib/types';

async function api(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? 'Algo salió mal');
  return data;
}

function OwnerPanel({ project }: { project: ProjectPage }) {
  const router = useRouter();
  const base = `/api/projects/${project.id}`;
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [invites, setInvites] = useState<{ id: number | string; target: string }[]>([]);
  const [identifier, setIdentifier] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const toLink = (token: string) => `${window.location.origin}/unirse/${token}`;
  const loadInvites = useCallback(async () => setInvites((await api(`${base}/invites`)).invites), [base]);

  useEffect(() => {
    api(`${base}/invite-link`).then((d) => setLink(toLink(d.token))).catch(() => {});
    loadInvites().catch(() => {});
  }, [base, loadInvites]);

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      if (ok) setMsg({ ok: true, text: ok });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (editing) {
    return (
      <div className="pa-card">
        <h4 className="mono"><span className="g">✎</span> editar proyecto</h4>
        <ProjectForm
          initial={project}
          projectId={project.id}
          onSaved={() => { setEditing(false); router.refresh(); }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="pa-card pj-owner">
      <h4 className="mono"><span className="g">+</span> invitar a tu equipo</h4>

      <div className="ob__label mono">enlace de invitación</div>
      <div className="pj-link">
        <input readOnly value={link || 'generando…'} className="mono" onFocus={(e) => e.target.select()} />
        <button type="button" className="btn btn-ghost" onClick={copy} disabled={!link}>{copied ? 'copiado ✓' : 'copiar'}</button>
      </div>
      <p className="pj-hint mono">
        quien lo abra entra al proyecto al iniciar sesión.{' '}
        <button
          type="button"
          className="link-btn"
          disabled={busy}
          onClick={() => run(async () => setLink(toLink((await api(`${base}/invite-link`, 'POST')).token)), 'enlace nuevo: el anterior ya no sirve')}
        >
          regenerar enlace
        </button>
      </p>

      <div className="ob__label mono">por @usuario o correo</div>
      <form
        className="pj-link"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await api(`${base}/invite`, 'POST', { identifier });
            setIdentifier('');
            await loadInvites();
          }, 'invitación enviada: la verá en su panel');
        }}
      >
        <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="@usuario o correo@ejemplo.com" />
        <button type="submit" className="btn btn-primary" disabled={busy || !identifier.trim()}>invitar</button>
      </form>

      {invites.length > 0 && (
        <div className="pj-list">
          {invites.map((i) => (
            <div key={String(i.id)} className="pj-list__row mono">
              <span>{i.target} · pendiente</span>
              <button type="button" className="link-btn" disabled={busy} onClick={() => run(async () => { await api(`/api/project-invites/${i.id}/revoke`, 'POST'); await loadInvites(); })}>revocar</button>
            </div>
          ))}
        </div>
      )}

      {project.team.some((m) => m.role !== 'owner') && (
        <>
          <div className="ob__label mono">integrantes</div>
          <div className="pj-list">
            {project.team.filter((m) => m.role !== 'owner').map((m) => (
              <div key={String(m.memberId)} className="pj-list__row mono">
                <span>{m.username ? `@${m.username}` : m.name}</span>
                <button
                  type="button"
                  className="link-btn"
                  disabled={busy}
                  onClick={() => run(async () => { await api(`${base}/members/${m.memberId}`, 'DELETE'); router.refresh(); })}
                >
                  quitar
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {msg && <div className={'mono ' + (msg.ok ? 'pj-ok' : 'ob__error')}>{msg.text}</div>}

      <div className="ob__actions">
        <button type="button" className="btn btn-ghost" onClick={() => setEditing(true)}>editar proyecto</button>
        <span className="ob__spacer" />
        <button
          type="button"
          className="link-btn pj-danger"
          disabled={busy}
          onClick={() => {
            if (!confirm(`¿Borrar "${project.name}"? Se quita el equipo y las invitaciones. No se puede deshacer.`)) return;
            run(async () => { await api(`${base}/remove`, 'DELETE'); router.push('/equipo'); router.refresh(); });
          }}
        >
          borrar proyecto
        </button>
      </div>
    </div>
  );
}

function LeaveButton({ project }: { project: ProjectPage }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="pj-leave">
      <button
        type="button"
        className="link-btn"
        onClick={async () => {
          if (!confirm(`¿Salir de "${project.name}"?`)) return;
          try {
            await api(`/api/projects/${project.id}/leave`, 'POST');
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        salir del proyecto
      </button>
      {error && <span className="ob__error mono"> {error}</span>}
    </div>
  );
}

export function ProjectActions({ project }: { project: ProjectPage }) {
  if (project.isOwner) return <OwnerPanel project={project} />;
  if (project.isMember) return <LeaveButton project={project} />;
  return null;
}
