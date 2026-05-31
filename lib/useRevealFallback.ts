'use client';

import { useEffect } from 'react';

export function useRevealFallback(dep?: unknown) {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal:not(.is-in)');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [dep]);
}
