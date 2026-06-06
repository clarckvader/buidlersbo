import { config, collection, singleton, fields } from '@keystatic/core'

export default config({
  storage: process.env.KEYSTATIC_CLOUD_PROJECT
    ? { kind: 'cloud' as const }
    : { kind: 'local' as const },

  cloud: {
    project: 'buidlers/buidlersbo',
  },

  ui: {
    brand: { name: 'buidlers_ bolivia' },
  },

  collections: {
    posts: collection({
      label: 'Blog',
      slugField: 'title',
      path: 'content/posts/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Título' } }),
        author: fields.text({ label: 'Autor' }),
        date: fields.date({ label: 'Fecha' }),
        cat: fields.select({
          label: 'Categoría',
          options: [
            { label: 'Manifiesto', value: 'Manifiesto' },
            { label: 'Técnico', value: 'Técnico' },
            { label: 'Ecosistema', value: 'Ecosistema' },
            { label: 'Comunidad', value: 'Comunidad' },
            { label: 'Tutorial', value: 'Tutorial' },
          ],
          defaultValue: 'Comunidad',
        }),
        read: fields.text({ label: 'Tiempo de lectura', defaultValue: '5 min' }),
        excerpt: fields.text({ label: 'Extracto', multiline: true }),
        feat: fields.checkbox({ label: 'Destacado', defaultValue: false }),
        content: fields.markdoc({
          label: 'Contenido',
          options: {
            image: {
              directory: 'public/images/posts',
              publicPath: '/images/posts/',
            },
          },
        }),
      },
    }),

    events: collection({
      label: 'Eventos',
      slugField: 'name',
      path: 'content/events/*',
      format: { contentField: 'content' },
      schema: {
        name: fields.slug({ name: { label: 'Nombre' } }),
        date: fields.date({ label: 'Fecha' }),
        type: fields.select({
          label: 'Tipo',
          options: [
            { label: 'Meetup', value: 'Meetup' },
            { label: 'Hackathon', value: 'Hackathon' },
            { label: 'Taller', value: 'Taller' },
            { label: 'Conferencia', value: 'Conferencia' },
          ],
          defaultValue: 'Meetup',
        }),
        city: fields.text({ label: 'Ciudad' }),
        place: fields.text({ label: 'Lugar' }),
        cap: fields.integer({ label: 'Capacidad', defaultValue: 50 }),
        taken: fields.integer({ label: 'Registrados', defaultValue: 0 }),
        tag: fields.text({ label: 'Etiqueta' }),
        desc: fields.text({ label: 'Descripción', multiline: true }),
        content: fields.markdoc({
          label: 'Descripción larga',
          options: {
            image: {
              directory: 'public/images/events',
              publicPath: '/images/events/',
            },
          },
        }),
      },
    }),

    teams: collection({
      label: 'Equipos',
      slugField: 'name',
      path: 'content/teams/*',
      schema: {
        name: fields.slug({ name: { label: 'Nombre' } }),
        focus: fields.text({ label: 'Enfoque' }),
        city: fields.text({ label: 'Ciudad' }),
        members: fields.integer({ label: 'Miembros', defaultValue: 1 }),
        open: fields.integer({ label: 'Posiciones abiertas', defaultValue: 0 }),
        stack: fields.array(fields.text({ label: 'Tech' }), {
          label: 'Stack',
          itemLabel: (props) => props.value || 'Tech',
        }),
        lead: fields.text({ label: 'Lead' }),
      },
    }),

    projects: collection({
      label: 'Proyectos',
      slugField: 'name',
      path: 'content/projects/*',
      schema: {
        name: fields.slug({ name: { label: 'Nombre' } }),
        rank: fields.integer({ label: 'Ranking', defaultValue: 1 }),
        cat: fields.text({ label: 'Categoría' }),
        builder: fields.text({ label: 'Equipo' }),
        loc: fields.text({ label: 'Ciudad' }),
        metric: fields.text({ label: 'Métrica' }),
        metricL: fields.text({ label: 'Label métrica' }),
        delta: fields.text({ label: 'Delta', defaultValue: '+0' }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value || 'Tag',
        }),
        blurb: fields.text({ label: 'Descripción', multiline: true }),
        funding: fields.text({ label: 'Funding' }),
        year: fields.text({ label: 'Año' }),
      },
    }),
  },

  singletons: {
    site: singleton({
      label: 'Sitio — valores y stats',
      path: 'content/site',
      schema: {
        values: fields.array(
          fields.object({
            k: fields.text({ label: 'Clave' }),
            v: fields.text({ label: 'Valor', multiline: true }),
          }),
          { label: 'Valores' }
        ),
        stats: fields.array(
          fields.object({
            n: fields.text({ label: 'Número' }),
            l: fields.text({ label: 'Label' }),
            src: fields.text({ label: 'Fuente' }),
          }),
          { label: 'Stats' }
        ),
      },
    }),
  },
})
