import { notFound } from 'next/navigation';
import teams from '@/content/teams.json';
import { slugify } from '@/lib/slugify';
import Link from 'next/link';

export function generateStaticParams() {
  return teams.map((t) => ({ slug: slugify(t.name) }));
}

export default function TeamPage({ params }: { params: { slug: string } }) {
  const team = teams.find((t) => slugify(t.name) === params.slug);
  if (!team) notFound();

  const spotsLeft = team.open;

  return (
    <div className="section-pad">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link href="/equipo" className="mono" style={{ color: 'var(--ink-faint)', fontSize: 13, display: 'block', marginBottom: 32 }}>
          ← equipos
        </Link>
        <div className="mono" style={{ color: 'var(--yellow)', fontSize: 13 }}>{team.city}</div>
        <h1 style={{ marginTop: 8, marginBottom: 4 }}>{team.name}</h1>
        <div style={{ color: 'var(--ink-faint)', marginBottom: 24 }}>{team.focus}</div>

        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>LEAD</div><div>{team.lead}</div></div>
            <div><div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>MIEMBROS</div><div>{team.members}</div></div>
            <div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>VACANTES</div>
              <div style={{ color: spotsLeft > 0 ? 'var(--yellow)' : 'var(--ink-faint)' }}>
                {spotsLeft > 0 ? `${spotsLeft} abierta${spotsLeft > 1 ? 's' : ''}` : 'equipo completo'}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 12 }}>STACK</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {team.stack.map((s) => (
              <span key={s} className="chip">{s}</span>
            ))}
          </div>
        </div>

        {spotsLeft > 0 && (
          <button className="btn btn-primary" style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}>
            solicitar unirse ↗
          </button>
        )}
      </div>
    </div>
  );
}
