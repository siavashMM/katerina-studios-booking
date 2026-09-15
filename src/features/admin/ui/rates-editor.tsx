"use client";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "@/features/booking/ui/http";
import { useTranslation } from "@/i18n/client";

type Season = { startDate: string; endDate: string; priceCents: number; label: string };
export function RateEditor({
  studio,
}: {
  studio: { id: string; name: string; basePriceCents: number; seasons: Season[] };
}) {
  const { Translate, t } = useTranslation();
  const studioName =
    studio.name === "Demo Studio A"
      ? Translate.studios.items["demo-studio-a"].name
      : studio.name === "Demo Studio B"
        ? Translate.studios.items["demo-studio-b"].name
        : studio.name;
  const router = useRouter();
  const [seasons, setSeasons] = useState(studio.seasons);
  const [base, setBase] = useState((studio.basePriceCents / 100).toFixed(2));
  const [busy, setBusy] = useState(false);
  const [refreshPending, startRefresh] = useTransition();
  const [message, setMessage] = useState("");
  function update(index: number, change: Partial<Season>) {
    setSeasons((rows) => rows.map((row, i) => (i === index ? { ...row, ...change } : row)));
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await mutate(
        "/api/admin/rates",
        { accommodationId: studio.id, basePriceCents: Math.round(Number(base) * 100), seasons },
        "PUT",
      );
      setMessage(Translate.admin.rates.saved);
      startRefresh(() => router.refresh());
    } catch {
      setMessage(Translate.admin.rates.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="admin-card admin-form">
      <h2>{studioName}</h2>
      {message ? (
        <p role="status" className="notice">
          {message}
        </p>
      ) : null}
      <label className="field">
        {Translate.admin.rates.base}
        <input
          type="number"
          min="0"
          max="1000000"
          step="0.01"
          required
          value={base}
          onChange={(event) => setBase(event.target.value)}
        />
      </label>
      <h3>{Translate.admin.rates.seasonal}</h3>
      <p className="small-copy">{Translate.admin.rates.help}</p>
      {seasons.map((season, index) => (
        <fieldset className="season-row" key={index}>
          <legend>{t(Translate.admin.rates.season, { number: index + 1 })}</legend>
          <label className="field">
            {Translate.admin.rates.label}
            <input
              required
              maxLength={80}
              value={season.label}
              onChange={(event) => update(index, { label: event.target.value })}
            />
          </label>
          <div className="form-grid">
            <label className="field">
              {Translate.admin.rates.start}
              <input
                required
                type="date"
                value={season.startDate}
                onChange={(event) => update(index, { startDate: event.target.value })}
              />
            </label>
            <label className="field">
              {Translate.admin.rates.end}
              <input
                required
                type="date"
                value={season.endDate}
                onChange={(event) => update(index, { endDate: event.target.value })}
              />
            </label>
          </div>
          <label className="field">
            {Translate.admin.rates.nightly}
            <input
              required
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              value={season.priceCents / 100}
              onChange={(event) =>
                update(index, { priceCents: Math.round(Number(event.target.value) * 100) })
              }
            />
          </label>
          <button
            className="text-button danger"
            type="button"
            onClick={() => setSeasons((rows) => rows.filter((_, i) => i !== index))}
          >
            {Translate.admin.rates.remove}
          </button>
        </fieldset>
      ))}
      <div className="form-actions">
        <button
          type="button"
          className="text-button"
          onClick={() =>
            setSeasons((rows) => [
              ...rows,
              { startDate: "", endDate: "", priceCents: studio.basePriceCents, label: "" },
            ])
          }
        >
          + {Translate.admin.rates.add}
        </button>
        <button className="button" disabled={busy || refreshPending} type="submit">
          {Translate.admin.rates.save}
        </button>
      </div>
    </form>
  );
}
