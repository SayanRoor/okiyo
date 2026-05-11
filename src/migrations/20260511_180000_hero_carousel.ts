import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Карусель фотографий в hero-секции главной.
 *
 * Создаёт массивную таблицу settings_hero_images, в которой каждая запись —
 * одно фото из media. Хранится порядок (_order) для последовательной смены.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "settings_hero_images" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "settings_hero_images"
        ADD CONSTRAINT "settings_hero_images_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."settings"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "settings_hero_images"
        ADD CONSTRAINT "settings_hero_images_image_id_media_id_fk"
        FOREIGN KEY ("image_id")
        REFERENCES "public"."media"("id")
        ON DELETE restrict ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "settings_hero_images_order_idx"
      ON "settings_hero_images" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "settings_hero_images_parent_id_idx"
      ON "settings_hero_images" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "settings_hero_images_image_id_idx"
      ON "settings_hero_images" USING btree ("image_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "settings_hero_images" CASCADE;
  `);
}
