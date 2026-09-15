"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Button, Dialog, Modal, ModalOverlay } from "react-aria-components";
import { ArrowIcon, CloseIcon, LeafIcon, MenuIcon } from "@/components/ui/icons";
import { useTranslation } from "@/i18n/client";
import { LanguageSelector } from "@/i18n/language-selector";

const navigation = [
  { href: "/studios", label: "studios" },
  { href: "/about", label: "about" },
  { href: "/gallery", label: "gallery" },
  { href: "/location", label: "location" },
  { href: "/reviews", label: "reviews" },
] as const;

export function Wordmark({ artwork = false }: { artwork?: boolean }) {
  const { Translate } = useTranslation();
  if (artwork) {
    return (
      <span className="home-brand-mark" aria-hidden="true">
        <Image
          className="home-brand-image home-brand-image-full"
          src="/brand/katerina-studios-logo.png"
          width={1823}
          height={724}
          sizes="(max-width: 1199px) 240px, 280px"
          quality={85}
          fetchPriority="high"
          alt=""
        />
        <Image
          className="home-brand-image home-brand-image-text"
          src="/brand/katerina-studios-wordmark.png"
          width={790}
          height={316}
          sizes="150px"
          quality={85}
          fetchPriority="high"
          alt=""
        />
      </span>
    );
  }

  return (
    <span className="wordmark">
      <span>Katerina</span>
      <span className="wordmark-small">STUDIOS · {Translate.common.corfu}</span>
    </span>
  );
}

export function SiteHeader({ overlayHero = false }: { overlayHero?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { Translate } = useTranslation();
  return (
    <header className={`site-header container${overlayHero ? " site-header-home" : ""}`}>
      <Link href="/" className="brand-link" aria-label={Translate.common.brandHome}>
        <Wordmark artwork={overlayHero} />
      </Link>
      <nav className="desktop-navigation" aria-label={Translate.nav.main}>
        {navigation.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname.startsWith(href) ? "page" : undefined}
          >
            {Translate.nav[label]}
          </Link>
        ))}
      </nav>
      <LanguageSelector />
      <Link
        href="/booking"
        className="button button-small header-booking"
        aria-label={Translate.common.checkAvailability}
      >
        {Translate.nav.availability} <ArrowIcon />
      </Link>
      <Button
        className="icon-button mobile-menu-button"
        aria-label={Translate.nav.openMenu}
        onPress={() => setOpen(true)}
      >
        <MenuIcon />
      </Button>
      <ModalOverlay
        className="navigation-overlay"
        isOpen={open}
        onOpenChange={setOpen}
        isDismissable
      >
        <Modal className="navigation-modal">
          <Dialog aria-label={Translate.nav.main} className="navigation-dialog">
            <div className="navigation-top">
              <Wordmark />
              <Button
                autoFocus
                className="icon-button"
                aria-label={Translate.nav.closeMenu}
                onPress={() => setOpen(false)}
              >
                <CloseIcon />
              </Button>
            </div>
            <nav className="mobile-navigation" aria-label={Translate.nav.mobile}>
              <Link href="/" onClick={() => setOpen(false)}>
                {Translate.nav.home} <ArrowIcon />
              </Link>
              {navigation.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname.startsWith(href) ? "page" : undefined}
                >
                  {Translate.nav[label]} <ArrowIcon />
                </Link>
              ))}
            </nav>
            <LanguageSelector mobile />
            <p className="eyebrow">{Translate.common.location}</p>
            <Link href="/booking" className="button" onClick={() => setOpen(false)}>
              {Translate.common.checkAvailability} <ArrowIcon />
            </Link>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </header>
  );
}

export function SiteFooter() {
  const { Translate } = useTranslation();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div>
            <Link href="/" className="brand-link" aria-label={Translate.common.brandHome}>
              <Wordmark />
            </Link>
            <p>
              {Translate.common.locationShort} <br />
              {Translate.common.location.split(", ").at(-1)}
            </p>
          </div>
          <div className="footer-note">
            <LeafIcon width={30} height={30} />
            <p>{Translate.shell.footerNote}</p>
          </div>
          <nav aria-label={Translate.nav.footer}>
            <Link href="/studios">{Translate.nav.studios}</Link>
            <Link href="/gallery">{Translate.nav.gallery}</Link>
            <Link href="/location">{Translate.nav.location}</Link>
            <Link href="/about">{Translate.nav.about}</Link>
            <Link href="/reviews">{Translate.nav.reviews}</Link>
            <Link href="/booking">{Translate.nav.booking}</Link>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>Katerina Studios</span>
          <nav aria-label={Translate.nav.policies}>
            <Link href="/privacy">{Translate.nav.privacy}</Link>
            <Link href="/terms">{Translate.nav.terms}</Link>
            <Link href="/cancellation">{Translate.nav.cancellation}</Link>
          </nav>
          <div className="footer-utility-links">
            <Link href="/website-plans" className="owner-link">
              {Translate.nav.websitePlans} <ArrowIcon width={14} height={14} />
            </Link>
            <Link href="/admin" className="owner-link">
              {Translate.nav.owner} <ArrowIcon width={14} height={14} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function PublicSiteChrome({ demo, home }: { demo: boolean; home: boolean }) {
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const { Translate } = useTranslation();

  useEffect(() => {
    if (!home) return;

    const sentinel = document.querySelector("[data-header-sentinel]");
    if (!sentinel) return;

    const observer = new IntersectionObserver(([entry]) =>
      setHeaderScrolled(!entry.isIntersecting),
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [home]);

  const className = home
    ? `site-chrome site-chrome-home ${headerScrolled ? "chrome-solid" : "chrome-overlay"}`
    : "site-chrome";

  return (
    <div
      className={className}
      data-header-state={home ? (headerScrolled ? "solid" : "overlay") : undefined}
    >
      {demo ? (
        <div className="demo-banner">
          <span className="demo-dot" aria-hidden="true" />
          <strong>{Translate.shell.demoTitle}</strong>
          <span>{Translate.shell.demoText}</span>
        </div>
      ) : null}
      <SiteHeader overlayHero={home} />
    </div>
  );
}

export function SiteShell({ children, demo }: { children: ReactNode; demo: boolean }) {
  const pathname = usePathname();
  const [pastSearch, setPastSearch] = useState(false);
  const home = pathname === "/";
  const { Translate } = useTranslation();

  useEffect(() => {
    const search = document.querySelector(".home-search");
    if (!search) return;
    const observer = new IntersectionObserver(([entry]) =>
      setPastSearch(!entry.isIntersecting && entry.boundingClientRect.bottom < 0),
    );
    observer.observe(search);
    return () => observer.disconnect();
  }, [pathname]);

  const admin = pathname.startsWith("/admin") || pathname.startsWith("/auth");
  const discovery =
    pathname === "/" ||
    pathname.startsWith("/studios") ||
    pathname === "/about" ||
    pathname === "/gallery" ||
    pathname === "/location" ||
    pathname === "/reviews";
  if (admin) return <>{children}</>;

  return (
    <div className={discovery ? "public-site with-mobile-cta" : "public-site"}>
      <a href="#main-content" className="skip-link">
        {Translate.nav.skip}
      </a>
      <PublicSiteChrome key={pathname} demo={demo} home={home} />
      {children}
      <SiteFooter />
      {discovery && (pathname !== "/" || pastSearch) ? (
        <div className="mobile-booking-bar">
          <span>{Translate.shell.mobilePrompt}</span>
          <Link href="/booking" className="button button-small">
            {Translate.common.checkAvailability} <ArrowIcon />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
