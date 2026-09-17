import Link from "next/link";
import { ArrowIcon, PlusIcon } from "@/components/ui/icons";
import { getServerTranslation } from "@/i18n/server";
import { getPublicProperty } from "./public-data";

export async function StayInvitation() {
  const { Translate } = await getServerTranslation();
  return (
    <section className="stay-invitation">
      <div className="container invitation-inner">
        <div>
          <p className="eyebrow">{Translate.editorial.invitation.eyebrow}</p>
          <h2>{Translate.editorial.invitation.heading}</h2>
          <p>{Translate.editorial.invitation.text}</p>
        </div>
        <Link href="/booking" className="button button-light">
          {Translate.common.checkAvailability} <ArrowIcon />
        </Link>
      </div>
    </section>
  );
}

export async function PracticalInformation() {
  const { Translate } = await getServerTranslation();
  const managed = await getPublicProperty();
  const content = managed?.content;
  const amenities = Array.isArray(content?.amenities)
    ? content.amenities.filter((item): item is string => typeof item === "string")
    : [];
  const policies = Array.isArray(content?.policies)
    ? content.policies.filter((item): item is string => typeof item === "string")
    : [];
  return (
    <section className="container section practical-section">
      <div>
        <p className="eyebrow">{Translate.editorial.practical.eyebrow}</p>
        <h2>{Translate.editorial.practical.heading}</h2>
        <p className="muted">{Translate.editorial.practical.note}</p>
      </div>
      <div className="faq-list">
        {Translate.editorial.practical.questions.map(({ question, answer }) => (
          <details key={question}>
            <summary>
              {question}
              <PlusIcon />
            </summary>
            <p>{answer}</p>
          </details>
        ))}
        {content?.checkIn || content?.checkOut ? (
          <details>
            <summary>
              Check-in and check-out
              <PlusIcon />
            </summary>
            {content.checkIn ? <p>Check-in: {content.checkIn}</p> : null}
            {content.checkOut ? <p>Check-out: {content.checkOut}</p> : null}
          </details>
        ) : null}
        {amenities.length ? (
          <details>
            <summary>
              Property amenities
              <PlusIcon />
            </summary>
            <p>{amenities.join(" · ")}</p>
          </details>
        ) : null}
        {policies.length ? (
          <details>
            <summary>
              Property policies
              <PlusIcon />
            </summary>
            {policies.map((policy) => (
              <p key={policy}>{policy}</p>
            ))}
          </details>
        ) : null}
        {content?.contactEmail || content?.contactPhone ? (
          <details>
            <summary>
              Contact Katerina Studios
              <PlusIcon />
            </summary>
            {content.contactEmail ? (
              <p>
                <a href={`mailto:${content.contactEmail}`}>{content.contactEmail}</a>
              </p>
            ) : null}
            {content.contactPhone ? (
              <p>
                <a href={`tel:${content.contactPhone}`}>{content.contactPhone}</a>
              </p>
            ) : null}
          </details>
        ) : null}
      </div>
    </section>
  );
}

export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="container page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <div className="page-heading-row">
        <h1>{title}</h1>
        {children ? <div className="page-heading-copy">{children}</div> : null}
      </div>
    </div>
  );
}
