import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ownerForPage } from "@/features/admin/page-auth";
import { AdminNav } from "@/features/admin/ui/admin-nav";
import { ReservationActions } from "@/features/admin/ui/reservation-actions";
import { adminService } from "@/features/booking/server";
import { todayInAthens, dateOnly } from "@/features/booking/domain/rules";
import { getServerTranslation } from "@/i18n/server";
import { reservationPriceDetails } from "@/features/admin/domain/price-snapshot";

const sourceLabels: Record<string, string> = {
  DIRECT: "Direct",
  MANUAL: "Manual",
  BOOKING_COM: "Booking.com",
  AIRBNB: "Airbnb",
  ICAL: "iCal",
  PHONE: "Phone",
  EMAIL: "Email",
  OTHER: "Other",
};

export default async function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const [owner, { Translate, t, formatDate, formatCurrency }] = await Promise.all([
    ownerForPage(),
    getServerTranslation(),
  ]);
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) notFound();
  const service = adminService();
  const row = await service.getReservation(owner, parsed.data).catch((error: unknown) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "NOT_FOUND"
    )
      notFound();
    throw error;
  });
  const context = await service.getPortalContext(owner);
  const accommodationName =
    row.accommodation.name === "Demo Studio A"
      ? Translate.studios.items["demo-studio-a"].name
      : row.accommodation.name === "Demo Studio B"
        ? Translate.studios.items["demo-studio-b"].name
        : row.accommodation.name;
  const priceDetails = reservationPriceDetails(row.priceSnapshot, row.subtotalCents);
  return (
    <>
      <AdminNav fullControl={context.property.portalPlan === "FULL_CONTROL"} />
      <main id="main-content" className="admin-main">
        <Link className="text-link" href="/admin/reservations">
          ← {Translate.admin.detail.all}
        </Link>
        <div className="admin-heading">
          <p className="eyebrow">{accommodationName}</p>
          <h1>{row.reference}</h1>
          <span className={`status status-${row.status.toLowerCase()}`}>
            {Translate.admin.statuses[row.status]}
          </span>
        </div>
        <div className="admin-detail-grid">
          <section className="admin-card">
            <h2>{Translate.admin.detail.stay}</h2>
            <dl className="admin-data">
              <div>
                <dt>{Translate.admin.detail.checkIn}</dt>
                <dd>{formatDate(dateOnly(row.checkIn))}</dd>
              </div>
              <div>
                <dt>{Translate.admin.detail.checkOut}</dt>
                <dd>{formatDate(dateOnly(row.checkOut))}</dd>
              </div>
              <div>
                <dt>{Translate.admin.detail.guestsNights}</dt>
                <dd>
                  {row.guests} / {row.nights}
                </dd>
              </div>
              <div>
                <dt>Nightly amount</dt>
                <dd>
                  {priceDetails.nightlyPrices.length
                    ? [
                        ...new Set(
                          priceDetails.nightlyPrices.map((item) =>
                            formatCurrency(item.amountCents),
                          ),
                        ),
                      ].join(", ")
                    : Translate.admin.detail.notProvided}
                </dd>
              </div>
              <div>
                <dt>Stay amount</dt>
                <dd>{formatCurrency(priceDetails.subtotalCents)}</dd>
              </div>
              {priceDetails.supplements.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{formatCurrency(item.amountCents)}</dd>
                </div>
              ))}
              <div>
                <dt>{Translate.admin.detail.total}</dt>
                <dd>{formatCurrency(row.totalCents)}</dd>
              </div>
              <div>
                <dt>{Translate.admin.detail.payment}</dt>
                <dd>{Translate.admin.detail.cash}</dd>
              </div>
              <div>
                <dt>{Translate.admin.detail.arrival}</dt>
                <dd>{row.arrivalTime || Translate.admin.detail.notProvided}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{sourceLabels[row.source] ?? row.source}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDate(row.createdAt, { dateStyle: "medium", timeStyle: "short" })}</dd>
              </div>
            </dl>
            <h3>{Translate.admin.detail.guest}</h3>
            <p>
              {row.firstName} {row.lastName}
            </p>
            <p className="wrap-anywhere">
              <a href={`mailto:${row.email}`}>{row.email}</a>
            </p>
            <p>{row.phone || Translate.admin.detail.noPhone}</p>
            {row.country ? <p>{row.country}</p> : null}
            {row.specialRequests ? (
              <>
                <h3>{Translate.admin.detail.requests}</h3>
                <p className="guest-message">{row.specialRequests}</p>
              </>
            ) : null}
            <p className="small-copy">
              {t(Translate.admin.detail.policyAccepted, {
                date: formatDate(row.policyAcceptedAt, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              })}
            </p>
            {row.externalChannelsCheckedAt ? (
              <p className="small-copy">
                {t(Translate.admin.detail.channelsChecked, {
                  date: formatDate(row.externalChannelsCheckedAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }),
                })}
              </p>
            ) : null}
          </section>
          <ReservationActions
            id={row.id}
            status={row.status}
            canComplete={dateOnly(row.checkOut) <= todayInAthens(new Date())}
          />
        </div>
        <section className="admin-card">
          <h2>{Translate.admin.detail.email}</h2>
          <ul className="event-list">
            {row.emails.map((email) => (
              <li key={email.id}>
                <span>
                  {Translate.admin.events[email.kind as keyof typeof Translate.admin.events] ??
                    email.kind.replaceAll("_", " ").toLowerCase()}
                </span>
                <span>
                  {Translate.admin.statuses[email.status]} ·{" "}
                  {t(Translate.admin.detail.attempt, { count: email.attempts })}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="admin-card">
          <h2>{Translate.admin.detail.activity}</h2>
          <ul className="event-list">
            {row.audits.map((event) => (
              <li key={event.id}>
                <span>
                  {Translate.admin.events[event.action as keyof typeof Translate.admin.events] ??
                    event.action.replaceAll("_", " ").toLowerCase()}
                </span>
                <time>
                  {formatDate(event.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                </time>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
