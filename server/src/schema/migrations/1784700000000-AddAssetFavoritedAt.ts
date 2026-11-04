import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset" ADD "favoritedAt" timestamp with time zone;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset" DROP COLUMN "favoritedAt";`.execute(db);
}
