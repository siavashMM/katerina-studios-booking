import type { Locale } from "@/i18n/config";

export type ProposalPlan = {
  name: string;
  tagline: string;
  price: string;
  priceNote: string;
  description: string;
  bestFor: string;
  features: readonly string[];
  operatingModelLabel: string;
  operatingModel: string;
  boundary: string;
  scopeNote?: string;
  status: string;
  action: string;
  recommended?: boolean;
};

type PlanComparisonGroup = {
  title: string;
  rows: readonly {
    feature: string;
    essential: string;
    ownerControl: string;
    fullControl: string;
  }[];
};

export type ProposalCopy = {
  meta: { title: string; description: string };
  hero: {
    eyebrow: string;
    title: string;
    introduction: string;
    recommendedLabel: string;
    recommendedPlan: string;
    recommendedPrice: string;
    recommendedText: string;
  };
  plans: {
    eyebrow: string;
    title: string;
    introduction: string;
    items: readonly ProposalPlan[];
    annualCost: string;
    bestForLabel: string;
    includesLabel: string;
  };
  revisions: {
    eyebrow: string;
    title: string;
    introduction: string;
    items: readonly string[];
    closing: string;
  };
  planComparison: {
    eyebrow: string;
    title: string;
    introduction: string;
    columns: {
      feature: string;
      essential: string;
      ownerControl: string;
      fullControl: string;
    };
    recommendedLabel: string;
    groups: readonly PlanComparisonGroup[];
  };
  runningCosts: {
    eyebrow: string;
    title: string;
    introduction: string;
    items: readonly { label: string; price: string; cadence: string; text: string }[];
    totalLabel: string;
    total: string;
    totalText: string;
    examplesTitle: string;
    examples: readonly string[];
  };
  ownership: {
    eyebrow: string;
    title: string;
    text: string;
    items: readonly string[];
  };
  comparison: {
    eyebrow: string;
    title: string;
    introduction: string;
    columns: { product: string; cost: string; goodFor: string; tradeOff: string };
    rows: readonly {
      product: string;
      cost: string;
      goodFor: string;
      tradeOff: string;
      href?: string;
    }[];
    conclusionTitle: string;
    conclusion: string;
  };
  afterLaunch: {
    eyebrow: string;
    title: string;
    introduction: string;
    items: readonly { name: string; text: string; cost: string }[];
    note: string;
  };
  additions: {
    eyebrow: string;
    title: string;
    introduction: string;
    items: readonly string[];
    quoteLabel: string;
  };
  next: {
    eyebrow: string;
    title: string;
    text: string;
    steps: readonly string[];
    closing: string;
  };
  notes: {
    title: string;
    checked: string;
    text: string;
    sourceLabel: string;
    sources: readonly { label: string; href: string }[];
    externalHint: string;
  };
};

const sources = [
  {
    label: "Shopify pricing",
    href: "https://www.shopify.com/de/preise",
  },
  {
    label: "Lodgify pricing",
    href: "https://www.lodgify.com/de/preise/",
  },
  {
    label: "Hetzner 2026 server prices",
    href: "https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/",
  },
  {
    label: "Hetzner backup pricing",
    href: "https://docs.hetzner.com/cloud/billing/faq/",
  },
  {
    label: "Hetzner Primary IP pricing",
    href: "https://docs.hetzner.com/cloud/servers/primary-ips/overview/",
  },
  {
    label: "Auth0 pricing",
    href: "https://auth0.com/pricing",
  },
  {
    label: "Resend pricing",
    href: "https://resend.com/pricing",
  },
  {
    label: "Google Maps pricing",
    href: "https://developers.google.com/maps/billing-and-pricing/pricing",
  },
] as const;

const en: ProposalCopy = {
  meta: {
    title: "Website plans",
    description:
      "A clear proposal for the Katerina Studios website, owner tools, and annual costs.",
  },
  hero: {
    eyebrow: "Website proposal · 15 September 2026",
    title: "A direct booking website that fits the way you work.",
    introduction:
      "Choose a simple long-life website, daily owner controls, or full content control. You pay once for the website. You pay the service providers each year.",
    recommendedLabel: "Recommended offer",
    recommendedPlan: "Owner Control",
    recommendedPrice: "€2,790 once",
    recommendedText:
      "This plan gives the owner control of reservations, rates, and blocked dates. It gives the best value from the app that is ready now.",
  },
  plans: {
    eyebrow: "Choose your level of control",
    title: "Three clear ways to own the website.",
    introduction:
      "Each price is a one-time website price. The annual server and domain costs are separate and are the same for each plan.",
    annualCost: "+ about €103 each year for the server, backups, and domain",
    bestForLabel: "Best for",
    includesLabel: "Package highlights",
    items: [
      {
        name: "Essential",
        tagline: "A professional direct-booking website.",
        price: "€1,490",
        priceNote: "one-time payment",
        description:
          "A professional direct-booking website with a simple booking-request workflow.",
        bestFor:
          "Owners who prefer to manage reservations manually and use developer-managed website updates.",
        features: [
          "Custom responsive property website in three languages",
          "Studio, gallery, story, location, amenity, and policy content",
          "Contact, WhatsApp, and configured Google Reviews actions",
          "Direct booking request and guest details forms",
          "Automatic owner and guest emails with cash on arrival",
          "Basic SEO, domain, SSL, and production setup",
        ],
        operatingModelLabel: "Booking workflow",
        operatingModel:
          "The guest sends a request. The owner checks availability, records the reservation, contacts the guest, and confirms it manually.",
        boundary:
          "No private owner dashboard or content editor. After 30 days, developer-managed website updates cost €65 per hour.",
        status: "Direct booking",
        action: "Choose Essential",
      },
      {
        name: "Owner Control",
        tagline: "Manage reservations from a private owner area.",
        price: "€2,790",
        priceNote: "one-time payment",
        description: "Manage daily reservations from a secure owner workspace.",
        bestFor:
          "Owners who want to manage direct reservations without developer help for daily booking work.",
        features: [
          "Everything in Essential",
          "Secure sign-in, reservation dashboard, and calendar",
          "Pending, confirmed, and cancelled reservations with guest arrival details",
          "Confirm, cancel, complete, search, and filter reservations",
          "Block dates and manage base, seasonal, and reservation status settings",
          "Email history, owner-area sending, confirmation, and cancellation emails",
          "One owner training session",
        ],
        operatingModelLabel: "Owner workflow",
        operatingModel:
          "The owner manages reservations, prices, and blocked dates directly from the private workspace.",
        boundary: "Text and photo editing is not included. These changes cost €65 per hour.",
        status: "Recommended",
        action: "Choose Owner Control",
        recommended: true,
      },
      {
        name: "Full Control",
        tagline: "Manage bookings, content, and supported channels.",
        price: "From €3,990",
        priceNote: "one-time development price",
        description:
          "Manage reservations, website content, pricing, and supported booking channels from one owner area.",
        bestFor: "Owners who want maximum control of the website and booking workflow.",
        features: [
          "Everything in Owner Control",
          "Full content area for text, studios, amenities, policies, and contact details",
          "Edit supported languages and add, replace, or reorder images",
          "Preview content changes where supported",
          "External booking-channel integration where technically supported",
          "Content editor guide, owner handover, and training",
        ],
        operatingModelLabel: "Full management",
        operatingModel:
          "The owner manages normal booking and website changes from one area. Approved APIs, iCal, or supported channel managers are used for integrations.",
        boundary:
          "Unsupported direct APIs and third-party scraping are not included. New development work is quoted separately.",
        scopeNote: "Final price depends on the booking channels and integrations you need.",
        status: "Full management",
        action: "Discuss Full Control",
      },
    ],
  },
  revisions: {
    eyebrow: "Included with every plan",
    title: "30 days to make it yours.",
    introduction:
      "All three packages include a 30-day design and content revision period. We use this time to finalize the approved website.",
    items: [
      "Layout and design details",
      "Property photos and website text",
      "Amenities and policies",
      "Contact information",
      "Booking configuration",
    ],
    closing:
      "Reasonable design and content changes are included. This is not an unlimited revision service. After 30 days, the approved website becomes the production version.",
  },
  planComparison: {
    eyebrow: "Package comparison",
    title: "Compare the plans.",
    introduction: "Choose how much of the daily work you want to manage yourself.",
    columns: {
      feature: "Feature",
      essential: "Essential",
      ownerControl: "Owner Control",
      fullControl: "Full Control",
    },
    recommendedLabel: "Recommended",
    groups: [
      {
        title: "Website",
        rows: [
          {
            feature: "Custom property website",
            essential: "Yes",
            ownerControl: "Yes",
            fullControl: "Yes",
          },
          {
            feature: "Responsive mobile, tablet, and desktop design",
            essential: "Yes",
            ownerControl: "Yes",
            fullControl: "Yes",
          },
          {
            feature: "English, Greek, and German",
            essential: "Yes",
            ownerControl: "Yes",
            fullControl: "Yes",
          },
          {
            feature: "Studio, gallery, story, and location pages",
            essential: "Yes",
            ownerControl: "Yes",
            fullControl: "Yes",
          },
          {
            feature: "Google Reviews",
            essential: "Where configured",
            ownerControl: "Where configured",
            fullControl: "Where configured",
          },
          {
            feature: "Contact and WhatsApp actions",
            essential: "Yes",
            ownerControl: "Yes",
            fullControl: "Yes",
          },
        ],
      },
      {
        title: "Booking",
        rows: [
          {
            feature: "Direct booking requests",
            essential: "Yes",
            ownerControl: "Yes",
            fullControl: "Yes",
          },
          {
            feature: "Automatic guest request email",
            essential: "Yes",
            ownerControl: "Yes",
            fullControl: "Yes",
          },
          {
            feature: "Reservation management",
            essential: "Manual",
            ownerControl: "Owner dashboard",
            fullControl: "Owner dashboard",
          },
          {
            feature: "Reservation calendar",
            essential: "No",
            ownerControl: "Yes",
            fullControl: "Yes",
          },
          {
            feature: "View guest details",
            essential: "Email",
            ownerControl: "Owner dashboard",
            fullControl: "Owner dashboard",
          },
          {
            feature: "Confirm or cancel reservations",
            essential: "Manual",
            ownerControl: "Owner dashboard",
            fullControl: "Owner dashboard",
          },
        ],
      },
      {
        title: "Owner management",
        rows: [
          {
            feature: "Block unavailable dates",
            essential: "Manual",
            ownerControl: "Owner dashboard",
            fullControl: "Owner dashboard",
          },
          {
            feature: "Manage base prices",
            essential: "Developer",
            ownerControl: "Owner dashboard",
            fullControl: "Owner dashboard",
          },
          {
            feature: "Manage seasonal prices",
            essential: "Developer",
            ownerControl: "Owner dashboard",
            fullControl: "Owner dashboard",
          },
          {
            feature: "Send booking emails",
            essential: "Manual",
            ownerControl: "Owner dashboard",
            fullControl: "Owner dashboard",
          },
          {
            feature: "Search and filter reservations",
            essential: "No",
            ownerControl: "Yes",
            fullControl: "Yes",
          },
        ],
      },
      {
        title: "Content control",
        rows: [
          {
            feature: "Edit website text",
            essential: "Developer",
            ownerControl: "Developer",
            fullControl: "Owner",
          },
          {
            feature: "Manage website photos",
            essential: "Developer",
            ownerControl: "Developer",
            fullControl: "Owner",
          },
          {
            feature: "Edit studio information",
            essential: "Developer",
            ownerControl: "Developer",
            fullControl: "Owner",
          },
          {
            feature: "Edit amenities and policies",
            essential: "Developer",
            ownerControl: "Developer",
            fullControl: "Owner",
          },
          {
            feature: "Preview content changes",
            essential: "No",
            ownerControl: "No",
            fullControl: "Yes",
          },
        ],
      },
      {
        title: "Integrations and launch",
        rows: [
          {
            feature: "External calendar integration",
            essential: "No",
            ownerControl: "No",
            fullControl: "Where supported",
          },
          {
            feature: "Booking-channel integration",
            essential: "No",
            ownerControl: "No",
            fullControl: "Where supported",
          },
          {
            feature: "30-day revision period",
            essential: "Yes",
            ownerControl: "Yes",
            fullControl: "Yes",
          },
        ],
      },
    ],
  },
  runningCosts: {
    eyebrow: "External costs",
    title: "Clear costs from independent providers.",
    introduction:
      "Third-party services are not included in the development price. These accounts stay in your name, and you pay the providers directly.",
    items: [
      {
        label: "Production server and IPv4",
        price: "€71.88",
        cadence: "per year, before VAT",
        text: "Hetzner CX23 at €5.49 per month, plus a €0.50 Primary IPv4 address. This is the recommended starting size for the website, database, and email worker.",
      },
      {
        label: "Automatic backups",
        price: "€13.18",
        cadence: "per year, before VAT",
        text: "Seven automatic server backup slots. Hetzner charges 20% of the server price.",
      },
      {
        label: "katerinacorfu.com domain",
        price: "€17.37",
        cadence: "per year, current quote",
        text: "The domain search showed the same €17.37 price for registration and renewal on 15 September 2026. Confirm availability and price before purchase.",
      },
      {
        label: "Email, owner sign-in, and maps",
        price: "€0",
        cadence: "at expected light use",
        text: "The current free usage limits should cover a small property. Usage above a provider limit is billed at cost.",
      },
    ],
    totalLabel: "Expected fixed provider total",
    total: "about €103 per year",
    totalText:
      "The calculated total is €102.43 before VAT. Monitor server use after launch and increase the server size only when the measured use requires it.",
    examplesTitle: "Other third-party fees can include",
    examples: [
      "Separate database hosting",
      "Transactional email above the free limit",
      "Google API use above the free limit",
      "Channel-manager subscriptions",
      "Paid third-party integrations",
    ],
  },
  ownership: {
    eyebrow: "Independent ownership",
    title: "Your website. Your accounts.",
    text: "Where practical, the domain, hosting, and related provider accounts are registered in the owner's name. The owner can see the invoices and control the services that keep the website online.",
    items: ["Domain", "Hosting", "Relevant provider accounts"],
  },
  comparison: {
    eyebrow: "Market comparison",
    title: "Compare the offer with standard platforms.",
    introduction:
      "Lodgify is the closest comparison because it is made for holiday rentals. Shopify is made for product sales, so it is not a direct replacement for this booking workflow.",
    columns: {
      product: "Option",
      cost: "Advertised cost",
      goodFor: "Strong point",
      tradeOff: "Trade-off",
    },
    rows: [
      {
        product: "This website · Owner Control",
        cost: "€2,790 once + about €103/year",
        goodFor: "A custom brand and a direct request workflow for one property.",
        tradeOff: "No channel sync or online card payment in the current scope.",
      },
      {
        product: "Lodgify Starter",
        cost: "$26/month with annual billing · $312/year",
        goodFor: "A website builder, rates, payments, and a unified booking calendar.",
        tradeOff: "A continuing subscription and a standard platform design.",
        href: "https://www.lodgify.com/de/preise/",
      },
      {
        product: "Lodgify Professional",
        cost: "$42/month with annual billing · $504/year",
        goodFor: "Automated messages, Google Vacation Rentals, and phone support.",
        tradeOff:
          "A higher continuing subscription for tools that a small property might not need.",
        href: "https://www.lodgify.com/de/preise/",
      },
      {
        product: "Shopify Basic",
        cost: "$29/month with annual billing · $348/year",
        goodFor: "Product sales, checkout, stock, and commerce tools.",
        tradeOff: "It is not made for accommodation availability and booking requests.",
        href: "https://www.shopify.com/de/preise",
      },
    ],
    conclusionTitle: "The honest recommendation",
    conclusion:
      "Choose Owner Control when the buyer values the custom Katerina Studios design and direct owner contact. Choose Lodgify when channel sync, online payments, or advanced rental automation is more important than a custom website.",
  },
  afterLaunch: {
    eyebrow: "After launch",
    title: "Know who manages each type of work.",
    introduction:
      "All packages include the initial 30-day revision period. The responsibilities below apply after that period.",
    items: [
      {
        name: "Essential",
        text: "The developer completes website content changes. The owner manages reservations manually.",
        cost: "Current update rate · €65 per hour",
      },
      {
        name: "Owner Control",
        text: "The owner manages reservations. The developer completes website content changes.",
        cost: "Current content rate · €65 per hour",
      },
      {
        name: "Full Control",
        text: "The owner makes normal content and booking changes. Major features and new development are separate work.",
        cost: "New development · quoted separately",
      },
    ],
    note: "Hosting, third-party services, content updates, and new technical development are separate costs.",
  },
  additions: {
    eyebrow: "Optional additions",
    title: "Add only what the property needs.",
    introduction:
      "Optional work is defined before development starts. The final scope depends on the selected service and its technical requirements.",
    items: [
      "Online card payments",
      "Additional languages",
      "Advanced analytics",
      "Additional booking integrations",
      "Advanced email automation",
      "Custom reporting",
      "Additional property websites",
    ],
    quoteLabel: "Quoted separately",
  },
  next: {
    eyebrow: "Next step",
    title: "Select the level of control.",
    text: "After the buyer selects a plan, both sides confirm one short written scope before work starts.",
    steps: [
      "Confirm the plan and the final property content.",
      "Confirm the domain, provider accounts, and invoice details.",
      "Pay 50% to start and 50% after approval, before launch.",
    ],
    closing:
      "Suggested offer: Owner Control at €2,790, plus about €103 in provider costs each year.",
  },
  notes: {
    title: "Price notes and sources",
    checked: "Provider prices and the domain quote checked on 15 September 2026.",
    text: "Website prices are proposal prices, not third-party list prices. All amounts exclude VAT if VAT applies. Provider prices and exchange rates can change. Confirm all costs before contract and purchase.",
    sourceLabel: "Official sources",
    sources,
    externalHint: " (opens in a new tab)",
  },
};

const de: ProposalCopy = {
  meta: {
    title: "Website-Pakete",
    description:
      "Ein klares Angebot für die Website, den Eigentümerbereich und die jährlichen Kosten.",
  },
  hero: {
    eyebrow: "Website-Angebot · 15. September 2026",
    title: "Eine Direktbuchungs-Website, die zu Ihrer Arbeit passt.",
    introduction:
      "Wählen Sie eine einfache, langlebige Website, tägliche Eigentümerfunktionen oder volle Kontrolle über die Inhalte. Sie bezahlen die Website einmal. Die Dienstleister bezahlen Sie jedes Jahr.",
    recommendedLabel: "Empfohlenes Angebot",
    recommendedPlan: "Eigentümer-Kontrolle",
    recommendedPrice: "2.790 € einmalig",
    recommendedText:
      "Mit diesem Paket verwaltet der Eigentümer Reservierungen, Preise und gesperrte Zeiträume. Es bietet den besten Wert aus der App, die jetzt bereit ist.",
  },
  plans: {
    eyebrow: "Wählen Sie Ihre Kontrolle",
    title: "Drei klare Wege zur eigenen Website.",
    introduction:
      "Jeder Preis ist ein einmaliger Website-Preis. Die jährlichen Server- und Domainkosten sind separat und bei jedem Paket gleich.",
    annualCost: "+ etwa 103 € pro Jahr für Server, Backups und Domain",
    bestForLabel: "Geeignet für",
    includesLabel: "Paket-Highlights",
    items: [
      {
        name: "Essential",
        tagline: "Eine professionelle Website für Direktbuchungen.",
        price: "1.490 €",
        priceNote: "einmalige Zahlung",
        description:
          "Eine professionelle Website für Direktbuchungen mit einem einfachen Ablauf für Buchungsanfragen.",
        bestFor:
          "Eigentümer, die Reservierungen manuell verwalten und Website-Änderungen vom Entwickler ausführen lassen möchten.",
        features: [
          "Eigene responsive Unterkunftswebsite in drei Sprachen",
          "Inhalte für Studios, Galerie, Geschichte, Lage, Ausstattung und Richtlinien",
          "Kontakt, WhatsApp und konfigurierte Google-Bewertungen",
          "Formulare für Buchungsanfragen und Gästedaten",
          "Automatische E-Mails für Eigentümer und Gast sowie Barzahlung bei Ankunft",
          "Grundlegende SEO-, Domain-, SSL- und Produktionseinrichtung",
        ],
        operatingModelLabel: "Buchungsablauf",
        operatingModel:
          "Der Gast sendet eine Anfrage. Der Eigentümer prüft die Verfügbarkeit, erfasst die Reservierung, kontaktiert den Gast und bestätigt sie manuell.",
        boundary:
          "Kein privater Eigentümerbereich und kein Inhaltseditor. Nach 30 Tagen kosten Website-Änderungen durch den Entwickler 65 € pro Stunde.",
        status: "Direktbuchung",
        action: "Essential wählen",
      },
      {
        name: "Eigentümer-Kontrolle",
        tagline: "Reservierungen im privaten Eigentümerbereich verwalten.",
        price: "2.790 €",
        priceNote: "einmalige Zahlung",
        description: "Verwalten Sie tägliche Reservierungen in einem sicheren Eigentümerbereich.",
        bestFor:
          "Eigentümer, die direkte Reservierungen ohne Entwicklerhilfe im täglichen Buchungsbetrieb verwalten möchten.",
        features: [
          "Alles aus Essential",
          "Sichere Anmeldung, Reservierungsübersicht und Kalender",
          "Offene, bestätigte und stornierte Reservierungen mit Ankunftsdaten",
          "Reservierungen bestätigen, stornieren, abschließen, suchen und filtern",
          "Zeiträume, Basispreise, Saisonpreise und Reservierungsstatus verwalten",
          "E-Mail-Verlauf, Versand im Eigentümerbereich sowie Bestätigungs- und Stornierungs-E-Mails",
          "Eine Schulung für den Eigentümer",
        ],
        operatingModelLabel: "Ablauf für den Eigentümer",
        operatingModel:
          "Der Eigentümer verwaltet Reservierungen, Preise und gesperrte Zeiträume direkt im privaten Bereich.",
        boundary:
          "Text- und Fotobearbeitung ist nicht enthalten. Diese Änderungen kosten 65 € pro Stunde.",
        status: "Empfohlen",
        action: "Eigentümer-Kontrolle wählen",
        recommended: true,
      },
      {
        name: "Volle Kontrolle",
        tagline: "Buchungen, Inhalte und unterstützte Kanäle verwalten.",
        price: "Ab 3.990 €",
        priceNote: "einmaliger Entwicklungspreis",
        description:
          "Verwalten Sie Reservierungen, Website-Inhalte, Preise und unterstützte Buchungskanäle in einem Eigentümerbereich.",
        bestFor: "Eigentümer, die maximale Kontrolle über Website und Buchungsablauf möchten.",
        features: [
          "Alles aus Eigentümer-Kontrolle",
          "Voller Inhaltsbereich für Texte, Studios, Ausstattung, Richtlinien und Kontaktdaten",
          "Unterstützte Sprachen bearbeiten und Bilder hinzufügen, ersetzen oder sortieren",
          "Inhaltsänderungen prüfen, wenn unterstützt",
          "Integration externer Buchungskanäle, wenn technisch unterstützt",
          "Anleitung, Übergabe und Schulung für den Inhaltseditor",
        ],
        operatingModelLabel: "Volle Verwaltung",
        operatingModel:
          "Der Eigentümer verwaltet normale Buchungs- und Website-Änderungen in einem Bereich. Integrationen verwenden genehmigte APIs, iCal oder unterstützte Channel Manager.",
        boundary:
          "Nicht unterstützte direkte APIs und das Auslesen fremder Plattformen sind nicht enthalten. Neue Entwicklungsarbeit wird separat angeboten.",
        scopeNote:
          "Der endgültige Preis hängt von den benötigten Buchungskanälen und Integrationen ab.",
        status: "Volle Verwaltung",
        action: "Volle Kontrolle besprechen",
      },
    ],
  },
  revisions: {
    eyebrow: "In jedem Paket enthalten",
    title: "30 Tage für Ihre Website.",
    introduction:
      "Alle drei Pakete enthalten 30 Tage für Design- und Inhaltsänderungen. In dieser Zeit stellen wir die freigegebene Website fertig.",
    items: [
      "Layout und Designdetails",
      "Fotos der Unterkunft und Website-Texte",
      "Ausstattung und Richtlinien",
      "Kontaktdaten",
      "Buchungskonfiguration",
    ],
    closing:
      "Angemessene Design- und Inhaltsänderungen sind enthalten. Dies sind keine unbegrenzten Änderungen. Nach 30 Tagen wird die freigegebene Website zur produktiven Version.",
  },
  planComparison: {
    eyebrow: "Paketvergleich",
    title: "Pakete vergleichen.",
    introduction: "Wählen Sie, wie viel tägliche Arbeit Sie selbst verwalten möchten.",
    columns: {
      feature: "Funktion",
      essential: "Essential",
      ownerControl: "Eigentümer-Kontrolle",
      fullControl: "Volle Kontrolle",
    },
    recommendedLabel: "Empfohlen",
    groups: [
      {
        title: "Website",
        rows: [
          {
            feature: "Eigene Unterkunftswebsite",
            essential: "Ja",
            ownerControl: "Ja",
            fullControl: "Ja",
          },
          {
            feature: "Responsive Design für Mobilgerät, Tablet und Desktop",
            essential: "Ja",
            ownerControl: "Ja",
            fullControl: "Ja",
          },
          {
            feature: "Englisch, Griechisch und Deutsch",
            essential: "Ja",
            ownerControl: "Ja",
            fullControl: "Ja",
          },
          {
            feature: "Seiten für Studios, Galerie, Geschichte und Lage",
            essential: "Ja",
            ownerControl: "Ja",
            fullControl: "Ja",
          },
          {
            feature: "Google-Bewertungen",
            essential: "Wenn konfiguriert",
            ownerControl: "Wenn konfiguriert",
            fullControl: "Wenn konfiguriert",
          },
          {
            feature: "Kontakt- und WhatsApp-Aktionen",
            essential: "Ja",
            ownerControl: "Ja",
            fullControl: "Ja",
          },
        ],
      },
      {
        title: "Buchungen",
        rows: [
          {
            feature: "Direkte Buchungsanfragen",
            essential: "Ja",
            ownerControl: "Ja",
            fullControl: "Ja",
          },
          {
            feature: "Automatische Anfrage-E-Mail an den Gast",
            essential: "Ja",
            ownerControl: "Ja",
            fullControl: "Ja",
          },
          {
            feature: "Reservierungsverwaltung",
            essential: "Manuell",
            ownerControl: "Eigentümerbereich",
            fullControl: "Eigentümerbereich",
          },
          {
            feature: "Reservierungskalender",
            essential: "Nein",
            ownerControl: "Ja",
            fullControl: "Ja",
          },
          {
            feature: "Gästedaten ansehen",
            essential: "E-Mail",
            ownerControl: "Eigentümerbereich",
            fullControl: "Eigentümerbereich",
          },
          {
            feature: "Reservierungen bestätigen oder stornieren",
            essential: "Manuell",
            ownerControl: "Eigentümerbereich",
            fullControl: "Eigentümerbereich",
          },
        ],
      },
      {
        title: "Eigentümerverwaltung",
        rows: [
          {
            feature: "Nicht verfügbare Zeiträume sperren",
            essential: "Manuell",
            ownerControl: "Eigentümerbereich",
            fullControl: "Eigentümerbereich",
          },
          {
            feature: "Basispreise verwalten",
            essential: "Entwickler",
            ownerControl: "Eigentümerbereich",
            fullControl: "Eigentümerbereich",
          },
          {
            feature: "Saisonpreise verwalten",
            essential: "Entwickler",
            ownerControl: "Eigentümerbereich",
            fullControl: "Eigentümerbereich",
          },
          {
            feature: "Buchungs-E-Mails senden",
            essential: "Manuell",
            ownerControl: "Eigentümerbereich",
            fullControl: "Eigentümerbereich",
          },
          {
            feature: "Reservierungen suchen und filtern",
            essential: "Nein",
            ownerControl: "Ja",
            fullControl: "Ja",
          },
        ],
      },
      {
        title: "Inhaltskontrolle",
        rows: [
          {
            feature: "Website-Texte bearbeiten",
            essential: "Entwickler",
            ownerControl: "Entwickler",
            fullControl: "Eigentümer",
          },
          {
            feature: "Website-Fotos verwalten",
            essential: "Entwickler",
            ownerControl: "Entwickler",
            fullControl: "Eigentümer",
          },
          {
            feature: "Studio-Informationen bearbeiten",
            essential: "Entwickler",
            ownerControl: "Entwickler",
            fullControl: "Eigentümer",
          },
          {
            feature: "Ausstattung und Richtlinien bearbeiten",
            essential: "Entwickler",
            ownerControl: "Entwickler",
            fullControl: "Eigentümer",
          },
          {
            feature: "Inhaltsänderungen prüfen",
            essential: "Nein",
            ownerControl: "Nein",
            fullControl: "Ja",
          },
        ],
      },
      {
        title: "Integrationen und Start",
        rows: [
          {
            feature: "Externe Kalenderintegration",
            essential: "Nein",
            ownerControl: "Nein",
            fullControl: "Wenn unterstützt",
          },
          {
            feature: "Integration von Buchungskanälen",
            essential: "Nein",
            ownerControl: "Nein",
            fullControl: "Wenn unterstützt",
          },
          {
            feature: "30-tägige Änderungszeit",
            essential: "Ja",
            ownerControl: "Ja",
            fullControl: "Ja",
          },
        ],
      },
    ],
  },
  runningCosts: {
    eyebrow: "Externe Kosten",
    title: "Klare Kosten von unabhängigen Dienstleistern.",
    introduction:
      "Dienste von Drittanbietern sind nicht im Entwicklungspreis enthalten. Diese Konten bleiben in Ihrem Namen, und Sie bezahlen die Anbieter direkt.",
    items: [
      {
        label: "Produktionsserver und IPv4",
        price: "71,88 €",
        cadence: "pro Jahr, vor MwSt.",
        text: "Hetzner CX23 für 5,49 € pro Monat plus eine primäre IPv4-Adresse für 0,50 €. Dies ist die empfohlene Startgröße für Website, Datenbank und E-Mail-Worker.",
      },
      {
        label: "Automatische Backups",
        price: "13,18 €",
        cadence: "pro Jahr, vor MwSt.",
        text: "Sieben automatische Server-Backup-Slots. Hetzner berechnet 20 % des Serverpreises.",
      },
      {
        label: "Domain katerinacorfu.com",
        price: "17,37 €",
        cadence: "pro Jahr, aktuelles Angebot",
        text: "Die Domain-Suche zeigte am 15. September 2026 für Registrierung und Verlängerung denselben Preis von 17,37 €. Verfügbarkeit und Preis müssen vor dem Kauf erneut geprüft werden.",
      },
      {
        label: "E-Mail, Eigentümer-Anmeldung und Karten",
        price: "0 €",
        cadence: "bei erwarteter geringer Nutzung",
        text: "Die aktuellen kostenlosen Nutzungslimits sollten für eine kleine Unterkunft genügen. Mehrverbrauch wird zum Selbstkostenpreis berechnet.",
      },
    ],
    totalLabel: "Erwartete feste Dienstleisterkosten",
    total: "etwa 103 € pro Jahr",
    totalText:
      "Der berechnete Gesamtbetrag ist 102,43 € vor MwSt. Die Servernutzung wird nach dem Start geprüft. Der Server wird nur vergrößert, wenn die Messwerte dies erfordern.",
    examplesTitle: "Weitere Kosten von Drittanbietern können enthalten",
    examples: [
      "Separate Datenbankbereitstellung",
      "Transaktions-E-Mails über dem kostenlosen Limit",
      "Google-API-Nutzung über dem kostenlosen Limit",
      "Channel-Manager-Abonnements",
      "Kostenpflichtige Integrationen von Drittanbietern",
    ],
  },
  ownership: {
    eyebrow: "Unabhängige Kontrolle",
    title: "Ihre Website. Ihre Konten.",
    text: "Wenn möglich, werden Domain, Hosting und zugehörige Dienstleisterkonten im Namen des Eigentümers registriert. Der Eigentümer kann die Rechnungen sehen und die Dienste kontrollieren, die die Website online halten.",
    items: ["Domain", "Hosting", "Relevante Dienstleisterkonten"],
  },
  comparison: {
    eyebrow: "Marktvergleich",
    title: "Vergleichen Sie das Angebot mit Standardplattformen.",
    introduction:
      "Lodgify ist der beste Vergleich, weil es für Ferienunterkünfte gemacht ist. Shopify ist für den Produktverkauf gemacht und ersetzt diesen Buchungsablauf nicht direkt.",
    columns: {
      product: "Option",
      cost: "Beworbener Preis",
      goodFor: "Stärke",
      tradeOff: "Nachteil",
    },
    rows: [
      {
        product: "Diese Website · Eigentümer-Kontrolle",
        cost: "2.790 € einmalig + etwa 103 €/Jahr",
        goodFor: "Eine eigene Marke und ein direkter Anfrageablauf für eine Unterkunft.",
        tradeOff: "Keine Kanal-Synchronisation und keine Online-Kartenzahlung im aktuellen Umfang.",
      },
      {
        product: "Lodgify Starter",
        cost: "26 $/Monat bei Jahreszahlung · 312 $/Jahr",
        goodFor: "Website-Baukasten, Preise, Zahlungen und ein gemeinsamer Buchungskalender.",
        tradeOff: "Laufendes Abonnement und standardisiertes Plattformdesign.",
        href: "https://www.lodgify.com/de/preise/",
      },
      {
        product: "Lodgify Professional",
        cost: "42 $/Monat bei Jahreszahlung · 504 $/Jahr",
        goodFor: "Automatische Nachrichten, Google Ferienunterkünfte und Telefon-Support.",
        tradeOff:
          "Ein höheres laufendes Abonnement für Werkzeuge, die eine kleine Unterkunft vielleicht nicht braucht.",
        href: "https://www.lodgify.com/de/preise/",
      },
      {
        product: "Shopify Basic",
        cost: "29 $/Monat bei Jahreszahlung · 348 $/Jahr",
        goodFor: "Produktverkauf, Checkout, Bestand und Handelsfunktionen.",
        tradeOff: "Nicht für Unterkunftsverfügbarkeit und Buchungsanfragen gemacht.",
        href: "https://www.shopify.com/de/preise",
      },
    ],
    conclusionTitle: "Die ehrliche Empfehlung",
    conclusion:
      "Wählen Sie Eigentümer-Kontrolle, wenn der Käufer das individuelle Katerina-Studios-Design und direkten Eigentümerkontakt schätzt. Wählen Sie Lodgify, wenn Kanal-Synchronisation, Online-Zahlungen oder erweiterte Vermietungsautomatisierung wichtiger als eine individuelle Website sind.",
  },
  afterLaunch: {
    eyebrow: "Nach dem Start",
    title: "Klären Sie die Verantwortung für jede Arbeit.",
    introduction:
      "Alle Pakete enthalten die ersten 30 Tage für Änderungen. Danach gelten die folgenden Verantwortlichkeiten.",
    items: [
      {
        name: "Essential",
        text: "Der Entwickler ändert Website-Inhalte. Der Eigentümer verwaltet Reservierungen manuell.",
        cost: "Aktueller Änderungspreis · 65 € pro Stunde",
      },
      {
        name: "Eigentümer-Kontrolle",
        text: "Der Eigentümer verwaltet Reservierungen. Der Entwickler ändert Website-Inhalte.",
        cost: "Aktueller Inhaltspreis · 65 € pro Stunde",
      },
      {
        name: "Volle Kontrolle",
        text: "Der Eigentümer führt normale Inhalts- und Buchungsänderungen aus. Große Funktionen und neue Entwicklungsarbeit sind separate Arbeiten.",
        cost: "Neue Entwicklungsarbeit · separates Angebot",
      },
    ],
    note: "Hosting, Dienste von Drittanbietern, Inhaltsänderungen und neue technische Entwicklung sind separate Kosten.",
  },
  additions: {
    eyebrow: "Optionale Ergänzungen",
    title: "Fügen Sie nur benötigte Funktionen hinzu.",
    introduction:
      "Optionale Arbeit wird vor dem Entwicklungsstart festgelegt. Der endgültige Umfang hängt vom gewählten Dienst und seinen technischen Anforderungen ab.",
    items: [
      "Online-Kartenzahlungen",
      "Zusätzliche Sprachen",
      "Erweiterte Analysen",
      "Zusätzliche Buchungsintegrationen",
      "Erweiterte E-Mail-Automatisierung",
      "Eigene Berichte",
      "Zusätzliche Unterkunftswebsites",
    ],
    quoteLabel: "Separates Angebot",
  },
  next: {
    eyebrow: "Nächster Schritt",
    title: "Wählen Sie den Umfang der Kontrolle.",
    text: "Nach der Paketwahl bestätigen beide Seiten einen kurzen schriftlichen Leistungsumfang.",
    steps: [
      "Paket und endgültige Inhalte der Unterkunft bestätigen.",
      "Domain, Dienstleisterkonten und Rechnungsdaten bestätigen.",
      "50 % zum Start und 50 % nach Abnahme vor der Veröffentlichung bezahlen.",
    ],
    closing:
      "Empfohlenes Angebot: Eigentümer-Kontrolle für 2.790 € plus etwa 103 € Dienstleisterkosten pro Jahr.",
  },
  notes: {
    title: "Preishinweise und Quellen",
    checked: "Dienstleisterpreise und Domain-Angebot geprüft am 15. September 2026.",
    text: "Die Website-Preise sind Angebotspreise und keine Listenpreise von Drittanbietern. Alle Beträge verstehen sich ohne MwSt., wenn MwSt. anfällt. Dienstleisterpreise und Wechselkurse können sich ändern. Bestätigen Sie alle Kosten vor Vertrag und Kauf.",
    sourceLabel: "Offizielle Quellen",
    sources,
    externalHint: " (öffnet einen neuen Tab)",
  },
};

const el: ProposalCopy = {
  meta: {
    title: "Πακέτα ιστοσελίδας",
    description: "Μια σαφής πρόταση για την ιστοσελίδα, τα εργαλεία ιδιοκτήτη και τα ετήσια κόστη.",
  },
  hero: {
    eyebrow: "Πρόταση ιστοσελίδας · 15 Σεπτεμβρίου 2026",
    title: "Μια ιστοσελίδα απευθείας κρατήσεων που ταιριάζει στον τρόπο εργασίας σας.",
    introduction:
      "Επιλέξτε μια απλή ιστοσελίδα μακράς χρήσης, καθημερινά εργαλεία ιδιοκτήτη ή πλήρη έλεγχο περιεχομένου. Πληρώνετε μία φορά για την ιστοσελίδα. Πληρώνετε τους παρόχους κάθε χρόνο.",
    recommendedLabel: "Προτεινόμενη προσφορά",
    recommendedPlan: "Έλεγχος Ιδιοκτήτη",
    recommendedPrice: "2.790 € μία φορά",
    recommendedText:
      "Αυτό το πακέτο δίνει στον ιδιοκτήτη έλεγχο των κρατήσεων, των τιμών και των μη διαθέσιμων ημερομηνιών. Δίνει την καλύτερη αξία από την εφαρμογή που είναι έτοιμη τώρα.",
  },
  plans: {
    eyebrow: "Επιλέξτε το επίπεδο ελέγχου",
    title: "Τρεις σαφείς τρόποι για τη δική σας ιστοσελίδα.",
    introduction:
      "Κάθε τιμή είναι εφάπαξ τιμή ιστοσελίδας. Τα ετήσια κόστη διακομιστή και domain είναι ξεχωριστά και ίδια για κάθε πακέτο.",
    annualCost: "+ περίπου 103 € κάθε χρόνο για διακομιστή, αντίγραφα ασφαλείας και domain",
    bestForLabel: "Κατάλληλο για",
    includesLabel: "Κύρια στοιχεία πακέτου",
    items: [
      {
        name: "Essential",
        tagline: "Μια επαγγελματική ιστοσελίδα για απευθείας κρατήσεις.",
        price: "1.490 €",
        priceNote: "εφάπαξ πληρωμή",
        description: "Μια επαγγελματική ιστοσελίδα απευθείας κρατήσεων με απλή ροή αιτημάτων.",
        bestFor:
          "Ιδιοκτήτες που προτιμούν να διαχειρίζονται τις κρατήσεις χειροκίνητα και να αναθέτουν τις αλλαγές της ιστοσελίδας στον προγραμματιστή.",
        features: [
          "Ειδική responsive ιστοσελίδα καταλύματος σε τρεις γλώσσες",
          "Περιεχόμενο για στούντιο, συλλογή, ιστορία, τοποθεσία, παροχές και πολιτικές",
          "Επικοινωνία, WhatsApp και ρυθμισμένες Κριτικές Google",
          "Φόρμες αιτήματος κράτησης και στοιχείων επισκέπτη",
          "Αυτόματα email για ιδιοκτήτη και επισκέπτη με πληρωμή κατά την άφιξη",
          "Βασικό SEO και ρύθμιση domain, SSL και παραγωγής",
        ],
        operatingModelLabel: "Ροή κράτησης",
        operatingModel:
          "Ο επισκέπτης στέλνει αίτημα. Ο ιδιοκτήτης ελέγχει τη διαθεσιμότητα, καταγράφει την κράτηση, επικοινωνεί με τον επισκέπτη και την επιβεβαιώνει χειροκίνητα.",
        boundary:
          "Δεν υπάρχει ιδιωτική περιοχή ιδιοκτήτη ή επεξεργαστής περιεχομένου. Μετά τις 30 ημέρες, οι αλλαγές από τον προγραμματιστή κοστίζουν 65 € ανά ώρα.",
        status: "Απευθείας κράτηση",
        action: "Επιλογή Essential",
      },
      {
        name: "Έλεγχος Ιδιοκτήτη",
        tagline: "Διαχειριστείτε κρατήσεις από την ιδιωτική περιοχή ιδιοκτήτη.",
        price: "2.790 €",
        priceNote: "εφάπαξ πληρωμή",
        description: "Διαχειριστείτε τις καθημερινές κρατήσεις από έναν ασφαλή χώρο ιδιοκτήτη.",
        bestFor:
          "Ιδιοκτήτες που θέλουν να διαχειρίζονται απευθείας κρατήσεις χωρίς βοήθεια προγραμματιστή στην καθημερινή εργασία.",
        features: [
          "Όλα όσα περιλαμβάνει το Essential",
          "Ασφαλής σύνδεση, πίνακας κρατήσεων και ημερολόγιο",
          "Εκκρεμείς, επιβεβαιωμένες και ακυρωμένες κρατήσεις με στοιχεία άφιξης",
          "Επιβεβαίωση, ακύρωση, ολοκλήρωση, αναζήτηση και φιλτράρισμα κρατήσεων",
          "Διαχείριση ημερομηνιών, βασικών και εποχιακών τιμών και κατάστασης κράτησης",
          "Ιστορικό email, αποστολή από την περιοχή ιδιοκτήτη και email επιβεβαίωσης ή ακύρωσης",
          "Μία εκπαίδευση ιδιοκτήτη",
        ],
        operatingModelLabel: "Ροή ιδιοκτήτη",
        operatingModel:
          "Ο ιδιοκτήτης διαχειρίζεται κρατήσεις, τιμές και αποκλεισμένες ημερομηνίες από την ιδιωτική περιοχή.",
        boundary:
          "Η επεξεργασία κειμένων και φωτογραφιών δεν περιλαμβάνεται. Αυτές οι αλλαγές κοστίζουν 65 € ανά ώρα.",
        status: "Προτεινόμενο",
        action: "Επιλογή Ελέγχου Ιδιοκτήτη",
        recommended: true,
      },
      {
        name: "Πλήρης Έλεγχος",
        tagline: "Διαχειριστείτε κρατήσεις, περιεχόμενο και υποστηριζόμενα κανάλια.",
        price: "Από 3.990 €",
        priceNote: "εφάπαξ κόστος ανάπτυξης",
        description:
          "Διαχειριστείτε κρατήσεις, περιεχόμενο, τιμές και υποστηριζόμενα κανάλια κράτησης από μία περιοχή ιδιοκτήτη.",
        bestFor: "Ιδιοκτήτες που θέλουν μέγιστο έλεγχο της ιστοσελίδας και της ροής κρατήσεων.",
        features: [
          "Όλα όσα περιλαμβάνει ο Έλεγχος Ιδιοκτήτη",
          "Πλήρης περιοχή περιεχομένου για κείμενα, στούντιο, παροχές, πολιτικές και επικοινωνία",
          "Επεξεργασία υποστηριζόμενων γλωσσών και προσθήκη, αντικατάσταση ή αλλαγή σειράς εικόνων",
          "Προεπισκόπηση αλλαγών περιεχομένου όπου υποστηρίζεται",
          "Σύνδεση εξωτερικών καναλιών κράτησης όπου υποστηρίζεται τεχνικά",
          "Οδηγός επεξεργασίας, παράδοση και εκπαίδευση ιδιοκτήτη",
        ],
        operatingModelLabel: "Πλήρης διαχείριση",
        operatingModel:
          "Ο ιδιοκτήτης διαχειρίζεται συνήθεις αλλαγές κρατήσεων και ιστοσελίδας από μία περιοχή. Οι συνδέσεις χρησιμοποιούν εγκεκριμένα API, iCal ή υποστηριζόμενους channel managers.",
        boundary:
          "Δεν περιλαμβάνονται μη υποστηριζόμενα άμεσα API ή συλλογή δεδομένων από πλατφόρμες τρίτων. Η νέα ανάπτυξη κοστολογείται ξεχωριστά.",
        scopeNote:
          "Η τελική τιμή εξαρτάται από τα κανάλια κράτησης και τις συνδέσεις που χρειάζεστε.",
        status: "Πλήρης διαχείριση",
        action: "Συζήτηση για Πλήρη Έλεγχο",
      },
    ],
  },
  revisions: {
    eyebrow: "Περιλαμβάνονται σε κάθε πακέτο",
    title: "30 ημέρες για να γίνει δική σας.",
    introduction:
      "Και τα τρία πακέτα περιλαμβάνουν περίοδο 30 ημερών για αλλαγές σχεδιασμού και περιεχομένου. Σε αυτό το διάστημα ολοκληρώνουμε την εγκεκριμένη ιστοσελίδα.",
    items: [
      "Διάταξη και λεπτομέρειες σχεδιασμού",
      "Φωτογραφίες καταλύματος και κείμενα ιστοσελίδας",
      "Παροχές και πολιτικές",
      "Στοιχεία επικοινωνίας",
      "Ρυθμίσεις κρατήσεων",
    ],
    closing:
      "Περιλαμβάνονται εύλογες αλλαγές σχεδιασμού και περιεχομένου. Δεν πρόκειται για απεριόριστες αλλαγές. Μετά τις 30 ημέρες, η εγκεκριμένη ιστοσελίδα γίνεται η έκδοση παραγωγής.",
  },
  planComparison: {
    eyebrow: "Σύγκριση πακέτων",
    title: "Συγκρίνετε τα πακέτα.",
    introduction: "Επιλέξτε πόση καθημερινή εργασία θέλετε να διαχειρίζεστε μόνοι σας.",
    columns: {
      feature: "Λειτουργία",
      essential: "Essential",
      ownerControl: "Έλεγχος Ιδιοκτήτη",
      fullControl: "Πλήρης Έλεγχος",
    },
    recommendedLabel: "Προτεινόμενο",
    groups: [
      {
        title: "Ιστοσελίδα",
        rows: [
          {
            feature: "Ειδική ιστοσελίδα καταλύματος",
            essential: "Ναι",
            ownerControl: "Ναι",
            fullControl: "Ναι",
          },
          {
            feature: "Responsive σχεδιασμός για κινητό, tablet και υπολογιστή",
            essential: "Ναι",
            ownerControl: "Ναι",
            fullControl: "Ναι",
          },
          {
            feature: "Αγγλικά, Ελληνικά και Γερμανικά",
            essential: "Ναι",
            ownerControl: "Ναι",
            fullControl: "Ναι",
          },
          {
            feature: "Σελίδες για στούντιο, συλλογή, ιστορία και τοποθεσία",
            essential: "Ναι",
            ownerControl: "Ναι",
            fullControl: "Ναι",
          },
          {
            feature: "Κριτικές Google",
            essential: "Όπου έχει ρυθμιστεί",
            ownerControl: "Όπου έχει ρυθμιστεί",
            fullControl: "Όπου έχει ρυθμιστεί",
          },
          {
            feature: "Ενέργειες επικοινωνίας και WhatsApp",
            essential: "Ναι",
            ownerControl: "Ναι",
            fullControl: "Ναι",
          },
        ],
      },
      {
        title: "Κρατήσεις",
        rows: [
          {
            feature: "Απευθείας αιτήματα κράτησης",
            essential: "Ναι",
            ownerControl: "Ναι",
            fullControl: "Ναι",
          },
          {
            feature: "Αυτόματο email αιτήματος στον επισκέπτη",
            essential: "Ναι",
            ownerControl: "Ναι",
            fullControl: "Ναι",
          },
          {
            feature: "Διαχείριση κρατήσεων",
            essential: "Χειροκίνητα",
            ownerControl: "Περιοχή ιδιοκτήτη",
            fullControl: "Περιοχή ιδιοκτήτη",
          },
          {
            feature: "Ημερολόγιο κρατήσεων",
            essential: "Όχι",
            ownerControl: "Ναι",
            fullControl: "Ναι",
          },
          {
            feature: "Προβολή στοιχείων επισκέπτη",
            essential: "Email",
            ownerControl: "Περιοχή ιδιοκτήτη",
            fullControl: "Περιοχή ιδιοκτήτη",
          },
          {
            feature: "Επιβεβαίωση ή ακύρωση κρατήσεων",
            essential: "Χειροκίνητα",
            ownerControl: "Περιοχή ιδιοκτήτη",
            fullControl: "Περιοχή ιδιοκτήτη",
          },
        ],
      },
      {
        title: "Διαχείριση ιδιοκτήτη",
        rows: [
          {
            feature: "Αποκλεισμός μη διαθέσιμων ημερομηνιών",
            essential: "Χειροκίνητα",
            ownerControl: "Περιοχή ιδιοκτήτη",
            fullControl: "Περιοχή ιδιοκτήτη",
          },
          {
            feature: "Διαχείριση βασικών τιμών",
            essential: "Προγραμματιστής",
            ownerControl: "Περιοχή ιδιοκτήτη",
            fullControl: "Περιοχή ιδιοκτήτη",
          },
          {
            feature: "Διαχείριση εποχιακών τιμών",
            essential: "Προγραμματιστής",
            ownerControl: "Περιοχή ιδιοκτήτη",
            fullControl: "Περιοχή ιδιοκτήτη",
          },
          {
            feature: "Αποστολή email κρατήσεων",
            essential: "Χειροκίνητα",
            ownerControl: "Περιοχή ιδιοκτήτη",
            fullControl: "Περιοχή ιδιοκτήτη",
          },
          {
            feature: "Αναζήτηση και φιλτράρισμα κρατήσεων",
            essential: "Όχι",
            ownerControl: "Ναι",
            fullControl: "Ναι",
          },
        ],
      },
      {
        title: "Έλεγχος περιεχομένου",
        rows: [
          {
            feature: "Επεξεργασία κειμένων ιστοσελίδας",
            essential: "Προγραμματιστής",
            ownerControl: "Προγραμματιστής",
            fullControl: "Ιδιοκτήτης",
          },
          {
            feature: "Διαχείριση φωτογραφιών ιστοσελίδας",
            essential: "Προγραμματιστής",
            ownerControl: "Προγραμματιστής",
            fullControl: "Ιδιοκτήτης",
          },
          {
            feature: "Επεξεργασία πληροφοριών στούντιο",
            essential: "Προγραμματιστής",
            ownerControl: "Προγραμματιστής",
            fullControl: "Ιδιοκτήτης",
          },
          {
            feature: "Επεξεργασία παροχών και πολιτικών",
            essential: "Προγραμματιστής",
            ownerControl: "Προγραμματιστής",
            fullControl: "Ιδιοκτήτης",
          },
          {
            feature: "Προεπισκόπηση αλλαγών περιεχομένου",
            essential: "Όχι",
            ownerControl: "Όχι",
            fullControl: "Ναι",
          },
        ],
      },
      {
        title: "Συνδέσεις και έναρξη",
        rows: [
          {
            feature: "Σύνδεση εξωτερικού ημερολογίου",
            essential: "Όχι",
            ownerControl: "Όχι",
            fullControl: "Όπου υποστηρίζεται",
          },
          {
            feature: "Σύνδεση καναλιών κράτησης",
            essential: "Όχι",
            ownerControl: "Όχι",
            fullControl: "Όπου υποστηρίζεται",
          },
          {
            feature: "Περίοδος αλλαγών 30 ημερών",
            essential: "Ναι",
            ownerControl: "Ναι",
            fullControl: "Ναι",
          },
        ],
      },
    ],
  },
  runningCosts: {
    eyebrow: "Εξωτερικά κόστη",
    title: "Σαφή κόστη από ανεξάρτητους παρόχους.",
    introduction:
      "Οι υπηρεσίες τρίτων δεν περιλαμβάνονται στην τιμή ανάπτυξης. Οι λογαριασμοί μένουν στο όνομά σας και πληρώνετε τους παρόχους απευθείας.",
    items: [
      {
        label: "Διακομιστής παραγωγής και IPv4",
        price: "71,88 €",
        cadence: "ανά έτος, πριν από ΦΠΑ",
        text: "Hetzner CX23 με 5,49 € τον μήνα και κύρια διεύθυνση IPv4 με 0,50 €. Αυτό είναι το προτεινόμενο αρχικό μέγεθος για την ιστοσελίδα, τη βάση δεδομένων και την υπηρεσία email.",
      },
      {
        label: "Αυτόματα αντίγραφα ασφαλείας",
        price: "13,18 €",
        cadence: "ανά έτος, πριν από ΦΠΑ",
        text: "Επτά αυτόματες θέσεις αντιγράφων ασφαλείας διακομιστή. Η Hetzner χρεώνει 20% της τιμής του διακομιστή.",
      },
      {
        label: "Domain katerinacorfu.com",
        price: "17,37 €",
        cadence: "ανά έτος, τρέχουσα προσφορά",
        text: "Η αναζήτηση domain έδειξε την ίδια τιμή των 17,37 € για εγγραφή και ανανέωση στις 15 Σεπτεμβρίου 2026. Η διαθεσιμότητα και η τιμή πρέπει να ελεγχθούν ξανά πριν από την αγορά.",
      },
      {
        label: "Email, σύνδεση ιδιοκτήτη και χάρτες",
        price: "0 €",
        cadence: "με την αναμενόμενη μικρή χρήση",
        text: "Τα τρέχοντα δωρεάν όρια πρέπει να καλύπτουν ένα μικρό κατάλυμα. Η χρήση πάνω από τα όρια χρεώνεται στο κόστος.",
      },
    ],
    totalLabel: "Αναμενόμενο σταθερό σύνολο παρόχων",
    total: "περίπου 103 € ανά έτος",
    totalText:
      "Το υπολογισμένο σύνολο είναι 102,43 € πριν από ΦΠΑ. Η χρήση του διακομιστή θα ελεγχθεί μετά την έναρξη. Το μέγεθος θα αυξηθεί μόνο αν το απαιτούν οι μετρήσεις.",
    examplesTitle: "Άλλα κόστη τρίτων μπορεί να περιλαμβάνουν",
    examples: [
      "Ξεχωριστή φιλοξενία βάσης δεδομένων",
      "Email συναλλαγών πάνω από το δωρεάν όριο",
      "Χρήση Google API πάνω από το δωρεάν όριο",
      "Συνδρομές channel manager",
      "Πληρωμένες συνδέσεις τρίτων",
    ],
  },
  ownership: {
    eyebrow: "Ανεξάρτητος έλεγχος",
    title: "Η ιστοσελίδα σας. Οι λογαριασμοί σας.",
    text: "Όπου είναι πρακτικό, το domain, η φιλοξενία και οι σχετικοί λογαριασμοί παρόχων καταχωρίζονται στο όνομα του ιδιοκτήτη. Ο ιδιοκτήτης βλέπει τα τιμολόγια και ελέγχει τις υπηρεσίες που κρατούν την ιστοσελίδα online.",
    items: ["Domain", "Φιλοξενία", "Σχετικοί λογαριασμοί παρόχων"],
  },
  comparison: {
    eyebrow: "Σύγκριση αγοράς",
    title: "Συγκρίνετε την προσφορά με τυπικές πλατφόρμες.",
    introduction:
      "Το Lodgify είναι η πιο κοντινή σύγκριση, επειδή έχει σχεδιαστεί για τουριστικά καταλύματα. Το Shopify έχει σχεδιαστεί για πώληση προϊόντων και δεν αντικαθιστά άμεσα αυτή τη ροή κρατήσεων.",
    columns: {
      product: "Επιλογή",
      cost: "Διαφημιζόμενο κόστος",
      goodFor: "Δυνατό σημείο",
      tradeOff: "Περιορισμός",
    },
    rows: [
      {
        product: "Αυτή η ιστοσελίδα · Έλεγχος Ιδιοκτήτη",
        cost: "2.790 € μία φορά + περίπου 103 €/έτος",
        goodFor: "Προσαρμοσμένη ταυτότητα και άμεση ροή αιτημάτων για ένα κατάλυμα.",
        tradeOff: "Δεν έχει συγχρονισμό καναλιών ή online πληρωμή με κάρτα στο τρέχον αντικείμενο.",
      },
      {
        product: "Lodgify Starter",
        cost: "26 $/μήνα με ετήσια χρέωση · 312 $/έτος",
        goodFor: "Κατασκευή ιστοσελίδας, τιμές, πληρωμές και ενιαίο ημερολόγιο κρατήσεων.",
        tradeOff: "Συνεχής συνδρομή και τυπικός σχεδιασμός πλατφόρμας.",
        href: "https://www.lodgify.com/de/preise/",
      },
      {
        product: "Lodgify Professional",
        cost: "42 $/μήνα με ετήσια χρέωση · 504 $/έτος",
        goodFor: "Αυτόματα μηνύματα, Google Vacation Rentals και τηλεφωνική υποστήριξη.",
        tradeOff:
          "Υψηλότερη συνεχή συνδρομή για εργαλεία που ίσως δεν χρειάζεται ένα μικρό κατάλυμα.",
        href: "https://www.lodgify.com/de/preise/",
      },
      {
        product: "Shopify Basic",
        cost: "29 $/μήνα με ετήσια χρέωση · 348 $/έτος",
        goodFor: "Πωλήσεις προϊόντων, checkout, απόθεμα και εργαλεία εμπορίου.",
        tradeOff: "Δεν έχει σχεδιαστεί για διαθεσιμότητα καταλύματος και αιτήματα κρατήσεων.",
        href: "https://www.shopify.com/de/preise",
      },
    ],
    conclusionTitle: "Η ειλικρινής πρόταση",
    conclusion:
      "Επιλέξτε Έλεγχο Ιδιοκτήτη όταν ο αγοραστής εκτιμά τον ειδικό σχεδιασμό του Katerina Studios και την άμεση επαφή. Επιλέξτε Lodgify όταν ο συγχρονισμός καναλιών, οι online πληρωμές ή η σύνθετη αυτοματοποίηση είναι πιο σημαντικά από μια ειδική ιστοσελίδα.",
  },
  afterLaunch: {
    eyebrow: "Μετά την έναρξη",
    title: "Δείτε ποιος διαχειρίζεται κάθε εργασία.",
    introduction:
      "Όλα τα πακέτα περιλαμβάνουν την αρχική περίοδο αλλαγών 30 ημερών. Μετά από αυτή την περίοδο ισχύουν οι παρακάτω ευθύνες.",
    items: [
      {
        name: "Essential",
        text: "Ο προγραμματιστής αλλάζει το περιεχόμενο της ιστοσελίδας. Ο ιδιοκτήτης διαχειρίζεται τις κρατήσεις χειροκίνητα.",
        cost: "Τρέχουσα τιμή αλλαγών · 65 € ανά ώρα",
      },
      {
        name: "Έλεγχος Ιδιοκτήτη",
        text: "Ο ιδιοκτήτης διαχειρίζεται τις κρατήσεις. Ο προγραμματιστής αλλάζει το περιεχόμενο της ιστοσελίδας.",
        cost: "Τρέχουσα τιμή περιεχομένου · 65 € ανά ώρα",
      },
      {
        name: "Πλήρης Έλεγχος",
        text: "Ο ιδιοκτήτης κάνει τις συνήθεις αλλαγές περιεχομένου και κρατήσεων. Οι μεγάλες λειτουργίες και η νέα ανάπτυξη είναι ξεχωριστή εργασία.",
        cost: "Νέα ανάπτυξη · ξεχωριστή προσφορά",
      },
    ],
    note: "Η φιλοξενία, οι υπηρεσίες τρίτων, οι αλλαγές περιεχομένου και η νέα τεχνική ανάπτυξη είναι ξεχωριστά κόστη.",
  },
  additions: {
    eyebrow: "Προαιρετικές προσθήκες",
    title: "Προσθέστε μόνο ό,τι χρειάζεται το κατάλυμα.",
    introduction:
      "Η προαιρετική εργασία καθορίζεται πριν αρχίσει η ανάπτυξη. Το τελικό αντικείμενο εξαρτάται από την επιλεγμένη υπηρεσία και τις τεχνικές απαιτήσεις της.",
    items: [
      "Online πληρωμές με κάρτα",
      "Πρόσθετες γλώσσες",
      "Προηγμένα αναλυτικά στοιχεία",
      "Πρόσθετες συνδέσεις κρατήσεων",
      "Προηγμένη αυτοματοποίηση email",
      "Ειδικές αναφορές",
      "Πρόσθετες ιστοσελίδες καταλυμάτων",
    ],
    quoteLabel: "Ξεχωριστή προσφορά",
  },
  next: {
    eyebrow: "Επόμενο βήμα",
    title: "Επιλέξτε το επίπεδο ελέγχου.",
    text: "Μετά την επιλογή πακέτου, οι δύο πλευρές επιβεβαιώνουν ένα σύντομο γραπτό αντικείμενο εργασίας.",
    steps: [
      "Επιβεβαιώστε το πακέτο και το τελικό περιεχόμενο του καταλύματος.",
      "Επιβεβαιώστε το domain, τους λογαριασμούς παρόχων και τα στοιχεία τιμολόγησης.",
      "Πληρώστε 50% για την έναρξη και 50% μετά την έγκριση, πριν από τη δημοσίευση.",
    ],
    closing:
      "Προτεινόμενη προσφορά: Έλεγχος Ιδιοκτήτη στα 2.790 €, συν περίπου 103 € ετήσια κόστη παρόχων.",
  },
  notes: {
    title: "Σημειώσεις τιμών και πηγές",
    checked: "Οι τιμές των παρόχων και η προσφορά domain ελέγχθηκαν στις 15 Σεπτεμβρίου 2026.",
    text: "Οι τιμές ιστοσελίδας είναι τιμές πρότασης και όχι τιμές καταλόγου τρίτων. Όλα τα ποσά δεν περιλαμβάνουν ΦΠΑ, αν εφαρμόζεται. Οι τιμές παρόχων και οι ισοτιμίες μπορούν να αλλάξουν. Επιβεβαιώστε όλα τα κόστη πριν από τη σύμβαση και την αγορά.",
    sourceLabel: "Επίσημες πηγές",
    sources,
    externalHint: " (ανοίγει σε νέα καρτέλα)",
  },
};

export const websiteProposal: Record<Locale, ProposalCopy> = { en, de, el };
