'use client';

import { usePathname, useRouter } from 'next/navigation';
import { NAV } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

interface RailProps {
  onClose?: () => void;
}

export function Rail({ onClose }: RailProps) {
  const pathname = usePathname();
  const router = useRouter();

  const go = (id: string) => {
    router.push(id === 'inicio' ? '/' : `/${id}`);
    onClose?.();
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const activeId = pathname === '/' ? 'inicio' : pathname.slice(1).split('/')[0];

  return (
    <nav className="rail__nav">
      {NAV.map((n) => (
        <button
          key={n.id}
          className={'navlink' + (activeId === n.id ? ' active' : '')}
          onClick={() => go(n.id)}
        >
          <span className="navlink__glyph mono">{n.glyph}</span>
          <span>{n.label}<em>;</em></span>
        </button>
      ))}
    </nav>
  );
}

export function BrandMark({ size }: { size?: number }) {
  return (
    <div className="rail__brand">
      <div className="rail__logo" style={size ? { fontSize: size } : undefined}>
        <span>buidlers</span><b>_</b><span className="cur" />
      </div>
      <span className="rail__tag">// builders.realm — bolivia@web3</span>
    </div>
  );
}

export function RailStatus() {
  return (
    <div className="rail__status">
      <span className="dot" /> nodos online · sync ok
    </div>
  );
}
