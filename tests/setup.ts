// Los tests corren SIEMPRE contra la base local `buidlers_test` (docker-compose), nunca producción.
// Debe ejecutarse antes de importar payload.config, que lee estas variables al cargarse.
delete process.env.POSTGRES_CONNECTION_URL
process.env.DATABASE_URL = 'postgres://buidlers:buidlers@localhost:5432/buidlers_test'
process.env.PAYLOAD_SECRET = 'test-secret'
process.env.POLLAR_SECRET_KEY = 'test'
process.env.ADMIN_EMAILS = ''
