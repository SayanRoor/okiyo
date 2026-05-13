import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Создаёт таблицу products_rels — нужна для поля photos (upload, hasMany: true)
 * в коллекции Products.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "products_rels" (
      "id"        serial PRIMARY KEY,
      "order"     integer,
      "parent_id" integer NOT NULL,
      "path"      varchar NOT NULL,
      "media_id"  integer
    );

    DO $$ BEGIN
      ALTER TABLE "products_rels"
        ADD CONSTRAINT "products_rels_parent_fk"
        FOREIGN KEY ("parent_id")
        REFERENCES "public"."products"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "products_rels"
        ADD CONSTRAINT "products_rels_media_fk"
        FOREIGN KEY ("media_id")
        REFERENCES "public"."media"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "products_rels_order_idx"
      ON "products_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "products_rels_parent_idx"
      ON "products_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "products_rels_path_idx"
      ON "products_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "products_rels_media_idx"
      ON "products_rels" USING btree ("media_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "products_rels" CASCADE;`);
}
