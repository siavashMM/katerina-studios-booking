# Owner portal

The owner portal uses the existing `/admin` route. It keeps the public Katerina Studios design system, but it uses a denser workspace layout. It does not copy Lodgify branding, icons, colors, or assets.

## Plans

| Capability                                           | Owner Control | Full Control |
| ---------------------------------------------------- | ------------- | ------------ |
| View, search, confirm, cancel, and complete bookings | Yes           | Yes          |
| Add manual bookings and record their source          | Yes           | Yes          |
| View reservation and block calendar                  | Yes           | Yes          |
| Send guest email and view outbound history           | Yes           | Yes          |
| Add and remove blocked dates                         | Yes           | Yes          |
| Edit property and studio content                     | No            | Yes          |
| Upload, order, describe, and feature photos          | No            | Yes          |
| Edit minimum stay, base prices, and seasonal prices  | No            | Yes          |
| Configure iCal feeds                                 | No            | Yes          |

The server checks the plan for every protected operation. The route, page, and API cannot grant more access than the active owner membership and property plan allow.

## Routes

| Route                  | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| `/admin/reservations`  | Booking list, filters, selected booking, and actions |
| `/admin/calendar`      | Month calendar and mobile agenda                     |
| `/admin/messages`      | Outbound email history and guest message composer    |
| `/admin/availability`  | Manual blocked dates                                 |
| `/admin/property`      | Full Control property and studio content             |
| `/admin/photos`        | Full Control photo manager                           |
| `/admin/rates`         | Full Control stay rules, base prices, and seasons    |
| `/admin/settings`      | Plan and channel status, iCal import and export      |
| `/admin/notifications` | Email worker and delivery status                     |

The layout uses a compact desktop sidebar, a tablet icon rail, and a mobile top navigation row. The active route has a clear state. All icon controls have accessible names.

## Reservation workflow

1. A direct website request creates a `PENDING` reservation. Pending requests do not occupy inventory.
2. The owner reviews the guest, dates, price, source, notes, and policy snapshot.
3. The owner checks external channels and selects the acknowledgement.
4. Confirmation creates an allocation in the same database transaction. The database rejects an overlap.
5. Cancellation releases the allocation. Completion is available after check-out.
6. Each state change adds an audit event and an idempotent email event.

The booking list shows guest name, studio, stay dates, nights, guest count, status, source, and creation date. Search values stay in the request body and do not put guest data in the URL.

## Manual bookings

Select `Add booking` from bookings or the calendar. The three steps collect:

1. Studio, check-in, check-out, guest count, and source.
2. Guest name, email, phone, country, language, and internal notes.
3. Optional total price, payment method, and confirmation-email choice.

A manual booking is confirmed at creation and occupies dates immediately. The server checks current availability and capacity inside the transaction. The idempotency key stops a repeat submit from creating a second booking. A price can be unknown. Unknown is different from EUR 0.

Sources are Direct, Manual, Booking.com, Airbnb, iCal, Phone, Email, and Other. A source label records where the owner learned about the booking. It does not prove an API connection.

## Calendar and iCal

The owner calendar shows pending, confirmed, completed, manual block, and imported external periods. Desktop uses a seven-column month. Small screens use an agenda.

An imported iCal event creates one external allocation. Its feed UID is the stable identity. Repeat sync updates the same record. A cancelled or missing event releases the allocation. The external URL is encrypted at rest.

The private export endpoint publishes occupied periods for one studio. It does not publish guest data. iCal does not synchronize prices, payments, messages, or full reservation data.

## Messages and email

Messages is an email workspace. It does not simulate an inbound chat. The history shows system email and owner-written outbound email. Each queued event has a delivery state and, after provider acceptance, a provider ID.

The important subjects are:

- `New booking request - Katerina Studios`
- `Booking request received - Katerina Studios`
- `Reservation confirmed - Katerina Studios`
- `Reservation cancelled - Katerina Studios`

The guest acknowledgement says that the request is not confirmed. The confirmation states the amount due in cash on arrival.

Use the Gmail smoke-test procedure in [docs/OPERATIONS.md](docs/OPERATIONS.md). Keep the real owner and guest addresses in the private `.env` file only.

## Full Control website editing

Property content includes introduction, story, contact details, location summary, times, arrival instructions, amenities, and policies. Studio content includes name, short and full descriptions, capacity, beds, amenities, and active state.

Archive a studio instead of deleting it. Historical reservations remain linked. The application does not let capacity fall below a historical reservation.

Owner photos need alt text. The owner can set their order, studio assignment, and featured-photo state. Public pages read managed content and photos from PostgreSQL. Existing static content remains as a fallback for empty fields or unavailable CMS data.

Local file storage is a development adapter. Production needs durable object storage that implements `MediaStorageProvider`.

## Channel status

Direct website booking is native. iCal supports availability import and private availability export. Booking.com and Airbnb are manual-only until approved partner access exists.

Official provider requirements can change. Review the current [Booking.com Connectivity documentation](https://developers.booking.com/connectivity/docs) and [Airbnb API terms](https://www.airbnb.com/help/article/3418) before you plan a direct connection.

## Security and data rules

- Auth0 login needs a current MFA proof and an active owner membership.
- Owner mutations need same-origin and CSRF checks, rate limits, schema validation, and server authorization.
- PostgreSQL exclusion constraints are the final double-booking control.
- Money uses integer cents. Check-out is an exclusive date.
- Receipt links use an opaque token. Reservation references alone cannot read guest data.
- Email and iCal work use stable idempotency keys.
- Guest data must not enter logs, source control, test records, screenshots, or URLs.
- Every sensitive change creates an audit event.

## Future extensions

Keep new channels behind provider interfaces. Add a provider only after credentials, approval, data scopes, webhook rules, rate limits, retry rules, reconciliation, and deletion duties are known. Use the same normalized reservation source and inventory allocation model. Do not bypass the overlap constraint.
