import { ownerForPage } from "@/features/admin/page-auth";
import { AdminNav } from "@/features/admin/ui/admin-nav";
import { RateEditor } from "@/features/admin/ui/rates-editor";
import { adminService } from "@/features/booking/server";
import { dateOnly } from "@/features/booking/domain/rules";
import { getServerTranslation } from "@/i18n/server";
import { PricingPolicyEditor } from "@/features/admin/ui/pricing-policy-editor";

export default async function RatesPage() {
  const owner = await ownerForPage();
  const { Translate } = await getServerTranslation();
  const service = adminService();
  const [studios, policy] = await Promise.all([
    service.listRates(owner),
    service.getPricingPolicy(owner),
  ]);
  return (
    <>
      <AdminNav />
      <main id="main-content" className="admin-main">
        <div className="admin-heading">
          <p className="eyebrow">{Translate.admin.rates.eyebrow}</p>
          <h1>{Translate.admin.rates.title}</h1>
          <p>{Translate.admin.rates.text}</p>
        </div>
        <PricingPolicyEditor {...policy} />
        <div className="admin-rate-grid">
          {studios.map((studio) => (
            <RateEditor
              key={studio.id}
              studio={{
                id: studio.id,
                name: studio.name,
                basePriceCents: studio.basePriceCents,
                seasons: studio.seasonalPrices.map((season) => ({
                  startDate: dateOnly(season.startDate),
                  endDate: dateOnly(season.endDate),
                  priceCents: season.priceCents,
                  label: season.label,
                })),
              }}
            />
          ))}
        </div>
      </main>
    </>
  );
}
