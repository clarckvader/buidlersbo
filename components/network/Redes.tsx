'use client';

import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { SectionHead } from '@/components/shared/SectionHead';
import { RedesData, GeoNode } from '@/lib/types';

const NET_EDGES: [string, string][] = [
  ['La Paz', 'El Alto'], ['La Paz', 'Cochabamba'], ['Cochabamba', 'Santa Cruz'],
  ['Cochabamba', 'Oruro'], ['Santa Cruz', 'Sucre'], ['Sucre', 'Potosi'], ['Sucre', 'Tarija'],
  ['La Paz', 'Oruro'],
];

function makeProjector(allPts: [number, number][], W: number, H: number, pad: number) {
  const lons = allPts.map(p => p[0]), lats = allPts.map(p => p[1]);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const meanLat = (minLat + maxLat) / 2;
  const kx = Math.cos(meanLat * Math.PI / 180);
  const gw = (maxLon - minLon) * kx, gh = (maxLat - minLat);
  const s = Math.min((W - pad * 2) / gw, (H - pad * 2) / gh);
  const offX = (W - gw * s) / 2, offY = (H - gh * s) / 2;
  return (lon: number, lat: number): [number, number] => [
    offX + (lon - minLon) * kx * s,
    offY + (maxLat - lat) * s,
  ];
}

export function Redes() {
  const [data, setData] = useState<RedesData | null>(null);
  const [sel, setSel] = useState('La Paz');
  const mapRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [tipPos, setTipPos] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/content/redes.json')
      .then(r => r.json())
      .then((d: RedesData) => { if (alive) setData(d); })
      .catch(() => { if (alive) setData({ nodes: [], outline: [] }); });
    return () => { alive = false; };
  }, []);

  const W = 760, H = 700, PAD = 60;

  const proj = useMemo(() => {
    if (!data?.outline?.length) return null;
    return makeProjector(data.outline, W, H, PAD);
  }, [data]);

  const path = useMemo(() => {
    if (!proj || !data) return '';
    return data.outline.map((p, i) => {
      const [x, y] = proj(p[0], p[1]);
      return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ') + ' Z';
  }, [proj, data]);

  const placed = useMemo(() => {
    if (!proj || !data) return [];
    return data.nodes.map(n => { const [x, y] = proj(n.lon, n.lat); return { ...n, x, y }; });
  }, [proj, data]);

  const byCity = useMemo(() => Object.fromEntries(placed.map(n => [n.city, n])), [placed]);
  const nodes = data?.nodes ?? [];
  const total = nodes.reduce((s, n) => s + n.members, 0);
  const maxM = nodes.length ? Math.max(...nodes.map(n => n.members)) : 1;
  const hubs = nodes.filter(n => n.status === 'hub').length;
  const selNode = byCity[sel];
  const dotR = (m: number) => 5 + (m / maxM) * 11;

  useLayoutEffect(() => {
    const place = () => {
      if (!selNode || !mapRef.current || !tipRef.current) return;
      const mb = mapRef.current.getBoundingClientRect();
      const tip = tipRef.current;
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      const GAP = 12, TPAD = 10;
      const scale = Math.min(mb.width / W, mb.height / H);
      const drawW = W * scale, drawH = H * scale;
      const ox = (mb.width - drawW) / 2, oy = (mb.height - drawH) / 2;
      const nx = ox + selNode.x * scale, ny = oy + selNode.y * scale;
      const r = dotR(selNode.members) * scale;
      let top = ny - r - GAP - th;
      if (top < TPAD) top = ny + r + GAP;
      top = Math.max(TPAD, Math.min(top, mb.height - th - TPAD));
      let left = nx - tw / 2;
      left = Math.max(TPAD, Math.min(left, mb.width - tw - TPAD));
      setTipPos({ left, top });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [sel, selNode, data]);

  return (
    <div className="section-pad">
      <div className="net-wrap">
        <SectionHead index="04" eyebrow="@ redes" title="Donde tenemos presencia" sub="La comunidad sobre el territorio. Cada nodo es una celula activa de builders en una ciudad. Toca un nodo para inspeccionarlo." />

        <div className="net-layout reveal">
          <div className="netmap" ref={mapRef}>
            <div className="netmap__grid" />
            <span className="netmap__corner tl mono">map.bolivia // nodes={nodes.length}</span>
            <span className="netmap__corner br mono">src: content/redes.json</span>

            {!data && <div className="net-loading mono">cargando mapa…</div>}

            {proj && (
              <svg className="net-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
                <defs>
                  <radialGradient id="boGlow" cx="42%" cy="38%" r="70%">
                    <stop offset="0%" stopColor="oklch(0.9 0.185 104 / 0.16)" />
                    <stop offset="100%" stopColor="oklch(0.9 0.185 104 / 0)" />
                  </radialGradient>
                </defs>
                <path d={path} className="bo-shape" />
                <path d={path} fill="url(#boGlow)" stroke="none" />
                {NET_EDGES.map(([a, b], i) => {
                  const A = byCity[a], B = byCity[b];
                  if (!A || !B) return null;
                  return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} className="bo-edge" />;
                })}
                {placed.map((n) => (
                  <g key={n.city} className={'bo-node bo-node--' + n.status + (sel === n.city ? ' sel' : '')}
                    onClick={() => setSel(n.city)} style={{ cursor: 'pointer' }}>
                    {n.status !== 'naciente' && <circle cx={n.x} cy={n.y} r={dotR(n.members)} className="bo-pulse" />}
                    <circle cx={n.x} cy={n.y} r={dotR(n.members)} className="bo-dot" />
                    <text
                      x={n.labelSide === 'left' ? n.x - dotR(n.members) - 8 : n.x + dotR(n.members) + 8}
                      y={n.y + 4}
                      textAnchor={n.labelSide === 'left' ? 'end' : 'start'}
                      className="bo-label"
                    >{n.city}</text>
                  </g>
                ))}
              </svg>
            )}

            {selNode && (
              <div ref={tipRef} className="net-tip"
                style={tipPos ? { left: tipPos.left + 'px', top: tipPos.top + 'px' } : { left: -9999, top: -9999 }}>
                <div className="ct">{selNode.city}</div>
                <div className="mb">{selNode.members} builders</div>
                <div className="nt">{selNode.note}</div>
              </div>
            )}
          </div>

          <div className="net-side">
            <div className="net-stat-row">
              <div className="net-stat"><div className="n">{total.toLocaleString('es')}</div><div className="l">builders</div></div>
              <div className="net-stat"><div className="n">{nodes.length}</div><div className="l">ciudades</div></div>
              <div className="net-stat"><div className="n">{hubs}</div><div className="l">hubs</div></div>
            </div>
            <h3 className="mono">nodos · por tamaño</h3>
            <div className="citylist">
              {[...nodes].sort((a, b) => b.members - a.members).map((n) => (
                <div key={n.city} className={'cityrow' + (sel === n.city ? ' sel' : '')} onClick={() => setSel(n.city)}>
                  <span className={'cityrow__s s-' + n.status} />
                  <span className="cityrow__name">{n.city}</span>
                  <span className="cityrow__bar"><i style={{ width: (n.members / maxM * 100) + '%' }} /></span>
                  <span className="cityrow__n">{n.members}</span>
                </div>
              ))}
            </div>
            <div className="net-legend">
              <span><i className="s-hub" /> hub</span>
              <span><i className="s-activo" /> activo</span>
              <span><i className="s-naciente" /> naciente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
