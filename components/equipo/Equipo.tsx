'use client';

import { useState } from 'react';
import { SectionHead } from '@/components/shared/SectionHead';
import { Chip } from '@/components/shared/Chip';
import { useRevealFallback } from '@/lib/useRevealFallback';
import { Team } from '@/lib/types';

const AV_COLORS = [
  'oklch(0.9 0.18 104)', 'oklch(0.82 0.12 200)',
  'oklch(0.84 0.16 150)', 'oklch(0.78 0.14 62)', 'oklch(0.75 0.16 350)',
];
const avColor = (s: string) => AV_COLORS[(s.charCodeAt(0) + s.length) % AV_COLORS.length];
const initials = (n: string) => n.split(/[\s.]+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase();

const BUILDERS = [
  { name: 'Pablo M.',  role: 'Smart contracts', skills: ['Solidity', 'Foundry'], cat: 'dev' },
  { name: 'Ana Q.',    role: 'Frontend / UX',   skills: ['React', 'Design'],    cat: 'design' },
  { name: 'Diego A.',  role: 'Backend / infra', skills: ['Go', 'Rust'],         cat: 'dev' },
  { name: 'Sara Q.',   role: 'ZK engineer',     skills: ['Circom', 'Noir'],     cat: 'dev' },
  { name: 'Luis V.',   role: 'Producto',        skills: ['PM', 'Pitch'],        cat: 'biz' },
  { name: 'Marta R.',  role: 'Diseño visual',   skills: ['Figma', 'Motion'],    cat: 'design' },
  { name: 'José C.',   role: 'Data / oráculos', skills: ['Python', 'TS'],       cat: 'dev' },
  { name: 'Nina T.',   role: 'Growth / DevRel', skills: ['Comms', 'Community'], cat: 'biz' },
];
const SLOTS = ['Smart contracts', 'Frontend / UX', 'Diseño / producto', 'Growth / pitch'];
const SKILLS = ['Todos', 'dev', 'design', 'biz'];

type Builder = typeof BUILDERS[0];

function TeamsShowcase({ teams }: { teams: Team[] }) {
  return (
    <div className="eq-grid">
      {teams.map((t) => (
        <div className="teamcard card reveal" key={t.name}>
          <div className="teamcard__top">
            <div>
              <div className="teamcard__name">{t.name}</div>
              <div className="teamcard__city">{t.city}</div>
            </div>
            {t.open > 0
              ? <Chip tone="yellow">{t.open} {t.open === 1 ? 'vacante' : 'vacantes'}</Chip>
              : <Chip tone="green">completo</Chip>}
          </div>
          <div className="teamcard__focus">{t.focus}</div>
          <div className="teamcard__stack">{t.stack.map((s) => <Chip key={s}>{s}</Chip>)}</div>
          <div className="teamcard__foot">
            <div className="avatars">
              {Array.from({ length: Math.min(t.members, 4) }).map((_, i) => (
                <span className="av" key={i} style={{ background: AV_COLORS[i % AV_COLORS.length] }}>
                  {String.fromCharCode(65 + i)}
                </span>
              ))}
              {t.open > 0 && <span className="av empty">+</span>}
            </div>
            <span className="teamcard__lead">lead · {t.lead}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Organizer() {
  const [filter, setFilter] = useState('Todos');
  const [picked, setPicked] = useState<Builder[]>([]);
  const pool = BUILDERS.filter((b) => filter === 'Todos' || b.cat === filter);

  const add = (b: Builder) => {
    if (picked.length < 4 && !picked.find(p => p.name === b.name)) {
      setPicked([...picked, b]);
    }
  };
  const remove = (n: string) => setPicked(picked.filter((p) => p.name !== n));

  const coverage = {
    dev: picked.some(p => p.cat === 'dev'),
    design: picked.some(p => p.cat === 'design'),
    biz: picked.some(p => p.cat === 'biz'),
  };
  const pct = Math.round((picked.length / 4) * 100);

  return (
    <div className="org reveal">
      <div className="org__pool">
        <h3>builders disponibles</h3>
        <div className="skill-filter">
          {SKILLS.map((s) => (
            <button key={s} className={'fbtn' + (filter === s ? ' on' : '')} onClick={() => setFilter(s)}>
              {s.toLowerCase()}
            </button>
          ))}
        </div>
        {pool.map((b) => {
          const isP = picked.find(p => p.name === b.name);
          return (
            <div className={'bcard' + (isP ? ' picked' : '')} key={b.name}>
              <span className="bcard__av" style={{ background: avColor(b.name) }}>{initials(b.name)}</span>
              <div className="bcard__info">
                <div className="bcard__name">{b.name}</div>
                <div className="bcard__role">{b.role}</div>
                <div className="bcard__skills">{b.skills.map(s => <Chip key={s}>{s}</Chip>)}</div>
              </div>
              <button className="bcard__add" onClick={() => add(b)}>+</button>
            </div>
          );
        })}
      </div>

      <div className="org__build">
        <h3 className="mono" style={{ color: 'var(--ink)', marginBottom: 16 }}>./armar_equipo</h3>
        {SLOTS.map((role, i) => {
          const member = picked[i];
          return (
            <div className={'slot' + (member ? ' filled' : '')} key={role}>
              {member ? (
                <>
                  <span className="bcard__av" style={{ background: avColor(member.name), width: 32, height: 32, fontSize: 11 }}>
                    {initials(member.name)}
                  </span>
                  <div>
                    <div className="bcard__name" style={{ fontSize: 13 }}>{member.name}</div>
                    <div className="slot__role">{member.role}</div>
                  </div>
                  <button className="slot__x" onClick={() => remove(member.name)}>×</button>
                </>
              ) : (
                <>
                  <span style={{ color: 'var(--ink-faint)', fontSize: 18 }}>+</span>
                  <span className="slot__role">slot libre · {role.toLowerCase()}</span>
                </>
              )}
            </div>
          );
        })}

        <div className="org__meter">
          <div className="lbl"><span>composición</span><span>{picked.length}/4</span></div>
          <div className="bar"><i style={{ width: pct + '%' }} /></div>
        </div>
        <div className="org__coverage">
          <div>{coverage.dev ? <span className="y">✓</span> : <span className="miss">○</span>} cobertura técnica (dev)</div>
          <div>{coverage.design ? <span className="y">✓</span> : <span className="miss">○</span>} diseño / producto</div>
          <div>{coverage.biz ? <span className="y">✓</span> : <span className="miss">○</span>} growth / pitch</div>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}
          disabled={picked.length < 2}
        >
          {picked.length < 2 ? 'agrega al menos 2' : 'registrar equipo ↗'}
        </button>
      </div>
    </div>
  );
}

export function Equipo({ teams }: { teams: Team[] }) {
  useRevealFallback('equipo');
  const [tab, setTab] = useState<'equipos' | 'armar'>('equipos');

  return (
    <div className="section-pad">
      <div className="eq-wrap">
        <SectionHead index="03" eyebrow=":: equipo" title="Quiénes construyen" sub="Equipos activos construyendo desde Bolivia — y una herramienta para armar el tuyo cuando llegue la próxima hackathon." />
        <div className="eq-tabs reveal">
          <button className={'eq-tab' + (tab === 'equipos' ? ' on' : '')} onClick={() => setTab('equipos')}>equipos activos</button>
          <button className={'eq-tab' + (tab === 'armar' ? ' on' : '')} onClick={() => setTab('armar')}>armar equipo</button>
        </div>
        {tab === 'equipos' ? <TeamsShowcase teams={teams} /> : <Organizer />}
      </div>
    </div>
  );
}
