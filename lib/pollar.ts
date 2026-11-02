// Verificación server-side del access token que emite el SDK de Pollar.
// https://docs.pollar.xyz/docs/sdk-reference/server-api
const POLLAR_API = 'https://server.api.pollar.xyz/v3'

export type PollarIdentity = {
  userId: string
  email: string | null
  name: string | null
  avatar: string | null
  wallet: string | null
  authProvider: string | null
}

type VerifyContent = {
  userId: string
  wallet?: unknown
  profile?: Record<string, unknown> | null
  authProvider?: unknown
}

const str = (v: unknown) => (typeof v === 'string' && v ? v : null)

// La doc no fija la forma de `wallet`/`profile`; aceptamos string u objeto.
function walletAddress(wallet: unknown): string | null {
  if (typeof wallet === 'string') return wallet || null
  if (wallet && typeof wallet === 'object') {
    const w = wallet as Record<string, unknown>
    return str(w.address) ?? str(w.publicKey) ?? str(w.public_key)
  }
  return null
}

export async function verifyPollarToken(token: string): Promise<PollarIdentity | null> {
  const secret = process.env.POLLAR_SECRET_KEY
  if (!secret) throw new Error('POLLAR_SECRET_KEY no está configurada')

  const res = await fetch(`${POLLAR_API}/tokens/verify`, {
    method: 'POST',
    headers: { 'x-pollar-api-key': secret, 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    cache: 'no-store',
  })
  const body = (await res.json().catch(() => null)) as { success?: boolean; content?: VerifyContent } | null
  if (!res.ok || !body?.success || !body.content?.userId) return null

  const { userId, wallet, profile, authProvider } = body.content
  // Pollar guarda el nombre separado (first_name / last_name), a veces con espacios de sobra.
  const fullName = [profile?.first_name, profile?.last_name]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' ')
  return {
    userId,
    email: str(profile?.email) ?? str(profile?.mail),
    name: str(profile?.name) ?? (fullName || null),
    avatar: str(profile?.avatar),
    wallet: walletAddress(wallet),
    authProvider: str(authProvider) ?? str((authProvider as Record<string, unknown> | null)?.type),
  }
}
