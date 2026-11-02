import pg from 'pg'

// Recrea `buidlers_test` vacía en cada corrida: con tablas viejas, la sincronización de esquema
// de Payload hace preguntas interactivas (renombrar/borrar columnas) y los tests se cuelgan.
export default async function setup() {
  const client = new pg.Client({ connectionString: 'postgres://buidlers:buidlers@localhost:5432/postgres' })
  await client.connect()
  await client.query('DROP DATABASE IF EXISTS buidlers_test WITH (FORCE)')
  await client.query('CREATE DATABASE buidlers_test')
  await client.end()
}
