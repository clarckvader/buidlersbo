# Proyectos, equipos por invitación y roles — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar los datos de prueba por datos reales: proyectos creados por miembros con equipo por invitación, inscripción a eventos, panel de participante real y roles admin/organizador que entran a `/admin` con el login de Pollar.

**Architecture:** Payload 3 (Postgres) dentro de Next 16. La lógica de negocio vive en servicios puros sobre la Local API (`lib/services/*.ts`) que reciben `payload` y el miembro de la sesión; los endpoints de colección son envoltorios finos que leen la cookie de miembro. `members` pasa a ser la colección de usuarios del panel, autenticada con la cookie existente.

**Tech Stack:** Next 16.3, React 19.2, Payload 3.92 (`@payloadcms/db-postgres`), Pollar SDK 0.12, Vitest (nuevo) contra Postgres local de docker-compose.

**Spec:** `docs/superpowers/specs/2026-11-02-proyectos-roles-design.md`

## Global Constraints

- Roles exactos: `admin`, `organizer`, `member` (por defecto `member`). Etiquetas: "Admin", "Organizador", "Miembro".
- `status` de proyecto: `idea`, `construyendo`, `lanzado`.
- `status` de invitación: `pending`, `accepted`, `declined`, `revoked`.
- `role` en `project-members`: `owner`, `member`.
- Primer admin por `ADMIN_EMAILS` (separados por comas, comparación sin mayúsculas).
- No se envían emails.
- Un miembro puede estar en varios proyectos; único por (proyecto, miembro) y por (evento, miembro).
- El dueño no puede salir de su proyecto; puede borrarlo.
- `inviteToken` nunca sale en respuestas públicas ni en el HTML para quien no es dueño.
- Escritura por la API REST de Payload solo para staff (`admin` | `organizer`); `members` solo `admin`.
- Producción (`POSTGRES_CONNECTION_URL`) solo cambia por migraciones. Los tests **nunca** usan esa URL.
- Textos de UI en español, estilo actual (mono, tarjetas, chips).

## Review Focus

1. **Enlace regenerado**: el token anterior debe dejar de servir (→ test `joinByToken rechaza token viejo`, Task 3).
2. **Correo con mayúsculas/espacios** al invitar y al asociar al registrarse (`Ana@X.com ` = `ana@x.com`) (→ test en Task 3).
3. **Unirse dos veces** (enlace abierto otra vez, o invitación aceptada siendo ya integrante): idempotente, sin duplicar ni error (→ test en Task 3).
4. **Evento lleno** (inscritos = cupo): rechazar inscripción nueva; cancelar libera cupo (→ test en Task 4).
5. **Abrir `/unirse/[token]` sin sesión**: tras iniciar sesión vuelve al enlace y se une (→ verificación manual en Task 6; el `next` guardado se prueba en Task 2).

---

## File Structure

- `vitest.config.mts`, `tests/setup.ts`, `tests/helpers.ts` — harness de tests contra DB local `buidlers_test`.
- `collections/access.ts` — `isAdmin`, `isStaff`, `staffWrite`.
- `collections/Members.ts` — rol, auth por cookie, bootstrap `ADMIN_EMAILS`.
- `collections/Projects.ts`, `collections/ProjectMembers.ts`, `collections/ProjectInvites.ts`, `collections/EventRegistrations.ts` — modelo nuevo; endpoints finos.
- `collections/Events.ts` — sin `taken`. `collections/Teams.ts`, `collections/Users.ts` — se eliminan.
- `lib/services/projects.ts`, `lib/services/events.ts` — reglas de negocio (testeadas).
- `lib/session.ts` — helper de endpoint: `requireMember(req)`.
- `lib/content.ts`, `lib/types.ts` — lectura para páginas.
- `proxy.ts` — redirecciones de `/admin/login` y `/admin/logout`.
- UI: `app/(site)/proyectos/nuevo`, `app/(site)/proyectos/[slug]`, `app/(site)/unirse/[token]`, `app/(site)/acceder`, `app/(site)/salir`, `components/projects/*`, `components/events/RegisterButton.tsx`, `components/participant/ParticipantApp.tsx`, `components/team/Equipo.tsx`, `components/ranking/Ranking.tsx`.
- `scripts/cleanup-demo-content.ts` — limpieza de producción.

---

### Task 1: Harness de tests

**Files:**
- Create: `vitest.config.mts`, `tests/setup.ts`, `tests/helpers.ts`, `tests/harness.test.ts`
- Modify: `package.json` (scripts `test`, devDeps `vitest`, `vite-tsconfig-paths`)

**Interfaces:**
- Produces: `getTestPayload(): Promise<Payload>`; `createMember(payload, data?: Partial<Member>): Promise<Member>` (genera `pollarUserId` único); `resetDb(payload): Promise<void>` (borra docs de todas las colecciones de miembros/proyectos/eventos/inscripciones).

- [ ] **Step 1:** `tests/setup.ts` fija `process.env.DATABASE_URL = 'postgres://buidlers:buidlers@localhost:5432/buidlers_test'`, **borra** `process.env.POSTGRES_CONNECTION_URL`, y define `PAYLOAD_SECRET='test-secret'`, `POLLAR_SECRET_KEY='test'`. Crear la DB: `docker compose exec -T postgres psql -U buidlers -c "create database buidlers_test"` (ignorar si existe).
- [ ] **Step 2:** Test `harness.test.ts`: `createMember` devuelve un doc con `id`, y `payload.db` apunta a `buidlers_test` (assert `payload.db.pool.options.connectionString` contiene `buidlers_test`).
- [ ] **Step 3:** `npm test` → FAIL (no hay vitest). Instalar, configurar `vitest.config.mts` (`setupFiles`, `vite-tsconfig-paths`, `fileParallelism: false`, `testTimeout: 30000`).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `test: vitest harness against local test database`.

### Task 2: Roles y panel con login de Pollar

**Files:**
- Modify: `collections/access.ts`, `collections/Members.ts`, `payload.config.ts` (`admin.user: 'members'`, quitar `Users`), todas las colecciones con `adminWrite` → `staffWrite`, `globals/Site.ts` (`update: isStaff`)
- Delete: `collections/Users.ts`
- Create: `lib/session.ts`, `proxy.ts`, `app/(site)/acceder/page.tsx`, `app/(site)/salir/page.tsx`, `tests/roles.test.ts`
- Modify: `context/AuthContext.tsx` (redirigir a `next` guardado tras login)

**Interfaces:**
- Produces: `isAdmin: Access` (`user.role === 'admin'`), `isStaff: Access` (`admin|organizer`), `staffWrite = { create, update, delete: isStaff }` en `collections/access.ts`.
- Produces: `requireMember(req: PayloadRequest): Promise<Member | Response>` en `lib/session.ts` (401 `{error:'Sin sesión'}` si no hay).
- Produces: `rememberNext(path: string)` / `takeNext(): string | null` (sessionStorage `buidlers:next`) exportados desde `context/AuthContext.tsx`.
- `members`: `auth: { disableLocalStrategy: true, strategies: [pollar-session] }` (reusar `getSessionMember`), `access.admin: isStaff`, `read: isStaff` (los organizadores ven nombres en relaciones), `create/update/delete: isAdmin`, `role` select con `access.update: isAdmin` a nivel campo. En `POST /session`, si `email` ∈ `ADMIN_EMAILS` → `role = 'admin'` (nunca baja un rol existente).
- `proxy.ts`: `/admin/login` → `/acceder?next=/admin`; `/admin/logout` → `/salir`. `/acceder` abre el modal (o redirige a `next` si ya hay sesión); `/salir` llama `logout()` y va a `/`.

- [ ] **Step 1: Tests** (`tests/roles.test.ts`): `isStaff` true para admin y organizer, false para member y anónimo; `isAdmin` solo admin; un `organizer` no puede cambiar `role` vía `payload.update({ overrideAccess: false, user })` (el campo queda igual); bootstrap: `applyAdminBootstrap({ email: ' Roberto@X.com ' }, 'roberto@x.com,otro@y.com')` → `'admin'`; con rol `organizer` y email fuera de la lista → mantiene `organizer`.
- [ ] **Step 2:** Correr → FAIL.
- [ ] **Step 3:** Implementar. `applyAdminBootstrap(member: {email?: string|null; role?: string|null}, list = process.env.ADMIN_EMAILS ?? ''): Role` en `collections/Members.ts` (exportada).
- [ ] **Step 4:** Correr → PASS. `npm run generate:types && npm run generate:importmap && npx tsc --noEmit` sin errores.
- [ ] **Step 5:** Manual (dev contra DB local): con cookie de miembro `member`, `/admin` → página "unauthorized" con logout que lleva a `/salir`; sin cookie, `/admin` → `/acceder?next=/admin`; miembro con `role=admin` ve el panel.
- [ ] **Step 6:** Commit `feat: member roles and Pollar login for the admin panel`.

### Task 3: Proyectos e invitaciones (modelo + servicio)

**Files:**
- Rewrite: `collections/Projects.ts`
- Create: `collections/ProjectMembers.ts`, `collections/ProjectInvites.ts`, `lib/services/projects.ts`, `tests/projects.test.ts`
- Delete: `collections/Teams.ts` (y quitarla de `payload.config.ts`)

**Interfaces:**
- Campos de `projects` exactamente como el spec; `featured`, `rank`, `metric`, `metricLabel`, `delta`, `funding`, `year` con `access.update: isStaff`; `inviteToken` con `access.read: () => false` (solo legible con `overrideAccess`), `admin.hidden: true`. `slug` con `slugField('name')`; si choca, el servicio agrega sufijo `-2`, `-3`…
- `project-members`: `indexes: [{ fields: ['project','member'], unique: true }]`. `project-invites`: `member` (rel, opcional), `email` (opcional, guardado en minúsculas), `invitedBy`, `status`.
- Lectura pública: `projects` y `project-members` `read: () => true`; `project-invites` `read: isStaff`.
- Produces en `lib/services/projects.ts` (todas reciben `payload: Payload` primero; lanzan `ServiceError(status: number, message: string)` exportado del mismo archivo):
  - `createProject(payload, owner: Member, data: ProjectInput): Promise<Project>` — crea proyecto + `project-members` owner + `inviteToken`.
  - `updateProject(payload, actor: Member, projectId, data: Partial<ProjectInput>): Promise<Project>` — solo dueño.
  - `deleteProject(payload, actor, projectId): Promise<void>` — solo dueño; borra integrantes e invitaciones.
  - `regenerateInviteToken(payload, actor, projectId): Promise<string>` — solo dueño.
  - `getInviteToken(payload, actor, projectId): Promise<string>` — solo dueño.
  - `joinByToken(payload, member, token: string): Promise<Project>` — idempotente.
  - `inviteMember(payload, actor, projectId, identifier: string): Promise<ProjectInvite>` — `identifier` es `@usuario`, `usuario` o email; si es integrante ya → 409; si hay invitación `pending` igual → devuelve la existente.
  - `respondToInvite(payload, member, inviteId, accept: boolean): Promise<void>` — solo el invitado; aceptar crea integrante (idempotente).
  - `revokeInvite(payload, actor, inviteId)`, `removeMember(payload, actor, projectId, memberId)` (dueño; no puede quitarse a sí mismo), `leaveProject(payload, member, projectId)` (no el dueño → 400).
  - `claimEmailInvites(payload, member: Member): Promise<number>` — asocia invitaciones `pending` cuyo `email` = email del miembro (normalizado).
  - `type ProjectInput = { name: string; tagline?: string; description?: string; category?: string; city?: string; status?: 'idea'|'construyendo'|'lanzado'; stack?: string[]; lookingFor?: string[]; links?: string[] }` — se sanea igual que el perfil (`LIMITS` de `lib/profile.ts`; agregar `LIMITS.description = 2000`).

- [ ] **Step 1: Tests** (`tests/projects.test.ts`), cada uno con `resetDb` en `beforeEach`:
  - `createProject crea owner y token`: el creador figura con `role: 'owner'`; `getInviteToken` devuelve string de ≥ 32 chars.
  - `slug único`: dos proyectos "Pacha ID" → slugs `pacha-id` y `pacha-id-2`.
  - `solo el dueño edita`: `updateProject` por otro miembro → `ServiceError` 403.
  - `joinByToken une e idempotente`: dos llamadas → un solo `project-members` del miembro.
  - `joinByToken rechaza token viejo`: tras `regenerateInviteToken`, el anterior → 404.
  - `inviteMember por @usuario y por email`: `@ana` crea invitación con `member`; `Ana@X.com ` (miembro inexistente) crea invitación con `email: 'ana@x.com'`.
  - `claimEmailInvites`: miembro nuevo con `email: 'ANA@x.com'` → asocia 1 invitación y `respondToInvite(accept)` lo une.
  - `invitar a un integrante` → 409; `respondToInvite` por otro miembro → 403.
  - `dueño no puede salir` → 400; `removeMember` del dueño a sí mismo → 400.
  - `deleteProject` borra integrantes e invitaciones.
  - `inviteToken no es público`: `payload.find({ collection: 'projects', overrideAccess: false })` no incluye `inviteToken`.
- [ ] **Step 2:** Correr → FAIL.
- [ ] **Step 3:** Implementar colecciones y servicio. Token: `crypto.randomBytes(24).toString('base64url')`.
- [ ] **Step 4:** Correr → PASS; types/importmap/tsc limpios.
- [ ] **Step 5:** Commit `feat: member projects with invite-based teams`.

### Task 4: Inscripción a eventos

**Files:**
- Create: `collections/EventRegistrations.ts`, `lib/services/events.ts`, `tests/events.test.ts`
- Modify: `collections/Events.ts` (quitar `taken`), `scripts/migrate-content.ts` (no escribir `taken`)

**Interfaces:**
- `event-registrations`: `event` (rel), `member` (rel), `indexes` único (event, member), `read: isStaff`.
- Produces en `lib/services/events.ts`: `registerForEvent(payload, member, eventId): Promise<void>` (idempotente; si `count >= cap` → `ServiceError` 409 "evento lleno"); `cancelRegistration(payload, member, eventId): Promise<void>`; `countRegistrations(payload, eventIds: (number|string)[]): Promise<Map<string, number>>`; `memberEventIds(payload, memberId): Promise<Set<string>>`.

- [ ] **Step 1: Tests:** inscribir dos veces → count 1; con `cap: 1` y otro inscrito → 409; cancelar libera cupo y permite a otro; `countRegistrations` devuelve 0 para evento sin inscritos.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS + tsc.
- [ ] **Step 5:** Commit `feat: event registrations with real capacity`.

### Task 5: Endpoints de miembro

**Files:**
- Modify: `collections/Projects.ts`, `collections/ProjectInvites.ts`, `collections/EventRegistrations.ts`, `collections/Members.ts` (llamar `claimEmailInvites` en `POST /session`)
- Create: `tests/endpoints.test.ts`

**Interfaces:** endpoints envuelven los servicios con `requireMember`; `ServiceError` → `Response.json({ error }, { status })`.
- `POST /api/projects/create` `{...ProjectInput}` → `{ project }`
- `PATCH /api/projects/:id/edit`, `DELETE /api/projects/:id/remove`
- `GET /api/projects/:id/invite-link` → `{ token }`; `POST /api/projects/:id/invite-link` (regenera) → `{ token }`
- `POST /api/projects/:id/invite` `{ identifier }` → `{ invite }`
- `POST /api/projects/:id/leave`; `DELETE /api/projects/:id/members/:memberId`
- `POST /api/projects/join` `{ token }` → `{ project }`
- `POST /api/project-invites/:id/respond` `{ accept: boolean }`; `DELETE /api/project-invites/:id`
- `GET /api/project-invites/mine` → `{ invites }` (pendientes del miembro, con proyecto poblado)
- `POST /api/event-registrations/:eventId` y `DELETE /api/event-registrations/:eventId`

- [ ] **Step 1: Tests** llamando al `handler` del endpoint con un `PayloadRequest` armado (`createLocalReq` + header `cookie` firmado con `signMemberSession`): sin cookie → 401; `create` → 200 con proyecto; `invite-link` por no-dueño → 403; `mine` devuelve solo las del miembro.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS + tsc.
- [ ] **Step 5:** Commit `feat: member endpoints for projects, invites and registrations`.

### Task 6: Pantallas de proyectos

**Files:**
- Create: `app/(site)/proyectos/nuevo/page.tsx`, `app/(site)/proyectos/[slug]/page.tsx`, `app/(site)/unirse/[token]/page.tsx`, `components/projects/ProjectForm.tsx`, `components/projects/ProjectView.tsx`, `components/projects/OwnerPanel.tsx`, `components/projects/JoinProject.tsx`
- Modify: `lib/content.ts`, `lib/types.ts`, `components/team/Equipo.tsx`, `app/(site)/equipo/page.tsx`, `components/ranking/Ranking.tsx`, `app/(site)/ranking/page.tsx`
- Delete: `app/(site)/equipo/[slug]/page.tsx`

**Interfaces:**
- Produces en `lib/content.ts`: `getProjectDirectory(): Promise<ProjectCard[]>`, `getFeaturedProjects(): Promise<Project[]>` (featured, por `rank`; mismo tipo `Project` de `lib/types.ts` que usa `Ranking`, con `builder` = nombre del dueño o `@usuario`), `getProjectPage(slug): Promise<ProjectPage | null>`; `getSessionMemberFromCookies(): Promise<Member | null>` (usa `headers()` de Next + `getSessionMember`).
- `ProjectCard = { slug, name, tagline, city, status, stack: string[], lookingFor: string[], team: TeamMember[] }`; `TeamMember = { username: string | null; name: string | null; avatar: string | null; role: 'owner'|'member'; title: string | null }`; `ProjectPage = ProjectCard & { id, description, category, links: string[], isOwner: boolean, isMember: boolean }`.
- `/proyectos/[slug]`: si `isOwner`, renderiza `OwnerPanel` (enlace con botón copiar = `${origin}/unirse/${token}`, regenerar, invitar por @usuario/email, pendientes con revocar, quitar integrantes, editar, borrar). Si `isMember` y no dueño: botón "salir".
- `/unirse/[token]`: sin sesión → `rememberNext('/unirse/'+token)` + abrir modal; con sesión → botón "Unirte" → `POST /api/projects/join` → `/proyectos/[slug]`; token inválido → mensaje "Este enlace ya no es válido".
- `/equipo`: directorio + botón "crear proyecto" (login si hace falta) + estado vacío. `/ranking`: destacados + estado vacío.

- [ ] **Step 1:** Implementar `lib/content.ts` + tipos; `npx tsc --noEmit` limpio.
- [ ] **Step 2:** Implementar pantallas.
- [ ] **Step 3: Verificación manual** (dev, DB local, dos miembros con cookies o dos navegadores): crear proyecto → aparece en `/equipo`; copiar enlace → abrir sin sesión → login → vuelve y se une; invitar por @usuario → aparece en el panel del invitado; regenerar → enlace viejo muestra "ya no es válido"; quitar integrante; borrar proyecto.
- [ ] **Step 4:** `npm run build` OK. Commit `feat: project pages, invite links and public directory`.

### Task 7: Eventos y panel de participante reales

**Files:**
- Create: `components/events/RegisterButton.tsx`
- Modify: `components/events/Eventos.tsx`, `app/(site)/eventos/[slug]/page.tsx`, `app/(site)/eventos/page.tsx`, `lib/content.ts` (`taken` = conteo real; `registered: boolean` para la sesión), `lib/types.ts` (`CoffeeEvent` + `id`, `registered`), `components/participant/ParticipantApp.tsx`, `app/(site)/participante/page.tsx`, `components/blog/Blog.tsx` (ya tiene vacío), `components/ShellClient.tsx` si hace falta.

**Interfaces:**
- `RegisterButton({ eventId, registered, full }: { eventId: number|string; registered: boolean; full: boolean })`: sin sesión abre el modal; con sesión llama los endpoints de Task 5 y hace `router.refresh()`.
- `/participante` es server component que carga, para el miembro de la cookie: perfil, proyectos (`project-members` del miembro), invitaciones pendientes, eventos inscritos; pasa a `ParticipantApp` (client). Sin sesión → mensaje + botón acceder. Se eliminan `PA_TEAM`, `PA_PHASES`, `PA_RANK`, `PA_RES`, countdown y "mi proyecto" de ejemplo.

- [ ] **Step 1:** Implementar. **Step 2:** tsc limpio.
- [ ] **Step 3: Manual:** inscribirse → "inscrito ✓" y contador +1; cancelar → −1; evento con `cap` lleno → "lleno"; `/participante` de un miembro nuevo muestra solo estados vacíos; aceptar invitación desde el panel.
- [ ] **Step 4:** Commit `feat: real event registration and participant panel`.

### Task 8: Migraciones y limpieza de producción

**Files:**
- Create: `scripts/cleanup-demo-content.ts`, migración nueva (`npm run payload -- migrate:create roles_projects`)
- Modify: `package.json` (script `cleanup:demo`), `.env.example` (`ADMIN_EMAILS=`)

- [ ] **Step 1:** Con `POSTGRES_CONNECTION_URL` vacío, generar la migración; revisar que crea `project_members`, `project_invites`, `event_registrations`, columna `role`, y elimina `teams`/`users`.
- [ ] **Step 2:** `cleanup-demo-content.ts` borra todos los `events` y `projects` (idempotente; imprime conteos). Probar contra DB local.
- [ ] **Step 3:** **Pedir confirmación a Roberto** y luego, contra producción: `npm run payload -- migrate`, `npm run cleanup:demo`. Verificar conteos: `events=0`, `projects=0`, `members=2`.
- [ ] **Step 4:** `npm test`, `npx tsc --noEmit`, `npm run build` OK. Commit `chore: migrations and demo content cleanup`.
