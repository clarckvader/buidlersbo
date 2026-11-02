import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_members_roles" AS ENUM('Desarrollo', 'Diseño', 'Producto', 'Comunidad', 'Investigación', 'Negocios', 'Estudiante');
  CREATE TYPE "public"."enum_members_interests" AS ENUM('DeFi', 'Pagos', 'Identidad', 'ZK', 'DAOs', 'Infraestructura', 'RWA', 'NFTs & cultura', 'Educación', 'IA');
  CREATE TABLE "members_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_members_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "members_interests" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_members_interests",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"pollar_user_id" varchar NOT NULL,
  	"username" varchar,
  	"name" varchar,
  	"email" varchar,
  	"avatar" varchar,
  	"wallet" varchar,
  	"auth_provider" varchar,
  	"last_login_at" timestamp(3) with time zone,
  	"building" varchar,
  	"onboarded_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "members_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "members_id" integer;
  ALTER TABLE "members_roles" ADD CONSTRAINT "members_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "members_interests" ADD CONSTRAINT "members_interests_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "members_texts" ADD CONSTRAINT "members_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "members_roles_order_idx" ON "members_roles" USING btree ("order");
  CREATE INDEX "members_roles_parent_idx" ON "members_roles" USING btree ("parent_id");
  CREATE INDEX "members_interests_order_idx" ON "members_interests" USING btree ("order");
  CREATE INDEX "members_interests_parent_idx" ON "members_interests" USING btree ("parent_id");
  CREATE UNIQUE INDEX "members_pollar_user_id_idx" ON "members" USING btree ("pollar_user_id");
  CREATE UNIQUE INDEX "members_username_idx" ON "members" USING btree ("username");
  CREATE INDEX "members_updated_at_idx" ON "members" USING btree ("updated_at");
  CREATE INDEX "members_created_at_idx" ON "members" USING btree ("created_at");
  CREATE INDEX "members_texts_order_parent" ON "members_texts" USING btree ("order","parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_members_id_idx" ON "payload_locked_documents_rels" USING btree ("members_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "members_roles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "members_interests" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "members_texts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "members_roles" CASCADE;
  DROP TABLE "members_interests" CASCADE;
  DROP TABLE "members" CASCADE;
  DROP TABLE "members_texts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_members_fk";
  
  DROP INDEX "payload_locked_documents_rels_members_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "members_id";
  DROP TYPE "public"."enum_members_roles";
  DROP TYPE "public"."enum_members_interests";`)
}
