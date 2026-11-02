'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Chip } from '@/components/shared/Chip';
import { Avatar } from '@/components/shared/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useCreateProject } from '@/components/team/Equipo';
import type { ParticipantData } from '@/lib/types';
import type { Member } from '@/payload-types';

function Invites({ invites }: { invites: ParticipantData['invites'] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(id: number | string, accept: boolean) {
    setBusy(String(id));
    setError(null);
    const res = await fetch(`/api/project-invites/${id}/respond`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accept }),
    });
    const data = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok) return setError(data?.error ?? 'No se pudo responder');
    router.refresh();
  }

  if (!invites.length) return null;
  return (
    <div className="pa-card col-12">
      <h4 className="mono"><span className="g">!</span> invitaciones · {invites.length}</h4>
      {invites.map((i) => (
        <div key={String(i.id)} className="pj-list__row mono">
          <span>
            <Link href={`/proyectos/${i.project.slug}`} style={{ color: 'var(--ink)' }}>{i.project.name}</Link>
            {i.invitedBy && <span style={{ color: 'var(--ink-faint)' }}> · de {i.invitedBy}</span>}
          </span>
          <span style={{ display: 'flex', gap: 14 }}>
            <button className="link-btn" disabled={!!busy} onClick={() => respond(i.id, true)}>aceptar</button>
            <button className="link-btn" style={{ color: 'var(--ink-mute)' }} disabled={!!busy} onClick={() => respond(i.id, false)}>rechazar</button>
          </span>
        </div>
      ))}
      {error && <div className="ob__error mono">{error}</div>}
    </div>
  );
}

// `member` y `data` vienen del servidor (cookie verificada), no del estado de Pollar en el navegador.
export function ParticipantApp({ member, data }: { member: Member | null; data: ParticipantData | null }) {
  const router = useRouter();
  const { logout, openModal } = useAuth();
  const createProject = useCreateProject();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!member || !data) {
    return (
      <div className="pa">
        <h1>Tu panel</h1>
        <p className="mono" style={{ color: 'var(--ink-mute)', marginBottom: 20 }}>inicia sesión para ver tus proyectos, invitaciones y eventos.</p>
        <button className="btn btn-primary" onClick={openModal}>acceder ↗</button>
      </div>
    );
  }

  const handle = member.username ? `@${member.username}` : member.name || 'builder';
  const tags = [...(member.roles ?? []), ...(member.interests ?? [])];

  return (
    <div className="pa">
      <div className="pa__bar mono">
        <span className="pmt">buidlers@bolivia</span>:<span className="u">~/{member.username ?? 'participante'}</span>$
        <span className="right">
          <button onClick={() => router.push('/')}>← volver al sitio</button>
          <button onClick={handleLogout}>cerrar sesión</button>
        </span>
      </div>
      <h1>Hola, <span className="y">{member.name || handle}</span>.</h1>

      <div className="pa-grid">
        <Invites invites={data.invites} />

        <div className="pa-card col-4">
          <h4 className="mono"><span className="g">@</span> perfil</h4>
          <div className="pa-member">
            <Avatar name={member.name} username={member.username} avatar={member.avatar} size={40} />
            <div><div className="nm">{handle}</div><div className="rl">{member.email}</div></div>
          </div>
          {tags.length > 0 && <div className="teamcard__stack" style={{ marginTop: 12 }}>{tags.map((t) => <Chip key={t}>{t}</Chip>)}</div>}
          {(member.stack ?? []).length > 0 && (
            <div className="teamcard__stack" style={{ marginTop: 8 }}>{(member.stack ?? []).map((t) => <Chip key={t} tone="cyan">{t}</Chip>)}</div>
          )}
          {member.building && <p className="rl" style={{ marginTop: 12 }}>{member.building}</p>}
          <button className="pa-invite mono" onClick={() => router.push('/bienvenida')}>
            {tags.length || (member.stack ?? []).length ? 'editar perfil' : '+ completar perfil'}
          </button>
        </div>

        <div className="pa-card col-8">
          <h4 className="mono"><span className="g">::</span> mis proyectos · {data.projects.length}</h4>
          {data.projects.length === 0 && (
            <p className="mono" style={{ color: 'var(--ink-mute)', fontSize: 13 }}>
              todavía no estás en ningún proyecto. crea uno o pide a alguien su enlace de invitación.
            </p>
          )}
          {data.projects.map((p) => {
            const mine = p.team.find((m) => String(m.memberId) === String(member.id));
            return (
              <Link key={p.slug} href={`/proyectos/${p.slug}`} className="pj-list__row mono" style={{ textDecoration: 'none' }}>
                <span style={{ color: 'var(--ink)' }}>{p.name}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="avatars">{p.team.slice(0, 4).map((m) => <Avatar key={String(m.memberId)} {...m} size={22} />)}</span>
                  <span style={{ color: 'var(--ink-faint)' }}>{mine?.role === 'owner' ? 'creador' : 'integrante'}</span>
                </span>
              </Link>
            );
          })}
          <button className="pa-invite mono" onClick={createProject}>+ crear proyecto</button>
        </div>

        <div className="pa-card col-12">
          <h4 className="mono"><span className="g">//</span> mis eventos · {data.events.length}</h4>
          {data.events.length === 0 && (
            <p className="mono" style={{ color: 'var(--ink-mute)', fontSize: 13 }}>
              no estás inscrito en ningún evento. <Link href="/eventos" style={{ color: 'var(--yellow)' }}>ver próximos eventos ↗</Link>
            </p>
          )}
          {data.events.map((e) => (
            <Link key={String(e.id)} href={`/eventos/${e.slug}`} className="pj-list__row mono" style={{ textDecoration: 'none' }}>
              <span style={{ color: 'var(--ink)' }}>{e.d} {e.mo} · {e.name}</span>
              <span style={{ color: 'var(--ink-faint)' }}>{e.city}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
