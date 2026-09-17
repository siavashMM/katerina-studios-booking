"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "@/features/booking/ui/http";

type Calendar = {
  id: string;
  name: string;
  accommodation: { name: string };
  lastSyncedAt: string | null;
  lastError: string | null;
};
type Studio = { id: string; name: string };

export function IcalSettings({
  calendars,
  studios,
  enabled,
}: {
  calendars: Calendar[];
  studios: Studio[];
  enabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !enabled) return;
    const form = event.currentTarget;
    setBusy(true);
    setMessage("");
    try {
      await mutate("/api/admin/channels/ical", Object.fromEntries(new FormData(form)));
      form.reset();
      setMessage("iCal feed connected. Select Sync now to import dates.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The iCal feed could not be connected.");
    } finally {
      setBusy(false);
    }
  }
  async function sync(id: string) {
    setBusy(true);
    setMessage("");
    try {
      const result = await mutate<{ eventCount: number }>(
        `/api/admin/channels/ical/${id}/sync`,
        {},
      );
      setMessage(`${result.eventCount} iCal events processed.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The iCal feed could not be synced.");
    } finally {
      setBusy(false);
    }
  }
  async function disconnect(id: string) {
    if (!confirm("Disconnect this iCal feed? Imported date blocks will be released.")) return;
    setBusy(true);
    setMessage("");
    try {
      await mutate(`/api/admin/channels/ical/${id}`, undefined, "DELETE");
      setMessage("iCal feed disconnected.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "The iCal feed could not be disconnected.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="admin-card">
      <h2>iCal feeds</h2>
      <p>Private feed URLs are encrypted. Imported events block the selected studio.</p>
      {!enabled ? (
        <p className="notice notice-error">Set ICAL_ENCRYPTION_KEY to connect a feed.</p>
      ) : null}
      <form className="admin-form ical-connect" onSubmit={connect}>
        <div className="form-grid">
          <label className="field">
            Feed name
            <input name="name" required maxLength={100} disabled={!enabled} />
          </label>
          <label className="field">
            Studio
            <select name="accommodationId" required disabled={!enabled}>
              {studios.map((studio) => (
                <option value={studio.id} key={studio.id}>
                  {studio.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          Private ICS URL
          <input type="url" name="url" required placeholder="https://…" disabled={!enabled} />
        </label>
        <button className="button button-small" type="submit" disabled={busy || !enabled}>
          Connect feed
        </button>
      </form>
      {message ? (
        <p role="status" className="notice">
          {message}
        </p>
      ) : null}
      <div className="channel-list">
        {calendars.map((calendar) => (
          <article key={calendar.id}>
            <div>
              <h3>{calendar.name}</h3>
              <p>
                {calendar.accommodation.name} ·{" "}
                {calendar.lastSyncedAt
                  ? `Last sync: ${new Date(calendar.lastSyncedAt).toLocaleString()}`
                  : "Not synced"}
              </p>
            </div>
            <div className="header-actions">
              <button
                className="button button-small button-secondary"
                disabled={busy}
                onClick={() => sync(calendar.id)}
              >
                Sync now
              </button>
              <button
                className="text-button danger"
                disabled={busy}
                onClick={() => disconnect(calendar.id)}
              >
                Disconnect
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
