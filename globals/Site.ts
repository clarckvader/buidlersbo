import type { GlobalConfig } from 'payload'
import { isStaff } from '../collections/access'

export const Site: GlobalConfig = {
  slug: 'site',
  label: 'Sitio — valores y stats',
  access: { read: () => true, update: isStaff },
  fields: [
    {
      name: 'values',
      type: 'array',
      label: 'Valores',
      fields: [
        { name: 'k', type: 'text', label: 'Clave' },
        { name: 'v', type: 'textarea', label: 'Valor' },
      ],
    },
    {
      name: 'stats',
      type: 'array',
      label: 'Stats',
      fields: [
        { name: 'n', type: 'text', label: 'Número' },
        { name: 'l', type: 'text', label: 'Label' },
        { name: 'src', type: 'text', label: 'Fuente' },
      ],
    },
  ],
}
