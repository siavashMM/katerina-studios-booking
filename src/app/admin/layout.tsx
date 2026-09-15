import type { Metadata } from "next";
import { getServerTranslation } from "@/i18n/server";
import "./admin.css";

export async function generateMetadata(): Promise<Metadata> {
  const { Translate } = await getServerTranslation();
  return {
    title: { default: Translate.admin.metaTitle, template: Translate.admin.metaTemplate },
    robots: { index: false, follow: false },
  };
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-shell">{children}</div>;
}
