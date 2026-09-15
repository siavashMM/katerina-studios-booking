/* eslint-disable @next/next/no-html-link-for-pages -- Auth endpoints require full browser navigation. */
import Link from "next/link";
import { authConfigured } from "@/config/env";
import { getServerTranslation } from "@/i18n/server";

export default async function LoginPage() {
  const configured = authConfigured();
  const { Translate } = await getServerTranslation();
  return (
    <main id="main-content" className="admin-login">
      <Link className="admin-brand" href="/">
        Katerina Studios
      </Link>
      <p className="eyebrow">{Translate.admin.login.eyebrow}</p>
      <h1>{Translate.admin.login.title}</h1>
      <p>{Translate.admin.login.text}</p>
      {configured ? (
        <>
          <a className="button" href="/auth/login?returnTo=%2Fadmin%2Freservations">
            {Translate.admin.login.action} <span aria-hidden="true">→</span>
          </a>
          <p className="small-copy">{Translate.admin.login.help}</p>
        </>
      ) : (
        <div className="notice">
          <h2>{Translate.admin.login.unavailableTitle}</h2>
          <p>{Translate.admin.login.unavailableText}</p>
        </div>
      )}
      <Link className="text-link" href="/">
        ← {Translate.admin.login.return}
      </Link>
    </main>
  );
}
