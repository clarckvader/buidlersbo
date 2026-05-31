'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NAV } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

export function Footer() {
  const router = useRouter();
  const { user, openModal } = useAuth();

  const openAccess = () => {
    if (user) router.push('/participante');
    else openModal();
  };

  return (
    <footer className="foot">
      <div className="foot__brand">
        <div className="rail__logo" style={{ fontSize: 30 }}>
          <span>buidlers</span><b>_</b>
        </div>
        <p>// comunidad de constructores web3 de Bolivia. construimos en público, desde los Andes.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-primary" onClick={openAccess}>./join_buidlers</button>
        </div>
      </div>
      <div className="foot__col">
        <h4>navegar</h4>
        {NAV.map((n) => (
          <Link key={n.id} href={n.id === 'inicio' ? '/' : `/${n.id}`}>
            {n.label}
          </Link>
        ))}
      </div>
      <div className="foot__col">
        <h4>comunidad</h4>
        <a href="#" onClick={(e) => e.preventDefault()}>Telegram</a>
        <a href="#" onClick={(e) => e.preventDefault()}>Discord</a>
        <a href="#" onClick={(e) => e.preventDefault()}>X / Twitter</a>
        <a href="#" onClick={(e) => e.preventDefault()}>GitHub</a>
      </div>
      <div className="foot__bottom">
        <span>© 2026 buidlers bolivia · built in public</span>
        <span>la paz · santa cruz · cochabamba · el alto · sucre · tarija</span>
      </div>
    </footer>
  );
}
