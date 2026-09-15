import { cookies } from "next/headers";
import Link from "next/link";
import { NewIntent } from "@/features/booking/ui/new-intent";
import { bookingService } from "@/features/booking/server";
import { PriceSummary } from "@/features/booking/ui/booking-flow";
import type { BookingReceipt } from "@/features/booking/contracts/booking";
import type { Metadata } from "next";
import { getServerTranslation } from "@/i18n/server";
import "../booking.css";

export async function generateMetadata(): Promise<Metadata> {
  const { Translate } = await getServerTranslation();
  return { title: Translate.meta.pages.received.title, robots: { index: false, follow: false } };
}

export default async function ReceivedPage() {
  const { Translate } = await getServerTranslation();
  const cookie = (await cookies()).get("ks_receipt")?.value;
  let receipt: BookingReceipt | null = null;
  if (cookie) {
    const separator = cookie.indexOf(".");
    if (separator > 0) {
      try {
        receipt = await bookingService().getReceipt(
          cookie.slice(0, separator),
          cookie.slice(separator + 1),
        );
      } catch {
        /* Never reveal details for an invalid receipt. */
      }
    }
  }
  if (!receipt)
    return (
      <main id="main-content" className="container booking-page">
        <div className="page-heading">
          <p className="eyebrow">{Translate.booking.receipt.eyebrow}</p>
          <h1>{Translate.booking.receipt.unavailable}</h1>
          <p>{Translate.booking.receipt.expired}</p>
          <Link href="/booking" className="button">
            {Translate.booking.receipt.plan}
          </Link>
        </div>
      </main>
    );
  return (
    <main id="main-content" className="container booking-page receipt-page">
      <section>
        <p className="eyebrow">
          {receipt.status === "CONFIRMED"
            ? Translate.booking.receipt.confirmedEyebrow
            : Translate.booking.receipt.receivedEyebrow}
        </p>
        <h1>
          {receipt.status === "CONFIRMED"
            ? Translate.booking.receipt.confirmed
            : receipt.status === "CANCELLED"
              ? Translate.booking.receipt.cancelled
              : receipt.status === "COMPLETED"
                ? Translate.booking.receipt.completed
                : Translate.booking.receipt.thanks}
        </h1>
        <p className="receipt-reference">
          {Translate.booking.receipt.reference} <strong>{receipt.reference}</strong>
        </p>
        <p>
          {receipt.status === "PENDING"
            ? Translate.booking.receipt.pending
            : Translate.booking.receipt.keepReference}
        </p>
        {receipt.demo ? (
          <div className="notice">{Translate.booking.receipt.demo}</div>
        ) : (
          <p>{Translate.booking.receipt.emailDelay}</p>
        )}
        <Link className="text-link" href="/">
          {Translate.booking.receipt.return} →
        </Link>
        <p>
          <NewIntent />
        </p>
      </section>
      <aside className="booking-summary">
        <PriceSummary quote={receipt} />
      </aside>
    </main>
  );
}
