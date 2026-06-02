'use client';

import { useRouter } from 'next/navigation';
import { HeroBackdrop } from './HeroBackdrop';
import { SectionHead } from '@/components/shared/SectionHead';
import { CountUp } from '@/components/shared/CountUp';
import { useRevealFallback } from '@/lib/useRevealFallback';
import { useAuth } from '@/context/AuthContext';
import { Value, Stat } from '@/lib/types';

interface LandingProps {
  values: Value[];
  stats: Stat[];
}

export function Landing({ values, stats }: LandingProps) {
  const router = useRouter();
  const { user, openModal } = useAuth();
  useRevealFallback('inicio');

  const openAccess = () => {
    if (user) router.push('/participante');
    else openModal();
  };

  return (
    <div>
      {/* HERO */}
      <section className="hero">
        <HeroBackdrop />
        <div className="hero__content">
          <div className="hero__eyebrow">
            <span className="ln" />
            <span className="eyebrow">buidlers bolivia — est. 2021 @ la paz</span>
          </div>
          <div className="hero__open mono"><span className="b">init</span> {'{'}</div>
          <h1>
            no<br />
            <span className="accent">especulamos.</span><br />
            <span className="out">// </span>construimos<span style={{ color: 'var(--ink-faint)' }}>;</span>
          </h1>
          <div className="hero__code">
            <div><span className="tok-key">echo</span> <span className="tok-str">&quot;construimos herramientas que empoderan&quot;</span>;</div>
            <div>web3 <span className="tok-key">+</span> ia <span className="tok-key">//</span> privacidad <span className="tok-key">==</span> derecho;</div>
            <div className="tok-com"># comunidad de constructores web3, desde los andes</div>
          </div>
          <div className="hero__close mono">{'}'}</div>
          <div className="hero__cta">
            <button className="btn btn-primary" onClick={openAccess}>./join_buidlers --init ↗</button>
            <button className="btn btn-ghost" onClick={() => router.push('/ranking')}>ver proyectos</button>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee">
        <div className="marquee__track">
          {[0, 1].map((dup) => (
            <span key={dup}>
              <span>BUIDL <b>·</b> not just HODL</span>
              <span>+530% transacciones cripto en bolivia</span>
              <span>1ª hackathon web3 del país</span>
              <span>privacidad <b>==</b> derecho</span>
              <span>self-custodial <b>·</b> always</span>
              <span>built in public <b>·</b> desde los andes</span>
            </span>
          ))}
        </div>
      </div>

      {/* VALUES */}
      <section className="section-pad">
        <div className="values">
          <SectionHead index="01" eyebrow="// principios" title="Las variables que no negociamos" sub="El sistema operativo de la comunidad. Cuatro constantes que definen cómo y por qué construimos." />
          <div className="values__grid">
            {values.map((v, i) => (
              <div className="valcard card reveal" key={v.k}>
                <span className="valcard__idx mono">0{i + 1}</span>
                <div className="valcard__k mono">VAR {v.k} <span className="eq">=</span></div>
                <div className="valcard__v"><span className="q">&quot;</span>{v.v}<span className="q">&quot;</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="stats__grid">
          {stats.map((s) => (
            <div className="stat reveal" key={s.src}>
              <div className="stat__n"><CountUp>{s.n}</CountUp></div>
              <div className="stat__l">{s.l}</div>
              <span className="stat__src mono">module {s.src}</span>
            </div>
          ))}
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="section-pad">
        <div className="eth">
          <div className="reveal">
            <span className="eyebrow">// la comunidad</span>
            <p className="eth__big" style={{ marginTop: 18 }}>
              Empezamos en La Paz en 2021. Hoy somos una red de builders <span className="hl">en todo el país</span>.
            </p>
            <p style={{ marginTop: 20, color: 'var(--ink-dim)', maxWidth: '46ch', lineHeight: 1.6 }}>
              No pedimos hoja de vida. Pedimos un repo, una idea, o ganas de aprender. La comunidad hace el resto.
            </p>
          </div>
          <div className="eth__panel card reveal">
            <div className="eth__row"><span className="g mono">→</span><p><b>Eventos mensuales</b> desde 2021, presenciales y abiertos, en varias ciudades.</p></div>
            <div className="eth__row"><span className="g mono">→</span><p><b>Buildathon de 3 días</b>: +200 hackers de toda Bolivia en la primera hackathon Web3 del país.</p></div>
            <div className="eth__row"><span className="g mono">→</span><p><b>Mentoría real</b>: builders que vienen de la industria acompañan a los proyectos.</p></div>
            <div className="eth__row"><span className="g mono">→</span><p><b>Construir en público</b>: todo lo que hacemos es abierto y replicable.</p></div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section-pad" style={{ paddingTop: 0 }}>
        <div className="cta-final">
          <div className="cta-card reveal">
            <span className="cta-card__deco">{'</>'}</span>
            <span className="eyebrow">// ./join</span>
            <h3 style={{ marginTop: 16 }}>¿Construyes? Este es tu nodo.</h3>
            <p>Súmate a la comunidad, encuentra equipo y construye lo que Bolivia necesita.</p>
            <div className="hero__cta">
              <button className="btn btn-primary" onClick={openAccess}>./join_buidlers ↗</button>
              <button className="btn btn-ghost" onClick={() => router.push('/eventos')}>próximos eventos</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
