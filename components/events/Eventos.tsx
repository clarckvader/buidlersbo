'use client';

import Link from 'next/link';
import { SectionHead } from '@/components/shared/SectionHead';
import { Chip } from '@/components/shared/Chip';
import { useRevealFallback } from '@/lib/useRevealFallback';
import { RegisterButton } from './RegisterButton';
import { CoffeeEvent } from '@/lib/types';

export function Eventos({ events }: { events: CoffeeEvent[] }) {
  useRevealFallback('eventos');

  return (
    <div className="section-pad">
      <div className="ev-wrap">
        <SectionHead index="05" eyebrow="// eventos" title="Próximos eventos" sub="Meetups mensuales, talleres de iniciación y la hackathon más grande del país. Todo presencial, todo abierto." />
        {events.length === 0 && (
          <div className="empty-state mono">todavía no hay eventos publicados. vuelve pronto.</div>
        )}
        <div className="ev-list">
          {events.map((e) => {
            const pct = e.cap ? Math.min(100, Math.round((e.taken / e.cap) * 100)) : 0;
            const full = !!e.cap && e.taken >= e.cap;
            const hot = pct >= 75;
            const feat = e.type === 'Hackathon';
            return (
              <div className={'evcard card reveal' + (feat ? ' evcard--feat' : '')} key={String(e.id)}>
                <div className="evcard__date">
                  <div className="evcard__d">{e.d}</div>
                  <div className="evcard__mo mono">{e.mo}</div>
                </div>
                <div className="evcard__body">
                  <div className="evcard__head">
                    <span className={'ev-type mono ' + e.type}>{e.type.toLowerCase()}</span>
                    <span className="evcard__name">{e.name}</span>
                    <Chip>{e.tag}</Chip>
                  </div>
                  <Link href={`/eventos/${e.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <p className="evcard__desc">{e.desc} <span style={{ color: 'var(--yellow)' }}>ver detalles ↗</span></p>
                  </Link>
                  <div className="evcard__meta mono">
                    <span>◷ <b>{e.city}</b></span>
                    <span>@ <b>{e.place}</b></span>
                    <span>cupo <b>{e.cap || 'libre'}</b></span>
                  </div>
                </div>
                <div className="evcard__cta">
                  <div className="evcap">
                    <div className="evcap__lbl">
                      <span>{e.cap ? `${e.taken}/${e.cap}` : `${e.taken} inscritos`}</span>
                      <span>{full ? 'lleno' : hot ? 'casi lleno' : 'abierto'}</span>
                    </div>
                    <div className="evcap__bar"><i className={hot ? 'hot' : ''} style={{ width: pct + '%' }} /></div>
                  </div>
                  <RegisterButton eventId={e.id} registered={e.registered} full={full} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
