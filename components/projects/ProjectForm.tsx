'use client';

import { useState } from 'react';
import { LIMITS, PROJECT_STATUS, STACK_SUGGESTIONS, type ProjectStatus } from '@/lib/profile';
import type { ProjectPage } from '@/lib/types';

type Saved = { id: number | string; slug: string };

// Lista editable de chips: sugerencias + texto libre con enter.
function ChipInput({ value, onChange, suggestions = [], placeholder, max }: {
  value: string[]; onChange: (v: string[]) => void; suggestions?: string[]; placeholder: string; max: number;
}) {
  const [input, setInput] = useState('');
  const add = (raw: string) => {
    const v = raw.trim().slice(0, LIMITS.item);
    if (v && !value.includes(v) && value.length < max) onChange([...value, v]);
    setInput('');
  };
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <>
      <div className="ob__chips">
        {[...new Set([...suggestions, ...value])].map((t) => (
          <button key={t} type="button" className={'ob__chip' + (value.includes(t) ? ' on' : '')} onClick={() => toggle(t)}>{t}</button>
        ))}
      </div>
      <div className="sub-field" style={{ marginTop: 10 }}>
        <input
          value={input}
          placeholder={placeholder}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); } }}
          onBlur={() => add(input)}
        />
      </div>
    </>
  );
}

export function ProjectForm({ initial, projectId, onSaved, onCancel }: {
  initial?: Partial<ProjectPage>;
  projectId?: number | string;
  onSaved: (project: Saved) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [tagline, setTagline] = useState(initial?.tagline ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? 'idea');
  const [stack, setStack] = useState<string[]>(initial?.stack ?? []);
  const [lookingFor, setLookingFor] = useState<string[]>(initial?.lookingFor ?? []);
  const [links, setLinks] = useState((initial?.links ?? []).join('\n'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = {
      name, tagline, description, category, city, status, stack, lookingFor,
      links: links.split(/\s+/).map((l) => l.trim()).filter(Boolean),
    };
    try {
      const res = await fetch(projectId ? `/api/projects/${projectId}/edit` : '/api/projects/create', {
        method: projectId ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return setError(data?.error ?? 'No se pudo guardar');
      onSaved(data.project);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="pj-form" onSubmit={submit}>
      <div className="sub-field">
        <label>nombre *</label>
        <input value={name} maxLength={LIMITS.name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </div>
      <div className="sub-field">
        <label>en una línea</label>
        <input value={tagline} maxLength={LIMITS.tagline} onChange={(e) => setTagline(e.target.value)} placeholder="ej. identidad digital para cooperativas" />
      </div>
      <div className="sub-field">
        <label>descripción</label>
        <textarea className="ob__textarea" rows={4} value={description} maxLength={LIMITS.description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="pj-form__row">
        <div className="sub-field">
          <label>categoría</label>
          <input value={category} maxLength={LIMITS.item} onChange={(e) => setCategory(e.target.value)} placeholder="DeFi, identidad…" />
        </div>
        <div className="sub-field">
          <label>ciudad</label>
          <input value={city} maxLength={LIMITS.item} onChange={(e) => setCity(e.target.value)} />
        </div>
      </div>
      <div className="ob__label mono">estado</div>
      <div className="ob__chips">
        {PROJECT_STATUS.map((s) => (
          <button key={s} type="button" className={'ob__chip' + (status === s ? ' on' : '')} onClick={() => setStatus(s)}>{s}</button>
        ))}
      </div>
      <div className="ob__label mono">stack</div>
      <ChipInput value={stack} onChange={setStack} suggestions={STACK_SUGGESTIONS} placeholder="otra tecnología + enter" max={LIMITS.stack} />
      <div className="ob__label mono">qué perfiles buscan</div>
      <ChipInput value={lookingFor} onChange={setLookingFor} suggestions={['Smart contracts', 'Frontend', 'Diseño', 'Producto', 'Growth']} placeholder="otro perfil + enter" max={LIMITS.lookingFor} />
      <div className="sub-field" style={{ marginTop: 18 }}>
        <label>links (repo, demo, web)</label>
        <textarea className="ob__textarea" rows={2} value={links} onChange={(e) => setLinks(e.target.value)} placeholder="https://github.com/…" />
      </div>
      {error && <div className="ob__error mono">{error}</div>}
      <div className="ob__actions">
        {onCancel && <button type="button" className="ob__link mono" onClick={onCancel} disabled={saving}>cancelar</button>}
        <span className="ob__spacer" />
        <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
          {saving ? 'guardando…' : projectId ? 'guardar cambios' : 'crear proyecto ↗'}
        </button>
      </div>
    </form>
  );
}
