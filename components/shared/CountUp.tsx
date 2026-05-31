'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';

export function CountUp({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(children);

  useEffect(() => {
    const m = String(children).match(/^([^\d-]*)(-?[\d.]+)(.*)$/);
    if (!m) { setShown(children); return; }
    const [, pre, numStr, suf] = m;
    const target = parseFloat(numStr);
    const decimals = (numStr.split('.')[1] || '').length;
    let raf: number;
    let started = false;
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting && !started) {
          started = true;
          const t0 = performance.now(), dur = 1200;
          const tick = (t: number) => {
            const p = Math.min(1, (t - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            setShown(pre + (target * eased).toFixed(decimals) + suf);
            if (p < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [children]);

  return <span ref={ref}>{shown}</span>;
}
