import { Providers } from '@/components/Providers'
import { ShellClient } from '@/components/ShellClient'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <ShellClient>{children}</ShellClient>
    </Providers>
  )
}
