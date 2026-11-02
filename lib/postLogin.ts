// A dónde mandar al miembro según su sesión. `consumeLogin`: el login nuevo ya se atendió
// (si no, guardar el @usuario en la bienvenida dispararía la redirección post-login y la cortaría).
export function postLoginRoute({ hasUsername, justLoggedIn, pathname, next }: {
  hasUsername: boolean;
  justLoggedIn: boolean;
  pathname: string;
  next?: string | null;
}): { to: string | null; consumeLogin: boolean } {
  if (!hasUsername) {
    return { to: pathname === '/bienvenida' ? null : '/bienvenida', consumeLogin: justLoggedIn };
  }
  if (justLoggedIn) return { to: next ?? '/participante', consumeLogin: true };
  return { to: null, consumeLogin: false };
}
