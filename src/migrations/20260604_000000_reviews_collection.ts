import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Коллекция отзывов — отдельная таблица + FK на products и media.
 * Опубликованные отзывы рендерятся на главной и под товаром, плюс
 * формируют AggregateRating JSON-LD для звёзд в выдаче Google.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "reviews" (
      "id" serial PRIMARY KEY NOT NULL,
      "author_name" varchar NOT NULL,
      "rating" numeric NOT NULL DEFAULT 5,
      "text" varchar NOT NULL,
      "product_id" integer,
      "city" varchar,
      "photo_id" integer,
      "verified" boolean DEFAULT false,
      "is_published" boolean DEFAULT true,
      "order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "reviews"
        ADD CONSTRAINT "reviews_product_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "products"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "reviews"
        ADD CONSTRAINT "reviews_photo_id_fk"
        FOREIGN KEY ("photo_id") REFERENCES "media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "reviews_product_id_idx"
      ON "reviews" USING btree ("product_id");
    CREATE INDEX IF NOT EXISTS "reviews_is_published_idx"
      ON "reviews" USING btree ("is_published");
    CREATE INDEX IF NOT EXISTS "reviews_order_idx"
      ON "reviews" USING btree ("order");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "reviews" CASCADE;
  `);
}
