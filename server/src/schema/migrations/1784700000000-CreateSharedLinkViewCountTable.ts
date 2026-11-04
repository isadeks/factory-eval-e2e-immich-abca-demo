import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "shared_link_view_count" (
  "sharedLinkId" uuid NOT NULL,
  "viewCount" integer NOT NULL DEFAULT 0,
  CONSTRAINT "shared_link_view_count_sharedLinkId_fkey" FOREIGN KEY ("sharedLinkId") REFERENCES "shared_link" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "shared_link_view_count_pkey" PRIMARY KEY ("sharedLinkId")
);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "shared_link_view_count";`.execute(db);
}
