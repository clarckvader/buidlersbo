'use client';

import { useEffect } from 'react';
import { usePollar } from '@pollar/react';
import { useAuth } from '@/context/AuthContext';

export function AuthModal() {
  const { closeModal } = useAuth();
  const { login, openLoginModal } = usePollar();

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [closeModal]);

  const handleSocial = (provider: 'google' | 'github') => {
    closeModal();
    login({ provider });
  };

  const handleWallet = () => {
    closeModal();
    openLoginModal();
  };

  return (
    <div className="modal-scrim" onClick={closeModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__bar">
          <span className="dots"><i /><i /><i /></span>
          <span className="t mono">auth — ./acceder</span>
          <button className="x" onClick={closeModal}>×</button>
        </div>
        <div className="modal__body">
          <div className="pre mono"><span className="y">$</span> sudo join buidlers</div>
          <h3>Entra al nodo</h3>
          <p className="sub">Accede al área de participantes: tu equipo, tu proyecto y la hackathon en vivo.</p>
          <div className="social">
            <button className="social-btn" onClick={() => handleSocial('github')}>
              <span className="ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
                </svg>
              </span>
              continuar con GitHub <span className="arr">↗</span>
            </button>
            <button className="social-btn" onClick={() => handleSocial('google')}>
              <span className="ic">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 2.9 14.7 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.4 12 20.4c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1-.2-1.5H12z" />
                </svg>
              </span>
              continuar con Google <span className="arr">↗</span>
            </button>
            <div className="modal__divider mono">o conecta tu wallet</div>
            <button className="social-btn" onClick={handleWallet}>
              <span className="ic" style={{ color: 'var(--yellow)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H18a2 2 0 0 1 2 2v.5h-2V6H5.5a.5.5 0 0 0 0 1H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 17.5v-11zM16.5 12a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
                </svg>
              </span>
              MetaMask / WalletConnect <span className="arr">↗</span>
            </button>
          </div>
          <div className="modal__foot mono">
            # no custodiamos llaves · self-sovereign by default<br />
            al continuar aceptas el código de conducta de la comunidad
          </div>
        </div>
      </div>
    </div>
  );
}
