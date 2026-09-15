import { notFound } from "next/navigation";
import { getEnv } from "@/config/env";
import { getServerTranslation } from "@/i18n/server";

const policyNames = ["privacy", "terms", "cancellation"] as const;
type PolicyName = (typeof policyNames)[number];
const isPolicy = (value: string): value is PolicyName => policyNames.includes(value as PolicyName);

export async function generateMetadata({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params;
  const { Translate } = await getServerTranslation();
  return {
    title: isPolicy(policy)
      ? Translate.policies[policy].title
      : Translate.meta.pages.notFound.title,
  };
}
export default async function PolicyPage({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params;
  if (!isPolicy(policy)) notFound();
  const { Translate } = await getServerTranslation();
  const page = Translate.policies[policy];
  return (
    <main id="main-content" className="container section" style={{ maxWidth: 800 }}>
      <p className="eyebrow">Katerina Studios</p>
      <h1>{page.title}</h1>
      {getEnv().DEMO_MODE && <p className="notice">{Translate.policies.demo}</p>}
      {page.paragraphs.map((text) => (
        <p key={text} style={{ marginBlock: 24 }}>
          {text}
        </p>
      ))}
      {policy === "privacy" ? (
        <p style={{ marginBlock: 24 }}>
          {Translate.policies.privacy.googleLead}{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            {Translate.policies.privacy.googleLink}
            <span className="sr-only">{Translate.common.openInNewTab}</span>
          </a>
          .
        </p>
      ) : null}
      {policy === "terms" ? (
        <p style={{ marginBlock: 24 }}>
          {Translate.policies.terms.googleLead}{" "}
          <a
            href="https://cloud.google.com/maps-platform/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            {Translate.policies.terms.googleLink}
            <span className="sr-only">{Translate.common.openInNewTab}</span>
          </a>
          .
        </p>
      ) : null}
    </main>
  );
}
