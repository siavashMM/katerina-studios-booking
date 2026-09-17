# Operations

## Set up owner access

1. Create a separate Auth0 Regular Web Application for each environment. Disable public sign-up. Invite the owner. Require MFA for every owner login.
2. Set the callback URL to `APP_URL/auth/callback`. Set the logout URL and allowed web origin to `APP_URL`.
3. Set `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, and a separate 64-character hexadecimal `AUTH0_SECRET`.
4. Confirm that the ID token has `amr: ["mfa"]`. If the tenant uses a custom claim, set `AUTH0_MFA_CLAIM` to its URL. The claim must be boolean `true` and must be set only after MFA. Do not use a static claim that bypasses MFA.
5. Use the immutable Auth0 subject ID: `npm run owner:access -- grant 'auth0|subject' 'owner@example.com'`.
6. Test login, inactivity expiry, logout, and recovery with the invited test owner. Check that non-owners and users without MFA are rejected.

To remove local access, run `npm run owner:access -- revoke 'auth0|subject'`. Disable the identity in Auth0 as well if it is compromised. Existing application sessions cannot bypass inactive membership. Rotate compromised secrets and remove sessions. Keep a documented second operator recovery route in Auth0.

## Set up email

Verify the sender domain in Resend. Set `RESEND_API_KEY`, `EMAIL_FROM`, and `OWNER_NOTIFICATION_EMAIL`. Register `APP_URL/api/webhooks/resend` and set its signing secret in `RESEND_WEBHOOK_SECRET`. Subscribe to delivery, bounce, complaint, and failure events.

Run the email worker as a separate persistent process. It records a heartbeat every successful cycle. Demo messages become `SKIPPED` with `DEMO_CAPTURED`. Production sends use stable provider idempotency keys and bounded retries. A timeout does not prove that a message was not sent.

For `UNCERTAIN`, inspect the provider by idempotency key and provider ID. Do not press a blind resend button. If delivery succeeded, record the accepted provider ID and close the event in an audited operator transaction. If it failed conclusively, authorize one new notification event with a new key and record the reason. Never overwrite a previous event to hide its history.

For a bounce or complaint, check the address with the guest through an approved contact route. Do not automatically resend. New-request owner email includes the guest and stay details that the owner needs to act. Protect the owner mailbox as personal data.

### Manual Gmail smoke test

Do this only in local development. Do not put real test addresses in committed files.

1. Set `NODE_ENV=development`, `DEMO_MODE=true`, and `REAL_EMAIL_TEST=true` in the private `.env` file.
2. Set a verified `EMAIL_FROM`, `RESEND_API_KEY`, and `OWNER_NOTIFICATION_EMAIL` in the private `.env` file.
3. Start the web process and the email worker.
4. Send one booking request. Use a guest alias such as `<your-address>+guest@gmail.com`.
5. Confirm that the owner message has the subject `New booking request - Katerina Studios`.
6. Confirm that the guest acknowledgement has the subject `Booking request received - Katerina Studios` and says that the booking is not confirmed.
7. Confirm the request in `/admin/reservations`. Confirm that the guest message has the subject `Reservation confirmed - Katerina Studios` and states the cash-on-arrival amount.
8. Check each email event in the owner portal. Record the provider ID and delivery state.
9. Check both inboxes. A provider ID proves submission to the provider. It does not prove inbox receipt.
10. Set `REAL_EMAIL_TEST=false` when the check is complete.

The application rejects `REAL_EMAIL_TEST=true` outside development.

## Photo storage

`MEDIA_STORAGE=local` enables owner uploads only outside production. The local adapter validates JPG, PNG, and WebP files, limits input to 8 MB, removes image orientation, limits dimensions, and writes a WebP derivative to `public/owner-uploads`. Configure a durable object-storage adapter before production. Do not use an ephemeral deployment file system.

## iCal setup

Set `ICAL_ENCRYPTION_KEY` to 32 random bytes encoded as 64 hexadecimal characters. Set a separate `ICAL_EXPORT_SECRET` with at least 32 random bytes. Keep both values outside source control.

In Full Control settings, connect an HTTPS feed to a studio and run sync. Give each channel its own feed. The private export URL is for the selected studio. Rotate `ICAL_EXPORT_SECRET` if an export URL is disclosed. A rotation invalidates all old export URLs.

The current sync runs when an owner selects Sync. Add a protected scheduler before you depend on unattended imports. Monitor `lastSyncedAt` and `lastError`.

## Third-party channel limits

The portal does not claim a Booking.com or Airbnb API connection.

Booking.com states that its Connectivity APIs are for Connectivity Partners and that provider connections have scoped permissions. A production connection needs partner onboarding, a machine account, property approval, the required connection types, certification or self-assessment where required, and continuous support for API changes. See the [Booking.com Connectivity overview](https://developers.booking.com/connectivity/docs) and [Connections API overview](https://developers.booking.com/connectivity/docs/connections-api/connections-overview).

Airbnb supports property-management software connections. Its API terms state that an organization must participate in an API program, accept the applicable agreements, complete a data-security review, and use only the scopes that Airbnb grants. See [Airbnb software connection help](https://www.airbnb.com/help/article/2683) and [Airbnb API terms](https://www.airbnb.com/help/article/3418).

Until those approvals and credentials exist, use a manual booking source or an iCal availability feed. Do not label a channel as connected. Do not scrape provider pages or use guest credentials.

## Release checklist

- Verify each physical studio, capacity, photo mapping, facilities, and base and seasonal rates. Do not infer these facts from photos.
- Approve all required charges, cash-on-arrival rules, arrival and departure times, cancellation terms, privacy notice, contact details, and retention periods. Replace the draft policy pages and unverified public copy.
- Use a separate live database. Create verified live inventory and an approved policy version. Set `Property.bookingEnabled`, `Property.verifiedAt`, and live `isDemo=false` records. Keep a signed owner record of the checks. Do not convert sample studios into verified facts by changing flags alone.
- Set `productionContentApproved=true` in `src/content/release.ts` after the approved public copy is in place. Set `PROPERTY_DATA_VERIFIED=true` and `DEMO_MODE=false` only after these checks. The application rejects missing live services and unverified operational records.
- Use HTTPS for the app and verified TLS for PostgreSQL (`sslmode=verify-full`). Restrict the origin to the trusted reverse proxy. Set `TRUST_PROXY` to the header the proxy overwrites.
- Test Auth0, Resend signatures and delivery, the worker, health checks, and owner recovery. Set up external error alerts.
- Complete the backup restore exercise. Verify the retention process and access removal procedure.
- Run the full test suite and build. Complete manual screen-reader and keyboard reviews. Confirm real image-to-studio assignments.

Create a separate runtime database login. After migration, apply `prisma/runtime-grants.sql` with its role name through `psql -v runtime_role=...`. Run owner access commands with an operator database role, not the runtime role. Apply migrations once from the `tools` image. The web and worker replicas must not run migrations at startup. Retain the previous image. Use additive changes. Prefer a corrective migration to a destructive database rollback.

## Health and alerts

`/api/health` reports process liveness. `/api/health/ready` reports readiness only when configuration, database access, and a recent worker heartbeat are present. It exposes no internal details. Owner notifications show recent delivery states and worker checks.

Alert on readiness failure, missing worker heartbeat, application error codes, and `EMAIL_ATTENTION_REQUIRED`. The worker reports email failures and queued messages older than five minutes. Configure the hosting log system to group repeated alerts. Check the owner notification list when an alert occurs.

The largest booking risk is inventory on other channels. Before confirmation, the owner must check those channels and enter manual blocks. A local availability result is not proof of availability on other sites.

## Backup and recovery

Use managed PostgreSQL point-in-time recovery with a target recovery point of 15 minutes and a restoration window of four hours. These are targets, not measured guarantees. Check the selected provider settings and complete a timed restore exercise.

1. Stop booking mutations or enable maintenance at the reverse proxy. Stop the worker to prevent duplicate email during recovery.
2. Restore into a new isolated database. Keep the source database unchanged.
3. Check migrations, foreign keys, exclusion constraints, reservation counts, confirmed allocations, owner memberships, and policy snapshots. Run the overlap checks in the test plan.
4. Compare outbox events with provider delivery records. Reconcile uncertain sends before restarting the worker. Invalidate restored sessions after an incident.
5. Point the app to the restored database. Test one approved test booking and owner confirmation. Check readiness and record measured recovery time and data loss.

For an isolated local rehearsal, use `pg_dump --format=custom --file=backup.dump DATABASE_URL`, create a separate restore database, and use `pg_restore --no-owner --dbname=RESTORE_DATABASE_URL backup.dump`. Keep connection strings out of shell history on shared systems; use a protected service file there. Never restore over a live database as a test.

Document deletion cutoffs after owner approval. Remove or anonymize expired guest fields and related outbox payloads in the same controlled operation. Keep only the audit and accounting fields that have an approved retention basis. Apply backup expiry, and reapply deletions after a restore. No scheduled guest deletion runs until the owner approves its rules.
