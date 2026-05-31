'use client';

import { useState, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Rail, BrandMark, RailStatus } from '@/components/Rail';
import { Footer } from '@/components/Footer';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/context/AuthContext';

export function ShellClient({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { modalOpen } = useAuth();
  const isApp = pathname.startsWith('/participante');

  return (
    <div className="shell">
      {/* Mobile topbar */}
      <div className="topbar">
        <div className="rail__logo"><span>buidlers</span><b>_</b></div>
        <button className="burger" onClick={() => setMenuOpen(true)} aria-label="menú">≡</button>
      </div>

      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}

      <aside className={'rail' + (menuOpen ? ' open' : '')}>
        <BrandMark />
        <Rail onClose={() => setMenuOpen(false)} />
        <div className="rail__spacer" />
        <div className="rail__foot">
          <AccessButton />
          <RailStatus />
        </div>
      </aside>

      <main className="main">
        <div className="view">{children}</div>
        {!isApp && <Footer />}
      </main>

      {modalOpen && <AuthModal />}
    </div>
  );
}

function AccessButton() {
  const router = useRouter();
  const { user, openModal } = useAuth();
  const handleClick = () => {
    if (user) router.push('/participante');
    else openModal();
  };
  return (
    <button className="rail__access" onClick={handleClick}>
      <span>{user ? './mi_panel' : './acceder'}</span>
      <span style={{ color: 'var(--yellow)' }}>↗</span>
    </button>
  );
}
