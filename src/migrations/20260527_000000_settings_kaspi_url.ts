import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Ссылка на магазин в Kaspi. Если заполнено — на странице товара под CTA
 * появляется тонкая ссылка-альтернатива «Также в Kaspi · Рассрочка 0–0–12».
 * Хранится в global settings.kaspi_shop_url (varchar, nullable).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "kaspi_shop_url" varchar;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "settings" DROP COLUMN IF EXISTS "kaspi_shop_url";
  `);
}
