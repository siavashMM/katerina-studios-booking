"use client";

import { useState, type FormEvent } from "react";
import { mutate } from "@/features/booking/ui/http";

type Accommodation = {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  maxGuests: number;
  beds: string;
  amenities: string[];
  active: boolean;
};

export function AccommodationEditor({ accommodation }: { accommodation: Accommodation }) {
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
        `/api/admin/accommodations/${accommodation.id}`,
        {
          name: values.get("name"),
          shortDescription: values.get("shortDescription"),
          fullDescription: values.get("fullDescription"),
          maxGuests: Number(values.get("maxGuests")),
          beds: values.get("beds"),
          amenities: String(values.get("amenities") ?? "")
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
          active: values.get("active") === "on",
        },
        "PUT",
      );
      setMessage("Studio information saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The studio could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="admin-card admin-form" onSubmit={save}>
      <h2>{accommodation.name}</h2>
      <label className="field">
        Name
        <input name="name" required maxLength={120} defaultValue={accommodation.name} />
      </label>
      <label className="field">
        Short description
        <textarea
          name="shortDescription"
          rows={3}
          maxLength={600}
          defaultValue={accommodation.shortDescription}
        />
      </label>
      <label className="field">
        Full description
        <textarea
          name="fullDescription"
          rows={6}
          maxLength={6000}
          defaultValue={accommodation.fullDescription}
        />
      </label>
      <div className="form-grid">
        <label className="field">
          Maximum guests
          <input
            type="number"
            name="maxGuests"
            min="1"
            max="20"
            defaultValue={accommodation.maxGuests}
            required
          />
        </label>
        <label className="field">
          Beds
          <input name="beds" maxLength={200} defaultValue={accommodation.beds} />
        </label>
      </div>
      <label className="field">
        Amenities <span className="field-help">Enter one item on each line.</span>
        <textarea name="amenities" rows={6} defaultValue={accommodation.amenities.join("\n")} />
      </label>
      <label className="checkbox-field">
        <input type="checkbox" name="active" defaultChecked={accommodation.active} />
        <span>Show this studio and accept new requests. Clear this option to archive it.</span>
      </label>
      {message ? (
        <p className="notice" role="status">
          {message}
        </p>
      ) : null}
      <button className="button" disabled={busy} type="submit">
        {busy ? "Saving…" : "Save studio"}
      </button>
    </form>
  );
}
