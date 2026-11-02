import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Los proyectos anteriores eran contenido de prueba (curado) y no tienen dueño: el nuevo
  // esquema exige `owner_id`, así que se borran antes de alterar la tabla.
  await db.execute(sql`
  DELETE FROM "payload_locked_documents_rels" WHERE "projects_id" IS NOT NULL;
  DELETE FROM "projects";
  `)
  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_status" AS ENUM('idea', 'construyendo', 'lanzado');
  CREATE TYPE "public"."enum_project_members_role" AS ENUM('owner', 'member');
  CREATE TYPE "public"."enum_project_invites_status" AS ENUM('pending', 'accepted', 'declined', 'revoked');
  CREATE TYPE "public"."enum_members_role" AS ENUM('admin', 'organizer', 'member');
  CREATE TABLE "event_registrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" integer NOT NULL,
  	"member_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "projects_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "project_members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"project_id" integer NOT NULL,
  	"member_id" integer NOT NULL,
  	"role" "enum_project_members_role" DEFAULT 'member' NOT NULL,
  	"title" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "project_invites" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"project_id" integer NOT NULL,
  	"invited_by_id" integer NOT NULL,
  	"member_id" integer,
  	"email" varchar,
  	"status" "enum_project_invites_status" DEFAULT 'pending' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "teams_stack" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "teams" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "users_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "teams_stack" CASCADE;
  DROP TABLE "teams" CASCADE;
  DROP TABLE "projects_tags" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_teams_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_users_fk";
  
  ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT IF EXISTS "payload_preferences_rels_users_fk";
  
  DROP INDEX "payload_locked_documents_rels_teams_id_idx";
  DROP INDEX "payload_locked_documents_rels_users_id_idx";
  DROP INDEX "payload_preferences_rels_users_id_idx";
  ALTER TABLE "projects" ALTER COLUMN "rank" DROP DEFAULT;
  ALTER TABLE "projects" ALTER COLUMN "delta" DROP DEFAULT;
  ALTER TABLE "projects" ADD COLUMN "tagline" varchar;
  ALTER TABLE "projects" ADD COLUMN "description" varchar;
  ALTER TABLE "projects" ADD COLUMN "category" varchar;
  ALTER TABLE "projects" ADD COLUMN "city" varchar;
  ALTER TABLE "projects" ADD COLUMN "status" "enum_projects_status" DEFAULT 'idea' NOT NULL;
  ALTER TABLE "projects" ADD COLUMN "owner_id" integer NOT NULL;
  ALTER TABLE "projects" ADD COLUMN "featured" boolean DEFAULT false;
  ALTER TABLE "projects" ADD COLUMN "metric_label" varchar;
  ALTER TABLE "projects" ADD COLUMN "invite_token" varchar;
  ALTER TABLE "members" ADD COLUMN "role" "enum_members_role" DEFAULT 'member' NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "event_registrations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "project_members_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "project_invites_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "members_id" integer;
  ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_texts" ADD CONSTRAINT "projects_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "project_members" ADD CONSTRAINT "project_members_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "project_invites" ADD CONSTRAINT "project_invites_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "project_invites" ADD CONSTRAINT "project_invites_invited_by_id_members_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "project_invites" ADD CONSTRAINT "project_invites_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "event_registrations_event_idx" ON "event_registrations" USING btree ("event_id");
  CREATE INDEX "event_registrations_member_idx" ON "event_registrations" USING btree ("member_id");
  CREATE INDEX "event_registrations_updated_at_idx" ON "event_registrations" USING btree ("updated_at");
  CREATE INDEX "event_registrations_created_at_idx" ON "event_registrations" USING btree ("created_at");
  CREATE UNIQUE INDEX "event_member_idx" ON "event_registrations" USING btree ("event_id","member_id");
  CREATE INDEX "projects_texts_order_parent" ON "projects_texts" USING btree ("order","parent_id");
  CREATE INDEX "project_members_project_idx" ON "project_members" USING btree ("project_id");
  CREATE INDEX "project_members_member_idx" ON "project_members" USING btree ("member_id");
  CREATE INDEX "project_members_updated_at_idx" ON "project_members" USING btree ("updated_at");
  CREATE INDEX "project_members_created_at_idx" ON "project_members" USING btree ("created_at");
  CREATE UNIQUE INDEX "project_member_idx" ON "project_members" USING btree ("project_id","member_id");
  CREATE INDEX "project_invites_project_idx" ON "project_invites" USING btree ("project_id");
  CREATE INDEX "project_invites_invited_by_idx" ON "project_invites" USING btree ("invited_by_id");
  CREATE INDEX "project_invites_member_idx" ON "project_invites" USING btree ("member_id");
  CREATE INDEX "project_invites_email_idx" ON "project_invites" USING btree ("email");
  CREATE INDEX "project_invites_updated_at_idx" ON "project_invites" USING btree ("updated_at");
  CREATE INDEX "project_invites_created_at_idx" ON "project_invites" USING btree ("created_at");
  ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_members_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_registrations_fk" FOREIGN KEY ("event_registrations_id") REFERENCES "public"."event_registrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_project_members_fk" FOREIGN KEY ("project_members_id") REFERENCES "public"."project_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_project_invites_fk" FOREIGN KEY ("project_invites_id") REFERENCES "public"."project_invites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_owner_idx" ON "projects" USING btree ("owner_id");
  CREATE INDEX "projects_invite_token_idx" ON "projects" USING btree ("invite_token");
  CREATE INDEX "payload_locked_documents_rels_event_registrations_id_idx" ON "payload_locked_documents_rels" USING btree ("event_registrations_id");
  CREATE INDEX "payload_locked_documents_rels_project_members_id_idx" ON "payload_locked_documents_rels" USING btree ("project_members_id");
  CREATE INDEX "payload_locked_documents_rels_project_invites_id_idx" ON "payload_locked_documents_rels" USING btree ("project_invites_id");
  CREATE INDEX "payload_preferences_rels_members_id_idx" ON "payload_preferences_rels" USING btree ("members_id");
  ALTER TABLE "events" DROP COLUMN "taken";
  ALTER TABLE "projects" DROP COLUMN "cat";
  ALTER TABLE "projects" DROP COLUMN "builder";
  ALTER TABLE "projects" DROP COLUMN "loc";
  ALTER TABLE "projects" DROP COLUMN "metric_l";
  ALTER TABLE "projects" DROP COLUMN "blurb";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "teams_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "users_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN "users_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "teams_stack" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "teams" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"focus" varchar,
  	"city" varchar,
  	"members" numeric DEFAULT 1,
  	"open" numeric DEFAULT 0,
  	"lead" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "projects_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  ALTER TABLE "event_registrations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "project_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "project_invites" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "event_registrations" CASCADE;
  DROP TABLE "projects_texts" CASCADE;
  DROP TABLE "project_members" CASCADE;
  DROP TABLE "project_invites" CASCADE;
  ALTER TABLE "projects" DROP CONSTRAINT "projects_owner_id_members_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_event_registrations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_project_members_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_project_invites_fk";
  
  ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_members_fk";
  
  DROP INDEX "projects_owner_idx";
  DROP INDEX "projects_invite_token_idx";
  DROP INDEX "payload_locked_documents_rels_event_registrations_id_idx";
  DROP INDEX "payload_locked_documents_rels_project_members_id_idx";
  DROP INDEX "payload_locked_documents_rels_project_invites_id_idx";
  DROP INDEX "payload_preferences_rels_members_id_idx";
  ALTER TABLE "projects" ALTER COLUMN "rank" SET DEFAULT 1;
  ALTER TABLE "projects" ALTER COLUMN "delta" SET DEFAULT '+0';
  ALTER TABLE "events" ADD COLUMN "taken" numeric DEFAULT 0;
  ALTER TABLE "projects" ADD COLUMN "cat" varchar;
  ALTER TABLE "projects" ADD COLUMN "builder" varchar;
  ALTER TABLE "projects" ADD COLUMN "loc" varchar;
  ALTER TABLE "projects" ADD COLUMN "metric_l" varchar;
  ALTER TABLE "projects" ADD COLUMN "blurb" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "teams_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "users_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "users_id" integer;
  ALTER TABLE "teams_stack" ADD CONSTRAINT "teams_stack_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_tags" ADD CONSTRAINT "projects_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "teams_stack_order_idx" ON "teams_stack" USING btree ("_order");
  CREATE INDEX "teams_stack_parent_id_idx" ON "teams_stack" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "teams_slug_idx" ON "teams" USING btree ("slug");
  CREATE INDEX "teams_updated_at_idx" ON "teams" USING btree ("updated_at");
  CREATE INDEX "teams_created_at_idx" ON "teams" USING btree ("created_at");
  CREATE INDEX "projects_tags_order_idx" ON "projects_tags" USING btree ("_order");
  CREATE INDEX "projects_tags_parent_id_idx" ON "projects_tags" USING btree ("_parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_teams_fk" FOREIGN KEY ("teams_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_teams_id_idx" ON "payload_locked_documents_rels" USING btree ("teams_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  ALTER TABLE "projects" DROP COLUMN "tagline";
  ALTER TABLE "projects" DROP COLUMN "description";
  ALTER TABLE "projects" DROP COLUMN "category";
  ALTER TABLE "projects" DROP COLUMN "city";
  ALTER TABLE "projects" DROP COLUMN "status";
  ALTER TABLE "projects" DROP COLUMN "owner_id";
  ALTER TABLE "projects" DROP COLUMN "featured";
  ALTER TABLE "projects" DROP COLUMN "metric_label";
  ALTER TABLE "projects" DROP COLUMN "invite_token";
  ALTER TABLE "members" DROP COLUMN "role";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "event_registrations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "project_members_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "project_invites_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN "members_id";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum_project_members_role";
  DROP TYPE "public"."enum_project_invites_status";
  DROP TYPE "public"."enum_members_role";`)
}
