import { ownerForPage } from "@/features/admin/page-auth";
import { AdminNav } from "@/features/admin/ui/admin-nav";
import { BlocksEditor } from "@/features/admin/ui/blocks-editor";
import { adminService } from "@/features/booking/server";
import { dateOnly } from "@/features/booking/domain/rules";
import { getServerTranslation } from "@/i18n/server";

export default async function AvailabilityPage() {
  const owner = await ownerForPage();
  const { Translate } = await getServerTranslation();
  const service = adminService();
  const [blocks, studios, context] = await Promise.all([
    service.listBlocks(owner),
    service.listAccommodationsForOwner(owner),
    service.getPortalContext(owner),
  ]);
  return (
    <>
      <AdminNav fullControl={context.property.portalPlan === "FULL_CONTROL"} />
      <main id="main-content" className="admin-main">
        <div className="admin-heading">
          <p className="eyebrow">{Translate.admin.availability.eyebrow}</p>
          <h1>{Translate.admin.availability.title}</h1>
          <p>{Translate.admin.availability.text}</p>
        </div>
        <BlocksEditor
          studios={studios.map(({ id, name }) => ({ id, name }))}
          blocks={blocks.map((block) => ({
            id: block.id,
            studio: block.accommodation.name,
            start: dateOnly(block.startDate),
            end: dateOnly(block.endDate),
            reason: block.reason ?? "",
          }))}
        />
      </main>
    </>
  );
}
