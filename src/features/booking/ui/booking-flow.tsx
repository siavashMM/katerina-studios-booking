"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  AvailabilityResult,
  BookingQuote,
  BookingReceipt,
  BookingRequestInput,
} from "../contracts/booking";
import { StayPicker } from "./stay-picker";
import { ApiRequestError, mutate } from "./http";
import { useTranslation } from "@/i18n/client";

type Guest = BookingRequestInput["guest"];
const emptyGuest: Guest = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  arrivalTime: "",
  specialRequests: "",
};
const intentStorage = "ks-booking-intent-v1";

export function PriceSummary({ quote }: { quote: BookingQuote }) {
  const { Translate, t, formatDate, formatCurrency } = useTranslation();
  const accommodationName =
    quote.demo && quote.accommodationName === "Demo Studio A"
      ? Translate.studios.items["demo-studio-a"].name
      : quote.demo && quote.accommodationName === "Demo Studio B"
        ? Translate.studios.items["demo-studio-b"].name
        : quote.accommodationName;
  const prices = new Map<number, number>();
  for (const night of quote.nightlyPrices)
    prices.set(night.amountCents, (prices.get(night.amountCents) ?? 0) + 1);
  return (
    <div className="price-summary">
      <p className="eyebrow">{Translate.booking.summary.eyebrow}</p>
      <h2>{accommodationName}</h2>
      {quote.demo ? <p className="sample-label">{Translate.booking.summary.sample}</p> : null}
      <dl className="stay-summary">
        <div>
          <dt>{Translate.booking.summary.checkIn}</dt>
          <dd>{formatDate(quote.checkIn)}</dd>
        </div>
        <div>
          <dt>{Translate.booking.summary.checkOut}</dt>
          <dd>{formatDate(quote.checkOut)}</dd>
        </div>
        <div>
          <dt>{Translate.booking.summary.guests}</dt>
          <dd>{quote.guests}</dd>
        </div>
        <div>
          <dt>{Translate.booking.summary.nights}</dt>
          <dd>{quote.nights}</dd>
        </div>
      </dl>
      <div className="price-lines">
        {[...prices].map(([price, count]) => (
          <p key={price}>
            <span>
              {t(Translate.common.night, { count })} × {formatCurrency(price)}
            </span>
            <span>{formatCurrency(price * count)}</span>
          </p>
        ))}
        {quote.supplements.map((item) => (
          <p key={item.label}>
            <span>{item.label}</span>
            <span>{formatCurrency(item.amountCents)}</span>
          </p>
        ))}
      </div>
      <div className="price-total">
        <span>{Translate.booking.summary.total}</span>
        <strong>{formatCurrency(quote.totalCents)}</strong>
      </div>
      <p className="cash-note">{Translate.booking.summary.cash}</p>
      <p className="small-copy">{Translate.booking.summary.confirmation}</p>
    </div>
  );
}

export function BookingFlow({
  initial,
  today,
}: {
  initial: { checkIn: string; checkOut: string; guests: number };
  today: string;
}) {
  const { Translate, t, formatDate, formatCurrency } = useTranslation();
  const router = useRouter();
  const [stay, setStay] = useState(initial);
  const [step, setStep] = useState(0);
  const [quotes, setQuotes] = useState<BookingQuote[]>([]);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<BookingQuote | null>(null);
  const [guest, setGuest] = useState<Guest>(emptyGuest);
  const [accepted, setAccepted] = useState(false);
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");
  const [canStartNew, setCanStartNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const intentKey = useRef<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  function localizedError(cause: unknown, fallback: string) {
    if (cause instanceof ApiRequestError && cause.code in Translate.booking.errors)
      return Translate.booking.errors[cause.code as keyof typeof Translate.booking.errors];
    return fallback;
  }

  function goTo(next: number) {
    setStep(next);
    setError("");
    requestAnimationFrame(() => heading.current?.focus());
  }
  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams({
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        guests: String(stay.guests),
      });
      const response = await fetch(`/api/availability?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok)
        throw new ApiRequestError(
          data.error?.code ?? "REQUEST_FAILED",
          data.error?.message ?? Translate.booking.errors.availability,
        );
      setQuotes((data as AvailabilityResult).quotes);
      setSearched(true);
      setSelected(null);
      if ((data as AvailabilityResult).quotes.length) goTo(1);
    } catch (cause) {
      setError(localizedError(cause, Translate.booking.errors.availabilityShort));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  function updateGuest(field: keyof Guest, value: string) {
    setGuest((previous) => ({ ...previous, [field]: value }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !accepted || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      if (!intentKey.current) {
        try {
          if (sessionStorage.getItem(`${intentStorage}-complete`) !== "true")
            intentKey.current = sessionStorage.getItem(intentStorage);
          sessionStorage.removeItem(`${intentStorage}-complete`);
        } catch {
          /* Storage can be disabled. */
        }
        if (!intentKey.current) intentKey.current = crypto.randomUUID();
        try {
          sessionStorage.setItem(intentStorage, intentKey.current);
        } catch {
          /* The in-memory key still protects retries. */
        }
      }
      const input: BookingRequestInput = {
        accommodationId: selected.accommodationId,
        checkIn: selected.checkIn,
        checkOut: selected.checkOut,
        guests: selected.guests,
        quoteFingerprint: selected.fingerprint,
        idempotencyKey: intentKey.current,
        guest,
        policyAccepted: true,
      };
      await mutate<{ receipt: BookingReceipt }>("/api/booking-requests", {
        ...input,
        ...(website ? { website } : {}),
      });
      try {
        sessionStorage.setItem(`${intentStorage}-complete`, "true");
      } catch {
        /* The request is already saved. */
      }
      router.push("/booking/received");
      router.refresh();
    } catch (cause) {
      setCanStartNew(
        cause instanceof ApiRequestError &&
          ["IDEMPOTENCY_CONFLICT", "QUOTE_CHANGED", "UNAVAILABLE"].includes(cause.code),
      );
      setError(localizedError(cause, Translate.booking.errors.save));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  function startNew() {
    intentKey.current = crypto.randomUUID();
    try {
      sessionStorage.setItem(intentStorage, intentKey.current);
    } catch {
      /* Storage is optional. */
    }
    setAccepted(false);
    goTo(0);
  }

  return (
    <div className="booking-flow">
      <ol className="booking-progress" aria-label={Translate.booking.stepsLabel}>
        {Translate.booking.steps.map((label, index) => (
          <li
            key={label}
            aria-current={step === index ? "step" : undefined}
            className={step >= index ? "is-current" : ""}
          >
            <span>{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <div className={`booking-columns ${selected && step > 1 ? "has-summary" : ""}`}>
        <section className="booking-panel" aria-busy={busy}>
          <h2 ref={heading} tabIndex={-1} className="booking-step-heading">
            {Translate.booking.headings[step]}
          </h2>
          {error ? (
            <div role="alert" className="form-error">
              {error}
            </div>
          ) : null}
          {step === 0 ? (
            <form onSubmit={search} className="booking-form">
              <StayPicker
                checkIn={stay.checkIn}
                checkOut={stay.checkOut}
                today={today}
                onChange={(checkIn, checkOut) =>
                  setStay((value) => ({ ...value, checkIn, checkOut }))
                }
              />
              <label className="field">
                {Translate.booking.guests}
                <select
                  name="guests"
                  value={stay.guests}
                  onChange={(event) =>
                    setStay((value) => ({ ...value, guests: Number(event.target.value) }))
                  }
                >
                  {[1, 2, 3, 4].map((count) => (
                    <option key={count} value={count}>
                      {t(Translate.common.guest, { count })}
                    </option>
                  ))}
                </select>
              </label>
              <p className="small-copy">{Translate.booking.oneStudio}</p>
              <button className="button" disabled={busy} type="submit">
                {busy ? Translate.booking.checking : Translate.common.checkAvailability}
                <span aria-hidden="true">→</span>
              </button>
              {searched && !quotes.length ? (
                <div className="notice" role="status">
                  {Translate.booking.noneAvailable}
                </div>
              ) : null}
            </form>
          ) : null}
          {step === 1 ? (
            <div>
              <p className="booking-dates">
                {formatDate(stay.checkIn)} — {formatDate(stay.checkOut)} ·{" "}
                {t(Translate.common.guest, { count: stay.guests })}
              </p>
              <div className="studio-options">
                {quotes.map((quote) => (
                  <article className="studio-option" key={quote.accommodationId}>
                    <div>
                      <p className="eyebrow">
                        {quote.demo
                          ? Translate.booking.demoAccommodation
                          : Translate.booking.studio}
                      </p>
                      <h3>
                        {quote.demo && quote.accommodationName === "Demo Studio A"
                          ? Translate.studios.items["demo-studio-a"].name
                          : quote.demo && quote.accommodationName === "Demo Studio B"
                            ? Translate.studios.items["demo-studio-b"].name
                            : quote.accommodationName}
                      </h3>
                      <p>
                        {t(Translate.common.night, { count: quote.nights })} ·{" "}
                        {t(Translate.common.guest, { count: quote.guests })}
                      </p>
                    </div>
                    <div className="studio-option-price">
                      <strong>{formatCurrency(quote.totalCents)}</strong>
                      <span>{Translate.booking.totalCash}</span>
                      <button
                        className="button button-secondary"
                        onClick={() => {
                          setSelected(quote);
                          setAccepted(false);
                          goTo(2);
                        }}
                      >
                        {t(Translate.booking.selectStudio, {
                          name:
                            quote.demo && quote.accommodationName === "Demo Studio A"
                              ? Translate.studios.items["demo-studio-a"].name
                              : quote.demo && quote.accommodationName === "Demo Studio B"
                                ? Translate.studios.items["demo-studio-b"].name
                                : quote.accommodationName,
                        })}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <button className="text-button" onClick={() => goTo(0)}>
                ← {Translate.booking.changeDates}
              </button>
            </div>
          ) : null}
          {step === 2 ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                goTo(3);
              }}
              className="booking-form"
            >
              <p>{Translate.booking.contactIntro}</p>
              <div className="form-grid">
                <label className="field">
                  {Translate.booking.firstName}
                  <input
                    autoComplete="given-name"
                    name="firstName"
                    required
                    maxLength={80}
                    value={guest.firstName}
                    onChange={(event) => updateGuest("firstName", event.target.value)}
                  />
                </label>
                <label className="field">
                  {Translate.booking.lastName}
                  <input
                    autoComplete="family-name"
                    name="lastName"
                    required
                    maxLength={80}
                    value={guest.lastName}
                    onChange={(event) => updateGuest("lastName", event.target.value)}
                  />
                </label>
              </div>
              <label className="field">
                {Translate.booking.email}
                <input
                  aria-label={Translate.booking.email}
                  aria-describedby="email-help"
                  name="email"
                  autoComplete="email"
                  type="email"
                  required
                  maxLength={254}
                  value={guest.email}
                  onChange={(event) => updateGuest("email", event.target.value)}
                />
                <span id="email-help" className="field-help">
                  {Translate.booking.emailHelp}
                </span>
              </label>
              <div className="form-grid">
                <label className="field">
                  {Translate.booking.phone}
                  <input
                    name="phone"
                    autoComplete="tel"
                    type="tel"
                    maxLength={40}
                    value={guest.phone}
                    onChange={(event) => updateGuest("phone", event.target.value)}
                  />
                </label>
                <label className="field">
                  {Translate.booking.country}
                  <input
                    name="country"
                    autoComplete="country-name"
                    maxLength={80}
                    value={guest.country}
                    onChange={(event) => updateGuest("country", event.target.value)}
                  />
                </label>
              </div>
              <label className="field">
                {Translate.booking.arrivalTime}
                <input
                  type="time"
                  name="arrivalTime"
                  value={guest.arrivalTime}
                  onChange={(event) => updateGuest("arrivalTime", event.target.value)}
                />
                <span className="field-help">{Translate.booking.arrivalHelp}</span>
              </label>
              <label className="field">
                {Translate.booking.requests}
                <textarea
                  name="specialRequests"
                  rows={4}
                  maxLength={1000}
                  value={guest.specialRequests}
                  onChange={(event) => updateGuest("specialRequests", event.target.value)}
                />
                <span className="field-help">{Translate.booking.requestsHelp}</span>
              </label>
              <div className="honeypot" aria-hidden="true">
                <label>
                  {Translate.booking.honeypot}
                  <input
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                  />
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="text-button" onClick={() => goTo(1)}>
                  ← {Translate.booking.changeStudio}
                </button>
                <button type="submit" className="button">
                  {Translate.booking.reviewRequest} <span aria-hidden="true">→</span>
                </button>
              </div>
            </form>
          ) : null}
          {step === 3 && selected ? (
            <form onSubmit={submit} className="booking-form">
              <div className="review-contact">
                <h3>{Translate.booking.contactDetails}</h3>
                <p>
                  {guest.firstName} {guest.lastName}
                </p>
                <p className="wrap-anywhere">{guest.email}</p>
                {guest.phone ? <p>{guest.phone}</p> : null}
                {guest.arrivalTime ? (
                  <p>{t(Translate.booking.expectedArrival, { time: guest.arrivalTime })}</p>
                ) : null}
                {guest.specialRequests ? (
                  <p className="guest-message">{guest.specialRequests}</p>
                ) : null}
                <button className="text-button" type="button" onClick={() => goTo(2)}>
                  {Translate.booking.editDetails}
                </button>
              </div>
              <div className="policy-panel">
                <h3>{Translate.booking.beforeSend}</h3>
                <p>
                  {selected.demo ? Translate.booking.demoPolicySummary : selected.policy.summary}
                </p>
                <p>{Translate.booking.noHold}</p>
                <p>{Translate.booking.payment}</p>
              </div>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  required
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                />
                <span>
                  {Translate.booking.acceptStart}{" "}
                  <Link href="/terms" target="_blank">
                    {Translate.booking.bookingTerms}
                  </Link>{" "}
                  {Translate.booking.and}{" "}
                  <Link href="/cancellation" target="_blank">
                    {Translate.booking.cancellationPolicy}
                  </Link>
                  . {Translate.booking.privacyLead}{" "}
                  <Link href="/privacy" target="_blank">
                    {Translate.booking.privacyNotice}
                  </Link>
                  .
                </span>
              </label>
              <button type="submit" className="button" disabled={busy || !accepted}>
                {busy ? Translate.booking.sending : Translate.booking.send}
                <span aria-hidden="true">→</span>
              </button>
              <p className="small-copy">{Translate.booking.requestOnly}</p>
              {error && canStartNew ? (
                <button type="button" className="text-button" onClick={startNew}>
                  {Translate.booking.startNew}
                </button>
              ) : null}
            </form>
          ) : null}
        </section>
        {selected && step > 1 ? (
          <aside className="booking-summary">
            <PriceSummary quote={selected} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
