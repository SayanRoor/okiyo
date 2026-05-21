import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "try_on_image_id" integer;

    DO $$ BEGIN
      ALTER TABLE "products"
        ADD CONSTRAINT "products_try_on_image_id_media_id_fk"
        FOREIGN KEY ("try_on_image_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "products_try_on_image_idx"
      ON "products" USING btree ("try_on_image_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" DROP COLUMN IF EXISTS "try_on_image_id";
  `);
}
