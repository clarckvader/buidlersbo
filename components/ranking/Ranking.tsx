'use client';

import { SectionHead } from '@/components/shared/SectionHead';
import { Chip } from '@/components/shared/Chip';
import { useRevealFallback } from '@/lib/useRevealFallback';
import { Project } from '@/lib/types';

const MEDALS: Record<number, string> = { 1: 'destacado', 2: 'top 02', 3: 'top 03' };

export function Ranking({ projects }: { projects: Project[] }) {
  useRevealFallback('ranking');
  const top = projects.slice(0, 3);
  const rest = projects.slice(3);

  return (
    <div className="section-pad">
      <div className="rank-wrap">
        <SectionHead index="02" eyebrow="# ranking" title="Proyectos que apoyamos" sub="Pocos, pero reales. Estos son los proyectos que la comunidad acompaña con mentoría, grants y manos a la obra." />
        <div className="rank-note mono"><span className="dot" /> {projects.length} proyectos activos · curado por la comunidad</div>

        <div className="top3">
          {top.map((p) => (
            <div className={'pcard card reveal pcard--' + p.rank} key={p.name}>
              <span className="pcard__bignum mono">{p.rank}</span>
              <div className="pcard__rank">
                <span className="num mono">#{String(p.rank).padStart(2, '0')}</span>
                <span className="pcard__medal mono">{MEDALS[p.rank]}</span>
              </div>
              <div>
                <div className="pcard__name">{p.name}</div>
                <div className="pcard__cat mono"><b>{p.cat}</b> · {p.loc} · est. {p.year}</div>
              </div>
              <div className="pcard__metric">
                <div className="v">{p.metric}</div>
                <div className="l mono">{p.metricL}</div>
              </div>
              <p className="pcard__blurb">{p.blurb}</p>
              <div className="pcard__tags">{p.tags.map((t) => <Chip key={t}>{t}</Chip>)}</div>
              <div className="pcard__foot mono">
                <span className="by">por <b>{p.builder}</b></span>
                <span className="pcard__delta">▲ {p.delta} 30d</span>
              </div>
            </div>
          ))}
        </div>

        {rest.length > 0 && (
          <>
            <div className="rank-sub mono">también en construcción</div>
            <div className="rest">
              {rest.map((p) => (
                <div className="scard card reveal" key={p.name}>
                  <div className="scard__top">
                    <span className="scard__name">{p.name}</span>
                    <span className="scard__rank mono">#{String(p.rank).padStart(2, '0')}</span>
                  </div>
                  <div className="scard__cat mono">{p.cat} · {p.loc}</div>
                  <p className="scard__blurb">{p.blurb}</p>
                  <div className="scard__foot mono">
                    <span>por {p.builder}</span>
                    <span className="scard__metric">{p.metric} {p.metricL}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
