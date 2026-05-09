# okiyo

Furniture catalog at [okiyo.kz](https://okiyo.kz) — public storefront plus an admin panel where staff add products (photos, names, prices, descriptions) without touching code.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind v4)
- Payload CMS 3 (`/admin`, mounted in the same app)
- PostgreSQL 16
- Caddy on the host for TLS / reverse proxy
- Docker Compose for the production runtime

## Local development

```bash
# Node 24+ required by Payload 3 — pin via fnm/nvm
fnm use     # reads .node-version

# install deps
pnpm install

# start postgres for development (or point DATABASE_URI elsewhere)
docker run -d --name okiyo-pg -p 5433:5432 \
  -e POSTGRES_USER=okiyo -e POSTGRES_PASSWORD=okiyo -e POSTGRES_DB=okiyo \
  postgres:16-alpine

# .env.local
cat > .env.local <<'EOF'
DATABASE_URI=postgres://okiyo:okiyo@localhost:5433/okiyo
PAYLOAD_SECRET=$(openssl rand -hex 32)
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
EOF

# generate Payload import map (one-time, after collection changes)
pnpm generate:importmap

# dev server
pnpm dev
```

Open `http://localhost:3000` for the storefront and `http://localhost:3000/admin` for the CMS. On first run Payload will redirect to a "create first admin" form.

## Production build

Turbopack build is not yet supported by Payload 3 on Next 16, use webpack:

```bash
pnpm build      # runs `next build --webpack`
pnpm start
```

## Deployment

The site lives on `192.248.188.243` alongside `zakyat.kz`. Caddy on the host terminates TLS for `okiyo.kz` and reverse-proxies to the `okiyo_web` container on `127.0.0.1:3010`. Postgres runs in a sibling container on a private docker network.

See `infra/` and `Caddyfile.snippet` for the bits that the host owns.
