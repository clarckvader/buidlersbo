import type { CollectionConfig } from 'payload'
import { adminWrite } from './access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Imagen', plural: 'Media' },
  access: { read: () => true, ...adminWrite },
  fields: [{ name: 'alt', type: 'text', label: 'Texto alternativo', required: true }],
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*'],
  },
}
