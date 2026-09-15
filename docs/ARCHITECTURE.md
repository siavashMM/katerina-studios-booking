# Architecture

The application is a modular monolith. Next.js serves public pages and HTTP handlers. Pure booking rules calculate dates, prices, and status changes. Application services run database transactions. The web process and email worker use one PostgreSQL database.

## Booking rules

Each accommodation is one physical studio. A stay includes check-in and excludes check-out. Dates are calendar dates in `Europe/Athens`; event timestamps use UTC. Money uses integer EUR cents. Each accepted request stores nightly prices and a policy snapshot. Later rate changes do not change that request.

`PENDING` requests can overlap. Only `CONFIRMED` reservations and manual blocks occupy dates. PostgreSQL exclusion constraints reject overlapping active allocations, including a confirmation that races with a manual block. All application inventory changes lock the studio before the reservation. Seasonal price ranges cannot overlap.

The owner must acknowledge the external-channel check before confirmation. The acknowledgement, inventory change, reservation status, audit event, and email events commit together. Cancellation releases the allocation. Completion is permitted only after check-out. Terminal states cannot reopen. Repeated commands do not create repeated email events.

## Interfaces

`GET /api/availability` accepts dates and guest count. It returns public quotes. `POST /api/booking-requests` validates the request, compares the server quote fingerprint, and creates a pending request. A random request key protects retries. The service checks the key before current prices and availability. A changed payload with the same key returns a conflict.

Owner commands use `/api/admin/reservations/:id/:action`, `/api/admin/blocks`, and `/api/admin/rates`. Every command checks the current owner membership. Public interfaces return explicit contracts. Owner pages use server-side database projections.

The receipt cookie contains an opaque token. The database stores its hash. The reference alone cannot read a receipt. Receipt access expires after one hour. Personal details do not enter URLs or browser storage.

## Storage and notifications

`Property`, `Accommodation`, `SeasonalPrice`, and `PolicyVersion` hold operational settings. `Reservation` stores guest and price snapshots. `InventoryAllocation` holds confirmed stays and blocks. `EmailOutbox`, `AuditEvent`, `OwnerMembership`, `AuthSession`, `RateLimitCounter`, `ProcessedWebhook`, and `WorkerHeartbeat` support operations.

The worker claims rows with `FOR UPDATE SKIP LOCKED`. Claims expire after two minutes. Sends have a 15-second timeout and stable provider keys. The worker makes at most eight attempts. It stops automatic retries before the provider's 24-hour key window ends. Uncertain delivery requires review. Delivery webhooks are signed and idempotent. An early failure event is reconciled with the send result. Email delivery is not exactly once.

## Content and display

Static facts and photo descriptions are in `src/content`. Prices and availability come from PostgreSQL. The public pages use Server Components. React Aria supplies dates and dialogs. The design uses local fonts and optimized WebP photos. Mobile layouts stack fields and content. Wide layouts limit text and photo width.

No calendar adapter, guest account system, payment processor, message broker, or separate backend is included. These features need a separate business requirement.
