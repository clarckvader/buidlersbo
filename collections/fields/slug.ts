import type { Field } from 'payload'
import { slugify } from '../../lib/slugify'

// Slug editable; si se deja vacío se genera desde `from`.
export function slugField(from: string): Field {
  return {
    name: 'slug',
    type: 'text',
    label: 'Slug',
    required: true,
    unique: true,
    index: true,
    admin: { position: 'sidebar', description: `Se genera desde "${from}" si lo dejas vacío.` },
    hooks: {
      beforeValidate: [
        ({ value, data }) => {
          if (typeof value === 'string' && value.trim()) return slugify(value)
          const source = data?.[from]
          return typeof source === 'string' ? slugify(source) : value
        },
      ],
    },
  }
}
