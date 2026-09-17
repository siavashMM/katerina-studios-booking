/* eslint-disable @next/next/no-html-link-for-pages -- Auth endpoints require full navigation. */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSelector } from "@/i18n/language-selector";

const links = [
  ["/admin/reservations", "Bookings", "book"],
  ["/admin/calendar", "Calendar", "calendar"],
  ["/admin/messages", "Messages", "message"],
  ["/admin/notifications", "Email status", "notification"],
  ["/admin/availability", "Blocked dates", "block"],
  ["/admin/property", "Property", "home"],
  ["/admin/photos", "Photos", "photo"],
  ["/admin/rates", "Pricing", "rate"],
  ["/admin/settings", "Settings", "settings"],
] as const;

function NavIcon({ name }: { name: (typeof links)[number][2] }) {
  const paths = {
    book: (
      <>
        <path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3Z" />
        <path d="M8 4.5V20M11.5 9h4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18" />
      </>
    ),
    message: <path d="M4 5.5h16v11H9l-5 4Z" />,
    notification: (
      <>
        <path d="M5 6h14v12H5Z" />
        <path d="m5 7 7 6 7-6" />
      </>
    ),
    block: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m6 18 12-12" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M6 10v11h12V10M10 21v-6h4v6" />
      </>
    ),
    photo: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="m3 17 5-4 4 3 3-2 6 4" />
      </>
    ),
    rate: (
      <>
        <path d="M4 7h16M4 12h16M4 17h10" />
        <circle cx="18" cy="17" r="2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export function AdminNav({ fullControl = true }: { fullControl?: boolean }) {
  const pathname = usePathname();
  const visibleLinks = fullControl
    ? links
    : links.filter(
        ([href]) => !["/admin/property", "/admin/photos", "/admin/rates"].includes(href),
      );
  return (
    <aside className="owner-sidebar">
      <Link className="owner-brand" href="/" aria-label="Katerina Studios website">
        <span className="owner-brand-mark" aria-hidden="true">
          KS
        </span>
        <span>
          Katerina Studios<small>Owner portal</small>
        </span>
      </Link>
      <nav aria-label="Owner navigation">
        {visibleLinks.map(([href, label, icon]) => (
          <div className={href === "/admin/property" ? "nav-section-start" : ""} key={href}>
            {href === "/admin/property" ? <p className="nav-section-label">Full Control</p> : null}
            <Link
              href={href}
              aria-label={label}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
            >
              <NavIcon name={icon} />
              <span>{label}</span>
            </Link>
          </div>
        ))}
      </nav>
      <div className="owner-sidebar-footer">
        <LanguageSelector />
        <a href="/auth/logout">Log out</a>
      </div>
    </aside>
  );
}
