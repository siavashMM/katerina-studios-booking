import type { Metadata } from "next";
import { BookingFlow } from "@/features/booking/ui/booking-flow";
import { getServerTranslation } from "@/i18n/server";
import "./booking.css";

export async function generateMetadata(): Promise<Metadata> {
  const { Translate } = await getServerTranslation();
  return { title: Translate.meta.pages.booking.title, robots: { index: false, follow: false } };
}

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { Translate } = await getServerTranslation();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Athens",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const checkIn =
    typeof params.checkIn === "string" && params.checkIn.length <= 10 ? params.checkIn : "";
  const checkOut =
    typeof params.checkOut === "string" && params.checkOut.length <= 10 ? params.checkOut : "";
  const guests =
    typeof params.guests === "string" && ["1", "2", "3", "4"].includes(params.guests)
      ? Number(params.guests)
      : 2;
  return (
    <main id="main-content" className="container booking-page">
      <div className="page-heading">
        <p className="eyebrow">{Translate.booking.eyebrow}</p>
        <h1>{Translate.booking.title}</h1>
        <p>{Translate.booking.introduction}</p>
      </div>
      <BookingFlow initial={{ checkIn, checkOut, guests }} today={today} />
    </main>
  );
}
