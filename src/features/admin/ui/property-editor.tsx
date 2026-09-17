"use client";

import { useState, type FormEvent } from "react";
import { mutate } from "@/features/booking/ui/http";

export type PropertyEditorValue = {
  introduction: string;
  story: string;
  contactEmail: string;
  contactPhone: string;
  locationSummary: string;
  checkIn: string;
  checkOut: string;
  arrivalInstructions: string;
  amenities: string[];
  policies: string[];
};

export function PropertyEditor({ initial }: { initial: PropertyEditorValue }) {
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
        "/api/admin/property",
        {
          introduction: values.get("introduction"),
          story: values.get("story"),
          contactEmail: values.get("contactEmail"),
          contactPhone: values.get("contactPhone"),
          locationSummary: values.get("locationSummary"),
          checkIn: values.get("checkIn"),
          checkOut: values.get("checkOut"),
          arrivalInstructions: values.get("arrivalInstructions"),
          amenities: String(values.get("amenities") ?? "")
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
          policies: String(values.get("policies") ?? "")
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
        },
        "PUT",
      );
      setMessage("Property content saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The content could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="content-editor" onSubmit={save}>
      <section className="admin-card">
        <h2>Property introduction</h2>
        <label className="field">
          Introduction
          <textarea
            name="introduction"
            rows={5}
            maxLength={4000}
            defaultValue={initial.introduction}
          />
        </label>
        <label className="field">
          Our story
          <textarea name="story" rows={7} maxLength={8000} defaultValue={initial.story} />
        </label>
      </section>
      <section className="admin-card">
        <h2>Contact and location</h2>
        <div className="form-grid">
          <label className="field">
            Contact email
            <input type="email" name="contactEmail" defaultValue={initial.contactEmail} />
          </label>
          <label className="field">
            Contact phone
            <input type="tel" name="contactPhone" defaultValue={initial.contactPhone} />
          </label>
        </div>
        <label className="field">
          Location summary
          <textarea
            name="locationSummary"
            rows={4}
            maxLength={3000}
            defaultValue={initial.locationSummary}
          />
        </label>
      </section>
      <section className="admin-card">
        <h2>Stay information</h2>
        <div className="form-grid">
          <label className="field">
            Check-in information
            <input name="checkIn" maxLength={80} defaultValue={initial.checkIn} />
          </label>
          <label className="field">
            Check-out information
            <input name="checkOut" maxLength={80} defaultValue={initial.checkOut} />
          </label>
        </div>
        <label className="field">
          Arrival instructions
          <textarea
            name="arrivalInstructions"
            rows={5}
            maxLength={5000}
            defaultValue={initial.arrivalInstructions}
          />
        </label>
      </section>
      <section className="admin-card">
        <h2>Amenities and policies</h2>
        <p className="field-help">Enter one item on each line.</p>
        <div className="form-grid">
          <label className="field">
            Amenities
            <textarea name="amenities" rows={8} defaultValue={initial.amenities.join("\n")} />
          </label>
          <label className="field">
            Policies
            <textarea name="policies" rows={8} defaultValue={initial.policies.join("\n")} />
          </label>
        </div>
      </section>
      {message ? (
        <p className="notice" role="status">
          {message}
        </p>
      ) : null}
      <button className="button" disabled={busy} type="submit">
        {busy ? "Saving…" : "Save content"}
      </button>
    </form>
  );
}
