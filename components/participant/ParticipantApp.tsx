'use client';

import { useRouter } from 'next/navigation';
import { Countdown } from './Countdown';
import { Chip } from '@/components/shared/Chip';
import { useAuth } from '@/context/AuthContext';

const AVC = ['oklch(0.9 0.18 104)', 'oklch(0.82 0.12 200)', 'oklch(0.78 0.14 62)'];
const ini = (n: string) => n.split(/[\s.]+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('');

const PA_TEAM = [
  { nm: 'Sara Q.',  rl: 'ZK engineer · lead',  c: 0 },
  { nm: 'Pablo M.', rl: 'Smart contracts',      c: 1 },
  { nm: 'Marta R.', rl: 'Diseño / producto',    c: 2 },
];
const PA_PHASES = [
  { t: 'Registro de equipos', d: 'hasta 30 jun', st: 'done' },
  { t: 'Kickoff & mentorías',  d: '04 jul · 09:00', st: 'done' },
  { t: 'Hacking (48h)',        d: '04–06 jul', st: 'now' },
  { t: 'Submission & demo',    d: '06 jul · 14:00', st: 'pending' },
  { t: 'Premiación',           d: '06 jul · 18:00', st: 'pending' },
];
const PA_RANK = [
  { rk: 1, nm: 'ayni.protocol', sc: '8.8k' },
  { rk: 2, nm: 'pacha.id', sc: '8.2k' },
  { rk: 3, nm: 'lab altiplano', sc: '7.9k', me: true },
  { rk: 4, nm: 'khipu.dao', sc: '7.6k' },
];
const PA_RES = ['docs / starter kits', 'testnet faucet', 'mentores · agenda', 'discord #buildathon', 'reglas & criterios'];

export function ParticipantApp() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const target = new Date('2026-07-04T09:00:00').getTime();
  const u = user ?? { handle: '@builder', team: 'lab altiplano', provider: 'github', name: 'Builder' };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="pa">
      <div className="pa__bar mono">
        <span className="pmt">buidlers@bolivia</span>:<span className="u">~/participante/{u.team.replace(/\s/g, '_')}</span>$
        <span className="right">
          <button onClick={() => router.push('/')}>← volver al sitio</button>
          <button onClick={handleLogout}>cerrar sesión</button>
        </span>
      </div>
      <h1>Hola, <span className="y">{u.handle}</span>.</h1>

      <div className="pa-grid">
        <div className="pa-card cd-hero col-8">
          <h4 className="mono"><span className="g">▸</span> hackathon en curso</h4>
          <div className="cd-name">Buildathon Bolivia 2026</div>
          <div className="cd-sub mono">santa cruz · manzana 1 · $40K en premios</div>
          <Countdown target={target} />
          <div className="mono" style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 10 }}>
            # cuenta regresiva al kickoff
          </div>
        </div>

        <div className="pa-card col-4">
          <h4 className="mono"><span className="g">::</span> mi equipo · {u.team}</h4>
          {PA_TEAM.map((m) => (
            <div className="pa-member" key={m.nm}>
              <span className="bcard__av" style={{ background: AVC[m.c % 3], width: 34, height: 34, fontSize: 11 }}>
                {ini(m.nm)}
              </span>
              <div><div className="nm">{m.nm}</div><div className="rl">{m.rl}</div></div>
            </div>
          ))}
          <button className="pa-invite mono">+ invitar builder (1 slot libre)</button>
        </div>

        <div className="pa-card col-6">
          <h4 className="mono"><span className="g">▸</span> mi proyecto</h4>
          <div className="sub-status mono">
            <Chip tone="yellow">borrador</Chip>
            <span style={{ color: 'var(--ink-mute)' }}>guardado hace 12 min</span>
          </div>
          <div className="sub-field"><label>nombre</label><input defaultValue="pacha.id" /></div>
          <div className="sub-field"><label>repositorio</label><input defaultValue="github.com/lab-altiplano/pacha-id" /></div>
          <div className="sub-field"><label>track</label><input defaultValue="Identidad & Privacidad (ZK)" /></div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>guardar borrador</button>
        </div>

        <div className="pa-card col-6">
          <h4 className="mono"><span className="g">//</span> cronograma</h4>
          <div className="tl">
            {PA_PHASES.map((p) => (
              <div className={'tl-item ' + p.st} key={p.t}>
                <div className="tt mono">{p.t}</div>
                <div className="dd mono">{p.d}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="pa-card col-6">
          <h4 className="mono"><span className="g">#</span> ranking en vivo</h4>
          {PA_RANK.map((r) => (
            <div className={'mr-row' + (r.me ? ' me' : '')} key={r.nm}>
              <span className="rk">{String(r.rk).padStart(2, '0')}</span>
              <span className="nm">{r.nm}{r.me && ' ← tu equipo'}</span>
              <span className="sc">{r.sc}</span>
            </div>
          ))}
        </div>

        <div className="pa-card col-6">
          <h4 className="mono"><span className="g">~</span> recursos</h4>
          {PA_RES.map((r) => (
            <a key={r} className="res-link mono" href="#" onClick={(e) => e.preventDefault()}>
              {r}<span className="arr">↗</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
