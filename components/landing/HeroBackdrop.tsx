'use client';

import { useState, useEffect, useRef } from 'react';

const BG_LINES = [
  { t: '$ ./buidlers --init', c: 'pmt' },
  { t: '› montando entorno ........................ [ok]', c: 'ok' },
  { t: '› region        = bolivia', c: 'dim' },
  { t: '› nodos         = la paz · santa cruz · cochabamba · el alto', c: 'dim' },
  { t: '›                 sucre · tarija · oruro · potosi', c: 'dim' },
  { t: '› miembros       = 1.084 builders activos', c: 'dim' },
  { t: '› proyectos      = 6 en construccion, 32 incubando', c: 'dim' },
  { t: '› eventos        = meetups mensuales + buildathon anual', c: 'dim' },
  { t: '› valores        = soberania, autonomia, resiliencia', c: 'warn' },
  { t: '› mision         = construir herramientas que empoderan', c: 'warn' },
  { t: '✓ comunidad lista. bienvenido, builder.', c: 'ok' },
  { t: '$ cat manifiesto.md', c: 'pmt' },
  { t: '  no especulamos. construimos.', c: 'dim' },
  { t: '  web3 + ia // privacidad == derecho', c: 'dim' },
  { t: '$ ./join_buidlers --init', c: 'pmt' },
  { t: '▸ esperando nuevos nodos_', c: 'warn' },
  { t: '$ _', c: 'pmt' },
];

const MAX = 16;

export function HeroBackdrop() {
  const [lines, setLines] = useState<Array<{ t: string; c: string; key: number }>>([]);
  const iRef = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const next = BG_LINES[iRef.current % BG_LINES.length];
      iRef.current += 1;
      setLines((prev) => {
        const out = [...prev, { ...next, key: iRef.current }];
        return out.length > MAX ? out.slice(out.length - MAX) : out;
      });
      const isRestart = (iRef.current % BG_LINES.length) === 1;
      timer = setTimeout(tick, isRestart ? 900 : 130 + Math.random() * 220);
    };
    timer = setTimeout(tick, 350);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="hero__bg" aria-hidden="true">
      <div className="hero__bgterm mono">
        {lines.map((l) => (
          <div className={'bgline ' + l.c} key={l.key}>{l.t}</div>
        ))}
        <span className="cursor" />
      </div>
    </div>
  );
}
