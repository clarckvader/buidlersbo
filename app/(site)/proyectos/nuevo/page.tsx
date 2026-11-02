'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { rememberNext } from '@/lib/nextPath';

export default function NuevoProyectoPage() {
  const router = useRouter();
  const { user, openModal } = useAuth();

  return (
    <div className="section-pad">
      <div className="pj-wrap">
        <div className="pre mono pj-pre"><span className="y">$</span> git init proyecto</div>
        <h1 className="pj-title">Crea tu proyecto</h1>
        <p className="pj-sub">Queda público en el directorio. Después invitas a tu equipo con un enlace o por @usuario.</p>
        {user ? (
          <div className="pa-card">
            <ProjectForm onSaved={(p) => router.push(`/proyectos/${p.slug}`)} onCancel={() => router.back()} />
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => { rememberNext('/proyectos/nuevo'); openModal(); }}>
            inicia sesión para crear un proyecto ↗
          </button>
        )}
      </div>
    </div>
  );
}
