"use client";
import { useTranslation } from "@/i18n/client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const { Translate } = useTranslation();
  return (
    <main id="main-content" className="container section">
      <h1>{Translate.errors.loadTitle}</h1>
      <p>{Translate.errors.loadText}</p>
      <button className="button" onClick={reset}>
        {Translate.errors.tryAgain}
      </button>
    </main>
  );
}
