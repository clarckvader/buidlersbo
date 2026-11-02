const COLORS = [
  'oklch(0.9 0.18 104)', 'oklch(0.82 0.12 200)',
  'oklch(0.84 0.16 150)', 'oklch(0.78 0.14 62)', 'oklch(0.75 0.16 350)',
];

const initials = (s: string) =>
  s.split(/[\s._]+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase() || '?';

// Foto del proveedor (Google/GitHub) si existe; si no, iniciales con color estable.
export function Avatar({ name, username, avatar, size = 26 }: {
  name?: string | null; username?: string | null; avatar?: string | null; size?: number;
}) {
  const label = name || username || '?';
  const color = COLORS[(label.charCodeAt(0) + label.length) % COLORS.length];
  return (
    <span className="av" title={username ? `@${username}` : label} style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}>
      {avatar
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={avatar} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', borderRadius: 99, objectFit: 'cover' }} />
        : initials(label)}
    </span>
  );
}
