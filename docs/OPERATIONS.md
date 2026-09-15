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

Verify the sender domain in Resend. Set `RESEND_API_KEY`, `EMAIL_FROM`, and `RESERVATION_OWNER_EMAIL`. Register `APP_URL/api/webhooks/resend` and set its signing secret in `RESEND_WEBHOOK_SECRET`. Subscribe to delivery, bounce, complaint, and failure events.

Run the email worker as a separate persistent process. It records a heartbeat every successful cycle. Demo messages become `SKIPPED` with `DEMO_CAPTURED`. Production sends use stable provider idempotency keys and bounded retries. A timeout does not prove that a message was not sent.

For `UNCERTAIN`, inspect the provider by idempotency key and provider ID. Do not press a blind resend button. If delivery succeeded, record the accepted provider ID and close the event in an audited operator transaction. If it failed conclusively, authorize one new notification event with a new key and record the reason. Never overwrite a previous event to hide its history.

For a bounce or complaint, check the address with the guest through an approved contact route. Do not automatically resend. Owner emails contain only a reference, dates, and protected admin link. Guest details stay in the owner area.

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
