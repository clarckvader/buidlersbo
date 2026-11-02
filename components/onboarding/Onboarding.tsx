'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  INTERESTS, LIMITS, ROLES, STACK_SUGGESTIONS, USERNAME_HINT, USERNAME_RE, suggestUsername,
} from '@/lib/profile';
import type { Member } from '@/payload-types';

const STEPS = ['usuario', 'intereses', 'stack', 'proyecto'] as const;

type Availability = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export function Onboarding() {
  const router = useRouter();
  const { member, setMember, user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState('');
  const [availability, setAvailability] = useState<Availability>('idle');
  const [roles, setRoles] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [stack, setStack] = useState<string[]>([]);
  const [stackInput, setStackInput] = useState('');
  const [building, setBuilding] = useState('');
  const [links, setLinks] = useState('');

  // Precarga lo que el miembro ya tenga (o una sugerencia de @usuario desde su nombre).
  useEffect(() => {
    if (!member) return;
    setUsername((u) => u || member.username || suggestUsername(member.name));
    setRoles((r) => (r.length ? r : member.roles ?? []));
    setInterests((i) => (i.length ? i : member.interests ?? []));
    setStack((s) => (s.length ? s : member.stack ?? []));
    setBuilding((b) => b || member.building || '');
    setLinks((l) => l || (member.links ?? []).join('\n'));
  }, [member]);

  // Disponibilidad del @usuario, con debounce.
  useEffect(() => {
    if (!username) return setAvailability('idle');
    if (!USERNAME_RE.test(username)) return setAvailability('invalid');
    if (username === member?.username) return setAvailability('available');
    setAvailability('checking');
    const t = setTimeout(async () => {
      const res = await fetch(`/api/members/username?u=${encodeURIComponent(username)}`, { credentials: 'include' })
        .then((r) => r.json())
        .catch(() => null);
      setAvailability(res?.available ? 'available' : res?.valid === false ? 'invalid' : 'taken');
    }, 350);
    return () => clearTimeout(t);
  }, [username, member?.username]);

  if (!user) {
    return (
      <div className="ob">
        <p className="mono ob__muted">inicia sesión para continuar.</p>
      </div>
    );
  }

  async function save(data: Record<string, unknown>): Promise<Member | null> {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/members/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? 'No se pudo guardar');
        return null;
      }
      setMember(body.member);
      return body.member;
    } finally {
      setSaving(false);
    }
  }

  async function next(data: Record<string, unknown> = {}) {
    const last = step === STEPS.length - 1;
    const saved = await save(last ? { ...data, finishOnboarding: true } : data);
    if (!saved) return;
    if (last) router.push('/participante');
    else setStep(step + 1);
  }

  async function finishLater() {
    if (await save({ finishOnboarding: true })) router.push('/participante');
  }

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const addStack = (value: string) => {
    const v = value.trim().slice(0, LIMITS.item);
    if (v && !stack.includes(v) && stack.length < LIMITS.stack) setStack([...stack, v]);
    setStackInput('');
  };

  const linkList = links.split(/\s+/).map((l) => l.trim()).filter(Boolean);

  return (
    <div className="ob">
      <div className="ob__card">
        <div className="modal__bar">
          <span className="dots"><i /><i /><i /></span>
          <span className="t mono">bienvenida — ./setup {step + 1}/{STEPS.length}</span>
        </div>
        <div className="ob__progress">
          {STEPS.map((s, i) => (
            <span key={s} className={i <= step ? 'on' : ''} />
          ))}
        </div>

        <div className="modal__body">
          {step === 0 && (
            <>
              <div className="pre mono"><span className="y">$</span> whoami</div>
              <h3>Elige tu @usuario</h3>
              <p className="sub">Así te va a ver la comunidad. Puedes cambiarlo después.</p>
              <div className="ob__handle">
                <span className="mono">@</span>
                <input
                  autoFocus
                  value={username}
                  maxLength={20}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && availability === 'available') next({ username }); }}
                  placeholder="tu_usuario"
                  className="mono"
                />
              </div>
              <div className={'ob__hint mono ob__hint--' + availability}>
                {availability === 'checking' && 'verificando…'}
                {availability === 'available' && '✓ disponible'}
                {availability === 'taken' && '✗ ya está tomado'}
                {(availability === 'invalid' || availability === 'idle') && USERNAME_HINT}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="pre mono"><span className="y">$</span> cat intereses.txt</div>
              <h3>¿Qué haces y qué te interesa?</h3>
              <p className="sub">Elige las que quieras. Nos ayuda a conectarte con equipos y eventos.</p>
              <div className="ob__label mono">qué haces</div>
              <div className="ob__chips">
                {ROLES.map((r) => (
                  <button key={r} type="button" className={'ob__chip' + (roles.includes(r) ? ' on' : '')} onClick={() => toggle(roles, setRoles, r)}>{r}</button>
                ))}
              </div>
              <div className="ob__label mono">intereses</div>
              <div className="ob__chips">
                {INTERESTS.map((i) => (
                  <button key={i} type="button" className={'ob__chip' + (interests.includes(i) ? ' on' : '')} onClick={() => toggle(interests, setInterests, i)}>{i}</button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="pre mono"><span className="y">$</span> ls ~/stack</div>
              <h3>Tu stack</h3>
              <p className="sub">Tecnologías con las que trabajas o quieres aprender.</p>
              <div className="ob__chips">
                {[...new Set([...STACK_SUGGESTIONS, ...stack])].map((t) => (
                  <button key={t} type="button" className={'ob__chip' + (stack.includes(t) ? ' on' : '')} onClick={() => toggle(stack, setStack, t)}>{t}</button>
                ))}
              </div>
              <div className="sub-field" style={{ marginTop: 14 }}>
                <input
                  value={stackInput}
                  onChange={(e) => setStackInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addStack(stackInput); } }}
                  onBlur={() => addStack(stackInput)}
                  placeholder="otra tecnología + enter"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="pre mono"><span className="y">$</span> git log --oneline</div>
              <h3>¿Qué estás construyendo?</h3>
              <p className="sub">Un proyecto, una idea o lo que estés aprendiendo. Opcional.</p>
              <div className="sub-field">
                <label>en qué andas</label>
                <textarea
                  className="ob__textarea"
                  value={building}
                  maxLength={LIMITS.building}
                  rows={3}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="ej. una wallet para remesas sobre Stellar"
                />
              </div>
              <div className="sub-field">
                <label>links (github, portfolio…)</label>
                <textarea
                  className="ob__textarea"
                  value={links}
                  rows={2}
                  onChange={(e) => setLinks(e.target.value)}
                  placeholder="https://github.com/tu_usuario"
                />
              </div>
            </>
          )}

          {error && <div className="ob__error mono">{error}</div>}

          <div className="ob__actions">
            {step > 0 && (
              <button type="button" className="ob__link mono" onClick={() => setStep(step - 1)} disabled={saving}>← atrás</button>
            )}
            <span className="ob__spacer" />
            {step > 0 && (
              <button type="button" className="ob__link mono" onClick={finishLater} disabled={saving}>completar después</button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving || (step === 0 && availability !== 'available')}
              onClick={() => {
                if (step === 0) next({ username });
                else if (step === 1) next({ roles, interests });
                else if (step === 2) next({ stack });
                else next({ building, links: linkList });
              }}
            >
              {saving ? 'guardando…' : step === STEPS.length - 1 ? 'terminar ↗' : 'siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
