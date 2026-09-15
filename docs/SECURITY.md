# Security model

The guest browser is untrusted. The server validates inputs with Zod and calculates prices. The browser cannot set status, owner identity, or payment method. Parameterized queries protect database operations. Guest text is plain text in the UI and escaped in email.

## Owner access

Auth0 manages passwords, MFA, and recovery. Public sign-up must be disabled. The server accepts only an identity from the configured issuer with MFA evidence and an active local membership. Every protected page and command repeats this check. A session alone does not grant access.

The SDK session cookie is encrypted, HttpOnly, and SameSite=Lax. HTTPS enables Secure cookies. Server session data is also encrypted with AES-256-GCM. Sessions expire after 30 minutes of inactivity or eight hours from creation. An atomic update cannot restore a deleted session. Removing a membership blocks access immediately.

The SDK handles login state, nonce, token validation, and logout. Browser access-token endpoints are disabled. Application commands require an exact origin match and a signed CSRF token that matches the cookie. Do not exempt admin endpoints from these checks.

## Network and data

The application adds a per-request nonce CSP, HSTS on HTTPS, no-referrer, frame denial, and content-type protection. Dynamic HTML is not shared-cache content. Admin, API, booking, and receipt responses use `no-store`. Static assets and images can be cached.

Rate limits use shared PostgreSQL counters. With `TRUST_PROXY=none`, all clients share a conservative limit. For live traffic, the reverse proxy must overwrite the configured IP header and block direct access to the origin. Do not trust a client-supplied forwarding header.

Use TLS with certificate validation for the managed database. Do not use `rejectUnauthorized=false`. Use separate migration and runtime roles. Keep service credentials in the host secret store. Never put them in a client variable or image layer.

Owner search uses a protected POST request. Search text is not put in URLs or browser storage. Logs contain operational codes and counts. They must not contain guest names, email addresses, message bodies, cookies, raw requests, or secrets. Outbox payloads contain guest data and require the same protection as reservations. Error reports must apply the same restrictions.

## Known release limits

The automated owner browser tests insert an encrypted test session. They prove application authorization and owner controls. They do not prove live provider configuration, enrollment, recovery, or the complete Universal Login protocol. Test those with an invited test owner before launch.

The demo always captures email. There is no recipient allowlist override. This is a stricter default than optional test delivery. Use a separate staging environment with approved test addresses to verify live delivery.

Retention periods are not invented. The owner must approve them before launch. The operator must apply them to reservations, notifications, logs, exports, and backups. Do not claim privacy compliance from these controls alone.
