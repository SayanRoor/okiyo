import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "settings_trust_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  ALTER TABLE "settings" ALTER COLUMN "site_name" SET DEFAULT 'OKIYO';
  ALTER TABLE "settings" ALTER COLUMN "hero_title" SET DEFAULT 'Тише линий — ярче взгляд.';
  ALTER TABLE "settings" ALTER COLUMN "hero_subtitle" SET DEFAULT 'OKIYO — японские очки с минималистичным силуэтом. Лёгкий ацетат, поляризация UV400, бессрочная гарантия каркаса.';
  ALTER TABLE "settings" ALTER COLUMN "hero_cta_label" SET DEFAULT 'Смотреть коллекцию';
  ALTER TABLE "settings" ADD COLUMN "hero_eyebrow" varchar DEFAULT 'Spring Collection — 2026';
  ALTER TABLE "settings_trust_badges" ADD CONSTRAINT "settings_trust_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "settings_trust_badges_order_idx" ON "settings_trust_badges" USING btree ("_order");
  CREATE INDEX "settings_trust_badges_parent_id_idx" ON "settings_trust_badges" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings_trust_badges" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "settings_trust_badges" CASCADE;
  ALTER TABLE "settings" ALTER COLUMN "site_name" SET DEFAULT 'okiyo';
  ALTER TABLE "settings" ALTER COLUMN "hero_title" SET DEFAULT 'Мебель для вашего дома';
  ALTER TABLE "settings" ALTER COLUMN "hero_subtitle" SET DEFAULT 'Каталог тщательно подобранной мебели — от диванов до спален.';
  ALTER TABLE "settings" ALTER COLUMN "hero_cta_label" SET DEFAULT 'Смотреть каталог';
  ALTER TABLE "settings" DROP COLUMN "hero_eyebrow";`)
}
