import Link from "next/link";
import { getServerTranslation } from "@/i18n/server";
export default async function NotFound() {
  const { Translate } = await getServerTranslation();
  return (
    <main id="main-content" className="container section">
      <p className="eyebrow">{Translate.errors.notFoundEyebrow}</p>
      <h1>{Translate.errors.notFoundTitle}</h1>
      <p>{Translate.errors.notFoundText}</p>
      <Link href="/" className="button">
        {Translate.errors.returnHome}
      </Link>
    </main>
  );
}
