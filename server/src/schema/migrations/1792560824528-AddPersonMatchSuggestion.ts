import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "person_custom_cover" (
  "personId" uuid NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "person_custom_cover_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "person_custom_cover_pkey" PRIMARY KEY ("personId")
);`.execute(db);
  await sql`CREATE TABLE "person_match_suggestion" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "personId" uuid NOT NULL,
  "suggestedPersonId" uuid NOT NULL,
  "distance" double precision NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "person_match_suggestion_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "person_match_suggestion_suggestedPersonId_fkey" FOREIGN KEY ("suggestedPersonId") REFERENCES "person" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "person_match_suggestion_personId_suggestedPersonId_uq" UNIQUE ("personId", "suggestedPersonId"),
  CONSTRAINT "person_match_suggestion_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "person_match_suggestion_personId_idx" ON "person_match_suggestion" ("personId");`.execute(db);
  await sql`CREATE INDEX "person_match_suggestion_suggestedPersonId_idx" ON "person_match_suggestion" ("suggestedPersonId");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "person_custom_cover";`.execute(db);
  await sql`DROP TABLE "person_match_suggestion";`.execute(db);
}
