import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { previewByToken } from '@/lib/services/projects'
import { getProjectPage } from '@/lib/content'
import { getCurrentMember } from '@/lib/currentMember'
import { JoinProject } from '@/components/projects/JoinProject'

export default async function UnirsePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const project = await previewByToken(await getPayload({ config }), token)
  const viewer = await getCurrentMember()
  const alreadyMember = !!project && !!viewer && !!(await getProjectPage(project.slug, viewer))?.isMember

  return (
    <div className="ob">
      <div className="ob__card">
        <div className="modal__bar">
          <span className="dots"><i /><i /><i /></span>
          <span className="t mono">invitación — ./unirse</span>
        </div>
        <div className="modal__body">
          <div className="pre mono"><span className="y">$</span> git clone equipo</div>
          {project ? (
            <>
              <h3>Unirte a {project.name}</h3>
              {project.tagline && <p className="sub" style={{ marginBottom: 8 }}>{project.tagline}</p>}
              <JoinProject token={token} projectName={project.name} alreadyMember={alreadyMember} />
              {alreadyMember && <Link className="btn btn-ghost" href={`/proyectos/${project.slug}`}>ver proyecto ↗</Link>}
            </>
          ) : (
            <>
              <h3>Este enlace ya no es válido</h3>
              <p className="sub">Puede que lo hayan regenerado. Pide un enlace nuevo a quien te invitó.</p>
              <Link className="btn btn-ghost" href="/equipo">ver proyectos ↗</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
