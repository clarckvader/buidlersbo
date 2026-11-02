import type { CollectionConfig } from 'payload'
import { staffWrite } from './access'
import { slugField } from './fields/slug'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Post', plural: 'Blog' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'cat', 'date', 'feat'] },
  access: { read: () => true, ...staffWrite },
  defaultSort: '-date',
  fields: [
    { name: 'title', type: 'text', label: 'Título', required: true },
    slugField('title'),
    { name: 'author', type: 'text', label: 'Autor' },
    { name: 'date', type: 'date', label: 'Fecha', admin: { date: { pickerAppearance: 'dayOnly' } } },
    {
      name: 'cat',
      type: 'select',
      label: 'Categoría',
      required: true,
      defaultValue: 'Comunidad',
      options: ['Manifiesto', 'Técnico', 'Ecosistema', 'Comunidad', 'Tutorial'],
    },
    { name: 'read', type: 'text', label: 'Tiempo de lectura', defaultValue: '5 min' },
    { name: 'excerpt', type: 'textarea', label: 'Extracto' },
    { name: 'feat', type: 'checkbox', label: 'Destacado', defaultValue: false },
    { name: 'content', type: 'richText', label: 'Contenido' },
  ],
}
