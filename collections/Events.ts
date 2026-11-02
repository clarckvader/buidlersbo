import type { CollectionConfig } from 'payload'
import { staffWrite } from './access'
import { slugField } from './fields/slug'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Evento', plural: 'Eventos' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'date', 'type', 'city'] },
  access: { read: () => true, ...staffWrite },
  defaultSort: 'date',
  fields: [
    { name: 'name', type: 'text', label: 'Nombre', required: true },
    slugField('name'),
    { name: 'date', type: 'date', label: 'Fecha', admin: { date: { pickerAppearance: 'dayOnly' } } },
    {
      name: 'type',
      type: 'select',
      label: 'Tipo',
      required: true,
      defaultValue: 'Meetup',
      options: ['Meetup', 'Hackathon', 'Taller', 'Conferencia'],
    },
    { name: 'city', type: 'text', label: 'Ciudad' },
    { name: 'place', type: 'text', label: 'Lugar' },
    { name: 'cap', type: 'number', label: 'Capacidad', defaultValue: 50, admin: { description: 'Los inscritos se cuentan solos.' } },
    { name: 'tag', type: 'text', label: 'Etiqueta' },
    { name: 'desc', type: 'textarea', label: 'Descripción' },
    { name: 'content', type: 'richText', label: 'Descripción larga' },
  ],
}
