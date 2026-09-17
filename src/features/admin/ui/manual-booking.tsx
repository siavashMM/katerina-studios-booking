"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from "react-aria-components";
import { mutate } from "@/features/booking/ui/http";

type Studio = { id: string; name: string; maxGuests: number };

export function ManualBooking({ studios }: { studios: Studio[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState<Record<string, FormDataEntryValue>>({});
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDetails((current) => ({
      ...current,
      ...Object.fromEntries(new FormData(event.currentTarget)),
    }));
    setStep((current) => current + 1);
  }

  async function submit(event: FormEvent<HTMLFormElement>, close: () => void) {
    event.preventDefault();
    if (busy) return;
    const values = { ...details, ...Object.fromEntries(new FormData(event.currentTarget)) };
    setBusy(true);
    setError("");
    try {
      const result = await mutate<{ id: string }>("/api/admin/reservations/manual", {
        idempotencyKey,
        accommodationId: values.accommodationId,
        checkIn: values.checkIn,
        checkOut: values.checkOut,
        guests: Number(values.guests),
        source: values.source,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        ...(values.phone ? { phone: values.phone } : {}),
        ...(values.country ? { country: values.country } : {}),
        ...(values.preferredLanguage ? { preferredLanguage: values.preferredLanguage } : {}),
        ...(values.internalNotes ? { internalNotes: values.internalNotes } : {}),
        ...(values.total ? { totalCents: Math.round(Number(values.total) * 100) } : {}),
        sendConfirmation: values.sendConfirmation === "on",
      });
      close();
      setStep(1);
      setDetails({});
      setIdempotencyKey(crypto.randomUUID());
      router.push(`/admin/reservations?selected=${result.id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The booking could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogTrigger>
      <Button className="button button-small">Add booking</Button>
      <ModalOverlay className="admin-modal-overlay" isDismissable={!busy}>
        <Modal className="admin-modal admin-modal-wide">
          <Dialog>
            {({ close }) => (
              <>
                <div className="modal-title-row">
                  <div>
                    <p className="eyebrow">Step {step} of 3</p>
                    <Heading slot="title">Add a booking</Heading>
                  </div>
                  <Button className="icon-button" aria-label="Close" onPress={close}>
                    ×
                  </Button>
                </div>
                <div className="step-track" aria-label={`Step ${step} of 3`}>
                  {[1, 2, 3].map((number) => (
                    <span className={number <= step ? "is-active" : ""} key={number} />
                  ))}
                </div>
                {error ? (
                  <p className="notice notice-error" role="alert">
                    {error}
                  </p>
                ) : null}
                {step === 1 ? (
                  <form className="admin-form" onSubmit={next}>
                    <label className="field">
                      Studio
                      <select name="accommodationId" required defaultValue="">
                        <option value="" disabled>
                          Select a studio
                        </option>
                        {studios.map((studio) => (
                          <option value={studio.id} key={studio.id}>
                            {studio.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="form-grid">
                      <label className="field">
                        Check-in
                        <input type="date" name="checkIn" required />
                      </label>
                      <label className="field">
                        Check-out
                        <input type="date" name="checkOut" required />
                      </label>
                    </div>
                    <div className="form-grid">
                      <label className="field">
                        Booking source
                        <select name="source" defaultValue="MANUAL" required>
                          <option value="MANUAL">Manual</option>
                          <option value="BOOKING_COM">Booking.com</option>
                          <option value="AIRBNB">Airbnb</option>
                          <option value="PHONE">Phone</option>
                          <option value="EMAIL">Email</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </label>
                      <label className="field">
                        Guests
                        <input
                          type="number"
                          name="guests"
                          min="1"
                          max="20"
                          defaultValue="1"
                          required
                        />
                      </label>
                    </div>
                    <label className="field">
                      Internal notes
                      <textarea name="internalNotes" rows={3} maxLength={2000} />
                    </label>
                    <div className="modal-actions">
                      <Button className="button button-secondary" onPress={close}>
                        Cancel
                      </Button>
                      <button className="button" type="submit">
                        Continue
                      </button>
                    </div>
                  </form>
                ) : null}
                {step === 2 ? (
                  <form className="admin-form" onSubmit={next}>
                    <div className="form-grid">
                      <label className="field">
                        First name
                        <input name="firstName" autoComplete="given-name" required />
                      </label>
                      <label className="field">
                        Last name
                        <input name="lastName" autoComplete="family-name" required />
                      </label>
                    </div>
                    <label className="field">
                      Email
                      <input type="email" name="email" autoComplete="email" required />
                    </label>
                    <div className="form-grid">
                      <label className="field">
                        Phone
                        <input type="tel" name="phone" autoComplete="tel" />
                      </label>
                      <label className="field">
                        Country
                        <input name="country" autoComplete="country-name" />
                      </label>
                    </div>
                    <label className="field">
                      Preferred language
                      <input name="preferredLanguage" placeholder="For example: English" />
                    </label>
                    <div className="modal-actions">
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => setStep(1)}
                      >
                        Back
                      </button>
                      <button className="button" type="submit">
                        Continue
                      </button>
                    </div>
                  </form>
                ) : null}
                {step === 3 ? (
                  <form className="admin-form" onSubmit={(event) => submit(event, close)}>
                    <label className="field">
                      Total (EUR){" "}
                      <span className="field-help">
                        Leave this empty if the price is not known.
                      </span>
                      <input type="number" name="total" min="0" step="0.01" />
                    </label>
                    <p className="compact-note">Payment method: Cash on arrival</p>
                    <label className="checkbox-field">
                      <input type="checkbox" name="sendConfirmation" />
                      <span>Send a confirmation email to the guest.</span>
                    </label>
                    <div className="modal-actions">
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => setStep(2)}
                      >
                        Back
                      </button>
                      <button className="button" disabled={busy} type="submit">
                        {busy ? "Creating…" : "Create booking"}
                      </button>
                    </div>
                  </form>
                ) : null}
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}
