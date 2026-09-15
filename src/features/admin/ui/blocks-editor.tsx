"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "@/features/booking/ui/http";
import { useTranslation } from "@/i18n/client";

export function BlocksEditor({
  studios,
  blocks,
}: {
  studios: { id: string; name: string }[];
  blocks: { id: string; studio: string; start: string; end: string; reason: string }[];
}) {
  const { Translate, formatDate } = useTranslation();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setBusy(true);
    setMessage("");
    try {
      await mutate("/api/admin/blocks", Object.fromEntries(fields));
      form.reset();
      setMessage(Translate.admin.blocks.created);
      router.refresh();
    } catch {
      setMessage(Translate.admin.blocks.createError);
    } finally {
      setBusy(false);
    }
  }
  async function release(id: string) {
    setBusy(true);
    setMessage("");
    try {
      await mutate(`/api/admin/blocks/${id}`, undefined, "DELETE");
      setMessage(Translate.admin.blocks.removed);
      router.refresh();
    } catch {
      setMessage(Translate.admin.blocks.removeError);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {message ? (
        <p className="notice" role="status">
          {message}
        </p>
      ) : null}
      <form onSubmit={create} className="admin-card admin-form">
        <h2>{Translate.admin.blocks.title}</h2>
        <label className="field">
          {Translate.admin.blocks.studio}
          <select name="accommodationId" required>
            {studios.map((studio) => (
              <option key={studio.id} value={studio.id}>
                {studio.name}
              </option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          <label className="field">
            {Translate.admin.blocks.firstBlocked}
            <input name="checkIn" type="date" required />
          </label>
          <label className="field">
            {Translate.admin.blocks.firstAvailable}
            <input name="checkOut" type="date" required />
          </label>
        </div>
        <label className="field">
          {Translate.admin.blocks.reason}
          <input
            name="reason"
            maxLength={300}
            required
            placeholder={Translate.admin.blocks.placeholder}
          />
        </label>
        <button className="button" type="submit" disabled={busy}>
          {Translate.admin.blocks.action}
        </button>
      </form>
      <section className="admin-card">
        <h2>{Translate.admin.blocks.active}</h2>
        {blocks.length ? (
          <ul className="block-list">
            {blocks.map((block) => (
              <li key={block.id}>
                <div>
                  <strong>{block.studio}</strong>
                  <p>
                    {formatDate(block.start)} → {formatDate(block.end)}
                  </p>
                  <p>{block.reason}</p>
                </div>
                <button className="text-button" disabled={busy} onClick={() => release(block.id)}>
                  {Translate.admin.blocks.remove}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>{Translate.admin.blocks.empty}</p>
        )}
      </section>
    </>
  );
}
