import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProjectPage } from '@/lib/content'
import { getCurrentMember } from '@/lib/currentMember'
import { Chip } from '@/components/shared/Chip'
import { Avatar } from '@/components/shared/Avatar'
import { ProjectActions } from '@/components/projects/ProjectActions'

export default async function ProyectoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = await getProjectPage(slug, await getCurrentMember())
  if (!project) notFound()

  return (
    <div className="section-pad">
      <div className="pj-wrap">
        <Link href="/equipo" className="mono pj-back">← proyectos</Link>
        <div className="mono pj-meta">
          {[project.category, project.city].filter(Boolean).join(' · ')}
          <Chip tone={project.status === 'lanzado' ? 'green' : project.status === 'construyendo' ? 'yellow' : 'mute'}>{project.status}</Chip>
        </div>
        <h1 className="pj-title">{project.name}</h1>
        {project.tagline && <p className="pj-sub">{project.tagline}</p>}

        {project.description && <p className="pj-desc">{project.description}</p>}

        {(project.stack.length > 0 || project.lookingFor.length > 0 || project.links.length > 0) && (
          <div className="pa-card pj-facts">
            {project.stack.length > 0 && (
              <div><div className="ob__label mono">stack</div><div className="teamcard__stack">{project.stack.map((s) => <Chip key={s}>{s}</Chip>)}</div></div>
            )}
            {project.lookingFor.length > 0 && (
              <div><div className="ob__label mono">buscan</div><div className="teamcard__stack">{project.lookingFor.map((s) => <Chip key={s} tone="yellow">{s}</Chip>)}</div></div>
            )}
            {project.links.length > 0 && (
              <div>
                <div className="ob__label mono">links</div>
                {project.links.map((l) => (
                  <a key={l} href={l} target="_blank" rel="noopener noreferrer" className="res-link mono">{l.replace(/^https?:\/\//, '')}<span className="arr">↗</span></a>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="pa-card">
          <h4 className="mono"><span className="g">::</span> equipo · {project.team.length}</h4>
          {project.team.map((m) => (
            <div className="pa-member" key={String(m.memberId)}>
              <Avatar {...m} size={34} />
              <div>
                <div className="nm">{m.name || (m.username ? `@${m.username}` : 'builder')}</div>
                <div className="rl">{[m.username && `@${m.username}`, m.role === 'owner' ? 'creador' : m.title].filter(Boolean).join(' · ')}</div>
              </div>
            </div>
          ))}
        </div>

        <ProjectActions project={project} />
      </div>
    </div>
  )
}
