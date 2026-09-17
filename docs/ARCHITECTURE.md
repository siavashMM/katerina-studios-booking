# Architecture

The application is a modular monolith. Next.js serves public pages and HTTP handlers. Pure booking rules calculate dates, prices, and status changes. Application services run database transactions. The web process and email worker use one PostgreSQL database.

## Booking rules

Each accommodation is one physical studio. A stay includes check-in and excludes check-out. Dates are calendar dates in `Europe/Athens`; event timestamps use UTC. Money uses integer EUR cents. Each accepted request stores nightly prices and a policy snapshot. Later rate changes do not change that request.

`PENDING` requests can overlap. Only `CONFIRMED` reservations and manual blocks occupy dates. PostgreSQL exclusion constraints reject overlapping active allocations, including a confirmation that races with a manual block. All application inventory changes lock the studio before the reservation. Seasonal price ranges cannot overlap.

The owner must acknowledge the external-channel check before confirmation. The acknowledgement, inventory change, reservation status, audit event, and email events commit together. Cancellation releases the allocation. Completion is permitted only after check-out. Terminal states cannot reopen. Repeated commands do not create repeated email events.

## Interfaces

`GET /api/availability` accepts dates and guest count. It returns public quotes. `POST /api/booking-requests` validates the request, compares the server quote fingerprint, and creates a pending request. A random request key protects retries. The service checks the key before current prices and availability. A changed payload with the same key returns a conflict.

Owner commands use `/api/admin/reservations/:id/:action`, `/api/admin/reservations/manual`, `/api/admin/blocks`, `/api/admin/rates`, `/api/admin/property`, `/api/admin/accommodations`, `/api/admin/media`, and `/api/admin/channels/ical`. Every command checks the current owner membership and plan capability. Public interfaces return explicit contracts. Owner pages use server-side database projections.

`Owner Control` can manage reservations, the calendar, messages, and manual blocks. `Full Control` adds property content, studio content, photos, rates, policies, and channels. `src/features/admin/domain/capabilities.ts` is the central plan map. The application service enforces it before each protected operation.

The receipt cookie contains an opaque token. The database stores its hash. The reference alone cannot read a receipt. Receipt access expires after one hour. Personal details do not enter URLs or browser storage.

## Storage and notifications

`Property`, `Accommodation`, `PropertyContent`, `MediaAsset`, `SeasonalPrice`, and `PolicyVersion` hold operational and website settings. `Reservation` stores guest, source, contact, and price snapshots. `InventoryAllocation` holds confirmed stays, manual blocks, and imported external calendar events. `ExternalCalendar` stores encrypted feed URLs. `ExternalCalendarEvent` keeps stable import identities. `EmailOutbox`, `AuditEvent`, `OwnerMembership`, `AuthSession`, `RateLimitCounter`, `ProcessedWebhook`, and `WorkerHeartbeat` support operations.

The worker claims rows with `FOR UPDATE SKIP LOCKED`. Claims expire after two minutes. Sends have a 15-second timeout and stable provider keys. The worker makes at most eight attempts. It stops automatic retries before the provider's 24-hour key window ends. Uncertain delivery requires review. Delivery webhooks are signed and idempotent. An early failure event is reconciled with the send result. Email delivery is not exactly once.

## Calendar channels

The channel boundary is `CalendarChannelProvider`. The current iCal adapter imports external busy periods and exports private availability feeds. An import uses the external event UID as its stable identity. A repeat sync updates the existing allocation. Missing or cancelled events release their allocation. The transaction locks the studio and uses the same database overlap constraint as direct bookings.

Feed URLs use AES-256-GCM at rest. The importer accepts HTTPS URLs without credentials or custom ports. It rejects private and link-local addresses, limits redirects, uses a timeout, and limits the response size. Export feeds contain only blocked periods. They do not contain guest names, email addresses, or reservation references.

An iCal feed is a one-way availability aid. It is not a full reservation, price, content, payment, or message connection.

## Content and display

Static facts and photo descriptions are in `src/content`. They are safe fallbacks. Full Control content in PostgreSQL can replace the public introduction, story, location summary, studio text, amenities, gallery, and featured photo. Prices and availability always come from PostgreSQL. Owner uploads are rotated, resized, converted to WebP, and saved through a storage-provider boundary. Local storage is for development only.

The public pages use Server Components. React Aria supplies dates and dialogs. The design uses local fonts and optimized WebP photos. Mobile layouts stack fields and content. Wide layouts limit text and photo width.

No guest account system, payment processor, message broker, Booking.com partner connection, Airbnb partner connection, or separate backend is included. These features need a separate business requirement and, where applicable, provider approval.

`ChannelManagerProvider` is the small future channel boundary. `BookingComChannelProvider` and `AirbnbChannelProvider` extend it. Their current implementations report `MANUAL_ONLY` and make no network calls. The reservation domain does not import provider-specific types.
