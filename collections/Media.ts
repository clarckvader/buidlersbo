import type { CollectionConfig } from 'payload'
import { staffWrite } from './access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Imagen', plural: 'Media' },
  access: { read: () => true, ...staffWrite },
  fields: [{ name: 'alt', type: 'text', label: 'Texto alternativo', required: true }],
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*'],
  },
}
