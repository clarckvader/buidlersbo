'use client';

import { PollarClient, type PollarClientConfig } from '@pollar/core';
import { PollarProvider } from '@pollar/react';
import { AuthProvider } from '@/context/AuthContext';

const pollarConfig: PollarClientConfig = { apiKey: process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY! };

// Un solo PollarClient por pestaña: varias instancias rotan el refresh token por separado
// y Pollar termina cerrando todas las sesiones. globalThis sobrevive al Strict Mode y al HMR.
const g = globalThis as typeof globalThis & { __pollarClient?: PollarClient };
function getPollarClient(): PollarClient | PollarClientConfig {
  if (typeof window === 'undefined') return pollarConfig;
  return (g.__pollarClient ??= new PollarClient(pollarConfig));
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PollarProvider client={getPollarClient()}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </PollarProvider>
  );
}
