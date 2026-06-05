'use client';

import { PollarProvider } from '@pollar/react';
import { AuthProvider } from '@/context/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PollarProvider client={{ apiKey: process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY! }}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </PollarProvider>
  );
}
