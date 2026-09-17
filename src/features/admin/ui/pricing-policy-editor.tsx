"use client";

import { useState, type FormEvent } from "react";
import { mutate } from "@/features/booking/ui/http";

export function PricingPolicyEditor({
  minimumStay,
  maximumStay,
}: {
  minimumStay: number;
  maximumStay: number;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      await mutate(
        "/api/admin/pricing-policy",
        { minimumStay: Number(values.get("minimumStay")) },
        "PUT",
      );
      setMessage("Minimum stay saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The minimum stay could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-card admin-form" onSubmit={save}>
      <h2>Stay rule</h2>
      <p>Set the minimum number of nights for a direct booking.</p>
      <label className="field">
        Minimum stay (nights)
        <input
          name="minimumStay"
          type="number"
          min="1"
          max={maximumStay}
          defaultValue={minimumStay}
          required
        />
      </label>
      <p className="field-help">The current maximum stay is {maximumStay} nights.</p>
      {message ? (
        <p role="status" className="notice">
          {message}
        </p>
      ) : null}
      <button className="button" type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save stay rule"}
      </button>
    </form>
  );
}
