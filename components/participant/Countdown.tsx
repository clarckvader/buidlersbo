'use client';

import { useState, useEffect } from 'react';

function Unit({ v, l }: { v: number; l: string }) {
  return (
    <div className="cd-unit">
      <div className="v">{String(v).padStart(2, '0')}</div>
      <div className="l mono">{l}</div>
    </div>
  );
}

function Sep() {
  return <div className="cd-unit"><div className="v sep">:</div></div>;
}

export function Countdown({ target }: { target: number }) {
  const [t, setT] = useState(() => Math.max(0, target - Date.now()));

  useEffect(() => {
    const id = setInterval(() => setT(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);

  const d = Math.floor(t / 864e5);
  const h = Math.floor((t % 864e5) / 36e5);
  const m = Math.floor((t % 36e5) / 6e4);
  const s = Math.floor((t % 6e4) / 1000);

  return (
    <div className="cd-row">
      <Unit v={d} l="días" /><Sep />
      <Unit v={h} l="hrs" /><Sep />
      <Unit v={m} l="min" /><Sep />
      <Unit v={s} l="seg" />
    </div>
  );
}
