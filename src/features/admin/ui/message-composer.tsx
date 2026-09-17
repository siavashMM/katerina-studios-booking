"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "@/features/booking/ui/http";

export function MessageComposer({
  reservationId,
  guestName,
}: {
  reservationId: string;
  guestName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setMessage("");
    try {
      await mutate(`/api/admin/reservations/${reservationId}/messages`, {
        idempotencyKey: crypto.randomUUID(),
        subject: values.get("subject"),
        message: values.get("message"),
      });
      form.reset();
      setMessage("The message is queued for delivery.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The message could not be queued.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="message-composer" onSubmit={send}>
      <h3>Send an email</h3>
      <p>Send a booking message to {guestName}.</p>
      <label className="field">
        Subject
        <input name="subject" required maxLength={160} />
      </label>
      <label className="field">
        Message
        <textarea name="message" required maxLength={5000} rows={5} />
      </label>
      {message ? (
        <p role="status" className="notice">
          {message}
        </p>
      ) : null}
      <button className="button button-small" disabled={busy} type="submit">
        {busy ? "Queuing…" : "Send email"}
      </button>
    </form>
  );
}
