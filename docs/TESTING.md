# Test strategy

Use RED, GREEN, REFACTOR for booking rules, database commands, access checks, and delivery retries. Tests must assert behavior, not repeat implementation details.

## Automated checks

Vitest checks calendar dates, leap years, DST, night counts, adjacent stays, capacity, rates, totals, and transitions. Domain coverage gates are 90%. Application service gates are 80%. Generated files and presentation markup have no blanket coverage gate.

Integration tests use PostgreSQL. They check duplicate requests, changed payloads, changed quotes, transaction rollback, overlapping pending requests, competing confirmations, confirmation against a manual block, cancellation, completion, manual booking idempotency, iCal import identity, and owner access. They also check session expiry, concurrent logout, rate limits, worker claims, lease recovery, retries, and uncertain delivery.

Playwright checks the public flow and owner controls in Chromium, Firefox, and WebKit. One critical test sends a public request, finds it in the owner portal, confirms it, finds it in the owner calendar, and proves that the confirmed studio is no longer available for the same dates. Owner tests create an encrypted session with the locked SDK format in a separate test database. No test login route exists in the application. A live Auth0 login is a release check.

The public accessibility test uses axe with WCAG A and AA rules. Layout checks cover 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 pixels. Screenshots are saved in `test-results` for visual review. Automated checks do not establish full WCAG compliance.

CI installs the lock file, generates Prisma and Next.js types, checks formatting and lint, runs coverage tests against PostgreSQL, builds the app and worker, runs browser tests, and builds the runtime container.

## Manual release checks

Check date entry and selection with a keyboard and screen reader. Confirm that the last selected calendar date is check-out, not an occupied night. Test dialogs for initial focus, focus return, and Escape. Check 200% and 400% zoom, reduced motion, touch use, and error announcements.

Use an invited owner to test real login, MFA, logout, expired sessions, access removal, and recovery. Verify webhook signatures with the real provider. Test an outage, delayed email, and restored database. Record the result and date; do not mark these checks complete from mocks.

Create one manual booking with a known price and one without a price. Repeat one request with the same idempotency key. Confirm that it creates one reservation and one allocation. Check source labels, internal notes, and the calendar.

Connect a test iCal feed. Import one event, change its dates, cancel it, and remove it from the feed. Confirm that repeat syncs do not create duplicate allocations. Treat iCal as availability data only.

Apply migrations to a new database and confirm the `btree_gist` exclusion constraints exist. Start two conflicting transactions and require exactly one allocation to commit. Repeat after a backup restore. Keep real guest records out of tests, seeds, screenshots, and CI artifacts.
