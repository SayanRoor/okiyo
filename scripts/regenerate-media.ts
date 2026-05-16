/**
 * Пересоздаёт все image-sizes (thumbnail / card / hero) для всех записей
 * в коллекции Media. Используется один раз после изменения imageSizes в
 * Media.ts — Sharp по-умолчанию регенерит размеры только при upload,
 * для существующих записей нужен явный trigger.
 *
 * Логика:
 *   1. Берём все media.
 *   2. Для каждого читаем оригинальный файл с диска (filename + staticDir).
 *   3. Через payload.update передаём этот файл как новый upload — Payload
 *      запускает Sharp pipeline заново, создаёт свежие sizes и сохраняет
 *      их пути в БД.
 *
 * Запуск:
 *   docker compose exec web pnpm tsx scripts/regenerate-media.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getPayload } from "payload";
import config from "../src/payload.config";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const STATIC_DIR =
  process.env.PAYLOAD_MEDIA_DIR ?? path.resolve(dirname, "../media");

async function main() {
  console.log(`[regen] media dir: ${STATIC_DIR}`);
  const payload = await getPayload({ config });

  const all = await payload.find({
    collection: "media",
    limit: 1000,
    depth: 0,
  });

  console.log(`[regen] found ${all.docs.length} media`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of all.docs) {
    const filename = (doc as { filename?: string }).filename;
    const mime = (doc as { mimeType?: string }).mimeType ?? "";
    if (!filename) {
      skipped++;
      console.log(`[regen] no filename for id=${doc.id}, skip`);
      continue;
    }

    // Видео не имеют image-sizes — пропускаем.
    if (mime.startsWith("video/")) {
      skipped++;
      console.log(`[regen] video ${filename} — skip`);
      continue;
    }

    const fullPath = path.join(STATIC_DIR, filename);
    if (!fs.existsSync(fullPath)) {
      failed++;
      console.warn(`[regen] FILE NOT FOUND ${fullPath} — skip`);
      continue;
    }

    try {
      // Передаём filePath заново — Payload пройдёт через Sharp pipeline
      // и пересоздаст все imageSizes в соответствии с текущим Media.ts.
      await payload.update({
        collection: "media",
        id: doc.id,
        data: {},
        filePath: fullPath,
      });
      ok++;
      console.log(`[regen] ✓ ${filename}`);
    } catch (e) {
      failed++;
      console.error(`[regen] ✗ ${filename}:`, (e as Error).message);
    }
  }

  console.log(`\n[regen] done: ${ok} ok, ${skipped} skipped, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("[regen] fatal:", e);
  process.exit(1);
});
