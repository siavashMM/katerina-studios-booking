"use client";
import Link from "next/link";
import { useTranslation } from "@/i18n/client";
export function NewIntent() {
  const { Translate } = useTranslation();
  return (
    <Link
      href="/booking"
      className="text-link"
      onClick={() => {
        try {
          sessionStorage.removeItem("ks-booking-intent-v1");
        } catch {
          /* Storage is optional. */
        }
      }}
    >
      {Translate.booking.receipt.newRequest} →
    </Link>
  );
}
