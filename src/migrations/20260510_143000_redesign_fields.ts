import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Добавляет поля редизайна, нужные новому фронтенду:
 *
 *   products.subtitle      — подпись (материал · цвет) на карточке
 *   products.type          — sun | optic, фильтр в каталоге
 *   products.badge         — none | new | bestseller | limited
 *   products.order         — порядок сортировки в коллекции
 *   products.category_id   — становится опциональным
 *
 *   settings_topbar (новая таблица) — массив фраз тонкой полоски над шапкой
 *
 * Цветовые варианты (products_colors) уже добавлены миграцией
 * 20260510_090603_products_colors.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "subtitle" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "type" varchar DEFAULT 'sun';
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "badge" varchar DEFAULT 'none';
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;
    ALTER TABLE "products" ALTER COLUMN "category_id" DROP NOT NULL;

    CREATE TABLE IF NOT EXISTS "settings_topbar" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "text" varchar NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "settings_topbar"
        ADD CONSTRAINT "settings_topbar_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."settings"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "settings_topbar_order_idx"
      ON "settings_topbar" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "settings_topbar_parent_id_idx"
      ON "settings_topbar" USING btree ("_parent_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "settings_topbar" CASCADE;
    ALTER TABLE "products" DROP COLUMN IF EXISTS "subtitle";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "type";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "badge";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "order";
    ALTER TABLE "products" ALTER COLUMN "category_id" SET NOT NULL;
  `);
}
