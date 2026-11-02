# Proyectos, equipos por invitación y roles — diseño

## Intención

Hoy el sitio muestra equipos, proyectos, eventos y un panel de participante con datos inventados. El objetivo es que todo salga de datos reales:

- Cualquier miembro puede **crear un proyecto público** y **armar su equipo invitando gente**, en vez de "armar un equipo" eligiendo a quien quiera.
- Los miembros se **inscriben a eventos** y el cupo refleja inscripciones reales.
- Algunos miembros (**admin / organizador**) entran a `/admin` con su mismo login de Pollar para crear eventos, curar proyectos, etc.
- Quien recién llega ve estados vacíos honestos, no contenido de ejemplo.

## Objetivos

1. Roles en miembros y acceso al panel con el login de Pollar.
2. Proyectos creados por miembros, con página pública y equipo formado por invitación.
3. Inscripción a eventos.
4. `/participante` con datos reales del miembro.
5. Producción limpia de contenido de prueba.

## No objetivos (por ahora)

- Envío de emails (invitaciones ni notificaciones).
- Perfiles públicos de miembros (`/@usuario`).
- Funciones de hackathon: cronograma, entregas, ranking en vivo, cuenta regresiva.
- Transferir la propiedad de un proyecto o tener varios dueños.
- Moderación o aprobación previa de proyectos antes de publicarse.

## Anti-objetivos

- Que un miembro pueda agregar a otra persona a un proyecto sin que esa persona acepte (por invitación personal o usando el enlace ella misma).
- Que un miembro sin rol pueda escribir directamente en las colecciones de Payload por la API REST.
- Dos pantallas de login (una para el sitio y otra para `/admin`).

## Decisiones tomadas con Roberto

- Roles: **admin** (todo, incluido asignar roles), **organizador** (eventos, proyectos, blog, media, `site`; no toca roles ni miembros), **miembro** (sin panel).
- Todo lo de prueba en producción se borra (eventos, equipos, proyectos). Se conservan los valores/stats del inicio y los miembros.
- El **proyecto reemplaza al equipo**: se elimina la colección `teams`; el equipo de un proyecto son sus integrantes. `/equipo` pasa a ser el directorio público de proyectos y su gente. El **Ranking** muestra los proyectos que los organizadores marcan como destacados.
- **Enlace de invitación**: quien lo abre se une directo al iniciar sesión. El dueño puede regenerarlo (el anterior deja de servir) y quitar integrantes.
- **Invitar por @usuario o correo**: se guarda la invitación; no se envían emails. Si el correo ya es de un miembro, la ve en su panel; si no, la ve cuando se registre con ese correo.
- Un miembro puede estar en **varios proyectos**.

## Modelo de datos

### `members` (cambia)
- `role`: `admin` | `organizer` | `member` (por defecto `member`). Solo un admin puede cambiarlo.
- Pasa a ser la colección de usuarios del panel (`admin.user`), autenticada con la cookie de miembro existente (estrategia propia, sin contraseña). Se elimina la colección `users`.
- Primer admin: variable `ADMIN_EMAILS` (lista separada por comas). Al iniciar sesión, un miembro cuyo email está en la lista queda como `admin`.

### `projects` (se rehace)
Campos del miembro: `name`, `slug`, `tagline`, `description`, `category`, `city`, `status` (`idea` | `construyendo` | `lanzado`), `stack` (lista), `lookingFor` (roles que buscan, lista), `links` (repo, demo, web), `owner` (miembro).
Campos solo para organizadores: `featured`, `rank`, `metric`, `metricLabel`, `delta`, `funding`, `year` (lo que hoy muestra el Ranking).
Interno: `inviteToken` (aleatorio, regenerable, nunca visible al público).

### `project-members` (nueva)
`project`, `member`, `role` (`owner` | `member`), `title` (qué hace en el proyecto, opcional), `joinedAt`. Único por (proyecto, miembro).

### `project-invites` (nueva)
`project`, `invitedBy`, `member` (si se invitó por @usuario o el correo ya existía) o `email`, `status` (`pending` | `accepted` | `declined` | `revoked`).

### `event-registrations` (nueva)
`event`, `member`, `createdAt`. Único por (evento, miembro). El campo `taken` de `events` se elimina: el cupo ocupado se cuenta.

### `teams` (se elimina)

## Acceso

- Las colecciones son de **lectura pública** donde corresponde (eventos, proyectos sin `inviteToken`, integrantes de proyectos), y de **escritura solo para staff** por la API de Payload.
- Todo lo que hace un miembro desde el sitio pasa por **endpoints propios** que verifican la sesión y los permisos: crear o editar su proyecto, invitar, unirse, salir, aceptar o rechazar invitaciones, inscribirse o cancelar.
- Admin: todo. Organizador: todo menos `members` (no cambia roles) y lo interno de invitaciones.
- `/admin/login` y `/admin/logout` redirigen al login y logout del sitio.

## Pantallas y flujos

- **`/proyectos/nuevo`** (con sesión): formulario corto → crea el proyecto y al creador como `owner` → lleva a la página del proyecto.
- **`/proyectos/[slug]`** (pública): información, equipo (avatar, nombre, @usuario, rol en el proyecto) y qué roles buscan.
  - **Dueño**: editar; panel "invitar" con enlace (copiar, regenerar), invitar por @usuario o correo, invitaciones pendientes (revocar) y quitar integrantes.
  - **Integrante**: salir del proyecto. El dueño no puede salir; puede borrar el proyecto.
- **`/unirse/[token]`**: sin sesión, pide iniciar sesión y luego vuelve; con sesión, "Unirte a *proyecto*" → se une → página del proyecto. Si el token no es válido, muestra un mensaje claro.
- **`/equipo`**: directorio de proyectos con su equipo ("Quiénes construyen"), botón "crear proyecto" y estado vacío.
- **`/ranking`**: proyectos destacados por organizadores, ordenados por `rank`; estado vacío.
- **`/eventos`** y **`/eventos/[slug]`**: "registrarme" (pide login si hace falta) → "inscrito ✓" con opción de cancelar; cupo real; "lleno" cuando se completa.
- **`/participante`**: perfil (editar → `/bienvenida`), mis proyectos (+ crear), invitaciones pendientes (aceptar/rechazar), mis eventos. Cada bloque con estado vacío.
- Las invitaciones por correo se asocian al miembro cuando inicia sesión con ese correo (comparación sin distinguir mayúsculas).

## Datos de producción

Borrar `events`, `teams` y `projects` existentes (son de prueba). Conservar `site` y `members`. Las tablas nuevas se crean con migraciones.

## A criterio del implementador

- Detalles visuales, siguiendo el estilo actual (tarjetas, chips, mono, terminal).
- Formato exacto del token (aleatorio criptográfico, URL-safe).
- Cómo se muestra el enlace de invitación en la UI (botón copiar).
- Textos de los estados vacíos.
