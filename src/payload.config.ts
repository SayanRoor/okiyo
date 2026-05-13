import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Categories } from "./collections/Categories";
import { Leads } from "./collections/Leads";
import { Media } from "./collections/Media";
import { Products } from "./collections/Products";
import { Users } from "./collections/Users";
import { Settings } from "./globals/Settings";
import { migrations } from "./migrations";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  secret: process.env.PAYLOAD_SECRET || "",
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: " — OKIYO admin",
    },
  },
  collections: [Users, Media, Categories, Products, Leads],
  globals: [Settings],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
    // В dev — push: схема в БД синхронизируется при старте без миграций.
    // В prod — обычно push: false, изменения идут только через явные миграции.
    // Чтобы временно разрешить авто-синхронизацию схемы (например, после добавления
    // нового поля без сгенерированной миграции), поставьте в .env на сервере:
    //   PAYLOAD_PUSH_SCHEMA=1
    // После успешного применения — уберите флаг и перезапустите.
    push:
      process.env.PAYLOAD_PUSH_SCHEMA === "1" ||
      process.env.NODE_ENV !== "production",
    prodMigrations: migrations,
  }),
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
