/* eslint-disable @next/next/no-html-link-for-pages -- Auth endpoints require full browser navigation. */
"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/client";
import { LanguageSelector } from "@/i18n/language-selector";

export function AdminNav() {
  const { Translate } = useTranslation();
  return (
    <header className="admin-header">
      <Link href="/" className="admin-brand">
        Katerina Studios <span>{Translate.admin.nav.area}</span>
      </Link>
      <LanguageSelector />
      <nav aria-label={Translate.admin.nav.label}>
        <Link href="/admin/reservations">{Translate.admin.nav.reservations}</Link>
        <Link href="/admin/availability">{Translate.admin.nav.blocks}</Link>
        <Link href="/admin/rates">{Translate.admin.nav.rates}</Link>
        <Link href="/admin/notifications">{Translate.admin.nav.email}</Link>
        <a href="/auth/logout">{Translate.admin.nav.logout}</a>
      </nav>
    </header>
  );
}
