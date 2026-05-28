import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Реквизиты для правовых страниц (политика, оферта, возврат).
 * Без них Google Ads / Merchant Center могут отклонить рекламу на модерации.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "legal_company_name" varchar,
      ADD COLUMN IF NOT EXISTS "legal_bin" varchar,
      ADD COLUMN IF NOT EXISTS "legal_address" varchar,
      ADD COLUMN IF NOT EXISTS "legal_email" varchar;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "settings"
      DROP COLUMN IF EXISTS "legal_company_name",
      DROP COLUMN IF EXISTS "legal_bin",
      DROP COLUMN IF EXISTS "legal_address",
      DROP COLUMN IF EXISTS "legal_email";
  `);
}
