'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SectionHead } from '@/components/shared/SectionHead';
import { Chip } from '@/components/shared/Chip';
import { slugify } from '@/lib/slugify';
import { useRevealFallback } from '@/lib/useRevealFallback';
import { useAuth } from '@/context/AuthContext';
import { CoffeeEvent } from '@/lib/types';

export function Eventos({ events }: { events: CoffeeEvent[] }) {
  useRevealFallback('eventos');
  const router = useRouter();
  const { user, openModal } = useAuth();

  const openAccess = () => {
    if (user) router.push('/participante');
    else openModal();
  };

  return (
    <div className="section-pad">
      <div className="ev-wrap">
        <SectionHead index="05" eyebrow="// eventos" title="Próximos eventos" sub="Meetups mensuales, talleres de iniciación y la hackathon más grande del país. Todo presencial, todo abierto." />
        <div className="ev-list">
          {events.map((e) => {
            const pct = Math.round((e.taken / e.cap) * 100);
            const hot = pct >= 75;
            const feat = e.type === 'Hackathon';
            return (
              <div className={'evcard card reveal' + (feat ? ' evcard--feat' : '')} key={e.name}>
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
                  <Link href={`/eventos/${slugify(e.name)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <p className="evcard__desc">{e.desc} <span style={{ color: 'var(--yellow)' }}>ver detalles ↗</span></p>
                  </Link>
                  <div className="evcard__meta mono">
                    <span>◷ <b>{e.city}</b></span>
                    <span>@ <b>{e.place}</b></span>
                    <span>cupo <b>{e.cap}</b></span>
                  </div>
                </div>
                <div className="evcard__cta">
                  <div className="evcap">
                    <div className="evcap__lbl">
                      <span>{e.taken}/{e.cap}</span>
                      <span>{hot ? 'casi lleno' : 'abierto'}</span>
                    </div>
                    <div className="evcap__bar"><i className={hot ? 'hot' : ''} style={{ width: pct + '%' }} /></div>
                  </div>
                  <button className="btn btn-primary" onClick={openAccess}>registrarme ↗</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
