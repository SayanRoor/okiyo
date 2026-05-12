/**
 * Простая идемпотентная транслитерация под URL-slug.
 *
 *   "Kūki 01"           → "kuki-01"
 *   "Очки Hana 05"      → "ochki-hana-05"
 *   "Mori — Titanium"   → "mori-titanium"
 *
 * Покрывает: кириллица, японская латиница с диакритиками (ū, ō, ī, ā, ē),
 * любые не-латинские символы — режутся.
 */

const RU_MAP: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export function slugify(input: string): string {
  if (!input) return "";

  // 1. Снимаем диакритику (ū → u, é → e, etc.)
  const noDiacritics = input.normalize("NFD").replace(/[̀-ͯ]/g, "");

  // 2. Понижаем регистр и транслитерим кириллицу
  const lowered = noDiacritics.toLowerCase();
  let translit = "";
  for (const ch of lowered) {
    translit += RU_MAP[ch] ?? ch;
  }

  // 3. Заменяем всё не-латинское на дефисы и схлопываем дубли.
  return translit
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
