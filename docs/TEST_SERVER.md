# Public Test Server

The public test server runs on this Windows PC through Cloudflare Tunnel.

## Endpoints

- Store: `https://pantrka.com`
- Alternate hostname: `https://www.pantrka.com`
- Health: `https://pantrka.com/health`
- Infrastructure ports and the local gateway are bound to private Docker networks or `127.0.0.1`.
- Search indexing is disabled with `X-Robots-Tag: noindex, nofollow`.
- HTML responses disable caching so in-app browsers do not retain pages that reference obsolete Next.js chunks after a test deployment. Hashed static assets keep their framework cache behavior.

This is a test server, not a production-ready shop. Do not accept real payments while P0 items remain in `docs/PRODUCTION_READINESS.md`.

## Current status (2026-06-21)

- The public domain, Cloudflare Tunnel, Caddy gateway, frontend, backend, PostgreSQL, and Redis are running through `compose.test-server.yml`.
- The server database contains 18 active products and 4 top-level categories. Product and category APIs are public and do not require OAuth, NICE Payments, or AWS credentials.
- `/products` is dynamically server-rendered with its initial category and product data. A mobile browser can display products even if client-side hydration is delayed or fails.
- `/` is dynamically server-rendered with banners, main-page configuration, curated new arrivals, fallback new products, and best products.
- Product-list API failures are shown as an explicit load error with a retry action instead of being reported as an empty catalog.
- Category selection is URL-driven through `?category=...`, avoiding client state that could become stale after navigation.
- The frontend container uses `INTERNAL_API_BASE_URL=http://backend:8080` for server-side rendering. Browser API requests continue to use `https://pantrka.com`.
- Admin banner deletion removes the database record even when S3 cleanup fails because test-server AWS credentials are blank.
- Admin product management excludes soft-deleted products before pagination, so `ALL` and category tabs show the same complete set of undeleted products.

Verification completed on 2026-06-21:

- `npx eslint src/app/page.tsx src/app/HomeContent.tsx` completed with no errors. Two existing `<img>` performance warnings remain.
- `npx eslint src/app/products/page.tsx src/app/products/ProductsContent.tsx` completed with no errors. One existing `<img>` performance warning remains.
- `NEXT_PUBLIC_API_BASE_URL=https://pantrka.com npm run build` completed successfully with TypeScript checks. Both `/` and `/products` are dynamic routes.
- An iPhone/Naver in-app-browser user agent received HTTP 200 from the public home and products pages.
- The public product API returned 18 products and the category API returned 4 categories.
- The rendered `/products` HTML contained a real server product name before hydration.
- The rendered `/` HTML contained product links and S3 image references before hydration.
- Public product image access returned HTTP 200 without AWS credentials.
- `./gradlew.bat test --tests "com.pantrka.backend.domain.admin.service.AdminBannerServiceTest" --tests "com.pantrka.backend.domain.admin.service.AdminOrderServiceTest"` completed successfully.
- `NEXT_PUBLIC_API_BASE_URL=https://pantrka.com npm run build` completed successfully after the admin product pagination fix.
- Test-server backend and frontend images were rebuilt and replaced with `docker compose --env-file .env.server -f compose.test-server.yml up -d --build backend frontend`.
- `https://pantrka.com/health` returned HTTP 200 after deployment.
- NICE Payments Server approval integration was deployed on 2026-06-21. The public form POST callback returns HTTP 303 to the payment result page, and backend signature/amount validation tests pass. Actual sandbox authorization, approval, cancellation, and refund remain unavailable until NICE sandbox keys are entered in `.env.server`.

## Start and update

Start Docker Desktop, then run from the repository root:

```powershell
docker compose --env-file .env.server -f compose.test-server.yml up -d --build
docker compose --env-file .env.server -f compose.test-server.yml ps
```

After code changes, run the same `up -d --build` command. PostgreSQL and Redis use named volumes and are not deleted by an image rebuild.

## Logs and stop

```powershell
docker compose --env-file .env.server -f compose.test-server.yml logs -f --tail 100
docker compose --env-file .env.server -f compose.test-server.yml down
```

Never add `-v` to `down` unless deleting the test database is intentional.

## Secrets and unavailable integrations

`.env.server` is ignored by Git. Database, Redis, and JWT secrets were generated locally. AWS, SMTP, OAuth, and NICE Payments values are intentionally blank until newly issued credentials are entered locally. Never paste those values into chat or tracked files.

Existing public S3 product images can be viewed without AWS credentials. Blank AWS credentials prevent new image uploads and deletions; blank OAuth credentials prevent the corresponding social login; blank NICE Payments credentials prevent payment processing. These missing integrations do not prevent the public product catalog from loading.

## Database backup

Create a backup directory outside the repository or on another physical device, then run:

```powershell
docker compose --env-file .env.server -f compose.test-server.yml exec postgres `
  pg_dump -U pantrka -d shopdb -Fc -f /tmp/pantrka.dump
docker compose --env-file .env.server -f compose.test-server.yml cp `
  postgres:/tmp/pantrka.dump C:\path\to\backups\pantrka.dump
docker compose --env-file .env.server -f compose.test-server.yml exec postgres `
  rm -f /tmp/pantrka.dump
```

The initial test database was copied from the local development database on 2026-06-20. A Docker volume is not a backup.

## Availability

The site is reachable only while this PC, Docker Desktop, the application containers, and the internet connection are running. Configure Docker Desktop to start at Windows sign-in and disable automatic sleep if continuous test access is required.
