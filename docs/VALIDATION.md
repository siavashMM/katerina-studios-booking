# Local validation — 11 September 2026

## Passed

- Node.js 24 dependency install, formatting, ESLint, generated Next.js types, and TypeScript checks.
- Production app build and bundled email worker build.
- 51 unit and PostgreSQL integration tests. The domain and application coverage gates passed. Overall measured coverage was 97% of lines and 90% of branches.
- 27 browser tests across Chromium, Firefox, and WebKit. These cover the guest request and receipt, owner confirmation and cancellation, date blocks, rates, private owner search, access removal, missing MFA, keyboard calendar selection, and dialog focus return.
- Automated accessibility checks on public and owner pages. Public layout checks at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 pixels. Owner controls checked at 375 pixels.
- Desktop and mobile screenshot review. Fixed mobile date-field overflow, text spacing, and the floating action near the home search form. The affected browser tests passed again after the changes.
- PostgreSQL migration replay and overlap constraints. A local backup was restored into an isolated database. Both migrations and both exclusion constraints were present. All 26 integration tests passed against the restored database.
- Runtime database grants checked. The runtime role can read operational data and cannot change owner memberships.
- Container build with Podman. Web and worker processes ran as UID 1001. The readiness endpoint returned `ready` with the worker running.
- Production dependency audit: no known vulnerabilities reported by npm at the time of the check.

## Limits

The container build uses Webpack with a 512 MiB JavaScript heap limit. Turbopack ran out of memory in the shared 2 GiB container machine. The normal local build uses Turbopack. Both build paths passed. The Webpack build reports a dynamic import warning in the Auth0 DPoP helper; DPoP is not enabled. Validate the live Auth0 tenant before release.

Browser owner tests use encrypted test sessions. Live Universal Login, MFA enrollment, owner recovery, a verified email domain, real email delivery, and hosting alerts need configured external services. No real guest email was sent.

The local restore check does not prove a managed host can meet the 15-minute recovery point or four-hour recovery window. Measure those targets on the selected host. Full manual screen-reader review and approved retention procedures remain release checks.

Actual studios, capacity, image mapping, contact details, charges, and legal text are not verified. The site remains in demo mode. `src/content/release.ts` blocks production booking until the public content is approved. Do not remove that gate to publish sample data.
