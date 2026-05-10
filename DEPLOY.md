# OKIYO — гид по обновлению

Чеклист, как выкатить накопленные изменения (редизайн под японский минимализм + UX-чистка) в репозиторий, на прод-сервер и в админку. Делать в указанном порядке.

## TL;DR

```
# 1. Локально: разрешить расхождение с remote и выложить миграцию
git fetch origin
git pull --rebase origin main          # см. раздел «Конфликт с remote» ниже
pnpm install
pnpm payload migrate:create products_redesign_fields
git add src/migrations/ && git commit -m "feat(db): миграция новых полей Products + Settings.topbar"
git push origin main

# 2. На прод-сервере (self-hosted docker-compose)
ssh nano@srv-okiyo
cd /srv/okiyo && ./infra/deploy.sh

# 3. В админке (https://okiyo.kz/admin) — заполнить:
#    Settings → Соцсети → WhatsApp
#    Settings → Шапка → Топ-бар (2-3 фразы)
#    Каждый товар → Подпись, Тип, Метка, Цвета
```

---

## 1. Конфликт с remote (один раз)

В origin/main лежит коммит, который тоже добавил поле `colors` в Products + миграцию `20260510_090603_products_colors` + компонент `product-gallery.tsx`. Мой локальный коммит `69377f0` (редизайн) не пройдёт fast-forward.

Стратегия — **rebase**, в конфликтных файлах оставить **мою версию редизайна**, но из удалённого коммита оставить **только**:

- `src/migrations/20260510_090603_products_colors.{json,ts}` — формальная миграция для colors. Её надо сохранить, иначе на проде Payload будет считать схему «грязной».
- Запись миграции в `src/migrations/index.ts`.
- `.gitignore` — взять обе версии (что добавили там, скорее всего безобидное).

Что **переписать моим**:

- `src/collections/Products.ts` — у меня там сразу subtitle, type, badge, colors, order. Их версия colors — подмножество моих изменений.
- `src/app/(frontend)/catalog/[slug]/page.tsx` — у меня страница уже под редизайн с галереей, colors-swatches и WhatsApp-CTA.
- `scripts/seed.ts` — у меня маппинг новых полей, у них могут быть свои улучшения; смотреть руками.
- Если в их коммите есть `src/components/product-gallery.tsx` — взять его как отдельный компонент и потом интегрировать в мою страницу товара (улучшение, у меня сейчас простая галерея).

Команды:

```
cd ~/Projects/okiyo/okiyo
git fetch origin
git log --oneline HEAD..origin/main          # увидеть, какие коммиты прилетели
git pull --rebase origin main
# при конфликтах git status подсветит файлы.
# для каждого:
git checkout --ours src/collections/Products.ts
git checkout --ours src/app/\(frontend\)/catalog/\[slug\]/page.tsx
# для миграций — взять их версию:
git checkout --theirs src/migrations/20260510_090603_products_colors.json
git checkout --theirs src/migrations/20260510_090603_products_colors.ts
git checkout --theirs src/migrations/index.ts
# затем добавить и продолжить:
git add -A
git rebase --continue
```

Если что-то пошло не так — `git rebase --abort` возвращает в исходное состояние без потерь.

## 2. Сгенерировать миграцию для остальных новых полей

После rebase в `Products` лежат поля **subtitle / type / badge / order**, в `Settings` — массив **topbar**. Этих изменений нет ни в одной существующей миграции.

```
pnpm install                  # если ещё не делали после смены коммитов
pnpm payload migrate:create products_redesign_fields
```

Команда сравнит код с last-applied миграцией и сгенерирует разницу как новый файл `src/migrations/20260510_*.{json,ts}` + допишет запись в `index.ts`. Просмотри SQL глазами (он напечатается в консоль), убедись что там только новые колонки и таблица `settings_topbar`.

```
git add src/migrations/ src/collections/Products.ts src/globals/Settings.ts
git commit -m "feat(db): миграция новых полей Products + Settings.topbar"
git push origin main
```

## 3. Переменные окружения

### Self-hosted docker-compose

В `/srv/okiyo/.env` на проде должны быть **минимум** три переменные:

```
POSTGRES_PASSWORD=<длинный случайный>
PAYLOAD_SECRET=<openssl rand -hex 32>
PAYLOAD_PUBLIC_SERVER_URL=https://okiyo.kz
```

Если файл уже существует с момента предыдущего деплоя — ничего менять не нужно, новых обязательных переменных не появилось.

### Vercel (если планируется переезд)

Не рекомендую переезд на Vercel без замены хранилища медиа: сейчас Payload пишет загрузки в `./data/media` (volume в docker), а на Vercel filesystem ephemeral — фотки исчезнут после первого холодного старта. Если всё же Vercel:

1. Подними managed Postgres (Neon / Supabase / Vercel Postgres).
2. Подключи внешнее хранилище для media — `@payloadcms/storage-s3` (S3 / R2 / Backblaze) или `@payloadcms/storage-vercel-blob`. Изменения в `payload.config.ts` — отдельная задача.
3. В Vercel Project → Settings → Environment Variables добавь:
   - `DATABASE_URI` = строка подключения к managed Postgres
   - `PAYLOAD_SECRET`
   - `PAYLOAD_PUBLIC_SERVER_URL` = `https://okiyo.kz`
   - переменные выбранного storage adapter (`S3_BUCKET`, `S3_REGION`, ...)
4. Build Command — оставить дефолт `pnpm build` (он автоматически вызовет `payload generate:importmap` и `payload generate:types` через `prebuild`).
5. Output — Next.js (Vercel определит сам).
6. Node version в `package.json/engines` стоит `>=24.15.0` — Vercel должен подхватить, но лучше явно выбрать в Settings → General → Node.js Version.

## 4. Деплой

### Self-hosted (рекомендуемый вариант сейчас)

На прод-сервере уже лежит `infra/deploy.sh` — делает три шага: `git pull → docker compose build web → docker compose up -d`. Он же передёрнет контейнер. Внутри web-контейнера `entrypoint.sh` сначала прогонит `payload migrate` — твои новые миграции применятся автоматически.

```
ssh nano@<server>
cd /srv/okiyo
./infra/deploy.sh
```

После завершения проверь логи: `docker compose logs -f web`. Должна быть строка `==> applying payload migrations` без ошибок и затем `Ready in ...ms`.

### Vercel

После настройки env-переменных push в `main` запустит Production Deployment автоматически. Build шаг применит миграции при следующем cold start (потому что entrypoint.sh не запускается на Vercel) — нужно либо завести Vercel cron-job для `pnpm payload migrate`, либо запустить миграцию вручную через `vercel exec`.

## 5. Заполнить админку

Открой `https://okiyo.kz/admin`. Логин — тот же.

### Настройки сайта (Settings)

- **Шапка → Топ-бар:** добавь 2–3 фразы (Бесплатная доставка по Алматы / Привезём за 2 часа / Гарантия каркаса). Они поедут в тонкой полоске над шапкой и покажутся, разделённые точкой.
- **Соцсети → WhatsApp:** номер без `+` (например `77001234567`). После сохранения в шапке появится ссылка «WhatsApp» с иконкой, на странице товара кнопка «Заказать в WhatsApp» с предзаполненным сообщением.
- **Соцсети → Instagram / Telegram:** при наличии — окей.
- **Главная → Hero eyebrow / title / subtitle / CTA:** уже заполнены через миграцию, можно перепроверить. Заголовок поддерживает разделитель `—` (тире), хвост после которого станет italic-акцентом во второй строке.
- **Главная → Бейджи доверия:** до 4 фраз, идут в strip под hero. Дублируют топ-бар — оставь один источник на свой вкус.

### Каталог (Products)

В каждом товаре появились новые опциональные поля. Заполняй по мере необходимости:

- **Подпись (материал · цвет)** — короткая строка под названием на карточке. Например `Acetate · Black`.
- **Тип** — `Солнцезащитные` или `Оптические`. Используется фильтром на главной и в каталоге.
- **Метка** — `NEW IN` / `BESTSELLER` / `LIMITED` или без метки. Маленький лейбл в углу карточки.
- **Цвета** — массив (hex + название). Появятся как круглые swatch-точки на карточке и колонкой на странице товара.
- **Порядок сортировки** — целое число, меньше = выше. Используется как первичный сорт в каталоге.

Старые поля (mainImage, gallery, цена, в наличии, опубликовано) работают как раньше.

## 6. Smoke-test

После деплоя пройди эти 6 экранов на проде:

1. **/** — большой italic-заголовок, тёплый бежевый фон, иконка солнце/луна в шапке, переключение темы работает и сохраняется при перезагрузке.
2. **/?type=sun** не падает (сейчас фильтр живёт в `/catalog?type=sun`).
3. **/catalog** — сетка 4 колонки на десктопе, чипы фильтров переключаются, «Показать ещё» подгружает.
4. **/catalog/<slug>** — одна primary-кнопка «Заказать в WhatsApp» с предзаполненным текстом «Здравствуйте! Интересует модель X (Y ₸).»
5. **/admin** — открывается, новые поля видны, сохранение проходит.
6. Переключение темы день/ночь не вызывает FOUC и тема сохраняется в cookie (видно через DevTools → Application → Cookies → okiyo-theme).

## 7. Откат

### Self-hosted

```
ssh nano@<server>
cd /srv/okiyo
git log --oneline -5                        # найди предыдущий хеш
git reset --hard <предыдущий-хеш>
docker compose build web && docker compose up -d
docker compose exec web pnpm payload migrate:down  # откатить последнюю миграцию
```

### БД

Каждая миграция в `src/migrations/*.ts` экспортирует `down`-функцию — Payload использует её при `migrate:down`. Откат `products_redesign_fields` уберёт колонки и таблицу `settings_topbar` без потери данных в других таблицах.

## 8. FAQ

**`pnpm payload generate:types` падает с «cannot connect to database».**
Генерация типов по умолчанию подключается к БД, чтобы знать колонки. Подними локальную postgres (`docker compose up -d postgres`) или укажи `DATABASE_URI=postgres://...` в `.env.local`.

**На проде после деплоя падает Payload migrate с «column already exists».**
Скорее всего часть полей уже была применена через `push: true` (он включён в `payload.config.ts`). Варианты: либо вручную `ALTER TABLE ... DROP COLUMN` и повторить migrate, либо безопаснее — переключить `push: false` в проде после первого зелёного деплоя, чтобы push больше не опережал миграции.

**WhatsApp-кнопки не появились.**
Settings → Соцсети → WhatsApp пустое. Заполни и пересохрани.

**Карточки серые без фото.**
В товаре не загружен `mainImage`. Загрузи в Payload → Products → <товар> → Фото.

**В шапке нет «Каталог / Солнцезащитные / Оптические» на мобиле.**
Ширина &lt;768px скрывает full-nav. На мобиле остаётся только короткая ссылка «Каталог» слева — это by design.
