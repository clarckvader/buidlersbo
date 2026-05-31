# Buidlers Bolivia — contenido (CMS-ready)

Todo el contenido editable del sitio vive en esta carpeta como archivos JSON.
El sitio los carga al arrancar (`data.jsx` → `loadContent()`), así que **editar estos
archivos cambia el sitio sin tocar el código**.

## Archivos

| Archivo            | Qué controla                                   | Sección |
|--------------------|------------------------------------------------|---------|
| `site.json`        | Principios (`values`) y estadísticas (`stats`) | Inicio  |
| `projects.json`    | Proyectos que apoyamos (ranking)               | Ranking |
| `teams.json`       | Equipos activos                                | Equipo  |
| `events.json`      | Próximos eventos                               | Eventos |
| `posts.json`       | Artículos del blog                             | Blog    |
| `redes.json`       | Nodos del mapa + contorno de Bolivia           | Redes   |

## Conectar un headless CMS

El sitio consume estos JSON vía `fetch()`. Para administrarlos con un CMS hay dos caminos:

### 1. Generar los JSON desde el CMS (mínimo cambio)
Configura tu CMS (Sanity, Strapi, Directus, Contentful…) para exportar/publicar
a estos mismos archivos. El sitio no cambia.

### 2. Apuntar los `fetch` a la API del CMS (producción)
En `data.jsx`, reemplaza las rutas locales por los endpoints del CMS:

```js
getJSON("https://tu-cms.com/api/projects", [])   // en vez de "content/projects.json"
```

La forma (shape) de cada objeto debe coincidir con la de estos archivos.
Si un `fetch` falla, el sitio usa un fallback vacío y no se rompe.

## Notas de formato

- `redes.json`: coordenadas en `[lon, lat]`. `status` ∈ `hub` | `activo` | `naciente`.
  `labelSide` ∈ `left` | `right` (de qué lado del nodo va la etiqueta).
- `events.json`: `cap` = cupo total, `taken` = inscritos (la barra se calcula sola).
  `type` ∈ `Meetup` | `Hackathon` | `Taller` | `Conferencia` (define el color).
- `projects.json`: `rank` ordena las cards; los 3 primeros son destacados.
