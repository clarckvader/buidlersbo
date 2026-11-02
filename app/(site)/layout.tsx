import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Providers } from '@/components/Providers'
import { ShellClient } from '@/components/ShellClient'
import '../globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-grotesk',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

// El contenido viene de Payload: se renderiza en cada request para reflejar cambios del admin.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'buidlers_ bolivia',
  description: 'comunidad de constructores web3 de Bolivia. construimos en público, desde los Andes.',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>
          <ShellClient>{children}</ShellClient>
        </Providers>
      </body>
    </html>
  )
}
