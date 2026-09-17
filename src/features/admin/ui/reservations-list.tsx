"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { reservationSearchSchema, type ReservationListItem } from "../contracts/reservations";
import { mutate } from "@/features/booking/ui/http";
import { useTranslation } from "@/i18n/client";
import { AdminNav } from "./admin-nav";
import { ManualBooking } from "./manual-booking";
import { ReservationActions } from "./reservation-actions";
import type { ReservationPriceDetails } from "../domain/price-snapshot";

type Studio = { id: string; name: string; maxGuests: number };
export type SelectedReservation = ReservationListItem & {
  email: string;
  phone: string | null;
  country: string | null;
  preferredLanguage: string | null;
  arrivalTime: string | null;
  internalNotes: string | null;
  specialRequests: string | null;
  paymentMethod: string;
  priceIsKnown: boolean;
  priceDetails: ReservationPriceDetails;
  canComplete: boolean;
};

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

export function ReservationsList({
  initialRows,
  selected,
  studios,
  fullControl,
}: {
  initialRows: ReservationListItem[];
  selected: SelectedReservation | null;
  studios: Studio[];
  fullControl: boolean;
}) {
  const { Translate, formatDate, formatCurrency } = useTranslation();
  const [results, setResults] = useState<ReservationListItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const rows = results ?? initialRows;

  async function searchRows(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const input = reservationSearchSchema.parse({
        search: form.get("search") || undefined,
        ...(form.get("status") ? { status: form.get("status") } : {}),
      });
      const response = await mutate<{ rows: ReservationListItem[] }>(
        "/api/admin/reservations/search",
        input,
      );
      setResults(response.rows);
    } catch {
      setError("The search failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AdminNav fullControl={fullControl} />
      <main id="main-content" className="admin-main admin-main-workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Owner bookings</p>
            <h1>Reservations</h1>
          </div>
          <ManualBooking studios={studios} />
        </header>
        <div className="booking-workspace">
          <section className="booking-list-pane" aria-label="Booking list">
            <form className="booking-tools" onSubmit={searchRows}>
              <label className="search-field">
                <span className="sr-only">Search</span>
                <input name="search" placeholder="Search guest or reference" maxLength={100} />
              </label>
              <label>
                <span className="sr-only">Status</span>
                <select name="status" defaultValue="">
                  <option value="">All statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </label>
              <button
                className="icon-button"
                type="submit"
                aria-label="Apply filters"
                disabled={busy}
              >
                ⌕
              </button>
            </form>
            {error ? (
              <p className="notice notice-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="booking-list">
              {rows.map((row) => (
                <Link
                  className={`booking-list-item${selected?.id === row.id ? " is-selected" : ""}`}
                  href={`/admin/reservations?selected=${row.id}`}
                  aria-label={row.reference}
                  key={row.id}
                >
                  <div className="booking-list-top">
                    <strong>
                      {row.firstName} {row.lastName}
                    </strong>
                    <span className={`status status-${row.status.toLowerCase()}`}>
                      {Translate.admin.statuses[
                        row.status as keyof typeof Translate.admin.statuses
                      ] ?? row.status}
                    </span>
                  </div>
                  <span className="booking-studio">{row.accommodation.name}</span>
                  <div className="booking-list-meta">
                    <span>
                      {formatDate(new Date(row.checkIn))} – {formatDate(new Date(row.checkOut))}
                    </span>
                    <span>
                      {row.nights} nights · {row.guests} guests
                    </span>
                  </div>
                  <div className="booking-list-foot">
                    <span className={`source-badge source-${row.source.toLowerCase()}`}>
                      {sourceLabels[row.source] ?? row.source}
                    </span>
                    <time>{formatDate(new Date(row.createdAt))}</time>
                  </div>
                </Link>
              ))}
              {!rows.length ? (
                <div className="admin-empty">
                  <strong>No bookings found.</strong>
                  <p>Change the filters or add a booking.</p>
                </div>
              ) : null}
            </div>
          </section>
          <section className="booking-detail-pane" aria-label="Selected booking">
            {selected ? (
              <>
                <div className="detail-title-row">
                  <div>
                    <div className="detail-badges">
                      <span className={`status status-${selected.status.toLowerCase()}`}>
                        {Translate.admin.statuses[
                          selected.status as keyof typeof Translate.admin.statuses
                        ] ?? selected.status}
                      </span>
                      <span className="source-badge">
                        {sourceLabels[selected.source] ?? selected.source}
                      </span>
                    </div>
                    <h2>
                      {selected.firstName} {selected.lastName}
                    </h2>
                    <p>
                      {selected.accommodation.name} · {selected.reference}
                    </p>
                  </div>
                  <Link className="text-link" href={`/admin/reservations/${selected.id}`}>
                    Full record
                  </Link>
                </div>
                <div className="stay-summary-grid">
                  <div>
                    <span>Check-in</span>
                    <strong>{formatDate(new Date(selected.checkIn))}</strong>
                    <small>{selected.arrivalTime || "Arrival time not provided"}</small>
                  </div>
                  <div>
                    <span>Check-out</span>
                    <strong>{formatDate(new Date(selected.checkOut))}</strong>
                    <small>{selected.nights} nights</small>
                  </div>
                  <div>
                    <span>Guests</span>
                    <strong>{selected.guests}</strong>
                    <small>{selected.preferredLanguage || "Language not provided"}</small>
                  </div>
                </div>
                <section className="detail-section">
                  <h3>Guest</h3>
                  <dl className="compact-data">
                    <div>
                      <dt>Email</dt>
                      <dd>
                        <a href={`mailto:${selected.email}`}>{selected.email}</a>
                      </dd>
                    </div>
                    <div>
                      <dt>Phone</dt>
                      <dd>{selected.phone || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt>Country</dt>
                      <dd>{selected.country || "Not provided"}</dd>
                    </div>
                  </dl>
                </section>
                <section className="detail-section">
                  <h3>Booking</h3>
                  <dl className="compact-data">
                    <div>
                      <dt>Status</dt>
                      <dd>
                        {Translate.admin.statuses[
                          selected.status as keyof typeof Translate.admin.statuses
                        ] ?? selected.status}
                      </dd>
                    </div>
                    <div>
                      <dt>Source</dt>
                      <dd>{sourceLabels[selected.source] ?? selected.source}</dd>
                    </div>
                    <div>
                      <dt>Created</dt>
                      <dd>{formatDate(new Date(selected.createdAt))}</dd>
                    </div>
                  </dl>
                </section>
                <section className="detail-section">
                  <h3>Price</h3>
                  <dl className="compact-data">
                    <div>
                      <dt>Nightly amount</dt>
                      <dd>
                        {selected.priceDetails.nightlyPrices.length
                          ? [
                              ...new Set(
                                selected.priceDetails.nightlyPrices.map((item) =>
                                  formatCurrency(item.amountCents),
                                ),
                              ),
                            ].join(", ")
                          : "Not recorded"}
                      </dd>
                    </div>
                    <div>
                      <dt>Stay amount</dt>
                      <dd>
                        {selected.priceIsKnown
                          ? formatCurrency(selected.priceDetails.subtotalCents)
                          : "Not recorded"}
                      </dd>
                    </div>
                    {selected.priceDetails.supplements.map((item) => (
                      <div key={item.label}>
                        <dt>{item.label}</dt>
                        <dd>{formatCurrency(item.amountCents)}</dd>
                      </div>
                    ))}
                    <div>
                      <dt>Total</dt>
                      <dd>
                        {selected.priceIsKnown
                          ? formatCurrency(selected.totalCents)
                          : "Not recorded"}
                      </dd>
                    </div>
                    <div>
                      <dt>Payment</dt>
                      <dd>
                        {selected.paymentMethod === "CASH_ON_ARRIVAL"
                          ? "Cash on arrival"
                          : selected.paymentMethod}
                      </dd>
                    </div>
                  </dl>
                </section>
                {selected.specialRequests || selected.internalNotes ? (
                  <section className="detail-section">
                    <h3>Notes</h3>
                    {selected.specialRequests ? <p>{selected.specialRequests}</p> : null}
                    {selected.internalNotes ? (
                      <p className="internal-note">Internal: {selected.internalNotes}</p>
                    ) : null}
                  </section>
                ) : null}
                <ReservationActions
                  id={selected.id}
                  status={selected.status}
                  canComplete={selected.canComplete}
                />
              </>
            ) : (
              <div className="empty-detail">
                <h2>Select a booking</h2>
                <p>Guest and stay details will appear here.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
