import type { Access } from 'payload'

// Solo los admins del panel (colección `users`) pueden escribir contenido.
// Sin esto, Payload deja escribir a cualquier usuario autenticado de cualquier colección auth.
export const isAdmin: Access = ({ req: { user } }) => user?.collection === 'users'

export const adminWrite = { create: isAdmin, update: isAdmin, delete: isAdmin }
