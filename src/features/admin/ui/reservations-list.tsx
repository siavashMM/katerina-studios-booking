"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AdminNav } from "./admin-nav";
import { reservationSearchSchema, type ReservationListItem } from "../contracts/reservations";
import { mutate } from "@/features/booking/ui/http";
import { useTranslation } from "@/i18n/client";
const statusSchema = reservationSearchSchema.shape.status.unwrap();
export function ReservationsList({ initialRows }: { initialRows: ReservationListItem[] }) {
  const { Translate, t, formatDate, formatCurrency, formatNumber } = useTranslation();
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
        search: form.get("search"),
        ...(form.get("status") ? { status: form.get("status") } : {}),
      });
      const response = await mutate<{ rows: ReservationListItem[] }>(
        "/api/admin/reservations/search",
        input,
      );
      setResults(response.rows);
    } catch {
      setError(Translate.admin.reservations.searchError);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <AdminNav />
      <main id="main-content" className="admin-main">
        <div className="admin-heading">
          <p className="eyebrow">{Translate.admin.nav.area}</p>
          <h1>{Translate.admin.reservations.title}</h1>
          <p>{Translate.admin.reservations.text}</p>
        </div>
        <form className="admin-filters" onSubmit={searchRows}>
          <label className="field">
            {Translate.admin.reservations.search}
            <input
              name="search"
              placeholder={Translate.admin.reservations.placeholder}
              maxLength={100}
              defaultValue=""
            />
          </label>
          <label className="field">
            {Translate.admin.reservations.status}
            <select name="status" defaultValue="">
              <option value="">{Translate.admin.reservations.allStatuses}</option>
              {statusSchema.options.map((value) => (
                <option value={value} key={value}>
                  {Translate.admin.statuses[value]}
                </option>
              ))}
            </select>
          </label>
          <button className="button" type="submit" disabled={busy}>
            {Translate.admin.reservations.apply}
          </button>
        </form>
        {error ? (
          <p role="alert" className="notice">
            {error}
          </p>
        ) : null}
        {rows.length ? (
          <div className="reservation-table">
            <table>
              <caption className="sr-only">{Translate.admin.reservations.caption}</caption>
              <thead>
                <tr>
                  <th scope="col">{Translate.admin.reservations.referenceGuest}</th>
                  <th scope="col">{Translate.admin.reservations.studio}</th>
                  <th scope="col">{Translate.admin.reservations.stay}</th>
                  <th scope="col">{Translate.admin.reservations.total}</th>
                  <th scope="col">{Translate.admin.reservations.status}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td data-label={Translate.admin.reservations.referenceGuest}>
                      <Link href={`/admin/reservations/${row.id}`}>{row.reference}</Link>
                      <span>
                        {row.firstName} {row.lastName}
                      </span>
                    </td>
                    <td data-label={Translate.admin.reservations.studio}>
                      {row.accommodation.name === "Demo Studio A"
                        ? Translate.studios.items["demo-studio-a"].name
                        : row.accommodation.name === "Demo Studio B"
                          ? Translate.studios.items["demo-studio-b"].name
                          : row.accommodation.name}
                    </td>
                    <td data-label={Translate.admin.reservations.stay}>
                      {formatDate(new Date(row.checkIn))} — {formatDate(new Date(row.checkOut))}
                      <span>
                        {t(Translate.common.guest, { count: row.guests })} ·{" "}
                        {t(Translate.common.night, { count: row.nights })}
                      </span>
                    </td>
                    <td data-label={Translate.admin.reservations.total}>
                      {formatCurrency(row.totalCents)}
                    </td>
                    <td data-label={Translate.admin.reservations.status}>
                      <span className={`status status-${row.status.toLowerCase()}`}>
                        {Translate.admin.statuses[
                          row.status as keyof typeof Translate.admin.statuses
                        ] ?? row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty">
            <h2>{Translate.admin.reservations.emptyTitle}</h2>
            <p>{Translate.admin.reservations.emptyText}</p>
          </div>
        )}
        <p className="small-copy">
          {t(Translate.admin.reservations.shown, { count: formatNumber(rows.length) })}
        </p>
      </main>
    </>
  );
}
