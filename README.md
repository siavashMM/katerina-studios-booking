# Katerina Studios

A booking request website for one property. Guests send a request. The owner checks external channels and confirms availability. Payment is in cash on arrival.

The repository includes public pages, a four-step booking form, an owner portal, PostgreSQL migrations, Auth0 access controls, an email outbox, and a Resend worker. The owner portal manages bookings, a calendar, guest email, blocked dates, and plan-based website controls. Demo mode uses two sample studios and captures email. It does not make real reservations.

## Local setup

Use Node.js 24 and PostgreSQL 18. Docker is optional for local work.

1. Run `nvm use`, then `npm ci`.
2. Copy `.env.example` to `.env`. Set `DATABASE_URL` and generate separate secrets with `openssl rand -hex 32`.
3. Run `npm run db:generate`, `npm run db:deploy`, and `npm run db:seed`.
4. Run `npm run dev` in one terminal and `npm run worker` in another.
5. Open `http://localhost:3000`.

The database user that applies migrations needs permission to install `btree_gist`. The runtime user does not need migration permissions. Never use the demo seed on a live property.

Owner login needs an Auth0 application, required MFA, and an active owner membership. There is no default password or local login bypass. Follow [owner setup](docs/OPERATIONS.md).

## Checks

Create a separate database with a name that ends in `_test`. Copy `.env.test.example` to `.env.test` and set its URLs. Apply migrations to that database before tests. Test setup clears test records. It rejects a database name without the `_test` suffix.

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
```

Browser tests start the production app on port 3100. They use captured email and a test owner session. They do not prove that a live Auth0 tenant or email domain is correctly configured.

## Release

`Dockerfile` builds one non-root runtime image for the web process and email worker. The `tools` target applies migrations. `compose.yaml` uses an external PostgreSQL service. Set a database address that the containers can reach; `localhost` inside a container is not the host database.

```sh
docker compose build web
docker compose --profile release run --rm migrate
docker compose up -d web worker
```

The optional `compose.local.yaml` file adds local PostgreSQL: `docker compose -f compose.yaml -f compose.local.yaml --profile local-db up -d postgres`. Set `LOCAL_DATABASE_PASSWORD` and use `postgres` as the database host for the web and worker containers.

Before real bookings, complete [the release checklist](docs/OPERATIONS.md). Configuration alone does not establish property accuracy, privacy terms, or recovery readiness.

Read the [owner portal guide](OWNER_PORTAL.md), [architecture](docs/ARCHITECTURE.md), [security](docs/SECURITY.md), [tests](docs/TESTING.md), and [photo inventory](docs/PHOTO_INVENTORY.md).

## Owner portal

The existing owner route is `/admin`. It redirects to `/admin/reservations`. There is no second `/owner` application.

- Owner Control includes bookings, manual bookings, the reservation calendar, messages, and blocked dates.
- Full Control adds property text, studio details, photos, pricing, and iCal settings.
- Server-side capability checks enforce the plan. A hidden link is not an access control.
- Booking.com and Airbnb are manual sources until an approved partner connection exists.

See [OWNER_PORTAL.md](OWNER_PORTAL.md) for routes, workflows, data rules, email checks, and channel limits.

## Google reviews

Google reviews are optional. The website uses the official Places API (New). It does not scrape Google pages or store review content in PostgreSQL.

Set these server-side variables:

```sh
GOOGLE_PLACES_API_KEY=
GOOGLE_PLACE_ID=
GOOGLE_MAPS_URL=
```

`GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACE_ID` must be set together. `GOOGLE_MAPS_URL` is optional. It lets the site show a verified Google Maps link when the Places API is not available. Do not use a `NEXT_PUBLIC_` variable for the API key.

In Google Cloud:

1. Create or select a project with billing.
2. Enable [Places API (New)](https://developers.google.com/maps/documentation/places/web-service/get-api-key).
3. Create a separate key for this server application.
4. Restrict the key to Places API (New). Add the production server IP addresses when the host provides fixed outbound addresses. See [Google Maps Platform security guidance](https://developers.google.com/maps/api-security-best-practices).
5. Set a quota and billing alerts.
6. Get and verify the property Place ID. Add the values to the deployment environment.

The server requests only the rating, rating count, reviews, author attribution, source links, and required data attribution. Google Maps returns a maximum of five reviews in relevance order. The request has a short timeout. The site uses `no-store` and request-only deduplication because the current [Places API policy](https://developers.google.com/maps/documentation/places/web-service/policies) does not permit a permanent review cache. A failed request does not stop the homepage, booking flow, or public content pages.

## Google Maps embed

The location page uses the Maps Embed API. Set this variable:

```sh
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY=
```

The key is visible in the embedded map URL. In Google Cloud, restrict it to the production website referrers and the Maps Embed API. Add `http://localhost:3000/*` for local development. The Places API key above is a separate server-side key.

The Google Maps logo in `public/brand/google-maps-logo-gray.svg` is an unmodified official attribution asset. Do not edit, recolor, crop, or replace it with an unofficial asset.
