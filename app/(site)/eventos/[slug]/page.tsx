import { notFound } from 'next/navigation'
import { getEventSlugs, getEvent } from '@/lib/content'
import Link from 'next/link'

export async function generateStaticParams() {
  const slugs = await getEventSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function EventPage({ params }: { params: { slug: string } }) {
  const event = await getEvent(params.slug)
  if (!event) notFound()

  const pct = Math.round((event.taken / event.cap) * 100)
  const hot = pct >= 75
  const full = event.taken >= event.cap

  return (
    <div className="section-pad">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link href="/eventos" className="mono" style={{ color: 'var(--ink-faint)', fontSize: 13, display: 'block', marginBottom: 32 }}>
          ← eventos
        </Link>
        <div className="mono" style={{ color: 'var(--yellow)', fontSize: 13 }}>{event.type.toLowerCase()} · {event.tag}</div>
        <h1 style={{ marginTop: 8, marginBottom: 4 }}>{event.name}</h1>
        <div className="mono" style={{ color: 'var(--ink-faint)', marginBottom: 24, fontSize: 14 }}>
          {event.d} {event.mo} · {event.city} · {event.place}
        </div>

        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, marginBottom: event.contentHtml ? 32 : 32 }}>{event.desc}</p>

        {event.contentHtml && (
          <div className="post-body" style={{ marginBottom: 32 }} dangerouslySetInnerHTML={{ __html: event.contentHtml }} />
        )}

        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 8 }}>CUPOS</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
            <span>{event.taken} registrados</span>
            <span style={{ color: hot ? 'var(--yellow)' : 'inherit' }}>
              {full ? 'lleno' : hot ? 'casi lleno' : `${event.cap - event.taken} disponibles`}
            </span>
          </div>
          <div className="evcap__bar">
            <i className={hot ? 'hot' : ''} style={{ width: pct + '%' }} />
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={full}>
          {full ? 'evento lleno' : 'registrarme ↗'}
        </button>
      </div>
    </div>
  )
}
