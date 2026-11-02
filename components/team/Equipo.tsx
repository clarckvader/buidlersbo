'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SectionHead } from '@/components/shared/SectionHead';
import { Chip } from '@/components/shared/Chip';
import { Avatar } from '@/components/shared/Avatar';
import { useRevealFallback } from '@/lib/useRevealFallback';
import { useAuth } from '@/context/AuthContext';
import { rememberNext } from '@/lib/nextPath';
import type { ProjectCard } from '@/lib/types';

export const STATUS_LABEL = { idea: 'idea', construyendo: 'construyendo', lanzado: 'lanzado' } as const;

// Crear proyecto: con sesión va al formulario; sin sesión pide login y vuelve al formulario.
export function useCreateProject() {
  const router = useRouter();
  const { user, openModal } = useAuth();
  return () => {
    if (user) return router.push('/proyectos/nuevo');
    rememberNext('/proyectos/nuevo');
    openModal();
  };
}

function ProjectTile({ p }: { p: ProjectCard }) {
  const owner = p.team.find((m) => m.role === 'owner');
  return (
    <Link href={`/proyectos/${p.slug}`} style={{ textDecoration: 'none' }}>
      <div className="teamcard card reveal">
        <div className="teamcard__top">
          <div>
            <div className="teamcard__name">{p.name}</div>
            {p.city && <div className="teamcard__city">{p.city}</div>}
          </div>
          <Chip tone={p.status === 'lanzado' ? 'green' : p.status === 'construyendo' ? 'yellow' : 'mute'}>{STATUS_LABEL[p.status]}</Chip>
        </div>
        {p.tagline && <div className="teamcard__focus">{p.tagline}</div>}
        {p.stack.length > 0 && <div className="teamcard__stack">{p.stack.map((s) => <Chip key={s}>{s}</Chip>)}</div>}
        {p.lookingFor.length > 0 && (
          <div className="teamcard__members">busca · {p.lookingFor.join(', ')}</div>
        )}
        <div className="teamcard__foot">
          <div className="avatars">
            {p.team.slice(0, 5).map((m) => <Avatar key={String(m.memberId)} {...m} />)}
            {p.team.length > 5 && <span className="av empty">+{p.team.length - 5}</span>}
          </div>
          {owner && <span className="teamcard__lead">{owner.username ? `@${owner.username}` : owner.name}</span>}
        </div>
      </div>
    </Link>
  );
}

export function Equipo({ projects }: { projects: ProjectCard[] }) {
  useRevealFallback('equipo');
  const createProject = useCreateProject();

  return (
    <div className="section-pad">
      <div className="eq-wrap">
        <SectionHead index="03" eyebrow=":: equipo" title="Quiénes construyen" sub="Proyectos de la comunidad y la gente detrás de cada uno. Crea el tuyo e invita a tu equipo con un enlace." />
        <div className="eq-actions reveal">
          <button className="btn btn-primary" onClick={createProject}>+ crear proyecto</button>
        </div>
        {projects.length === 0 ? (
          <div className="empty-state mono">
            todavía no hay proyectos. <button className="link-btn" onClick={createProject}>crea el primero ↗</button>
          </div>
        ) : (
          <div className="eq-grid">
            {projects.map((p) => <ProjectTile key={p.slug} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
